-- Remove meeting_title column and add notes column to class_meetings table

-- Add notes column (nullable text)
ALTER TABLE class_meetings 
ADD COLUMN IF NOT EXISTS notes text;

-- Remove meeting_title column
ALTER TABLE class_meetings 
DROP COLUMN IF EXISTS meeting_title;

