import { User, Class, Lesson, Submission, UserRole, ClassEnrollment, Conversation, Message } from '@/types/db';

// Sample Users
export const sampleUsers: User[] = [
  // Admin
  {
    id: 'user1',
    email: 'admin@ccbinstitute.org',
    role: UserRole.ADMIN,
    name: 'Admin User',
    is_active: true,
    deactivated_at: null,
    created_at: new Date('2024-01-15')
  },
  
  // Students for MTh MDiv class
  {
    id: 'user2',
    email: 'michael.chen@ccbinstitute.org',
    role: UserRole.STUDENT,
    name: 'Michael Chen',
    is_active: true,
    deactivated_at: null,
    created_at: new Date('2024-01-20')
  },
  {
    id: 'user3',
    email: 'emily.rodriguez@ccbinstitute.org',
    role: UserRole.STUDENT,
    name: 'Emily Rodriguez',
    is_active: true,
    deactivated_at: null,
    created_at: new Date('2024-01-20')
  },
  {
    id: 'user4',
    email: 'david.thompson@ccbinstitute.org',
    role: UserRole.STUDENT,
    name: 'David Thompson',
    is_active: false, // Example of an inactive student
    deactivated_at: new Date('2024-02-15'), // Example deactivation date
    created_at: new Date('2024-01-20')
  },
  
  // Students for TuFr MDiv class
  {
    id: 'user5',
    email: 'jessica.williams@ccbinstitute.org',
    role: UserRole.STUDENT,
    name: 'Jessica Williams',
    is_active: true,
    deactivated_at: null,
    created_at: new Date('2024-01-20')
  },
  {
    id: 'user6',
    email: 'robert.davis@ccbinstitute.org',
    role: UserRole.STUDENT,
    name: 'Robert Davis',
    is_active: true,
    deactivated_at: null,
    created_at: new Date('2024-01-20')
  },
  {
    id: 'user7',
    email: 'amanda.martinez@ccbinstitute.org',
    role: UserRole.STUDENT,
    name: 'Amanda Martinez',
    is_active: true,
    deactivated_at: null,
    created_at: new Date('2024-01-20')
  }
];

// Sample Classes
export const sampleClasses: Class[] = [
  {
    id: 'class1',
    name: 'April 2025 MTh MDiv',
    description: 'Master of Divinity Program - Monday/Thursday Schedule. Advanced theological studies focusing on biblical studies, pastoral care, and ministry leadership.',
    is_active: true,
    created_at: new Date('2024-01-15')
  },
  {
    id: 'class2',
    name: 'May 2025 TuFr MDiv',
    description: 'Master of Divinity Program - Tuesday/Friday Schedule. Comprehensive theological education with emphasis on practical ministry skills and spiritual formation.',
    is_active: true,
    created_at: new Date('2024-01-15')
  }
];

// Sample Class Enrollments
export const sampleEnrollments: ClassEnrollment[] = [
  // MTh MDiv students
  { user_id: 'user2', class_id: 'class1', enrolled_at: new Date('2024-01-20') },
  { user_id: 'user3', class_id: 'class1', enrolled_at: new Date('2024-01-20') },
  { user_id: 'user4', class_id: 'class1', enrolled_at: new Date('2024-01-20') },
  
  // TuFr MDiv students
  { user_id: 'user5', class_id: 'class2', enrolled_at: new Date('2024-01-20') },
  { user_id: 'user6', class_id: 'class2', enrolled_at: new Date('2024-01-20') },
  { user_id: 'user7', class_id: 'class2', enrolled_at: new Date('2024-01-20') }
];

