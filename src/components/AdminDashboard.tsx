"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { User, UserRole, Class, Lesson, Submission, ClassEnrollment } from '@/types/db';
import Image from 'next/image';
import { db } from '@/lib/supabase/database';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MoreVertical, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { toast } from 'sonner';
import ChatInterface from './ChatInterface';
import UserFormDialog from './UserFormDialog';
import ClassFormDialog from './ClassFormDialog';

type TabType = 'overview' | 'students' | 'lessons' | 'submissions' | 'messages';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // State for data
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // State for UI
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classDialogMode, setClassDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all data in parallel
      const [classesData, usersData, enrollmentsData, lessonsData, submissionsData] = await Promise.all([
        db.getClasses(),
        db.getUsers(),
        db.getEnrollments(),
        db.getLessons(),
        db.getSubmissions()
      ]);



      setClasses(classesData);
      setUsers(usersData);
      setEnrollments(enrollmentsData);
      setLessons(lessonsData);
      setSubmissions(submissionsData);

      // Set first class as selected if available
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isClassDropdownOpen) {
        setIsClassDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClassDropdownOpen]);

  // Get current class data
  const selectedClass = classes.find(cls => cls.id === selectedClassId);
  
  // Get students enrolled in the selected class
  const classStudents = useMemo(() => {
    const filtered = users.filter(user =>
      user.role === UserRole.STUDENT &&
      enrollments.some(enrollment =>
        enrollment.user_id === user.id && enrollment.class_id === selectedClassId
      )
    );
    
    return filtered;
  }, [users, enrollments, selectedClassId]);
  
  // Get lessons for the selected class
  const classLessons = useMemo(() => 
    lessons.filter(lesson => lesson.class_id === selectedClassId),
    [lessons, selectedClassId]
  );
  
  // Get submissions for the selected class
  const classSubmissions = useMemo(() => 
    submissions.filter(submission => 
      classLessons.some(lesson => lesson.id === submission.lesson_id)
    ),
    [submissions, classLessons]
  );

  // Handle user form submission
  const handleUserSubmit = async (userData: Omit<User, 'id' | 'created_at'>) => {
    if (isSubmittingUser) return; // Prevent multiple submissions

    try {
      setIsSubmittingUser(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
      });

      if (dialogMode === 'create') {
        const newUser = await Promise.race([
          db.createUser(userData),
          timeoutPromise
        ]) as User;
        
        setUsers(prev => [...prev, newUser]);

        // If it's a student, create enrollment
        if (userData.role === UserRole.STUDENT && selectedClassId) {
          await Promise.race([
            db.createEnrollment({
              user_id: newUser.id,
              class_id: selectedClassId
            }),
            timeoutPromise
          ]);
          // Reload enrollments to get the new one
          const updatedEnrollments = await Promise.race([
            db.getEnrollments(),
            timeoutPromise
          ]) as ClassEnrollment[];
          setEnrollments(updatedEnrollments);
        }
        toast.success(`${userData.role === UserRole.STUDENT ? 'Student' : 'Admin'} "${newUser.name}" created successfully!`);
      } else if (dialogMode === 'edit' && editingUser) {
        const updatedUser = await Promise.race([
          db.updateUser(editingUser.id, userData),
          timeoutPromise
        ]) as User;
        
        // Force a complete state refresh to ensure UI updates
        setUsers(prev => {
          const newUsers = [...prev.map(user => user.id === updatedUser.id ? updatedUser : user)];
          return newUsers;
        });
        
        // Also update the editingUser state to ensure consistency
        setEditingUser(updatedUser);
        
        toast.success(`${userData.role === UserRole.STUDENT ? 'Student' : 'Admin'} "${updatedUser.name}" updated successfully!`);
      }

      // Close dialog and reset state
      setUserDialogOpen(false);
      setEditingUser(null);
      setDialogMode('create');
    } catch (err) {
      console.error('Error saving user:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out after 8 seconds. Please check your connection and try again.';
        } else if (err.message.includes('email address is already in use')) {
          errorMessage = 'A user with this email already exists. Please use a different email.';
        } else if (err.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (err.message.includes('Password should be at least')) {
          errorMessage = 'Password requirements not met. Please try a different approach.';
        } else if (err.message.includes('Failed to update user')) {
          errorMessage = 'Failed to update user. Please try again.';
        } else if (err.message.includes('Failed to create user')) {
          errorMessage = 'Failed to create user. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Handle user edit
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogMode('edit');
    setUserDialogOpen(true);
  };

  // Handle user delete
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await db.deleteEnrollment(userId); // Delete enrollment first
      // Note: We can't delete the user from auth.users via RLS, so we'll just remove from our state
      setUsers(prev => prev.filter(user => user.id !== userId));
      setEnrollments(prev => prev.filter(enrollment => enrollment.user_id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };



  // Handle class form submission
  const handleClassSubmit = async (classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) => {
    if (isSubmittingClass) return; // Prevent multiple submissions

    try {
      setIsSubmittingClass(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
      });

      if (classDialogMode === 'create') {
        const newClass = await Promise.race([
          db.createClass(classData),
          timeoutPromise
        ]) as Class;
        
        setClasses(prev => [newClass, ...prev]);
        setSelectedClassId(newClass.id);
        toast.success(`Class "${newClass.name}" created successfully!`);
      } else if (classDialogMode === 'edit' && editingClass) {
        const updatedClass = await Promise.race([
          db.updateClass(editingClass.id, classData),
          timeoutPromise
        ]) as Class;
        
        setClasses(prev => prev.map(cls => cls.id === updatedClass.id ? updatedClass : cls));
        toast.success(`Class "${updatedClass.name}" updated successfully!`);
      }

      // Close dialog and reset state
      setClassDialogOpen(false);
      setEditingClass(null);
      setClassDialogMode('create');
    } catch (err) {
      console.error('Error saving class:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out after 8 seconds. Please check your connection and try again.';
        } else if (err.message.includes('Failed to create class')) {
          errorMessage = 'Failed to create class. Please try again.';
        } else if (err.message.includes('Failed to update class')) {
          errorMessage = 'Failed to update class. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Handle class creation
  const handleCreateClass = () => {
    setClassDialogMode('create');
    setEditingClass(null);
    setClassDialogOpen(true);
  };

  // Handle class edit
  const handleEditClass = (classData: Class) => {
    if (!classData) {
      return;
    }
    setClassDialogMode('edit');
    setEditingClass(classData);
    setClassDialogOpen(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show empty state if no classes
  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">No Classes Found</h1>
          <p className="text-gray-600 mb-4">Create your first class to get started.</p>
          <Button onClick={handleCreateClass}>Create Class</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students', count: classStudents.length },
    { id: 'lessons', label: 'Lessons', count: classLessons.length },
    { id: 'submissions', label: 'Submissions', count: classSubmissions.length },
    { id: 'messages', label: 'Messages', count: 0 }, // TODO: Implement messaging
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Class Information */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedClass?.name}</h3>
            <p className="text-gray-600 mb-4">{selectedClass?.description}</p>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                selectedClass?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {selectedClass?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-2">
            <Button className="w-full" onClick={() => selectedClass && handleEditClass(selectedClass)}>Edit Class Settings</Button>
            <Button variant="outline" className="w-full" onClick={() => setActiveTab('students')}>Manage Enrollments</Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-semibold text-gray-900">{classStudents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lessons</p>
              <p className="text-2xl font-semibold text-gray-900">{classLessons.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Submissions</p>
              <p className="text-2xl font-semibold text-gray-900">{classSubmissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
        <div className="space-y-4">
          {classSubmissions.slice(0, 5).map((submission) => {
            const lesson = classLessons.find(l => l.id === submission.lesson_id);
            const student = classStudents.find(s => s.id === submission.student_id);
            
            return (
              <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student?.name} - {lesson?.title}</p>
                  <p className="text-sm text-gray-600">Submitted on {submission.submitted_at.toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {submission.grade && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Grade: {submission.grade}%
                    </span>
                  )}
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const handleAddUser = () => {
    setDialogMode('create');
    setEditingUser(null);
    setUserDialogOpen(true);
  };

  const renderStudents = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Enrolled Students</h3>
          <p className="text-sm text-gray-500">Students enrolled in {selectedClass?.name}</p>
          <p className="text-sm text-gray-500">Total: {classStudents.length}</p>
        </div>
        <div>
          <Button onClick={handleAddUser}>Add Student</Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classStudents.map((student) => {
              const studentSubmissions = classSubmissions.filter(s => s.student_id === student.id);
              const avgGrade = studentSubmissions.filter(s => s.grade !== null).length > 0 
                ? Math.round(studentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / studentSubmissions.filter(s => s.grade !== null).length)
                : null;
              
              return (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{studentSubmissions.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {avgGrade ? `${avgGrade}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditUser(student)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">View Profile</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLessons = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Class Lessons</h3>
        <Button>Create Lesson</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classLessons.map((lesson) => {
          const lessonSubmissions = classSubmissions.filter(s => s.lesson_id === lesson.id);
          const submittedCount = lessonSubmissions.length;
          const gradedCount = lessonSubmissions.filter(s => s.grade !== null).length;
          
          return (
            <div key={lesson.id} className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{lesson.title}</h3>
              <p className="text-gray-600 mb-3">{lesson.description}</p>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-500">Due: {lesson.due_date?.toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">Submissions: {submittedCount}/{classStudents.length}</p>
                <p className="text-sm text-gray-500">Graded: {gradedCount}/{submittedCount}</p>
              </div>
              
              <div className="flex space-x-2">
                {lesson.video_url && (
                  <Button size="sm" variant="outline" onClick={() => window.open(lesson.video_url!, '_blank')}>
                    View Video
                  </Button>
                )}
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm">View Submissions</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSubmissions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Submissions</h3>
        <Button>Export Grades</Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classSubmissions.map((submission) => {
              const lesson = classLessons.find(l => l.id === submission.lesson_id);
              const student = classStudents.find(s => s.id === submission.student_id);
              
              return (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lesson?.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.submitted_at.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.grade ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {submission.grade}%
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Ungraded
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button size="sm" variant="outline">Review</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMessages = () => {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages Coming Soon</h3>
        <p className="text-gray-600">The messaging feature will be implemented in a future update.</p>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'students':
        return renderStudents();
      case 'lessons':
        return renderLessons();
      case 'submissions':
        return renderSubmissions();
      case 'messages':
        return renderMessages();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#072c68] to-[#086623] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-full aspect-square w-24 h-24 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="CCBI Classroom Logo"
                  width={128}
                  height={128}
                  className="h-32 w-auto"
                />
              </div>
                              <div>
                  <h1 className="text-2xl font-bold text-white">CCBI Classroom</h1>
                  <p className="text-sm text-[#d2ac47]">Admin Dashboard</p>
                </div>
            </div>
                          <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="h-auto p-2 text-white hover:bg-white/10 data-[state=open]:bg-white/10"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src="" alt={user?.name || 'Admin'} />
                        <AvatarFallback className="rounded-lg bg-white/20 text-white">
                          {user?.name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                        <span className="truncate font-medium text-white">{user?.name || 'Admin User'}</span>
                        <span className="text-[#d2ac47] truncate text-xs">
                          {user?.email || 'admin@ccbinstitute.org'}
                        </span>
                      </div>
                      <MoreVertical className="ml-auto h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => {}}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
              <p className="mt-2 text-gray-600">Manage all CCBI classes here.</p>
            </div>
          </div>

          {/* Class Selector */}
          <div className="bg-white rounded-lg shadow-md border mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-[#072c68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Select Your Class</span>
                  </div>
                </label>
                <Button 
                  size="sm" 
                  onClick={handleCreateClass}
                  className="text-xs"
                >
                  + New Class
                </Button>
              </div>
              
              {/* Custom Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:border-[#072c68]/50 hover:shadow-md hover:scale-[1.003] active:scale-[0.997] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#072c68]/20 focus:border-[#072c68]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-[#072c68]/10 to-[#086623]/10 rounded-lg">
                      <svg className="w-5 h-5 text-[#072c68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedClass?.name || 'Choose a class...'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedClass?.description ?
                          (selectedClass.description.length > 50 ?
                            selectedClass.description.substring(0, 50).trim() + '...' :
                            selectedClass.description
                          ) :
                          'Select a class to get started'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${selectedClass?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-150 ${isClassDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Dropdown Menu */}
                {isClassDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top-1 duration-150">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setIsClassDropdownOpen(false);
                        }}
                                                 className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-[#072c68]/5 hover:to-[#086623]/5 hover:scale-[1.007] transition-all duration-100 transform ${
                           selectedClassId === cls.id ? 'bg-gradient-to-r from-[#072c68]/10 to-[#086623]/10 border-l-4 border-[#072c68]' : ''
                         }`}
                      >
                        <div className="p-2 bg-gradient-to-br from-[#072c68]/10 to-[#086623]/10 rounded-lg">
                          <svg className="w-5 h-5 text-[#072c68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>{cls.name}</span>
                            <span className="text-lg">📚</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {cls.description.length > 80 ?
                              cls.description.substring(0, 80).trim() + '...' :
                              cls.description
                            }
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${cls.is_active ? 'bg-green-500' : 'bg-red-500'} transition-all duration-150 hover:scale-110`} title={cls.is_active ? 'Active Class' : 'Inactive Class'}></div>
                          {selectedClassId === cls.id && (
                            <svg className="w-5 h-5 text-[#072c68] animate-in zoom-in duration-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md border mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-[#072c68] text-[#072c68]'
                        : 'border-transparent text-gray-500 hover:text-[#072c68] hover:border-[#072c68]/30'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#072c68] to-[#086623] border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-full aspect-square w-24 h-24 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="CCBI Classroom Logo"
                  width={112}
                  height={112}
                  className="h-32 w-auto"
                />
              </div>
              <span className="text-lg font-semibold text-white">CCBI Classroom</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-[#d2ac47]">
                © {new Date().getFullYear()} CCBI Classroom. All rights reserved.
              </p>
              <p className="text-xs text-white/80 mt-1 italic">
                Equipping Believers for Every Good Work
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* User Form Dialog */}
      <UserFormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
        selectedClassId={selectedClassId}
        onSubmit={handleUserSubmit}
        mode={dialogMode}
        isSubmitting={isSubmittingUser}
      />

      {/* Class Form Dialog */}
      <ClassFormDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        classData={editingClass}
        onSubmit={handleClassSubmit}
        mode={classDialogMode}
        isSubmitting={isSubmittingClass}
      />
    </div>
  );
}
