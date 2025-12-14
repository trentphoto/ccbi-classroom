// Define enum for user roles
export enum UserRole {
    ADMIN = 'admin',
    STUDENT = 'student',
  }

// Define brand types (kept for brand.ts compatibility, but not used in database)
export type BrandId = 'ccbi' | 'zts' | 'nbi';

// Define enum for brand types (for backward compatibility)
export enum BrandType {
    CCBI = 'ccbi',
    ZTS = 'zts',
    NBI = 'nbi',
  }
  
  // Type for User entity - matches Supabase users table
  export interface User {
    id: string; // UUID from auth.users
    email: string;
    role: UserRole;
    name: string;
    is_active: boolean; // Whether the user is active or inactive
    deactivated_at: Date | null; // Timestamp when user was permanently deactivated
    created_at: Date; // Required timestamp
  }
  
  // Type for Class entity - matches Supabase classes table
  export interface Class {
    id: string; // UUID
    name: string;
    description: string;
    is_active: boolean;
    created_at: Date; // Required timestamp
    updated_at: Date; // Required timestamp
  }
  
  // Type for Class Enrollment entity - matches Supabase class_enrollments table
  export interface ClassEnrollment {
    user_id: string; // UUID
    class_id: string; // UUID
    enrolled_at: Date; // Required timestamp
  }
  
  // Type for Lesson entity - matches Supabase lessons table
export interface Lesson {
  id: string; // UUID
  class_id: string; // UUID
  title: string;
  description: string;
  due_date: Date | null; // Allow null if no due date
  video_url: string | null; // Video link for the lesson
  file_path: string | null; // Assignment file attachment in storage
  created_at: Date; // Required timestamp
}
  
  // Type for Submission entity - matches Supabase submissions table
export interface Submission {
  id: string; // UUID
  lesson_id: string; // UUID
  student_id: string; // UUID
  file_path: string; // Path to uploaded JPG/PDF in storage
  submitted_at: Date; // Required timestamp
  grade: number | null; // Numeric score, null if ungraded (0-100)
  feedback: string | null; // Optional text feedback
  updated_at: Date; // Required timestamp
}

// Type for Message entity - for future messaging feature
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: Date;
  is_read: boolean;
  updated_at?: Date;
}

// Type for Conversation entity - for future messaging feature
export interface Conversation {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id: string;
  last_message_at: Date;
  unread_count: number; // Count of unread messages for the teacher
  created_at?: Date;
}

// Type for Conversation with messages
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  student: User;
  teacher: User;
  class: Class;
}

// Type for Class Meeting entity - matches Supabase class_meetings table
export interface ClassMeeting {
  id: string; // UUID
  class_id: string; // UUID
  meeting_date: Date;
  notes: string | null; // Optional notes field
  created_at: Date; // Required timestamp
}

// Type for Attendance Record entity - matches Supabase attendance_records table
export interface AttendanceRecord {
  id: string; // UUID
  meeting_id: string; // UUID
  student_id: string; // UUID
  status: 'present' | 'absent';
  notes: string | null;
  verified_by: string | null; // UUID of admin who verified
  created_at: Date; // Required timestamp
}

// Type for Event Registration entity - matches Supabase event_registrations table
export interface EventRegistration {
  id: string; // UUID
  email: string;
  name: string;
  phone: string | null;
  signed_up_for_class: boolean;
  source: string | null;
  metadata: Record<string, unknown> | null; // JSONB for flexible fields
  created_at: Date;
  updated_at: Date;
}

// Type for Email Campaign entity - matches Supabase email_campaigns table
export interface EmailCampaign {
  id: string; // UUID
  name: string;
  type: 'pre-event' | 'follow-up';
  subject: string;
  html_content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduled_at: Date | null;
  sent_at: Date | null;
  created_by: string | null; // UUID of user who created
  created_at: Date;
  updated_at: Date;
}

// Type for Email Send entity - matches Supabase email_sends table
export interface EmailSend {
  id: string; // UUID
  campaign_id: string; // UUID
  recipient_id: string; // UUID
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  provider_id: string | null; // Message ID from email provider
  error_message: string | null;
  sent_at: Date | null;
  opened_at: Date | null;
  clicked_at: Date | null;
  created_at: Date;
}
  
  // Optional: Composite types for frontend views
// E.g., a StudentDashboard type that combines data
export interface StudentDashboard {
  user: User;
  enrolledClass: Class | null; // Their single class
  lessons: Lesson[]; // List of lessons in their class
  submissions: Submission[]; // Their submissions, matched to lessons
}

// E.g., AdminDashboard type
export interface AdminDashboard {
  classes: Class[];
  users: User[]; // All users (admins and students)
  enrollments: ClassEnrollment[]; // All enrollments
  lessons: Lesson[]; // All lessons across classes
  submissions: Submission[]; // All submissions
}
  
  // For API responses, if simulating backend calls
  // E.g., a generic API response wrapper
  export interface ApiResponse<T> {
    data: T;
    error?: string; // For error handling
  }
  
  // Sample placeholder data for MVP frontend
  // You can use this to mock the data in your React components
  
  export const mockUsers: User[] = [
    { id: 'user1', email: 'admin@example.com', role: UserRole.ADMIN, name: 'Admin Teacher', is_active: true, deactivated_at: null, created_at: new Date() },
    { id: 'user2', email: 'student1@example.com', role: UserRole.STUDENT, name: 'Student One', is_active: true, deactivated_at: null, created_at: new Date() },
    // Add more as needed
  ];
  
  export const mockClasses: Class[] = [
    { id: 'class1', name: 'Math 101', description: 'Basic Mathematics', is_active: true, created_at: new Date(), updated_at: new Date() },
    // Add more
  ];
  
  export const mockEnrollments: ClassEnrollment[] = [
    { user_id: 'user2', class_id: 'class1', enrolled_at: new Date() },
    // Add more
  ];
  
  export const mockLessons: Lesson[] = [
  { id: 'lesson1', class_id: 'class1', title: 'Introductory Lesson 1', description: 'Solve problems 1-10', due_date: new Date('2025-09-01'), video_url: 'https://youtube.com/example', file_path: null, created_at: new Date() },
  // Add more
];

export const mockSubmissions: Submission[] = [
  { id: 'sub1', lesson_id: 'lesson1', student_id: 'user2', file_path: '/path/to/submission.jpg', submitted_at: new Date(), grade: null, feedback: null, updated_at: new Date() },
  // Add more
];


  