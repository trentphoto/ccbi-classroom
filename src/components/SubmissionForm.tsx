"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Lesson, Submission } from '@/types/db';

interface SubmissionFormProps {
  lesson: Lesson;
  existingSubmission?: Submission | null;
  onSubmit: (file: File) => void;
  isSubmitting?: boolean;
  className?: string;
}

export default function SubmissionForm({ 
  lesson, 
  existingSubmission, 
  onSubmit, 
  isSubmitting = false,
  className = "" 
}: SubmissionFormProps) {
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSubmissionFile(file);
    }
  };

  const handleSubmit = () => {
    if (!submissionFile) return;
    onSubmit(submissionFile);
  };

  if (existingSubmission) {
    // Show existing submission
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 mb-4 ${className}`}>
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
            Submitted on {new Date(existingSubmission.submitted_at).toLocaleDateString()}
          </div>
          
          {existingSubmission.grade && (
            <div className="flex items-center">
              <span className="text-sm font-medium text-green-700 mr-2">Grade:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {existingSubmission.grade}%
              </span>
            </div>
          )}
          
          {existingSubmission.feedback && (
            <div className="bg-white p-3 rounded border">
              <p className="text-sm font-medium text-green-800 mb-1">Feedback:</p>
              <p className="text-sm text-green-700">{existingSubmission.feedback}</p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => window.open(existingSubmission.file_path, '_blank')}>
              View Submission
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.open(lesson.file_path || '', '_blank')}>
              View Assignment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show submission form
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 ${className}`}>
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
            onClick={() => window.open(lesson.file_path || '', '_blank')}
          >
            View Assignment
          </Button>
        </div>
      </div>
    </div>
  );
}
