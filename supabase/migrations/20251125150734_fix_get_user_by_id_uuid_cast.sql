-- Fix get_user_by_id function to properly handle UUID type
-- Cast UUID to TEXT for comparison and return

CREATE OR REPLACE FUNCTION get_user_by_id(user_id TEXT, user_brand_id TEXT)
RETURNS TABLE (
  id TEXT,
  email TEXT,
  name TEXT,
  role TEXT,
  brand_id TEXT,
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
    u.brand_id,
    u.is_active,
    u.deactivated_at,
    u.created_at
  FROM users u
  WHERE u.id::TEXT = user_id
    AND u.brand_id = user_brand_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_by_id(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_id(TEXT, TEXT) TO anon;


