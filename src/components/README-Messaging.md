# Messaging Components - Preserved for Future Use

This directory contains messaging-related components that were extracted from the main dashboard components to preserve the frontend code for future implementation.

## Components Overview

### 1. `MessagingInterface.tsx`
**Purpose**: Main messaging interface for admin dashboard
**Features**:
- Conversation list with unread message indicators
- Chat interface integration
- Class-based conversation filtering
- Empty state handling

**Usage**:
```tsx
import MessagingInterface from '@/components/MessagingInterface';

<MessagingInterface 
  conversations={conversations}
  currentUser={currentUser}
  selectedClassId={selectedClassId}
/>
```

### 2. `MessagingData.tsx`
**Purpose**: Sample data and helper functions for messaging
**Features**:
- Sample conversation data
- Helper functions for filtering conversations
- Message marking functions
- Conversation creation utilities

**Usage**:
```tsx
import { 
  sampleConversations, 
  getTeacherConversations, 
  getStudentConversations 
} from '@/components/MessagingData';

const teacherConversations = getTeacherConversations(teacherId);
```

### 3. `StudentMessaging.tsx`
**Purpose**: Student messaging section for student dashboard
**Features**:
- Teacher contact interface
- Message teacher button
- Simple messaging UI

**Usage**:
```tsx
import StudentMessaging from '@/components/StudentMessaging';

<StudentMessaging className="mb-8" />
```

### 4. `StudentProgress.tsx`
**Purpose**: Student progress tracking section
**Features**:
- Current lesson indicator
- Completed assignments count
- Average grade display
- Progress visualization

**Usage**:
```tsx
import StudentProgress from '@/components/StudentProgress';

<StudentProgress 
  lessons={lessons}
  submissions={submissions}
  currentLesson={currentLesson}
  className="mb-8"
/>
```

### 5. `VideoPlayer.tsx`
**Purpose**: Enhanced video player with lesson information
**Features**:
- Video play/pause controls
- Lesson details display
- Due date information
- Simulated video player

**Usage**:
```tsx
import VideoPlayer from '@/components/VideoPlayer';

<VideoPlayer lesson={currentLesson} />
```

### 6. `SubmissionForm.tsx`
**Purpose**: Enhanced file submission form
**Features**:
- Drag-and-drop file upload
- Existing submission display
- Grade and feedback display
- File type validation

**Usage**:
```tsx
import SubmissionForm from '@/components/SubmissionForm';

<SubmissionForm 
  lesson={currentLesson}
  existingSubmission={existingSubmission}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
/>
```

## Integration Steps for Future Implementation

### 1. Database Schema
Add messaging tables to Supabase:
```sql
-- Conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id),
  teacher_id uuid REFERENCES users(id),
  class_id uuid REFERENCES classes(id),
  last_message_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  unread_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  sender_id uuid REFERENCES users(id),
  content text NOT NULL,
  sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_read boolean DEFAULT false
);
```

### 2. Database Service Functions
Add to `src/lib/supabase/database.ts`:
```typescript
// Conversation operations
async getConversations(): Promise<Conversation[]>
async getConversationsByClass(classId: string): Promise<Conversation[]>
async getTeacherConversations(teacherId: string): Promise<Conversation[]>
async createConversation(conversationData: Omit<Conversation, 'id' | 'created_at'>): Promise<Conversation>

// Message operations
async getMessages(conversationId: string): Promise<Message[]>
async sendMessage(messageData: Omit<Message, 'id' | 'sent_at'>): Promise<Message>
async markMessagesAsRead(conversationId: string, readerId: string): Promise<void>
```

### 3. Component Integration
Update dashboard components to use messaging:

**AdminDashboard.tsx**:
```tsx
// Add to imports
import MessagingInterface from '@/components/MessagingInterface';
import { getTeacherConversations } from '@/components/MessagingData';

// Add to state
const [conversations, setConversations] = useState<Conversation[]>([]);

// Add to loadData function
const conversationsData = await db.getConversations();
setConversations(conversationsData);

// Update renderMessages function
const renderMessages = () => (
  <MessagingInterface 
    conversations={conversations}
    currentUser={currentUser}
    selectedClassId={selectedClassId}
  />
);
```

**StudentDashboard.tsx**:
```tsx
// Add to imports
import StudentMessaging from '@/components/StudentMessaging';
import StudentProgress from '@/components/StudentProgress';
import VideoPlayer from '@/components/VideoPlayer';
import SubmissionForm from '@/components/SubmissionForm';

// Add components to the dashboard layout
<StudentProgress 
  lessons={lessons}
  submissions={submissions}
  currentLesson={currentLesson}
  className="mb-8"
/>

<VideoPlayer lesson={currentLesson} />

<SubmissionForm 
  lesson={currentLesson}
  existingSubmission={currentSubmission}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
/>

<StudentMessaging className="mb-8" />
```

## Features to Implement

### Phase 1: Basic Messaging
- [ ] Real-time messaging with Supabase Realtime
- [ ] Message notifications
- [ ] Unread message indicators
- [ ] Conversation creation

### Phase 2: Enhanced Features
- [ ] File attachments in messages
- [ ] Message search
- [ ] Message reactions
- [ ] Typing indicators

### Phase 3: Advanced Features
- [ ] Group conversations
- [ ] Message threading
- [ ] Message editing/deletion
- [ ] Message history export

## Notes
- All components are fully functional with sample data
- Components use TypeScript for type safety
- Styling is consistent with the existing design system
- Components are modular and reusable
- Error handling and loading states are included
