Copilot Instructions for Classroom Clone MVP
Project Overview
This is a minimal viable product (MVP) for a theology school classroom management system, designed as a simplified Google Classroom clone. The school offers a small number of classes at a time (typically 2-5), and each student is enrolled in only one class at a time. The app is built for a single theology school, focusing on basic functionality: managing classes, lessons, and student submissions, with a lean feature set to keep development quick and integration-ready with Supabase.

Key Context

School Details: A theology school with a focus on religious education (e.g., biblical studies, theology courses). The audience includes students training for ministry and a few shared admin users (teachers) who manage the system.
User Roles: Only two roles exist:
Admin: Shared by a few teachers to manage classes, users, lessons, and grading. No bulk import; manual creation only.
Student: Each student is in one class, viewing lessons, watching instructional videos, and submitting JPG or PDF homework.


Class Constraint: Students are limited to one active class at a time. Enrolling in a new class removes them from their previous class.
MVP Focus: The app prioritizes simplicity:
No email notifications, gradebook export, or discussion features.
Lessons include video links (e.g., YouTube) and assignment files, with submissions as JPG/PDF.
Basic grading with score (0-100) and feedback.
Students should not be able to see who else is in the class, or how many, or other students' details. 


Tech Stack: React with TypeScript, Tailwind CSS for styling, React Router for navigation, and Supabase for backend (auth, Postgres database, storage) once integrated. Currently, mock data is used in the frontend.
Mock Data: Use the predefined TypeScript types and mock data from src/types.ts for development (e.g., mockUsers, mockClasses, mockLessons, mockSubmissions).

Coding Guidelines

Language: Use TypeScript for all components and logic.
Framework: Build with React, leveraging functional components and hooks (e.g., useState, useEffect).
Styling: Apply Tailwind CSS classes for responsive design. Ensure mobile-friendly layouts (e.g., container, grid, flex).
Navigation: Use React Router for routing (e.g., /dashboard, /classes/new, /lessons/:id/submit).
Authentication: Simulate with a mock AuthContext (login with email/password, hardcode 'password' for now). Supabase Auth will replace this later.
Data Management: Manipulate mock data arrays (e.g., mockClasses, mockSubmissions) in memory for now. Code should be structured to migrate to Supabase queries (e.g., supabase.from('table').select()).
File Handling: Mock file uploads (JPG/PDF) by storing filenames in file_path. Supabase Storage will handle actual uploads later.
Security: Enforce role-based access (e.g., only admins access admin routes). Use ProtectedRoute to check useAuth().user?.role.
Responsive Design: Ensure all pages work on mobile devices (test with browser dev tools).

Specific Requirements

Homepage/Login: Starts with a login form (/login) using AuthContext. No complex UI—simple form with email and password.
Admin Dashboard (/dashboard): Lists classes, users, lessons, and submissions with edit links. Only for admins.
Student Dashboard (/dashboard): Shows one class and lessons for the logged-in student. Only for students.
Class Management: Forms to create/edit classes (/classes/new, /classes/:id/edit) with name, description, and active status.
User Management: Forms to create/edit users (/users/new, /users/:id/edit) with name, email, and role (admin/student).
Enrollment: Form to enroll students in a class (/enroll), ensuring one class per student.
Lesson Management: Forms to create/edit lessons (/lessons/new, /lessons/:id/edit) with title, description, due date, video URL, and assignment file.
Lesson View/Submit: Page to view lesson details and submit JPG/PDF (/lessons/:id, /lessons/:id/submit) for students.
Grading: Form to grade submissions (/submissions/:id/grade) with score and feedback, only for admins.

Supabase Integration Plan

Replace mock data with Supabase client (supabase-js).
Use Supabase Auth for login/logout.
Map mockUsers to users table, mockClasses to classes, etc.
Store files in Supabase Storage (e.g., /submissions/filename.jpg).
Add Row-Level Security (RLS) policies (e.g., students see only their class).
Current code should be adaptable with minimal refactoring.

Example Code Style
// Component example
const MyComponent = () => {
  const { user } = useAuth();
  if (!user) return <div>Unauthorized</div>;
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl">Content</h2>
    </div>
  );
};

Notes

Avoid adding features beyond the MVP (e.g., no quizzes, notifications).
Use existing src/types.ts for type safety.

