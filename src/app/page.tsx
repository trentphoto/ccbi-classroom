"use client";

import { useState } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import StudentDashboard from '@/components/StudentDashboard';

export default function Home() {
  // Mock authentication state - in real app this would come from Supabase auth
  const [currentUser, setCurrentUser] = useState('admin@example.com'); // Default to admin

  // Simple role-based routing
  const isStudent = currentUser === 'student1@example.com';
  const isAdmin = currentUser === 'admin@example.com';

  // Mock login function for testing
  const handleLogin = (email: string) => {
    setCurrentUser(email);
  };

  // Toggle between admin and student
  const toggleRole = () => {
    if (isAdmin) {
      setCurrentUser('student1@example.com');
    } else {
      setCurrentUser('admin@example.com');
    }
  };

  // Show login options if no user is set
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Classroom Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Choose a test account to continue
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('admin@example.com')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Login as Admin
            </button>
            <button
              onClick={() => handleLogin('student1@example.com')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Login as Student (student1@example.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show role switcher for testing
  const RoleSwitcher = () => (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="text-sm font-medium text-gray-900 mb-2">Current User: {currentUser}</p>
        <button
          onClick={toggleRole}
          className={`w-full px-3 py-2 text-sm rounded font-medium transition-colors ${
            isAdmin 
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          Switch to {isAdmin ? 'Student' : 'Admin'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <RoleSwitcher />
      {isStudent ? <StudentDashboard /> : <AdminDashboard />}
    </>
  );
}
