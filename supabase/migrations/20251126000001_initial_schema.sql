-- Initial clean schema for new database (no brand_id)
-- This replaces all previous migrations

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'student')),
  is_active boolean DEFAULT true,
  deactivated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: classes
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: class_enrollments
-- ============================================
CREATE TABLE IF NOT EXISTS class_enrollments (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, class_id)
);

-- ============================================
-- TABLE: lessons
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  due_date date,
  video_url text,
  file_path text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: submissions
-- ============================================
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  submitted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  grade numeric(5,2),
  feedback text,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: class_meetings
-- ============================================
CREATE TABLE IF NOT EXISTS class_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  meeting_date date NOT NULL,
  meeting_title text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: attendance_records
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES class_meetings(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  notes text,
  verified_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_user_id ON class_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_submissions_lesson_id ON submissions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_class_meetings_class_id ON class_meetings(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_meeting_id ON attendance_records(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function to get user by ID
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

-- Function to create class
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
  new_class_id := gen_random_uuid()::TEXT;

  INSERT INTO classes (id, name, description, is_active, created_at, updated_at)
  VALUES (
    new_class_id,
    class_name,
    class_description,
    class_is_active,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

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

-- Function to create user profile
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
  new_user_id := gen_random_uuid()::TEXT;

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

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_user_by_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_id(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_class(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_class(TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT) TO anon;

