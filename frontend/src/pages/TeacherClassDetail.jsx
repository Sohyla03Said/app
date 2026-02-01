import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { classAPI, worksheetAPI, aiAPI, chatAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  Book, Users, FileText, MessageSquare, Calendar, Award,
  ChevronRight, Eye, Download, Bell, Folder,
  BarChart3, Target, Star, BookOpen, Video, Music,
  Loader2, AlertCircle, Home, ExternalLink, ChevronLeft,
  File, Image, Upload, CheckCircle, XCircle, Send,
  Share, Copy, MoreVertical, Settings, Trash2,
  MessageCircle, Bookmark, Heart, Flag, UserPlus,
  Edit, Plus, Search, Filter, X, ArrowLeft,
  Mail, Phone, Award as AwardIcon, Brain, Bot, User, Sparkles,
  Zap, Lightbulb, Hash, Maximize2, Minimize2, Clock,
  FileIcon, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function TeacherClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [classData, setClassData] = useState(null);
  const [worksheets, setWorksheets] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [error, setError] = useState(null);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation(); 
  const [stats, setStats] = useState({
    totalWorksheets: 0,
    averageGrade: 0,
    totalStudents: 0,
    pendingEnrollments: 0,
    totalSubmissions: 0,
    completionRate: 0
  });
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [currentAiChatId, setCurrentAiChatId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatMessages]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      
      // Load class details
      const classResponse = await classAPI.getDetails(classId);
      setClassData(classResponse.data);
      
      // Load worksheets for this class
      await loadWorksheets();
      
      // Load students
      await loadStudents();
      
      // Load enrollments
      await loadEnrollments();
      
  
      
      // Calculate stats
      calculateStats();
      
    } catch (error) {
      console.error('Error loading class data:', error);
      setError(error.response?.data?.detail || 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const loadWorksheets = async () => {
    try {
      const response = await classAPI.getClassWorksheets(classId);
      console.log('Worksheets response:', response.data);
      
      // Ensure we have an array
      const worksheetsData = Array.isArray(response.data) ? response.data : [];
      
      // Map worksheets properly
      const enhancedWorksheets = worksheetsData.map(worksheet => {
        // Calculate worksheet stats
        const submissionCount = worksheet.submission_count || 0;
        const studentCount = stats.totalStudents || 0;
        const completionRate = studentCount > 0 ? Math.round((submissionCount / studentCount) * 100) : 0;
        
        return {
          id: worksheet.id,
          title: worksheet.title || 'Untitled Worksheet',
          description: worksheet.description || 'No description',
          worksheet_type: worksheet.worksheet_type || 'QUESTION_BASED',
          is_published: worksheet.is_published || false,
          due_date: worksheet.due_date,
          max_score: worksheet.max_score || 100,
          average_grade: worksheet.average_grade || 0,
          submission_count: submissionCount,
          completion_rate: completionRate,
          pending_grading: worksheet.pending_grading || 0,
          created_at: worksheet.created_at
        };
      });
      
      setWorksheets(enhancedWorksheets);
      
      // Update stats with worksheet count
      setStats(prev => ({
        ...prev,
        totalWorksheets: enhancedWorksheets.length
      }));
      
    } catch (error) {
      console.warn('Could not load worksheets:', error);
      // Set empty array if error
      setWorksheets([]);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await classAPI.getStudents(classId);
      const studentsData = response.data || [];
      
      // Map students data properly
      const enhancedStudents = studentsData.map(student => {
        // Use proper student data structure
        const studentName = student.full_name || 
                          `${student.first_name || ''} ${student.last_name || ''}`.trim() || 
                          student.username;
        
        return {
          id: student.id,
          full_name: studentName,
          email: student.email || 'No email',
          username: student.username || 'N/A',
          completed_worksheets: student.completed_worksheets || 0,
          average_grade: student.average_grade || 0,
          joined_at: student.enrolled_at || student.created_at || student.joined_at || 'Not available'
        };
      });
      
      setStudents(enhancedStudents);
      
      // Update stats with student count
      setStats(prev => ({
        ...prev,
        totalStudents: enhancedStudents.length
      }));
      
    } catch (error) {
      console.warn('Could not load students:', error);
      // Set empty array if error
      setStudents([]);
    }
  };

  const loadEnrollments = async () => {
    try {
      const response = await classAPI.getEnrollments(classId);
      const enrollmentsData = response.data || [];
      setEnrollments(enrollmentsData);
      
      // Calculate pending enrollments
      const pendingCount = enrollmentsData.filter(e => e.status === 'pending').length;
      setStats(prev => ({
        ...prev,
        pendingEnrollments: pendingCount
      }));
      
    } catch (error) {
      console.warn('Could not load enrollments:', error);
      setEnrollments([]);
    }
  };

  const calculateStats = () => {
    // Calculate average grade from all worksheets
    const totalGrade = worksheets.reduce((sum, worksheet) => sum + (worksheet.average_grade || 0), 0);
    const averageGrade = worksheets.length > 0 ? Math.round(totalGrade / worksheets.length) : 0;
    
    // Calculate total submissions
    const totalSubmissions = worksheets.reduce((sum, worksheet) => sum + (worksheet.submission_count || 0), 0);
    
    // Calculate completion rate
    const totalPossibleSubmissions = worksheets.length * stats.totalStudents;
    const completionRate = totalPossibleSubmissions > 0 ? Math.round((totalSubmissions / totalPossibleSubmissions) * 100) : 0;
    
    setStats(prev => ({
      ...prev,
      averageGrade,
      totalSubmissions,
      completionRate
    }));
  };

  const generateSuggestedPrompts = async (className) => {
    try {
      const prompts = [
        `What's the overall performance trend in ${className}?`,
        `Which students need the most attention in ${className}?`,
        `Generate suggestions to improve engagement in ${className}`,
        `What teaching strategies would work best for ${className} based on current data?`,
        `Analyze assignment completion patterns in ${className}`,
        `Suggest interventions for struggling students in ${className}`,
        `How can I differentiate instruction for ${className}?`,
        `What are the strengths and weaknesses of ${className} based on current performance?`
      ];
      setSuggestedPrompts(prompts);
    } catch (error) {
      console.error('Error generating prompts:', error);
    }
  };

  // ADDED: Delete class function
  const handleDeleteClass = async () => {
    if (!window.confirm(`Are you sure you want to delete "${classData.name}"? This will delete all worksheets, enrollments, and related data permanently. This action cannot be undone!`)) {
      return;
    }

    try {
      await classAPI.delete(classId);
      
      // Show success message
      alert(`Class "${classData.name}" deleted successfully!`);
      
      // Navigate back to classes page
      navigate('/teacher/classes');
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Error deleting class: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleApproveEnrollment = async (enrollmentId) => {
    try {
      await classAPI.approveEnrollment(enrollmentId);
      // Reload data
      await loadEnrollments();
      await loadStudents();
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalStudents: prev.totalStudents + 1,
        pendingEnrollments: Math.max(0, prev.pendingEnrollments - 1)
      }));
    } catch (error) {
      alert('Error approving enrollment: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRejectEnrollment = async (enrollmentId) => {
    try {
      await classAPI.rejectEnrollment(enrollmentId);
      await loadEnrollments();
      setStats(prev => ({
        ...prev,
        pendingEnrollments: Math.max(0, prev.pendingEnrollments - 1)
      }));
    } catch (error) {
      alert('Error rejecting enrollment: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteWorksheet = async (worksheetId) => {
    if (window.confirm('Are you sure you want to delete this worksheet? This will also delete all student submissions.')) {
      try {
        await worksheetAPI.delete(worksheetId);
        // Update local state
        setWorksheets(worksheets.filter(w => w.id !== worksheetId));
        
        // Update stats
        setStats(prev => ({ ...prev, totalWorksheets: prev.totalWorksheets - 1 }));
        alert('Worksheet deleted successfully!');
      } catch (error) {
        alert('Error deleting worksheet: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleQuickPrompt = (prompt) => {
    setAiChatInput(prompt);
  };

  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiChatInput.trim() || aiChatLoading) return;

    const userMessage = aiChatInput;
    setAiChatInput('');

    const tempMsg = { 
      id: Date.now(), 
      role: 'user', 
      content: userMessage, 
      timestamp: new Date().toISOString() 
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getWorksheetIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'QUESTION_BASED':
        return <Book className="w-5 h-5 text-orange-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWorksheetStats = (worksheet) => {
    const submissionCount = worksheet.submission_count || 0;
    const studentCount = stats.totalStudents;
    const completionRate = studentCount > 0 ? Math.round((submissionCount / studentCount) * 100) : 0;
    
    return {
      submissionCount,
      completionRate,
      averageGrade: worksheet.average_grade || 0,
      pendingGrading: worksheet.pending_grading || 0
    };
  };

  const renderStudentsTab = () => {
    return (
      <div className="mt-6">
        <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Students</h3>
              <p className="text-sm text-gray-400 mt-1">
                {students.length} enrolled students
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition text-sm"
                />
              </div>
              <button 
                onClick={() => setShowEnrollmentsModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition"
              >
                <UserPlus className="w-4 h-4" />
                Enrollments
                {stats.pendingEnrollments > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {stats.pendingEnrollments}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400 mb-2">
                {searchQuery ? 'No students found' : 'No students enrolled yet'}
              </p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try a different search query' : 'Share the class code with students to enroll'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div key={student.id} className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/30 transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-400">
                        {student.full_name?.[0] || student.username?.[0] || 'S'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {student.full_name || student.username || 'Student'}
                      </h4>
                      <p className="text-xs text-gray-400">@{student.username || 'username'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{student.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white font-medium">
                      {student.username || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-medium truncate max-w-[150px]">
                      {student.email || 'No email'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Enrolled:</span>
                    <span className="text-white font-medium">
                      {formatDate(student.joined_at)}
                    </span>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWorksheetsTab = () => {
    return (
      <div className="mt-6">
        <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Worksheets</h3>
              <p className="text-sm text-gray-400 mt-1">
                {worksheets.length} worksheets • Create and manage assignments
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                to={`/teacher/classes/${classId}/worksheets/create`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition"
              >
                <Plus className="w-4 h-4" />
                Create New Worksheet
              </Link>
            </div>
          </div>
          
          {worksheets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400 mb-2">No worksheets available yet</p>
              <p className="text-sm text-gray-500 mb-6">Create your first worksheet for this class</p>
              <Link
                to={`/teacher/classes/${classId}/worksheets/create`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition"
              >
                <Plus className="w-4 h-4" />
                Create Your First Worksheet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worksheets.map((worksheet) => {
                const worksheetStats = getWorksheetStats(worksheet);
                
                return (
                  <div key={worksheet.id} className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/30 transition group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getWorksheetIcon(worksheet.worksheet_type)}
                        <span className={`text-xs px-2 py-1 rounded-full ${worksheet.is_published
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {worksheet.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteWorksheet(worksheet.id)}
                        className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <Link to={`/teacher/worksheets/${worksheet.id}`} className="block">
                      <h4 className="font-medium text-white mb-2 line-clamp-2 hover:text-orange-400 transition">
                        {worksheet.title}
                      </h4>
                    </Link>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{worksheet.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Submissions:</span>
                        <span className="text-white font-medium">
                          {worksheetStats.submissionCount}/{stats.totalStudents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Avg. Grade:</span>
                        <span className="text-white font-medium">
                          {worksheetStats.averageGrade > 0 ? `${worksheetStats.averageGrade}%` : 'No grades'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Due Date:</span>
                        <span className="text-white font-medium">
                          {worksheet.due_date ? formatDate(worksheet.due_date) : 'No due date'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/teacher/worksheets/${worksheet.id}`}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <Link
                        to={`/teacher/worksheets/${worksheet.id}/edit`}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAiActionTab = () => {
    const aiTools = [
      {
        id: 'analyze',
        name: 'Class Analysis',
        description: 'Get comprehensive class insights',
        icon: <BarChart3 className="w-4 h-4" />,
        color: 'from-orange-500 to-yellow-400',
        action: () => handleQuickPrompt(`Analyze the performance and engagement in ${classData?.name}`)
      },
      {
        id: 'suggestions',
        name: 'Teaching Strategies',
        description: 'Personalized teaching suggestions',
        icon: <Lightbulb className="w-4 h-4" />,
        color: 'from-emerald-500 to-green-400',
        action: () => handleQuickPrompt(`Suggest teaching strategies for ${classData?.name}`)
      },
      {
        id: 'interventions',
        name: 'Student Interventions',
        description: 'Identify and plan interventions',
        icon: <Target className="w-4 h-4" />,
        color: 'from-purple-500 to-pink-400',
        action: () => handleQuickPrompt(`Which students need interventions in ${classData?.name}?`)
      }
    ];

  };

  const tabs = [
    { 
      id: 'students', 
      name: 'Students', 
      icon: <Users className="w-4 h-4" />,
      content: renderStudentsTab()
    },
    { 
      id: 'worksheets', 
      name: 'Worksheets', 
      icon: <FileText className="w-4 h-4" />,
      content: renderWorksheetsTab()
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
          <Sidebar />
        </div>
        
        <div className="lg:hidden">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading class details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
          <Sidebar />
        </div>
        
        <div className="lg:hidden">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto p-8">
          <div className="flex items-center justify-center py-20">
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl text-center max-w-md">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 shadow-2xl shadow-orange-500/10">
                <Book className="w-7 h-7 text-orange-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Class Not Found
              </h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                {error || 'The class you are looking for does not exist.'}
              </p>
              <Link
                to="/teacher/classes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Classes
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      {/* Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>
      
      <div className="lg:hidden">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(600px at 20% 20%, rgba(59, 130, 246, 0.05), transparent 40%),
                        radial-gradient(600px at 80% 80%, rgba(139, 92, 246, 0.05), transparent 40%)`
          }} />
        </div>
        
        <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header - MODIFIED: Added Delete Class Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-orange-500/10">
                  <Book className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/teacher/classes"
                      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Classes
                    </Link>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white mt-1">
                    {classData.name}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {stats.totalStudents} students
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {stats.totalWorksheets} worksheets
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {stats.averageGrade}% average
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowEnrollmentsModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Enrollments
                {stats.pendingEnrollments > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {stats.pendingEnrollments}
                  </span>
                )}
              </button>
          
              {/* ADDED: Delete Class Button */}
              <button 
                onClick={handleDeleteClass}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete Class
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mt-2 mb-2">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
                    relative rounded-t-2xl
                    ${activeTab === tab.id 
                      ? 'text-white bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 border-b-0 shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-800/50 hover:to-gray-900/50 hover:backdrop-blur-sm border border-transparent hover:border-white/5'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.name}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="mt-6">
            {tabs.find(tab => tab.id === activeTab)?.content}
          </div>
        </div>
      </main>

      {/* Enrollments Modal */}
      {showEnrollmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            <button
              onClick={() => setShowEnrollmentsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Enrollment Requests
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Manage student enrollment requests
                  </p>
                </div>
              </div>
            </div>

            {enrollments.filter(e => e.status === 'pending').length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400">No pending enrollment requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.filter(e => e.status === 'pending').map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          {enrollment.student?.full_name || enrollment.student?.username || 'Unknown Student'}
                        </h4>
                        <p className="text-sm text-gray-400">{enrollment.student?.email || 'No email'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Pending
                          </span>
                          <span className="text-xs text-gray-400">
                            Requested: {formatDate(enrollment.requested_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveEnrollment(enrollment.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 hover:border-green-500/50 transition-all text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectEnrollment(enrollment.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}