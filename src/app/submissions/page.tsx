'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SimpleHeader from '@/components/SimpleHeader';
import SimpleFooter from '@/components/SimpleFooter';
import { db } from '@/lib/supabase/database';
import { Submission, User, Lesson, Class } from '@/types/db';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  FileText, 
  Star, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download
} from 'lucide-react';

export default function SubmissionsPage() {
  const router = useRouter();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [submissionsData, usersData, lessonsData, classesData] = await Promise.all([
        db.getSubmissions(),
        db.getUsers(),
        db.getLessons(),
        db.getClasses()
      ]);

      setSubmissions(submissionsData);
      setUsers(usersData);
      setLessons(lessonsData);
      setClasses(classesData);

    } catch (err) {
      console.error('Error loading submissions data:', err);
      setError('Failed to load submissions data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = users.find(u => u.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const getStudentEmail = (studentId: string) => {
    const student = users.find(u => u.id === studentId);
    return student?.email || '';
  };

  const getLessonInfo = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson;
  };

  const getClassInfo = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return null;
    const classInfo = classes.find(c => c.id === lesson.class_id);
    return classInfo;
  };

  const filteredSubmissions = submissions.filter(submission => {
    const studentName = getStudentName(submission.student_id).toLowerCase();
    const lesson = getLessonInfo(submission.lesson_id);
    const lessonTitle = lesson?.title?.toLowerCase() || '';
    const classInfo = getClassInfo(submission.lesson_id);
    const className = classInfo?.name?.toLowerCase() || '';
    
    // Search filter
    const matchesSearch = searchTerm === '' || 
      studentName.includes(searchTerm.toLowerCase()) ||
      lessonTitle.includes(searchTerm.toLowerCase()) ||
      className.includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'graded' && submission.grade !== null) ||
      (statusFilter === 'ungraded' && submission.grade === null);
    
    // Class filter
    const matchesClass = classFilter === 'all' || 
      (lesson && lesson.class_id === classFilter);
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const handleViewSubmission = (submissionId: string) => {
    router.push(`/submissions/${submissionId}`);
  };

  const handleDownloadFile = (filePath: string) => {
    // In a real app, this would download the actual file from storage
    alert(`Downloading file: ${filePath}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading submissions...</p>
            </div>
          </div>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Submissions</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={loadData}>Retry</Button>
            </div>
          </div>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900">All Submissions</h1>
            <p className="text-gray-600 mt-2">
              Review and manage all student submissions
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by student, lesson, or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'graded' | 'ungraded')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Submissions</option>
                  <option value="graded">Graded</option>
                  <option value="ungraded">Ungraded</option>
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Classes</option>
                  {classes.map(classItem => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Submissions ({filteredSubmissions.length})
              </h2>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || classFilter !== 'all' 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No submissions have been made yet.'
                  }
                </p>
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
                        Class & Lesson
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {filteredSubmissions.map((submission) => {
                      const studentName = getStudentName(submission.student_id);
                      const studentEmail = getStudentEmail(submission.student_id);
                      const lesson = getLessonInfo(submission.lesson_id);
                      const classInfo = getClassInfo(submission.lesson_id);
                      const isGraded = submission.grade !== null;

                      return (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{studentName}</div>
                              <div className="text-sm text-gray-500">{studentEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {classInfo?.name || 'Unknown Class'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {lesson?.title || 'Unknown Lesson'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isGraded ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Graded
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isGraded ? (
                              <div className="flex items-center">
                                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                                {submission.grade}%
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewSubmission(submission.id)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadFile(submission.file_path)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
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
      </div>
      
      <SimpleFooter />
    </div>
  );
}
