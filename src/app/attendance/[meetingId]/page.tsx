'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import MeetingFormDialog from '@/components/MeetingFormDialog';
import CSVUploadDialog from '@/components/CSVUploadDialog';
import { Class, ClassMeeting, AttendanceRecord, User } from '@/types/db';
import { ParticipantMatch, getMatchingSummary } from '@/lib/csv-parser';
import { db } from '@/lib/supabase/database';
import { toast } from 'sonner';

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const meetingId = params.meetingId as string;
  
  // State for data
  const [meeting, setMeeting] = useState<ClassMeeting | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [csvMatches, setCsvMatches] = useState<ParticipantMatch[]>([]);
  
  // State for UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Map<string, string>>(new Map());
  const [dragActive, setDragActive] = useState(false);

  const loadMeetingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load meeting data
      const meetings = await db.getClassMeetings();
      const targetMeeting = meetings.find(m => m.id === meetingId);
      
      if (!targetMeeting) {
        setError('Meeting not found');
        return;
      }

      setMeeting(targetMeeting);

      // Load class data
      const classes = await db.getClasses();
      const targetClass = classes.find(c => c.id === targetMeeting.class_id);
      setClassData(targetClass || null);

      // Load attendance records and students for this class
      const [attendanceData, studentsData] = await Promise.all([
        db.getAttendanceRecordsByMeeting(meetingId),
        db.getStudentsByClass(targetMeeting.class_id)
      ]);

      setAttendanceRecords(attendanceData);
      setStudents(studentsData);

      // If we have attendance records, we can show the results
      // If not, we might need to load CSV data if it was uploaded
      if (attendanceData.length === 0) {
        // Check if there's a CSV file to process
        // For now, we'll just show the upload option
      }

    } catch (err) {
      console.error('Error loading meeting data:', err);
      setError('Failed to load meeting data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

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
      
      loadMeetingData();
    }
  }, [user, authLoading, router, meetingId, loadMeetingData]);

  // Handle meeting form submission
  const handleMeetingSubmit = async (meetingData: Omit<ClassMeeting, 'id' | 'created_at'>) => {
    if (isSubmittingMeeting || !meeting) return;

    try {
      setIsSubmittingMeeting(true);
      const updatedMeeting = await db.updateClassMeeting(meeting.id, meetingData);
      setMeeting(updatedMeeting);
      toast.success(`Meeting "${updatedMeeting.meeting_title}" updated successfully!`);
      setMeetingDialogOpen(false);
    } catch (err) {
      console.error('Error updating meeting:', err);
      toast.error('Failed to update meeting. Please try again.');
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  // Handle CSV upload
  const handleCSVUploadComplete = async (matches: ParticipantMatch[]) => {
    // Remove duplicate participants based on unique keys
    const uniqueMatches = new Map<string, ParticipantMatch>();
    matches.forEach(match => {
      const participantKey = getParticipantKey(match.participant);
      if (!uniqueMatches.has(participantKey)) {
        uniqueMatches.set(participantKey, match);
      }
    });
    
    const deduplicatedMatches = Array.from(uniqueMatches.values());
    setCsvMatches(deduplicatedMatches);
    setCsvUploadOpen(false);
    
    // Initialize selected students with exact and high-confidence fuzzy matches
    const initialSelections = new Map<string, string>();
    deduplicatedMatches.forEach(match => {
      if ((match.matchType === 'exact' || match.matchType === 'fuzzy') && match.student) {
        const participantKey = getParticipantKey(match.participant);
        initialSelections.set(participantKey, match.student.id);
      }
    });
    setSelectedStudents(initialSelections);
  };

  // Handle drag and drop for CSV files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Import the CSV parser dynamically to avoid SSR issues
      const { parseZoomCSV, matchParticipantsByEmail } = await import('@/lib/csv-parser');
      const result = await parseZoomCSV(file);
      
      if (result.errors.length > 0) {
        toast.error(`CSV parsing errors: ${result.errors.join(', ')}`);
        return;
      }

      // Show warnings if any
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      // Perform matching with students
      const participantMatches = matchParticipantsByEmail(result.participants, students);
      
      // Process the matches
      handleCSVUploadComplete(participantMatches);
      
      toast.success(`CSV uploaded successfully! Found ${result.participants.length} participants.`);
      
    } catch (err) {
      console.error('Error parsing CSV:', err);
      toast.error('Failed to parse CSV file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Create unique participant identifier
  const getParticipantKey = (participant: { email?: string; name?: string }) => {
    // Use email if available, otherwise use name, otherwise use a combination
    if (participant.email) {
      return participant.email;
    } else if (participant.name) {
      return `name_${participant.name}`;
    } else {
      return `unknown_${Math.random()}`;
    }
  };

  // Handle student selection with conflict resolution
  const handleStudentSelect = (participantKey: string, studentId: string) => {
    setSelectedStudents(prev => {
      const newMap = new Map(prev);
      
      // Check for conflicts - if this student is already assigned to another participant
      if (studentId !== '') {
        for (const [existingParticipantKey, existingStudentId] of newMap.entries()) {
          if (existingStudentId === studentId && existingParticipantKey !== participantKey) {
            // Remove the existing assignment to prevent double-matching
            newMap.delete(existingParticipantKey);
            break;
          }
        }
      }
      
      if (studentId === '') {
        newMap.delete(participantKey);
      } else {
        newMap.set(participantKey, studentId);
      }
      return newMap;
    });
  };

  // Handle attendance save
  const handleSaveAttendance = async () => {
    try {
      setIsSavingAttendance(true);
      
      const attendanceData = csvMatches
        .map(match => {
          const participantKey = getParticipantKey(match.participant);
          const selectedStudentId = selectedStudents.get(participantKey);
          
          if (selectedStudentId) {
            return {
              meeting_id: meetingId,
              student_id: selectedStudentId,
              status: 'present' as const,
              notes: null,
              verified_by: null
            };
          }
          
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (attendanceData.length === 0) {
        toast.error('Please assign at least one participant to a student');
        return;
      }

      // Validate that we're not double-assigning students
      const studentIds = attendanceData.map(item => item.student_id);
      const uniqueStudentIds = new Set(studentIds);
      if (studentIds.length !== uniqueStudentIds.size) {
        toast.error('Some students are assigned to multiple participants. Please review your selections.');
        return;
      }

      // Create attendance records
      await db.createAttendanceRecords(attendanceData);
      
      // Reload attendance records
      const updatedRecords = await db.getAttendanceRecordsByMeeting(meetingId);
      setAttendanceRecords(updatedRecords);
      
      // Calculate match statistics for feedback
      const exactMatches = csvMatches.filter(m => m.matchType === 'exact' && selectedStudents.has(getParticipantKey(m.participant))).length;
      const autoFuzzyMatches = csvMatches.filter(m => m.matchType === 'fuzzy' && selectedStudents.has(getParticipantKey(m.participant))).length;
      const manualMatches = attendanceData.length - exactMatches - autoFuzzyMatches;
      
      let successMessage = `Attendance recorded for ${attendanceData.length} students!`;
      if (autoFuzzyMatches > 0 || manualMatches > 0) {
        successMessage += ` (${exactMatches} exact matches, ${autoFuzzyMatches} auto-fuzzy matches, ${manualMatches} manual matches)`;
      }
      
      toast.success(successMessage);
      setCsvMatches([]);
      setSelectedStudents(new Map());
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Failed to save attendance. Please try again.');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const getStudentById = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const getSelectedCount = () => {
    return selectedStudents.size;
  };

  const summary = csvMatches.length > 0 ? getMatchingSummary(csvMatches) : null;
  const matchedParticipants = csvMatches.filter(m => selectedStudents.has(getParticipantKey(m.participant)));
  const unmatchedParticipants = csvMatches.filter(m => !selectedStudents.has(getParticipantKey(m.participant)));
  
  // Get list of already assigned student IDs
  const assignedStudentIds = new Set(selectedStudents.values());
  
  // Filter out already assigned students from suggestions and dropdowns
  const getAvailableStudents = () => {
    return students.filter(student => !assignedStudentIds.has(student.id));
  };
  
  const getFilteredFuzzyMatches = (fuzzyMatches: { student: { id: string; name: string; email: string }; score: number; reasons: string[] }[]) => {
    return fuzzyMatches.filter((fuzzyMatch) => !assignedStudentIds.has(fuzzyMatch.student.id));
  };
  
  const getFilteredSuggestions = (suggestions: { id: string; name: string }[]) => {
    return suggestions.filter((suggestion) => !assignedStudentIds.has(suggestion.id));
  };
  
  // Get absent students (students not assigned to any participant)
  const getAbsentStudents = () => {
    return students.filter(student => !assignedStudentIds.has(student.id));
  };
  
  // Get fuzzy match statistics - unused for now
  // const getFuzzyMatchStats = () => {
  //   const totalFuzzyMatches = csvMatches.reduce((count, match) => 
  //     count + (match.fuzzyMatches?.length || 0), 0
  //   );
  //   const highConfidenceFuzzy = csvMatches.reduce((count, match) => 
  //     count + (match.fuzzyMatches?.filter(f => f.score >= 85).length || 0), 0
  //   );
  //   const mediumConfidenceFuzzy = csvMatches.reduce((count, match) => 
  //     count + (match.fuzzyMatches?.filter(f => f.score >= 70 && f.score < 85).length || 0), 0
  //   );
  //   const lowConfidenceFuzzy = csvMatches.reduce((count, match) => 
  //     count + (match.fuzzyMatches?.filter(f => f.score >= 50 && f.score < 70).length || 0), 0
  //   );
  //   
  //   return {
  //     totalFuzzyMatches,
  //     highConfidenceFuzzy,
  //     mediumConfidenceFuzzy,
  //     lowConfidenceFuzzy
  //   };
  // };
  
  // const fuzzyStats = getFuzzyMatchStats(); // Unused for now

  // Generate attendance report text
  const generateAttendanceReport = () => {
    const presentRecords = attendanceRecords.filter(r => r.status === 'present');
    const presentStudents = presentRecords.map(record => {
      const student = students.find(s => s.id === record.student_id);
      return student?.name || 'Unknown Student';
    }).sort();

    const absentStudents = students
      .filter(student => !attendanceRecords.some(record => record.student_id === student.id && record.status === 'present'))
      .map(student => student.name)
      .sort();

    const attendanceRate = students.length > 0 ? Math.round((presentRecords.length / students.length) * 100) : 0;

    let report = `Total Enrolled: ${students.length}\n`;
    report += `-- Total Attendees: ${presentRecords.length}\n`;
    report += `-- Present: ${presentRecords.length}/${students.length} (${attendanceRate}%)\n`;
    report += `-- Absent: ${absentStudents.length}\n\n`;

    if (presentStudents.length > 0) {
      report += `Attendance: ${presentStudents.length}\n`;
      presentStudents.forEach(name => {
        report += `${name}\n`;
      });
    } else {
      report += `Attendance: 0\n`;
    }

    if (absentStudents.length > 0) {
      report += `\nAbsent: ${absentStudents.length}\n`;
      absentStudents.forEach(name => {
        report += `${name}\n`;
      });
    } else {
      report += `\nAbsent: 0\n`;
    }

    return report;
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meeting...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !meeting) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Meeting not found'}</p>
          <Button onClick={() => router.push('/attendance')}>Back to Attendance</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Meeting Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <Button 
                    onClick={() => router.push('/attendance')}
                    variant="outline"
                    size="sm"
                  >
                    ← Back to Attendance
                  </Button>
                  <h1 className="text-3xl font-bold text-gray-900">{meeting.meeting_title}</h1>
                </div>
                <p className="text-gray-600">
                  {classData?.name} • {new Date(meeting.meeting_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex space-x-3">
                {attendanceRecords.length > 0 && (
                  <Button 
                    onClick={() => setCsvUploadOpen(true)}
                    variant="outline"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    Add More Attendance
                  </Button>
                )}
                <Button 
                  onClick={() => setMeetingDialogOpen(true)}
                  variant="outline"
                >
                  Edit Meeting
                </Button>
              </div>
            </div>
          </div>

        {/* Attendance Status */}
        {attendanceRecords.length > 0 ? (
          <div className="space-y-6 mb-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Class Roster */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Class Roster</p>
                    <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
                  </div>
                </div>
              </div>

              {/* Present Students */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {attendanceRecords.filter(r => r.status === 'present').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Absent Students */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {students.length - attendanceRecords.filter(r => r.status === 'present').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-semibold text-blue-600">
                      <span className="mr-2">{students.length > 0 ? Math.round((attendanceRecords.filter(r => r.status === 'present').length / students.length) * 100) : 0}%</span>
                      <span className="text-sm text-gray-600">({attendanceRecords.filter(r => r.status === 'present').length} / {students.length})</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Attendance Rate Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                    <span className="text-sm font-bold text-green-600">
                      {students.length > 0 ? Math.round((attendanceRecords.filter(r => r.status === 'present').length / students.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${students.length > 0 ? Math.round((attendanceRecords.filter(r => r.status === 'present').length / students.length) * 100) : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Present:</span>
                    <span className="ml-2 font-medium text-green-600">{attendanceRecords.filter(r => r.status === 'present').length} students</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Absent:</span>
                    <span className="ml-2 font-medium text-red-600">{students.length - attendanceRecords.filter(r => r.status === 'present').length} students</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Recorded:</span>
                    <span className="ml-2 font-medium">{attendanceRecords.length} students</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Class Size:</span>
                    <span className="ml-2 font-medium">{students.length} students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Present Students List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  Present Students ({attendanceRecords.filter(r => r.status === 'present').length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Students who attended this meeting
                </p>
              </div>
              <div className="p-6">
                {attendanceRecords.filter(r => r.status === 'present').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attendanceRecords
                      .filter(r => r.status === 'present')
                      .map((record) => {
                        const student = students.find(s => s.id === record.student_id);
                        return (
                          <div
                            key={record.id}
                            className="p-3 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{student?.name || 'Unknown Student'}</p>
                                <p className="text-sm text-gray-600">{student?.email || 'No email'}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-medium text-green-600">Present</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No Students Present</h4>
                    <p className="text-xs text-gray-600">
                      No attendance has been recorded for this meeting yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Absent Students List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  Absent Students ({students.length - attendanceRecords.filter(r => r.status === 'present').length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Students who did not attend this meeting
                </p>
              </div>
              <div className="p-6">
                {students.length - attendanceRecords.filter(r => r.status === 'present').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {students
                      .filter(student => !attendanceRecords.some(record => record.student_id === student.id && record.status === 'present'))
                      .map((student) => (
                        <div
                          key={student.id}
                          className="p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-medium text-red-600">Absent</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Perfect Attendance!</h4>
                    <p className="text-xs text-gray-600">
                      All students in the class attended this meeting.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Text Report Template */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Attendance Report</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Text format for easy copying and sharing
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const reportText = generateAttendanceReport();
                      navigator.clipboard.writeText(reportText).then(() => {
                        toast.success('Report copied to clipboard!');
                      }).catch(() => {
                        toast.error('Failed to copy report');
                      });
                    }}
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Report
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {generateAttendanceReport()}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : csvMatches.length > 0 ? (
          /* CSV Matching Interface */
          <div className="flex gap-6">
            {/* Main Content - 2/3 width */}
            <div className="w-2/3 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Total Class Roster */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Class Roster</p>
                    <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
                  </div>
                </div>
              </div>

              {/* Total Zoom Attendance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Zoom Attendance</p>
                    <p className="text-2xl font-semibold text-blue-600">{summary?.totalParticipants || 0}</p>
                  </div>
                </div>
              </div>

              {/* Matched Students */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Matched</p>
                    <p className="text-2xl font-semibold text-green-600">{getSelectedCount()}</p>
                  </div>
                </div>
              </div>

              {/* Absent Students */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-semibold text-red-600">{students.length - getSelectedCount()}</p>
                  </div>
                </div>
              </div>

              {/* Needs Review */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Needs Review</p>
                    <p className="text-2xl font-semibold text-yellow-600">
                      {Math.max(0, (summary?.noMatches || 0) - (getSelectedCount() - (summary?.exactMatches || 0)))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Matched Participants */}
            {matchedParticipants.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    Matched Participants ({matchedParticipants.length})
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    These participants have been matched to students (auto-matched or manually assigned)
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {matchedParticipants.map((match, index) => {
                      const participantKey = getParticipantKey(match.participant);
                      const selectedStudentId = selectedStudents.get(participantKey);
                      const selectedStudent = selectedStudentId ? getStudentById(selectedStudentId) : null;

                      return (
                        <div
                          key={index}
                          className="p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {match.participant.name || 'Unknown Name'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {match.participant.email}
                              </p>
                              {selectedStudent && (
                                <p className="text-sm text-green-700 mt-1">
                                  ✓ Matched to: <strong>{selectedStudent.name}</strong>
                                </p>
                              )}
                            </div>
                            <div className="ml-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {match.matchType === 'exact' ? 'Auto-Matched (Email)' : 
                                 match.matchType === 'fuzzy' ? 'Auto-Matched (Name)' : 'Manually Matched'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Unmatched Participants */}
            {unmatchedParticipants.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                        Participants Needing Review ({unmatchedParticipants.length})
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Please manually assign these participants to students
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Approve all high confidence fuzzy matches for unassigned students
                          unmatchedParticipants.forEach(match => {
                            if (match.fuzzyMatches && match.fuzzyMatches.length > 0) {
                              const availableFuzzyMatches = getFilteredFuzzyMatches(match.fuzzyMatches);
                              const highConfidenceMatch = availableFuzzyMatches.find(f => f.score >= 85);
                              if (highConfidenceMatch) {
                                const participantKey = getParticipantKey(match.participant);
                                handleStudentSelect(participantKey, highConfidenceMatch.student.id);
                              }
                            }
                          });
                        }}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        ✓ Approve All High Confidence
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {unmatchedParticipants.map((match, index) => {
                      const participantKey = getParticipantKey(match.participant);
                      const selectedStudentId = selectedStudents.get(participantKey);
                      const selectedStudent = selectedStudentId ? getStudentById(selectedStudentId) : null;

                      return (
                        <div
                          key={index}
                          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {match.participant.name || 'Unknown Name'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {match.participant.email || 'No email provided'}
                                </p>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Needs Review
                              </span>
                            </div>

                            {/* Student Selection */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Assign to Student:
                              </label>
                              <select
                                value={selectedStudentId || ''}
                                onChange={(e) => handleStudentSelect(participantKey, e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="">Select a student...</option>
                                {getAvailableStudents().map(student => (
                                  <option key={student.id} value={student.id}>
                                    {student.name} ({student.email})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Show selected student */}
                            {selectedStudent && (
                              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800">
                                  ✓ Assigned to: <strong>{selectedStudent.name}</strong>
                                </p>
                              </div>
                            )}
                            
                            {/* Show if no available students */}
                            {getAvailableStudents().length === 0 && !selectedStudent && (
                              <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                                <p className="text-sm text-gray-600">
                                  All students have been assigned to other participants
                                </p>
                              </div>
                            )}


                            {/* Fuzzy Match Suggestions */}
                            {match.fuzzyMatches && getFilteredFuzzyMatches(match.fuzzyMatches).length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Suggested Matches:</p>
                                <div className="space-y-2">
                                  {getFilteredFuzzyMatches(match.fuzzyMatches).slice(0, 3).map((fuzzyMatch, fuzzyIndex) => {
                                    const isHighConfidence = fuzzyMatch.score >= 85;
                                    const isMediumConfidence = fuzzyMatch.score >= 70 && fuzzyMatch.score < 85;
                                    // const isLowConfidence = fuzzyMatch.score >= 50 && fuzzyMatch.score < 70; // Unused for now
                                    
                                    return (
                                      <div 
                                        key={fuzzyIndex}
                                        className={`p-3 rounded-lg border ${
                                          isHighConfidence ? 'bg-green-50 border-green-200' :
                                          isMediumConfidence ? 'bg-yellow-50 border-yellow-200' :
                                          'bg-orange-50 border-orange-200'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                              <span className="font-medium text-gray-900">{fuzzyMatch.student.name}</span>
                                              <span className="text-sm text-gray-600">({fuzzyMatch.student.email})</span>
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                isHighConfidence ? 'bg-green-100 text-green-800' :
                                                isMediumConfidence ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-orange-100 text-orange-800'
                                              }`}>
                                                {fuzzyMatch.score}% match
                                              </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              {fuzzyMatch.reasons.join(', ')}
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            className={`${
                                              isHighConfidence ? 'bg-green-600 hover:bg-green-700' :
                                              isMediumConfidence ? 'bg-yellow-600 hover:bg-yellow-700' :
                                              'bg-orange-600 hover:bg-orange-700'
                                            } text-white`}
                                            onClick={() => handleStudentSelect(participantKey, fuzzyMatch.student.id)}
                                          >
                                            ✓ Approve
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Legacy suggestions (email domain matches) */}
                            {getFilteredSuggestions(match.suggestions).length > 0 && (
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Other suggestions:</p>
                                <div className="flex flex-wrap gap-1">
                                  {getFilteredSuggestions(match.suggestions).map(student => (
                                    <button
                                      key={student.id}
                                      onClick={() => handleStudentSelect(participantKey, student.id)}
                                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border"
                                    >
                                      {student.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Save Attendance</h3>
                  <p className="text-sm text-gray-600">
                    {getSelectedCount()} participants will be marked as present
                  </p>
                </div>
                <Button
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance || getSelectedCount() === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingAttendance ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    `Save Attendance (${getSelectedCount()} students)`
                  )}
                </Button>
              </div>
            </div>
            </div>
            
            {/* Right Sidebar - Absent Students - 1/3 width */}
            <div className="w-1/3 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    Absent Students ({getAbsentStudents().length})
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    These students from the class roster have no matching participant in the Zoom call. 
                    They will be marked as absent unless a participant is assigned to them during review.
                  </p>
                </div>
                
                {getAbsentStudents().length > 0 ? (
                  <div className="space-y-2 overflow-y-auto">
                    {getAbsentStudents().map((student) => (
                      <div
                        key={student.id}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{student.name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">All Students Present!</h4>
                    <p className="text-xs text-gray-600">
                      Every student in the roster has been matched to a participant.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CSV Drop Zone */
          <div className="bg-white rounded-lg shadow-sm border">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <h3 className="text-lg font-medium text-gray-900">Processing CSV...</h3>
                  <p className="text-gray-600">Please wait while we parse your file and match participants.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Drop your CSV file here
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your Zoom participants CSV file to start tracking attendance
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV files only, max 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Meeting Form Dialog */}
      <MeetingFormDialog
        open={meetingDialogOpen}
        onOpenChange={setMeetingDialogOpen}
        meetingData={meeting}
        classId={meeting?.class_id || ''}
        onSubmit={handleMeetingSubmit}
        mode="edit"
        isSubmitting={isSubmittingMeeting}
      />

      {/* CSV Upload Dialog */}
      <CSVUploadDialog
        open={csvUploadOpen}
        onOpenChange={setCsvUploadOpen}
        meetingId={meetingId}
        meetingTitle={meeting?.meeting_title || 'Meeting'}
        students={students}
        onUploadComplete={handleCSVUploadComplete}
        isUploading={isUploading}
      />

    </>
  );
}
