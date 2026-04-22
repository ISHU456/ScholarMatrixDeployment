import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from './features/auth/authSlice';
import axios from 'axios';

// Layout
import Navbar from './components/Navbar';
import FluidBackground from './components/FluidBackground';
import AchievementToaster from './components/AchievementToaster';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import ScrollToTop from './components/ScrollToTop';
import LockedOverlay from './components/LockedOverlay';
import GlobalAlertMarquee from './components/GlobalAlertMarquee';
import SplashScreen from './components/SplashScreen';
import { AnimatePresence, motion } from 'framer-motion';

// Auth pages
import Login from './pages/auth/Login';
import RoleLogin from './pages/auth/RoleLogin';
import WaitingAuthorization from './pages/auth/WaitingAuthorization';

// Dashboard pages
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import FacultyDashboard from './pages/dashboards/FacultyDashboard';
import HODDashboard from './pages/dashboards/HODDashboard';

// Course pages
import Courses from './pages/courses/Courses';
import CourseDetail from './pages/courses/CourseDetail';
import UploadCenter from './pages/courses/UploadCenter';
import QuickSchedulePage from './pages/courses/schedule/QuickSchedulePage';

// Announcements
import Announcements from './pages/announcements/Announcements';

// Live
import LiveClass from './pages/live/LiveClass';

// General pages
import Home from './pages/general/Home';
import Profile from './pages/general/Profile';
import AITutor from './pages/general/AITutor';
import AIMode from './pages/general/AIMode';
import DepartmentSelection from './pages/general/DepartmentSelection';
import Departments from './pages/general/Departments';
import DepartmentDetail from './pages/departments/DepartmentDetail';
import Assignments from './pages/general/Assignments';

// Admin pages
import AdminAiManagement from './pages/admin/AdminAiManagement';
import AdminUserAiDetail from './pages/admin/AdminUserAiDetail';

// Student / Gamified pages
import QuizArena from './components/student/QuizArena';
import MasterArena from './pages/student/MasterArena';
import SessionTracker from './components/student/SessionTracker';
import QuizArenaPage from './pages/student/QuizArenaPage';
import QuizArenaHub from './pages/student/QuizArenaHub';
import RewardStore from './pages/student/RewardStore';

// Result pages
import ResultEntry from './pages/results/ResultEntry';
import ResultVerification from './pages/results/ResultVerification';
import StudentResults from './pages/results/StudentResults';
import ResultsAnalytics from './pages/results/ResultsAnalytics';


import NotificationListener from './components/NotificationListener';
import { MFAProvider } from './modules/mfa/MFAContext';
import MFAVerify from './pages/auth/MFAVerify';
import FaceRegistrationPage from './pages/auth/FaceRegistrationPage';
import SelfAttendance from './pages/attendance/SelfAttendance';
import DailyAttendance from './pages/attendance/DailyAttendance';
import GPSConfigPage from './pages/admin/GPSConfigPage';

// Protected Route Component for Role-based Access Control
const ProtectedRoute = ({ children, allowedRoles, checkDept = true }) => {
  const { user } = useSelector((state) => state.auth);
  const selectedDept = JSON.parse(localStorage.getItem('selectedDepartment'));

  if (!user) {
    return <LockedOverlay />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <LockedOverlay 
        title="Unauthorized Access" 
        message="You do not have permission to access this page." 
      />
    );
  }

  // Redirect to face registration for students, admins, and teachers if not yet done
  if ((user.role === 'student' || user.role === 'admin' || user.role === 'teacher') && !user.faceRegistered) {
     const currentPath = window.location.pathname;
     if (currentPath !== '/face-registration' && !currentPath.includes('/login') && currentPath !== '/' && currentPath !== '/waiting-authorization') {
        return <Navigate to="/face-registration" replace />;
     }
  }

  // Handle Teacher Authorization Redirect
  if (user.role === 'teacher' && user.isAuthorized === false) {
    if (window.location.pathname !== '/waiting-authorization') {
      return <Navigate to="/waiting-authorization" replace />;
    }
  }

  // Redirect to department selection if not admin and department not selected in DB and localStorage
  const hasDepartment = user.department || selectedDept;

  if (checkDept && user.role !== 'admin' && !hasDepartment) {
    return <Navigate to="/select-department" replace />;
  }

  return children;
};

