-- Create RPC functions to access brands table (bypasses RLS)
-- These functions run with SECURITY DEFINER to allow access regardless of RLS policies

-- Function to get all brands
CREATE OR REPLACE FUNCTION get_brands()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  full_name TEXT,
  description TEXT,
  slug TEXT,
  logo_url TEXT,
  logo_white_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  support_email TEXT,
  admin_email TEXT,
  website TEXT,
  domain TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.full_name,
    b.description,
    b.slug,
    b.logo_url,
    b.logo_white_url,
    b.primary_color,
    b.secondary_color,
    b.accent_color,
    b.support_email,
    b.admin_email,
    b.website,
    b.domain,
    b.is_active,
    b.created_at,
    b.updated_at
  FROM brands b
  WHERE b.is_active = true
  ORDER BY b.name;
END;
$$;

-- Function to get a brand by ID
CREATE OR REPLACE FUNCTION get_brand_by_id(brand_id TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  full_name TEXT,
  description TEXT,
  slug TEXT,
  logo_url TEXT,
  logo_white_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  support_email TEXT,
  admin_email TEXT,
  website TEXT,
  domain TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.full_name,
    b.description,
    b.slug,
    b.logo_url,
    b.logo_white_url,
    b.primary_color,
    b.secondary_color,
    b.accent_color,
    b.support_email,
    b.admin_email,
    b.website,
    b.domain,
    b.is_active,
    b.created_at,
    b.updated_at
  FROM brands b
  WHERE b.id = brand_id;
END;
$$;

-- Function to create a class with brand validation (bypasses RLS)
CREATE OR REPLACE FUNCTION create_class(
  class_name TEXT,
  class_description TEXT,
  class_brand_id TEXT,
  class_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  brand_id TEXT,
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
  brand_exists BOOLEAN;
BEGIN
  -- Validate that the brand exists (bypasses RLS)
  SELECT EXISTS(SELECT 1 FROM brands WHERE id = class_brand_id AND is_active = true) INTO brand_exists;
  
  IF NOT brand_exists THEN
    RAISE EXCEPTION 'Brand with id % does not exist or is not active', class_brand_id;
  END IF;

  -- Generate a new UUID for the class
  new_class_id := gen_random_uuid()::TEXT;

  -- Insert the class
  INSERT INTO classes (id, name, description, brand_id, is_active, created_at, updated_at)
  VALUES (
    new_class_id,
    class_name,
    class_description,
    class_brand_id,
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
    c.brand_id,
    c.is_active,
    c.created_at,
    c.updated_at
  FROM classes c
  WHERE c.id = new_class_id;
END;
$$;

-- Note: create_user_profile function is defined in migration 20251125000001_fix_create_user_profile_ambiguous.sql
-- to avoid duplication and ensure the fixed version is used

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_brands() TO authenticated;
GRANT EXECUTE ON FUNCTION get_brand_by_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_brands() TO anon;
GRANT EXECUTE ON FUNCTION get_brand_by_id(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_class(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_class(TEXT, TEXT, TEXT, BOOLEAN) TO anon;
-- create_user_profile grants are in migration 20251125000001_fix_create_user_profile_ambiguous.sql

