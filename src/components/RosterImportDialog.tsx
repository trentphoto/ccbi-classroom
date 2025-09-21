'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { validateCSVFile, formatFileSize } from '@/lib/csv-upload';
import { User, UserRole } from '@/types/db';
import { db } from '@/lib/supabase/database';
import Papa from 'papaparse';

interface RosterStudent {
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  studentId?: string;
  grade?: string;
  [key: string]: string | number | undefined;
}

interface RosterImportResult {
  students: RosterStudent[];
  errors: string[];
  warnings: string[];
}

interface RosterImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  onImportComplete: (importedStudents: User[], skippedUsers: Array<{ name: string; email: string; reason: string }>) => void;
  isImporting?: boolean;
}

// Utility function for testing header mapping with partial matching
export const testHeaderMapping = (header: string): string => {
  const normalized = header.toLowerCase().trim();

  const headerPatterns: Array<{ pattern: string; mappedTo: string; priority: number }> = [
    // Full name variations (highest priority)
    { pattern: 'legal full name', mappedTo: 'name', priority: 10 },
    { pattern: 'full name', mappedTo: 'name', priority: 9 },
    { pattern: 'student name', mappedTo: 'name', priority: 8 },
    { pattern: 'complete name', mappedTo: 'name', priority: 7 },
    { pattern: 'official name', mappedTo: 'name', priority: 6 },
    { pattern: 'birth name', mappedTo: 'name', priority: 6 },
    { pattern: 'registered name', mappedTo: 'name', priority: 5 },

    // First name variations
    { pattern: 'first name', mappedTo: 'firstName', priority: 9 },
    { pattern: 'given name', mappedTo: 'firstName', priority: 8 },
    { pattern: 'forename', mappedTo: 'firstName', priority: 7 },
    { pattern: 'firstname', mappedTo: 'firstName', priority: 6 },

    // Last name variations
    { pattern: 'last name', mappedTo: 'lastName', priority: 9 },
    { pattern: 'surname', mappedTo: 'lastName', priority: 8 },
    { pattern: 'family name', mappedTo: 'lastName', priority: 8 },
    { pattern: 'lastname', mappedTo: 'lastName', priority: 6 },

    // Middle name variations
    { pattern: 'middle name', mappedTo: 'middleName', priority: 7 },
    { pattern: 'middle initial', mappedTo: 'middleName', priority: 6 },
    { pattern: 'middlename', mappedTo: 'middleName', priority: 5 },

    // Email variations
    { pattern: 'email address', mappedTo: 'email', priority: 10 },
    { pattern: 'student email', mappedTo: 'email', priority: 9 },
    { pattern: 'school email', mappedTo: 'email', priority: 8 },
    { pattern: 'university email', mappedTo: 'email', priority: 8 },
    { pattern: 'college email', mappedTo: 'email', priority: 8 },
    { pattern: 'email', mappedTo: 'email', priority: 5 },
    { pattern: 'e-mail', mappedTo: 'email', priority: 4 },

    // Phone variations
    { pattern: 'phone number', mappedTo: 'phone', priority: 8 },
    { pattern: 'mobile', mappedTo: 'phone', priority: 7 },
    { pattern: 'cell', mappedTo: 'phone', priority: 6 },
    { pattern: 'contact number', mappedTo: 'phone', priority: 5 },

    // Student ID variations
    { pattern: 'student id', mappedTo: 'studentId', priority: 8 },
    { pattern: 'student number', mappedTo: 'studentId', priority: 7 },
    { pattern: 'studentid', mappedTo: 'studentId', priority: 6 },

    // Grade/Class variations
    { pattern: 'grade', mappedTo: 'grade', priority: 6 },
    { pattern: 'class', mappedTo: 'grade', priority: 5 },
    { pattern: 'year', mappedTo: 'grade', priority: 4 },
    { pattern: 'level', mappedTo: 'grade', priority: 4 },
    { pattern: 'course', mappedTo: 'grade', priority: 3 },

    // Generic fallbacks (lowest priority)
    { pattern: 'name', mappedTo: 'name', priority: 1 },
    { pattern: 'first', mappedTo: 'firstName', priority: 1 },
    { pattern: 'last', mappedTo: 'lastName', priority: 1 },
    { pattern: 'id', mappedTo: 'studentId', priority: 1 },
    { pattern: 'phone', mappedTo: 'phone', priority: 1 }
  ];

  // Find the best match using partial string matching
  let bestMatch: { mappedTo: string; priority: number; pattern: string } | null = null;

  for (const { pattern, mappedTo, priority } of headerPatterns) {
    if (normalized.includes(pattern)) {
      // Skip church/organization related headers when mapping to personal name
      if (mappedTo === 'name' && 
          (normalized.includes('church') || 
           normalized.includes('organization') || 
           normalized.includes('company') ||
           normalized.includes('institution'))) {
        continue;
      }
      
      // If we find an exact match, use it immediately
      if (normalized === pattern && priority >= 8) {
        return mappedTo;
      }

      // For partial matches, track the best one by priority
      if (!bestMatch || priority > bestMatch.priority) {
        bestMatch = { mappedTo, priority, pattern };
      }
    }
  }

  // Use the best partial match if found
  return bestMatch ? bestMatch.mappedTo : normalized;
};

