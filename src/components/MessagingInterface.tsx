"use client";

import React, { useState } from 'react';
import { User, Conversation, UserRole } from '@/types/db';
import ChatInterface from './ChatInterface';

interface MessagingInterfaceProps {
  conversations: Conversation[];
  currentUser: User;
  selectedClassId: string;
}

export default function MessagingInterface({ 
  conversations, 
  currentUser, 
  selectedClassId 
}: MessagingInterfaceProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Filter conversations for the selected class
  const classConversations = conversations.filter(conv => conv.class_id === selectedClassId);
  
  // Get the currently selected conversation
  const currentConversation = classConversations.find(conv => conv.id === selectedConversation) || 
    (classConversations.length > 0 ? classConversations[0] : null);

  if (classConversations.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages</h3>
        <p className="text-gray-600">No conversations with students in this class yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
            <p className="text-sm text-gray-500">{classConversations.length} active</p>
          </div>
          <div className="divide-y divide-gray-200">
            {classConversations.map((conversation) => {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              const isSelected = currentConversation?.id === conversation.id;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#072c68] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {conversation.student.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium truncate ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {conversation.student.name}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {lastMessage.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-md border h-[600px]">
          {currentConversation ? (
            <ChatInterface 
              conversation={currentConversation} 
              currentUser={currentUser} 
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                <p className="text-gray-500">Choose a student from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
