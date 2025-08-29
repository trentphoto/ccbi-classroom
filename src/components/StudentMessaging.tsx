"use client";

import React from 'react';
import { Button } from './ui/button';

interface StudentMessagingProps {
  className?: string;
}

export default function StudentMessaging({ className = "" }: StudentMessagingProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md border ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
          <Button 
            className="inline-flex items-center px-3 py-2 bg-[#072c68] text-white rounded-md hover:bg-[#072c68]/90 transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message Teacher
          </Button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#072c68] rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">T</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Teacher</p>
              <p className="text-xs text-gray-500">Contact your teacher for questions about assignments, lessons, or general support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
