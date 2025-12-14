"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { db } from '@/lib/supabase/database';
import ClassFormDialog from '@/components/ClassFormDialog';
import { Class } from '@/types/db';

export default function SettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [error, setError] = useState<string | null>(null);
  
  // Class creation state
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classDialogMode, setClassDialogMode] = useState<'create' | 'edit'>('create');
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [classFormError, setClassFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSave = async () => {
    if (!user) return;

    setError(null);
    setIsSaving(true);

    try {
      // Validate name
      if (!formData.name.trim()) {
        setError('Name is required');
        setIsSaving(false);
        return;
      }

      // Update user profile
      const updatedUser = await db.updateUser(user.id, {
        name: formData.name.trim(),
      });

      if (updatedUser) {
        toast.success('Profile updated successfully');
        // Refresh user data
        await refreshUser();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateClass = () => {
    setClassDialogMode('create');
    setEditingClass(null);
    setClassFormError(null);
    setClassDialogOpen(true);
  };

  const handleClassSubmit = async (classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) => {
    if (isSubmittingClass) return;

    try {
      setIsSubmittingClass(true);
      setClassFormError(null);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000);
      });

      if (classDialogMode === 'create') {
        const newClass = await Promise.race([
          db.createClass(classData),
          timeoutPromise
        ]) as Class;
        
        toast.success(`Class &quot;${newClass.name}&quot; created successfully!`);
      } else if (classDialogMode === 'edit' && editingClass) {
        const updatedClass = await Promise.race([
          db.updateClass(editingClass.id, classData),
          timeoutPromise
        ]) as Class;
        
        toast.success(`Class &quot;${updatedClass.name}&quot; updated successfully!`);
      }

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
      
      setClassFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmittingClass(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 -ml-2 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
            <p className="mt-2 text-gray-600">Manage your account settings and preferences.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6 max-w-2xl">
          <div className="space-y-6">
            {/* Profile Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <Input
                    id="role"
                    type="text"
                    value={user.role === 'admin' ? 'Administrator' : 'Student'}
                    disabled
                    className="w-full bg-gray-50 cursor-not-allowed capitalize"
                  />
                  <p className="mt-1 text-xs text-gray-500">Role is assigned by administrators</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || formData.name === user.name}
                className="bg-[#072c68] hover:bg-[#072c68]/90"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Class Management Section - Admin Only */}
        {user.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-md border p-6 max-w-2xl mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Class Management</h3>
                <p className="text-sm text-gray-600 mb-4">Create and manage classes for your organization.</p>
              </div>
              
              <Button
                onClick={handleCreateClass}
                className="bg-[#072c68] hover:bg-[#072c68]/90"
              >
                + New Class
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Class Form Dialog */}
      <ClassFormDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        classData={editingClass}
        onSubmit={handleClassSubmit}
        mode={classDialogMode}
        isSubmitting={isSubmittingClass}
        error={classFormError}
      />
    </div>
  );
}

