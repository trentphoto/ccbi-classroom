# Attendance Feature

## Overview
Automated attendance tracking using Zoom participant CSV files. Admins can upload participant lists from Zoom meetings and automatically match them with enrolled students.

## MVP Features
- **CSV Upload**: Upload Zoom participants CSV file
- **Email Matching**: Match participants by email address only
- **Manual Review**: Display unmatched participants for manual assignment
- **Attendance Recording**: Save verified attendance records

## Database Schema
```sql
-- Class meetings (when classes actually meet)
CREATE TABLE class_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id),
  meeting_date date NOT NULL,
  meeting_title varchar(255),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Individual attendance records
CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES class_meetings(id),
  student_id uuid REFERENCES users(id),
  status varchar(20) NOT NULL, -- 'present', 'absent', 'late', 'excused'
  notes text,
  verified_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

## User Flow
1. Admin creates a class meeting
2. Upload Zoom participants CSV file
3. System matches participants by email
4. Review unmatched participants
5. Manually assign unmatched participants to students
6. Save attendance records

## Future Enhancements
- Fuzzy name matching for better participant identification
- Historical matching memory
- Bulk operations and reporting
- Time-based attendance (late/early departures)

## Technical Stack
- **Frontend**: Next.js + TypeScript
- **Backend**: Supabase
- **CSV Parsing**: Papa Parse library
- **File Upload**: Existing Supabase Storage integration
