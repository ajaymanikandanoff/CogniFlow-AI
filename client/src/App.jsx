import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import AICoachPanel from './components/AICoachPanel';
import { Menu, Brain, Plus } from 'lucide-react';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SubjectsPage from './pages/SubjectsPage';
import SyllabusUploadPage from './pages/SyllabusUploadPage';
import StudyPlanPage from './pages/StudyPlanPage';
import RevisionPage from './pages/RevisionPage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
        <div className="flex items-center gap-2">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPublic = ['/', '/login', '/signup'].includes(location.pathname);

  if (isPublic || !user) {
    return (
      <div className="min-h-screen relative flex flex-col font-sans transition-colors duration-200" style={{ background: 'var(--bg)' }}>
        <main className="flex-1">
          <AppRoutes />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: 'var(--bg)' }}>
      {/* Sidebar - fixed on desktop, slide drawer on mobile */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[230px] transition-all duration-200">
        {/* Mobile Header */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30 backdrop-blur-xl"
          style={{ background: 'rgba(16, 16, 24, 0.85)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-xl text-xs"
              style={{ color: 'var(--t1)', border: '1px solid var(--line)', background: 'var(--bg-3)' }}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--p)' }}>
                <Brain size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--t1)' }}>CogniFlow</span>
            </Link>
          </div>

          <Link
            to="/subjects"
            className="btn btn-primary btn-sm text-xs gap-1.5 py-1 px-2.5 rounded-lg"
          >
            <Plus size={13} />
            <span>Subject</span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10 max-w-7xl w-full mx-auto relative z-10">
          <AppRoutes />
        </main>
      </div>

      {/* Mobile Bottom Navigation for phone thumb navigation */}
      <MobileBottomNav />

      {/* Floating AI Coach (bottom right popup) */}
      <AICoachPanel />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected Routes */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subjects"
        element={
          <ProtectedRoute>
            <SubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/syllabus-upload"
        element={
          <ProtectedRoute>
            <SyllabusUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-plan"
        element={
          <ProtectedRoute>
            <StudyPlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/revision"
        element={
          <ProtectedRoute>
            <RevisionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
