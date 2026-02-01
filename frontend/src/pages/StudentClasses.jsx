import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { classAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { 
  Search, Book, Users, Eye, Plus, Filter, 
  Clock, CheckCircle, XCircle, User, 
  ChevronRight, MessageSquare, FileText,
  Globe, Shield, BarChart3, Calendar,
  ArrowLeft, Loader2, AlertCircle, UserCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function StudentClasses() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [publicClasses, setPublicClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinMethod, setJoinMethod] = useState('code');
  const [classCode, setClassCode] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      // Load enrolled classes
      const enrolledResponse = await classAPI.getAll();
      setEnrolledClasses(enrolledResponse.data || []);
      
      // Load public classes for browsing
      const publicResponse = await classAPI.getPublicClasses();
      setPublicClasses(publicResponse.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes. Please try again.');
      setEnrolledClasses([]);
      setPublicClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    
    if (joinMethod === 'code' && !classCode.trim()) {
      alert('Please enter a class code');
      return;
    }
    
    if (joinMethod === 'teacher' && !teacherUsername.trim()) {
      alert('Please enter a teacher username');
      return;
    }

    setJoinLoading(true);
    try {
      const requestData = joinMethod === 'code' 
        ? { class_code: classCode.trim() }
        : { teacher_username: teacherUsername.trim() };
      
      // Use the correct API function
      const response = await classAPI.joinClass(requestData);
      
      if (response.data.success) {
        setShowJoinModal(false);
        setClassCode('');
        setTeacherUsername('');
        
        // Refresh the data to show the pending enrollment
        await loadData();
        
        alert('Join request sent successfully! Waiting for teacher approval.');
      } else {
        alert('Failed to send join request: ' + response.data.message);
      }
    } catch (error) {
      console.error('Join error:', error);
      alert('Error joining class: ' + (error.response?.data?.detail || error.message || 'Please try again.'));
    } finally {
      setJoinLoading(false);
    }
  };

  const handleEnterClass = (classId) => {
    navigate(`/student/classes/${classId}`);
  };

  const getEnrollmentStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-3 h-3 inline mr-1" />
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

  const filteredClasses = enrolledClasses.filter(cls => {
    if (!cls) return false;
    
    const name = cls.name?.toLowerCase() || '';
    const subject = cls.subject?.toLowerCase() || '';
    const teacherName = cls.teacher?.username?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(query) || subject.includes(query) || teacherName.includes(query);
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'enrolled') return cls.enrollment_status === 'approved' && matchesSearch;
    if (filter === 'pending') return cls.enrollment_status === 'pending' && matchesSearch;
    return matchesSearch;
  });

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
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 shadow-2xl shadow-orange-500/10">
              <Book className="w-7 h-7 text-orange-400" strokeWidth={1.5} />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery || filter !== 'all' ? 'No Classes Found' : 'No Classes Yet'}
            </h3>

            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              {searchQuery 
                ? "No classes match your search. Try a different query."
                : filter === 'enrolled'
                ? "You haven't joined any classes yet. Join your first class to get started."
                : filter === 'pending'
                ? "No pending class requests."
                : "Get started by joining your first class to access worksheets and learning materials."
              }
            </p>

            <button 
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Join Class
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center">
                  <Book className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm truncate max-w-[180px]">
                    {classObj.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {classObj.subject || 'General'}
                    </span>
                    {getEnrollmentStatusBadge(classObj.enrollment_status)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Teacher:</span>
                <span className="text-white font-medium">{classObj.teacher?.username || 'Unknown'}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Students:</span>
                <span className="text-white font-medium">{classObj.student_count || 0}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Worksheets:</span>
                <span className="text-white font-medium">{classObj.worksheet_count || 0}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              {classObj.enrollment_status === 'approved' ? (
                <button 
                  onClick={() => handleEnterClass(classObj.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Enter Class
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-yellow-300 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Waiting for Approval
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        {/* Background gradient effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(600px at 20% 20%, rgba(249, 115, 22, 0.05), transparent 40%),
                        radial-gradient(600px at 80% 80%, rgba(251, 191, 36, 0.05), transparent 40%)`
          }} />
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-orange-500/10">
                  <Book className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    My Classes
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Access your classes, worksheets, and learning materials
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {enrolledClasses.filter(c => c.enrollment_status === 'approved').length}
                    </span> Enrolled
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {enrolledClasses.filter(c => c.enrollment_status === 'pending').length}
                    </span> Pending
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{enrolledClasses.length}</span> Total
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Join Class
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={loadData}
                className="ml-auto text-xs text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Tabs with modern design */}
          <div className="mt-2 mb-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setFilter('all')}
                className={`
                  flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
                  relative rounded-t-2xl
                  ${filter === 'all'
                    ? 'text-white bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 border-b-0 shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-800/50 hover:to-gray-900/50 hover:backdrop-blur-sm border border-transparent hover:border-white/5'
                  }
                `}
              >
                All Classes
                {filter === 'all' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-400" />
                )}
              </button>
              
              <button
                onClick={() => setFilter('enrolled')}
                className={`
                  flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
                  relative rounded-t-2xl
                  ${filter === 'enrolled'
                    ? 'text-white bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 border-b-0 shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-800/50 hover:to-gray-900/50 hover:backdrop-blur-sm border border-transparent hover:border-white/5'
                  }
                `}
              >
                Enrolled
                {filter === 'enrolled' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-400" />
                )}
              </button>
              
              <button
                onClick={() => setFilter('pending')}
                className={`
                  flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
                  relative rounded-t-2xl
                  ${filter === 'pending'
                    ? 'text-white bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 border-b-0 shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-800/50 hover:to-gray-900/50 hover:backdrop-blur-sm border border-transparent hover:border-white/5'
                  }
                `}
              >
                Pending
                {filter === 'pending' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-400" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search classes..."
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

          {/* Main Content */}
          {renderContent()}
        </div>
      </main>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Join a Class
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Request to join a class using class code or teacher username
                  </p>
                </div>
              </div>
            </div>

            {/* Method Selection */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setJoinMethod('code')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${joinMethod === 'code'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                Class Code
              </button>
              <button
                onClick={() => setJoinMethod('teacher')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${joinMethod === 'teacher'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                Teacher Username
              </button>
            </div>

            <form onSubmit={handleJoinClass} className="space-y-5">
              {joinMethod === 'code' ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">
                    Class Code *
                  </label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition font-mono text-center"
                    placeholder="e.g., ABC-123"
                    disabled={joinLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get the class code from your teacher
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">
                    Teacher Username *
                  </label>
                  <input
                    type="text"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    placeholder="Enter teacher's username"
                    disabled={joinLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You'll see all classes taught by this teacher
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-400 mt-0.5" />
                <p className="text-xs text-emerald-400">
                  Your request will be sent to the teacher for approval. You'll be notified when approved.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  disabled={joinLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {joinLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Sending Request...
                    </>
                  ) : (
                    'Send Request'
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