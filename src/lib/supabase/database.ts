import { createClient } from './client';
import { Class, User, Lesson, Submission, ClassEnrollment, UserRole } from '@/types/db';

// Database service class for all Supabase operations
export class DatabaseService {
  private supabase = createClient();

  // Class operations
  async getClasses(): Promise<Class[]> {
    const { data, error } = await this.supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching classes:', error);
      throw new Error('Failed to fetch classes');
    }

    return data || [];
  }

  async getClassById(id: string): Promise<Class | null> {
    const { data, error } = await this.supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching class:', error);
      return null;
    }

    return data;
  }

  async createClass(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<Class> {
    const { data, error } = await this.supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      throw new Error('Failed to create class');
    }

    return data;
  }

  async updateClass(id: string, updates: Partial<Omit<Class, 'id' | 'created_at'>>): Promise<Class> {
    const { data, error } = await this.supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating class:', error);
      throw new Error('Failed to update class');
    }

    return data;
  }

  async deleteClass(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting class:', error);
      throw new Error('Failed to delete class');
    }
  }

  // User operations
  async getUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }

    return data || [];
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }

    return data;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }

    return data;
  }

  // Enrollment operations
  async getEnrollments(): Promise<ClassEnrollment[]> {
    const { data, error } = await this.supabase
      .from('class_enrollments')
      .select('*')
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments:', error);
      throw new Error('Failed to fetch enrollments');
    }

    return data || [];
  }

  async getEnrollmentByUserId(userId: string): Promise<ClassEnrollment | null> {
    const { data, error } = await this.supabase
      .from('class_enrollments')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching enrollment:', error);
      return null;
    }

    return data;
  }

  async createEnrollment(enrollmentData: Omit<ClassEnrollment, 'enrolled_at'>): Promise<ClassEnrollment> {
    const { data, error } = await this.supabase
      .from('class_enrollments')
      .insert([enrollmentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating enrollment:', error);
      throw new Error('Failed to create enrollment');
    }

    return data;
  }

  async updateEnrollment(userId: string, classId: string): Promise<ClassEnrollment> {
    const { data, error } = await this.supabase
      .from('class_enrollments')
      .update({ class_id: classId, enrolled_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating enrollment:', error);
      throw new Error('Failed to update enrollment');
    }

    return data;
  }

  async deleteEnrollment(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('class_enrollments')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting enrollment:', error);
      throw new Error('Failed to delete enrollment');
    }
  }

  // Lesson operations
  async getLessons(): Promise<Lesson[]> {
    const { data, error } = await this.supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lessons:', error);
      throw new Error('Failed to fetch lessons');
    }

    return data || [];
  }

  async getLessonsByClass(classId: string): Promise<Lesson[]> {
    const { data, error } = await this.supabase
      .from('lessons')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lessons by class:', error);
      throw new Error('Failed to fetch lessons by class');
    }

    return data || [];
  }

  async createLesson(lessonData: Omit<Lesson, 'id' | 'created_at'>): Promise<Lesson> {
    const { data, error } = await this.supabase
      .from('lessons')
      .insert([lessonData])
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      throw new Error('Failed to create lesson');
    }

    return data;
  }

  // Submission operations
  async getSubmissions(): Promise<Submission[]> {
    const { data, error } = await this.supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      throw new Error('Failed to fetch submissions');
    }

    return data || [];
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    const { data, error } = await this.supabase
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions by student:', error);
      throw new Error('Failed to fetch submissions by student');
    }

    return data || [];
  }

  async createSubmission(submissionData: Omit<Submission, 'id' | 'submitted_at' | 'updated_at'>): Promise<Submission> {
    const { data, error } = await this.supabase
      .from('submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating submission:', error);
      throw new Error('Failed to create submission');
    }

    return data;
  }

  async updateSubmissionGrade(id: string, grade: number, feedback?: string): Promise<Submission> {
    const { data, error } = await this.supabase
      .from('submissions')
      .update({ 
        grade, 
        feedback, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating submission grade:', error);
      throw new Error('Failed to update submission grade');
    }

    return data;
  }
}

// Export singleton instance
export const db = new DatabaseService();
