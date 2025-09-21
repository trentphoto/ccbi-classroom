"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { User, UserRole, Class, Lesson, Submission, ClassEnrollment } from '@/types/db';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { db } from '@/lib/supabase/database';
// import { useAuth } from '@/lib/auth-context'; // Unused for now
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { MoreVertical, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import UserFormDialog from './UserFormDialog';
import ClassFormDialog from './ClassFormDialog';
import LessonFormDialog from './LessonFormDialog';
import RosterImportDialog from './RosterImportDialog';

type TabType = 'overview' | 'students' | 'lessons' | 'submissions' | 'attendance' | 'messages';

export default function AdminDashboard() {
  // const { user } = useAuth(); // Unused for now
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
  // const [selectedConversation, setSelectedConversation] = useState<string | null>(null); // Unused for now
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivationDialogOpen, setDeactivationDialogOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [showActiveStudents, setShowActiveStudents] = useState<boolean>(true);
  const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());
  
  // Lesson dialog state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonDialogMode, setLessonDialogMode] = useState<'create' | 'edit'>('create');
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);
  
  // Roster import dialog state
  const [rosterImportOpen, setRosterImportOpen] = useState(false);
  const [isImportingRoster, setIsImportingRoster] = useState(false);
  

  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load selected class from localStorage on component mount
  useEffect(() => {
    try {
      const savedClassId = localStorage.getItem('adminSelectedClassId');
      if (savedClassId) {
        setSelectedClassId(savedClassId);
      }
    } catch (error) {
      console.warn('Could not load selected class from localStorage:', error);
    }
  }, []);

  // Save selected class to localStorage when it changes
  useEffect(() => {
    if (selectedClassId) {
      try {
        localStorage.setItem('adminSelectedClassId', selectedClassId);
      } catch (error) {
        console.warn('Could not save selected class to localStorage:', error);
      }
    }
  }, [selectedClassId]);

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

      // Set selected class from localStorage or first available class
      try {
        const savedClassId = localStorage.getItem('adminSelectedClassId');
        if (savedClassId && classesData.some(cls => cls.id === savedClassId)) {
          setSelectedClassId(savedClassId);
        } else if (classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
          localStorage.setItem('adminSelectedClassId', classesData[0].id);
        }
      } catch (error) {
        console.warn('Could not access localStorage:', error);
        if (classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }
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

  // Filter students based on active status
  const filteredStudents = useMemo(() => {
    return classStudents.filter(student => 
      showActiveStudents ? student.is_active : !student.is_active
    );
  }, [classStudents, showActiveStudents]);

  // Get counts for active and deactivated students
  const activeStudentsCount = useMemo(() => 
    classStudents.filter(student => student.is_active).length, 
    [classStudents]
  );
  
  const deactivatedStudentsCount = useMemo(() => 
    classStudents.filter(student => !student.is_active).length, 
    [classStudents]
  );
  
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
      setUserFormError(null); // Clear any previous errors

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
        
        // Close dialog and reset state on success
        setUserDialogOpen(false);
        setEditingUser(null);
        setDialogMode('create');
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
        
        // Close dialog and reset state on success
        setUserDialogOpen(false);
        setEditingUser(null);
        setDialogMode('create');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please wait at least one minute and try again.';
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

      // Set error in form instead of showing toast and closing dialog
      setUserFormError(errorMessage);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Handle user edit
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogMode('edit');
    setUserFormError(null); // Clear any previous errors
    setUserDialogOpen(true);
  };

  // Handle user deactivation
  const handleDeactivateUser = (user: User) => {
    setUserToDeactivate(user);
    setDeactivationDialogOpen(true);
  };

  // Confirm user deactivation
  const confirmDeactivation = async () => {
    if (!userToDeactivate || isDeactivating) return;

    try {
      setIsDeactivating(true);
      const updatedUser = await db.deactivateUser(userToDeactivate.id);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      toast.success(`Student "${userToDeactivate.name}" has been permanently deactivated.`);
      setDeactivationDialogOpen(false);
      setUserToDeactivate(null);
    } catch (err) {
      console.error('Error deactivating user:', err);
      toast.error('Failed to deactivate user. Please try again.');
    } finally {
      setIsDeactivating(false);
    }
  };

  // Handle user delete - unused for now
  // const handleDeleteUser = async (userId: string) => {
  //   if (!confirm('Are you sure you want to delete this user?')) return;
  //   
  //   try {
  //     await db.deleteEnrollment(userId); // Delete enrollment first
  //     // Note: We can't delete the user from auth.users via RLS, so we'll just remove from our state
  //     setUsers(prev => prev.filter(user => user.id !== userId));
  //     setEnrollments(prev => prev.filter(enrollment => enrollment.user_id !== userId));
  //   } catch (err) {
  //     console.error('Error deleting user:', err);
  //     setError('Failed to delete user. Please try again.');
  //   }
  // };




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
        try {
          localStorage.setItem('adminSelectedClassId', newClass.id);
        } catch (error) {
          console.warn('Could not save selected class to localStorage:', error);
        }
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

  // Handle lesson form submission
  const handleLessonSubmit = async (lessonData: Omit<Lesson, 'id' | 'created_at'>) => {
    if (isSubmittingLesson) return; // Prevent multiple submissions

    try {
      setIsSubmittingLesson(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
      });

      if (lessonDialogMode === 'create') {
        const newLesson = await Promise.race([
          db.createLesson(lessonData),
          timeoutPromise
        ]) as Lesson;
        
        setLessons(prev => [newLesson, ...prev]);
        toast.success(`Lesson "${newLesson.title}" created successfully!`);
      } else if (lessonDialogMode === 'edit' && editingLesson) {
        const updatedLesson = await Promise.race([
          db.updateLesson(editingLesson.id, lessonData),
          timeoutPromise
        ]) as Lesson;
        
        setLessons(prev => prev.map(lesson => lesson.id === updatedLesson.id ? updatedLesson : lesson));
        toast.success(`Lesson "${updatedLesson.title}" updated successfully!`);
      }

      // Close dialog and reset state
      setLessonDialogOpen(false);
      setEditingLesson(null);
      setLessonDialogMode('create');
    } catch (err) {
      console.error('Error saving lesson:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out after 8 seconds. Please check your connection and try again.';
        } else if (err.message.includes('Failed to create lesson')) {
          errorMessage = 'Failed to create lesson. Please try again.';
        } else if (err.message.includes('Failed to update lesson')) {
          errorMessage = 'Failed to update lesson. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  // Handle lesson creation
  const handleCreateLesson = () => {
    setLessonDialogMode('create');
    setEditingLesson(null);
    setLessonDialogOpen(true);
  };

  // Handle lesson edit
  const handleEditLesson = (lesson: Lesson) => {
    if (!lesson) {
      return;
    }
    setLessonDialogMode('edit');
    setEditingLesson(lesson);
    setLessonDialogOpen(true);
  };

  // Handle roster import
  const handleRosterImport = () => {
    if (!selectedClassId) {
      toast.error('Please select a class first');
      return;
    }
    setRosterImportOpen(true);
  };

  // Handle roster import completion
  const handleRosterImportComplete = (importedStudents: User[], skippedUsers: Array<{ name: string; email: string; reason: string }>) => {
    // Add the imported students to the users state
    setUsers(prev => [...prev, ...importedStudents]);

    // Refresh enrollments to include the new ones
    db.getEnrollments().then(updatedEnrollments => {
      setEnrollments(updatedEnrollments);
    }).catch(err => {
      console.error('Error refreshing enrollments:', err);
    });

    if (importedStudents.length > 0) {
      toast.success(`✅ Imported ${importedStudents.length} students successfully (no emails sent - ready for manual invitation)`);
    } else {
      toast.warning('⚠️ Import completed but no students were imported. Check the CSV format and try again.');
    }

    // Show notification for skipped users
    if (skippedUsers.length > 0) {
      toast.warning(`⚠️ ${skippedUsers.length} user${skippedUsers.length === 1 ? '' : 's'} were skipped due to duplicate email addresses.`);
    }
  };

  // Handle user invitation
  const handleInviteUser = async (user: User) => {
    if (invitingUsers.has(user.id)) return; // Already inviting

    setInvitingUsers(prev => new Set(prev).add(user.id));

    try {
      const result = await db.inviteUserViaEmail(user.id);

      if (result.success) {
        toast.success(result.message);
        // Refresh user data to update the UI
        const updatedUsers = await db.getUsers();
        setUsers(updatedUsers);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInvitingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
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
      <div className="flex items-center justify-center min-h-[50vh]">
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
      <>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">No Classes Found</h1>
            <p className="text-gray-600 mb-4">Create your first class to get started.</p>
            <Button onClick={handleCreateClass}>Create Class</Button>
          </div>
        </div>

        {/* Class Form Dialog - needed even in empty state */}
        <ClassFormDialog
          open={classDialogOpen}
          onOpenChange={setClassDialogOpen}
          classData={editingClass}
          onSubmit={handleClassSubmit}
          mode={classDialogMode}
          isSubmitting={isSubmittingClass}
        />
      </>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students', count: classStudents.length },
    { id: 'lessons', label: 'Lessons', count: classLessons.length },
    { id: 'submissions', label: 'Submissions', count: classSubmissions.length },
    { id: 'attendance', label: 'Attendance', count: 0 }, // TODO: Implement attendance
    { id: 'messages', label: 'Messages', count: 0 }, // TODO: Implement messaging
  ];

  const renderOverview = () => (
    <div className="space-y-6 w-full">
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
              <p className="text-xs text-gray-500">
                {activeStudentsCount} active, {deactivatedStudentsCount} deactivated
              </p>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/submissions')}
          >
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {classSubmissions.slice(0, 5).map((submission) => {
            const lesson = classLessons.find(l => l.id === submission.lesson_id);
            const student = classStudents.find(s => s.id === submission.student_id);
            
            return (
              <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student?.name} - {lesson?.title}</p>
                  <p className="text-sm text-gray-600">Submitted on {new Date(submission.submitted_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {submission.grade && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Grade: {submission.grade}%
                    </span>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/submissions/${submission.id}`)}
                  >
                    Review
                  </Button>
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
    setUserFormError(null); // Clear any previous errors
    setUserDialogOpen(true);
  };

  const renderStudents = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Enrolled Students</h3>
          <p className="text-sm text-gray-500">Students enrolled in {selectedClass?.name}</p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowActiveStudents(true)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  showActiveStudents
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Active ({activeStudentsCount})
              </button>
              <button
                onClick={() => setShowActiveStudents(false)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  !showActiveStudents
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Deactivated ({deactivatedStudentsCount})
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Showing: {filteredStudents.length} of {classStudents.length} students
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRosterImport} variant="outline">
            Import Roster
          </Button>
          <Button onClick={handleAddUser}>Add Student</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => {
              const studentSubmissions = classSubmissions.filter(s => s.student_id === student.id);
              const avgGrade = studentSubmissions.filter(s => s.grade !== null).length > 0
                ? Math.round(studentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / studentSubmissions.filter(s => s.grade !== null).length)
                : null;

              return (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.is_active ? 'Active' : 'Deactivated'}
                      </span>
                      {!student.is_active && student.deactivated_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(student.deactivated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{studentSubmissions.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {avgGrade ? `${avgGrade}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEditUser(student)}>
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Student
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInviteUser(student)} disabled={invitingUsers.has(student.id)}>
                          {invitingUsers.has(student.id) ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Inviting...
                            </>
                          ) : (
                            <>
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Send Invite
                            </>
                          )}
                        </DropdownMenuItem>
                        {student.is_active && (
                          <DropdownMenuItem onClick={() => handleDeactivateUser(student)} className="text-red-600 focus:text-red-600">
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M6 6l12 12" />
                            </svg>
                            Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        <Button onClick={handleCreateLesson}>Create Lesson</Button>
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
                <p className="text-sm text-gray-500">Due: {lesson.due_date ? new Date(lesson.due_date).toLocaleDateString() : 'No due date'}</p>
                <p className="text-sm text-gray-500">Submissions: {submittedCount}/{activeStudentsCount}</p>
                <p className="text-sm text-gray-500">Graded: {gradedCount}/{submittedCount}</p>
              </div>
              
              <div className="flex space-x-2">
                {lesson.video_url && (
                  <Button size="sm" variant="outline" onClick={() => window.open(lesson.video_url!, '_blank')}>
                    View Video
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleEditLesson(lesson)}>Edit</Button>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(submission.submitted_at).toLocaleDateString()}</td>
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/submissions/${submission.id}`)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAttendance = () => {
    return (
      <div className="h-full">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-6">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Attendance Tracking</h3>
          <p className="text-gray-700 mb-6 max-w-2xl leading-relaxed">
            Upload Zoom participant CSV files and let our intelligent system automatically match students,
            verify attendance, and generate beautiful reports. No more manual attendance taking!
          </p>

          <Button
            onClick={() => router.push('/attendance')}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg font-medium"
          >
            Go to Attendance
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          

        </div>

        {/* Big Call-to-Action Button */}
      </div>
    );
  };

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
      case 'attendance':
        return renderAttendance();
      case 'messages':
        return renderMessages();
      default:
        return renderOverview();
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
              <p className="mt-2 text-gray-600">Manage all classrooms here.</p>
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
                          try {
                            localStorage.setItem('adminSelectedClassId', cls.id);
                          } catch (error) {
                            console.warn('Could not save selected class to localStorage:', error);
                          }
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

      {/* User Form Dialog */}
      <UserFormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
        selectedClassId={selectedClassId}
        onSubmit={handleUserSubmit}
        mode={dialogMode}
        isSubmitting={isSubmittingUser}
        error={userFormError}
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

      {/* Lesson Form Dialog */}
      <LessonFormDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        lessonData={editingLesson}
        classId={selectedClassId}
        onSubmit={handleLessonSubmit}
        mode={lessonDialogMode}
        isSubmitting={isSubmittingLesson}
      />

      {/* Roster Import Dialog */}
      <RosterImportDialog
        open={rosterImportOpen}
        onOpenChange={setRosterImportOpen}
        classId={selectedClassId}
        className={selectedClass?.name || 'Unknown Class'}
        onImportComplete={handleRosterImportComplete}
        isImporting={isImportingRoster}
      />

      {/* Deactivation Warning Dialog */}
      <Dialog open={deactivationDialogOpen} onOpenChange={setDeactivationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Permanently Deactivate Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently deactivate {userToDeactivate?.name}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Warning</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>This action cannot be undone</li>
                      <li>The student will no longer be able to log in</li>
                      <li>All existing data will be preserved</li>
                      <li>Deactivation time will be recorded</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivationDialogOpen(false)}
              disabled={isDeactivating}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDeactivation}
              disabled={isDeactivating}
            >
              {isDeactivating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deactivating...
                </>
              ) : (
                'Permanently Deactivate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
