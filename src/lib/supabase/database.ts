import { createClient } from './client';
import { Class, User, Lesson, Submission, ClassEnrollment, ClassMeeting, AttendanceRecord } from '@/types/db';
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

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('brand_id', this.brandId)
      .single();

    if (error) {
      // If no user found, return null (don't log as error)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching user by email:', error);
      return null;
    }

    return data;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    try {
      // Use Supabase function to create user (bypasses RLS issues)
      const { data: result, error: functionError } = await this.supabase.rpc('create_user_profile', {
        user_email: userData.email,
        user_name: userData.name,
        user_role: userData.role,
        user_brand_id: this.brandId
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(`Failed to create user profile: ${functionError.message}`);
      }

      if (!result?.success) {
        console.error('Function returned error:', result);
        throw new Error(`Failed to create user profile: ${result?.error || 'Unknown error'}`);
      }

      if (!result.user) {
        throw new Error('User creation succeeded but no user data returned');
      }

      return result.user;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  // Invite user via email - creates auth user and sends invitation using Supabase function
  async inviteUserViaEmail(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Starting invite process for user ID:', userId);

      // Get user details from our database
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('email, name, role, is_active')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        return { success: false, message: 'User not found' };
      }

      // Check if user is already active
      if (userData.is_active) {
        console.log('User is already active');
        return { success: false, message: 'User is already invited' };
      }

      // Call Supabase function to create auth user and send invitation
      console.log('Calling Supabase function to invite user...');
      const { data: result, error: functionError } = await this.supabase.rpc('invite_user', {
        user_id: userId,
        user_email: userData.email,
        user_name: userData.name
      });

      if (functionError) {
        console.error('Function error:', functionError);
        return { success: false, message: `Failed to send invitation: ${functionError.message}` };
      }

      if (result?.success) {
        // Update the user status locally
        await this.updateUser(userId, { is_active: true });
        return { success: true, message: `Invitation sent to ${userData.email}` };
      }

      return { success: false, message: result?.message || 'Failed to send invitation' };

    } catch (error) {
      console.error('Error in inviteUserViaEmail:', error);
      return { success: false, message: 'Failed to send invitation' };
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

      // Add timeout to prevent hanging
      const queryPromise = this.supabase
        .from('users')
        .update({
          is_active: false,
          deactivated_at: deactivationTime
        })
        .eq('id', id)
        .select()
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout - check your connection and permissions')), 10000); // 10 second timeout
      });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as { data: unknown; error: { message: string } | null };

      if (error) {
        throw new Error(`Failed to deactivate user: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from deactivation');
      }

      return data as User;
    } catch (error) {
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

  async getEnrollmentsByClass(classId: string): Promise<ClassEnrollment[]> {
    const { data, error } = await this.supabase
      .from('class_enrollments')
      .select('*')
      .eq('class_id', classId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments by class:', error);
      throw new Error('Failed to fetch enrollments by class');
    }

    return data || [];
  }

  async getStudentsByClass(classId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('class_enrollments')
      .select(`
        user_id,
        users!inner(*)
      `)
      .eq('class_id', classId)
      .eq('users.role', 'student')
      .eq('users.is_active', true);

    if (error) {
      console.error('Error fetching students by class:', error);
      throw new Error('Failed to fetch students by class');
    }

    // Sort the results by user name after fetching
    const sortedData = (data as unknown as Array<{ users: User }>)?.sort((a, b) => 
      a.users.name.localeCompare(b.users.name)
    ) || [];

    return sortedData.map((enrollment) => enrollment.users);
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

  async updateLesson(id: string, updates: Partial<Omit<Lesson, 'id' | 'created_at'>>): Promise<Lesson> {
    try {
      const { data, error } = await this.supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lesson:', error);
        throw new Error(`Failed to update lesson: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from lesson update');
        throw new Error('No data returned from lesson update');
      }

      return data;
    } catch (error) {
      console.error('Exception in updateLesson:', error);
      throw error;
    }
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

  // Class Meeting operations
  async getClassMeetings(): Promise<ClassMeeting[]> {
    const { data, error } = await this.supabase
      .from('class_meetings')
      .select(`
        *,
        classes!inner(brand_id)
      `)
      .eq('classes.brand_id', this.brandId)
      .order('meeting_date', { ascending: false });

    if (error) {
      console.error('Error fetching class meetings:', error);
      throw new Error('Failed to fetch class meetings');
    }

    return data || [];
  }

  async getClassMeetingsByClass(classId: string): Promise<ClassMeeting[]> {
    const { data, error } = await this.supabase
      .from('class_meetings')
      .select(`
        *,
        classes!inner(brand_id)
      `)
      .eq('class_id', classId)
      .eq('classes.brand_id', this.brandId)
      .order('meeting_date', { ascending: false });

    if (error) {
      console.error('Error fetching class meetings by class:', error);
      throw new Error('Failed to fetch class meetings');
    }

    return data || [];
  }

  async createClassMeeting(meetingData: Omit<ClassMeeting, 'id' | 'created_at'>): Promise<ClassMeeting> {
    const { data, error } = await this.supabase
      .from('class_meetings')
      .insert([meetingData])
      .select()
      .single();

    if (error) {
      console.error('Error creating class meeting:', error);
      throw new Error('Failed to create class meeting');
    }

    return data;
  }

  async updateClassMeeting(id: string, updates: Partial<Omit<ClassMeeting, 'id' | 'created_at'>>): Promise<ClassMeeting> {
    const { data, error } = await this.supabase
      .from('class_meetings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating class meeting:', error);
      throw new Error('Failed to update class meeting');
    }

    return data;
  }

  async deleteClassMeeting(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('class_meetings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting class meeting:', error);
      throw new Error('Failed to delete class meeting');
    }
  }

  // Attendance Record operations
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const { data, error } = await this.supabase
      .from('attendance_records')
      .select(`
        *,
        class_meetings!inner(
          class_id,
          classes!inner(brand_id)
        )
      `)
      .eq('class_meetings.classes.brand_id', this.brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attendance records:', error);
      throw new Error('Failed to fetch attendance records');
    }

    return data || [];
  }

  async getAttendanceRecordsByMeeting(meetingId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await this.supabase
      .from('attendance_records')
      .select(`
        *,
        class_meetings!inner(
          class_id,
          classes!inner(brand_id)
        )
      `)
      .eq('meeting_id', meetingId)
      .eq('class_meetings.classes.brand_id', this.brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attendance records by meeting:', error);
      throw new Error('Failed to fetch attendance records');
    }

    return data || [];
  }

  async getAttendanceRecordsByStudent(studentId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await this.supabase
      .from('attendance_records')
      .select(`
        *,
        class_meetings!inner(
          class_id,
          classes!inner(brand_id)
        )
      `)
      .eq('student_id', studentId)
      .eq('class_meetings.classes.brand_id', this.brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attendance records by student:', error);
      throw new Error('Failed to fetch attendance records');
    }

    return data || [];
  }

  async createAttendanceRecord(recordData: Omit<AttendanceRecord, 'id' | 'created_at'>): Promise<AttendanceRecord> {
    const { data, error } = await this.supabase
      .from('attendance_records')
      .insert([recordData])
      .select()
      .single();

    if (error) {
      console.error('Error creating attendance record:', error);
      throw new Error('Failed to create attendance record');
    }

    return data;
  }

  async createAttendanceRecords(recordsData: Omit<AttendanceRecord, 'id' | 'created_at'>[]): Promise<AttendanceRecord[]> {
    const { data, error } = await this.supabase
      .from('attendance_records')
      .insert(recordsData)
      .select();

    if (error) {
      console.error('Error creating attendance records:', error);
      throw new Error('Failed to create attendance records');
    }

    return data || [];
  }

  async updateAttendanceRecord(id: string, updates: Partial<Omit<AttendanceRecord, 'id' | 'created_at'>>): Promise<AttendanceRecord> {
    const { data, error } = await this.supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating attendance record:', error);
      throw new Error('Failed to update attendance record');
    }

    return data;
  }

  async deleteAttendanceRecord(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('attendance_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting attendance record:', error);
      throw new Error('Failed to delete attendance record');
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
