"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { User, Class, Lesson, Submission, UserRole } from '@/types/db';
// import Image from 'next/image'; // Unused for now
import { db } from '@/lib/supabase/database';
// import { useAuth } from '@/lib/auth-context'; // Unused for now

export default function StudentDashboard() {
  // const { user } = useAuth(); // Unused for now
  
  // State for data
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [enrolledClass, setEnrolledClass] = useState<Class | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // State for UI
  // const [isVideoPlaying, setIsVideoPlaying] = useState(false); // Unused for now
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load student data on component mount
  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Get current user from auth context
      // For now, we'll simulate getting the current user
      const users = await db.getUsers();
      const currentUser = users.find(u => u.role === UserRole.STUDENT);
      
      if (!currentUser) {
        throw new Error('No student user found');
      }
      
      setCurrentUser(currentUser);
      
      // Get enrollment
      const enrollment = await db.getEnrollmentByUserId(currentUser.id);
      if (!enrollment) {
        throw new Error('Student is not enrolled in any class');
      }
      
      // Get enrolled class
      const classData = await db.getClassById(enrollment.class_id);
      if (!classData) {
        throw new Error('Enrolled class not found');
      }
      
      setEnrolledClass(classData);
      
      // Get lessons for the class
      const lessonsData = await db.getLessonsByClass(classData.id);
      setLessons(lessonsData);
      
      // Get student's submissions
      const submissionsData = await db.getSubmissionsByStudent(currentUser.id);
      setSubmissions(submissionsData);
      
    } catch (err) {
      console.error('Error loading student data:', err);
      setError('Failed to load student data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSubmissionFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!submissionFile || !currentUser || !lessons.length) return;
    
    try {
      setIsSubmitting(true);
      
      // TODO: Upload file to Supabase Storage
      const filePath = `/submissions/${currentUser.id}/${submissionFile.name}`;
      
      // Create submission record
      await db.createSubmission({
        lesson_id: lessons[0].id, // Submit to first lesson for now
        student_id: currentUser.id,
        file_path: filePath,
        grade: null,
        feedback: null
      });
      
      // Reload submissions
      const updatedSubmissions = await db.getSubmissionsByStudent(currentUser.id);
      setSubmissions(updatedSubmissions);
      
      setSubmissionFile(null);
      alert('Lesson assignment submitted successfully!');
    } catch (err) {
      console.error('Error submitting assignment:', err);
      alert('Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          <Button onClick={loadStudentData}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!currentUser || !enrolledClass) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">No Class Found</h1>
          <p className="text-gray-600 mb-4">You are not enrolled in any class.</p>
          <Button onClick={loadStudentData}>Refresh</Button>
        </div>
      </div>
    );
  }

  const currentLesson = lessons[0] || null;
  const currentSubmission = submissions.find(sub => sub.lesson_id === currentLesson?.id) || null;

  return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Class Info */}
          <div className="mb-8">
            <div className="p-4 bg-gradient-to-r from-[#072c68]/10 to-[#086623]/10 rounded-lg border border-[#072c68]/20">
              <h2 className="text-lg font-semibold text-[#072c68]">{enrolledClass.name}</h2>
              <p className="text-[#086623]">{enrolledClass.description}</p>
            </div>
          </div>

          {/* Current Lesson Section */}
          <div className="bg-white rounded-lg shadow-md border mb-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Lesson</h2>
              
              {currentLesson ? (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Video Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentLesson.title}</h3>
                    <p className="text-gray-600 mb-4">{currentLesson.description}</p>
                    
                    {currentLesson.video_url ? (
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-gray-500">Video content available</p>
                            <Button 
                              className="mt-2"
                              onClick={() => window.open(currentLesson.video_url!, '_blank')}
                            >
                              Watch Video
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-gray-500">No video content for this lesson.</p>
                      </div>
                    )}
                  </div>

                  {/* Assignment Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
                    
                    {currentSubmission ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-green-800 font-medium">Assignment Submitted</span>
                        </div>
                        <p className="text-green-700 text-sm mb-2">
                          Submitted on {new Date(currentSubmission.submitted_at).toLocaleDateString()}
                        </p>
                        {currentSubmission.grade !== null && (
                          <p className="text-green-700 text-sm">
                            Grade: {currentSubmission.grade}%
                          </p>
                        )}
                        {currentSubmission.feedback && (
                          <div className="mt-2">
                            <p className="text-green-700 text-sm font-medium">Feedback:</p>
                            <p className="text-green-700 text-sm">{currentSubmission.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-600">Submit your assignment for this lesson.</p>
                        
                        <div>
                          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Assignment (JPG or PDF)
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".jpg,.jpeg,.pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleSubmit}
                          disabled={!submissionFile || isSubmitting}
                          className="w-full"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Lessons Available</h3>
                  <p className="text-gray-500">Check back later for new lessons.</p>
                </div>
              )}
            </div>
          </div>

          {/* Lessons List */}
          <div className="bg-white rounded-lg shadow-md border">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">All Lessons</h2>
              
              {lessons.length > 0 ? (
                <div className="space-y-4">
                  {lessons.map((lesson) => {
                    const submission = submissions.find(sub => sub.lesson_id === lesson.id);
                    return (
                      <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                          <p className="text-sm text-gray-600">{lesson.description}</p>
                          {lesson.due_date && (
                            <p className="text-sm text-gray-500">
                              Due: {new Date(lesson.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {submission ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Submitted
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No lessons available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
  );
}
