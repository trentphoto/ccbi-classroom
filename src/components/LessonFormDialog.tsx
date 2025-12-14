"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Lesson } from '@/types/db';

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonData?: Lesson | null;
  classId: string;
  onSubmit: (lessonData: Omit<Lesson, 'id' | 'created_at'>) => void;
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
}

export default function LessonFormDialog({
  open,
  onOpenChange,
  lessonData,
  classId,
  onSubmit,
  mode,
  isSubmitting = false
}: LessonFormDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    video_url: '',
    file_path: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lessonData && mode === 'edit') {
      setFormData({
        title: lessonData.title,
        description: lessonData.description,
        due_date: lessonData.due_date ? new Date(lessonData.due_date).toISOString().slice(0, 16) : '',
        video_url: lessonData.video_url || '',
        file_path: lessonData.file_path || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        due_date: '',
        video_url: '',
        file_path: ''
      });
    }
    setErrors({});
  }, [lessonData, mode, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Assignment title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Assignment title must be at least 3 characters long';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Assignment title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Validate video URL if provided
    if (formData.video_url.trim()) {
      try {
        new URL(formData.video_url);
      } catch {
        newErrors.video_url = 'Please enter a valid URL';
      }
    }

    // Validate due date if provided
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const now = new Date();
      if (dueDate <= now) {
        newErrors.due_date = 'Due date must be in the future';
      }
    }

    // Additional validation for edit mode
    if (mode === 'edit' && !lessonData) {
      newErrors.general = 'Assignment data is missing. Please refresh and try again.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent multiple submissions

    if (validateForm()) {
      const submitData = {
        class_id: classId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        due_date: formData.due_date ? new Date(formData.due_date) : null,
        video_url: formData.video_url.trim() || null,
        file_path: formData.file_path.trim() || null
      };
      onSubmit(submitData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Assignment' : 'Edit Assignment'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new assignment for your class.'
              : 'Update assignment information and settings.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Assignment Title *
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
              placeholder="e.g., Week 1 Reading Assignment"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-500 ${
                errors.description ? 'border-red-500' : ''
              }`}
              rows={4}
              placeholder="Describe the assignment requirements, objectives, and what students need to submit..."
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="due_date" className="text-sm font-medium text-gray-700">
                Due Date
              </label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className={errors.due_date ? 'border-red-500' : ''}
              />
              {errors.due_date && (
                <p className="text-sm text-red-600">{errors.due_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="video_url" className="text-sm font-medium text-gray-700">
                Video URL
              </label>
              <Input
                id="video_url"
                type="url"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                className={errors.video_url ? 'border-red-500' : ''}
                placeholder="https://youtube.com/watch?v=..."
              />
              {errors.video_url && (
                <p className="text-sm text-red-600">{errors.video_url}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="file_path" className="text-sm font-medium text-gray-700">
              Assignment File Path
            </label>
            <Input
              id="file_path"
              type="text"
              value={formData.file_path}
              onChange={(e) => handleInputChange('file_path', e.target.value)}
              placeholder="Path to assignment file (optional)"
            />
            <p className="text-xs text-gray-500">
              Optional: Path to an assignment file that students can download
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Assignment' : 'Update Assignment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
