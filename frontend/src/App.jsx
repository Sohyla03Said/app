import './i18n';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useEffect, useState } from 'react';

import Welcome from './pages/WelcomePage'; 
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Classes from './pages/Classes';

// Teacher Components
import TeacherClasses from './pages/TeacherClasses';
import TeacherClassDetail from './pages/TeacherClassDetail';
import WorksheetCreator from './pages/WorksheetCreator';
import TeacherEnrollments from './pages/TeacherEnrollments';
import TeacherMaterials from './pages/TeacherMaterials';
import TeacherWorksheetViewer from './pages/TeacherWorksheetViewer';
import TeacherWorksheetEditor from './pages/TeacherWorksheetEditor';

// Student Components
import StudentClasses from './pages/StudentClasses';
import StudentClassDetail from './pages/StudentClassDetail';
import WorksheetViewer from './pages/WorksheetViewer';
import WorksheetSubmit from './pages/WorksheetSubmit';
import StudentDashboard from './pages/StudentDashboard';

// Shared Components
import ClassAIChat from './pages/ClassAIChat';
import ClassMaterials from './pages/ClassMaterials';
import ClassAnnouncements from './pages/ClassAnnouncements';
import ClassWorksheets from './pages/ClassWorksheets';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (token) setHydrated(true);
  }, [token]);

  if (!hydrated) return null; // wait until store is hydrated
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function TeacherRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  
  if (!user || user.role !== 'teacher') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function StudentRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  
  if (!user || user.role !== 'student') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function App() {
  const theme = useThemeStore((state) => state.theme);
  const { language } = useThemeStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [theme, language]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes - Role-based Dashboard */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            {user?.role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" />
            ) : (
              <Navigate to="/student/dashboard" />
            )}
          </PrivateRoute>
        } />

        {/* Teacher Dashboard & Classes */}
        <Route path="/teacher/dashboard" element={
          <PrivateRoute>
            <TeacherRoute>
              <Dashboard />
            </TeacherRoute>
          </PrivateRoute>
        } />
        
        <Route path="/teacher/classes" element={
          <PrivateRoute>
            <TeacherRoute>
              <TeacherClasses />
            </TeacherRoute>
          </PrivateRoute>
        } />
        
        <Route path="/teacher/classes/:classId" element={
          <PrivateRoute>
            <TeacherRoute>
              <TeacherClassDetail />
            </TeacherRoute>
          </PrivateRoute>
        } />
        
        <Route path="/teacher/classes/:classId/enrollments" element={
          <PrivateRoute>
            <TeacherRoute>
              <TeacherEnrollments />
            </TeacherRoute>
          </PrivateRoute>
        } />
        
        <Route path="/teacher/classes/:classId/materials" element={
          <PrivateRoute>
            <TeacherRoute>
              <TeacherMaterials />
            </TeacherRoute>
          </PrivateRoute>
        } />
        
        <Route path="/teacher/classes/:classId/worksheets/create" element={
          <PrivateRoute>
            <TeacherRoute>
              <WorksheetCreator />
            </TeacherRoute>
          </PrivateRoute>
        } />
        
        {/* New Teacher Worksheet Routes */}
        <Route path="/teacher/worksheets/:worksheetId" element={
          <PrivateRoute>
            <TeacherRoute>
              <TeacherWorksheetViewer />
            </TeacherRoute>
          </PrivateRoute>
        } />
        
        <Route path="/teacher/worksheets/:worksheetId/edit" element={
          <PrivateRoute>
            <TeacherRoute>
              <TeacherWorksheetEditor />
            </TeacherRoute>
          </PrivateRoute>
        } />
        
        <Route path="/teacher/worksheets/:worksheetId/questions" element={
          <PrivateRoute>
            <TeacherRoute>
              <WorksheetCreator isEditingQuestions={true} />
            </TeacherRoute>
          </PrivateRoute>
        } />

        {/* Student Dashboard & Classes */}
        <Route path="/student/dashboard" element={
          <PrivateRoute>
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          </PrivateRoute>
        } />
        
        <Route path="/student/classes" element={
          <PrivateRoute>
            <StudentRoute>
              <StudentClasses />
            </StudentRoute>
          </PrivateRoute>
        } />
        
        <Route path="/student/classes/:classId" element={
          <PrivateRoute>
            <StudentRoute>
              <StudentClassDetail />
            </StudentRoute>
          </PrivateRoute>
        } />
        
        <Route path="/student/worksheets/:worksheetId" element={
          <PrivateRoute>
            <StudentRoute>
              <WorksheetViewer />
            </StudentRoute>
          </PrivateRoute>
        } />
        
        <Route path="/student/worksheets/:worksheetId/submit" element={
          <PrivateRoute>
            <StudentRoute>
              <WorksheetSubmit />
            </StudentRoute>
          </PrivateRoute>
        } />

        {/* Shared Routes (Both Teachers & Students) */}
        <Route path="/classes/:classId" element={
          <PrivateRoute>
            {user?.role === 'teacher' ? (
              <Navigate to={`/teacher/classes/:classId`} />
            ) : (
              <Navigate to={`/student/classes/:classId`} />
            )}
          </PrivateRoute>
        } />
        
        {/* Generic Worksheet Viewer Route */}
        <Route path="/worksheets/:worksheetId" element={
          <PrivateRoute>
            {user?.role === 'teacher' ? (
              <Navigate to={`/teacher/worksheets/:worksheetId`} />
            ) : (
              <Navigate to={`/student/worksheets/:worksheetId`} />
            )}
          </PrivateRoute>
        } />
        
        <Route path="/classes/:classId/chat" element={
          <PrivateRoute>
            <ClassAIChat />
          </PrivateRoute>
        } />
        
        <Route path="/classes/:classId/chat/:chatId" element={
          <PrivateRoute>
            <ClassAIChat />
          </PrivateRoute>
        } />
        
        <Route path="/classes/:classId/materials" element={
          <PrivateRoute>
            <ClassMaterials />
          </PrivateRoute>
        } />
        
        <Route path="/classes/:classId/announcements" element={
          <PrivateRoute>
            <ClassAnnouncements />
          </PrivateRoute>
        } />
        
        <Route path="/classes/:classId/worksheets" element={
          <PrivateRoute>
            <ClassWorksheets />
          </PrivateRoute>
        } />

        {/* Existing Routes (Keep for backward compatibility) */}
        <Route path="/documents" element={
          <PrivateRoute><Documents /></PrivateRoute>
        } />
        
        <Route path="/documents/:id" element={
          <PrivateRoute><DocumentDetail /></PrivateRoute>
        } />
        
        <Route path="/chat" element={
          <PrivateRoute><Chat /></PrivateRoute>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />

        {/* Legacy Classes Route (Redirect based on role) */}
        <Route path="/classes" element={
          <PrivateRoute>
            {user?.role === 'teacher' ? (
              <Navigate to="/teacher/classes" />
            ) : (
              <Navigate to="/student/classes" />
            )}
          </PrivateRoute>
        } />

        {/* 404 Route */}
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">404</h1>
              <p className="text-gray-400 mb-6">Page not found</p>
              <a 
                href="/dashboard" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
