-- Fix ambiguous column reference in create_class function
-- Drop the existing function first to change return type
DROP FUNCTION IF EXISTS create_class(TEXT, TEXT, TEXT, BOOLEAN) CASCADE;

-- Recreate with correct UUID return type
CREATE FUNCTION create_class(
  class_name TEXT,
  class_description TEXT,
  class_brand_id TEXT,
  class_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
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
  new_class_id UUID;
  brand_exists BOOLEAN;
BEGIN
  -- Validate that the brand exists (bypasses RLS) - use explicit table alias
  SELECT EXISTS(SELECT 1 FROM brands b WHERE b.id = class_brand_id AND b.is_active = true) INTO brand_exists;
  
  IF NOT brand_exists THEN
    RAISE EXCEPTION 'Brand with id % does not exist or is not active', class_brand_id;
  END IF;

  -- Generate a new UUID for the class (UUID type, not TEXT)
  new_class_id := gen_random_uuid();

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

  -- Return the created class (using explicit table alias to avoid ambiguity)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_class(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_class(TEXT, TEXT, TEXT, BOOLEAN) TO anon;

