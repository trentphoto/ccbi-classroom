import { 
  Conversation, 
  Message, 
  ConversationWithMessages
} from '@/types/db';
import { 
  sampleUsers, 
  sampleClasses, 
  sampleConversations, 
  sampleMessages 
} from '@/lib/sample-data';

// Get all conversations for a teacher
export function getTeacherConversations(teacherId: string): ConversationWithMessages[] {
  const conversations = sampleConversations.filter(conv => conv.teacher_id === teacherId);
  
  return conversations.map(conversation => {
    const messages = sampleMessages.filter(msg => msg.conversation_id === conversation.id);
    const student = sampleUsers.find(user => user.id === conversation.student_id);
    const teacher = sampleUsers.find(user => user.id === conversation.teacher_id);
    const classInfo = sampleClasses.find(cls => cls.id === conversation.class_id);
    
    return {
      ...conversation,
      messages,
      student: student!,
      teacher: teacher!,
      class: classInfo!
    };
  });
}

// Get conversation for a student (they only have one)
export function getStudentConversation(studentId: string): ConversationWithMessages | null {
  const conversation = sampleConversations.find(conv => conv.student_id === studentId);
  
  if (!conversation) return null;
  
  const messages = sampleMessages.filter(msg => msg.conversation_id === conversation.id);
  const student = sampleUsers.find(user => user.id === conversation.student_id);
  const teacher = sampleUsers.find(user => user.id === conversation.teacher_id);
  const classInfo = sampleClasses.find(cls => cls.id === conversation.class_id);
  
  return {
    ...conversation,
    messages,
    student: student!,
    teacher: teacher!,
    class: classInfo!
  };
}

// Get unread message count for a teacher
export function getTeacherUnreadCount(teacherId: string): number {
  return sampleConversations
    .filter(conv => conv.teacher_id === teacherId)
    .reduce((total, conv) => total + conv.unread_count, 0);
}

// Send a new message
export function sendMessage(
  conversationId: string, 
  senderId: string, 
  content: string
): Message {
  const newMessage: Message = {
    id: `msg${Date.now()}`,
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    sent_at: new Date(),
    is_read: false
  };
  
  // In a real app, this would be saved to the database
  // For now, we'll just return the message
  return newMessage;
}

// Mark messages as read
export function markMessagesAsRead(conversationId: string, readerId: string): void {
  // In a real app, this would update the database
  // For now, we'll just simulate the behavior
  console.log(`Marking messages as read for conversation ${conversationId} by user ${readerId}`);
}

// Create a new conversation (for when a student first messages)
export function createConversation(
  studentId: string,
  teacherId: string,
  classId: string
): Conversation {
  const newConversation: Conversation = {
    id: `conv${Date.now()}`,
    student_id: studentId,
    teacher_id: teacherId,
    class_id: classId,
    last_message_at: new Date(),
    unread_count: 0,
    created_at: new Date()
  };
  
  // In a real app, this would be saved to the database
  return newConversation;
}
