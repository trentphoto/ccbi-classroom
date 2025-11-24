-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  logo_white_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  support_email TEXT,
  admin_email TEXT,
  website TEXT,
  domain TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert existing brands
INSERT INTO brands (id, name, full_name, description, slug, logo_url, logo_white_url, primary_color, secondary_color, accent_color, support_email, admin_email, website, domain) VALUES
  ('ccbi', 'CCBI Classroom', 'Capitol City Bible Institute', 'Equipping Believers for Every Good Work', 'ccbi', '/logos/ccbi.svg', '/logos/ccbi-white.svg', '#072c68', '#086623', '#d2ac47', 'support@ccbi.org', 'admin@ccbi.org', 'https://ccbi.org', 'ccbi.yourdomain.com'),
  ('zts', 'ZTS Classroom', 'Zion Theological Seminary', 'Equipping Students for Success', 'zts', '/logos/zts.png', '/logos/zts-white.png', '#1e40af', '#059669', '#f59e0b', 'support@zts.edu', 'admin@zts.edu', 'https://zts.edu', 'zts.yourdomain.com'),
  ('nbi', 'NBI Classroom', 'National Bible Institute', 'The Nationally Accredited Bible Institute', 'nbi', '/logos/nbi.svg', '/logos/nbi-white.svg', '#000000', '#666666', '#999999', 'admin@nationalbibleinst.org', 'admin@nationalbibleinst.org', 'https://nationalbibleinst.org', 'nationalbibleinst.org')
ON CONFLICT (id) DO NOTHING;

-- Update users table to reference brands table (if not already a foreign key)

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  -- Check if foreign key constraint exists on users.brand_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_brand_id_fkey'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_brand_id_fkey 
    FOREIGN KEY (brand_id) REFERENCES brands(id);
  END IF;

  -- Check if foreign key constraint exists on classes.brand_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'classes_brand_id_fkey'
  ) THEN
    ALTER TABLE classes 
    ADD CONSTRAINT classes_brand_id_fkey 
    FOREIGN KEY (brand_id) REFERENCES brands(id);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_brand_id ON users(brand_id);
CREATE INDEX IF NOT EXISTS idx_classes_brand_id ON classes(brand_id);

