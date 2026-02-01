// pages/TeacherWorksheetEditor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { worksheetAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  Save, ArrowLeft, FileText, Calendar, Clock, Award,
  AlertCircle, CheckCircle, X, Loader2, Eye, Upload
} from 'lucide-react';

export default function TeacherWorksheetEditor() {
  const { worksheetId } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    worksheet_type: 'QUESTION_BASED',
    max_score: 100,
    time_limit: 60,
    due_date: '',
    is_published: false
  });

  useEffect(() => {
    loadWorksheet();
  }, [worksheetId]);

  const loadWorksheet = async () => {
    try {
      const response = await worksheetAPI.getDetails(worksheetId);
      const data = response.data;
      setWorksheet(data);
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        worksheet_type: data.worksheet_type || 'QUESTION_BASED',
        max_score: data.max_score || 100,
        time_limit: data.time_limit || 60,
        due_date: data.due_date ? data.due_date.split('T')[0] : '',
        is_published: data.is_published || false
      });
    } catch (error) {
      console.error('Error loading worksheet:', error);
      alert('Failed to load worksheet');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        max_score: parseInt(formData.max_score),
        time_limit: parseInt(formData.time_limit)
      };
      
      // This would be an API call to update worksheet
      // For now, simulate success
      console.log('Updating worksheet:', submitData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Worksheet updated successfully!');
      navigate(`/teacher/worksheets/${worksheetId}`);
    } catch (error) {
      alert('Error updating worksheet: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <Sidebar />
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading worksheet...</p>
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
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/teacher/worksheets/${worksheetId}`)}
                className="p-2 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-white">Edit Worksheet</h1>
                <p className="text-gray-400 text-sm">Update worksheet details and settings</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/teacher/worksheets/${worksheetId}`)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Worksheet Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Worksheet Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    placeholder="Enter worksheet title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition resize-none"
                    placeholder="Describe what this worksheet covers..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Worksheet Type
                    </label>
                    <select
                      name="worksheet_type"
                      value={formData.worksheet_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    >
                      <option value="QUESTION_BASED">Question Based</option>
                      <option value="PDF">PDF Worksheet</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Max Score
                    </label>
                    <input
                      type="number"
                      name="max_score"
                      value={formData.max_score}
                      onChange={handleChange}
                      min="1"
                      max="1000"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      name="time_limit"
                      value={formData.time_limit}
                      onChange={handleChange}
                      min="1"
                      max="300"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500/30"
                  />
                  <label htmlFor="is_published" className="text-sm text-gray-400">
                    Publish worksheet immediately (make it available to students)
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}