// Wrapper for Footer visibility logic
const AppContent = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isAIMode = location.pathname === '/ai-mode';
  const { user } = useSelector((state) => state.auth);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Advanced loading logic: Wait for window load AND a minimum cinematic delay
    const handleLoad = () => {
      // Small additional delay after load for smooth entry
      setIsInitializing(false);
    };

    if (document.readyState === 'complete') {
      // Short delay for branding, then enter
      const timer = setTimeout(() => setIsInitializing(false), 400);
      return () => clearTimeout(timer);
    } else {
      window.addEventListener('load', handleLoad);
      // Fallback timer in case load event takes too long
      const fallback = setTimeout(() => setIsInitializing(false), 5000);
      return () => {
        window.removeEventListener('load', handleLoad);
        clearTimeout(fallback);
      };
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync department from user profile to localStorage if missing
  // CORE PROFILE SYNC: Ensures profile photo and details are fresh on every session
  useEffect(() => {
    const fetchAndSyncProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/auth/profile`, config);
        
        if (res.data) {
          dispatch(updateProfile(res.data));
          
          // Sync department if missing in localStorage
          const storedDept = localStorage.getItem('selectedDepartment');
          if (!storedDept && res.data.department) {
            const dRes = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/departments`);
            const dept = dRes.data.find(d => d.code === res.data.department);
            if (dept) {
              localStorage.setItem('selectedDepartment', JSON.stringify(dept));
              window.dispatchEvent(new CustomEvent('scholarmatrix:department_selected', { detail: dept }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync definitive profile', err);
      }
    };

    if (user?.token) {
      fetchAndSyncProfile();
    }
  }, [user?.token, dispatch]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/public/settings`);
        setSettings(data);
      } catch (err) {
        console.error("Failed to load global settings.");
      }
    };
    fetchSettings();
  }, []);

  if (settings?.maintenanceMode && user?.role !== 'admin') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#030712] text-white p-10 text-center">
        <div className="w-24 h-24 rounded-[32px] bg-red-600/10 text-red-600 flex items-center justify-center shadow-2xl shadow-red-600/20 mb-10 border border-red-500/20">
          <Shield size={48} className="animate-pulse" />
        </div>
        <h1 className="text-5xl font-semibold uppercase tracking-tighter mb-4 italic">System Under Maintenance</h1>
        <p className="text-slate-500 max-w-lg uppercase text-xs font-bold tracking-[0.2em] leading-loose mb-12">
          The institutional core is currently undergoing synchronization. All non-essential nodes are restricted. 
          Access is reserved for level 5 administrators.
        </p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="px-8 py-4 bg-white text-black rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          Administrator Portal
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#030712] transition-colors duration-300 overflow-hidden">
        <div className="flex flex-col h-full">
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <GlobalAlertMarquee />
      <SessionTracker />
      <main className="flex-grow flex flex-col relative w-full overflow-y-auto smooth-scroll min-h-0 bg-transparent gpu-accelerated">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/:roleType" element={<RoleLogin />} />
          
          <Route path="/select-department" element={
            <ProtectedRoute checkDept={false}>
              <DepartmentSelection />
            </ProtectedRoute>
          } />
          <Route path="/departments" element={<Departments />} />
          <Route path="/department/:code" element={<DepartmentDetail />} />
          <Route path="/courses" element={
            <ProtectedRoute checkDept={false}>
              <Courses />
            </ProtectedRoute>
          } />
          <Route path="/course-inner/:courseId" element={
            <ProtectedRoute>
               <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/courses/:courseId/upload" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin', 'hod']}>
               <UploadCenter />
            </ProtectedRoute>
          } />
          <Route path="/courses/:courseId/quick-schedule" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin', 'hod']}>
               <QuickSchedulePage />
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute checkDept={false}>
              <Announcements />
            </ProtectedRoute>
          } />

          {/* Secure Isolated Dashboards */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'hod']}>
              <AdminDashboard /> 
            </ProtectedRoute>
          } />
          <Route path="/admin/ai-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAiManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/ai-user/:userId" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUserAiDetail />
            </ProtectedRoute>
          } />

          <Route path="/faculty-dashboard" element={
            <ProtectedRoute allowedRoles={['teacher', 'hod']}>
              <FacultyDashboard /> 
            </ProtectedRoute>
          } />

          <Route path="/hod-dashboard" element={
            <ProtectedRoute allowedRoles={['hod']}>
              <HODDashboard /> 
            </ProtectedRoute>
          } />


          {/* Universal Protected Live Class Route */}
          <Route path="/live-class/:classId" element={
            <ProtectedRoute>
              <LiveClass />
            </ProtectedRoute>
          } />

          <Route path="/assignments" element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          } />
          <Route path="/quiz-arena/:quizId" element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <QuizArenaPage />
            </ProtectedRoute>
          } />
          <Route path="/quiz-arena-hub" element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <QuizArenaHub />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/master-arena" element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <MasterArena />
            </ProtectedRoute>
          } />

          <Route path="/reward-store" element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <RewardStore />
            </ProtectedRoute>
          } />






          
          <Route path="/ai-tutor" element={
            <ProtectedRoute>
              <AITutor />
            </ProtectedRoute>
          } />
          
          <Route path="/ai-mode" element={
            <ProtectedRoute checkDept={false}>
              <AIMode />
            </ProtectedRoute>
          } />
          
          <Route path="/results/entry" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin', 'hod']}>
              <ResultEntry />
            </ProtectedRoute>
          } />

          <Route path="/results/verify" element={
            <ProtectedRoute allowedRoles={['admin', 'hod']}>
              <ResultVerification />
            </ProtectedRoute>
          } />

          <Route path="/results/my" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentResults />
            </ProtectedRoute>
          } />

          <Route path="/results/analytics" element={
            <ProtectedRoute allowedRoles={['admin', 'hod']}>
              <ResultsAnalytics />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
             <div className="flex-1 flex items-center justify-center">
               <h1 className="text-3xl font-bold uppercase">
403 - Unauthorized Access</h1>
             </div>
          } />
           <Route path="/waiting-authorization" element={
            <ProtectedRoute checkDept={false}>
              <WaitingAuthorization />
            </ProtectedRoute>
          } />
          <Route path="/verify-mfa" element={<MFAVerify />} />
          <Route path="/face-registration" element={
            <ProtectedRoute checkDept={false}>
              <FaceRegistrationPage />
            </ProtectedRoute>
          } />
          <Route path="/self-attendance/:courseId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <SelfAttendance />
            </ProtectedRoute>
          } />
          <Route path="/daily-attendance" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DailyAttendance />
            </ProtectedRoute>
          } />
          <Route path="/admin/gps-config" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <GPSConfigPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {!isAIMode && <Footer />}
      <NotificationListener />
          <AchievementToaster />
          {!isAIMode && <Chatbot />}
        </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <MFAProvider>
        <ScrollToTop />
        <FluidBackground />
        <AppContent />
      </MFAProvider>
    </Router>
  );
}

export default App;
