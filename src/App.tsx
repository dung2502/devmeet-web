import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TokenModal } from './components/TokenModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { MeetingsListPage } from './pages/MeetingsListPage';
import { MeetingDetailPage } from './pages/MeetingDetailPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <ErrorBoundary>
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/meetings" replace />} />
              <Route
                path="/meetings"
                element={
                  <ProtectedRoute>
                    <MeetingsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/meetings/:meetingId"
                element={
                  <ProtectedRoute>
                    <MeetingDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/meetings" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
          <TokenModal />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
