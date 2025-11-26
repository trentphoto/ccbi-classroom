-- Fix user ID mapping between auth.users and public.users
-- Run this in your Supabase SQL Editor

-- Step 1: Find the auth user ID for your admin email
-- Replace 'trentphoto+admin@gmail.com' with the actual email
SELECT id, email FROM auth.users WHERE email = 'trentphoto+admin@gmail.com';

-- Step 2: Find the public.users record with the same email
SELECT id, email, name, role FROM public.users WHERE email = 'trentphoto+admin@gmail.com';

-- Step 3: Update the public.users record to use the auth.users ID
-- Replace the UUIDs below with the actual IDs from steps 1 and 2
-- Format: UPDATE public.users SET id = '<auth_user_id>' WHERE id = '<current_public_user_id>';

-- Example (replace with your actual IDs):
-- UPDATE public.users 
-- SET id = '00000000-0000-0000-0000-000000000000'::uuid  -- auth.users.id
-- WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;  -- current public.users.id

-- Step 4: If there are foreign key constraints (enrollments, submissions, etc.), 
-- you may need to update those references too:
-- UPDATE class_enrollments SET user_id = '<new_id>' WHERE user_id = '<old_id>';
-- UPDATE submissions SET student_id = '<new_id>' WHERE student_id = '<old_id>';
-- UPDATE attendance_records SET student_id = '<new_id>' WHERE student_id = '<old_id>';
-- UPDATE attendance_records SET verified_by = '<new_id>' WHERE verified_by = '<old_id>';

-- ALTERNATIVE: Automated script to sync all users by email
-- This will update all public.users records to match their auth.users IDs
DO $$
DECLARE
  auth_user_record RECORD;
  public_user_record RECORD;
BEGIN
  FOR auth_user_record IN 
    SELECT id, email FROM auth.users
  LOOP
    -- Find matching public.users record by email
    SELECT id INTO public_user_record
    FROM public.users
    WHERE email = auth_user_record.email
    LIMIT 1;
    
    -- If found and IDs don't match, update it
    IF public_user_record.id IS NOT NULL AND public_user_record.id != auth_user_record.id THEN
      -- Update foreign key references first
      UPDATE class_enrollments 
      SET user_id = auth_user_record.id 
      WHERE user_id = public_user_record.id;
      
      UPDATE submissions 
      SET student_id = auth_user_record.id 
      WHERE student_id = public_user_record.id;
      
      UPDATE attendance_records 
      SET student_id = auth_user_record.id 
      WHERE student_id = public_user_record.id;
      
      UPDATE attendance_records 
      SET verified_by = auth_user_record.id 
      WHERE verified_by = public_user_record.id;
      
      -- Finally update the users table
      UPDATE public.users 
      SET id = auth_user_record.id 
      WHERE id = public_user_record.id;
      
      RAISE NOTICE 'Updated user % from % to %', auth_user_record.email, public_user_record.id, auth_user_record.id;
    END IF;
  END LOOP;
END $$;

