// Define enum for user roles
export enum UserRole {
    ADMIN = 'admin',
    STUDENT = 'student',
  }
  
  // Type for User entity
  export interface User {
    id: string; // Use string for UUIDs, common in Supabase/Postgres
    email: string;
    role: UserRole;
    name: string;
    // Optional: Add created_at if needed for timestamps
    created_at?: Date;
  }
  
  // Type for Class entity
  export interface Class {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    // Optional: Add created_at or updated_at
    created_at?: Date;
    updated_at?: Date;
  }
  
  // Type for Class Enrollment entity
  // This links a student to a single class
  export interface ClassEnrollment {
    user_id: string;
    class_id: string;
    // Optional: enrolled_at timestamp
    enrolled_at?: Date;
  }
  
  // Type for Lesson entity
export interface Lesson {
  id: string;
  class_id: string;
  title: string;
  description: string;
  due_date: Date | null; // Allow null if no due date
  video_url: string | null; // Video link for the lesson
  file_path: string | null; // Assignment file attachment in storage
  // Optional: created_at
  created_at?: Date;
}
  
  // Type for Submission entity
export interface Submission {
  id: string;
  lesson_id: string;
  student_id: string;
  file_path: string; // Path to uploaded JPG/PDF in storage
  submitted_at: Date;
  grade: number | null; // Numeric score, null if ungraded
  feedback: string | null; // Optional text feedback
  // Optional: updated_at for grading changes
  updated_at?: Date;
}

// Type for Message entity
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: Date;
  is_read: boolean;
  // Optional: updated_at
  updated_at?: Date;
}

// Type for Conversation entity
export interface Conversation {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id: string;
  last_message_at: Date;
  unread_count: number; // Count of unread messages for the teacher
  // Optional: created_at
  created_at?: Date;
}

// Type for Conversation with messages
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  student: User;
  teacher: User;
  class: Class;
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
    { id: 'user1', email: 'admin@example.com', role: UserRole.ADMIN, name: 'Admin Teacher' },
    { id: 'user2', email: 'student1@example.com', role: UserRole.STUDENT, name: 'Student One' },
    // Add more as needed
  ];
  
  export const mockClasses: Class[] = [
    { id: 'class1', name: 'Math 101', description: 'Basic Mathematics', is_active: true },
    // Add more
  ];
  
  export const mockEnrollments: ClassEnrollment[] = [
    { user_id: 'user2', class_id: 'class1' },
    // Add more
  ];
  
  export const mockLessons: Lesson[] = [
  { id: 'lesson1', class_id: 'class1', title: 'Introductory Lesson 1', description: 'Solve problems 1-10', due_date: new Date('2025-09-01'), video_url: 'https://youtube.com/example', file_path: null },
  // Add more
];

export const mockSubmissions: Submission[] = [
  { id: 'sub1', lesson_id: 'lesson1', student_id: 'user2', file_path: '/path/to/submission.jpg', submitted_at: new Date(), grade: null, feedback: null },
  // Add more
];


  