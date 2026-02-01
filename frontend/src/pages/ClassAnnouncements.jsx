// pages/ClassAnnouncements.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Bell, Plus, Edit, Trash2, Eye, Calendar, Clock,
  User, Pin, AlertCircle, CheckCircle, XCircle,
  ArrowLeft, Search, Filter, MoreVertical, Send,
  BookOpen, MessageSquare, Share2, Download
} from 'lucide-react';

export default function ClassAnnouncements() {
  const { classId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [announcements, setAnnouncements] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, pinned, unread
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    send_notification: true
  });

  useEffect(() => {
    // Mock data - replace with API call
    setAnnouncements([
      { 
        id: 1, 
        title: 'Midterm Exam Schedule', 
        content: 'The midterm exam will be held on February 15th from 9:00 AM to 11:00 AM in the main auditorium. Please bring your student ID and a calculator.', 
        author: 'Dr. Smith', 
        date: '2024-01-20T10:30:00',
        priority: 'high',
        pinned: true,
        read: true,
        attachments: 2
      },
      { 
        id: 2, 
        title: 'Important: Assignment Deadline Extended', 
        content: 'Due to technical issues with the submission system, the deadline for Assignment 3 has been extended to Friday, January 26th at 11:59 PM.', 
        author: 'Prof. Johnson', 
        date: '2024-01-18T14:15:00',
        priority: 'normal',
        pinned: false,
        read: false,
        attachments: 0
      },
      { 
        id: 3, 
        title: 'Office Hours Change', 
        content: 'Office hours for this week have been changed to Wednesday 2:00-4:00 PM and Thursday 10:00-12:00 PM due to faculty meetings.', 
        author: 'Dr. Williams', 
        date: '2024-01-15T09:45:00',
        priority: 'low',
        pinned: false,
        read: true,
        attachments: 1
      },
      { 
        id: 4, 
        title: 'Guest Lecture Announcement', 
        content: 'We are pleased to announce a guest lecture by Dr. Sarah Chen from MIT on "Advances in Artificial Intelligence" next Monday at 3:00 PM. Attendance is recommended for all students.', 
        author: 'Prof. Davis', 
        date: '2024-01-12T16:20:00',
        priority: 'normal',
        pinned: true,
        read: true,
        attachments: 3
      },
      { 
        id: 5, 
        title: 'Lab Equipment Safety Reminder', 
        content: 'Please remember to follow all safety protocols when using lab equipment. Safety glasses must be worn at all times in the laboratory.', 
        author: 'Dr. Brown', 
        date: '2024-01-10T11:00:00',
        priority: 'normal',
        pinned: false,
        read: true,
        attachments: 0
      },
    ]);
  }, [classId]);

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-500/10 text-red-400 border-red-500/20',
      normal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      low: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    
    const icons = {
      high: <AlertCircle className="w-3 h-3" />,
      normal: <Bell className="w-3 h-3" />,
      low: <CheckCircle className="w-3 h-3" />
    };
    
    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${colors[priority]}`}>
        {icons[priority]}
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    const newAnn = {
      id: announcements.length + 1,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      author: user.username,
      date: new Date().toISOString(),
      priority: newAnnouncement.priority,
      pinned: false,
      read: false,
      attachments: 0
    };
    
    setAnnouncements([newAnn, ...announcements]);
    setNewAnnouncement({ title: '', content: '', priority: 'normal', send_notification: true });
    setShowCreateModal(false);
    alert('Announcement created successfully!');
  };

  const handleDeleteAnnouncement = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  const handleMarkAsRead = (id) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, read: true } : a
    ));
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (filter === 'pinned' && !announcement.pinned) return false;
    if (filter === 'unread' && announcement.read) return false;
    
    return announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
                    Class Announcements
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Stay updated with important class information
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {announcements.filter(a => !a.read).length}
                    </span> Unread
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">
                      {announcements.filter(a => a.pinned).length}
                    </span> Pinned
                  </span>
                </div>
              </div>
            </div>
            
            {user.role === 'teacher' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition"
              >
                <Plus className="w-4 h-4" />
                New Announcement
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search announcements..."
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
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'unread'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-white shadow-lg shadow-yellow-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter('pinned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'pinned'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                Pinned
              </button>
            </div>
          </div>

          {/* Announcements List */}
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border rounded-2xl p-6 transition ${announcement.pinned
                  ? 'border-yellow-500/30'
                  : 'border-white/10 hover:border-blue-500/30'
                } ${!announcement.read ? 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {announcement.pinned && (
                          <Pin className="w-4 h-4 text-yellow-400" />
                        )}
                        {!announcement.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        )}
                        <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                      </div>
                      {getPriorityBadge(announcement.priority)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{announcement.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(announcement.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(announcement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {user.role === 'teacher' && (
                      <>
                        <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {!announcement.read && user.role === 'student' && (
                      <button
                        onClick={() => handleMarkAsRead(announcement.id)}
                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6 whitespace-pre-line">{announcement.content}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    {announcement.attachments > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Paperclip className="w-4 h-4" />
                        <span>{announcement.attachments} attachment{announcement.attachments !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <button className="text-sm text-blue-400 hover:text-blue-300 transition">
                      View Comments (3)
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition">
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredAnnouncements.length === 0 && (
              <div className="text-center py-12 bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl">
                <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 mb-2">No announcements found</p>
                <p className="text-sm text-gray-500">Try changing your search or filter</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
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
                    Create Announcement
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Share important information with your students
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Title *
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                  placeholder="e.g., Exam Schedule Update"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Priority
                  </label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Send Notification
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAnnouncement.send_notification}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, send_notification: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className="text-sm text-gray-300">
                      {newAnnouncement.send_notification ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Content *
                </label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  required
                  rows="8"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition resize-none"
                  placeholder="Write your announcement here..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition"
                >
                  <Send className="w-4 h-4 inline mr-2" />
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}