"use client";

import React from 'react';
import { Conversation, ConversationWithMessages, UserRole } from '@/types/db';
import { getDefaultBrandId, getAdminEmail } from '@/lib/brand';

// Sample messaging data for future use
export const sampleConversations: ConversationWithMessages[] = [
  {
    id: 'conv1',
    student_id: 'user2',
    teacher_id: 'user1',
    class_id: 'class1',
    last_message_at: new Date('2024-01-25T10:30:00Z'),
    unread_count: 2,
    created_at: new Date('2024-01-20T09:00:00Z'),
    student: {
      id: 'user2',
      email: 'michael.chen@example.com',
      role: UserRole.STUDENT,
      name: 'Michael Chen',
      brand_id: getDefaultBrandId(),
      is_active: true,
      deactivated_at: null,
      created_at: new Date('2024-01-20')
    },
    teacher: {
      id: 'user1',
      email: getAdminEmail(),
      role: UserRole.ADMIN,
      name: 'Admin User',
      brand_id: getDefaultBrandId(),
      is_active: true,
      deactivated_at: null,
      created_at: new Date('2024-01-15')
    },
    class: {
      id: 'class1',
      name: 'April 2025 MTh MDiv',
      description: 'Master of Divinity Program - Monday/Thursday Schedule',
      brand_id: getDefaultBrandId(),
      is_active: true,
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    messages: [
      {
        id: 'msg1',
        conversation_id: 'conv1',
        sender_id: 'user2',
        content: 'Hello, I have a question about the assignment for Lesson 1.',
        sent_at: new Date('2024-01-20T09:00:00Z'),
        is_read: true
      },
      {
        id: 'msg2',
        conversation_id: 'conv1',
        sender_id: 'user1',
        content: 'Hi Michael! I\'d be happy to help. What specific question do you have?',
        sent_at: new Date('2024-01-20T09:15:00Z'),
        is_read: true
      },
      {
        id: 'msg3',
        conversation_id: 'conv1',
        sender_id: 'user2',
        content: 'I\'m not sure how to approach the biblical analysis section. Could you provide some guidance?',
        sent_at: new Date('2024-01-25T10:30:00Z'),
        is_read: false
      }
    ]
  },
  {
    id: 'conv2',
    student_id: 'user3',
    teacher_id: 'user1',
    class_id: 'class1',
    last_message_at: new Date('2024-01-24T14:20:00Z'),
    unread_count: 0,
    created_at: new Date('2024-01-21T11:00:00Z'),
    student: {
      id: 'user3',
      email: 'emily.rodriguez@example.com',
      role: UserRole.STUDENT,
      name: 'Emily Rodriguez',
      brand_id: getDefaultBrandId(),
      is_active: true,
      deactivated_at: null,
      created_at: new Date('2024-01-20')
    },
    teacher: {
      id: 'user1',
      email: getAdminEmail(),
      role: UserRole.ADMIN,
      name: 'Admin User',
      brand_id: getDefaultBrandId(),
      is_active: true,
      deactivated_at: null,
      created_at: new Date('2024-01-15')
    },
    class: {
      id: 'class1',
      name: 'April 2025 MTh MDiv',
      description: 'Master of Divinity Program - Monday/Thursday Schedule',
      brand_id: getDefaultBrandId(),
      is_active: true,
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    messages: [
      {
        id: 'msg4',
        conversation_id: 'conv2',
        sender_id: 'user3',
        content: 'Thank you for the feedback on my submission!',
        sent_at: new Date('2024-01-21T11:00:00Z'),
        is_read: true
      },
      {
        id: 'msg5',
        conversation_id: 'conv2',
        sender_id: 'user1',
        content: 'You\'re welcome, Emily! Your work is showing great improvement.',
        sent_at: new Date('2024-01-24T14:20:00Z'),
        is_read: true
      }
    ]
  }
];

// Helper functions for messaging
export const getTeacherConversations = (teacherId: string): Conversation[] => {
  return sampleConversations.filter(conv => conv.teacher_id === teacherId);
};

export const getStudentConversations = (studentId: string): Conversation[] => {
  return sampleConversations.filter(conv => conv.student_id === studentId);
};

export const getConversationsByClass = (classId: string): Conversation[] => {
  return sampleConversations.filter(conv => conv.class_id === classId);
};

export const markMessagesAsRead = (conversationId: string, readerId: string): void => {
  console.log(`Marking messages as read for conversation ${conversationId} by user ${readerId}`);
  // TODO: Implement actual message marking logic
};

export const createConversation = (
  studentId: string,
  teacherId: string,
  classId: string
): ConversationWithMessages => {
  const newConversation: ConversationWithMessages = {
    id: `conv${Date.now()}`,
    student_id: studentId,
    teacher_id: teacherId,
    class_id: classId,
    last_message_at: new Date(),
    unread_count: 0,
    created_at: new Date(),
    student: {
      id: studentId,
      email: '',
      role: UserRole.STUDENT,
      name: '',
      brand_id: getDefaultBrandId(),
      is_active: true,
      deactivated_at: null,
      created_at: new Date()
    },
    teacher: {
      id: teacherId,
      email: '',
      role: UserRole.ADMIN,
      name: '',
      brand_id: getDefaultBrandId(),
      is_active: true,
      deactivated_at: null,
      created_at: new Date()
    },
    class: {
      id: classId,
      name: '',
      description: '',
      brand_id: getDefaultBrandId(),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    messages: []
  };
  
  return newConversation;
};

// Component to demonstrate messaging functionality (for future use)
export default function MessagingData() {
  return (
    <div className="hidden">
      {/* This component is just for preserving the messaging data and functions */}
      {/* It can be imported and used when implementing messaging features */}
    </div>
  );
}
