import { createClient } from './client';
import { Class, User, Lesson, Submission, ClassEnrollment, UserRole } from '@/types/db';
import { CURRENT_BRAND_ID } from '@/lib/brand';

// Database service class for all Supabase operations
export class DatabaseService {
  private supabase = createClient();
  private brandId = CURRENT_BRAND_ID;

  // Class operations
  async getClasses(): Promise<Class[]> {
    const { data, error } = await this.supabase
      .from('classes')
      .select('*')
      .eq('brand_id', this.brandId)
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
      .eq('brand_id', this.brandId)
      .single();

    if (error) {
      console.error('Error fetching class:', error);
      return null;
    }

    return data;
  }

  async createClass(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<Class> {
    try {
      const classDataWithBrand = {
        ...classData,
        brand_id: this.brandId
      };
      
      const { data, error } = await this.supabase
        .from('classes')
        .insert([classDataWithBrand])
        .select()
        .single();

      if (error) {
        console.error('Error creating class:', error);
        throw new Error(`Failed to create class: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from class creation');
        throw new Error('No data returned from class creation');
      }

      return data;
    } catch (error) {
      console.error('Exception in createClass:', error);
      throw error;
    }
  }

  async updateClass(id: string, updates: Partial<Omit<Class, 'id' | 'created_at'>>): Promise<Class> {
    try {
      const { data, error } = await this.supabase
        .from('classes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating class:', error);
        throw new Error(`Failed to update class: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from class update');
        throw new Error('No data returned from class update');
      }

      return data;
    } catch (error) {
      console.error('Exception in updateClass:', error);
      throw error;
    }
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
      .eq('brand_id', this.brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }

    return data || [];
  }

  async getActiveUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('brand_id', this.brandId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active users:', error);
      throw new Error('Failed to fetch active users');
    }

    return data || [];
  }

  async getInactiveUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('brand_id', this.brandId)
      .eq('is_active', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inactive users:', error);
      throw new Error('Failed to fetch inactive users');
    }

    return data || [];
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('brand_id', this.brandId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    try {
      console.log('Starting createUser process for:', userData.email);

      // First, create the user account via Supabase Auth
      console.log('Step 1: Creating auth account...');
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: 'TempPass123!', // Temporary password - user will need to reset
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });

      console.log('Auth result:', { user: authData?.user?.id, error: authError });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account - no user data returned');
      }

      console.log('Auth user created successfully:', authData.user.id);

      // Then create the user profile in the users table
      console.log('Step 2: Creating user profile...');
      const profileInsertData = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        brand_id: this.brandId, // Add brand_id to user profile
        is_active: userData.is_active ?? true, // Default to true if not provided
        deactivated_at: null // New users are never deactivated
      };
      console.log('Profile insert data:', profileInsertData);

      // Debug: Check current user authentication
      const { data: currentUser } = await this.supabase.auth.getUser();
      console.log('Current authenticated user:', currentUser?.user?.id);

      // Debug: Check if current user is admin
      if (currentUser?.user?.id) {
        const { data: adminCheck } = await this.supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.user.id)
          .single();
        console.log('Current user role check:', adminCheck);
      }

      const { data: profileData, error: profileError } = await this.supabase
        .from('users')
        .insert([profileInsertData])
        .select()
        .single();

      console.log('Profile creation result:', { data: profileData, error: profileError });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        console.error('Full profile error details:', JSON.stringify(profileError, null, 2));
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      if (!profileData) {
        throw new Error('Profile creation succeeded but no data returned');
      }

      console.log('User created successfully:', profileData);
      return profileData;
    } catch (error) {
      console.error('Error in createUser:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw new Error(`Failed to update user: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from update');
        throw new Error('No data returned from update');
      }

      return data;
    } catch (error) {
      console.error('Exception in updateUser:', error);
      throw error;
    }
  }

  async deactivateUser(id: string): Promise<User> {
    try {
      const deactivationTime = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('users')
        .update({ 
          is_active: false, 
          deactivated_at: deactivationTime 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating user:', error);
        throw new Error(`Failed to deactivate user: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from deactivation');
        throw new Error('No data returned from deactivation');
      }

      return data;
    } catch (error) {
      console.error('Exception in deactivateUser:', error);
      throw error;
    }
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

  // Debug method to get current user info
  async getCurrentUserInfo() {
    const { data: currentUser } = await this.supabase.auth.getUser();
    const currentUserId = currentUser?.user?.id;

    if (!currentUserId) {
      return {
        currentUserId: null,
        userData: null,
        userError: 'No authenticated user',
        isAdmin: false,
        authStatus: 'not_authenticated'
      };
    }

    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('id, email, role')
      .eq('id', currentUserId)
      .single();

    return {
      currentUserId,
      userData,
      userError,
      isAdmin: userData?.role === 'admin',
      authStatus: 'authenticated'
    };
  }
}

// Export singleton instance
export const db = new DatabaseService();
