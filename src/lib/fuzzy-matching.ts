/**
 * Fuzzy matching utilities for attendance matching
 */

import { User } from '@/types/db';
import { ZoomParticipant } from './csv-parser';

export interface FuzzyMatch {
  student: User;
  score: number; // 0-100 confidence score
  reasons: string[]; // Why this match was suggested
}

export interface MatchingSuggestion {
  participant: ZoomParticipant;
  exactMatch: User | null;
  fuzzyMatches: FuzzyMatch[];
  confidence: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-100)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  if (normalized1 === normalized2) return 100;

  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 0;

  const distance = levenshteinDistance(normalized1, normalized2);
  return Math.round(((maxLength - distance) / maxLength) * 100);
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, '') // Remove suffixes
    .trim();
}

/**
 * Extract name parts from a full name
 */
function extractNameParts(fullName: string): { firstName: string; lastName: string; middle: string[] } {
  const parts = normalizeString(fullName).split(' ').filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '', middle: [] };
  }
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '', middle: [] };
  }
  
  if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1], middle: [] };
  }
  
  return {
    firstName: parts[0],
    lastName: parts[parts.length - 1],
    middle: parts.slice(1, -1)
  };
}

/**
 * Check if names could be the same person with different formats
 */
function checkNameVariations(participantName: string, studentName: string): { score: number; reasons: string[] } {
  const participant = extractNameParts(participantName);
  const student = extractNameParts(studentName);
  
  
  let score = 0;
  const reasons: string[] = [];

  // Exact match
  if (normalizeString(participantName) === normalizeString(studentName)) {
    return { score: 100, reasons: ['Exact name match'] };
  }

  // First name exact match
  if (participant.firstName === student.firstName && participant.firstName.length > 0) {
    score += 40;
    reasons.push('First name matches exactly');
  }

  // Last name exact match
  if (participant.lastName === student.lastName && participant.lastName.length > 0) {
    score += 40;
    reasons.push('Last name matches exactly');
  }

  // First name similarity
  if (participant.firstName && student.firstName) {
    const firstNameSim = calculateStringSimilarity(participant.firstName, student.firstName);
    if (firstNameSim >= 80 && firstNameSim < 100) {
      score += Math.round(firstNameSim * 0.3);
      reasons.push(`First name similar (${firstNameSim}%)`);
    }
  }

  // Last name similarity
  if (participant.lastName && student.lastName) {
    const lastNameSim = calculateStringSimilarity(participant.lastName, student.lastName);
    if (lastNameSim >= 80 && lastNameSim < 100) {
      score += Math.round(lastNameSim * 0.4); // Increased weight for last name similarity
      reasons.push(`Last name similar (${lastNameSim}%)`);
    } else if (lastNameSim >= 60 && lastNameSim < 80) {
      // Handle cases like "Adamson" vs "Adams" or "Wrightttt" vs "Wright"
      score += Math.round(lastNameSim * 0.3);
      reasons.push(`Last name somewhat similar (${lastNameSim}%)`);
    }
  }

  // Check if participant name contains student's first and last name
  const participantFull = normalizeString(participantName);
  const studentFull = normalizeString(studentName);
  
  if (student.firstName && student.lastName) {
    const hasFirstName = participantFull.includes(student.firstName);
    const hasLastName = participantFull.includes(student.lastName);
    
    if (hasFirstName && hasLastName) {
      score += 20;
      reasons.push('Contains both first and last name');
    } else if (hasFirstName || hasLastName) {
      score += 10;
      reasons.push('Contains part of the name');
    }
  }

  // Check if participant name is a subset of student name (e.g., "Matthew Young" in "Matthew James Young")
  if (participantFull.length > 0 && studentFull.includes(participantFull)) {
    score += 25;
    reasons.push('Participant name contained in student name');
  }
  
  // Check if student name is a subset of participant name (less common but possible)
  if (studentFull.length > 0 && participantFull.includes(studentFull)) {
    score += 20;
    reasons.push('Student name contained in participant name');
  }

  // Check reversed order (Last, First)
  if (participant.firstName && participant.lastName && student.firstName && student.lastName) {
    if (participant.firstName === student.lastName && participant.lastName === student.firstName) {
      score = Math.max(score, 85);
      reasons.push('Names match in reversed order');
    }
  }

  // Check initials
  if (participant.firstName && participant.lastName && student.firstName && student.lastName) {
    const participantInitials = participant.firstName[0] + participant.lastName[0];
    const studentInitials = student.firstName[0] + student.lastName[0];
    
    if (participantInitials === studentInitials) {
      score += 5;
      reasons.push('Same initials');
    }
  }

  const finalScore = Math.min(score, 100);
  
  
  return { score: finalScore, reasons };
}

