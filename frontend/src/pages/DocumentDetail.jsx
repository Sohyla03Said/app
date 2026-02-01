import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentAPI, aiAPI, chatAPI } from '../services/api';
import { 
  ArrowLeft, ExternalLink, MessageSquare, FileText, Brain, 
  Download, Calendar, File, FileIcon, Bot, Send, Loader2,
  Sparkles, Zap, User, X, Lightbulb, Hash,
  Maximize2, Minimize2, CheckCircle, Trash2, ChevronRight,
  Eye, Shield, Search, Plus, Clock, AlertCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function DocumentDetail() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('viewer');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtractingKeyPoints, setIsExtractingKeyPoints] = useState(false);
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadDocument();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (document && activeTab === 'viewer') {
      loadPdf();
    }
  }, [document, activeTab]);

  const loadDocument = async () => {
    try {
      const response = await documentAPI.getById(id);
      if (response.data.success) {
        setDocument(response.data.data);
        if (response.data.data.summary) {
          setSummary(response.data.data.summary);
        }
        generateSuggestedPrompts(response.data.data.title);
        loadOrCreateChat(response.data.data.title);
      } else {
        alert('Failed to load document');
      }
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadOrCreateChat = async (title) => {
    try {
      const chatsResponse = await chatAPI.getAll();
      const existingChat = chatsResponse.data.find(
        chat => chat.document_id === parseInt(id)
      );

      if (existingChat) {
        setCurrentChatId(existingChat.id);
        loadChatMessages(existingChat.id);
      } else {
        const chatResponse = await chatAPI.createWithDocument(id, `Chat: ${title}`);
        setCurrentChatId(chatResponse.data.id);
      }
    } catch (error) {
      console.error('Error loading/creating chat:', error);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const response = await chatAPI.getMessages(chatId, 50);
      const formattedMessages = response.data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      setChatMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const loadPdf = async () => {
    if (!document || pdfLoading) return;
    
    setPdfLoading(true);
    try {
      const response = await documentAPI.getFile(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
      const fallbackUrl = getDirectPdfUrl();
      setPdfUrl(fallbackUrl);
    } finally {
      setPdfLoading(false);
    }
  };

  const getDirectPdfUrl = () => {
    if (!document?.filePath) return null;
    const filePath = document.filePath;

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    if (filePath.startsWith('data/documents/')) {
      const pathParts = filePath.split('/');
      if (pathParts.length >= 4) {
        const userId = pathParts[2];
        const fileName = pathParts.slice(3).join('/');
        return `http://localhost:8000/static/documents/${userId}/${fileName}`;
      }
    }

    return `http://localhost:8000/api/documents/${id}/file`;
  };

  const generateSuggestedPrompts = async (title) => {
    try {
      const prompts = [
        `Summarize the main points of "${title}"`,
        `What are the key takeaways from "${title}"?`,
        `Explain the most important concepts in "${title}"`,
        `What evidence supports the arguments in "${title}"?`,
        `Break down the complex ideas in "${title}" into simple terms`,
        `What questions does "${title}" raise or answer?`,
        `How can I apply the concepts from "${title}" in practice?`,
        `What are the main arguments in "${title}"?`
      ];
      setSuggestedPrompts(prompts);
    } catch (error) {
      console.error('Error generating prompts:', error);
    }
  };

  const handleSummarize = async () => {
    if (!document || isSummarizing) return;
    
    setIsSummarizing(true);
    try {
      const response = await aiAPI.summarize(id, 'detailed');
      if (response.data.success) {
        setSummary(response.data.summary);
        
        const summaryMessage = {
          id: Date.now(),
          role: 'assistant',
          content: `**Document Summary**\n\n${response.data.summary}`,
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, summaryMessage]);
      } else {
        throw new Error(response.data.detail || 'Summarization failed');
      }
    } catch (error) {
      console.error('Error summarizing document:', error);
      alert(error.response?.data?.detail || error.message || 'Failed to summarize document');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExtractKeyPoints = async () => {
    if (!document || isExtractingKeyPoints) return;
    
    setIsExtractingKeyPoints(true);
    try {
      const response = await aiAPI.summarize(id, 'key_points');
      if (response.data.success) {
        setKeyPoints(response.data.summary);
        
        const keyPointsMessage = {
          id: Date.now(),
          role: 'assistant',
          content: `**Key Points from "${document.title}"**\n\n${response.data.summary}`,
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, keyPointsMessage]);
      } else {
        throw new Error(response.data.detail || 'Key points extraction failed');
      }
    } catch (error) {
      console.error('Error extracting key points:', error);
      alert(error.response?.data?.detail || error.message || 'Failed to extract key points');
    } finally {
      setIsExtractingKeyPoints(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setChatInput(prompt);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
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
      if (currentChatId) {
        const response = await chatAPI.sendMessage(currentChatId, userMessage);
        
        if (response.data.ai_response) {
          const aiMsg = { 
            id: Date.now() + 1, 
            role: 'assistant', 
            content: response.data.ai_response, 
            timestamp: new Date().toISOString() 
          };
          setChatMessages(prev => [...prev, aiMsg]);
        }
      } else {
        setTimeout(() => {
          const aiMsg = { 
            id: Date.now() + 1, 
            role: 'assistant', 
            content: `Based on the document "${document?.title}", I can answer your question: "${userMessage}"\n\n*(This is a simulated response. Real AI would analyze the PDF content to provide specific answers.)*`, 
            timestamp: new Date().toISOString() 
          };
          setChatMessages(prev => [...prev, aiMsg]);
        }, 1500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setTimeout(() => {
        const aiMsg = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: `I received your question about "${document?.title}": "${userMessage}"\n\n*(AI service temporarily unavailable - analyzing PDF content would provide specific answers)*`, 
          timestamp: new Date().toISOString() 
        };
        setChatMessages(prev => [...prev, aiMsg]);
      }, 1000);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportChat = () => {
    if (chatMessages.length === 0) {
      alert('No messages to export');
      return;
    }

    const chatContent = `Chat about: ${document?.title}\n\n` +
      chatMessages.map(msg => 
        `${new Date(msg.timestamp).toLocaleString()} [${msg.role.toUpperCase()}]:\n${msg.content}\n\n`
      ).join('---\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_${document?.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderPDFViewer = () => {
    if (loading || pdfLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading PDF viewer...</p>
          </div>
        </div>
      );
    }

    if (!document || !pdfUrl) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl text-center max-w-md">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 shadow-2xl shadow-blue-500/10">
              <FileText className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Document Not Available
            </h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              The document could not be loaded. Please try again or contact support.
            </p>
            <button 
              onClick={loadPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
            >
              Try Loading Again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <div className={`bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-white">Document Viewer</span>
                <p className="text-xs text-gray-400">Viewing: {document.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
            </div>
          </div>
          
          <div className={`bg-gradient-to-br from-gray-900 to-gray-950 ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[75vh]'}`}>
            <iframe
              src={pdfUrl}
              className="w-full h-full bg-transparent"
              title="PDF Viewer"
              frameBorder="0"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderAIAssistantTab = () => {
    const aiTools = [
      {
        id: 'summarize',
        name: 'Summarize',
        description: 'Get comprehensive summary',
        icon: <FileText className="w-4 h-4" />,
        color: 'from-blue-500 to-cyan-400',
        action: handleSummarize,
        loading: isSummarizing
      },
      {
        id: 'keyPoints',
        name: 'Key Points',
        description: 'Extract main ideas',
        icon: <Hash className="w-4 h-4" />,
        color: 'from-emerald-500 to-green-400',
        action: handleExtractKeyPoints,
        loading: isExtractingKeyPoints
      }
    ];

    return (
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Document Info & AI Tools */}
          <div className="lg:col-span-1 space-y-6">
            {/* Document Info Card */}
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${
                    document?.status === 'ready' 
                      ? 'from-purple-500/10 to-purple-500/10 border border-purple-500/20' 
                      : document?.status === 'processing'
                      ? 'from-purple-500/10 to-purple-500/10 border border-purple-500/20'
                      : 'from-purple-500/10 to-purple-500/10 border border-purple-500/20'
                  }`}>
                    <FileIcon className={`w-5 h-5 ${
                      document?.status === 'ready' 
                        ? 'text-purple-400' 
                        : document?.status === 'processing'
                        ? 'text-purple-400'
                        : 'text-purple-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm truncate max-w-[180px]">
                      {document?.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {new Date(document?.uploadDate).toLocaleDateString()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {document?.fileType?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white font-medium">{(document?.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded-2xl text-xs ${
                    document?.status === 'ready' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : document?.status === 'processing'
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {document?.status?.charAt(0).toUpperCase() + document?.status?.slice(1)}
                  </span>
                </div>
                
                {summary && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-xs text-gray-400 line-clamp-2">{summary}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <a
                  href={pdfUrl || getDirectPdfUrl()}
                  download={`${document?.title}.pdf`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-pink-500/50 transition-all text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Document
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </a>
              </div>
            </div>
            <br></br>

            {/* AI Tools Card */}
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Tools</h3>
                  <p className="text-xs text-gray-400">Process document content</p>
                </div>
              </div>

              {/* Tools */}
              <div className="flex flex-col gap-4">
                {aiTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={tool.action}
                    disabled={tool.loading}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl
                      bg-transparent
                      border border-white/10
                      transition-all
                      hover:border-blue-500/40
                      hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10
                      ${
                        tool.loading
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:shadow-lg hover:shadow-blue-500/10'
                      }
                    `}
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color}
                        border border-white/10 flex items-center justify-center`}
                    >
                      {tool.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-medium text-white">
                        {tool.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {tool.description}
                      </p>
                    </div>

                    {/* Right */}
                    {tool.loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl h-124 flex flex-col">
              
              {/* Chat Header */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                      <p className="text-xs text-gray-400">Chat about: {document?.title}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested Prompts */}
              {suggestedPrompts.length > 0 && chatMessages.length === 0 && (
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
                        className="text-left p-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
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
                      <Bot className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Ask questions about your document</h3>
                    <p className="text-white-400 text-sm text-center max-w-md mb-6">
                      The AI will analyze "{document?.title}" to provide specific answers based on the content.
                    </p>
                  </div>
                ) : (
                  <div>
                    {chatMessages.map(msg => (
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
                                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                                : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                            }`}>
                              {msg.role === 'assistant' ? (
                                <Bot className="w-4 h-4 text-purple-400" />
                              ) : (
                                <User className="w-4 h-4 text-blue-400" />
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
              <div className="border-t border-white/10 p-3">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Ask a question about "${document?.title}"...`}
                      className="w-full pl-4 pr-12 py-3 rounded-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
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
                  AI will analyze the PDF content to answer your questions
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  };

  const tabs = [
    { 
      id: 'viewer', 
      name: 'PDF Viewer', 
      icon: <FileText className="w-4 h-4" />,
      content: renderPDFViewer()
    },
    { 
      id: 'ai', 
      name: 'AI Assistant', 
      icon: <Brain className="w-4 h-4" />,
      content: renderAIAssistantTab()
    }
  ];

  if (loading && !document) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
          <Sidebar />
        </div>
        <div className="lg:hidden">
          <Sidebar />
        </div>
        <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading document details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
          <Sidebar />
        </div>
        <div className="lg:hidden">
          <Sidebar />
        </div>
        <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto p-8">
          <div className="flex items-center justify-center py-20">
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl text-center max-w-md">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 shadow-2xl shadow-blue-500/10">
                <FileIcon className="w-7 h-7 text-purple-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Document Not Found
              </h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                The document you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Documents
              </Link>
            </div>
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
      <main className={`flex-1 ${isFullscreen ? 'lg:ml-0' : 'lg:ml-72'} min-h-screen overflow-y-auto transition-all duration-300`}>
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-purple-500/10">
                  <FileIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/documents"
                      className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Documents
                    </Link>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white mt-1">
                    {document.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <File className="w-4 h-4" />
                      Size: {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href={pdfUrl || getDirectPdfUrl()}
                download={`${document.title}.pdf`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>


{/* Tabs Navigation */}
<div className="mt-2 mb-2"> 
  <div className="flex space-x-1">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`
          flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
          relative rounded-t-2xl
          ${activeTab === tab.id 
            ? 'text-white bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 border-b-0 shadow-lg' 
            : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-800/50 hover:to-gray-900/50 hover:backdrop-blur-sm border border-transparent hover:border-white/5'
          }
        `}
      >
        {tab.icon}
        {tab.name}
        {activeTab === tab.id && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
        )}
      </button>
    ))}
  </div>
</div>

          {/* Active Tab Content */}
          <div className="mt-6">
            {tabs.find(tab => tab.id === activeTab)?.content}
          </div>
        </div>
      </main>
    </div>
  );
}