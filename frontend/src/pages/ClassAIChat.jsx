import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import {
  Send, User, Bot, Sparkles, Copy, ThumbsUp,
  ThumbsDown, RefreshCw, Zap, Search, Filter,
  BookOpen, Lightbulb, HelpCircle, Brain,
  ChevronRight, Clock, MoreVertical, Download,
  Share2, Maximize2, Minimize2
} from 'lucide-react';

export default function ClassAIChat() {
  const { classId, chatId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatInfo();
    loadMessages();
    loadQuickPrompts();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatInfo = async () => {
    try {
      const response = await chatAPI.getChatInfo(chatId);
      setChatInfo(response.data);
    } catch (error) {
      console.error('Error loading chat info:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await chatAPI.getMessages(chatId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadQuickPrompts = async () => {
    try {
      const response = await chatAPI.getQuickPrompts(chatId);
      setQuickPrompts(response.data);
    } catch (error) {
      console.error('Error loading quick prompts:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content = null) => {
    const messageContent = content || newMessage;
    if (!messageContent.trim()) return;

    setLoading(true);
    
    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      content: messageContent,
      role: user.role,
      sender: user.username,
      is_ai_generated: false,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    if (!content) {
      setNewMessage('');
    }

    try {
      const response = await chatAPI.sendMessage(chatId, {
        content: messageContent,
        use_ai: true
      });

      // Add AI response
      if (response.data.ai_response) {
        const aiMessage = {
          id: Date.now() + 1,
          content: response.data.ai_response,
          role: 'ai',
          sender: 'AI Assistant',
          is_ai_generated: true,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'ai',
        sender: 'AI Assistant',
        is_ai_generated: true,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  const formatMessageContent = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className={`flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {!isFullscreen && (
        <>
          <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
            <Sidebar />
          </div>
          <div className="lg:hidden">
            <Sidebar />
          </div>
        </>
      )}
      
      <main className={`flex-1 ${!isFullscreen ? 'lg:ml-72' : ''} min-h-screen overflow-y-auto`}>
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
          {/* Chat Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-purple-500/10">
                  <Brain className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    {chatInfo?.title || 'Class AI Chat'}
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Ask questions about class materials and get AI-powered explanations
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    AI Assistant is <span className="text-emerald-400">Online</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{messages.length}</span> Messages
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30 transition"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span className="text-sm">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-sm">Fullscreen</span>
                  </>
                )}
              </button>
              
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30 transition">
                <Download className="w-4 h-4" />
                <span className="text-sm">Export Chat</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Quick Prompts Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Quick Prompts
                </h3>
                
                <p className="text-sm text-gray-400 mb-4">
                  Click any prompt below to quickly ask the AI:
                </p>
                
                <div className="space-y-3">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={prompt.id || index}
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="w-full text-left p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 transition group"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                          {prompt.category === 'summary' && <BookOpen className="w-3 h-3 text-purple-400" />}
                          {prompt.category === 'explanation' && <Lightbulb className="w-3 h-3 text-yellow-400" />}
                          {prompt.category === 'quiz' && <HelpCircle className="w-3 h-3 text-blue-400" />}
                          {!['summary', 'explanation', 'quiz'].includes(prompt.category) && 
                            <Sparkles className="w-3 h-3 text-gray-400" />}
                        </div>
                        <span className="text-sm text-gray-300 group-hover:text-white transition">
                          {prompt.text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Tips */}
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tips for Better AI Responses</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                    <span>Be specific with your questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5" />
                    <span>Reference specific worksheets or materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5" />
                    <span>Ask for examples or explanations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5" />
                    <span>Request practice questions or quizzes</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Start a Conversation
                      </h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Ask questions about class materials, request explanations, or use the quick prompts to get started.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-400">AI Assistant is ready to help!</span>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === 'ai' ? 'flex-row' : 'flex-row-reverse'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'ai'
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                            : message.role === 'teacher'
                            ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        }`}>
                          {message.role === 'ai' ? (
                            <Bot className="w-4 h-4 text-white" />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div className={`flex-1 ${message.role === 'ai' ? 'text-left' : 'text-right'}`}>
                          <div className={`inline-block px-4 py-3 rounded-2xl max-w-3xl ${
                            message.role === 'ai'
                              ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-white/10'
                              : message.role === 'teacher'
                              ? 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20'
                              : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-400">
                                {message.sender}
                                {message.role === 'ai' && ' · AI Assistant'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            <div 
                              className="text-white prose prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: formatMessageContent(message.content)
                              }}
                            />
                            
                            {message.role === 'ai' && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                <button
                                  onClick={() => copyToClipboard(message.content)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                                <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition">
                                  <ThumbsUp className="w-3 h-3" />
                                  Helpful
                                </button>
                                <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition">
                                  <ThumbsDown className="w-3 h-3" />
                                  Not Helpful
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-white/10 p-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask a question about class materials..."
                        rows="3"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition resize-none"
                        disabled={loading}
                      />
                      <button
                        type="submit"
                        disabled={loading || !newMessage.trim()}
                        className="absolute right-3 bottom-3 p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>Press Enter to send</span>
                        <span>Shift + Enter for new line</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        <span>AI-powered responses</span>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}