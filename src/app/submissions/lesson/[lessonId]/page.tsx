'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/supabase/database';
import { Submission, User, Lesson, Class, ClassEnrollment } from '@/types/db';
import { UserRole } from '@/types/db';
import { 
  ArrowLeft, 
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Eye,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function LessonSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.lessonId as string;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lessonId) {
      loadData();
    }
  }, [lessonId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load lesson, class, students, and submissions
      const [lessonsData, classesData, enrollmentsData, submissionsData] = await Promise.all([
        db.getLessons(),
        db.getClasses(),
        db.getEnrollments(),
        db.getSubmissions()
      ]);

      // Find the specific lesson
      const targetLesson = lessonsData.find(l => l.id === lessonId);
      if (!targetLesson) {
        setError('Assignment not found');
        return;
      }
      setLesson(targetLesson);

      // Find the class for this lesson
      const targetClass = classesData.find(c => c.id === targetLesson.class_id);
      setClassInfo(targetClass || null);

      // Get all enrollments for this class
      const classEnrollments = enrollmentsData.filter(e => e.class_id === targetLesson.class_id);
      setEnrollments(classEnrollments);

      // Get all users to find students
      const usersData = await db.getUsers();
      
      // Get students enrolled in this class
      const classStudents = usersData.filter(user =>
        user.role === UserRole.STUDENT &&
        classEnrollments.some(enrollment => enrollment.user_id === user.id)
      );
      setStudents(classStudents);

      // Get submissions for this lesson
      const lessonSubmissions = submissionsData.filter(s => s.lesson_id === lessonId);
      setSubmissions(lessonSubmissions);

    } catch (err) {
      console.error('Error loading lesson submissions data:', err);
      setError('Failed to load submission data');
      toast.error('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentSubmission = (studentId: string): Submission | undefined => {
    return submissions.find(s => s.student_id === studentId);
  };

  const getSubmissionStatus = (studentId: string) => {
    const submission = getStudentSubmission(studentId);
    if (!submission) {
      return { status: 'not_submitted', submission: null };
    }
    if (submission.grade !== null) {
      return { status: 'graded', submission };
    }
    return { status: 'submitted', submission };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error || 'Assignment not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const submittedCount = submissions.length;
  const gradedCount = submissions.filter(s => s.grade !== null).length;
  const notSubmittedCount = students.length - submittedCount;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
          <p className="text-gray-600 mb-4">{lesson.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Class:</span> {classInfo?.name || 'Unknown'}
            </div>
            {lesson.due_date && (
              <div>
                <span className="font-medium">Due:</span> {new Date(lesson.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-2xl font-semibold text-gray-900">{submittedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Not Submitted</p>
                <p className="text-2xl font-semibold text-gray-900">{notSubmittedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Graded</p>
                <p className="text-2xl font-semibold text-gray-900">{gradedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students and Submissions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Submissions ({students.length})
          </h2>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
            <p className="text-gray-500">There are no students enrolled in this class.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const { status, submission } = getSubmissionStatus(student.id);
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status === 'not_submitted' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Submitted
                          </span>
                        ) : status === 'submitted' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Graded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission?.grade !== null && submission?.grade !== undefined ? (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-400" />
                            {submission.grade}%
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {submission ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/submissions/${submission.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


