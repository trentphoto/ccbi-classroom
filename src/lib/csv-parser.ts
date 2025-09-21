import Papa from 'papaparse';
import { User } from '@/types/db';
import { findFuzzyMatches, FuzzyMatch } from './fuzzy-matching';

// Interface for Zoom participant data from CSV
export interface ZoomParticipant {
  name: string;
  email: string;
  joinTime?: string;
  leaveTime?: string;
  duration?: string;
  [key: string]: any; // Allow for additional fields
}

// Interface for matching results
export interface ParticipantMatch {
  participant: ZoomParticipant;
  student: User | null;
  confidence: number; // 0-100
  matchType: 'exact' | 'fuzzy' | 'none';
  suggestions: User[]; // Alternative matches
  fuzzyMatches?: FuzzyMatch[]; // Fuzzy name matching suggestions
}

// Interface for CSV parsing result
export interface CSVParsingResult {
  participants: ZoomParticipant[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse a CSV file and extract Zoom participant data
 */
export const parseZoomCSV = (file: File): Promise<CSVParsingResult> => {
  return new Promise((resolve) => {
    const result: CSVParsingResult = {
      participants: [],
      errors: [],
      warnings: []
    };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize common Zoom CSV headers
        const normalized = header.toLowerCase().trim();
        
        // Map common variations to standard fields
        const headerMap: Record<string, string> = {
          'name (original name)': 'name',
          'user name': 'name',
          'display name': 'name',
          'participant name': 'name',
          'email address': 'email',
          'user email': 'email',
          'join time': 'joinTime',
          'join': 'joinTime',
          'leave time': 'leaveTime',
          'leave': 'leaveTime',
          'duration (minutes)': 'duration',
          'duration': 'duration',
          'time in session (minutes)': 'duration'
        };

        return headerMap[normalized] || normalized;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          result.errors.push(...results.errors.map(err => err.message));
        }

        // Process each row
        results.data.forEach((row: any, index) => {
          try {
            const participant = processParticipantRow(row, index + 1);
            if (participant) {
              result.participants.push(participant);
            }
          } catch (error) {
            result.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        // Validate results
        validateParticipants(result);

        resolve(result);
      },
      error: (error) => {
        result.errors.push(`CSV parsing error: ${error.message}`);
        resolve(result);
      }
    });
  });
};

/**
 * Process a single participant row from CSV
 */
const processParticipantRow = (row: any, rowNumber: number): ZoomParticipant | null => {
  // Skip rows without essential data
  if (!row.name && !row.email) {
    return null;
  }

  const participant: ZoomParticipant = {
    name: (row.name || '').trim(),
    email: (row.email || '').trim().toLowerCase(),
    joinTime: row.joinTime?.trim(),
    leaveTime: row.leaveTime?.trim(),
    duration: row.duration?.trim()
  };

  // Clean up name field
  if (participant.name) {
    // Remove common Zoom artifacts
    participant.name = participant.name
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Validate email format
  if (participant.email && !isValidEmail(participant.email)) {
    throw new Error(`Invalid email format: ${participant.email}`);
  }

  return participant;
};

/**
 * Validate the parsed participants
 */
const validateParticipants = (result: CSVParsingResult): void => {
  const { participants } = result;

  if (participants.length === 0) {
    result.errors.push('No valid participants found in CSV file');
    return;
  }

  // Check for duplicate emails
  const emailCounts = new Map<string, number>();
  participants.forEach(p => {
    if (p.email) {
      emailCounts.set(p.email, (emailCounts.get(p.email) || 0) + 1);
    }
  });

  emailCounts.forEach((count, email) => {
    if (count > 1) {
      result.warnings.push(`Duplicate email found: ${email} (${count} times)`);
    }
  });

  // Check for participants without emails
  const noEmailCount = participants.filter(p => !p.email).length;
  if (noEmailCount > 0) {
    result.warnings.push(`${noEmailCount} participants have no email address`);
  }

  // Check for participants without names
  const noNameCount = participants.filter(p => !p.name).length;
  if (noNameCount > 0) {
    result.warnings.push(`${noNameCount} participants have no name`);
  }
};

/**
 * Match participants with enrolled students using email and fuzzy name matching
 */
export const matchParticipantsByEmail = (
  participants: ZoomParticipant[],
  students: User[]
): ParticipantMatch[] => {
  return participants.map(participant => {
    // First try email matching
    const emailMatch = findEmailMatch(participant, students);
    
    
    if (emailMatch.matchType === 'exact') {
      return {
        participant,
        student: emailMatch.student,
        confidence: emailMatch.confidence,
        matchType: emailMatch.matchType,
        suggestions: emailMatch.suggestions,
        fuzzyMatches: []
      };
    }

    // If no email match, try fuzzy name matching
    const fuzzyResult = findFuzzyMatches(participant, students);
    
    
    // If we have high-confidence fuzzy matches, use the best one
    if (fuzzyResult.fuzzyMatches.length > 0 && fuzzyResult.fuzzyMatches[0].score >= 85) {
      return {
        participant,
        student: fuzzyResult.fuzzyMatches[0].student,
        confidence: fuzzyResult.fuzzyMatches[0].score,
        matchType: 'fuzzy',
        suggestions: emailMatch.suggestions,
        fuzzyMatches: fuzzyResult.fuzzyMatches
      };
    }

    // Return unmatched with fuzzy suggestions
    return {
      participant,
      student: null,
      confidence: 0,
      matchType: 'none',
      suggestions: emailMatch.suggestions,
      fuzzyMatches: fuzzyResult.fuzzyMatches
    };
  });
};

/**
 * Find email match for a participant
 */
const findEmailMatch = (
  participant: ZoomParticipant,
  students: User[]
): {
  student: User | null;
  confidence: number;
  matchType: 'exact' | 'none';
  suggestions: User[];
} => {
  if (!participant.email) {
    return {
      student: null,
      confidence: 0,
      matchType: 'none',
      suggestions: []
    };
  }

  // Look for exact email match
  const exactMatch = students.find(student => 
    student.email.toLowerCase() === participant.email.toLowerCase()
  );

  if (exactMatch) {
    return {
      student: exactMatch,
      confidence: 100,
      matchType: 'exact',
      suggestions: []
    };
  }

  // Look for partial email matches (same domain, different prefix)
  const participantDomain = participant.email.split('@')[1];
  const domainMatches = students.filter(student => {
    const studentDomain = student.email.split('@')[1];
    return studentDomain === participantDomain;
  });

  return {
    student: null,
    confidence: 0,
    matchType: 'none',
    suggestions: domainMatches.slice(0, 3) // Limit to 3 suggestions
  };
};

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get summary statistics for matching results
 */
export const getMatchingSummary = (matches: ParticipantMatch[]) => {
  const exactMatches = matches.filter(m => m.matchType === 'exact').length;
  const fuzzyMatches = matches.filter(m => m.matchType === 'fuzzy').length;
  const noMatches = matches.filter(m => m.matchType === 'none').length;
  const totalParticipants = matches.length;
  const totalMatches = exactMatches + fuzzyMatches;

  return {
    totalParticipants,
    exactMatches,
    fuzzyMatches,
    noMatches,
    totalMatches,
    matchRate: totalParticipants > 0 ? Math.round((totalMatches / totalParticipants) * 100) : 0
  };
};

/**
 * Filter participants by match status
 */
export const filterParticipantsByMatch = (
  matches: ParticipantMatch[],
  status: 'matched' | 'unmatched' | 'all'
): ParticipantMatch[] => {
  switch (status) {
    case 'matched':
      return matches.filter(m => m.matchType === 'exact' || m.matchType === 'fuzzy');
    case 'unmatched':
      return matches.filter(m => m.matchType === 'none');
    case 'all':
    default:
      return matches;
  }
};
