import { createClient } from '@/lib/supabase/client';
import { parseZoomCSV, CSVParsingResult } from './csv-parser';

// Interface for upload result
export interface CSVUploadResult {
  success: boolean;
  filePath?: string;
  parsingResult?: CSVParsingResult;
  error?: string;
}

/**
 * Upload CSV file to Supabase Storage and parse it
 */
export const uploadAndParseCSV = async (
  file: File,
  meetingId: string
): Promise<CSVUploadResult> => {
  try {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return {
        success: false,
        error: 'File must be a CSV file'
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `attendance-${meetingId}-${timestamp}.csv`;
    const filePath = `attendance-csvs/${fileName}`;

    // Upload to Supabase Storage
    const supabase = createClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attendance-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Parse the CSV file
    const parsingResult = await parseZoomCSV(file);

    return {
      success: true,
      filePath: uploadData.path,
      parsingResult
    };

  } catch (error) {
    console.error('CSV upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Download CSV file from Supabase Storage
 */
export const downloadCSVFile = async (filePath: string): Promise<Blob | null> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('attendance-files')
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('CSV download error:', error);
    return null;
  }
};

/**
 * Delete CSV file from Supabase Storage
 */
export const deleteCSVFile = async (filePath: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from('attendance-files')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('CSV delete error:', error);
    return false;
  }
};

/**
 * Get public URL for CSV file
 */
export const getCSVFileUrl = (filePath: string): string => {
  const supabase = createClient();
  const { data } = supabase.storage
    .from('attendance-files')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Validate CSV file before upload
 */
export const validateCSVFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return {
      valid: false,
      error: 'File must be a CSV file'
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }

  return { valid: true };
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Sanitize filename for storage
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};
