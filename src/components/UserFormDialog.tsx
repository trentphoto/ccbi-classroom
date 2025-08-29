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
import { User, UserRole } from '@/types/db';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  selectedClassId?: string; // Make optional since it's not needed for updates
  onSubmit: (userData: Omit<User, 'id' | 'created_at'>) => void;
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
}

export default function UserFormDialog({
  open,
  onOpenChange,
  user,
  selectedClassId,
  onSubmit,
  mode,
  isSubmitting = false
}: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.STUDENT // Always set to student
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role // Use the actual user role instead of always setting to STUDENT
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: UserRole.STUDENT // Always set to student
      });
    }
    setErrors({});
  }, [user, mode, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.trim().length > 255) {
      newErrors.email = 'Email must be less than 255 characters';
    }

    // Additional validation for edit mode
    if (mode === 'edit' && !user) {
      newErrors.general = 'User data is missing. Please refresh and try again.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

      const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent multiple submissions

    if (validateForm()) {
      onSubmit(formData);
      // Note: Dialog closing is now handled by the parent component after async operation completes
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Student' : 'Edit Student'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new student to the system. They will be automatically enrolled in the selected class.'
              : 'Update student information.'
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
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>



          {mode === 'create' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This user will be automatically enrolled in the currently selected class.
              </p>
            </div>
          )}

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
                  {mode === 'create' ? 'Adding...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Add Student' : 'Update Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
