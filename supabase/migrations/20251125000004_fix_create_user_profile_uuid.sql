-- Fix UUID type issue in create_user_profile function
-- Drop the existing function first to change the implementation
DROP FUNCTION IF EXISTS create_user_profile(TEXT, TEXT, TEXT, TEXT, BOOLEAN) CASCADE;

-- Recreate with correct UUID type for user id
CREATE FUNCTION create_user_profile(
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
  new_user_id UUID;
  brand_exists BOOLEAN;
  new_user JSONB;
BEGIN
  -- Validate that the brand exists (bypasses RLS)
  SELECT EXISTS(SELECT 1 FROM brands b WHERE b.id = user_brand_id AND b.is_active = true) INTO brand_exists;
  
  IF NOT brand_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Brand with id %s does not exist or is not active', user_brand_id)
    );
  END IF;

  -- Generate a new UUID for the user (UUID type, not TEXT)
  new_user_id := gen_random_uuid();

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
    'id', u.id::TEXT,
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


