import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { worksheetAPI, chatAPI, documentAPI, QUESTION_TYPES } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  FileText, Clock, Calendar, Award, ChevronRight, CheckCircle,
  AlertCircle, ArrowLeft, Save, Send, Eye, Download, Printer,
  BookOpen, HelpCircle, Calculator, Type, List, ChevronLeft,
  Bot, User, Sparkles, MessageSquare, Brain, ExternalLink,
  Maximize2, Minimize2, Search, X, Loader2, File, Shield,
  Lightbulb, Hash, Zap, Target, TrendingUp, BarChart3,
  Users, Plus, Trash2, Edit, Book
} from 'lucide-react';

export default function WorksheetViewer() {
  const { worksheetId } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // AI Chat State
  const [activeTab, setActiveTab] = useState('questions');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const messagesEndRef = useRef(null);

  // New state for all questions view
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    loadWorksheet();
    // Load saved answers from localStorage
    const savedAnswers = localStorage.getItem(`worksheet_${worksheetId}_answers`);
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
  }, [worksheetId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadWorksheet = async () => {
    try {
      setLoading(true);
      const [worksheetRes, questionsRes] = await Promise.all([
        worksheetAPI.getDetails(worksheetId),
        worksheetAPI.getQuestions(worksheetId)
      ]);
      
      setWorksheet(worksheetRes.data);
      setQuestions(questionsRes.data || []);
      
      // Load document info if worksheet has a PDF
      if (worksheetRes.data.pdf_document_id) {
        loadDocumentInfo(worksheetRes.data.pdf_document_id);
      }
      
      // Initialize answers object
      const initialAnswers = {};
      (questionsRes.data || []).forEach((q, index) => {
        initialAnswers[index] = '';
      });
      
      // Merge with saved answers
      const savedAnswers = localStorage.getItem(`worksheet_${worksheetId}_answers`);
      if (savedAnswers) {
        const saved = JSON.parse(savedAnswers);
        setAnswers({ ...initialAnswers, ...saved });
      } else {
        setAnswers(initialAnswers);
      }
      
      // Load or create chat for this worksheet
      loadOrCreateChat(worksheetRes.data.title);
      
    } catch (error) {
      console.error('Error loading worksheet:', error);
      // Create demo data for testing
      createDemoData();
    } finally {
      setLoading(false);
    }
  };

  const createDemoData = () => {
    const demoWorksheet = {
      id: worksheetId,
      title: `Worksheet ${worksheetId}`,
      worksheet_type: 'QUESTION_BASED',
      max_score: 100,
      time_limit: 60,
      description: 'Complete the questions below to test your knowledge.',
      pdf_document_id: null
    };
    
    const demoQuestions = [
      {
        id: 1,
        question_text: "What is the capital of France?",
        question_type: "MULTIPLE_CHOICE",
        options: ["London", "Berlin", "Paris", "Madrid"],
        points: 5,
        correct_answer: "2"
      },
      {
        id: 2,
        question_text: "Explain the theory of relativity in your own words.",
        question_type: "ESSAY",
        points: 10
      },
      {
        id: 3,
        question_text: "The Earth revolves around the Sun. True or False?",
        question_type: "TRUE_FALSE",
        points: 3,
        correct_answer: "true"
      },
      {
        id: 4,
        question_text: "What is the chemical symbol for water?",
        question_type: "SHORT_ANSWER",
        points: 2,
        correct_answer: "H2O"
      },
      {
        id: 5,
        question_text: "The process of photosynthesis converts sunlight into ______.",
        question_type: "FILL_BLANK",
        points: 3,
        correct_answer: "energy"
      }
    ];
    
    setWorksheet(demoWorksheet);
    setQuestions(demoQuestions);
    
    // Initialize answers
    const initialAnswers = {};
    demoQuestions.forEach((q, index) => {
      initialAnswers[index] = '';
    });
    setAnswers(initialAnswers);
    
    // Set up AI chat
    setCurrentChatId('demo-chat-' + worksheetId);
    setChatMessages([
      {
        id: 1,
        role: 'assistant',
        content: 'Hello! I\'m here to help you with this worksheet. Ask me any questions about the content or specific questions.',
        timestamp: new Date().toISOString()
      }
    ]);
    
    // Generate suggested prompts based on demo questions
    generateSuggestedPrompts(demoWorksheet.title, demoQuestions);
  };

  const loadDocumentInfo = async (documentId) => {
    try {
      const response = await documentAPI.getById(documentId);
      if (response.data && response.data.data) {
        setDocumentInfo(response.data.data);
        generateSuggestedPrompts(worksheet?.title, questions);
      }
    } catch (error) {
      console.error('Error loading document info:', error);
    }
  };

  const loadOrCreateChat = async (title) => {
    try {
      const chatsResponse = await chatAPI.getAll();
      const existingChat = chatsResponse.data.find(
        chat => chat.context_type === 'worksheet' && chat.context_id === parseInt(worksheetId)
      );

      if (existingChat) {
        setCurrentChatId(existingChat.id);
        loadChatMessages(existingChat.id);
      } else {
        // Create a new chat for this worksheet
        const chatResponse = await chatAPI.create({
          title: `Worksheet Chat: ${title}`,
          context_type: 'worksheet',
          context_id: worksheetId
        });
        if (chatResponse.data && chatResponse.data.id) {
          setCurrentChatId(chatResponse.data.id);
        }
      }
    } catch (error) {
      console.error('Error loading/creating chat:', error);
      // Use a mock chat ID for development
      setCurrentChatId('mock-chat-' + worksheetId);
      // Load mock messages
      setChatMessages([
        {
          id: 1,
          role: 'assistant',
          content: 'Hello! I\'m here to help you with this worksheet. Ask me any questions about the content or specific questions.',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const response = await chatAPI.getMessages(chatId, 50);
      if (response.data) {
        const formattedMessages = response.data.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }));
        setChatMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const generateSuggestedPrompts = (title, questionsList) => {
    const prompts = [
      `Explain the main concepts in "${title}"`,
      `What are the key topics covered in this worksheet?`,
      `Give me tips for answering question types in this worksheet`,
      `Provide additional practice questions for "${title}"`,
      `Break down complex concepts in this worksheet`,
      `How should I approach this worksheet?`,
    ];
    
    // Add prompts for specific questions
    if (questionsList && questionsList.length > 0) {
      prompts.push(
        `Help me understand question 1: "${questionsList[0]?.question_text?.substring(0, 50)}..."`,
        `What is the answer to question ${questionsList.length > 1 ? '2' : '1'}?`
      );
    }
    
    setSuggestedPrompts(prompts);
  };

  const handleAnswerChange = (questionIndex, value) => {
    const newAnswers = {
      ...answers,
      [questionIndex]: value
    };
    setAnswers(newAnswers);
    
    // Save to localStorage
    localStorage.setItem(`worksheet_${worksheetId}_answers`, JSON.stringify(newAnswers));
    
    // Show saved indicator
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSubmit = async () => {
    const unansweredCount = Object.values(answers).filter(a => !a && a !== 0).length;
    
    if (unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Submit anyway?`)) {
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const formattedAnswers = {};
      Object.keys(answers).forEach(key => {
        if (answers[key] !== '' && answers[key] !== undefined) {
          formattedAnswers[key] = answers[key];
        }
      });
      
      // Submit to API
      const submissionData = {
        worksheet_id: worksheetId,
        answers: formattedAnswers,
        submitted_at: new Date().toISOString(),
        student_id: 1 // This should come from auth
      };
      
      await worksheetAPI.submit(worksheetId, submissionData);
      
      // Clear saved answers
      localStorage.removeItem(`worksheet_${worksheetId}_answers`);
      
      alert('Worksheet submitted successfully!');
      
      // Navigate to results or dashboard
      try {
        navigate(`/student/worksheets/${worksheetId}/results`);
      } catch {
        navigate('/student/dashboard');
      }
      
    } catch (error) {
      console.error('Error submitting worksheet:', error);
      
      // Fallback: Save submission locally
      const submissions = JSON.parse(localStorage.getItem('worksheet_submissions') || '[]');
      submissions.push({
        worksheetId,
        answers: answers,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('worksheet_submissions', JSON.stringify(submissions));
      localStorage.removeItem(`worksheet_${worksheetId}_answers`);
      
      alert('Worksheet submitted (saved locally)!');
      navigate('/student/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE: return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case QUESTION_TYPES.TRUE_FALSE: return <AlertCircle className="w-4 h-4 text-green-400" />;
      case QUESTION_TYPES.SHORT_ANSWER: return <Type className="w-4 h-4 text-yellow-400" />;
      case QUESTION_TYPES.ESSAY: return <BookOpen className="w-4 h-4 text-purple-400" />;
      case QUESTION_TYPES.FILL_BLANK: return <HelpCircle className="w-4 h-4 text-red-400" />;
      default: return <HelpCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const saveProgress = () => {
    localStorage.setItem(`worksheet_${worksheetId}_answers`, JSON.stringify(answers));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput('');

    const tempMsg = { 
      id: Date.now(), 
      role: 'user', 
      content: userMessage, 
      timestamp: new Date().toISOString() 
    };
    setChatMessages([...chatMessages, tempMsg]);

    setChatLoading(true);
    try {
      // In a real app, this would call your backend which uses the LLM
      const response = await chatAPI.sendMessage(currentChatId || 'demo-chat', {
        message: userMessage,
        worksheet_id: worksheetId,
        questions: questions,
        context: `Worksheet: ${worksheet?.title}\nDescription: ${worksheet?.description}\nQuestions: ${JSON.stringify(questions)}`
      });
      
      if (response.data && response.data.response) {
        const aiMsg = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: response.data.response, 
          timestamp: new Date().toISOString() 
        };
        setChatMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('No response from AI');
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback: Generate AI response based on worksheet content
      const aiResponse = generateAIFallbackResponse(userMessage);
      const aiMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: aiResponse, 
        timestamp: new Date().toISOString() 
      };
      setChatMessages(prev => [...prev, aiMsg]);
      
    } finally {
      setChatLoading(false);
    }
  };

  const generateAIFallbackResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check if question is about specific question
    const questionMatch = userMessage.match(/question\s*(\d+)/i);
    if (questionMatch) {
      const questionNum = parseInt(questionMatch[1]) - 1;
      if (questions[questionNum]) {
        const q = questions[questionNum];
        return `For question ${questionNum + 1} ("${q.question_text}"):
        
Type: ${q.question_type}
Points: ${q.points}

Tips for answering:
${getQuestionTypeTips(q.question_type)}

Remember to:
1. Read the question carefully
2. Check all options before answering
3. Review your answer before submitting`;
      }
    }
    
    // Check for general worksheet questions
    if (lowerMessage.includes('help') || lowerMessage.includes('explain') || lowerMessage.includes('how')) {
      return `I'll help you with "${worksheet?.title}"!

This worksheet has ${questions.length} questions covering different types:
${questions.map((q, i) => `  ${i + 1}. ${q.question_type.replace('_', ' ')} (${q.points} points)`).join('\n')}

Key tips:
1. Multiple Choice: Read all options carefully
2. Essay: Structure your answer with introduction, body, conclusion
3. True/False: Watch for absolute words like "always" or "never"
4. Short Answer: Be concise but complete
5. Fill in Blank: Check grammar and context

The worksheet is worth ${worksheet?.max_score || 100} points total.`;
    }
    
    // Default response
    return `I understand you're asking about "${userMessage}" regarding the worksheet "${worksheet?.title}".

Based on the worksheet content, I recommend:
1. Reviewing the questions carefully
2. For multiple-choice questions, eliminate wrong answers first
3. For essay questions, create an outline before writing
4. Managing your time (${worksheet?.time_limit || 60} minutes total)

Would you like specific help with any particular question?`;
  };

  const getQuestionTypeTips = (type) => {
    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return "• Read all options before choosing\n• Eliminate obviously wrong answers\n• Look for keywords in both question and options";
      case QUESTION_TYPES.TRUE_FALSE:
        return "• Watch for absolute words (always, never)\n• Statements must be completely true or false\n• If any part is false, the statement is false";
      case QUESTION_TYPES.SHORT_ANSWER:
        return "• Be concise but complete\n• Answer the question directly\n• Use key terms from the question";
      case QUESTION_TYPES.ESSAY:
        return "• Create an outline first\n• Use paragraphs for different points\n• Include introduction and conclusion\n• Support points with examples";
      case QUESTION_TYPES.FILL_BLANK:
        return "• Read the full sentence\n• Consider grammar and context\n• The answer should fit logically";
      default:
        return "• Read carefully\n• Think before answering\n• Review your work";
    }
  };

  const handleQuickPrompt = (prompt) => {
    setChatInput(prompt);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };

  const renderQuestionInput = (question, index) => {
    const answer = answers[index] || '';
    
    switch (question.question_type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return (
          <div className="space-y-2">
            {question.options && question.options.map((option, optIndex) => (
              <label
                key={optIndex}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                  answer === optIndex.toString()
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-white/[0.04] border border-white/10 hover:border-blue-500/20'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={optIndex}
                  checked={answer === optIndex.toString()}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-white">{option}</span>
              </label>
            ))}
          </div>
        );
        
      case QUESTION_TYPES.TRUE_FALSE:
        return (
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition ${
              answer === 'true'
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-white/[0.04] border border-white/10 hover:border-green-500/20'
            }`}>
              <input
                type="radio"
                name={`question-${index}`}
                value="true"
                checked={answer === 'true'}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className="w-4 h-4 text-green-500"
              />
              <span className="text-white">True</span>
            </label>
            
            <label className={`flex items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition ${
              answer === 'false'
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-white/[0.04] border border-white/10 hover:border-red-500/20'
            }`}>
              <input
                type="radio"
                name={`question-${index}`}
                value="false"
                checked={answer === 'false'}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className="w-4 h-4 text-red-500"
              />
              <span className="text-white">False</span>
            </label>
          </div>
        );
        
      case QUESTION_TYPES.SHORT_ANSWER:
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
            placeholder="Enter your answer..."
          />
        );
        
      case QUESTION_TYPES.ESSAY:
        return (
          <textarea
            value={answer}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition resize-none"
            placeholder="Write your essay here..."
          />
        );
        
      case QUESTION_TYPES.FILL_BLANK:
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition"
            placeholder="Fill in the blank..."
          />
        );
        
      default:
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
            placeholder="Enter your answer..."
          />
        );
    }
  };

  const renderQuestionsTab = () => {
    if (!worksheet || questions.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 mb-4">No questions available</p>
          <p className="text-sm text-gray-500">This worksheet doesn't have any questions yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Questions Header with Toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">
            Questions ({questions.length})
          </h3>
          <button
            onClick={() => setShowAllQuestions(!showAllQuestions)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition"
          >
            {showAllQuestions ? (
              <>
                <Minimize2 className="w-4 h-4" />
                Show One by One
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Show All Questions
              </>
            )}
          </button>
        </div>

        {showAllQuestions ? (
          // Show all questions at once
          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-white">{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getQuestionTypeIcon(question.question_type)}
                        <span className="text-sm font-medium text-gray-400">
                          {question.question_type ? question.question_type.replace('_', ' ').toUpperCase() : 'QUESTION'}
                        </span>
                        <span className="text-sm text-yellow-400">{question.points || 0} points</span>
                      </div>
                      <h4 className="text-lg font-semibold text-white">Question {index + 1}</h4>
                    </div>
                  </div>
                  {answers[index] && (
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Answered
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <div className="mb-6">
                  <p className="text-xl text-white mb-6">{question.question_text}</p>
                  
                  {/* Question Input */}
                  {renderQuestionInput(question, index)}
                </div>

                {/* Clear Answer Button */}
                {answers[index] && (
                  <button
                    onClick={() => handleAnswerChange(index, '')}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                  >
                    Clear Answer
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Show one question at a time with navigation
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Question Navigation Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-white mb-4">Questions</h3>
                
                <div className="space-y-2 mb-6">
                  {questions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                        currentQuestion === index
                          ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                          : 'bg-white/[0.04] border border-white/10 hover:border-blue-500/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        currentQuestion === index
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          : 'bg-white/[0.08]'
                      }`}>
                        <span className={`text-sm font-medium ${
                          currentQuestion === index ? 'text-white' : 'text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-medium ${
                          currentQuestion === index ? 'text-white' : 'text-gray-300'
                        }`}>
                          Question {index + 1}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getQuestionTypeIcon(question.question_type)}
                          <span className="text-xs text-gray-400">{question.points || 0} pts</span>
                        </div>
                      </div>
                      {answers[index] && answers[index] !== '' && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Progress Stats */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-medium">
                      {Object.values(answers).filter(a => a !== '' && a !== undefined).length}/{questions.length}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.04]">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                      style={{ 
                        width: `${(Object.values(answers).filter(a => a !== '' && a !== undefined).length / questions.length) * 100}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Points</span>
                    <span className="text-white font-medium">
                      {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-white">{currentQuestion + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getQuestionTypeIcon(questions[currentQuestion]?.question_type)}
                        <span className="text-sm font-medium text-gray-400">
                          {questions[currentQuestion]?.question_type?.replace('_', ' ').toUpperCase() || 'QUESTION'}
                        </span>
                        <span className="text-sm text-yellow-400">{questions[currentQuestion]?.points || 0} points</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Question {currentQuestion + 1}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                      disabled={currentQuestion === 0}
                      className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                      disabled={currentQuestion === questions.length - 1}
                      className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-8">
                  <p className="text-xl text-white mb-6">
                    {questions[currentQuestion]?.question_text || `Question ${currentQuestion + 1}`}
                  </p>
                  
                  {/* Question Input */}
                  {renderQuestionInput(questions[currentQuestion], currentQuestion)}
                </div>

                {/* Navigation and Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                      disabled={currentQuestion === 0}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <button
                      onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                      disabled={currentQuestion === questions.length - 1}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAnswerChange(currentQuestion, '')}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                    >
                      Clear Answer
                    </button>
                    
                    <button
                      onClick={() => {
                        const nextUnanswered = questions.findIndex((_, idx) => !answers[idx] && idx > currentQuestion);
                        if (nextUnanswered !== -1) {
                          setCurrentQuestion(nextUnanswered);
                        } else {
                          const firstUnanswered = questions.findIndex((_, idx) => !answers[idx]);
                          if (firstUnanswered !== -1) {
                            setCurrentQuestion(firstUnanswered);
                          }
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Next Unanswered
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAIChatTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Worksheet Info */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sticky top-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm truncate max-w-[180px]">
                    {worksheet?.title || 'Worksheet'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {worksheet?.worksheet_type?.replace('_', ' ') || 'Question Based'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {worksheet?.max_score || 100} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Questions:</span>
                <span className="text-white font-medium">{questions.length}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Due Date:</span>
                <span className="text-white font-medium">
                  {worksheet?.due_date ? new Date(worksheet.due_date).toLocaleDateString() : 'No due date'}
                </span>
              </div>
              
              {documentInfo && (
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <File className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-white">Reference Document</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{documentInfo.title}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <h4 className="text-sm font-medium text-white mb-3">AI Tools</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickPrompt(`Explain the main concepts in "${worksheet?.title}"`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-purple-500/30 transition text-left"
                >
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Explain Concepts</span>
                </button>
                
                <button
                  onClick={() => handleQuickPrompt(`Help me solve question ${currentQuestion + 1}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-yellow-500/30 transition text-left"
                >
                  <HelpCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Get Help on Current Question</span>
                </button>
                
                <button
                  onClick={() => handleQuickPrompt(`Provide additional practice questions for "${worksheet?.title}"`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-green-500/30 transition text-left"
                >
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Practice Questions</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl h-[calc(100vh-200px)] flex flex-col">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Worksheet AI Assistant</h3>
                    <p className="text-xs text-gray-400">Ask questions about this worksheet</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Prompts */}
            {suggestedPrompts.length > 0 && chatMessages.length <= 1 && (
              <div className="p-6 border-b border-white/10">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Suggested Questions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="text-left p-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/5 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300 group-hover:text-white transition">{prompt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Ask questions about your worksheet</h3>
                  <p className="text-white-400 text-sm text-center max-w-md mb-6">
                    The AI will analyze "{worksheet?.title}" to provide specific answers based on the content.
                    {documentInfo && ` I can also reference the document: "${documentInfo.title}"`}
                  </p>
                  <div className="text-sm text-gray-500 text-center">
                    <p>Try asking:</p>
                    <ul className="mt-2 space-y-1">
                      <li>"Help me with question 1"</li>
                      <li>"Explain the main concepts"</li>
                      <li>"Give me tips for this worksheet"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                        : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant'
                            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                            : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <Bot className="w-4 h-4 text-purple-400" />
                            ) : (
                              <User className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-white/10 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask a question about "${worksheet?.title}"...`}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition"
                    disabled={chatLoading}
                  />
                  {chatInput && (
                    <button
                      type="button"
                      onClick={() => setChatInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200 disabled:opacity-80"
                >
                  {chatLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send
                    </span>
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2 text-center">
                AI will analyze the worksheet content to answer your questions
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPDFTab = () => {
    if (!worksheet || !worksheet.pdf_document_id) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 mb-4">No PDF document attached to this worksheet</p>
          <p className="text-sm text-gray-500">This worksheet doesn't have a PDF document</p>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">PDF Worksheet</h3>
          {documentInfo && (
            <a
              href={`/documents/${worksheet.pdf_document_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Open Document Details
            </a>
          )}
        </div>
        
        <div className="h-[600px] w-full bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-white/10 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 mb-4">PDF Document: {documentInfo?.title || 'Worksheet PDF'}</p>
            <p className="text-sm text-gray-500 mb-6">
              Download the PDF to complete this worksheet
            </p>
            {documentInfo && (
              <a
                href={`http://localhost:8000/api/documents/${worksheet.pdf_document_id}/file`}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>
    );
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
            <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading worksheet...</p>
          </div>
        </div>
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
        
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 mb-4">Worksheet not found</p>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
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
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(600px at 20% 20%, rgba(168, 85, 247, 0.05), transparent 40%),
                        radial-gradient(600px at 80% 80%, rgba(236, 72, 153, 0.05), transparent 40%)`
          }} />
        </div>
        
        <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-purple-500/10">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/student/dashboard"
                      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Dashboard
                    </Link>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white mt-1">
                    {worksheet.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Time limit: {worksheet.time_limit || 60} minutes
                    </div>
                    {worksheet.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(worksheet.due_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {worksheet.max_score || 100} points
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={saveProgress}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30 transition-all text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">{saved ? 'Saved!' : 'Save Progress'}</span>
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-white text-sm font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 disabled:opacity-50"
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

          {worksheet.description && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10">
              <p className="text-gray-300">{worksheet.description}</p>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="mt-2 mb-2">
            <div className="flex space-x-1">
              {['questions', 'ai', 'pdf'].map((tab) => {
                const tabConfig = {
                  questions: { name: 'Questions', icon: <FileText className="w-4 h-4" /> },
                  ai: { name: 'AI Assistant', icon: <Brain className="w-4 h-4" /> },
                  pdf: { name: 'PDF View', icon: <File className="w-4 h-4" />, condition: worksheet.pdf_document_id }
                };
                
                const config = tabConfig[tab];
                if (tab === 'pdf' && !config.condition) return null;
                
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
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="mt-6">
            {activeTab === 'questions' && renderQuestionsTab()}
            {activeTab === 'ai' && renderAIChatTab()}
            {activeTab === 'pdf' && renderPDFTab()}
          </div>
        </div>
      </main>
    </div>
  );
}