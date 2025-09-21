'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ClassMeeting } from '@/types/db';

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingData?: ClassMeeting | null;
  classId: string;
  onSubmit: (meetingData: Omit<ClassMeeting, 'id' | 'created_at'>) => Promise<void>;
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
}

export default function MeetingFormDialog({
  open,
  onOpenChange,
  meetingData,
  classId,
  onSubmit,
  mode,
  isSubmitting = false
}: MeetingFormDialogProps) {
  const [formData, setFormData] = useState({
    meeting_title: '',
    meeting_date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when dialog opens or meetingData changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && meetingData) {
        setFormData({
          meeting_title: meetingData.meeting_title || '',
          meeting_date: meetingData.meeting_date ? new Date(meetingData.meeting_date).toISOString().split('T')[0] : ''
        });
      } else {
        setFormData({
          meeting_title: '',
          meeting_date: new Date().toISOString().split('T')[0] // Default to today
        });
      }
      setErrors({});
    }
  }, [open, mode, meetingData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.meeting_title.trim()) {
      newErrors.meeting_title = 'Meeting title is required';
    } else if (formData.meeting_title.trim().length < 3) {
      newErrors.meeting_title = 'Meeting title must be at least 3 characters';
    }

    if (!formData.meeting_date) {
      newErrors.meeting_date = 'Meeting date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const meetingData: Omit<ClassMeeting, 'id' | 'created_at'> = {
        class_id: classId,
        meeting_title: formData.meeting_title.trim(),
        meeting_date: new Date(formData.meeting_date)
      };

      await onSubmit(meetingData);
      
      // Reset form on success
      setFormData({
        meeting_title: '',
        meeting_date: new Date().toISOString().split('T')[0]
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting meeting:', error);
      // Error handling is done in parent component
    }
  };

  const handleCancel = () => {
    setFormData({
      meeting_title: '',
      meeting_date: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Meeting' : 'Edit Meeting'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new class meeting for attendance tracking.'
              : 'Update the meeting details.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="meeting_title" className="text-sm font-medium text-gray-700">
              Meeting Title *
            </label>
            <Input
              id="meeting_title"
              type="text"
              placeholder="e.g., Week 3 - Bible Study, Chapter 5 Discussion"
              value={formData.meeting_title}
              onChange={(e) => handleInputChange('meeting_title', e.target.value)}
              className={errors.meeting_title ? 'border-red-500' : ''}
            />
            {errors.meeting_title && (
              <p className="text-sm text-red-600">{errors.meeting_title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="meeting_date" className="text-sm font-medium text-gray-700">
              Meeting Date *
            </label>
            <Input
              id="meeting_date"
              type="date"
              value={formData.meeting_date}
              onChange={(e) => handleInputChange('meeting_date', e.target.value)}
              className={errors.meeting_date ? 'border-red-500' : ''}
            />
            {errors.meeting_date && (
              <p className="text-sm text-red-600">{errors.meeting_date}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Meeting' : 'Update Meeting'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