/**
 * Find fuzzy matches for a participant
 */
export function findFuzzyMatches(participant: ZoomParticipant, students: User[]): MatchingSuggestion {
  // First check for exact email match
  const exactEmailMatch = students.find(student => 
    participant.email && student.email.toLowerCase() === participant.email.toLowerCase()
  );

  if (exactEmailMatch) {
    return {
      participant,
      exactMatch: exactEmailMatch,
      fuzzyMatches: [],
      confidence: 'high'
    };
  }

  // If no exact email match, do fuzzy name matching
  const fuzzyMatches: FuzzyMatch[] = [];

  if (participant.name) {
    
    for (const student of students) {
      const nameMatch = checkNameVariations(participant.name, student.name);
      
      
      if (nameMatch.score >= 50) { // Only include matches with 50%+ confidence
        fuzzyMatches.push({
          student,
          score: nameMatch.score,
          reasons: nameMatch.reasons
        });
      }
    }
    
  }

  // Sort by score descending
  fuzzyMatches.sort((a, b) => b.score - a.score);

  // Determine overall confidence
  let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
  
  if (fuzzyMatches.length > 0) {
    const topScore = fuzzyMatches[0].score;
    if (topScore >= 85) {
      confidence = 'high';
    } else if (topScore >= 70) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
  }

  return {
    participant,
    exactMatch: null,
    fuzzyMatches: fuzzyMatches.slice(0, 5), // Limit to top 5 suggestions
    confidence
  };
}

/**
 * Process all participants and find matches
 */
export function processParticipantMatches(participants: ZoomParticipant[], students: User[]): MatchingSuggestion[] {
  return participants.map(participant => findFuzzyMatches(participant, students));
}

/**
 * Get matching statistics
 */
export interface MatchingStats {
  totalParticipants: number;
  exactMatches: number;
  highConfidenceMatches: number;
  mediumConfidenceMatches: number;
  lowConfidenceMatches: number;
  noMatches: number;
  matchRate: number;
}

export function getMatchingStats(suggestions: MatchingSuggestion[]): MatchingStats {
  const stats = {
    totalParticipants: suggestions.length,
    exactMatches: 0,
    highConfidenceMatches: 0,
    mediumConfidenceMatches: 0,
    lowConfidenceMatches: 0,
    noMatches: 0,
    matchRate: 0
  };

  suggestions.forEach(suggestion => {
    if (suggestion.exactMatch) {
      stats.exactMatches++;
    } else {
      switch (suggestion.confidence) {
        case 'high':
          stats.highConfidenceMatches++;
          break;
        case 'medium':
          stats.mediumConfidenceMatches++;
          break;
        case 'low':
          stats.lowConfidenceMatches++;
          break;
        case 'none':
          stats.noMatches++;
          break;
      }
    }
  });

  const totalMatches = stats.exactMatches + stats.highConfidenceMatches + stats.mediumConfidenceMatches;
  stats.matchRate = stats.totalParticipants > 0 ? Math.round((totalMatches / stats.totalParticipants) * 100) : 0;

  return stats;
}
