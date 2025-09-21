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
import { ParticipantMatch, CSVParsingResult } from '@/lib/csv-parser';
import { validateCSVFile, formatFileSize } from '@/lib/csv-upload';
import { User } from '@/types/db';

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  students: User[];
  onUploadComplete: (matches: ParticipantMatch[]) => void;
  isUploading?: boolean;
}

export default function CSVUploadDialog({
  open,
  onOpenChange,
  // meetingId, // Unused for now
  meetingTitle,
  students,
  onUploadComplete,
  isUploading = false
}: CSVUploadDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsingResult, setParsingResult] = useState<CSVParsingResult | null>(null);
  const [matches, setMatches] = useState<ParticipantMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
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
    setMatches([]);

    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      // Import the CSV parser dynamically to avoid SSR issues
      const { parseZoomCSV } = await import('@/lib/csv-parser');
      const result = await parseZoomCSV(file);
      
      setParsingResult(result);
      
      if (result.errors.length > 0) {
        setError(`CSV parsing errors: ${result.errors.join(', ')}`);
        return;
      }

      // Perform matching with students
      const { matchParticipantsByEmail } = await import('@/lib/csv-parser');
      const participantMatches = matchParticipantsByEmail(result.participants, students);
      setMatches(participantMatches);
      
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (parsingResult && matches.length > 0) {
      onUploadComplete(matches);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setParsingResult(null);
    setMatches([]);
    setError(null);
    setDragActive(false);
    onOpenChange(false);
  };

  const getMatchingSummary = () => {
    if (!parsingResult) return null;
    
    const total = parsingResult.participants.length;
    const withEmail = parsingResult.participants.filter(p => p.email).length;
    const withoutEmail = total - withEmail;
    
    return { total, withEmail, withoutEmail };
  };

  const summary = getMatchingSummary();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Attendance CSV</DialogTitle>
          <DialogDescription>
            Upload a Zoom participants CSV file for: <strong>{meetingTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                Drop your CSV file here
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
                    setMatches([]);
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
              <p className="text-sm text-gray-600">Parsing CSV file...</p>
            </div>
          )}

          {/* Parsing Results */}
          {parsingResult && !isParsing && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Parsing Results</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Total participants: {summary?.total}</p>
                  <p>• With email addresses: {summary?.withEmail}</p>
                  <p>• Without email addresses: {summary?.withoutEmail}</p>
                </div>
              </div>

              {parsingResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Warnings</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {parsingResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                <p className="text-sm text-gray-600">
                  The CSV has been parsed successfully. Click &quot;Continue to Matching&quot; to match participants 
                  with enrolled students and review attendance records.
                </p>
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
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading || isParsing}
          >
            Cancel
          </Button>
          {parsingResult && !error && (
            <Button
              onClick={handleUpload}
              disabled={isUploading || isParsing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Continue to Matching'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
