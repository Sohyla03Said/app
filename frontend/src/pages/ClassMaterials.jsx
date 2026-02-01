// pages/ClassMaterials.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Link } from 'react-router-dom';
import {
  Folder, FileText, Image, Video, Music, Archive, Download,
  Eye, Share2, Trash2, MoreVertical, Plus, Search, Filter,
  Calendar, User, ArrowLeft, Upload, FolderPlus, FilePlus,
  ExternalLink, Clock, Star, BookOpen, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ClassMaterials() {
  const { classId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, pdf, video, image, doc
  const [currentFolder, setCurrentFolder] = useState(null);

  useEffect(() => {
    // Mock data - replace with API call
    setFolders([
      { id: 1, name: 'Lecture Slides', itemCount: 12, color: 'blue', description: 'Weekly lecture presentations' },
      { id: 2, name: 'Assignments', itemCount: 8, color: 'green', description: 'Homework and projects' },
      { id: 3, name: 'Readings', itemCount: 15, color: 'purple', description: 'Required reading materials' },
      { id: 4, name: 'Videos', itemCount: 5, color: 'red', description: 'Lecture recordings and tutorials' },
      { id: 5, name: 'Practice Problems', itemCount: 20, color: 'yellow', description: 'Additional practice exercises' },
      { id: 6, name: 'Exams', itemCount: 3, color: 'orange', description: 'Previous exams and solutions' },
    ]);
    
    setMaterials([
      { id: 1, name: 'Introduction to Calculus.pdf', type: 'pdf', size: '2.4 MB', uploaded: '2024-01-15', folder: 'Lecture Slides', downloads: 145, starred: true },
      { id: 2, name: 'Week 1 Assignment.docx', type: 'doc', size: '1.2 MB', uploaded: '2024-01-16', folder: 'Assignments', downloads: 89, starred: false },
      { id: 3, name: 'History Chapter 1.mp4', type: 'video', size: '45.2 MB', uploaded: '2024-01-14', folder: 'Videos', downloads: 67, starred: true },
      { id: 4, name: 'Science Lab Instructions.pdf', type: 'pdf', size: '3.1 MB', uploaded: '2024-01-13', folder: 'Assignments', downloads: 102, starred: false },
      { id: 5, name: 'Reading List.txt', type: 'text', size: '24 KB', uploaded: '2024-01-12', folder: 'Readings', downloads: 56, starred: true },
      { id: 6, name: 'Midterm Review Session.mp3', type: 'audio', size: '12.5 MB', uploaded: '2024-01-11', folder: 'Videos', downloads: 78, starred: false },
      { id: 7, name: 'Practice Problems Set 1.pdf', type: 'pdf', size: '1.8 MB', uploaded: '2024-01-10', folder: 'Practice Problems', downloads: 134, starred: true },
      { id: 8, name: 'Sample Exam Solutions.zip', type: 'archive', size: '5.6 MB', uploaded: '2024-01-09', folder: 'Exams', downloads: 92, starred: false },
    ]);
  }, [classId]);

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'doc': case 'docx': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'video': case 'mp4': return <Video className="w-5 h-5 text-purple-400" />;
      case 'image': case 'jpg': case 'png': return <Image className="w-5 h-5 text-green-400" />;
      case 'audio': case 'mp3': return <Music className="w-5 h-5 text-yellow-400" />;
      case 'archive': case 'zip': return <Archive className="w-5 h-5 text-orange-400" />;
      case 'text': case 'txt': return <FileText className="w-5 h-5 text-gray-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'pdf': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'doc': case 'docx': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'video': case 'mp4': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'image': case 'jpg': case 'png': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'audio': case 'mp3': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'archive': case 'zip': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getFolderColor = (color) => {
    const colors = {
      blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20',
      green: 'from-green-500/20 to-emerald-500/20 border-green-500/20',
      purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/20',
      red: 'from-red-500/20 to-pink-500/20 border-red-500/20',
      yellow: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/20',
      orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/20',
    };
    return colors[color] || 'from-gray-500/20 to-gray-400/20 border-gray-500/20';
  };

  const filteredMaterials = materials.filter(material => {
    if (currentFolder && material.folder !== currentFolder.name) return false;
    if (filter !== 'all' && material.type !== filter) return false;
    
    return material.name.toLowerCase().includes(searchQuery.toLowerCase());
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
                    Class Materials
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Access and download learning resources
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{materials.length}</span> Files
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{folders.length}</span> Folders
                  </span>
                </div>
              </div>
            </div>
            
            {user.role === 'teacher' && (
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition">
                <Upload className="w-4 h-4" />
                Upload New
              </button>
            )}
          </div>

          {/* Folder Breadcrumb */}
          {currentFolder && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10">
              <button
                onClick={() => setCurrentFolder(null)}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4" />
                All Materials
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getFolderColor(currentFolder.color)} flex items-center justify-center`}>
                  <Folder className="w-3 h-3 text-white" />
                </div>
                <span className="text-white font-medium">{currentFolder.name}</span>
              </div>
            </div>
          )}

          {/* Folders Grid */}
          {!currentFolder && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Folders</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setCurrentFolder(folder)}
                    className="group p-4 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 transition text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getFolderColor(folder.color)} flex items-center justify-center`}>
                        <Folder className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">{folder.name}</h4>
                        <p className="text-xs text-gray-400">{folder.itemCount} items</p>
                      </div>
                    </div>
                    
                    {folder.description && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{folder.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                      <span className="text-xs text-gray-400">Click to open</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                All Files
              </button>
              <button
                onClick={() => setFilter('pdf')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${filter === 'pdf'
                  ? 'bg-gradient-to-r from-red-500 to-pink-400 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${filter === 'video'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                Video
              </button>
              <button
                onClick={() => setFilter('doc')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${filter === 'doc'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Document
              </button>
            </div>
          </div>

          {/* Materials List */}
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {currentFolder ? `${currentFolder.name} Files` : 'All Materials'}
                  <span className="text-sm text-gray-400 ml-2">({filteredMaterials.length})</span>
                </h3>
                
                <div className="flex items-center gap-4">
                  <button className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white transition">
                    <Filter className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white transition">
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {filteredMaterials.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 mb-2">No materials found</p>
                  <p className="text-sm text-gray-500">Try changing your search or filter</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Size</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Uploaded</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Downloads</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredMaterials.map((file) => (
                        <tr key={file.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {getFileIcon(file.type)}
                                {file.starred && (
                                  <div className="absolute -top-1 -right-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-white text-sm truncate max-w-xs">{file.name}</p>
                                {!currentFolder && (
                                  <p className="text-xs text-gray-400 mt-1">{file.folder}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-4 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${getFileTypeColor(file.type)}`}>
                              {file.type.toUpperCase()}
                            </span>
                          </td>
                          
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-300">{file.size}</span>
                          </td>
                          
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-300">
                                {new Date(file.uploaded).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Download className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-300">{file.downloads}</span>
                            </div>
                          </td>
                          
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  // Implement download
                                  alert(`Downloading ${file.name}`);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  // Implement preview
                                  alert(`Previewing ${file.name}`);
                                }}
                                className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  // Implement share
                                  alert(`Sharing ${file.name}`);
                                }}
                                className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  // Toggle star
                                  const updated = materials.map(m => 
                                    m.id === file.id ? {...m, starred: !m.starred} : m
                                  );
                                  setMaterials(updated);
                                }}
                                className={`p-1.5 rounded-lg transition ${file.starred
                                  ? 'text-yellow-400 bg-yellow-500/10'
                                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                                }`}
                                title={file.starred ? 'Unstar' : 'Star'}
                              >
                                <Star className={`w-4 h-4 ${file.starred ? 'fill-yellow-400' : ''}`} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}