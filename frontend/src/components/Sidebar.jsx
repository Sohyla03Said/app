import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Book,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Shield,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/logo.png';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [mobileOpen, setMobileOpen] = useState(false);

  // Updated isActive function to handle different route patterns
  const isActive = (path) => {
    const currentPath = location.pathname;
    
    // Handle dashboard routes (could be /, /dashboard, /teacher/dashboard, /student/dashboard)
    if (path === '/dashboard') {
      return currentPath === '/' || 
             currentPath.startsWith('/dashboard') ||
             currentPath.startsWith('/teacher/dashboard') ||
             currentPath.startsWith('/student/dashboard');
    }
    
    // Special handling for classes since it has multiple route patterns
    if (path === '/classes') {
      return currentPath.startsWith('/classes') || 
             currentPath.startsWith('/teacher/classes') || 
             currentPath.startsWith('/student/classes');
    }
    
    // Special handling for chat (if you have different chat routes)
    if (path === '/chat') {
      return currentPath.startsWith('/chat');
    }
    
    // Special handling for documents
    if (path === '/documents') {
      return currentPath.startsWith('/documents');
    }
    
    // For other routes, check if current path starts with the route
    return currentPath.startsWith(path);
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: 'blue' },
    { label: 'Documents', icon: FileText, path: '/documents', color: 'purple' },
    { label: 'AI Chat', icon: MessageSquare, path: '/chat', color: 'emerald' },
    { label: 'Classes', icon: Book, path: '/classes', color: 'orange' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const handleNavigation = (path) => {
    // Navigate to appropriate route based on user role and path
    if (path === '/dashboard') {
      // Go to the main dashboard or role-specific dashboard
      if (user?.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (user?.role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/dashboard'); // fallback
      }
    } else if (path === '/classes') {
      // Navigate to appropriate class route based on user role
      if (user?.role === 'teacher') {
        navigate('/teacher/classes');
      } else if (user?.role === 'student') {
        navigate('/student/classes');
      } else {
        navigate('/classes'); // fallback
      }
    } else {
      navigate(path);
    }
    setMobileOpen(false);
  };

  const getGradient = (color) => {
    const gradients = {
      blue: 'from-blue-500 to-cyan-400',
      purple: 'from-purple-500 to-pink-400',
      emerald: 'from-emerald-500 to-green-400',
      orange: 'from-orange-500 to-amber-400',
    };
    return gradients[color] || gradients.blue;
  };

  // Color & shadow classes for menu items
  const getColorClasses = (color, active) => {
    const classes = {
      blue: {
        text: active ? 'text-white' : 'text-gray-400',
        iconText: active ? 'text-white' : 'text-gray-400',
        shadow: active ? 'shadow-xl shadow-blue-500/30' : 'shadow-md shadow-black/20',
        hoverShadow: 'hover:shadow-xl hover:shadow-blue-500/20',
        iconShadow: active ? 'shadow-lg shadow-blue-500/30' : ''
      },
      purple: {
        text: active ? 'text-white' : 'text-gray-400',
        iconText: active ? 'text-white' : 'text-gray-400',
        shadow: active ? 'shadow-xl shadow-purple-500/30' : 'shadow-md shadow-black/20',
        hoverShadow: 'hover:shadow-xl hover:shadow-purple-500/20',
        iconShadow: active ? 'shadow-lg shadow-purple-500/30' : ''
      },
      emerald: {
        text: active ? 'text-white' : 'text-gray-400',
        iconText: active ? 'text-white' : 'text-gray-400',
        shadow: active ? 'shadow-xl shadow-emerald-500/30' : 'shadow-md shadow-black/20',
        hoverShadow: 'hover:shadow-xl hover:shadow-emerald-500/20',
        iconShadow: active ? 'shadow-lg shadow-emerald-500/30' : ''
      },
      orange: {
        text: active ? 'text-white' : 'text-gray-400',
        iconText: active ? 'text-white' : 'text-gray-400',
        shadow: active ? 'shadow-xl shadow-orange-500/30' : 'shadow-md shadow-black/20',
        hoverShadow: 'hover:shadow-xl hover:shadow-orange-500/20',
        iconShadow: active ? 'shadow-lg shadow-orange-500/30' : ''
      },
    };
    return classes[color] || classes.blue;
  };

  // Glass style base class
  const glass = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl";

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm shadow-lg hover:border-white/20 transition-all"
      >
        {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:fixed h-screen w-72 flex flex-col gap-4 p-4
                    transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${glass} rounded-tr-3xl rounded-br-3xl z-30`}
        style={{ height: '100vh' }}
      >
        {/* Branding */}
        <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center gap-3 hover:shadow-xl hover:shadow-blue-500/20 transition-all">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 shadow-2xl shadow-blue-500/10">
              <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center animate-pulse shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">StudyBuddy AI</h1>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <Shield className="w-3 h-3 text-emerald-400" />
              Local & Secure
            </div>
          </div>
        </div>

        {/* User Profile */}
        <button
          onClick={() => handleNavigation('/profile')}
          className={`${glass} rounded-2xl p-4 flex items-center gap-3 hover:shadow-blue-500/20 transition-all`}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-sm">{user?.username || 'User'}</p>
            <p className="text-gray-400 text-xs">{user?.role === 'teacher' ? 'Educator Pro' : 'Student Premium'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>

        {/* Navigation */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const gradient = getGradient(item.color);
            const colorClasses = getColorClasses(item.color, active);

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`${glass} rounded-2xl p-3 flex items-center gap-3 transition-all ${colorClasses.hoverShadow} ${colorClasses.shadow}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    active ? `bg-gradient-to-br ${gradient} ${colorClasses.iconShadow}` : 'bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${colorClasses.iconText}`} />
                </div>
                <span className={`text-sm font-medium ${colorClasses.text}`}>
                  {item.label}
                </span>
                {active && <ChevronRight className="ml-auto w-4 h-4 text-blue-400" />}
              </button>
            );
          })}
        </div>

        {/* Logout & AI Status */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className={`${glass} rounded-2xl p-3 flex items-center gap-3 hover:shadow-red-500/20 transition-all`}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shadow-sm">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-red-400 text-sm font-medium">Logout</span>
          </button>

          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-3 flex items-center justify-between hover:shadow-xl hover:shadow-emerald-500/20 transition-all">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <div>
                <p className="text-emerald-400 text-xs font-semibold">AI Engine</p>
                <p className="text-gray-400 text-xs">Running locally</p>
              </div>
            </div>
            <Shield className="w-4 h-4 text-emerald-400/60" />
          </div>
        </div>
      </aside>
    </>
  );
}