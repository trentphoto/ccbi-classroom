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
import { User } from '@/types/db';
import { ParticipantMatch } from '@/lib/csv-parser';
import { MatchingSuggestion, processParticipantMatches, getMatchingStats, FuzzyMatch } from '@/lib/fuzzy-matching';

interface AttendanceReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: ParticipantMatch[];
  students: User[];
  meetingId: string;
  meetingTitle: string;
  onSaveAttendance: (attendanceData: { meeting_id: string; student_id: string; status: string; notes: string | null; verified_by: string | null }[]) => void;
  isSaving?: boolean;
}

export default function AttendanceReviewDialog({
  open,
  onOpenChange,
  matches,
  students,
  meetingId,
  meetingTitle,
  onSaveAttendance,
  isSaving = false
}: AttendanceReviewDialogProps) {
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [selectedStudents, setSelectedStudents] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [fuzzyMatches, setFuzzyMatches] = useState<MatchingSuggestion[]>([]);

  // Process fuzzy matches when dialog opens
  useEffect(() => {
    if (open && matches.length > 0) {
      const participants = matches.map(m => m.participant);
      const suggestions = processParticipantMatches(participants, students);
      setFuzzyMatches(suggestions);
    }
  }, [open, matches, students]);

  // Initialize selected students with exact matches and high-confidence fuzzy matches
  useEffect(() => {
    if (open && fuzzyMatches.length > 0) {
      const initialSelections = new Map<string, string>();
      
      // First, add exact email matches
      matches.forEach(match => {
        if (match.matchType === 'exact' && match.student) {
          const key = match.participant.email || match.participant.name || `participant_${match.participant.name}`;
          initialSelections.set(key, match.student.id);
        }
      });

      // Then, add high-confidence fuzzy matches
      fuzzyMatches.forEach(suggestion => {
        const key = suggestion.participant.email || suggestion.participant.name || `participant_${suggestion.participant.name}`;
        if (!initialSelections.has(key)) {
          if (suggestion.exactMatch) {
            initialSelections.set(key, suggestion.exactMatch.id);
          } else if (suggestion.confidence === 'high' && suggestion.fuzzyMatches.length > 0) {
            initialSelections.set(key, suggestion.fuzzyMatches[0].student.id);
          }
        }
      });

      setSelectedStudents(initialSelections);
      setError(null);
    }
  }, [open, matches, fuzzyMatches]);

  const getParticipantKey = (participant: { email?: string; name?: string }) => {
    return participant.email || participant.name || `participant_${participant.name}`;
  };

  const handleStudentSelect = (participantKey: string, studentId: string) => {
    setSelectedStudents(prev => {
      const newMap = new Map(prev);
      if (studentId === '') {
        newMap.delete(participantKey);
      } else {
        newMap.set(participantKey, studentId);
      }
      return newMap;
    });
  };

  const handleQuickConfirm = (participantKey: string, studentId: string) => {
    handleStudentSelect(participantKey, studentId);
  };

  const handleSave = () => {
    try {
      const attendanceData: { meeting_id: string; student_id: string; status: string; notes: string | null; verified_by: string | null }[] = [];
      
      // Process both original matches and fuzzy matches
      fuzzyMatches.forEach(suggestion => {
        const participantKey = getParticipantKey(suggestion.participant);
        const selectedStudentId = selectedStudents.get(participantKey);
        
        if (selectedStudentId) {
          attendanceData.push({
            meeting_id: meetingId,
            student_id: selectedStudentId,
            status: 'present' as const,
            notes: null,
            verified_by: null // Will be set by the backend
          });
        }
      });

      if (attendanceData.length === 0) {
        setError('Please assign at least one participant to a student');
        return;
      }

      onSaveAttendance(attendanceData);
    } catch (err) {
      console.error('Error preparing attendance data:', err);
      setError('Failed to prepare attendance data');
    }
  };

  const handleCancel = () => {
    setSelectedStudents(new Map());
    setError(null);
    setFilter('all');
    onOpenChange(false);
  };

  const getStudentById = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const getSelectedCount = () => {
    return selectedStudents.size;
  };

  const stats = getMatchingStats(fuzzyMatches);
  
  // Separate matches by confidence level
  const exactMatches = fuzzyMatches.filter(s => s.exactMatch);
  const highConfidenceMatches = fuzzyMatches.filter(s => !s.exactMatch && s.confidence === 'high');
  const mediumConfidenceMatches = fuzzyMatches.filter(s => !s.exactMatch && s.confidence === 'medium');
  const lowConfidenceMatches = fuzzyMatches.filter(s => !s.exactMatch && s.confidence === 'low');
  const noMatches = fuzzyMatches.filter(s => !s.exactMatch && s.confidence === 'none');

  const getFilteredMatches = () => {
    switch (filter) {
      case 'matched':
        return [...exactMatches, ...highConfidenceMatches];
      case 'unmatched':
        return [...mediumConfidenceMatches, ...lowConfidenceMatches, ...noMatches];
      default:
        return fuzzyMatches;
    }
  };

  const filteredMatches = getFilteredMatches();

  const renderMatchItem = (suggestion: MatchingSuggestion) => {
    const participantKey = getParticipantKey(suggestion.participant);
    const selectedStudentId = selectedStudents.get(participantKey);
    const selectedStudent = selectedStudentId ? getStudentById(selectedStudentId) : null;

    return (
      <div key={participantKey} className="border rounded-lg p-4 bg-white">
        <div className="space-y-4">
          {/* Participant Info */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{suggestion.participant.name || 'Unknown Name'}</h4>
              <p className="text-sm text-gray-600">{suggestion.participant.email || 'No email provided'}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              suggestion.confidence === 'high' ? 'bg-green-100 text-green-800' :
              suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              suggestion.confidence === 'low' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {suggestion.exactMatch ? 'Exact Match' : 
               suggestion.confidence === 'high' ? 'High Confidence' :
               suggestion.confidence === 'medium' ? 'Medium Confidence' :
               suggestion.confidence === 'low' ? 'Low Confidence' : 'No Match'}
            </div>
          </div>

          {/* Exact Match */}
          {suggestion.exactMatch && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-900">{suggestion.exactMatch.name}</span>
                  <span className="text-sm text-green-700">({suggestion.exactMatch.email})</span>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleQuickConfirm(participantKey, suggestion.exactMatch!.id)}
                >
                  ✓ Confirmed
                </Button>
              </div>
              <p className="text-xs text-green-700 mt-1">Email addresses match exactly</p>
            </div>
          )}

          {/* Fuzzy Matches */}
          {!suggestion.exactMatch && suggestion.fuzzyMatches.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Suggested Matches:</h5>
              {suggestion.fuzzyMatches.slice(0, 3).map((fuzzyMatch: FuzzyMatch, index: number) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-900">{fuzzyMatch.student.name}</span>
                        <span className="text-sm text-blue-700">({fuzzyMatch.student.email})</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {fuzzyMatch.score}% match
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {fuzzyMatch.reasons.join(', ')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      onClick={() => handleQuickConfirm(participantKey, fuzzyMatch.student.id)}
                    >
                      ✓ Confirm
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Manual Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Manual Selection:
            </label>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => handleStudentSelect(participantKey, e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          {/* Current Selection */}
          {selectedStudent && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Selected: </span>
                  <span className="text-sm text-gray-700">{selectedStudent.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStudentSelect(participantKey, '')}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Attendance Matches</DialogTitle>
          <DialogDescription>
            Review and confirm participant matches for: <strong>{meetingTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.totalParticipants}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-900">{stats.exactMatches}</div>
              <div className="text-xs text-green-700">Exact</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-900">{stats.highConfidenceMatches}</div>
              <div className="text-xs text-emerald-700">High Conf.</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-900">{stats.mediumConfidenceMatches}</div>
              <div className="text-xs text-yellow-700">Medium Conf.</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-900">{stats.noMatches}</div>
              <div className="text-xs text-red-700">Need Review</div>
            </div>
          </div>

          {/* Match Rate */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Match Rate:</span>
              <span className={`text-lg font-bold ${
                stats.matchRate >= 80 ? 'text-green-600' :
                stats.matchRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.matchRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  stats.matchRate >= 80 ? 'bg-green-600' :
                  stats.matchRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${stats.matchRate}%` }}
              ></div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All', count: fuzzyMatches.length },
              { key: 'matched', label: 'Matched', count: exactMatches.length + highConfidenceMatches.length },
              { key: 'unmatched', label: 'Need Review', count: mediumConfidenceMatches.length + lowConfidenceMatches.length + noMatches.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as 'all' | 'matched' | 'unmatched')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Matches List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredMatches.map(renderMatchItem)}
          </div>

          {filteredMatches.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No matches found for the selected filter.</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {getSelectedCount()} of {fuzzyMatches.length} participants assigned
            </div>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || getSelectedCount() === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}