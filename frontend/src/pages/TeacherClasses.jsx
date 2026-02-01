import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { classAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { 
  Plus, Users, Book, FileText, Settings, MoreVertical, 
  Search, Filter, ChevronRight, Eye, Edit, Trash2,
  CheckCircle, XCircle, Clock, UserPlus, Download,
  BarChart3, MessageSquare, Upload, Calendar, Home,
  X, Loader2, AlertCircle, ArrowLeft, User, Shield, Award, Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherClasses() {
  const user = useAuthStore((state) => state.user);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    subject: '',
    grade_level: '',
    max_students: 50
  });
  const [error, setError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classAPI.getAll();
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes. Please try again.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async (classId) => {
    try {
      const response = await classAPI.getEnrollments(classId);
      setEnrollments(response.data || []);
      setSelectedClass(classId);
      setShowEnrollmentsModal(true);
    } catch (error) {
      console.error('Error loading enrollments:', error);
      alert('Failed to load enrollments: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClass.name.trim()) {
      alert('Please enter a class name');
      return;
    }
    
    setCreateLoading(true);
    try {
      const response = await classAPI.create(newClass);
      setShowCreateModal(false);
      setNewClass({
        name: '',
        description: '',
        subject: '',
        grade_level: '',
        max_students: 50
      });
      await loadClasses();
      alert(`Class created successfully!\n\nClass Code: ${response.data.class_code}\n\nShare this code with your students!`);
    } catch (error) {
      alert('Error creating class: ' + (error.response?.data?.detail || error.message || 'Please try again.'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleApproveEnrollment = async (enrollmentId) => {
    try {
      await classAPI.approveEnrollment(enrollmentId);
      loadEnrollments(selectedClass);
      alert('Enrollment approved!');
    } catch (error) {
      alert('Error approving enrollment: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRejectEnrollment = async (enrollmentId) => {
    try {
      await classAPI.rejectEnrollment(enrollmentId);
      loadEnrollments(selectedClass);
      alert('Enrollment rejected!');
    } catch (error) {
      alert('Error rejecting enrollment: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteRequest = (classObj) => {
    setClassToDelete(classObj);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setDeleting(true);
    try {
      // This endpoint needs to be implemented in the backend
      // For now, just filter it out locally
      setClasses(classes.filter(c => c.id !== classToDelete.id));
      alert(`Class "${classToDelete.name}" deleted successfully!`);
      setDeleteModalOpen(false);
      setClassToDelete(null);
    } catch (error) {
      alert('Error deleting class: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.class_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading classes...</p>
          </div>
        </div>
      );
    }

    if (filteredClasses.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl text-center max-w-md">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 shadow-2xl shadow-orange-500/10">
              <Book className="w-7 h-7 text-orange-400" strokeWidth={1.5} />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'No Classes Found' : 'No Classes Created'}
            </h3>

            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              {searchQuery 
                ? "No classes match your search. Try a different query."
                : "Create your first class to start organizing your students, worksheets, and materials."
              }
            </p>

            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Create Your First Class
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredClasses.map((classObj) => (
          <div key={classObj.id} className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20">
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
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {classObj.class_code}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteRequest(classObj)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {classObj.description && (
                <p className="text-xs text-gray-400 line-clamp-2">
                  {classObj.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Students:</span>
                <span className="text-white font-medium">{classObj.student_count || 0}/{classObj.max_students || 50}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Worksheets:</span>
                <span className="text-white font-medium">{classObj.worksheet_count || 0}</span>
              </div>
              
              {classObj.subject && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Subject:</span>
                  <span className="text-white font-medium">{classObj.subject}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`/teacher/classes/${classObj.id}`}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all text-xs font-medium"
                >
                  <Eye className="w-3 h-3" />
                  View
                </Link>
                
                <button 
                  onClick={() => loadEnrollments(classObj.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all text-xs-bold font-medium"
                >
                  <UserPlus className="w-3 h-3" />
                  Enrollments
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>
      
      <div className="lg:hidden">
        <Sidebar />
      </div>
      
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        {/* Background gradient effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(600px at 20% 20%, rgba(249, 115, 22, 0.05), transparent 40%),
                        radial-gradient(600px at 80% 80%, rgba(251, 191, 36, 0.05), transparent 40%)`
          }} />
        </div>
        
        <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-orange-500/10">
                  <Brain className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    My Classes
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Manage your classes and students
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{classes.length}</span> Active Classes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {classes.reduce((acc, cls) => acc + (cls.student_count || 0), 0)}
                    </span> Total Students
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Create New Class
            </button>
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
          <br></br>
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search classes by name, subject, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
              />
            </div>
            <div className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              {filteredClasses.length} classes
            </div>
          </div>
          <br></br>

          {renderContent()}
        </div>
        
      </main>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
              disabled={createLoading}
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-amber-400" />
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

            <form onSubmit={handleCreateClass} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    required
                    disabled={createLoading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition disabled:opacity-60"
                    placeholder="e.g., Advanced Calculus"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">
                    Subject
                  </label>
                  <select
                    value={newClass.subject}
                    onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                    disabled={createLoading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition disabled:opacity-60"
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="English">English</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Art">Art</option>
                    <option value="Music">Music</option>
                    <option value="Physical Education">Physical Education</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    value={newClass.grade_level}
                    onChange={(e) => setNewClass({...newClass, grade_level: e.target.value})}
                    disabled={createLoading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition disabled:opacity-60"
                    placeholder="e.g., Grade 11, University, etc."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">
                    Max Students
                  </label>
                  <input
                    type="number"
                    value={newClass.max_students}
                    onChange={(e) => setNewClass({...newClass, max_students: parseInt(e.target.value)})}
                    min="1"
                    max="100"
                    disabled={createLoading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">
                  Description
                </label>
                <textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                  rows="3"
                  disabled={createLoading}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition resize-none disabled:opacity-60"
                  placeholder="Describe what this class is about..."
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-400 mt-0.5" />
                <p className="text-xs text-emerald-400">
                  A unique class code will be generated for students to join securely.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
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

            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400">No pending enrollment requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          {enrollment.student?.full_name || enrollment.student?.username || 'Unknown Student'}
                        </h4>
                        <p className="text-sm text-gray-400">{enrollment.student?.email || 'No email'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            enrollment.status === 'pending' 
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : enrollment.status === 'approved'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {enrollment.status?.charAt(0).toUpperCase() + enrollment.status?.slice(1) || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400">
                            Requested: {new Date(enrollment.requested_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {enrollment.status === 'pending' && (
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
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
              disabled={deleting}
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 shadow-lg shadow-red-500/10 mb-3">
                <Trash2 className="w-6 h-6 text-red-400" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Confirm Deletion
              </h2>
            </div>

            <p className="text-sm text-gray-400 text-center mb-6">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">
                "{classToDelete?.name}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-pink-400 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition disabled:opacity-60"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete Class"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}