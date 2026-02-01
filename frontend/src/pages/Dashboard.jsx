import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import {
  FileText,
  MessageSquare,
  Users,
  Target,
  BarChart3,
  Clock,
  ChevronRight,
  Zap,
  Shield,
  TrendingUp,
  Upload,
  Brain,
  Lock,
  Globe,
  Star,
  Activity,
  User,
  Search,
  Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI, chatAPI, classAPI } from '../services/api';
import logo from '../assets/logo.png';
import '../dashboard.css';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [timeOfDay, setTimeOfDay] = useState('');
  const [stats, setStats] = useState({
    documents: { value: 0, trend: '0', icon: FileText, color: 'blue' },
    chats: { value: 0, trend: '0', icon: MessageSquare, color: 'purple' },
    classes: { value: 0, trend: '0', icon: Users, color: 'emerald' }
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [chats, setChats] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch documents
      const documentsResponse = await documentAPI.getAll();
      const documentsData = documentsResponse.data?.data || [];
      setDocuments(documentsData);
      const documentsCount = documentsData.length;
      
      // Fetch chats
      const chatsResponse = await chatAPI.getAll();
      const chatsData = Array.isArray(chatsResponse.data) ? chatsResponse.data : [];
      setChats(chatsData);
      const chatsCount = chatsData.length;
      
      // Fetch classes
      const classesResponse = await classAPI.getAll();
      const classesData = Array.isArray(classesResponse.data) ? classesResponse.data : [];
      setClasses(classesData);
      const classesCount = classesData.length;
      
      // Update stats with real data
      setStats({
        documents: { 
          value: documentsCount, 
          trend: '+0', 
          icon: FileText, 
          color: 'blue' 
        },
        chats: { 
          value: chatsCount, 
          trend: '+0', 
          icon: MessageSquare, 
          color: 'purple' 
        },
        classes: { 
          value: classesCount, 
          trend: '+0', 
          icon: Users, 
          color: 'emerald' 
        }
      });
      
      // Generate recent activities from actual data
      generateRecentActivities(documentsData, chatsData, classesData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (documents = [], chats = [], classes = []) => {
    const activities = [];
    const now = new Date();
    
    // Add recent document activities (last 3)
    documents.slice(0, 3).forEach(doc => {
      const docDate = new Date(doc.uploadDate || doc.created_at);
      activities.push({
        id: doc._id || doc.id,
        action: 'Uploaded document',
        title: doc.title || doc.fileName,
        time: formatTimeAgo(docDate),
        icon: FileText,
        color: 'text-blue-400',
        timestamp: docDate
      });
    });
    
    // Add recent chat activities (last 2)
    chats.slice(0, 2).forEach(chat => {
      const chatDate = new Date(chat.created_at || chat.updated_at);
      activities.push({
        id: chat.id,
        action: 'Started chat',
        title: chat.title,
        time: formatTimeAgo(chatDate),
        icon: MessageSquare,
        color: 'text-purple-400',
        timestamp: chatDate
      });
    });
    
    // Add recent class activities (if any)
    classes.slice(0, 2).forEach(cls => {
      const classDate = new Date(cls.created_at);
      activities.push({
        id: cls.id,
        action: user?.role === 'teacher' ? 'Created class' : 'Joined class',
        title: cls.name,
        time: formatTimeAgo(classDate),
        icon: Users,
        color: 'text-emerald-400',
        timestamp: classDate
      });
    });
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Keep only latest 5 activities
    setRecentActivities(activities.slice(0, 5));
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const quickActions = [
    {
      title: 'New Document',
      description: 'Upload study material',
      icon: Upload,
      color: 'blue',
      action: () => navigate('/documents'),
      badge: documents.length > 0 ? `${documents.length} docs` : null
    },
    {
      title: 'AI Chat',
      description: 'Ask your study buddy',
      icon: MessageSquare,
      color: 'purple',
      action: () => navigate('/chat'),
      badge: chats.length > 0 ? `${chats.length} chats` : null
    },
    {
      title: 'Classes',
      description: 'Manage your classes',
      icon: Users,
      color: 'emerald',
      action: () => navigate('/classes'),
      badge: classes.length > 0 ? `${classes.length} classes` : null
    }
  ];

  const learningProgress = [
    { 
      label: 'Documents', 
      progress: Math.min(100, (stats.documents.value / 20) * 100), 
      color: 'from-blue-500 to-cyan-400',
      actual: stats.documents.value
    },
    { 
      label: 'Chat Sessions', 
      progress: Math.min(100, (stats.chats.value / 50) * 100), 
      color: 'from-purple-500 to-pink-400',
      actual: stats.chats.value
    },
    { 
      label: 'Class Engagement', 
      progress: Math.min(100, (stats.classes.value / 10) * 100), 
      color: 'from-emerald-500 to-green-400',
      actual: stats.classes.value
    }
  ];

  const getGradient = (color) => {
    const gradients = {
      blue: 'from-blue-500 to-cyan-400',
      purple: 'from-purple-500 to-pink-400',
      emerald: 'from-emerald-500 to-green-400',
      orange: 'from-orange-500 to-amber-400',
      pink: 'from-pink-500 to-rose-400',
      cyan: 'from-cyan-500 to-blue-400'
    };
    return gradients[color] || gradients.blue;
  };

  const handleRefreshData = () => {
    fetchDashboardData();
  };

  if (loading) {
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
        
        <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your dashboard data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            background: `radial-gradient(600px at 20% 20%, rgba(59, 130, 246, 0.05), transparent 40%),
                        radial-gradient(600px at 80% 80%, rgba(139, 92, 246, 0.05), transparent 40%)`
          }} />
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-8">
          
          {/* ================= HEADER SECTION ================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-blue-500/10">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    Dashboard
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Welcome back, <span className="text-white">{user?.username}</span>! Good {timeOfDay}!
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{documents.filter(d => d.status === 'ready').length}</span> Documents Ready
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{chats.length}</span> Chat Sessions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-xs text-gray-400">
                    <span className="text-white font-medium">{classes.length}</span> Classes
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
            >
              <User className="w-4 h-4" />
              Go to Profile
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <br></br>

          {/* ================= STATS GRID ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats).map(([key, stat]) => {
              const Icon = stat.icon;
              const gradient = getGradient(stat.color);
              
              return (
                <div key={key} className="group bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-6">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${gradient}`}
                        style={{ width: `${Math.min(100, parseInt(stat.value) * 3)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================= QUICK ACTIONS ================= */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Quick Actions
              </h2>
              <div className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                {quickActions.length} actions
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                const gradient = getGradient(action.color);
                
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="group relative bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20"
                    data-tooltip={action.description}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-white mb-1 text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-400">{action.description}</p>
                      
                      {action.badge && (
                        <div className="mt-2 text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-300">
                          {action.badge}
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

         

          {/* ================= FOOTER STATS ================= */}
          <div className="mt-8">
            <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{documents.length}</div>
                  <div className="text-sm text-gray-400">Total Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{chats.length}</div>
                  <div className="text-sm text-gray-400">Chat Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{classes.length}</div>
                  <div className="text-sm text-gray-400">
                    {user?.role === 'teacher' ? 'Classes Created' : 'Classes Joined'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}