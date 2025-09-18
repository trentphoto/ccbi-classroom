'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SimpleHeader from '@/components/SimpleHeader';
import SimpleFooter from '@/components/SimpleFooter';
import { db } from '@/lib/supabase/database';
import { Submission, User, Lesson } from '@/types/db';
import { ArrowLeft, FileText, Download, Star, MessageSquare } from 'lucide-react';

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [student, setStudent] = useState<User | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  
  // Grading form state
  const [grade, setGrade] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    loadSubmissionData();
  }, [submissionId]);

  const loadSubmissionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all submissions to find the one we need
      const submissions = await db.getSubmissions();
      const targetSubmission = submissions.find(s => s.id === submissionId);
      
      if (!targetSubmission) {
        setError('Submission not found');
        return;
      }

      setSubmission(targetSubmission);
      setGrade(targetSubmission.grade);
      setFeedback(targetSubmission.feedback || '');

      // Get student info
      const users = await db.getUsers();
      const targetStudent = users.find(u => u.id === targetSubmission.student_id);
      setStudent(targetStudent || null);

      // Get lesson info
      const lessons = await db.getLessons();
      const targetLesson = lessons.find(l => l.id === targetSubmission.lesson_id);
      setLesson(targetLesson || null);

    } catch (err) {
      console.error('Error loading submission data:', err);
      setError('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!submission || grade === null || grade < 0 || grade > 100) {
      alert('Please enter a valid grade between 0 and 100');
      return;
    }

    try {
      setIsGrading(true);
      await db.updateSubmissionGrade(submission.id, grade, feedback);
      
      // Reload the submission data to get the updated version
      await loadSubmissionData();
      
      alert('Grade and feedback saved successfully!');
    } catch (err) {
      console.error('Error saving grade:', err);
      alert('Failed to save grade and feedback');
    } finally {
      setIsGrading(false);
    }
  };

  const handleDownloadFile = () => {
    if (submission?.file_path) {
      // In a real app, this would download the actual file from storage
      // For now, we'll just show an alert
      alert(`Downloading file: ${submission.file_path}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading submission...</p>
            </div>
          </div>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  if (error || !submission || !student || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Submission Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The requested submission could not be found.'}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  const isGraded = submission.grade !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900">Submission Review</h1>
            <p className="text-gray-600 mt-2">
              Reviewing submission for {student.name} - {lesson.title}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Submission Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Submission Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student</label>
                    <p className="mt-1 text-sm text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lesson</label>
                    <p className="mt-1 text-sm text-gray-900">{lesson.title}</p>
                    <p className="text-sm text-gray-500">{lesson.description}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submitted File</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{submission.file_path}</span>
                      <Button size="sm" variant="outline" onClick={handleDownloadFile}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Preview Placeholder */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">File Preview</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">File preview would be displayed here</p>
                  <p className="text-sm text-gray-400 mt-2">
                    In a real implementation, this would show the actual file content
                  </p>
                </div>
              </div>
            </div>

            {/* Grading Panel */}
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Current Status
                </h2>
                
                {isGraded ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grade</label>
                      <div className="mt-1 flex items-center">
                        <span className="text-2xl font-bold text-blue-600">{submission.grade}%</span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Graded
                        </span>
                      </div>
                    </div>
                    
                    {submission.feedback && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900">{submission.feedback}</p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(submission.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                    <p className="text-sm text-gray-500 mt-2">This submission has not been graded yet</p>
                  </div>
                )}
              </div>

              {/* Grading Form */}
              {!isGraded && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Grade Submission
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade (0-100)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={grade || ''}
                        onChange={(e) => setGrade(parseInt(e.target.value) || null)}
                        placeholder="Enter grade"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Enter feedback for the student..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSaveGrade}
                      disabled={isGrading || grade === null}
                      className="w-full"
                    >
                      {isGrading ? 'Saving...' : 'Save Grade & Feedback'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Update Grade (for already graded submissions) */}
              {isGraded && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Grade</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade (0-100)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={grade || ''}
                        onChange={(e) => setGrade(parseInt(e.target.value) || null)}
                        placeholder="Enter grade"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Enter feedback for the student..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSaveGrade}
                      disabled={isGrading || grade === null}
                      className="w-full"
                    >
                      {isGrading ? 'Updating...' : 'Update Grade & Feedback'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <BrandedFooter />
    </div>
  );
}
