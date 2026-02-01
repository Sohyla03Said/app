// pages/TeacherMaterials.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Link } from 'react-router-dom';
import {
  Upload, Folder, FileText, Image, Video, Music, Archive,
  Download, Eye, Share2, Trash2, MoreVertical, Plus,
  Search, Filter, Calendar, User, ArrowLeft, Link as LinkIcon,
  FolderPlus, FilePlus, ExternalLink
} from 'lucide-react';

export default function TeacherMaterials() {
  const { classId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: '', description: '' });

  useEffect(() => {
    // Mock data - replace with API call
    setFolders([
      { id: 1, name: 'Lecture Slides', itemCount: 12, color: 'blue' },
      { id: 2, name: 'Assignments', itemCount: 8, color: 'green' },
      { id: 3, name: 'Readings', itemCount: 15, color: 'purple' },
      { id: 4, name: 'Videos', itemCount: 5, color: 'red' },
    ]);
    
    setMaterials([
      { id: 1, name: 'Introduction to Calculus.pdf', type: 'pdf', size: '2.4 MB', uploaded: '2024-01-15', folder: 'Lecture Slides' },
      { id: 2, name: 'Week 1 Assignment.docx', type: 'doc', size: '1.2 MB', uploaded: '2024-01-16', folder: 'Assignments' },
      { id: 3, name: 'History Chapter 1.mp4', type: 'video', size: '45.2 MB', uploaded: '2024-01-14', folder: 'Videos' },
      { id: 4, name: 'Science Lab Instructions.pdf', type: 'pdf', size: '3.1 MB', uploaded: '2024-01-13', folder: 'Assignments' },
      { id: 5, name: 'Reading List.txt', type: 'text', size: '24 KB', uploaded: '2024-01-12', folder: 'Readings' },
    ]);
  }, [classId]);

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'doc': case 'docx': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'video': return <Video className="w-5 h-5 text-purple-400" />;
      case 'image': return <Image className="w-5 h-5 text-green-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    // Implement file upload logic
    setTimeout(() => {
      setUploading(false);
      setShowUploadModal(false);
      alert('Files uploaded successfully!');
    }, 1500);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    // Implement folder creation
    setFolders([...folders, {
      id: folders.length + 1,
      name: newFolder.name,
      itemCount: 0,
      color: 'gray'
    }]);
    setNewFolder({ name: '', description: '' });
    setShowFolderModal(false);
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
                    Class Materials
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Upload and organize learning materials for your students
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
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFolderModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-green-500/30 transition"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="text-sm">New Folder</span>
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </div>
          </div>

          {/* Folders Grid */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Folders</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="group p-4 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${folder.color}-500/20 to-${folder.color}-400/20 border border-${folder.color}-500/20 flex items-center justify-center`}>
                      <Folder className={`w-5 h-5 text-${folder.color}-400`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{folder.name}</h4>
                      <p className="text-xs text-gray-400">{folder.itemCount} items</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                    <span className="text-xs text-gray-400">Click to open</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => setShowFolderModal(true)}
                className="p-4 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 hover:border-green-500/30 transition border-dashed flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-sm text-gray-400">New Folder</span>
              </button>
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Recent Files</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 text-sm"
                    />
                  </div>
                  <button className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white transition">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Folder</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Size</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Uploaded</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {materials.map((file) => (
                      <tr key={file.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.type)}
                            <div>
                              <p className="font-medium text-white text-sm">{file.name}</p>
                              <p className="text-xs text-gray-400 uppercase">{file.type}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-300">{file.folder}</span>
                        </td>
                        
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-300">{file.size}</span>
                        </td>
                        
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-300">
                              {new Date(file.uploaded).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Upload Files
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload files to share with your students
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-blue-500/30 transition cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-white font-medium mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-gray-400">Supports PDF, DOC, PPT, images, and videos up to 100MB</p>
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => console.log(e.target.files)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Folder</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition">
                    <option value="">Select Folder</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.name}>{folder.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Visibility</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition">
                    <option value="all">All Students</option>
                    <option value="selected">Selected Students</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            <button
              onClick={() => setShowFolderModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Create New Folder
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Organize your materials into folders
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition"
                  placeholder="e.g., Lecture Slides, Assignments..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Description (Optional)
                </label>
                <textarea
                  value={newFolder.description}
                  onChange={(e) => setNewFolder({...newFolder, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition resize-none"
                  placeholder="Brief description of what this folder contains..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}