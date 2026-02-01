// pages/ClassWorksheets.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { worksheetAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import {
  FileText, Calendar, Clock, Award, Eye, Download, 
  CheckCircle, XCircle, TrendingUp, BarChart3, Filter,
  Search, Plus, ChevronRight, ArrowLeft, Users, BookOpen,
  AlertCircle, Clock4, Target, Star, Edit, Trash2, Share2
} from 'lucide-react';

export default function ClassWorksheets() {
  const { classId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, assigned, completed, pending, graded

  useEffect(() => {
    loadWorksheets();
  }, [classId]);

  const loadWorksheets = async () => {
    try {
      const response = await worksheetAPI.getAll(classId);
      setWorksheets(response.data);
    } catch (error) {
      console.error('Error loading worksheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      published: 'bg-green-500/10 text-green-400 border-green-500/20',
      draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    
    const icons = {
      published: <CheckCircle className="w-3 h-3" />,
      draft: <AlertCircle className="w-3 h-3" />,
      archived: <XCircle className="w-3 h-3" />
    };
    
    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${colors[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStudentStatus = (worksheet) => {
    // Mock student status - replace with actual data
    const statuses = ['not_started', 'in_progress', 'submitted', 'graded'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const colors = {
      not_started: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      submitted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      graded: 'bg-green-500/10 text-green-400 border-green-500/20'
    };
    
    const texts = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      submitted: 'Submitted',
      graded: 'Graded'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${colors[status]}`}>
        {texts[status]}
      </span>
    );
  };

  const filteredWorksheets = worksheets.filter(worksheet => {
    if (filter === 'assigned' && worksheet.status !== 'published') return false;
    if (filter === 'completed' && worksheet.status !== 'published') return false;
    if (filter === 'pending' && worksheet.status !== 'published') return false;
    if (filter === 'graded' && worksheet.status !== 'published') return false;
    
    return worksheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           worksheet.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <Sidebar />
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading worksheets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>
      
      <div className="lg:hidden">
        <Sidebar />
      </div>
      
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  to={`/${user.role === 'teacher' ? 'teacher' : 'student'}/classes/${classId}`}
                  className="p-2 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    Class Worksheets
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {user.role === 'teacher' ? 'Manage assignments and track student progress' : 'Complete assignments and track your progress'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {worksheets.filter(w => w.status === 'published').length}
                    </span> Published
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {worksheets.filter(w => w.status === 'draft').length}
                    </span> Drafts
                  </span>
                </div>
              </div>
            </div>
            
            {user.role === 'teacher' && (
              <Link
                to={`/teacher/classes/${classId}/worksheets/create`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition"
              >
                <Plus className="w-4 h-4" />
                New Worksheet
              </Link>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <FileText className="w-5 h-5 text-blue-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-white">{worksheets.length}</p>
                <p className="text-xs text-gray-400">Total Worksheets</p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center justify-between">
                <Award className="w-5 h-5 text-green-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-white">85.5%</p>
                <p className="text-xs text-gray-400">Avg. Score</p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-purple-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-white">94%</p>
                <p className="text-xs text-gray-400">Participation</p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
              <div className="flex items-center justify-between">
                <Clock4 className="w-5 h-5 text-orange-400" />
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-white">3</p>
                <p className="text-xs text-gray-400">Due Soon</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search worksheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('assigned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'assigned'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                Assigned
              </button>
              {user.role === 'student' && (
                <>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'pending'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-white shadow-lg shadow-yellow-500/30'
                      : 'bg-white/[0.04] text-gray-400 hover:text-white'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('graded')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'graded'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/[0.04] text-gray-400 hover:text-white'
                    }`}
                  >
                    Graded
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Worksheets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorksheets.map((worksheet) => (
              <div
                key={worksheet.id}
                className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm truncate max-w-[180px]">
                        {worksheet.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {user.role === 'teacher' ? getStatusBadge(worksheet.status) : getStudentStatus(worksheet)}
                        <span className="text-xs text-gray-400">
                          {worksheet.max_score || 100} pts
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {user.role === 'teacher' && (
                      <>
                        <Link
                          to={`/teacher/worksheets/${worksheet.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {worksheet.description && (
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                    {worksheet.description}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Due Date</span>
                    </div>
                    <span className="text-white font-medium">
                      {new Date(worksheet.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Time Limit</span>
                    </div>
                    <span className="text-white font-medium">60 min</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>Submissions</span>
                    </div>
                    <span className="text-white font-medium">24/30</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {user.role === 'teacher' ? (
                    <>
                      <Link
                        to={`/teacher/worksheets/${worksheet.id}/results`}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 hover:border-green-500/50 transition-all text-xs font-medium"
                      >
                        <BarChart3 className="w-3 h-3" />
                        Results
                      </Link>
                      
                      <Link
                        to={`/teacher/worksheets/${worksheet.id}/edit`}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all text-xs font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/student/worksheets/${worksheet.id}`}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all text-xs font-medium"
                      >
                        {worksheet.status === 'graded' ? (
                          <>
                            <Eye className="w-3 h-3" />
                            View Score
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3 h-3" />
                            Start
                          </>
                        )}
                      </Link>
                      
                      <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all text-xs font-medium">
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {filteredWorksheets.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 mb-4">
                  {searchQuery || filter !== 'all' 
                    ? 'No worksheets match your search'
                    : 'No worksheets available yet'
                  }
                </p>
                {user.role === 'teacher' && (
                  <Link
                    to={`/teacher/classes/${classId}/worksheets/create`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Worksheet
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}