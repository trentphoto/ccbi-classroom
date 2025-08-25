"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { User, UserRole } from '@/types/db';
import Image from 'next/image';
import { 
  sampleUsers, 
  sampleClasses, 
  sampleSubmissions,
  getStudentsByClass,
  getLessonsByClass
} from '@/lib/sample-data';
import { getTeacherConversations } from '@/lib/messaging';
import ChatInterface from './ChatInterface';
import UserFormDialog from './UserFormDialog';
import { addUser, updateUser } from '@/lib/user-management';

// Use sample data
const mockClasses = sampleClasses;
// const mockUsers = sampleUsers; // Unused variable
// const mockEnrollments = sampleEnrollments; // Unused variable
// const mockLessons = sampleLessons; // Unused variable
const mockSubmissions = sampleSubmissions;

type TabType = 'overview' | 'students' | 'lessons' | 'submissions' | 'messages';

export default function AdminDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string>('class1');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Get unread message count for the teacher in the selected class
  const teacherId = sampleUsers.find(u => u.role === UserRole.ADMIN)?.id || '';
  const classConversations = getTeacherConversations(teacherId).filter(conv => conv.class_id === selectedClassId);
  const unreadCount = classConversations.reduce((total, conv) => total + conv.unread_count, 0);
  
  // Reset selected conversation when class changes
  React.useEffect(() => {
    if (classConversations.length > 0) {
      setSelectedConversation(classConversations[0].id);
    } else {
      setSelectedConversation(null);
    }
  }, [selectedClassId, classConversations]);
  
  // Get the currently selected conversation
  const currentConversation = classConversations.find(conv => conv.id === selectedConversation) || 
    (classConversations.length > 0 ? classConversations[0] : null);

  const selectedClass = mockClasses.find(cls => cls.id === selectedClassId);
  
  // Filter data based on selected class using helper functions
  const classStudents = getStudentsByClass(selectedClassId);
  const classLessons = getLessonsByClass(selectedClassId);
  const classSubmissions = mockSubmissions.filter(submission => 
    classLessons.some(lesson => lesson.id === submission.lesson_id)
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students', count: classStudents.length },
    { id: 'lessons', label: 'Lessons', count: classLessons.length },
    { id: 'submissions', label: 'Submissions', count: classSubmissions.length },
    { id: 'messages', label: 'Messages', count: unreadCount },
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
            <Button className="w-full">Edit Class Settings</Button>
            <Button variant="outline" className="w-full">Manage Enrollments</Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-[#072c68]/20 rounded-lg">
              <svg className="w-6 h-6 text-[#072c68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="p-2 bg-[#086623]/20 rounded-lg">
              <svg className="w-6 h-6 text-[#086623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
            <div className="p-2 bg-[#d2ac47]/20 rounded-lg">
              <svg className="w-6 h-6 text-[#d2ac47]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <div className="p-2 bg-[#a50417]/20 rounded-lg">
              <svg className="w-6 h-6 text-[#a50417]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Grade</p>
              <p className="text-2xl font-semibold text-gray-900">
                {classSubmissions.filter(s => s.grade !== null).length > 0 
                  ? Math.round(classSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / classSubmissions.filter(s => s.grade !== null).length)
                  : 'N/A'}%
              </p>
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

  const handleEditUser = (user: User) => {
    setDialogMode('edit');
    setEditingUser(user);
    setUserDialogOpen(true);
  };

  const handleUserSubmit = (userData: Omit<User, 'id' | 'created_at'>) => {
    if (dialogMode === 'create') {
      addUser(userData, selectedClassId);
    } else if (editingUser) {
      updateUser(editingUser.id, userData);
    }
    
    // In a real app, you would refresh the data here
    // For now, we'll just show a success message
    alert(dialogMode === 'create' ? 'Student added successfully!' : 'Student updated successfully!');
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
    if (classConversations.length === 0) {
      return (
        <div className="text-center py-8">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages</h3>
          <p className="text-gray-600">No conversations with students in this class yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
              <p className="text-sm text-gray-500">{classConversations.length} active</p>
            </div>
            <div className="divide-y divide-gray-200">
              {classConversations.map((conversation) => {
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                const isSelected = currentConversation?.id === conversation.id;
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#072c68] rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {conversation.student.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {conversation.student.name}
                          </p>
                          {conversation.unread_count > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        {lastMessage && (
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {lastMessage.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.last_message_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md border h-[600px]">
            {currentConversation ? (
              <ChatInterface 
                conversation={currentConversation} 
                currentUser={sampleUsers.find(u => u.role === UserRole.ADMIN)!} 
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                  <p className="text-gray-500">Choose a student from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{sampleUsers.find(u => u.role === UserRole.ADMIN)?.name}</p>
                  <p className="text-xs text-[#d2ac47]">{sampleUsers.find(u => u.role === UserRole.ADMIN)?.email}</p>
                </div>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="mt-2 text-gray-600">Manage all CCBI classes here.</p>
          </div>

          {/* Class Selector */}
          <div className="bg-white rounded-lg shadow-md border mb-6">
            <div className="p-6">
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[#072c68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Select Your Class</span>
                </div>
              </label>
              
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
                          selectedClass.description.substring(0, 60) + '...' : 
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
                    {mockClasses.map((cls) => (
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
                            {cls.description.substring(0, 80)}...
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
                                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#072c68] text-[#072c68]'
                      : 'border-transparent text-gray-500 hover:text-[#072c68] hover:border-[#072c68]/30'
                  }`}
                  >
                    {tab.label}
                    {tab.count && (
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
      />
    </div>
  );
}
