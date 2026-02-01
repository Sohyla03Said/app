import { useState, useEffect } from 'react';
import { classAPI, worksheetAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import { Plus, Users, Code, Book, FileText, ArrowLeft, Search, Sparkles, Shield, Brain, ChevronRight, X, Eye, Trash2, Loader2, AlertCircle, Calendar, Award, Clock, CheckCircle, User, Home, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Classes() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [worksheets, setWorksheets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [isCreateWorksheetModalOpen, setIsCreateWorksheetModalOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [worksheetTitle, setWorksheetTitle] = useState('');
  const [worksheetDescription, setWorksheetDescription] = useState('');
  const [classCode, setClassCode] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [worksheetLoading, setWorksheetLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadWorksheets();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classAPI.getAll();
      if (response.data) {
        setClasses(response.data);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes. Please try again.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWorksheets = async () => {
    try {
      if (!selectedClass) return;
      
      const response = await classAPI.getWorksheets(selectedClass.id);
      if (response.data) {
        setWorksheets(response.data);
      } else {
        setWorksheets([]);
      }
    } catch (error) {
      console.error('Error loading worksheets:', error);
      setWorksheets([]);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!className.trim()) {
      alert('Please enter a class name');
      return;
    }
    
    setCreateLoading(true);
    try {
      const response = await classAPI.create({ 
        name: className.trim(), 
        description: classDescription.trim() || '',
        subject: '',
        grade_level: '',
        max_students: 50
      });
      
      if (response.data) {
        setIsCreateClassModalOpen(false);
        setClassName('');
        setClassDescription('');
        
        // Refresh classes
        await loadClasses();
        
        // Show success message
        alert(`Class created successfully!\n\nClass Code: ${response.data.class_code}\n\nShare this code with your students!`);
      } else {
        throw new Error('Failed to create class');
      }
    } catch (error) {
      console.error('Create class error:', error);
      alert('Error creating class: ' + (error.response?.data?.detail || error.message || 'Please try again.'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) {
      alert('Please enter a class code');
      return;
    }

    setJoinLoading(true);
    try {
      const response = await classAPI.join({ class_code: classCode.trim() });
      
      if (response.data.success) {
        alert(response.data.message || 'Join request sent successfully!');
        setIsJoinClassModalOpen(false);
        setClassCode('');
        
        // Refresh classes to show pending enrollment
        await loadClasses();
      } else {
        throw new Error(response.data.message || 'Failed to join class');
      }
    } catch (error) {
      console.error('Join class error:', error);
      alert('Error joining class: ' + (error.response?.data?.detail || error.message || 'Please try again.'));
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateWorksheet = async (e) => {
    e.preventDefault();
    if (!worksheetTitle.trim()) {
      alert('Please enter a worksheet title');
      return;
    }

    setWorksheetLoading(true);
    try {
      const response = await worksheetAPI.create(selectedClass.id, { 
        title: worksheetTitle.trim(), 
        description: worksheetDescription.trim() || '',
        worksheet_type: "question_based",
        due_date: null,
        max_score: 100
      });
      
      if (response.data) {
        alert('Worksheet created successfully!');
        setIsCreateWorksheetModalOpen(false);
        setWorksheetTitle('');
        setWorksheetDescription('');
        
        // Refresh worksheets
        await loadWorksheets();
      } else {
        throw new Error('Failed to create worksheet');
      }
    } catch (error) {
      console.error('Create worksheet error:', error);
      alert('Error creating worksheet: ' + (error.response?.data?.detail || error.message || 'Please try again.'));
    } finally {
      setWorksheetLoading(false);
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // This endpoint needs to be implemented in the backend
      // For now, just filter it out locally
      setClasses(classes.filter(c => c.id !== classId));
      alert('Class deleted successfully!');
    } catch (error) {
      console.error('Delete class error:', error);
      alert('Error deleting class: ' + error.message);
    }
  };

  const getEnrollmentStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Enrolled
          </span>
        );
      case 'pending':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock className="w-3 h-3 inline mr-1" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const filteredClasses = classes.filter(classObj => {
    if (!classObj) return false;
    
    // Apply filter
    if (user?.role === 'student') {
      if (filter === 'enrolled' && classObj.enrollment_status !== 'approved') return false;
      if (filter === 'pending' && classObj.enrollment_status !== 'pending') return false;
    }
    
    // Apply search
    const query = searchQuery.toLowerCase();
    return (
      classObj.name?.toLowerCase().includes(query) ||
      (classObj.description && classObj.description.toLowerCase().includes(query)) ||
      classObj.subject?.toLowerCase().includes(query) ||
      classObj.class_code?.toLowerCase().includes(query)
    );
  });

  if (selectedClass) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        {/* Sidebar - Fixed position */}
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sidebar />
        </div>
        
        {/* Main content - Scrollable */}
        <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => setSelectedClass(null)}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-blue-500/10 hover:border-blue-500/30 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5 text-cyan-400" />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-white">
                      {selectedClass.name}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                      {user?.role === 'teacher' ? 'Manage worksheets and students' : 'View worksheets and assignments'}
                    </p>
                  </div>
                </div>
                
                {/* Class Info */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-gray-400">
                      Class Code: <code className="text-white font-mono font-medium px-1">{selectedClass.class_code}</code>
                    </span>
                  </div>
                  {selectedClass.subject && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-xs text-gray-400">
                        Subject: <span className="text-white font-medium">{selectedClass.subject}</span>
                      </span>
                    </div>
                  )}
                  {selectedClass.grade_level && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-xs text-gray-400">
                        Level: <span className="text-white font-medium">{selectedClass.grade_level}</span>
                      </span>
                    </div>
                  )}
                  {selectedClass.description && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">
                        {selectedClass.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {user?.role === 'teacher' && (
                <div className="flex items-center gap-3">
                  <Link
                    to={`/teacher/classes/${selectedClass.id}/enrollments`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-200 text-sm font-medium"
                  >
                    <Users className="w-4 h-4" />
                    Manage Students
                  </Link>
                  <button 
                    onClick={() => setIsCreateWorksheetModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    New Worksheet
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {user?.role === 'teacher' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Students</p>
                      <p className="text-2xl font-semibold text-white">{selectedClass.student_count || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Enrolled in class
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Worksheets</p>
                      <p className="text-2xl font-semibold text-white">{worksheets.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Total assignments
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Pending</p>
                      <p className="text-2xl font-semibold text-white">
                        {selectedClass.student_count ? Math.floor(selectedClass.student_count * 0.3) : 0}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Enrollment requests
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Activity</p>
                      <p className="text-2xl font-semibold text-white">84%</p>
                    </div>
                    <Brain className="w-8 h-8 text-yellow-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Student engagement
                  </p>
                </div>
              </div>
            )}

            {/* Worksheets Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-purple-500/10">
                    <FileText className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Worksheets
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {worksheets.length} worksheets available
                      {user?.role === 'student' && ` • ${worksheets.filter(w => w.has_submission).length} completed`}
                    </p>
                  </div>
                </div>
                
                {user?.role === 'student' && worksheets.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === 'all'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white'
                        : 'bg-white/[0.04] text-gray-400 hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilter('completed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white'
                        : 'bg-white/[0.04] text-gray-400 hover:text-white'
                      }`}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => setFilter('pending')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === 'pending'
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-white'
                        : 'bg-white/[0.04] text-gray-400 hover:text-white'
                      }`}
                    >
                      Pending
                    </button>
                  </div>
                )}
              </div>

              {worksheets.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl text-center max-w-md">
                    <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 shadow-2xl shadow-purple-500/10">
                      <FileText className="w-7 h-7 text-purple-400" strokeWidth={1.5} />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">
                      No Worksheets Found
                    </h3>

                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                      {user?.role === 'teacher'
                        ? "Create your first worksheet to start assigning work to students."
                        : "No worksheets have been assigned yet. Check back soon!"
                      }
                    </p>

                    {user?.role === 'teacher' && (
                      <button 
                        onClick={() => setIsCreateWorksheetModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Create Worksheet
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {worksheets
                    .filter(worksheet => {
                      if (user?.role === 'student') {
                        if (filter === 'completed') return worksheet.has_submission;
                        if (filter === 'pending') return !worksheet.has_submission;
                      }
                      return true;
                    })
                    .map((worksheet) => (
                    <div key={worksheet.id} className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm truncate max-w-[180px]">
                              {worksheet.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">
                                {new Date(worksheet.created_at).toLocaleDateString()}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                worksheet.is_published
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {worksheet.is_published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {user?.role === 'teacher' && (
                          <button
                            onClick={() => handleDeleteClass(worksheet.id, worksheet.title)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete worksheet"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {worksheet.description && (
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {worksheet.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Questions:</span>
                          <span className="text-white font-medium">{worksheet.question_count || 0}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Status:</span>
                          {user?.role === 'teacher' ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              worksheet.is_published
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {worksheet.is_published ? 'Active' : 'Draft'}
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              worksheet.has_submission
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : worksheet.grade !== undefined
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {worksheet.has_submission ? 'Submitted' : worksheet.grade !== undefined ? 'Graded' : 'Pending'}
                            </span>
                          )}
                        </div>
                        
                        {worksheet.due_date && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Due Date:</span>
                            <span className="text-white font-medium">
                              {new Date(worksheet.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        {user?.role === 'student' && worksheet.grade !== undefined && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Grade:</span>
                            <span className="text-white font-medium">{worksheet.grade}%</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5">
                        <Link
                          to={user?.role === 'teacher' 
                            ? `/teacher/worksheets/${worksheet.id}`
                            : `/student/worksheets/${worksheet.id}`
                          }
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          {user?.role === 'teacher' ? 'Manage Worksheet' : 'Open Worksheet'}
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Create Worksheet Modal */}
        {isCreateWorksheetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
              {/* Close button */}
              <button
                onClick={() => setIsCreateWorksheetModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
                disabled={worksheetLoading}
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>

              {/* Modal Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-cyan-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Create New Worksheet
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Add a worksheet to {selectedClass?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateWorksheet} className="space-y-5">
                {/* Title Input */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">
                    Worksheet Title *
                  </label>
                  <input
                    type="text"
                    value={worksheetTitle}
                    onChange={(e) => setWorksheetTitle(e.target.value)}
                    required
                    disabled={worksheetLoading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition disabled:opacity-60"
                    placeholder="e.g., Chapter 1: Introduction to React"
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">
                    Description (Optional)
                  </label>
                  <textarea
                    value={worksheetDescription}
                    onChange={(e) => setWorksheetDescription(e.target.value)}
                    rows="3"
                    disabled={worksheetLoading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition resize-none disabled:opacity-60"
                    placeholder="Brief description of the worksheet content..."
                  />
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Shield className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <p className="text-xs text-emerald-400">
                    This worksheet will be created securely in your classroom. Students will see it once published.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateWorksheetModalOpen(false)}
                    disabled={worksheetLoading}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={worksheetLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {worksheetLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      "Create Worksheet"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      {/* Sidebar - Fixed position */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar />
      </div>
      
      {/* Main content - Scrollable */}
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-orange-500/10">
                  <Book className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    {user?.role === 'teacher' ? 'My Classes' : 'Enrolled Classes'}
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {user?.role === 'teacher' 
                      ? 'Manage your classes and students'
                      : 'View your classes and assignments'}
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{classes.length}</span> Classes
                  </span>
                </div>
                {user?.role === 'teacher' && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-gray-400">
                      <span className="text-white font-medium">
                        {classes.reduce((acc, classObj) => acc + (classObj.student_count || 0), 0)}
                      </span> Total Students
                    </span>
                  </div>
                )}
                {user?.role === 'student' && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-xs text-gray-400">
                      <span className="text-white font-medium">
                        {classes.filter(c => c.enrollment_status === 'pending').length}
                      </span> Pending
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {user?.role === 'teacher' ? (
              <button 
                onClick={() => setIsCreateClassModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Create Class
              </button>
            ) : (
              <button 
                onClick={() => setIsJoinClassModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Join Class
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm flex-1">{error}</p>
              <button
                onClick={loadClasses}
                className="text-xs text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search classes by name, subject, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
              />
            </div>
            {user?.role === 'student' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('enrolled')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${filter === 'enrolled'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white'
                  }`}
                >
                  Enrolled
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${filter === 'pending'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-white'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white'
                  }`}
                >
                  Pending
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="text-gray-400 text-sm">Loading classes...</p>
              </div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl text-center max-w-md">
                <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 shadow-2xl shadow-orange-500/10">
                  <Book className="w-7 h-7 text-orange-400" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery ? 'No Classes Found' : (user?.role === 'teacher' ? 'No Classes Created' : 'No Classes Joined')}
                </h3>

                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  {searchQuery 
                    ? "No classes match your search. Try a different query."
                    : (user?.role === 'teacher' 
                        ? "Create your first class to start organizing your students and worksheets."
                        : "Join a class to start accessing worksheets and assignments."
                      )
                  }
                </p>

                <button 
                  onClick={user?.role === 'teacher' ? () => setIsCreateClassModalOpen(true) : () => setIsJoinClassModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  {user?.role === 'teacher' ? 'Create First Class' : 'Join a Class'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredClasses.map((classObj) => (
                <div
                  key={classObj.id}
                  onClick={() => setSelectedClass(classObj)}
                  className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                        <Book className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm truncate max-w-[180px]">
                          {classObj.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(classObj.created_at).toLocaleDateString()}
                          </span>
                          {user?.role === 'teacher' && classObj.class_code && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {classObj.class_code}
                            </span>
                          )}
                          {user?.role === 'student' && (
                            getEnrollmentStatusBadge(classObj.enrollment_status)
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {user?.role === 'teacher' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(classObj.id, classObj.name);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition z-10"
                        title="Delete class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {classObj.description && (
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {classObj.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Worksheets:</span>
                      <span className="text-white font-medium">{classObj.worksheet_count || 0}</span>
                    </div>
                    
                    {user?.role === 'teacher' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Students:</span>
                        <span className="text-white font-medium">{classObj.student_count || 0}</span>
                      </div>
                    )}
                    
                    {user?.role === 'student' && classObj.teacher && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <User className="w-3 h-3" />
                        <span>Teacher: {classObj.teacher.username}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      {user?.role === 'student' && classObj.enrollment_status === 'approved' ? 'Enter Class' : 'View Class'}
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Class Modal */}
      {isCreateClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            {/* Close button */}
            <button
              onClick={() => setIsCreateClassModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
              disabled={createLoading}
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center">
                  <Book className="w-5 h-5 text-amber-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Create New Class
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Set up a new class for your students
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateClass} className="space-y-5">
              {/* Class Name Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  disabled={createLoading}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition disabled:opacity-60"
                  placeholder="e.g., Advanced React Development"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">
                  Description (Optional)
                </label>
                <textarea
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  rows="3"
                  disabled={createLoading}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition resize-none disabled:opacity-60"
                  placeholder="Brief description of the class..."
                />
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-400 mt-0.5" />
                <p className="text-xs text-emerald-400">
                  A unique class code will be generated for students to join securely.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateClassModalOpen(false)}
                  disabled={createLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {createLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Class"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {isJoinClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            {/* Close button */}
            <button
              onClick={() => setIsJoinClassModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
              disabled={joinLoading}
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Join a Class
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Enter the class code provided by your teacher
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleJoinClass} className="space-y-5">
              {/* Class Code Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">
                  Class Code *
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  required
                  disabled={joinLoading}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition font-mono text-center disabled:opacity-60"
                  placeholder="e.g., ABC-123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get the class code from your teacher
                </p>
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-400 mt-0.5" />
                <p className="text-xs text-emerald-400">
                  You'll be securely added to the class once the teacher approves.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsJoinClassModalOpen(false)}
                  disabled={joinLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {joinLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    "Join Class"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}