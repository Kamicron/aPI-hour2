import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import DayDetail from './pages/DayDetail';
import Calendar from './pages/Calendar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LegalMention from './pages/LegalMention';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/legal-mention" element={<LegalMention />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/day/:date"
              element={
                <ProtectedRoute>
                  <DayDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}