// Sample Lessons (5 lessons for each class)
export const sampleLessons: Lesson[] = [
  // MTh MDiv Lessons
  {
    id: 'lesson1',
    class_id: 'class1',
    title: 'Introductory Lesson 1',
    description: 'Intro lesson 1 video and assignment',
    due_date: new Date('2024-02-15'),
    video_url: 'https://youtube.com/watch?v=biblical-hermeneutics-intro',
    file_path: '/assignments/hermeneutics-assignment-1.pdf',
    created_at: new Date('2024-01-25')
  },
  {
    id: 'lesson2',
    class_id: 'class1',
    title: 'Introductory Lesson 2',
    description: 'Intro lesson 2 video and assignment',
    due_date: new Date('2024-02-22'),
    video_url: 'https://youtube.com/watch?v=historical-critical-method',
    file_path: '/assignments/exegetical-exercise-1.pdf',
    created_at: new Date('2024-02-01')
  },
  {
    id: 'lesson3',
    class_id: 'class1',
    title: 'Introductory Lesson 3',
    description: 'Intro lesson 3 video and assignment',
    due_date: new Date('2024-03-01'),
    video_url: 'https://youtube.com/watch?v=theological-interpretation',
    file_path: '/assignments/theological-framework-assignment.pdf',
    created_at: new Date('2024-02-08')
  },
  {
    id: 'lesson4',
    class_id: 'class1',
    title: 'Introductory Lesson 4',
    description: 'Intro lesson 4 video and assignment',
    due_date: new Date('2024-03-08'),
    video_url: 'https://youtube.com/watch?v=pastoral-care-foundations',
    file_path: '/assignments/pastoral-care-case-study.pdf',
    created_at: new Date('2024-02-15')
  },
  {
    id: 'lesson5',
    class_id: 'class1',
    title: 'Introductory Lesson 5',
    description: 'Intro lesson 5 video and assignment',
    due_date: new Date('2024-03-15'),
    video_url: 'https://youtube.com/watch?v=ministry-leadership',
    file_path: '/assignments/ministry-strategic-plan.pdf',
    created_at: new Date('2024-02-22')
  },
  
  // TuFr MDiv Lessons
  {
    id: 'lesson6',
    class_id: 'class2',
    title: 'Introductory Lesson 1',
    description: 'Complete the reading assignment and submit a reflection paper on the key concepts.',
    due_date: new Date('2024-02-16'),
    video_url: 'https://youtube.com/watch?v=doctrine-of-god',
    file_path: '/assignments/divine-attributes-assignment.pdf',
    created_at: new Date('2024-01-25')
  },
  {
    id: 'lesson7',
    class_id: 'class2',
    title: 'Introductory Lesson 2',
    description: 'Analyze contemporary issues through the lens of moral tradition. Submit a position paper.',
    due_date: new Date('2024-02-23'),
    video_url: 'https://youtube.com/watch?v=christian-ethics',
    file_path: '/assignments/ethics-position-paper.pdf',
    created_at: new Date('2024-02-01')
  },
  {
    id: 'lesson8',
    class_id: 'class2',
    title: 'Introductory Lesson 3',
    description: 'Research and present on a significant historical figure or event. Submit a research paper with bibliography.',
    due_date: new Date('2024-03-02'),
    video_url: 'https://youtube.com/watch?v=early-church-history',
    file_path: '/assignments/church-history-research.pdf',
    created_at: new Date('2024-02-08')
  },
  {
    id: 'lesson9',
    class_id: 'class2',
    title: 'Introductory Lesson 4',
    description: 'Design a complete service incorporating traditional and contemporary elements.',
    due_date: new Date('2024-03-09'),
    video_url: 'https://youtube.com/watch?v=worship-liturgy',
    file_path: '/assignments/worship-service-design.pdf',
    created_at: new Date('2024-02-15')
  },
  {
    id: 'lesson10',
    class_id: 'class2',
    title: 'Introductory Lesson 5',
    description: 'Develop a comprehensive strategy for a diverse community. Include cultural considerations.',
    due_date: new Date('2024-03-16'),
    video_url: 'https://youtube.com/watch?v=mission-evangelism',
    file_path: '/assignments/evangelism-strategy.pdf',
    created_at: new Date('2024-02-22')
  }
];

