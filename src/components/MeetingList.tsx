'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { ClassMeeting, AttendanceRecord } from '@/types/db';
// Using native JavaScript date formatting

interface MeetingListProps {
  meetings: ClassMeeting[];
  attendanceRecords: AttendanceRecord[];
  onEditMeeting: (meeting: ClassMeeting) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onViewMeeting: (meetingId: string) => void;
  isLoading?: boolean;
}

export default function MeetingList({
  meetings,
  attendanceRecords,
  onEditMeeting,
  onDeleteMeeting,
  onViewMeeting,
  isLoading = false
}: MeetingListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting? This will also delete all attendance records for this meeting.')) {
      return;
    }

    try {
      setDeletingId(meetingId);
      await onDeleteMeeting(meetingId);
    } catch (error) {
      console.error('Error deleting meeting:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getAttendanceStats = (meetingId: string) => {
    const records = attendanceRecords.filter(record => record.meeting_id === meetingId);
    const present = records.filter(record => record.status === 'present').length;
    const absent = records.filter(record => record.status === 'absent').length;

    return { present, absent, total: records.length };
  };

  const formatMeetingDate = (date: Date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Meetings Yet</h3>
        <p className="text-gray-600 mb-6">Create your first class meeting to start tracking attendance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => {
        const stats = getAttendanceStats(meeting.id);
        const hasAttendance = stats.total > 0;

        return (
          <div key={meeting.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {meeting.meeting_title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {formatMeetingDate(meeting.meeting_date)}
                </p>

                {hasAttendance ? (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">{stats.present} Present</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">{stats.absent} Absent</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>No attendance recorded yet</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => onViewMeeting(meeting.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {hasAttendance ? 'View attendance' : 'Start attendance'}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditMeeting(meeting)}
                  className="text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  Edit
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(meeting.id)}
                  disabled={deletingId === meeting.id}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {deletingId === meeting.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
