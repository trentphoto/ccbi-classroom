"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { User, Class, Lesson, Submission, UserRole } from '@/types/db';
import Image from 'next/image';
import { 
  sampleUsers, 
  sampleClasses, 
  sampleLessons, 
  sampleSubmissions,
  getCurrentUser,
  getEnrolledClass,
  getLessonsByClass,
  getSubmissionsByStudent
} from '@/lib/sample-data';

// Get current student data (using Michael Chen as default for demo)
const currentStudentEmail = 'michael.chen@ccbinstitute.org';
const mockStudent = getCurrentUser(currentStudentEmail) || sampleUsers[1]; // fallback to Michael Chen
const mockClass = getEnrolledClass(mockStudent.id) || sampleClasses[0]; // fallback to MTh MDiv

// Get current lesson (first lesson of the student's class)
const classLessons = getLessonsByClass(mockClass.id);
const currentLesson = classLessons[0] || sampleLessons[0];

// Get student's submission for current lesson
const studentSubmissions = getSubmissionsByStudent(mockStudent.id);
const mockSubmission = studentSubmissions.find(sub => sub.lesson_id === currentLesson.id) || null;

export default function StudentDashboard() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSubmissionFile(file);
    }
  };

  const handleSubmit = () => {
    if (!submissionFile) return;
    
    setIsSubmitting(true);
    // Simulate submission process
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Lesson assignment submitted successfully!');
      setSubmissionFile(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#072c68] to-[#086623] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  <p className="text-sm text-[#d2ac47]">Welcome back, {mockStudent.name}</p>
                </div>
            </div>
                          <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{mockStudent.name}</p>
                  <p className="text-xs text-[#d2ac47]">{mockStudent.email}</p>
                </div>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Class Info */}
          <div className="mb-8">
            <div className="p-4 bg-gradient-to-r from-[#072c68]/10 to-[#086623]/10 rounded-lg border border-[#072c68]/20">
              <h2 className="text-lg font-semibold text-[#072c68]">{mockClass.name}</h2>
              <p className="text-[#086623]">{mockClass.description}</p>
            </div>
          </div>

          {/* Current Lesson Section */}
          <div className="bg-white rounded-lg shadow-md border mb-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Lesson</h2>
              <div className="grid lg:grid-cols-2 gap-8">
                
                {/* Video Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Lesson</h3>
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    {isVideoPlaying ? (
                      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <p className="text-lg mb-2">Video Player</p>
                          <p className="text-sm text-gray-300">(Simulated video content)</p>
                          <Button 
                            onClick={() => setIsVideoPlaying(false)}
                            className="mt-4"
                            variant="outline"
                          >
                            Stop Video
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-[#072c68] rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-gray-600 mb-2">Ready to watch the lesson?</p>
                                                  <Button 
                          onClick={() => setIsVideoPlaying(true)}
                          className="bg-[#072c68] hover:bg-[#072c68]/90 text-white"
                        >
                          Start Video Lesson
                        </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">{currentLesson.title}</h4>
                    <p className="text-gray-600 text-sm">{currentLesson.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Due: {currentLesson.due_date?.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Assignment Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
                  
                  {mockSubmission ? (
                    // Show existing submission
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-green-800">Assignment Submitted</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-green-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Submitted on {mockSubmission.submitted_at.toLocaleDateString()}
                        </div>
                        
                        {mockSubmission.grade && (
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-700 mr-2">Grade:</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {mockSubmission.grade}%
                            </span>
                          </div>
                        )}
                        
                        {mockSubmission.feedback && (
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm font-medium text-green-800 mb-1">Feedback:</p>
                            <p className="text-sm text-green-700">{mockSubmission.feedback}</p>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(mockSubmission.file_path, '_blank')}>
                            View Submission
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(currentLesson.file_path || '', '_blank')}>
                            View Assignment
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show submission form
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Your Work
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="mt-4">
                              <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                  {submissionFile ? submissionFile.name : 'Choose a file or drag it here'}
                                </span>
                                <span className="mt-1 block text-xs text-gray-500">
                                  PDF, JPG, or PNG up to 10MB
                                </span>
                              </label>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            onClick={handleSubmit}
                            disabled={!submissionFile || isSubmitting}
                            className="flex-1"
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => window.open(currentLesson.file_path || '', '_blank')}
                          >
                            View Assignment
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white rounded-lg shadow-md border mb-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#072c68]/10 rounded-lg border border-[#072c68]/20">
                  <div className="text-2xl font-bold text-[#072c68]">{classLessons.findIndex(lesson => lesson.id === currentLesson.id) + 1}</div>
                  <div className="text-sm text-[#072c68]">Current Lesson</div>
                </div>
                <div className="text-center p-4 bg-[#086623]/10 rounded-lg border border-[#086623]/20">
                  <div className="text-2xl font-bold text-[#086623]">{studentSubmissions.filter(sub => sub.grade !== null).length}</div>
                  <div className="text-sm text-[#086623]">Completed</div>
                </div>
                <div className="text-center p-4 bg-[#d2ac47]/10 rounded-lg border border-[#d2ac47]/20">
                  <div className="text-2xl font-bold text-[#d2ac47]">
                    {studentSubmissions.filter(sub => sub.grade !== null).length > 0 
                      ? Math.round(studentSubmissions.filter(sub => sub.grade !== null).reduce((sum, sub) => sum + (sub.grade || 0), 0) / studentSubmissions.filter(sub => sub.grade !== null).length)
                      : 0}%
                  </div>
                  <div className="text-sm text-[#d2ac47]">Average Grade</div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Section */}
          <div className="bg-white rounded-lg shadow-md border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                <Button 
                  className="inline-flex items-center px-3 py-2 bg-[#072c68] text-white rounded-md hover:bg-[#072c68]/90 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Teacher
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#072c68] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">T</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Teacher</p>
                    <p className="text-xs text-gray-500">Contact your teacher for questions about assignments, lessons, or general support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#072c68] to-[#086623] border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
    </div>
  );
}
