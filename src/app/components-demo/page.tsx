"use client";

import React, { useState } from 'react';
import { User, UserRole, Class, Lesson, Submission } from '@/types/db';
import { getDefaultBrandId, getAdminEmail } from '@/lib/brand';
import MessagingInterface from '@/components/MessagingInterface';
import { sampleConversations } from '@/components/MessagingData';
import StudentMessaging from '@/components/StudentMessaging';
import StudentProgress from '@/components/StudentProgress';
import VideoPlayer from '@/components/VideoPlayer';
import SubmissionForm from '@/components/SubmissionForm';

export default function ComponentsDemoPage() {
  const [selectedComponent, setSelectedComponent] = useState<string>('messaging');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample data for demo
  const sampleUser: User = {
    id: 'user1',
    email: getAdminEmail(),
    role: UserRole.ADMIN,
    name: 'Admin User',
    brand_id: getDefaultBrandId(),
    is_active: true,
    deactivated_at: null,
    created_at: new Date('2024-01-15')
  };

  const sampleClass: Class = {
    id: 'class1',
    name: 'April 2025 MTh MDiv',
    description: 'Master of Divinity Program - Monday/Thursday Schedule',
    brand_id: getDefaultBrandId(),
    is_active: true,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  };

  const sampleLesson: Lesson = {
    id: 'lesson1',
    class_id: 'class1',
    title: 'Introduction to Biblical Hermeneutics',
    description: 'Learn the principles of biblical interpretation and exegesis. This foundational lesson covers historical-grammatical method, context analysis, and application principles.',
    due_date: new Date('2024-02-15'),
    video_url: 'https://youtube.com/watch?v=example',
    file_path: '/assignments/lesson1-assignment.pdf',
    created_at: new Date('2024-01-20')
  };

  const sampleSubmission: Submission = {
    id: 'sub1',
    lesson_id: 'lesson1',
    student_id: 'user2',
    file_path: '/submissions/user2/lesson1-submission.pdf',
    submitted_at: new Date('2024-01-25'),
    grade: 85,
    feedback: 'Excellent work on the hermeneutical analysis. Your application of the historical-grammatical method shows strong understanding. Consider expanding on the cultural context section in future assignments.',
    updated_at: new Date('2024-01-26')
  };

  const sampleLessons: Lesson[] = [
    sampleLesson,
    {
      id: 'lesson2',
      class_id: 'class1',
      title: 'Old Testament Survey',
      description: 'Overview of the Old Testament books and their theological themes.',
      due_date: new Date('2024-02-22'),
      video_url: null,
      file_path: null,
      created_at: new Date('2024-01-27')
    },
    {
      id: 'lesson3',
      class_id: 'class1',
      title: 'New Testament Survey',
      description: 'Overview of the New Testament books and their theological themes.',
      due_date: new Date('2024-03-01'),
      video_url: null,
      file_path: null,
      created_at: new Date('2024-02-01')
    }
  ];

  const sampleSubmissions: Submission[] = [
    sampleSubmission,
    {
      id: 'sub2',
      lesson_id: 'lesson2',
      student_id: 'user2',
      file_path: '/submissions/user2/lesson2-submission.pdf',
      submitted_at: new Date('2024-02-20'),
      grade: 92,
      feedback: 'Outstanding work! Your analysis of the Old Testament themes is comprehensive and well-structured.',
      updated_at: new Date('2024-02-21')
    }
  ];

  const handleSubmit = async (file: File) => {
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Assignment submitted successfully!');
    }, 2000);
  };

  const components = [
    { id: 'messaging', name: 'Messaging Interface', description: 'Admin messaging interface with conversations' },
    { id: 'student-messaging', name: 'Student Messaging', description: 'Student messaging section' },
    { id: 'student-progress', name: 'Student Progress', description: 'Progress tracking with stats' },
    { id: 'video-player', name: 'Video Player', description: 'Enhanced video player with lesson info' },
    { id: 'submission-form', name: 'Submission Form', description: 'File upload with existing submission display' }
  ];

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'messaging':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Messaging Interface Demo</h3>
            <p className="text-sm text-gray-600 mb-4">
              This shows the admin messaging interface with sample conversations.
            </p>
            <MessagingInterface 
              conversations={sampleConversations}
              currentUser={sampleUser}
              selectedClassId="class1"
            />
          </div>
        );

      case 'student-messaging':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Student Messaging Demo</h3>
            <p className="text-sm text-gray-600 mb-4">
              This shows the student messaging section for contacting teachers.
            </p>
            <StudentMessaging />
          </div>
        );

      case 'student-progress':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Student Progress Demo</h3>
            <p className="text-sm text-gray-600 mb-4">
              This shows the student progress tracking with current lesson, completed assignments, and average grade.
            </p>
            <StudentProgress 
              lessons={sampleLessons}
              submissions={sampleSubmissions}
              currentLesson={sampleLesson}
            />
          </div>
        );

      case 'video-player':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Video Player Demo</h3>
            <p className="text-sm text-gray-600 mb-4">
              This shows the enhanced video player with lesson information and controls.
            </p>
            <VideoPlayer lesson={sampleLesson} />
          </div>
        );

      case 'submission-form':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Submission Form Demo</h3>
            <p className="text-sm text-gray-600 mb-4">
              This shows the file submission form with existing submission display (grade: 85%).
            </p>
            <SubmissionForm 
              lesson={sampleLesson}
              existingSubmission={sampleSubmission}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Components Demo</h1>
              <p className="text-sm text-gray-600">Preview of preserved messaging components</p>
            </div>
            <div className="text-sm text-gray-500">
              Navigate to <code className="bg-gray-100 px-2 py-1 rounded">/components-demo</code>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {components.map((component) => (
              <button
                key={component.id}
                onClick={() => setSelectedComponent(component.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  selectedComponent === component.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {component.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Component Display */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {renderComponent()}
        </div>

        {/* Component Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Component Information</h3>
          <p className="text-sm text-blue-700">
            These components are preserved for future messaging implementation. Each component is fully functional 
            with sample data and can be easily integrated into the main dashboard when ready.
          </p>
          <div className="mt-3 text-xs text-blue-600">
            <p>• All components use TypeScript for type safety</p>
            <p>• Styling is consistent with the existing design system</p>
            <p>• Components include error handling and loading states</p>
            <p>• See README-Messaging.md for integration instructions</p>
          </div>
        </div>
      </main>
    </div>
  );
}
