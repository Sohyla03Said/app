import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { Send, Plus, MessageSquare, Loader2, Bot, User, Download, Search, Shield, ChevronRight, X, Trash2, Brain, Zap, FileText, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (currentChat) loadMessages(currentChat.id);
  }, [currentChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const res = await chatAPI.getAll();
      setChats(res.data);
      if (res.data.length > 0 && !currentChat) setCurrentChat(res.data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const res = await chatAPI.getMessages(chatId);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) return;
    try {
      const res = await chatAPI.create({ title: newChatTitle });
      const newChat = res.data;
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
      setMessages([]);
      setNewChatTitle('');
      setIsNewChatModalOpen(false);
    } catch (e) {
      alert('Error creating chat: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;

    const userMessage = input;
    setInput('');

    const tempMsg = { id: Date.now(), role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    setMessages([...messages, tempMsg]);

    setLoading(true);
    try {
      const res = await chatAPI.sendMessage(currentChat.id, userMessage);
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: res.data.ai_response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev.slice(0, -1), tempMsg, aiMsg]);
    } catch (e) {
      alert('Error sending message: ' + (e.response?.data?.detail || e.message));
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleExportChat = async () => {
    if (!currentChat) return;
    try {
      const res = await chatAPI.exportChat(currentChat.id);
      const { content, title } = res.data;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'chat'}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error exporting chat: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleDeleteRequest = (chat, e) => {
    e?.stopPropagation();
    setChatToDelete(chat);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;
    setDeleting(true);
    try {
      // FIXED: Using chatAPI.delete() instead of chatAPI.deleteChat()
      await chatAPI.delete(chatToDelete.id);
      alert(`'${chatToDelete.title}' deleted successfully.`);
      setIsDeleteModalOpen(false);
      setChatToDelete(null);
      
      const updatedChats = chats.filter((c) => c.id !== chatToDelete.id);
      setChats(updatedChats);
      
      if (currentChat?.id === chatToDelete.id) {
        if (updatedChats.length > 0) {
          setCurrentChat(updatedChats[0]);
        } else {
          setCurrentChat(null);
          setMessages([]);
        }
      }
    } catch (error) {
      alert(error.response?.data?.detail || error.message || "Failed to delete chat.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedPrompts = [
    "Explain machine learning like I'm a beginner",
    "Help me study for my biology exam",
    "What's the difference between React and Vue?",
    "Create a study plan for learning Python",
    "Summarize the key points of this week's lecture",
  ];

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
  };

  const renderContent = () => {
    if (loadingChats) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading chats...</p>
          </div>
        </div>
      );
    }

    if (!currentChat) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl text-center max-w-md">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-white/10 shadow-2xl shadow-emerald-500/10">
              <MessageSquare className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              No Chat Selected
            </h3>

            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Select a chat from the sidebar or create a new one to start conversing with your AI study assistant.
            </p>

            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Create New Chat
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col h-155">
        <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-white/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{currentChat.title}</h3>
                <p className="text-sm text-gray-400">
                  Created: {new Date(currentChat.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteRequest(currentChat)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 text-red-300 hover:text-red-400 hover:border-red-500/30 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-400 text-sm text-center max-w-md">
                  Ask questions, request explanations, or explore any topic with your AI assistant.
                </p>
              </div>
            ) : (
              <div>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                        : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10'
                    }`}>
                      <div className="flex items-start gap-3 py-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          msg.role === 'assistant'
                            ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30'
                            : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <Bot className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <User className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full pl-4 pr-12 py-3 rounded-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70
                           backdrop-blur-sm border border-white/10 text-white placeholder-gray-500
                           focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                  disabled={loading}
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400
                         text-white font-medium shadow-lg shadow-emerald-500/30
                         hover:shadow-xl hover:shadow-emerald-500/40
                         transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
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
              Conversations are processed securely
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      {/* Sidebar - Fixed position */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar />
      </div>
      
      {/* Main content - Scrollable */}
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        {/* Background gradient effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(600px at 20% 20%, rgba(16, 185, 129, 0.05), transparent 40%),
                        radial-gradient(600px at 80% 80%, rgba(5, 150, 105, 0.05), transparent 40%)`
          }} />
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-emerald-500/10">
                  <Brain className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    AI Chat
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Chat with your AI study assistant
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{chats.length}</span> Chats
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{messages.length}</span> Total Messages
                  </span>
                </div>
              </div>
              <br></br>
            </div>
            
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              New Chat
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Chat List Sidebar */}
            <div className="lg:w-80 flex flex-col gap-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>

              {/* Chat List */}
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-3 flex flex-col">
  
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Recent Chats
                  </h3>

                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
                    {filteredChats.length} chats
                  </span>
                </div>

                <div className="max-h-[185px] overflow-y-auto pr-2 space-y-2">
                  {loadingChats ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm mt-2">Loading chats...</p>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No chats found</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {searchQuery ? 'Try a different search' : 'Create your first chat!'}
                      </p>
                    </div>
                  ) : (
                    filteredChats.map(chat => (
                      <div
                        key={chat.id}
                        className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-2 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 mb-2"
                      >
                        <div className="flex items-center justify-between">
                          
                          <div
                            onClick={() => setCurrentChat(chat)}
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                          >
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                currentChat?.id === chat.id
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-400'
                                  : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10'
                              }`}
                            >
                              <MessageSquare
                                className={`w-3 h-3 ${
                                  currentChat?.id === chat.id
                                    ? 'text-white'
                                    : 'text-gray-400'
                                }`}
                              />
                            </div>

                            <div className="text-left flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm truncate">
                                {chat.title}
                              </h4>

                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">
                                  {new Date(chat.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDeleteRequest(chat, e)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>


              {/* Quick Prompts */}
              <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Quick Prompts
                </h3>
                <div className="space-y-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <div
                      key={index}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="group cursor-pointer bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm mb-1
                                border border-white/10 rounded-xl p-2
                                hover:border-emerald-500/30 transition-all duration-300
                                hover:shadow-lg hover:shadow-emerald-500/10"
                    >
                      <div className="flex items-center gap-3">
                        
                        {/* Icon */}
                        <div className="w-5 h-5 rounded-xl flex items-center justify-center flex-shrink-0
                                        bg-gradient-to-br from-amber-500/20 to-emerald-400/20
                                        border border-emerald-500/30">
                          <Zap className="w-3 h-3 text-emerald-400" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-xs truncate">
                            {prompt}
                          </h4>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Chat Area */}
            {renderContent()}
          </div>
        </div>
      </main>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            {/* Close button */}
            <button
              onClick={() => setIsNewChatModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-white/10 mb-3">
                <Plus className="w-6 h-6 text-emerald-400" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Create New Chat
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Give your new chat a descriptive title
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">
                  Chat Title
                </label>
                <input
                  type="text"
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  placeholder="e.g., Machine Learning Study Session"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                  autoFocus
                />
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Quick Suggestions
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Study Session", "Homework Help", "Exam Review", "Topic Discussion", "Q&A Session"].map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setNewChatTitle(title)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 text-gray-300 hover:text-white hover:border-emerald-500/30 transition-all text-xs"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={!newChatTitle.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition disabled:opacity-60"
                >
                  Create Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-black/40 p-6">
            {/* Close button */}
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center text-center mb-4">
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
                "{chatToDelete?.title}"
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
                  "Delete Chat"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