// Sample Submissions
export const sampleSubmissions: Submission[] = [
  // MTh MDiv Submissions
  {
    id: 'sub1',
    lesson_id: 'lesson1',
    student_id: 'user2',
    file_path: '/submissions/michael-chen-hermeneutics-reflection.pdf',
    submitted_at: new Date('2024-02-10'),
    grade: 92,
    feedback: 'Excellent.',
    updated_at: new Date('2024-02-12')
  },
  {
    id: 'sub2',
    lesson_id: 'lesson1',
    student_id: 'user3',
    file_path: '/submissions/emily-rodriguez-hermeneutics-reflection.pdf',
    submitted_at: new Date('2024-02-12'),
    grade: 88,
    feedback: 'Good work.', 
    updated_at: new Date('2024-02-14')
  },
  {
    id: 'sub3',
    lesson_id: 'lesson1',
    student_id: 'user4',
    file_path: '/submissions/david-thompson-hermeneutics-reflection.pdf',
    submitted_at: new Date('2024-02-14'),
    grade: null,
    feedback: null,
    updated_at: new Date('2024-02-14')
  },
  {
    id: 'sub4',
    lesson_id: 'lesson2',
    student_id: 'user2',
    file_path: '/submissions/michael-chen-exegetical-analysis.pdf',
    submitted_at: new Date('2024-02-18'),
    grade: 95,
    feedback: 'Outstanding.',
    updated_at: new Date('2024-02-20')
  },
  {
    id: 'sub5',
    lesson_id: 'lesson2',
    student_id: 'user3',
    file_path: '/submissions/emily-rodriguez-exegetical-analysis.pdf',
    submitted_at: new Date('2024-02-19'),
    grade: 87,
    feedback: 'Good.',
    updated_at: new Date('2024-02-21')
  },
  
  // TuFr MDiv Submissions
  {
    id: 'sub6',
    lesson_id: 'lesson6',
    student_id: 'user5',
    file_path: '/submissions/jessica-williams-divine-attributes.pdf',
    submitted_at: new Date('2024-02-11'),
    grade: 90,
    feedback: 'Excellent.',
    updated_at: new Date('2024-02-13')
  },
  {
    id: 'sub7',
    lesson_id: 'lesson6',
    student_id: 'user6',
    file_path: '/submissions/robert-davis-divine-attributes.pdf',
    submitted_at: new Date('2024-02-13'),
    grade: 85,
    feedback: 'Good.',
    updated_at: new Date('2024-02-15')
  },
  {
    id: 'sub8',
    lesson_id: 'lesson6',
    student_id: 'user7',
    file_path: '/submissions/amanda-martinez-divine-attributes.pdf',
    submitted_at: new Date('2024-02-15'),
    grade: null,
    feedback: null,
    updated_at: new Date('2024-02-15')
  },
  {
    id: 'sub9',
    lesson_id: 'lesson7',
    student_id: 'user5',
    file_path: '/submissions/jessica-williams-ethics-paper.pdf',
    submitted_at: new Date('2024-02-18'),
    grade: 93,
    feedback: 'Outstanding.',
    updated_at: new Date('2024-02-20')
  },
  {
    id: 'sub10',
    lesson_id: 'lesson7',
    student_id: 'user6',
    file_path: '/submissions/robert-davis-ethics-paper.pdf',
    submitted_at: new Date('2024-02-20'),
    grade: 89,
    feedback: 'Good.',
    updated_at: new Date('2024-02-22')
  }
];

// Helper functions to get data by class or user
export const getLessonsByClass = (classId: string): Lesson[] => {
  return sampleLessons.filter(lesson => lesson.class_id === classId);
};

export const getStudentsByClass = (classId: string): User[] => {
  const studentIds = sampleEnrollments
    .filter(enrollment => enrollment.class_id === classId)
    .map(enrollment => enrollment.user_id);
  
  return sampleUsers.filter(user => 
    user.role === UserRole.STUDENT && studentIds.includes(user.id)
  );
};

export const getSubmissionsByStudent = (studentId: string): Submission[] => {
  return sampleSubmissions.filter(submission => submission.student_id === studentId);
};

export const getSubmissionsByLesson = (lessonId: string): Submission[] => {
  return sampleSubmissions.filter(submission => submission.lesson_id === lessonId);
};

export const getCurrentUser = (email: string): User | undefined => {
  return sampleUsers.find(user => user.email === email);
};

export const getEnrolledClass = (userId: string): Class | undefined => {
  const enrollment = sampleEnrollments.find(enrollment => enrollment.user_id === userId);
  if (!enrollment) return undefined;
  
  return sampleClasses.find(classItem => classItem.id === enrollment.class_id);
};

// Sample Conversations
export const sampleConversations: Conversation[] = [
  {
    id: 'conv1',
    student_id: 'user2',
    teacher_id: 'user1',
    class_id: 'class1',
    last_message_at: new Date('2024-01-15T14:20:00'),
    unread_count: 2,
    created_at: new Date('2024-01-10T09:00:00')
  },
  {
    id: 'conv2',
    student_id: 'user3',
    teacher_id: 'user1',
    class_id: 'class1',
    last_message_at: new Date('2024-01-14T17:15:00'),
    unread_count: 0,
    created_at: new Date('2024-01-12T10:00:00')
  },
  {
    id: 'conv3',
    student_id: 'user5',
    teacher_id: 'user1',
    class_id: 'class2',
    last_message_at: new Date('2024-01-13T13:20:00'),
    unread_count: 1,
    created_at: new Date('2024-01-11T14:00:00')
  },
  {
    id: 'conv4',
    student_id: 'user4',
    teacher_id: 'user1',
    class_id: 'class1',
    last_message_at: new Date('2024-01-12T09:30:00'),
    unread_count: 0,
    created_at: new Date('2024-01-09T11:00:00')
  },
  {
    id: 'conv5',
    student_id: 'user6',
    teacher_id: 'user1',
    class_id: 'class2',
    last_message_at: new Date('2024-01-11T15:45:00'),
    unread_count: 0,
    created_at: new Date('2024-01-08T13:00:00')
  }
];

