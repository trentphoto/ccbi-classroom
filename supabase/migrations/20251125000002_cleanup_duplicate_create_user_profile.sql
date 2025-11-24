-- Clean up ALL duplicate create_user_profile functions
-- Drop all possible versions/signatures of the function
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all functions named create_user_profile regardless of signature
    FOR r IN 
        SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname = 'create_user_profile'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 'public', r.proname, r.args);
    END LOOP;
END $$;

-- Recreate the function with the correct implementation (fixed ambiguous column reference)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_brand_id TEXT,
  user_is_active BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id TEXT;
  brand_exists BOOLEAN;
  new_user JSONB;
BEGIN
  -- Validate that the brand exists (bypasses RLS)
  SELECT EXISTS(SELECT 1 FROM brands WHERE id = user_brand_id AND is_active = true) INTO brand_exists;
  
  IF NOT brand_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Brand with id %s does not exist or is not active', user_brand_id)
    );
  END IF;

  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid()::TEXT;

  -- Insert the user
  INSERT INTO users (id, email, name, role, brand_id, is_active, created_at)
  VALUES (
    new_user_id,
    LOWER(user_email),
    user_name,
    user_role,
    user_brand_id,
    user_is_active,
    CURRENT_TIMESTAMP
  );

  -- Get the inserted user data
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'name', u.name,
    'role', u.role,
    'brand_id', u.brand_id,
    'is_active', u.is_active,
    'deactivated_at', u.deactivated_at,
    'created_at', u.created_at
  ) INTO new_user
  FROM users u
  WHERE u.id = new_user_id;

  -- Return success with user data
  RETURN jsonb_build_object(
    'success', true,
    'user', new_user
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A user with this email already exists'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon;
