-- Migration to remove brands table and brand_id columns
-- This migration removes all brand-related database structures

-- Step 1: Drop RPC functions that reference brand_id or brands table
DROP FUNCTION IF EXISTS get_brands() CASCADE;
DROP FUNCTION IF EXISTS get_brand_by_id(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_by_id(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_class(TEXT, TEXT, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS create_user_profile(TEXT, TEXT, TEXT, TEXT) CASCADE;

-- Step 2: Drop foreign key constraints
DO $$ 
BEGIN
  -- Drop foreign key constraint on users.brand_id if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_brand_id_fkey'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_brand_id_fkey;
  END IF;

  -- Drop foreign key constraint on classes.brand_id if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'classes_brand_id_fkey'
  ) THEN
    ALTER TABLE classes DROP CONSTRAINT classes_brand_id_fkey;
  END IF;
END $$;

-- Step 3: Drop indexes on brand_id columns
DROP INDEX IF EXISTS idx_users_brand_id;
DROP INDEX IF EXISTS idx_classes_brand_id;

-- Step 4: Remove brand_id column from users table
ALTER TABLE users DROP COLUMN IF EXISTS brand_id;

-- Step 5: Remove brand_id column from classes table
ALTER TABLE classes DROP COLUMN IF EXISTS brand_id;

-- Step 6: Drop the brands table
DROP TABLE IF EXISTS brands CASCADE;

-- Step 7: Recreate RPC functions without brand_id references

-- Recreate get_user_by_id without brand_id parameter
CREATE OR REPLACE FUNCTION get_user_by_id(user_id TEXT)
RETURNS TABLE (
  id TEXT,
  email TEXT,
  name TEXT,
  role TEXT,
  is_active BOOLEAN,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id::TEXT,
    u.email,
    u.name,
    u.role,
    u.is_active,
    u.deactivated_at,
    u.created_at
  FROM users u
  WHERE u.id::TEXT = user_id;
END;
$$;

-- Recreate create_class without brand_id
CREATE OR REPLACE FUNCTION create_class(
  class_name TEXT,
  class_description TEXT,
  class_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_class_id TEXT;
BEGIN
  -- Generate a new UUID for the class
  new_class_id := gen_random_uuid()::TEXT;

  -- Insert the class
  INSERT INTO classes (id, name, description, is_active, created_at, updated_at)
  VALUES (
    new_class_id,
    class_name,
    class_description,
    class_is_active,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  -- Return the created class
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.is_active,
    c.created_at,
    c.updated_at
  FROM classes c
  WHERE c.id = new_class_id;
END;
$$;

-- Recreate create_user_profile without brand_id
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
  new_user_id TEXT;
  new_user RECORD;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid()::TEXT;

  -- Insert the user
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

  -- Return success with user data
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_by_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_id(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_class(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_class(TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT) TO anon;

