'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import MeetingFormDialog from '@/components/MeetingFormDialog';
import MeetingList from '@/components/MeetingList';
import { Class, ClassMeeting, AttendanceRecord, User } from '@/types/db';
import { db } from '@/lib/supabase/database';
import { toast } from 'sonner';

export default function AttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // State for data
  const [classes, setClasses] = useState<Class[]>([]);
  const [meetings, setMeetings] = useState<ClassMeeting[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // State for UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ClassMeeting | null>(null);
  const [meetingDialogMode, setMeetingDialogMode] = useState<'create' | 'edit'>('create');
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  

  // Load data on component mount
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      loadData();
    }
  }, [user, authLoading, router]);

  // Load selected class from localStorage
  useEffect(() => {
    try {
      // First try to get the attendance-specific class selection
      let savedClassId = localStorage.getItem('attendanceSelectedClassId');
      
      // If not found, try to get the admin's selected class (for persistence from home page)
      if (!savedClassId) {
        savedClassId = localStorage.getItem('adminSelectedClassId');
      }
      
      if (savedClassId) {
        setSelectedClassId(savedClassId);
      }
    } catch (error) {
      console.warn('Could not load selected class from localStorage:', error);
    }
  }, []);

  // Save selected class to localStorage
  useEffect(() => {
    if (selectedClassId) {
      try {
        localStorage.setItem('attendanceSelectedClassId', selectedClassId);
      } catch (error) {
        console.warn('Could not save selected class to localStorage:', error);
      }
    }
  }, [selectedClassId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load classes, meetings, and attendance data
      const [classesData, meetingsData, attendanceData] = await Promise.all([
        db.getClasses(),
        db.getClassMeetings(),
        db.getAttendanceRecords()
      ]);

      setClasses(classesData);
      setMeetings(meetingsData);
      setAttendanceRecords(attendanceData);

      // Set selected class from localStorage or first available class
      let classIdToUse = '';
      try {
        // First try to get the attendance-specific class selection
        let savedClassId = localStorage.getItem('attendanceSelectedClassId');
        
        // If not found, try to get the admin's selected class (for persistence from home page)
        if (!savedClassId) {
          savedClassId = localStorage.getItem('adminSelectedClassId');
        }
        
        if (savedClassId && classesData.some(cls => cls.id === savedClassId)) {
          classIdToUse = savedClassId;
          // Save it as attendance-specific selection for future use
          localStorage.setItem('attendanceSelectedClassId', savedClassId);
        } else if (classesData.length > 0) {
          classIdToUse = classesData[0].id;
          localStorage.setItem('attendanceSelectedClassId', classesData[0].id);
        }
      } catch (error) {
        console.warn('Could not access localStorage:', error);
        if (classesData.length > 0) {
          classIdToUse = classesData[0].id;
        }
      }

      setSelectedClassId(classIdToUse);

      // Load students for the selected class
      if (classIdToUse) {
        const classStudents = await db.getStudentsByClass(classIdToUse);
        setStudents(classStudents);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current class data
  const selectedClass = classes.find(cls => cls.id === selectedClassId);
  
  // Get meetings for the selected class
  const classMeetings = meetings.filter(meeting => meeting.class_id === selectedClassId);
  
  // Get students enrolled in the selected class
  // const classStudents = students; // Students are already filtered by class in loadData - unused for now

  // Handle class selection change
  const handleClassChange = async (newClassId: string) => {
    setSelectedClassId(newClassId);
    
    // Load students for the new class
    try {
      const classStudents = await db.getStudentsByClass(newClassId);
      setStudents(classStudents);
    } catch (err) {
      console.error('Error loading students for class:', err);
      toast.error('Failed to load students for selected class');
    }
  };

  // Handle meeting form submission
  const handleMeetingSubmit = async (meetingData: Omit<ClassMeeting, 'id' | 'created_at'>) => {
    if (isSubmittingMeeting) return;

    try {
      setIsSubmittingMeeting(true);

      if (meetingDialogMode === 'create') {
        const newMeeting = await db.createClassMeeting(meetingData);
        setMeetings(prev => [newMeeting, ...prev]);
        toast.success(`Meeting "${newMeeting.meeting_title}" created successfully!`);
      } else if (meetingDialogMode === 'edit' && editingMeeting) {
        const updatedMeeting = await db.updateClassMeeting(editingMeeting.id, meetingData);
        setMeetings(prev => prev.map(meeting => 
          meeting.id === updatedMeeting.id ? updatedMeeting : meeting
        ));
        toast.success(`Meeting "${updatedMeeting.meeting_title}" updated successfully!`);
      }

      // Close dialog and reset state
      setMeetingDialogOpen(false);
      setEditingMeeting(null);
      setMeetingDialogMode('create');
    } catch (err) {
      console.error('Error saving meeting:', err);
      toast.error('Failed to save meeting. Please try again.');
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  // Handle meeting creation
  const handleCreateMeeting = () => {
    setMeetingDialogMode('create');
    setEditingMeeting(null);
    setMeetingDialogOpen(true);
  };

  // Handle meeting edit
  const handleEditMeeting = (meeting: ClassMeeting) => {
    setMeetingDialogMode('edit');
    setEditingMeeting(meeting);
    setMeetingDialogOpen(true);
  };

  // Handle meeting deletion
  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await db.deleteClassMeeting(meetingId);
      setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
      setAttendanceRecords(prev => prev.filter(record => record.meeting_id !== meetingId));
      toast.success('Meeting deleted successfully!');
    } catch (err) {
      console.error('Error deleting meeting:', err);
      toast.error('Failed to delete meeting. Please try again.');
    }
  };

  // Handle view meeting
  const handleViewMeeting = (meetingId: string) => {
    router.push(`/attendance/${meetingId}`);
  };


  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show empty state if no classes
  if (classes.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">No Classes Found</h1>
          <p className="text-gray-600 mb-4">Create a class first to start tracking attendance.</p>
          <Button onClick={() => router.push('/admin')}>Go to Admin Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="mb-4">
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 -ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Attendance Management</h2>
              <p className="mt-2 text-gray-600">Track student attendance using Zoom participant lists</p>
            </div>
          </div>

        {/* Class Selector */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">
                Select Class
              </label>
            </div>
            
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Meetings Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Class Meetings</h2>
                <p className="text-sm text-gray-600">
                  {selectedClass ? `Meetings for ${selectedClass.name}` : 'Select a class to view meetings'}
                </p>
              </div>
              <Button 
                onClick={handleCreateMeeting}
                disabled={!selectedClassId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Meeting
              </Button>
            </div>

            {selectedClassId ? (
              <MeetingList
                meetings={classMeetings}
                attendanceRecords={attendanceRecords}
                onEditMeeting={handleEditMeeting}
                onDeleteMeeting={handleDeleteMeeting}
                onViewMeeting={handleViewMeeting}
                isLoading={isLoading}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Please select a class to view meetings</p>
              </div>
            )}
          </div>
        </div>

      {/* Meeting Form Dialog */}
      <MeetingFormDialog
        open={meetingDialogOpen}
        onOpenChange={setMeetingDialogOpen}
        meetingData={editingMeeting}
        classId={selectedClassId}
        onSubmit={handleMeetingSubmit}
        mode={meetingDialogMode}
        isSubmitting={isSubmittingMeeting}
      />

    </div>
  );
}
