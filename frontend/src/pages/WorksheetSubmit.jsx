import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { worksheetAPI, QUESTION_TYPES } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  CheckCircle, XCircle, Clock, Award, FileText,
  ArrowLeft, Send, AlertCircle, ThumbsUp, Star,
  BarChart3, TrendingUp, RefreshCw, Download,
  Eye, Printer, Share2, Home, Users, BookOpen
} from 'lucide-react';

export default function WorksheetSubmit() {
  const { worksheetId } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    loadWorksheet();
    // Load saved answers from localStorage
    const savedAnswers = localStorage.getItem(`worksheet_${worksheetId}_answers`);
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
  }, [worksheetId]);

  const loadWorksheet = async () => {
    try {
      const [worksheetRes, questionsRes] = await Promise.all([
        worksheetAPI.get(worksheetId),
        worksheetAPI.getQuestions(worksheetId)
      ]);
      setWorksheet(worksheetRes.data);
      setQuestions(questionsRes.data || []);
    } catch (error) {
      console.error('Error loading worksheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Format answers for submission
      const formattedAnswers = {};
      Object.keys(answers).forEach(key => {
        if (answers[key] !== '' && answers[key] !== undefined) {
          formattedAnswers[key] = answers[key];
        }
      });
      
      const response = await worksheetAPI.submit(worksheetId, { answers: formattedAnswers });
      setSubmission(response.data);
      
      // Clear saved answers
      localStorage.removeItem(`worksheet_${worksheetId}_answers`);
      
      alert('Worksheet submitted successfully!');
    } catch (error) {
      console.error('Error submitting worksheet:', error);
      alert('Error submitting worksheet: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const calculateScore = () => {
    if (!submission || !questions.length) {
      return { score: 0, correct: 0, total: questions.length };
    }
    
    // Mock calculation - replace with actual logic from submission
    const totalQuestions = questions.length;
    const correctAnswers = Math.floor(totalQuestions * 0.8); // Mock 80% correct
    return {
      score: (correctAnswers / totalQuestions) * 100,
      correct: correctAnswers,
      total: totalQuestions
    };
  };

  const getFeedback = (score) => {
    if (score >= 90) return { 
      message: 'Excellent work! You mastered this material.', 
      icon: <Star className="w-6 h-6 text-yellow-400" />,
      color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/20'
    };
    if (score >= 75) return { 
      message: 'Good job! You understand the main concepts.', 
      icon: <ThumbsUp className="w-6 h-6 text-green-400" />,
      color: 'from-green-500/20 to-emerald-500/20 border-green-500/20'
    };
    if (score >= 60) return { 
      message: 'Not bad! Review the concepts you missed.', 
      icon: <AlertCircle className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20'
    };
    return { 
      message: 'Keep practicing! Review the material and try again.', 
      icon: <RefreshCw className="w-6 h-6 text-red-400" />,
      color: 'from-red-500/20 to-pink-500/20 border-red-500/20'
    };
  };

  const answeredCount = Object.values(answers).filter(a => a !== '' && a !== undefined).length;

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
            <p className="text-gray-400">Loading submission...</p>
          </div>
        </div>
      </div>
    );
  }

  const score = calculateScore();
  const feedback = getFeedback(score.score);

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
                  to={`/student/worksheets/${worksheetId}`}
                  className="p-2 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    Submit Worksheet
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Review and submit your answers
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                to={`/student/worksheets/${worksheetId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Worksheet</span>
              </Link>
            </div>
          </div>

          {submission ? (
            /* Submission Results */
            <div className="max-w-4xl mx-auto">
              <div className={`bg-gradient-to-br ${feedback.color} border rounded-2xl p-8 text-center mb-8`}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  {feedback.icon}
                </div>
                <h2 className="text-2xl font-semibold text-white mb-3">Submission Complete!</h2>
                <p className="text-gray-300 mb-6">{feedback.message}</p>
                
                <div className="flex justify-center items-center gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white mb-2">{score.score.toFixed(1)}%</div>
                    <p className="text-sm text-gray-400">Overall Score</p>
                  </div>
                  <div className="h-16 w-px bg-white/10" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {score.correct}/{score.total}
                    </div>
                    <p className="text-sm text-gray-400">Correct Answers</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Performance Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">Accuracy</span>
                        <span className="text-sm font-medium text-green-400">{score.score.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.04]">
                        <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${score.score}%` }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">Class Rank</span>
                        <span className="text-sm font-medium text-blue-400">Top 25%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.04]">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: '75%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">Time Taken</span>
                        <span className="text-sm font-medium text-yellow-400">25:43</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.04]">
                        <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400" style={{ width: '65%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Next Steps
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <BookOpen className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white text-sm">Review incorrect answers</p>
                        <p className="text-xs text-gray-400">Learn from your mistakes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <Eye className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white text-sm">View detailed solutions</p>
                        <p className="text-xs text-gray-400">See step-by-step explanations</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <RefreshCw className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white text-sm">Practice similar questions</p>
                        <p className="text-xs text-gray-400">Improve your skills</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                
                <Link
                  to="/student/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition"
                >
                  <Home className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            /* Submission Confirmation */
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                  <Send className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-3">Ready to Submit?</h2>
                <p className="text-gray-300 mb-6">
                  You're about to submit your worksheet for grading. Once submitted, you cannot make changes.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div className="text-left">
                        <p className="font-medium text-white">{worksheet?.title}</p>
                        <p className="text-sm text-gray-400">{worksheet?.description?.substring(0, 50)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{worksheet?.max_score || 100} points</p>
                      <p className="text-sm text-gray-400">Max Score</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white font-medium">{answeredCount}</span>
                      </div>
                      <p className="text-sm text-gray-400">Answered Questions</p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">{questions.length - answeredCount}</span>
                      </div>
                      <p className="text-sm text-gray-400">Unanswered</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Total Questions</span>
                      <span className="text-white font-medium">{questions.length}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.04]">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate(`/student/worksheets/${worksheetId}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Review
                  </button>
                  
                  <button
                    onClick={() => setShowConfirmation(true)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Worksheet
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            <div className="text-center mb-6">
              <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Final Confirmation</h2>
              <p className="text-gray-400">
                Are you sure you want to submit this worksheet? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}