export default function RosterImportDialog({
  open,
  onOpenChange,
  classId,
  className,
  onImportComplete,
  // isImporting = false // Unused for now
}: RosterImportDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsingResult, setParsingResult] = useState<RosterImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentUser: '' });
  const [skippedUsers, setSkippedUsers] = useState<Array<{ name: string; email: string; reason: string }>>([]);
  const [importCompleted, setImportCompleted] = useState(false);
  const [importedUsers, setImportedUsers] = useState<User[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(null);
    setParsingResult(null);

    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      const result = await parseRosterCSV(file);
      setParsingResult(result);
      
      if (result.errors.length > 0) {
        setError(`CSV parsing errors: ${result.errors.join(', ')}`);
        return;
      }
      
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsParsing(false);
    }
  };

  const parseRosterCSV = (file: File): Promise<RosterImportResult> => {
    const CSV_PARSE_TIMEOUT = 60000; // 60 second timeout for CSV parsing

    return withTimeout(
      new Promise<RosterImportResult>((resolve) => {
        const result: RosterImportResult = {
          students: [],
          errors: [],
          warnings: []
        };

        Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Handle undefined, null, or empty headers
          if (!header || typeof header !== 'string') {
            return 'unknown_column';
          }

          // Normalize common roster CSV headers
          const normalized = header.toLowerCase().trim();
          // const originalHeader = header; // Unused for now

          // Skip empty headers
          if (!normalized) {
            return 'empty_column';
          }

          // Comprehensive header mapping patterns for flexible name matching
          // Using partial string matching (contains) for maximum flexibility
          const headerPatterns: Array<{ pattern: string; mappedTo: string; priority: number }> = [
            // Full name variations (highest priority)
            { pattern: 'legal full name', mappedTo: 'name', priority: 10 },
            { pattern: 'full name', mappedTo: 'name', priority: 9 },
            { pattern: 'student name', mappedTo: 'name', priority: 8 },
            { pattern: 'complete name', mappedTo: 'name', priority: 7 },
            { pattern: 'official name', mappedTo: 'name', priority: 6 },
            { pattern: 'birth name', mappedTo: 'name', priority: 6 },
            { pattern: 'registered name', mappedTo: 'name', priority: 5 },

            // First name variations
            { pattern: 'first name', mappedTo: 'firstName', priority: 9 },
            { pattern: 'given name', mappedTo: 'firstName', priority: 8 },
            { pattern: 'forename', mappedTo: 'firstName', priority: 7 },
            { pattern: 'firstname', mappedTo: 'firstName', priority: 6 },

            // Last name variations
            { pattern: 'last name', mappedTo: 'lastName', priority: 9 },
            { pattern: 'surname', mappedTo: 'lastName', priority: 8 },
            { pattern: 'family name', mappedTo: 'lastName', priority: 8 },
            { pattern: 'lastname', mappedTo: 'lastName', priority: 6 },

            // Middle name variations
            { pattern: 'middle name', mappedTo: 'middleName', priority: 7 },
            { pattern: 'middle initial', mappedTo: 'middleName', priority: 6 },
            { pattern: 'middlename', mappedTo: 'middleName', priority: 5 },

            // Email variations
            { pattern: 'email address', mappedTo: 'email', priority: 10 },
            { pattern: 'student email', mappedTo: 'email', priority: 9 },
            { pattern: 'school email', mappedTo: 'email', priority: 8 },
            { pattern: 'university email', mappedTo: 'email', priority: 8 },
            { pattern: 'college email', mappedTo: 'email', priority: 8 },
            { pattern: 'email', mappedTo: 'email', priority: 5 },
            { pattern: 'e-mail', mappedTo: 'email', priority: 4 },

            // Phone variations
            { pattern: 'phone number', mappedTo: 'phone', priority: 8 },
            { pattern: 'mobile', mappedTo: 'phone', priority: 7 },
            { pattern: 'cell', mappedTo: 'phone', priority: 6 },
            { pattern: 'contact number', mappedTo: 'phone', priority: 5 },

            // Student ID variations
            { pattern: 'student id', mappedTo: 'studentId', priority: 8 },
            { pattern: 'student number', mappedTo: 'studentId', priority: 7 },
            { pattern: 'studentid', mappedTo: 'studentId', priority: 6 },

            // Grade/Class variations
            { pattern: 'grade', mappedTo: 'grade', priority: 6 },
            { pattern: 'class', mappedTo: 'grade', priority: 5 },
            { pattern: 'year', mappedTo: 'grade', priority: 4 },
            { pattern: 'level', mappedTo: 'grade', priority: 4 },
            { pattern: 'course', mappedTo: 'grade', priority: 3 },

            // Generic fallbacks (lowest priority) - exclude church/organization names
            { pattern: 'name', mappedTo: 'name', priority: 1 },
            { pattern: 'first', mappedTo: 'firstName', priority: 1 },
            { pattern: 'last', mappedTo: 'lastName', priority: 1 },
            { pattern: 'id', mappedTo: 'studentId', priority: 1 },
            { pattern: 'phone', mappedTo: 'phone', priority: 1 }
          ];

          // Find the best match using partial string matching
          let bestMatch: { mappedTo: string; priority: number; pattern: string } | null = null;

          for (const { pattern, mappedTo, priority } of headerPatterns) {
            if (normalized.includes(pattern)) {
              // Skip church/organization related headers when mapping to personal name
              if (mappedTo === 'name' && 
                  (normalized.includes('church') || 
                   normalized.includes('organization') || 
                   normalized.includes('company') ||
                   normalized.includes('institution'))) {
                continue;
              }
              
              // If we find an exact match, use it immediately
              if (normalized === pattern && priority >= 8) {
                return mappedTo;
              }

              // For partial matches, track the best one by priority
              if (!bestMatch || priority > bestMatch.priority) {
                bestMatch = { mappedTo, priority, pattern };
              }
            }
          }

          // Use the best partial match if found
          if (bestMatch) {
            return bestMatch.mappedTo;
          }

          return normalized;
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            result.errors.push(...results.errors.map(err => err.message));
          }

          // Process each row
          let skippedRows = 0;
          results.data.forEach((row: unknown, index) => {
            const student = processStudentRow(row, index + 1);
            if (student) {
              result.students.push(student);
            } else {
              skippedRows++;
            }
          });

          // Add summary of skipped rows if any
          if (skippedRows > 0) {
            result.warnings.push(`${skippedRows} rows were skipped due to missing or invalid data (blank names, invalid emails, etc.)`);
          }

          // Validate results
          validateStudents(result);

          resolve(result);
        },
        error: (error) => {
          result.errors.push(`CSV parsing error: ${error.message}`);
          resolve(result);
        }
      });
      }),
      CSV_PARSE_TIMEOUT,
      'CSV parsing'
    );
  };

  const processStudentRow = (row: unknown, _rowNumber: number): RosterStudent | null => {
    // Type guard to ensure row is an object
    if (!row || typeof row !== 'object') {
      return null;
    }
    
    const rowData = row as Record<string, string | number>;
    let name = '';
    let email = '';

    // Flexible name construction with multiple strategies
    const buildFullName = (row: Record<string, string | number>): string => {
      // Strategy 1: Use direct full name if available
      if (row.name && typeof row.name === 'string' && row.name.trim()) {
        return row.name.trim();
      }

      // Strategy 2: Combine first and last name
      if (row.firstName && row.lastName && typeof row.firstName === 'string' && typeof row.lastName === 'string') {
        let fullName = `${row.firstName.trim()} ${row.lastName.trim()}`;

        // Add middle name/initial if available
        if (row.middleName && typeof row.middleName === 'string' && row.middleName.trim()) {
          // Insert middle name between first and last
          const middle = row.middleName.trim();
          // If middle name is just an initial (1-2 characters), format differently
          if (middle.length <= 2) {
            fullName = `${row.firstName.trim()} ${middle}. ${row.lastName.trim()}`;
          } else {
            fullName = `${row.firstName.trim()} ${middle} ${row.lastName.trim()}`;
          }
        }

        return fullName;
      }

      // Strategy 3: Use first name only (less ideal but better than nothing)
      if (row.firstName && typeof row.firstName === 'string' && row.firstName.trim()) {
        return row.firstName.trim();
      }

      // Strategy 4: Use last name only (least preferred)
      if (row.lastName && typeof row.lastName === 'string' && row.lastName.trim()) {
        return row.lastName.trim();
      }

      return '';
    };

    // Build the full name using the flexible strategy
    name = buildFullName(rowData);

    // Handle email with multiple variations
    if (rowData.email && typeof rowData.email === 'string') {
      email = rowData.email.trim().toLowerCase();
    }

    // Skip rows without essential data - be more lenient about blank rows
    if (!name && !email) {
      // Skip completely empty rows silently
      return null;
    }

    // Handle blank names - skip the row with a warning instead of error
    if (!name || name.trim() === '') {
      return null;
    }

    // Handle missing emails - also skip with warning
    if (!email || email.trim() === '') {
      return null;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return null;
    }

    return {
      name: name.trim(),
      email: email.trim(),
      firstName: (typeof rowData.firstName === 'string' ? rowData.firstName.trim() : '') || '',
      lastName: (typeof rowData.lastName === 'string' ? rowData.lastName.trim() : '') || '',
      middleName: (typeof rowData.middleName === 'string' ? rowData.middleName.trim() : '') || '',
      phone: (typeof rowData.phone === 'string' ? rowData.phone.trim() : '') || '',
      studentId: (typeof rowData.studentId === 'string' ? rowData.studentId.trim() : '') || '',
      grade: (typeof rowData.grade === 'string' ? rowData.grade.trim() : '') || '',
      ...rowData // Keep any additional fields
    };
  };

  const validateStudents = (result: RosterImportResult): void => {
    const { students } = result;

    if (students.length === 0) {
      result.errors.push('No valid students found in CSV file');
      return;
    }

    // Check for duplicate emails
    const emailCounts = new Map<string, number>();
    students.forEach(s => {
      emailCounts.set(s.email, (emailCounts.get(s.email) || 0) + 1);
    });

    emailCounts.forEach((count, email) => {
      if (count > 1) {
        result.warnings.push(`Duplicate email found: ${email} (${count} times)`);
      }
    });

    // Check for duplicate names (warning only)
    const nameCounts = new Map<string, number>();
    students.forEach(s => {
      nameCounts.set(s.name.toLowerCase(), (nameCounts.get(s.name.toLowerCase()) || 0) + 1);
    });

    nameCounts.forEach((count, name) => {
      if (count > 1) {
        result.warnings.push(`Duplicate name found: ${name} (${count} times)`);
      }
    });
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Timeout wrapper for individual student operations
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  };

  const handleImport = async () => {
    if (!parsingResult || parsingResult.students.length === 0) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setImportProgress({ current: 0, total: parsingResult.students.length, currentUser: '' });

    try {
      const importedUsers: User[] = [];
      const TIMEOUT_MS = 30000; // 30 second timeout per student

        // Create users and enrollments
        for (let i = 0; i < parsingResult.students.length; i++) {
          const student = parsingResult.students[i];

          // Update progress
          setImportProgress({
            current: i + 1,
            total: parsingResult.students.length,
            currentUser: student.name
          });

          try {
            // Create user with timeout
            const newUser = await withTimeout(
              db.createUser({
                email: student.email,
                name: student.name,
                role: UserRole.STUDENT,
                brand_id: '', // Will be set by the database service
                is_active: false, // Fixed: should be false initially
                deactivated_at: null
              }),
              TIMEOUT_MS,
              `Creating user ${student.name}`
            ) as User;

            // Create enrollment with timeout
            await withTimeout(
              db.createEnrollment({
                user_id: newUser.id,
                class_id: classId
              }),
              TIMEOUT_MS,
              `Creating enrollment for ${student.name}`
            );

            importedUsers.push(newUser);
        } catch (userError) {
          const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';

          // Check if this is a duplicate constraint error
          if (errorMessage.includes('duplicate key value violates unique constraint')) {
            // Skip this user and continue with the import
            let reason = 'Duplicate constraint violation';
            if (errorMessage.includes('users_email_key')) {
              reason = 'Duplicate email address';
            } else if (errorMessage.includes('one_class_per_student')) {
              reason = 'Already enrolled in this class';
            }
            
            setSkippedUsers(prev => [...prev, {
              name: student.name,
              email: student.email,
              reason: reason
            }]);
            continue; // Continue to next student
          } else {
            // For other errors, stop the import process
            setError(`Import stopped: Failed to create user "${student.name}". ${errorMessage}`);
            setIsProcessing(false);
            setImportProgress({ current: 0, total: 0, currentUser: '' });
            return; // Exit the function immediately
          }
        }
      }

      onImportComplete(importedUsers, skippedUsers);
      // Don't close the dialog - let user see the summary and close manually
      setImportedUsers(importedUsers);
      setImportCompleted(true);
      setIsProcessing(false);
      setImportProgress({ current: 0, total: 0, currentUser: '' });
      
    } catch (err) {
      console.error('Error importing roster:', err);
      setError(err instanceof Error ? err.message : 'Failed to import roster');
    } finally {
      setIsProcessing(false);
      setImportProgress({ current: 0, total: 0, currentUser: '' });
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setParsingResult(null);
    setError(null);
    setDragActive(false);
    setImportProgress({ current: 0, total: 0, currentUser: '' });
    setSkippedUsers([]);
    setImportCompleted(false);
    setImportedUsers([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Class Roster</DialogTitle>
          <DialogDescription>
            Import students from a CSV file for: <strong>{className}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>Your CSV file should include <strong>at least one name column</strong> and <strong>one email column</strong>.</p>
            </div>
          </div>

          {/* File Upload Area */}
          {!selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop your roster CSV file here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse files
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
              >
                Choose File
              </Button>
              <p className="text-xs text-gray-500">
                CSV files only, max 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File Display */}
          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setParsingResult(null);
                    setError(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Parsing Status */}
          {isParsing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Parsing roster CSV...</p>
            </div>
          )}

          {/* Parsing Results */}
          {parsingResult && !isParsing && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Roster Import Preview</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• {parsingResult.students.length} students found</p>
                  <div>
                    <p>• 🛡️ <strong>Safe Import</strong>: No emails will be sent automatically</p>
                    <p>• Students will be added to the system locally</p>
                    <p>• You can manually invite students via email later</p>
                    <p>• Perfect for testing and controlled rollouts</p>
                  </div>
                  <p>• Students will be automatically enrolled in {className}</p>
                  {parsingResult.warnings.length > 0 && (
                    <div className="mt-2 text-xs text-amber-700">
                      <p className="font-medium">⚠️ Import Notes:</p>
                      {parsingResult.warnings.map((warning, index) => (
                        <p key={index}>• {warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Student Preview */}
              {parsingResult.students.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Student Preview ({parsingResult.students.length} found)
                  </h4>
                  <div className="space-y-2">
                    {parsingResult.students.slice(0, 5).map((student, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-gray-600">{student.email}</span>
                      </div>
                    ))}
                    {parsingResult.students.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2">
                        ...and {parsingResult.students.length - 5} more students
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Progress */}
          {isProcessing && importProgress.total > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-blue-900">Importing Students</h4>
                  <span className="text-sm text-blue-700">
                    {importProgress.current} of {importProgress.total}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  ></div>
                </div>
                
                {/* Current User */}
                {importProgress.currentUser && (
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating: {importProgress.currentUser}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Completion Summary */}
          {importCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    ✅ Import Completed Successfully
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>• {importedUsers.length} students imported successfully</p>
                    {skippedUsers.length > 0 && (
                      <p>• {skippedUsers.length} students skipped (duplicate emails)</p>
                    )}
                    <p>• Students are ready for manual invitation</p>
                  </div>
                </div>
              </div>
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

          {/* Skipped Users Summary */}
          {skippedUsers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Import Summary: {skippedUsers.length} user{skippedUsers.length === 1 ? '' : 's'} skipped
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p className="mb-2">The following users were skipped during import:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {skippedUsers.map((user, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-amber-600">({user.reason})</span>
                        </div>
                      ))}
                    </div>
                      <p className="mt-2 text-xs">
                        These users may already exist in the system with the same email address.
                      </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {isProcessing ? (
            <Button disabled className="bg-green-600">
              Processing...
            </Button>
          ) : importCompleted ? (
            // Import completed - show close button
            <Button
              type="button"
              onClick={handleCancel}
              className="bg-green-600 hover:bg-green-700"
            >
              Close
            </Button>
          ) : (
            // Normal state - show cancel and import buttons
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isProcessing || isParsing}
              >
                Cancel
              </Button>
              {parsingResult && !error && (
                <Button
                  onClick={handleImport}
                  disabled={isProcessing || isParsing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {`Import ${parsingResult.students.length} Students`}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
