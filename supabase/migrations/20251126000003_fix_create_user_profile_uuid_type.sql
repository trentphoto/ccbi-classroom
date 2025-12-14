-- Fix UUID type mismatch in create_user_profile function
-- The function was declaring new_user_id as TEXT but users.id is UUID

CREATE OR REPLACE FUNCTION create_user_profile(
  user_email TEXT,
  user_name TEXT,
  user_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  new_user RECORD;
BEGIN
  -- Generate UUID (not TEXT)
  new_user_id := gen_random_uuid();

  INSERT INTO users (id, email, name, role, is_active, created_at)
  VALUES (
    new_user_id,
    LOWER(TRIM(user_email)),
    TRIM(user_name),
    user_role,
    true,
    CURRENT_TIMESTAMP
  )
  RETURNING * INTO new_user;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', new_user.id::TEXT,
      'email', new_user.email,
      'name', new_user.name,
      'role', new_user.role,
      'is_active', new_user.is_active,
      'created_at', new_user.created_at
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions (already granted, but ensuring they exist)
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT) TO anon;



