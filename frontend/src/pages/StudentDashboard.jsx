// pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { classAPI, worksheetAPI, documentAPI, chatAPI } from '../services/api';
import {
  Book, FileText, Award, TrendingUp, Clock, Calendar,
  CheckCircle, AlertCircle, ChevronRight, BarChart3,
  Target, Users, Star, Brain, Zap, Flag, Eye,
  Loader2, BookOpen, MessageSquare, Folder, AlertTriangle,
  Activity, User, Search, Plus, Brain as BrainIcon, 
  Target as TargetIcon, BarChart as BarChartIcon,
  Users as UsersIcon, FileText as FileTextIcon, MessageSquare as MessageSquareIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    classes: [],
    assignments: [],
    recentActivity: [],
    progress: {},
    documents: [],
    chats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Fetch all data in parallel
      const [classesRes, documentsRes, chatsRes] = await Promise.all([
        classAPI.getAll(),
        documentAPI.getAll(),
        chatAPI.getAll()
      ]);

      // Calculate dashboard statistics
      const totalClasses = classesRes.data?.length || 0;
      const totalDocuments = documentsRes.data?.data?.length || 0;
      const totalChats = chatsRes.data?.length || 0;
      
      // Get all worksheets from all classes
      let allWorksheets = [];
      if (classesRes.data && classesRes.data.length > 0) {
        // Fetch worksheets for each class
        const worksheetsPromises = classesRes.data.map(async (classItem) => {
          try {
            const worksheetsRes = await classAPI.getWorksheets(classItem.id);
            return worksheetsRes.data || [];
          } catch (error) {
            console.error(`Error fetching worksheets for class ${classItem.id}:`, error);
            return [];
          }
        });
        
        const worksheetsResults = await Promise.all(worksheetsPromises);
        allWorksheets = worksheetsResults.flat();
      }
      
      // Calculate pending assignments
      const pendingAssignments = allWorksheets.filter(w => {
        if (!w.due_date) return false;
        const dueDate = new Date(w.due_date);
        const today = new Date();
        return w.is_published && !w.has_submission && dueDate > today;
      });

      // Calculate average progress (mock - in real app, get from backend)
      const totalPoints = allWorksheets.reduce((sum, w) => sum + (w.grade || 0), 0);
      const avgScore = allWorksheets.length > 0 ? (totalPoints / allWorksheets.length).toFixed(1) : 0;

      // Mock progress data by subject
      const progressData = {
        Mathematics: { value: 92, color: 'from-green-500 to-emerald-400' },
        Science: { value: 85, color: 'from-blue-500 to-cyan-400' },
        History: { value: 78, color: 'from-yellow-500 to-amber-400' },
        Languages: { value: 65, color: 'from-purple-500 to-pink-400' }
      };

      setDashboardData({
        stats: {
          totalClasses,
          totalDocuments,
          totalChats,
        },
        classes: classesRes.data || [],
        documents: documentsRes.data?.data || [],
        chats: chatsRes.data || [],
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStatus = (dueDate, hasSubmission) => {
    if (hasSubmission) {
      return {
        text: 'Submitted',
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
        icon: <CheckCircle className="w-3 h-3" />
      };
    }
    
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return {
        text: 'Overdue',
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: <AlertCircle className="w-3 h-3" />
      };
    } else if (daysUntilDue <= 2) {
      return {
        text: 'Due Soon',
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        icon: <AlertTriangle className="w-3 h-3" />
      };
    } else {
      return {
        text: 'Pending',
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        icon: <Clock className="w-3 h-3" />
      };
    }
  };

  const getGradient = (color) => {
    const gradients = {
      blue: 'from-blue-500 to-cyan-400',
      purple: 'from-purple-500 to-pink-400',
      emerald: 'from-emerald-500 to-green-400',
      orange: 'from-orange-500 to-amber-400',
      pink: 'from-pink-500 to-rose-400',
      cyan: 'from-cyan-500 to-blue-400',
      green: 'from-green-500 to-emerald-400',
      yellow: 'from-yellow-500 to-amber-400',
      red: 'from-red-500 to-rose-400'
    };
    return gradients[color] || gradients.blue;
  };

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
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your dashboard data...</p>
            </div>
          </div>
        </main>
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
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        {/* Background gradient effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(600px at 20% 20%, rgba(59, 130, 246, 0.05), transparent 40%),
                        radial-gradient(600px at 80% 80%, rgba(139, 92, 246, 0.05), transparent 40%)`
          }} />
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-8">
          
          {/* ================= HEADER SECTION ================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-blue-500/10">
                  <BrainIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    Student Dashboard
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Welcome back, <span className="text-white">{user?.username}</span>! Ready to learn?
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{dashboardData.stats?.completedAssignments || 0}</span> Assignments Done
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{dashboardData.stats?.totalClasses || 0}</span> Active Classes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{dashboardData.stats?.totalChats || 0}</span> Chat Sessions
                  </span>
                </div>
              </div>
            </div>
            
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
            >
              <User className="w-4 h-4" />
              Go to Profile
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <br></br>

          {/* ================= STATS GRID ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Active Classes Card */}
            <div className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Book className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  +0
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-2xl font-bold text-white">{dashboardData.stats?.totalClasses || 0}</div>
                <div className="text-xs text-gray-400">Active Classes</div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-6">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    style={{ width: `${Math.min(100, (dashboardData.stats?.totalClasses || 0) * 10)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Documents Card */}
            <div className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  +0
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-2xl font-bold text-white">{dashboardData.stats?.totalDocuments || 0}</div>
                <div className="text-xs text-gray-400">Total Documents</div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-6">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${Math.min(100, (dashboardData.stats?.totalDocuments || 0) * 3)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Chats Card */}
            <div className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <MessageSquareIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Clock className="w-3 h-3" />
                  {dashboardData.stats?.totalChats || 0}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-2xl font-bold text-white">{dashboardData.stats?.totalChats || 0}</div>
                <div className="text-xs text-gray-400">Chat Sessions</div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-6">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                    style={{ width: `${Math.min(100, (dashboardData.stats?.totalChats || 0) * 2)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================= QUICK ACTIONS ================= */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-blue-400" />
                Quick Actions
              </h2>
              <div className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                3 actions
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'My Classes',
                  description: 'View enrolled courses',
                  icon: Book,
                  color: 'purple',
                  action: () => window.location.href = '/student/classes',
                  badge: dashboardData.classes.length > 0 ? `${dashboardData.classes.length} classes` : null
                },
                {
                  title: 'Documents',
                  description: 'View study materials',
                  icon: FileTextIcon,
                  color: 'blue',
                  action: () => window.location.href = '/documents',
                  badge: dashboardData.stats?.totalDocuments || 0 > 0 ? `${dashboardData.stats?.totalDocuments} docs` : null
                },
                {
                  title: 'AI Chat',
                  description: 'Get homework help',
                  icon: BrainIcon,
                  color: 'emerald',
                  action: () => window.location.href = '/chat',
                  badge: dashboardData.stats?.totalChats || 0 > 0 ? `${dashboardData.stats?.totalChats} chats` : null
                }
              ].map((action, index) => {
                const Icon = action.icon;
                const gradient = getGradient(action.color);
                
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="group relative bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-white mb-1 text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-400">{action.description}</p>
                      
                      {action.badge && (
                        <div className="mt-2 text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-300">
                          {action.badge}
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================= FOOTER STATS ================= */}
          <div className="mt-8">
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{dashboardData.classes.length}</div>
                  <div className="text-sm text-gray-400">Total Classes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{dashboardData.stats?.totalDocuments || 0}</div>
                  <div className="text-sm text-gray-400">Total Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{dashboardData.stats?.totalChats || 0}</div>
                  <div className="text-sm text-gray-400">Chat Sessions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}