// Sample Messages
export const sampleMessages: Message[] = [
  // Conversation 1 - Michael Chen (Hermeneutics questions)
  {
    id: 'msg1',
    conversation_id: 'conv1',
    sender_id: 'user2',
    content: 'Hi Dr. Admin, I\'m working on the hermeneutics assignment.',
    sent_at: new Date('2024-01-15T10:30:00'),
    is_read: false
  },
  {
    id: 'msg2',
    conversation_id: 'conv1',
    sender_id: 'user1',
    content: 'Great question, Michael.',
    sent_at: new Date('2024-01-15T11:00:00'),
    is_read: true
  },
  {
    id: 'msg3',
    conversation_id: 'conv1',
    sender_id: 'user2',
    content: 'I think I understand now.',
    sent_at: new Date('2024-01-15T14:20:00'),
    is_read: false
  },
  
  // Conversation 2 - Emily Rodriguez (Pastoral care discussion)
  {
    id: 'msg4',
    conversation_id: 'conv2',
    sender_id: 'user3',
    content: 'Dr. Admin, I really appreciated your feedback on my pastoral care case study. The suggestion about incorporating family systems theory was very helpful.',
    sent_at: new Date('2024-01-14T15:00:00'),
    is_read: true
  },
  {
    id: 'msg5',
    conversation_id: 'conv2',
    sender_id: 'user1',
    content: 'You\'re very welcome, Emily! Your sensitivity to the family dynamics in that case was excellent. I can see you\'re developing strong pastoral instincts. Have you considered how you might apply these principles in a congregational setting?',
    sent_at: new Date('2024-01-14T16:30:00'),
    is_read: true
  },
  {
    id: 'msg8',
    conversation_id: 'conv2',
    sender_id: 'user3',
    content: 'Yes, I\'ve been thinking about that! I\'m actually working on a ministry project that involves supporting families during transitions. Would it be okay if I shared my approach with you?',
    sent_at: new Date('2024-01-14T17:15:00'),
    is_read: true
  },
  
  // Conversation 3 - Jessica Williams (Theology and ethics)
  {
    id: 'msg6',
    conversation_id: 'conv3',
    sender_id: 'user5',
    content: 'Dr. Admin, I\'m preparing for the divine attributes discussion next week. I found some interesting contemporary perspectives on omnipotence and suffering. Would you recommend any specific readings?',
    sent_at: new Date('2024-01-13T10:00:00'),
    is_read: true
  },
  {
    id: 'msg7',
    conversation_id: 'conv3',
    sender_id: 'user1',
    content: 'Excellent initiative, Jessica! I\'d recommend starting with Plantinga\'s work on the free will defense, and then look at contemporary process theology perspectives. I\'ll send you a detailed reading list by tomorrow. Your engagement with the material is impressive!',
    sent_at: new Date('2024-01-13T11:45:00'),
    is_read: false
  },
  {
    id: 'msg9',
    conversation_id: 'conv3',
    sender_id: 'user5',
    content: 'Thank you! I\'m particularly interested in how these concepts relate to pastoral ministry.',
    sent_at: new Date('2024-01-13T13:20:00'),
    is_read: true
  },
  
  // Conversation 4 - David Thompson (Technical issues)
  {
    id: 'msg10',
    conversation_id: 'conv4',
    sender_id: 'user4',
    content: 'Dr. Admin, I\'m working on my church history research paper. Thanks.',
    sent_at: new Date('2024-01-12T08:00:00'),
    is_read: true
  },
  {
    id: 'msg11',
    conversation_id: 'conv4',
    sender_id: 'user1',
    content: 'Hi David, great question!',
    sent_at: new Date('2024-01-12T09:30:00'),
    is_read: true
  },
  {
    id: 'msg14',
    conversation_id: 'conv4',
    sender_id: 'user4',
    content: 'I\'m thinking about focusing on an essay. Does that sound like a good direction?',
    sent_at: new Date('2024-01-12T10:15:00'),
    is_read: true
  },
  
  // Conversation 5 - Robert Davis (Assignment extension request)
  {
    id: 'msg12',
    conversation_id: 'conv5',
    sender_id: 'user6',
    content: 'Dr. Admin, I\'m struggling with the ethics assignment on bioethics. The case studies are really challenging my thinking.',
    sent_at: new Date('2024-01-11T14:00:00'),
    is_read: true
  },
  {
    id: 'msg13',
    conversation_id: 'conv5',
    sender_id: 'user1',
    content: 'Absolutely, Robert. These are complex issues that require careful theological reflection.',
    sent_at: new Date('2024-01-11T15:45:00'),
    is_read: true
  },
  {
    id: 'msg15',
    conversation_id: 'conv5',
    sender_id: 'user6',
    content: 'Thank you.',
    sent_at: new Date('2024-01-11T16:30:00'),
    is_read: true
  }
];
