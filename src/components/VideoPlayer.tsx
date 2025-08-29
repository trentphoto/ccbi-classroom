"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Lesson } from '@/types/db';

interface VideoPlayerProps {
  lesson: Lesson;
  className?: string;
}

export default function VideoPlayer({ lesson, className = "" }: VideoPlayerProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Lesson</h3>
      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        {isVideoPlaying ? (
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-lg mb-2">Video Player</p>
              <p className="text-sm text-gray-300">(Simulated video content)</p>
              <Button 
                onClick={() => setIsVideoPlaying(false)}
                className="mt-4"
                variant="outline"
              >
                Stop Video
              </Button>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#072c68] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Ready to watch the lesson?</p>
              <Button 
                onClick={() => setIsVideoPlaying(true)}
                className="bg-[#072c68] hover:bg-[#072c68]/90 text-white"
              >
                Start Video Lesson
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">{lesson.title}</h4>
        <p className="text-gray-600 text-sm">{lesson.description}</p>
        {lesson.due_date && (
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Due: {new Date(lesson.due_date).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
