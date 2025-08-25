"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import MessageBubble from './MessageBubble';
import { Message, User, ConversationWithMessages } from '@/types/db';
import { sendMessage, markMessagesAsRead } from '@/lib/messaging';

interface ChatInterfaceProps {
  conversation: ConversationWithMessages;
  currentUser: User;
}

export default function ChatInterface({ conversation, currentUser }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update messages when conversation changes
  useEffect(() => {
    setMessages(conversation.messages);
  }, [conversation.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when the conversation is opened
    markMessagesAsRead(conversation.id, currentUser.id);
  }, [conversation.id, currentUser.id]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = sendMessage(conversation.id, currentUser.id, newMessage);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // In a real app, you would also update the conversation's last_message_at and unread_count
    // For now, we'll just add the message to the local state
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSender = (senderId: string): User => {
    return senderId === conversation.student.id ? conversation.student : conversation.teacher;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[#072c68] rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {conversation.student.name.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {conversation.student.name}
            </h3>
            <p className="text-sm text-gray-500">
              {conversation.class.name}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const sender = getSender(message.sender_id);
            const isOwnMessage = message.sender_id === currentUser.id;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                sender={sender}
                isOwnMessage={isOwnMessage}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-[#072c68] hover:bg-[#072c68]/90"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
