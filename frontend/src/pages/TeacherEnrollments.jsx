// pages/TeacherEnrollments.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { classAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  Users, CheckCircle, XCircle, Clock, User, Mail,
  Calendar, Filter, Download, Search, ChevronRight,
  MoreVertical, RefreshCw, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherEnrollments() {
  const { classId } = useParams();
  const [enrollments, setEnrollments] = useState([]);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      const [classRes, enrollmentsRes] = await Promise.all([
        classAPI.getDetails(classId),
        classAPI.getEnrollments(classId, 'pending')
      ]);
      setClassData(classRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    try {
      await classAPI.approveEnrollment(enrollmentId);
      loadData();
      alert('Enrollment approved!');
    } catch (error) {
      alert('Error approving enrollment: ' + error.response?.data?.detail || error.message);
    }
  };

  const handleReject = async (enrollmentId) => {
    try {
      await classAPI.rejectEnrollment(enrollmentId);
      loadData();
      alert('Enrollment rejected!');
    } catch (error) {
      alert('Error rejecting enrollment: ' + error.response?.data?.detail || error.message);
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filter !== 'all' && enrollment.status !== filter) return false;
    
    const studentName = enrollment.student?.full_name || enrollment.student?.username || '';
    const studentEmail = enrollment.student?.email || '';
    
    return (
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      approved: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <Sidebar />
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading enrollments...</p>
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
                  to={`/teacher/classes/${classId}`}
                  className="p-2 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    Enrollment Requests
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {classData?.name} • Manage student enrollments
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {enrollments.filter(e => e.status === 'pending').length}
                    </span> Pending
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {enrollments.filter(e => e.status === 'approved').length}
                    </span> Approved
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search students..."
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
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'pending'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-white shadow-lg shadow-yellow-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'approved'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                Approved
              </button>
            </div>
          </div>

          {/* Enrollments Table */}
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 mb-2">No enrollment requests</p>
                <p className="text-sm text-gray-500">All requests have been processed</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Student</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Email</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Requested</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {enrollment.student?.full_name || enrollment.student?.username}
                              </p>
                              <p className="text-xs text-gray-400">Student</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{enrollment.student?.email}</span>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          {getStatusBadge(enrollment.status)}
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">
                              {new Date(enrollment.requested_at).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          {enrollment.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(enrollment.id)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 hover:border-green-500/50 transition text-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(enrollment.id)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (enrollment.status === 'approved') {
                                  if (confirm('Remove this student from the class?')) {
                                    // Implement removal
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm ${enrollment.status === 'approved'
                                ? 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20'
                                : 'bg-white/[0.04] text-gray-400'
                              }`}
                            >
                              {enrollment.status === 'approved' ? 'Remove' : 'View'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}