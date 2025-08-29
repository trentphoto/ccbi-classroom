"use client";

import React from 'react';
import { Lesson, Submission } from '@/types/db';

interface StudentProgressProps {
  lessons: Lesson[];
  submissions: Submission[];
  currentLesson: Lesson;
  className?: string;
}

export default function StudentProgress({ 
  lessons, 
  submissions, 
  currentLesson, 
  className = "" 
}: StudentProgressProps) {
  const completedSubmissions = submissions.filter(sub => sub.grade !== null);
  const averageGrade = completedSubmissions.length > 0 
    ? Math.round(completedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / completedSubmissions.length)
    : 0;

  return (
    <div className={`bg-white rounded-lg shadow-md border ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[#072c68]/10 rounded-lg border border-[#072c68]/20">
            <div className="text-2xl font-bold text-[#072c68]">
              {lessons.findIndex(lesson => lesson.id === currentLesson.id) + 1}
            </div>
            <div className="text-sm text-[#072c68]">Current Lesson</div>
          </div>
          <div className="text-center p-4 bg-[#086623]/10 rounded-lg border border-[#086623]/20">
            <div className="text-2xl font-bold text-[#086623]">
              {completedSubmissions.length}
            </div>
            <div className="text-sm text-[#086623]">Completed</div>
          </div>
          <div className="text-center p-4 bg-[#d2ac47]/10 rounded-lg border border-[#d2ac47]/20">
            <div className="text-2xl font-bold text-[#d2ac47]">
              {averageGrade}%
            </div>
            <div className="text-sm text-[#d2ac47]">Average Grade</div>
          </div>
        </div>
      </div>
    </div>
  );
}
