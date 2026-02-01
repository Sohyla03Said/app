// pages/StudentClassDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';  // Add useMemo
import { useParams, Link } from 'react-router-dom';
import { classAPI, worksheetAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  Book, Users, FileText, MessageSquare, Calendar, Clock,
  Award, ChevronRight, Eye, Download, Bell, Folder,
  BarChart3, Target, Star, BookOpen, Video, Music,
  Search, Plus, X, AlertCircle, Loader2, ArrowLeft  
} from 'lucide-react';

export default function StudentClassDetail() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [worksheets, setWorksheets] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  // Filter worksheets based on search query
  const filteredWorksheets = useMemo(() => {
    if (!searchQuery.trim() || activeTab !== 'worksheets') return worksheets;
    
    const query = searchQuery.toLowerCase();
    return worksheets.filter(worksheet => 
      worksheet.title?.toLowerCase().includes(query) ||
      worksheet.description?.toLowerCase().includes(query) ||
      worksheet.status?.toLowerCase().includes(query)
    );
  }, [worksheets, searchQuery, activeTab]);



  const loadClassData = async () => {
    try {
      setError(null);
      const [classRes, worksheetsRes] = await Promise.all([
        classAPI.getDetails(classId),
        classAPI.getWorksheets(classId)
      ]);
      setClassData(classRes.data);
      setWorksheets(worksheetsRes.data || []);
      
      
      setAnnouncements([
        { id: 1, title: 'Midterm Exam Schedule', content: 'The midterm exam will be held on February 15th...', date: '2024-01-20' },
        { id: 2, title: 'Important: Assignment Deadline Extended', content: 'The deadline for Assignment 3 has been extended...', date: '2024-01-18' },
        { id: 3, title: 'Office Hours Change', content: 'Office hours for this week have been changed to...', date: '2024-01-15' },
      ]);
    } catch (error) {
      console.error('Error loading class data:', error);
      setError('Failed to load class data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'doc': case 'docx': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'video': return <Video className="w-5 h-5 text-purple-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  // Clear search when changing tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
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
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading class details...</p>
          </div>
        </div>
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
                        radial-gradient(600px at 80% 80%, rgba(96, 165, 250, 0.05), transparent 40%)`
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
                  <div className="mb-1">
                    <Link
                      to="/student/classes"
                      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-orange-300 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to classes
                    </Link>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    {classData?.name || 'Class Details'}
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {classData?.description || 'Access worksheets, and announcements'}
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {worksheets.filter(w => w.status === 'published').length}
                    </span> Active Worksheets
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {worksheets.filter(w => w.status === 'draft').length}
                    </span> Draft
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {classData?.student_count || 0}
                    </span> Students
                  </span>
                </div>
              </div>
              <br></br>
            </div>
            
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={loadClassData}
                className="ml-auto text-xs text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search Bar - Only show for certain tabs */}
          {(activeTab === 'worksheets') && (
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                {activeTab === 'worksheets' ? `${filteredWorksheets.length} worksheets` : ''}
              </div>
            </div>
          )}

          <br />
          {/* Tabs - Updated to match StudentClasses style */}
          <div className="mt-2 mb-2">
            <div className="flex space-x-1">
              {['overview', 'worksheets'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`
                    flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
                    relative rounded-t-2xl capitalize
                    ${activeTab === tab
                      ? 'text-white bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 border-b-0 shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-800/50 hover:to-gray-900/50 hover:backdrop-blur-sm border border-transparent hover:border-white/5'
                    }
                  `}
                >
                  {tab === 'chat' ? 'AI Chat' : tab.replace('_', ' ')}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Upcoming Worksheets */}
                  <div className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Upcoming Worksheets</h3>
                      <Link
                        to={`/classes/${classId}/worksheets`}
                        className="text-sm text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                      >
                        View All <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                    
                    <div className="space-y-3">
                      {worksheets.slice(0, 3).map((worksheet) => (
                        <div key={worksheet.id}>
                          <Link
                            to={`/student/worksheets/${worksheet.id}`}
                            className="block p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/30 transition group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-orange-400" />
                                <div>
                                  <h4 className="font-medium text-white text-sm">{worksheet.title}</h4>
                                  <p className="text-xs text-gray-400">{worksheet.description?.substring(0, 60)}...</p>
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${worksheet.status === 'published'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {worksheet.status || 'draft'}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-300 text-xs">
                                    Due: {new Date(worksheet.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <span className="flex items-center gap-1 text-orange-400 text-sm font-medium">
                                Start <ChevronRight className="w-4 h-4" />
                              </span>
                            </div>
                          </Link>
                          <br />
                        </div>
                      ))}
                      
                      {worksheets.length === 0 && (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-400">No worksheets assigned yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Class Info */}
                  <div className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 h-106">
                    <h3 className="text-lg font-semibold text-white mb-4">Class Information</h3>
                    <br />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Subject</span>
                        <span className="text-white font-medium text-sm">{classData?.subject || 'General'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Grade Level</span>
                        <span className="text-white font-medium text-sm">{classData?.grade_level || 'All Levels'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Students</span>
                        <span className="text-white font-medium text-sm">{classData?.student_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Teacher</span>
                        <span className="text-white font-medium text-sm">{classData?.teacher?.username || 'Unknown'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <p className="text-xs text-gray-400 mb-2">Description</p>
                      <p className="text-white text-sm">{classData?.description || 'No description provided.'}</p>
                    </div>
                    
                    <div className="mt-6">
                      <p className="text-xs text-gray-400 mb-2">Class Code</p>
                      <code className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-orange-300 font-mono text-sm border border-white/10">
                        {classData?.class_code || 'N/A'}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'worksheets' && (
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">All Worksheets</h3>
                  <div className="flex items-center gap-2">
                    {searchQuery && (
                      <span className="text-sm text-gray-400">
                        Searching: "{searchQuery}"
                      </span>
                    )}
                    <span className="text-sm text-gray-400">
                      {filteredWorksheets.length} of {worksheets.length} worksheets
                    </span>
                  </div>
                </div>
                
                {filteredWorksheets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorksheets.map((worksheet) => (
                      <Link
                        key={worksheet.id}
                        to={`/student/worksheets/${worksheet.id}`}
                        className="block p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/30 transition group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-orange-400" />
                            <span className={`text-xs px-2 py-1 rounded-full ${worksheet.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {worksheet.status || 'draft'}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition" />
                        </div>
                        
                        <h4 className="font-medium text-white text-sm mb-2">{worksheet.title}</h4>
                        <p className="text-xs text-gray-400 mb-4 line-clamp-2">{worksheet.description}</p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {new Date(worksheet.due_date).toLocaleDateString()}</span>
                          </div>
                          <span className="text-white font-medium">{worksheet.max_score} pts</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 mb-4">
                      {searchQuery 
                        ? `No worksheets found for "${searchQuery}"`
                        : 'No worksheets available yet'
                      }
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:border-orange-500/30 transition"
                      >
                        <X className="w-4 h-4" />
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Class Materials</h3>
                  <div className="flex items-center gap-2">
                    {searchQuery && (
                      <span className="text-sm text-gray-400">
                        Searching: "{searchQuery}"
                      </span>
                    )}
                    <span className="text-sm text-gray-400">
                      {filteredMaterials.length} of {materials.length} materials
                    </span>
                  </div>
                </div>
                
                {filteredMaterials.length > 0 ? (
                  <div className="space-y-4">
                    {filteredMaterials.map((material) => (
                      <div key={material.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/30 transition group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center">
                          {getFileIcon(material.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm mb-1">{material.name}</h4>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-400">Type: {material.type.toUpperCase()}</span>
                            <span className="text-gray-400">
                              Uploaded: {new Date(material.uploaded).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 mb-4">
                      {searchQuery 
                        ? `No materials found for "${searchQuery}"`
                        : 'No materials available yet'
                      }
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:border-orange-500/30 transition"
                      >
                        <X className="w-4 h-4" />
                        Clear search
                      </button>
                    )}
                    <p className="text-sm text-gray-500 mt-2">Your teacher will upload materials soon</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}