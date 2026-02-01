import { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import { Upload, FileText, Loader2, Sparkles, Brain, ChevronRight, X, Eye, Trash2, FileIcon, Plus, Shield, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../documents.css';
import { Link } from 'react-router-dom';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentAPI.getAll();
      if (response.data.success) {
        setDocuments(response.data.data);
      } else {
        console.error('Failed to load documents:', response.data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) {
      alert("Please provide a title and select a file.");
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);

    try {
      const response = await documentAPI.upload(formData);
      if (response.data.success) {
        alert("Document uploaded successfully!");
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadTitle("");
        setLoading(true);
        loadDocuments();
      } else {
        alert(response.data.message || "Upload failed.");
      }
    } catch (error) {
      alert(error.response?.data?.detail || error.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRequest = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);
    try {
      await documentAPI.delete(selectedDoc._id);
      alert(`'${selectedDoc.title}' deleted successfully.`);
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
      setDocuments(documents.filter((d) => d._id !== selectedDoc._id));
    } catch (error) {
      alert(error.response?.data?.detail || error.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading documents...</p>
          </div>
        </div>
      );
    }

    if (filteredDocuments.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl text-center max-w-md">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 shadow-2xl shadow-blue-500/10">
              <FileText className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              No Documents Found
            </h3>

            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              {searchQuery 
                ? "No documents match your search. Try a different query."
                : "Get started by uploading your first PDF document to begin learning."
              }
            </p>

            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Upload Document
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocuments.map((doc) => (
          <div key={doc._id} className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${
                  doc.status === 'ready' 
                    ? 'from-green-500/10 to-emerald-500/10 border border-purple-500/20' 
                    : doc.status === 'processing'
                    ? 'from-purple-500/10 to-purple-500/10 border border-purple-500/20'
                    : 'from-purple-500/10 to-purple-500/10 border border-purple-500/20'
                }`}>
                  <FileIcon className={`w-5 h-5 ${
                    doc.status === 'ready' 
                      ? 'text-purple-400' 
                      : doc.status === 'processing'
                      ? 'text-purple-400'
                      : 'text-purple-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm truncate max-w-[180px]">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {doc.fileType.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteRequest(doc)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Size:</span>
                <span className="text-white font-medium">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  doc.status === 'ready' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : doc.status === 'processing'
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </span>
              </div>
              
              {doc.summary && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-xs text-gray-400 line-clamp-2">{doc.summary}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <Link
                to={`/documents/${doc._id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/10 border border-blue-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Open Document
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
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
      
      {/* Mobile Sidebar - Will be handled by Sidebar component itself */}
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-purple-500/10">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    My Documents
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Manage and organize your learning materials
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{documents.filter(d => d.status === 'ready').length}</span> Ready
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{documents.length}</span> Total
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Upload Document
            </button>
          </div>
          <br></br>
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
              />
            </div>
            <div className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              {filteredDocuments.length} documents
            </div>
          </div>
          <br></br>
          {renderContent()}
          
        </div>
      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            {/* Close button */}
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-cyan-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Upload New Document
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Add a document to your library
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleUpload} className="space-y-5">
              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">
                  Document Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                  placeholder="e.g., React Interview Preparation"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">
                  Document File
                </label>
                <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition cursor-pointer group">
                  <input
                    id="file-upload"
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt,.md"
                  />
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 group-hover:border-blue-500/30 transition">
                      {uploadFile ? (
                        <FileIcon className="w-6 h-6 text-blue-400" />
                      ) : (
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        {uploadFile ? (
                          <span className="text-white font-medium">
                            {uploadFile.name}
                          </span>
                        ) : (
                          <>
                            <span className="text-white font-medium">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, MD up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-400 mt-0.5" />
                <p className="text-xs text-emerald-400">
                  Your document is processed locally and securely. No data is sent to external servers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition disabled:opacity-60"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    "Upload Document"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            {/* Close button */}
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400/40 hover:text-white/60 transition p-1.5 hover:bg-white/10 backdrop-blur-sm rounded-lg"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center text-center mb-4 ">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 shadow-lg shadow-red-500/10 mb-3">
                <Trash2 className="w-6 h-6 text-red-400" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Confirm Deletion
              </h2>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-400 text-center mb-6">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">
                "{selectedDoc?.title}"
              </span>
              ? This action cannot be undone.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
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
                  "Delete Document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}