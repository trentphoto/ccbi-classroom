import { User, UserRole, ClassEnrollment } from '@/types/db';
import { sampleUsers, sampleEnrollments } from './sample-data';

// In a real app, these would be API calls to the backend
// For now, we'll simulate data persistence with localStorage or in-memory updates

// Generate a unique ID for new users
const generateUserId = (): string => {
  return `user${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Add a new user and enroll them in the specified class
export const addUser = (userData: Omit<User, 'id' | 'created_at'>, classId: string): User => {
  const newUser: User = {
    id: generateUserId(),
    ...userData,
    is_active: userData.is_active ?? true, // Default to true if not provided
    deactivated_at: null, // New users are never deactivated
    created_at: new Date()
  };

  // In a real app, this would be an API call
  // For now, we'll just return the new user
  // You could also store this in localStorage for persistence across page reloads
  
  // Add enrollment if the user is a student
  if (userData.role === UserRole.STUDENT) {
    const newEnrollment: ClassEnrollment = {
      user_id: newUser.id,
      class_id: classId,
      enrolled_at: new Date()
    };
    
    // In a real app, this would be an API call
    console.log('New enrollment created:', newEnrollment);
  }

  console.log('New user created:', newUser);
  return newUser;
};

// Update an existing user
export const updateUser = (userId: string, userData: Partial<Omit<User, 'id' | 'created_at'>>): User | null => {
  const existingUser = sampleUsers.find(user => user.id === userId);
  
  if (!existingUser) {
    return null;
  }

  const updatedUser: User = {
    ...existingUser,
    ...userData,
    is_active: userData.is_active ?? existingUser.is_active,
    deactivated_at: userData.deactivated_at ?? existingUser.deactivated_at
  };

  // In a real app, this would be an API call
  console.log('User updated:', updatedUser);
  return updatedUser;
};

// Get user by ID
export const getUserById = (userId: string): User | undefined => {
  return sampleUsers.find(user => user.id === userId);
};

// Check if user is enrolled in a class
export const isUserEnrolledInClass = (userId: string, classId: string): boolean => {
  return sampleEnrollments.some(enrollment => 
    enrollment.user_id === userId && enrollment.class_id === classId
  );
};

// Get all enrollments for a user
export const getUserEnrollments = (userId: string): ClassEnrollment[] => {
  return sampleEnrollments.filter(enrollment => enrollment.user_id === userId);
};

// Remove user enrollment from a class
export const removeUserFromClass = (userId: string, classId: string): boolean => {
  const enrollmentIndex = sampleEnrollments.findIndex(enrollment => 
    enrollment.user_id === userId && enrollment.class_id === classId
  );
  
  if (enrollmentIndex === -1) {
    return false;
  }

  // In a real app, this would be an API call
  console.log('User removed from class:', { userId, classId });
  return true;
};
