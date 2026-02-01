import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added Link import here
import { worksheetAPI, documentAPI, WORKSHEET_TYPES, QUESTION_TYPES } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  Plus, FileText, Save, Eye, Trash2, X, Upload,
  CheckCircle, Type, List, Edit2, AlertCircle,
  Download, Share2, Calendar, Clock, BarChart,
  FileUp, File, ChevronLeft, Book, Sparkles, Users,
  Award, Brain, Target, Lightbulb, ArrowLeft,
  MessageSquare, Bot, User, Send, Search, Filter
} from 'lucide-react';

// Map question types for display
const QUESTION_TYPE_DISPLAY = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QUESTION_TYPES.TRUE_FALSE]: 'True/False',
  [QUESTION_TYPES.SHORT_ANSWER]: 'Short Answer',
  [QUESTION_TYPES.ESSAY]: 'Essay',
  [QUESTION_TYPES.FILL_BLANK]: 'Fill in the Blank'
};

export default function WorksheetCreator() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState({
    title: '',
    description: '',
    worksheet_type: WORKSHEET_TYPES.QUESTION_BASED,
    due_date: '',
    max_score: 100,
    pdf_document_id: null
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: QUESTION_TYPES.MULTIPLE_CHOICE,
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 10,
    order: 1
  });
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showPDFUploadModal, setShowPDFUploadModal] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalPoints: 0,
    questionTypes: {}
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log('Class ID:', classId);
  }, [classId]);

  useEffect(() => {
    // Update stats when questions change
    const totalPoints = questions.reduce((total, q) => total + (parseInt(q.points) || 0), 0);
    const questionTypes = questions.reduce((acc, q) => {
      acc[q.question_type] = (acc[q.question_type] || 0) + 1;
      return acc;
    }, {});

    setStats({
      totalQuestions: questions.length,
      totalPoints: totalPoints,
      questionTypes: questionTypes
    });
  }, [questions]);

  // Handle PDF selection
  const handlePDFSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPDF(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  // Upload PDF file
  const handlePDFUpload = async () => {
    if (!selectedPDF) {
      alert('Please select a PDF file first.');
      return;
    }

    setUploadingPDF(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedPDF);
      
      // Upload PDF to documents
      const uploadResponse = await documentAPI.upload(formData);
      const pdfDocumentId = uploadResponse.data.id;
      
      // Set the PDF document ID in worksheet data
      setWorksheet({
        ...worksheet,
        pdf_document_id: pdfDocumentId
      });
      
      setShowPDFUploadModal(false);
      alert('PDF uploaded successfully!');
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setError('Error uploading PDF: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
      alert('Error uploading PDF: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    } finally {
      setUploadingPDF(false);
    }
  };

  // Question management functions
  const handleAddQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      alert('Please enter a question text.');
      return;
    }

    if (currentQuestion.question_type === QUESTION_TYPES.MULTIPLE_CHOICE) {
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

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = {
        ...currentQuestion,
        order: editingQuestionIndex + 1
      };
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
    } else {
      setQuestions([
        ...questions,
        {
          ...currentQuestion,
          order: questions.length + 1
        }
      ]);
    }
    
    resetQuestionForm();
    setShowQuestionModal(false);
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      question_text: '',
      question_type: QUESTION_TYPES.MULTIPLE_CHOICE,
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 10,
      order: questions.length + 1
    });
  };

  const handleEditQuestion = (index) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    const reorderedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      order: i + 1
    }));
    setQuestions(reorderedQuestions);
  };

  // Validate worksheet before saving
  const validateWorksheet = () => {
    if (!worksheet.title.trim()) {
      alert('Please enter a worksheet title.');
      return false;
    }

    if (worksheet.worksheet_type === WORKSHEET_TYPES.QUESTION_BASED) {
      if (questions.length === 0) {
        alert('Please add at least one question to the worksheet.');
        return false;
      }

      // Validate all questions have answers
      const invalidQuestions = questions.filter(q => {
        if (q.question_type === QUESTION_TYPES.MULTIPLE_CHOICE) {
          return q.correct_answer === '' && q.correct_answer !== '0';
        }
        return !q.correct_answer || q.correct_answer.trim() === '';
      });

      if (invalidQuestions.length > 0) {
        alert(`Please set correct answers for all questions. Missing answers: ${invalidQuestions.length}`);
        return false;
      }
    } else if (worksheet.worksheet_type === WORKSHEET_TYPES.PDF) {
      if (!worksheet.pdf_document_id) {
        alert('Please upload a PDF file for the worksheet.');
        return false;
      }
    }

    return true;
  };

  // Save worksheet based on type
  const handleSaveWorksheet = async () => {
    if (!validateWorksheet()) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Prepare worksheet data
      const worksheetData = {
        title: worksheet.title,
        description: worksheet.description || '',
        worksheet_type: worksheet.worksheet_type,
        due_date: worksheet.due_date || null,
        max_score: worksheet.max_score || 100,
      };

      // Add PDF document ID if it's a PDF worksheet
      if (worksheet.worksheet_type === WORKSHEET_TYPES.PDF && worksheet.pdf_document_id) {
        worksheetData.pdf_document_id = worksheet.pdf_document_id;
      }

      console.log('Saving worksheet data:', worksheetData);
      console.log('Class ID in URL:', classId);

      // Create worksheet
      const worksheetResponse = await worksheetAPI.create(classId, worksheetData);
      const worksheetId = worksheetResponse.data.id;
      
      // For question-based worksheets, add all questions
      if (worksheet.worksheet_type === WORKSHEET_TYPES.QUESTION_BASED && questions.length > 0) {
        console.log('Adding questions:', questions);
        
        // Add questions one by one
        for (const question of questions) {
          try {
            await worksheetAPI.addQuestion(worksheetId, {
              question_text: question.question_text,
              question_type: question.question_type,
              options: question.question_type === QUESTION_TYPES.MULTIPLE_CHOICE ? question.options : [],
              correct_answer: question.correct_answer,
              explanation: question.explanation || '',
              points: question.points || 10,
              order: question.order
            });
          } catch (questionError) {
            console.error('Error adding question:', questionError);
            throw new Error(`Failed to add question: ${questionError.response?.data?.detail || questionError.message}`);
          }
        }
      }
      
      setSaved(true);
      
      // Show success message and redirect
      alert(`Worksheet "${worksheet.title}" saved successfully!`);
      
      // Pass success flag to navigate to trigger refresh
      navigate(`/teacher/classes/${classId}`, { 
        state: { 
          worksheetCreated: true,
          worksheetTitle: worksheet.title 
        } 
      });
      
    } catch (error) {
      console.error('Error saving worksheet:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      setError(`Error saving worksheet: ${errorMessage}`);
      alert(`Error saving worksheet: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishWorksheet = async () => {
    if (!validateWorksheet()) {
      return;
    }
    
    if (window.confirm('Publish this worksheet? Students will be able to see and submit it.')) {
      setLoading(true);
      setError(null);
      try {
        // Prepare worksheet data
        const worksheetData = {
          title: worksheet.title,
          description: worksheet.description || '',
          worksheet_type: worksheet.worksheet_type,
          due_date: worksheet.due_date || null,
          max_score: worksheet.max_score || 100,
          ...(worksheet.worksheet_type === WORKSHEET_TYPES.PDF && worksheet.pdf_document_id ? { 
            pdf_document_id: worksheet.pdf_document_id 
          } : {})
        };

        // Create the worksheet
        const worksheetResponse = await worksheetAPI.create(classId, worksheetData);
        const worksheetId = worksheetResponse.data.id;
        
        // Add questions if it's a question_based worksheet
        if (worksheet.worksheet_type === WORKSHEET_TYPES.QUESTION_BASED && questions.length > 0) {
          for (const question of questions) {
            await worksheetAPI.addQuestion(worksheetId, {
              question_text: question.question_text,
              question_type: question.question_type,
              options: question.question_type === QUESTION_TYPES.MULTIPLE_CHOICE ? question.options : [],
              correct_answer: question.correct_answer,
              explanation: question.explanation || '',
              points: question.points || 10,
              order: question.order
            });
          }
        }
        
        // Publish the worksheet
        await worksheetAPI.publish(worksheetId);
        
        alert('Worksheet published successfully! Students can now access it.');
        
        // Pass success flag to navigate to trigger refresh
        navigate(`/teacher/classes/${classId}`, { 
          state: { 
            worksheetPublished: true,
            worksheetTitle: worksheet.title 
          } 
        });
      } catch (error) {
        console.error('Error publishing worksheet:', error);
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.message || 
                            error.message || 
                            'Unknown error occurred';
        setError(`Error publishing worksheet: ${errorMessage}`);
        alert('Error publishing worksheet: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // Clear PDF selection
  const clearPDFSelection = () => {
    setSelectedPDF(null);
    setWorksheet({
      ...worksheet,
      pdf_document_id: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file name from PDF if exists
  const getPDFFileName = () => {
    if (selectedPDF) {
      return selectedPDF.name;
    }
    return worksheet.pdf_document_id ? 'Uploaded PDF Document' : null;
  };

  // Fix for question type change
  const handleQuestionTypeChange = (type) => {
    const updatedQuestion = {
      ...currentQuestion,
      question_type: type,
      correct_answer: type === QUESTION_TYPES.MULTIPLE_CHOICE ? '0' : '',
      options: type === QUESTION_TYPES.MULTIPLE_CHOICE ? ['', '', '', ''] : []
    };
    setCurrentQuestion(updatedQuestion);
  };

  // Get display name for question type
  const getQuestionTypeDisplay = (type) => {
    return QUESTION_TYPE_DISPLAY[type] || type;
  };

  const getWorksheetTypeDisplay = () => {
    return worksheet.worksheet_type === WORKSHEET_TYPES.QUESTION_BASED ? 'Question Based' : 
           worksheet.worksheet_type === WORKSHEET_TYPES.PDF ? 'PDF' : 'Text';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(600px at 20% 20%, rgba(59, 130, 246, 0.05), transparent 40%),
                      radial-gradient(600px at 80% 80%, rgba(139, 92, 246, 0.05), transparent 40%)`
        }} />
      </div>

      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>
      
      <div className="lg:hidden">
        <Sidebar />
      </div>
      
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
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
                    <Link
                      to="/teacher/classes"
                      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Classes
                    </Link>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white mt-1">
                    Create Worksheet
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Type: <span className="text-white font-medium ml-1">{getWorksheetTypeDisplay()}</span>
                    </div>
                    {worksheet.worksheet_type === WORKSHEET_TYPES.QUESTION_BASED && (
                      <>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Questions: <span className="text-white font-medium ml-1">{stats.totalQuestions}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          Points: <span className="text-white font-medium ml-1">{stats.totalPoints}</span>
                        </div>
                      </>
                    )}
                    {worksheet.worksheet_type === WORKSHEET_TYPES.PDF && worksheet.pdf_document_id && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">PDF Ready</span>
                      </div>
                    )}
                  </div>
                  <br></br>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveWorksheet}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all text-sm font-medium disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Draft
                  </>
                )}
              </button>
              
              <button
                onClick={handlePublishWorksheet}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200 disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                Publish Worksheet
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}
          
          {/* Worksheet Details */}
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-orange-400" />
              Worksheet Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Title *</label>
                <input
                  type="text"
                  value={worksheet.title}
                  onChange={(e) => setWorksheet({...worksheet, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
                  placeholder="e.g., Chapter 1 Quiz"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Due Date</label>
                <input
                  type="datetime-local"
                  value={worksheet.due_date}
                  onChange={(e) => setWorksheet({...worksheet, due_date: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-400">Description</label>
                <textarea
                  value={worksheet.description}
                  onChange={(e) => setWorksheet({...worksheet, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition resize-none"
                  placeholder="Describe what this worksheet covers..."
                />
              </div>
            </div>
          </div>
          <br></br>

          {/* Content based on worksheet type */}
          {worksheet.worksheet_type === WORKSHEET_TYPES.QUESTION_BASED ? (
            /* Questions Section */
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-orange-400" />
                    Questions
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {questions.length} questions • {stats.totalPoints} total points
                  </p>
                </div>
                <button
                  onClick={() => setShowQuestionModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 mb-4">No questions added yet</p>
                  <button
                    onClick={() => setShowQuestionModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={index} className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/30 transition group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/20 flex items-center justify-center">
                            <span className="text-xs font-semibold text-orange-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm">
                              {question.question_text.substring(0, 100)}
                              {question.question_text.length > 100 ? '...' : ''}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                {getQuestionTypeDisplay(question.question_type)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {question.points} points
                              </span>
                              {question.explanation && question.explanation.trim() !== '' && (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                  Has Explanation
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditQuestion(index)}
                            className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(index)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {question.question_type === QUESTION_TYPES.MULTIPLE_CHOICE && question.options && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-400">Options:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {question.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                                <div className={`w-3 h-3 rounded-full border ${optIndex.toString() === question.correct_answer
                                    ? 'bg-orange-500 border-orange-500'
                                    : 'border-gray-500'
                                  }`} />
                                <span className="text-xs text-gray-300">
                                  {opt || `Option ${optIndex + 1}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {question.explanation && question.explanation.trim() !== '' && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-400">Explanation:</p>
                          <p className="text-sm text-gray-300 mt-1">
                            {question.explanation.substring(0, 150)}
                            {question.explanation.length > 150 ? '...' : ''}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-400">
                          Correct Answer: <span className="text-orange-400 font-medium">
                            {question.question_type === QUESTION_TYPES.MULTIPLE_CHOICE 
                              ? `Option ${parseInt(question.correct_answer) + 1}`
                              : question.correct_answer}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* PDF Upload Section */
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-orange-400" />
                    PDF Worksheet
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload a PDF document for students to complete
                  </p>
                </div>
                <button
                  onClick={() => setShowPDFUploadModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                >
                  <Upload className="w-4 h-4" />
                  {worksheet.pdf_document_id ? 'Change PDF' : 'Upload PDF'}
                </button>
              </div>

              {worksheet.pdf_document_id ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/20 flex items-center justify-center">
                          <File className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {getPDFFileName() || 'Uploaded PDF'}
                          </h4>
                          <p className="text-xs text-gray-400">
                            PDF Document • Ready for students
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={clearPDFSelection}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mt-4 p-4 rounded-xl bg-black/20 border border-white/10">
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="text-sm text-white">PDF uploaded successfully</p>
                          <p className="text-xs text-gray-400">
                            Students will be able to download this PDF worksheet
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-sm font-medium text-white">PDF Ready for Students</p>
                        <p className="text-xs text-gray-300">
                          Students will download and complete this PDF worksheet. 
                          They'll submit their completed work for you to grade manually.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 mb-4">No PDF uploaded yet</p>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    Upload a PDF worksheet for students to download and complete. 
                    Students will submit their completed PDFs for you to grade.
                  </p>
                  <button
                    onClick={() => setShowPDFUploadModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                  >
                    <Upload className="w-4 h-4" />
                    Upload PDF Worksheet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowQuestionModal(false);
                setEditingQuestionIndex(null);
                resetQuestionForm();
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
                    {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {editingQuestionIndex !== null 
                      ? `Editing question ${editingQuestionIndex + 1} of ${questions.length}`
                      : 'Add a new question to your worksheet'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddQuestion();
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
                    <option value={QUESTION_TYPES.MULTIPLE_CHOICE}>Multiple Choice</option>
                    <option value={QUESTION_TYPES.TRUE_FALSE}>True/False</option>
                    <option value={QUESTION_TYPES.SHORT_ANSWER}>Short Answer</option>
                    <option value={QUESTION_TYPES.ESSAY}>Essay</option>
                    <option value={QUESTION_TYPES.FILL_BLANK}>Fill in the Blank</option>
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
              {currentQuestion.question_type === QUESTION_TYPES.MULTIPLE_CHOICE && (
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
                          required={currentQuestion.question_type === QUESTION_TYPES.MULTIPLE_CHOICE}
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
                          required={currentQuestion.question_type === QUESTION_TYPES.MULTIPLE_CHOICE}
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
              {currentQuestion.question_type !== QUESTION_TYPES.MULTIPLE_CHOICE && currentQuestion.question_type !== QUESTION_TYPES.TRUE_FALSE && (
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
                      currentQuestion.question_type === QUESTION_TYPES.SHORT_ANSWER 
                        ? 'Expected short answer...' 
                        : currentQuestion.question_type === QUESTION_TYPES.ESSAY
                        ? 'Key points to look for...'
                        : 'Missing word/phrase...'
                    }
                  />
                </div>
              )}

              {/* True/False Answer */}
              {currentQuestion.question_type === QUESTION_TYPES.TRUE_FALSE && (
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
                    setShowQuestionModal(false);
                    setEditingQuestionIndex(null);
                    resetQuestionForm();
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                >
                  {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Upload Modal */}
      {showPDFUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            <button
              onClick={() => setShowPDFUploadModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-white/10 flex items-center justify-center">
                  <FileUp className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Upload PDF Worksheet
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload a PDF document for students to complete
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-orange-500/30 transition cursor-pointer relative">
                {selectedPDF ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/20 flex items-center justify-center">
                      <File className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedPDF.name}</p>
                      <p className="text-sm text-gray-400">
                        {(selectedPDF.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={clearPDFSelection}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-white font-medium mb-2">Drop PDF file here or click to browse</p>
                    <p className="text-sm text-gray-400">Supports PDF files up to 50MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePDFSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPDFUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePDFUpload}
                  disabled={!selectedPDF || uploadingPDF}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200 disabled:opacity-50"
                >
                  {uploadingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload PDF'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}