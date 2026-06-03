import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Páginas
import HomePage from './pages/index';
import LoginPage from './pages/login';
import AceptarInvitacionPage from './pages/aceptar-invitacion';
import DashboardPage from './pages/dashboard';
import CasosPage from './pages/casos/index';
import CasoFormPage from './pages/casos/new';
import CasoDetailPage from './pages/casos/[id]';
import JuiciosPage from './pages/juicios/index';
import JuicioFormPage from './pages/juicios/new';
import JuicioDetailPage from './pages/juicios/[id]';
import AdminPage from './pages/admin/index';

// Componente protegido
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <div className="loading">Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/aceptar-invitacion" element={<AceptarInvitacionPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/casos"
        element={
          <ProtectedRoute>
            <CasosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/casos/new"
        element={
          <ProtectedRoute>
            <CasoFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/casos/:id"
        element={
          <ProtectedRoute>
            <CasoDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/casos/:id/edit"
        element={
          <ProtectedRoute>
            <CasoFormPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/juicios"
        element={
          <ProtectedRoute>
            <JuiciosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/juicios/new"
        element={
          <ProtectedRoute>
            <JuicioFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/juicios/:id"
        element={
          <ProtectedRoute>
            <JuicioDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/juicios/:id/edit"
        element={
          <ProtectedRoute>
            <JuicioFormPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
