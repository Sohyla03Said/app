import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  ArrowLeft, Eye, FileText, Users, Award, Calendar,
  CheckCircle, XCircle, BarChart3, Download, Printer,
  Edit, MessageSquare, User, Clock, TrendingUp,
  Book, ChevronRight, Brain, Sparkles, Lightbulb,
  ExternalLink, Target, Send, X, Plus, Trash2,
  Save, Type, List, Edit2, AlertCircle
} from 'lucide-react';
import { worksheetAPI } from '../services/api';

export default function TeacherWorksheetViewer() {
  const { worksheetId } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'MULTIPLE_CHOICE',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 10,
  });

  useEffect(() => {
    loadWorksheetData();
  }, [worksheetId]);

  const loadWorksheetData = async () => {
    try {
      setLoading(true);
      
      // Load worksheet details
      const worksheetRes = await worksheetAPI.getDetails(worksheetId);
      setWorksheet(worksheetRes.data);
      
      // Load questions
      const questionsRes = await worksheetAPI.getQuestions(worksheetId);
      setQuestions(questionsRes.data || []);
      
      // Load submissions
      try {
        const submissionsRes = await worksheetAPI.getSubmissions(worksheetId);
        setSubmissions(submissionsRes.data || []);
      } catch (error) {
        console.warn('Could not load submissions:', error);
      }
      
    } catch (error) {
      console.error('Error loading worksheet:', error);
      alert('Failed to load worksheet: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!submissions.length) return {};
    
    const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    const totalStudents = submissions.length;
    const submittedCount = submissions.length;
    const gradedCount = gradedSubmissions.length;
    const avgGrade = gradedSubmissions.length > 0 
      ? (gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length).toFixed(1)
      : 0;
    const completionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
    
    return {
      totalStudents,
      submittedCount,
      gradedCount,
      avgGrade,
      completionRate
    };
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion({ ...question, index });
    setCurrentQuestion({
      question_text: question.question_text || '',
      question_type: question.question_type || 'MULTIPLE_CHOICE',
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer || '',
      explanation: question.explanation || '',
      points: question.points || 10,
    });
    setShowEditModal(true);
  };

  const handleDeleteQuestion = async (questionId, index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        // In a real implementation, you would call:
        // await worksheetAPI.deleteQuestion(worksheetId, questionId);
        
        // For now, update locally
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
        
        alert('Question deleted successfully!');
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleUpdateQuestion = async () => {
    if (!currentQuestion.question_text.trim()) {
      alert('Please enter a question text.');
      return;
    }

    if (currentQuestion.question_type === 'MULTIPLE_CHOICE') {
      if (!currentQuestion.options.some(opt => opt.trim() !== '')) {
        alert('Please add at least one option for multiple choice question.');
        return;
      }
      if (currentQuestion.correct_answer === '' && currentQuestion.correct_answer !== '0') {
        alert('Please select a correct answer for the multiple choice question.');
        return;
      }
    } else {
      if (!currentQuestion.correct_answer.trim()) {
        alert('Please enter a correct answer.');
        return;
      }
    }

    try {
      // In a real implementation, you would call:
      // await worksheetAPI.updateQuestion(worksheetId, editingQuestion.id, currentQuestion);
      
      // For now, update locally
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestion.index] = {
        ...updatedQuestions[editingQuestion.index],
        ...currentQuestion
      };
      setQuestions(updatedQuestions);
      
      setShowEditModal(false);
      setEditingQuestion(null);
      alert('Question updated successfully!');
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleQuestionTypeChange = (type) => {
    setCurrentQuestion({
      ...currentQuestion,
      question_type: type,
      correct_answer: type === 'MULTIPLE_CHOICE' ? '0' : '',
      options: type === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : []
    });
  };

  const getQuestionTypeDisplay = (type) => {
    const typeMap = {
      'MULTIPLE_CHOICE': 'Multiple Choice',
      'TRUE_FALSE': 'True/False',
      'SHORT_ANSWER': 'Short Answer',
      'ESSAY': 'Essay',
      'FILL_BLANK': 'Fill in the Blank'
    };
    return typeMap[type] || type;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
          <Sidebar />
        </div>
        
        <div className="lg:hidden">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading worksheet...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
          <Sidebar />
        </div>
        
        <div className="lg:hidden">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 mb-4">Worksheet not found</p>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Classes
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      {/* Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>
      
      <div className="lg:hidden">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(600px at 20% 20%, rgba(59, 130, 246, 0.05), transparent 40%),
                        radial-gradient(600px at 80% 80%, rgba(139, 92, 246, 0.05), transparent 40%)`
          }} />
        </div>
        
        <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-orange-500/10">
                  <FileText className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(-1)}
                      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition bg-transparent border-transparent"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white mt-1">
                    {worksheet.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {questions.length} questions 
                    </div>
                    <div className={`flex items-center gap-1 ${worksheet.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
                      {worksheet.is_published ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{worksheet.is_published ? 'Published' : 'Draft'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/teacher/worksheets/${worksheetId}/edit`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
              >
                <Edit className="w-4 h-4" />
                Edit Worksheet
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mt-2 mb-2">
            <div className="flex space-x-1">
              {['overview', 'questions'].map((tab) => {
                const tabConfig = {
                  overview: { name: 'Overview', icon: <Eye className="w-4 h-4" /> },
                  questions: { name: 'Questions', icon: <FileText className="w-4 h-4" /> },
                  submissions: { name: 'Submissions', icon: <Users className="w-4 h-4" /> }
                };
                
                const config = tabConfig[tab];
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
                      relative rounded-t-2xl capitalize
                      ${activeTab === tab
                        ? 'text-white bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 border-b-0 shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-800/50 hover:to-gray-900/50 hover:backdrop-blur-sm border border-transparent hover:border-white/5'
                      }
                    `}
                  >
                    {config.icon}
                    {config.name}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Worksheet Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                      <p className="text-gray-300">{worksheet.description || 'No description provided.'}</p>
                    </div>
                    
                    {worksheet.created_at && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Created</h4>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-green-400" />
                          {new Date(worksheet.created_at).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Questions ({questions.length})</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/teacher/worksheets/${worksheetId}/edit`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add New
                    </button>
                  </div>
                </div>
                
                {questions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 mb-4">No questions added yet</p>
                    <button
                      onClick={() => navigate(`/teacher/worksheets/${worksheetId}/edit`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Questions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={question.id} className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/30 transition group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-orange-400">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-white">Question {index + 1}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {getQuestionTypeDisplay(question.question_type)}
                                </span>

                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditQuestion(question, index)}
                              className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition"
                              title="Edit Question"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id, index)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                              title="Delete Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-4">{question.question_text}</p>
                        
                        {question.options && question.question_type === 'MULTIPLE_CHOICE' && (
                          <div className="space-y-2 mt-4">
                            <p className="text-sm text-gray-400">Options:</p>
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className={`p-3 rounded-xl ${question.correct_answer === optIndex.toString()
                                ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20'
                                : 'bg-white/[0.04] border border-white/10'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-300">{option}</span>
                                  {question.correct_answer === optIndex.toString() && (
                                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                                      <CheckCircle className="w-3 h-3" />
                                      Correct
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.correct_answer && question.question_type === 'TRUE_FALSE' && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-400 mb-2">Correct Answer:</p>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                              question.correct_answer === 'true' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {question.correct_answer === 'true' ? 'True' : 'False'}
                            </div>
                          </div>
                        )}
                        
                        {question.correct_answer && 
                         question.question_type !== 'MULTIPLE_CHOICE' && 
                         question.question_type !== 'TRUE_FALSE' && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-400 mb-2">Correct Answer:</p>
                            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                              <span className="text-gray-300">{question.correct_answer}</span>
                            </div>
                          </div>
                        )}
                        
                        {question.explanation && question.explanation.trim() !== '' && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-400 mb-2">Explanation:</p>
                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                              <span className="text-gray-300">{question.explanation}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Student Submissions ({submissions.length})</h3>
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition text-sm">
                    <Download className="w-4 h-4" />
                    Export All
                  </button>
                </div>
                
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 mb-2">No submissions yet</p>
                    <p className="text-sm text-gray-500">Students haven't submitted this worksheet yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/30 transition group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                {submission.student?.full_name || submission.student?.username || 'Student'}
                              </h4>
                              <p className="text-sm text-gray-400">
                                Submitted: {new Date(submission.submitted_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                              submission.grade !== null && submission.grade !== undefined
                                ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-yellow-400'
                            }`}>
                              {submission.grade !== null && submission.grade !== undefined
                                ? `${submission.grade}%`
                                : 'Not Graded'}
                            </span>
                            
                            <button className="p-2 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition text-gray-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400">
                              Time Spent: {submission.time_spent ? `${submission.time_spent} mins` : 'N/A'}
                            </span>
                          </div>
                          
                          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition text-sm">
                            <Edit className="w-3 h-3" />
                            Grade
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Question Modal */}
      {showEditModal && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingQuestion(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center">
                  <Type className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Edit Question {editingQuestion.index + 1}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Update question details and correct answer
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateQuestion();
            }} className="space-y-5">
              {/* Question Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Question Text *
                </label>
                <textarea
                  value={currentQuestion.question_text}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
                  required
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition resize-none"
                  placeholder="Enter your question here..."
                />
              </div>

              {/* Question Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Question Type *
                  </label>
                  <select
                    value={currentQuestion.question_type}
                    onChange={(e) => handleQuestionTypeChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="ESSAY">Essay</option>
                    <option value="FILL_BLANK">Fill in the Blank</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Points *
                  </label>
                  <input
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 10})}
                    min="1"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
                  />
                </div>
              </div>

              {/* Options for Multiple Choice */}
              {currentQuestion.question_type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-400">
                    Options (Mark correct answer with radio button) *
                  </label>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={currentQuestion.correct_answer === index.toString()}
                          onChange={() => setCurrentQuestion({...currentQuestion, correct_answer: index.toString()})}
                          className="w-4 h-4 text-orange-500"
                          required
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion({...currentQuestion, options: newOptions});
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
                          required
                        />
                        {currentQuestion.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = currentQuestion.options.filter((_, i) => i !== index);
                              setCurrentQuestion({...currentQuestion, options: newOptions});
                            }}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {currentQuestion.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: [...currentQuestion.options, '']
                          });
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-orange-400 hover:text-orange-300"
                      >
                        <Plus className="w-4 h-4" />
                        Add Another Option
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Correct Answer for other types */}
              {currentQuestion.question_type !== 'MULTIPLE_CHOICE' && currentQuestion.question_type !== 'TRUE_FALSE' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Correct Answer *
                  </label>
                  <input
                    type="text"
                    value={currentQuestion.correct_answer}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
                    placeholder={
                      currentQuestion.question_type === 'SHORT_ANSWER' 
                        ? 'Expected short answer...' 
                        : currentQuestion.question_type === 'ESSAY'
                        ? 'Key points to look for...'
                        : 'Missing word/phrase...'
                    }
                  />
                </div>
              )}

              {/* True/False Answer */}
              {currentQuestion.question_type === 'TRUE_FALSE' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Correct Answer *
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion({...currentQuestion, correct_answer: 'true'})}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${currentQuestion.correct_answer === 'true'
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg shadow-orange-500/30'
                          : 'bg-white/[0.04] text-gray-400 hover:text-white'
                        }`}
                    >
                      True
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion({...currentQuestion, correct_answer: 'false'})}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${currentQuestion.correct_answer === 'false'
                          ? 'bg-gradient-to-r from-red-500 to-pink-400 text-white shadow-lg shadow-red-500/30'
                          : 'bg-white/[0.04] text-gray-400 hover:text-white'
                        }`}
                    >
                      False
                    </button>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Explanation (Optional - helps students understand)
                </label>
                <textarea
                  value={currentQuestion.explanation}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition resize-none"
                  placeholder="Explain why this is the correct answer. This will help students understand the concept better."
                />
                <p className="text-xs text-gray-500">
                  This explanation will be shown to students after they submit their answer.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Update Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}