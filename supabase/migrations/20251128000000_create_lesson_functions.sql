-- Create database functions for lesson operations (bypasses RLS)
-- These functions use SECURITY DEFINER to allow operations even when RLS is enabled

-- Function to create a lesson
CREATE OR REPLACE FUNCTION create_lesson(
  lesson_class_id UUID,
  lesson_title TEXT,
  lesson_description TEXT,
  lesson_due_date DATE DEFAULT NULL,
  lesson_video_url TEXT DEFAULT NULL,
  lesson_file_path TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  class_id UUID,
  title TEXT,
  description TEXT,
  due_date DATE,
  video_url TEXT,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_lesson_id UUID;
BEGIN
  -- Generate a new UUID for the lesson
  new_lesson_id := gen_random_uuid();

  -- Insert the lesson
  INSERT INTO lessons (id, class_id, title, description, due_date, video_url, file_path, created_at)
  VALUES (
    new_lesson_id,
    lesson_class_id,
    lesson_title,
    lesson_description,
    lesson_due_date,
    lesson_video_url,
    lesson_file_path,
    CURRENT_TIMESTAMP
  );

  -- Return the created lesson
  RETURN QUERY
  SELECT 
    l.id,
    l.class_id,
    l.title,
    l.description,
    l.due_date,
    l.video_url,
    l.file_path,
    l.created_at
  FROM lessons l
  WHERE l.id = new_lesson_id;
END;
$$;

-- Function to update a lesson
CREATE OR REPLACE FUNCTION update_lesson(
  lesson_id UUID,
  lesson_class_id UUID DEFAULT NULL,
  lesson_title TEXT DEFAULT NULL,
  lesson_description TEXT DEFAULT NULL,
  lesson_due_date DATE DEFAULT NULL,
  lesson_video_url TEXT DEFAULT NULL,
  lesson_file_path TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  class_id UUID,
  title TEXT,
  description TEXT,
  due_date DATE,
  video_url TEXT,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_lesson_id UUID;
BEGIN
  updated_lesson_id := lesson_id;

  -- Update only the provided fields
  UPDATE lessons
  SET 
    class_id = COALESCE(lesson_class_id, lessons.class_id),
    title = COALESCE(lesson_title, lessons.title),
    description = COALESCE(lesson_description, lessons.description),
    due_date = COALESCE(lesson_due_date, lessons.due_date),
    video_url = COALESCE(lesson_video_url, lessons.video_url),
    file_path = COALESCE(lesson_file_path, lessons.file_path)
  WHERE id = lesson_id;

  -- Return the updated lesson
  RETURN QUERY
  SELECT 
    l.id,
    l.class_id,
    l.title,
    l.description,
    l.due_date,
    l.video_url,
    l.file_path,
    l.created_at
  FROM lessons l
  WHERE l.id = updated_lesson_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_lesson(UUID, TEXT, TEXT, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_lesson(UUID, TEXT, TEXT, DATE, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_lesson(UUID, UUID, TEXT, TEXT, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_lesson(UUID, UUID, TEXT, TEXT, DATE, TEXT, TEXT) TO anon;


