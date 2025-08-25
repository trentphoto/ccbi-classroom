import React from 'react';
import { Message, User } from '@/types/db';

interface MessageBubbleProps {
  message: Message;
  sender: User;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, sender, isOwnMessage }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage 
          ? 'bg-[#072c68] text-white' 
          : 'bg-gray-200 text-gray-900'
      }`}>
        <div className="flex items-center mb-1">
          <span className={`text-xs font-medium ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-600'
          }`}>
            {sender.name}
          </span>
          <span className={`text-xs ml-2 ${
            isOwnMessage ? 'text-blue-200' : 'text-gray-500'
          }`}>
            {message.sent_at.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        <p className="text-sm">{message.content}</p>
        {!message.is_read && isOwnMessage && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-blue-200">Delivered</span>
          </div>
        )}
      </div>
    </div>
  );
}
