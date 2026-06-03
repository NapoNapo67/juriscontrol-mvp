import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const LogoutButton: React.FC = () => {
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  const handleLogout = async () => {
    setCargando(true);
    try {
      await cerrarSesion();
      navigate('/login');
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={cargando}
      className="logout-button"
      title="Cerrar sesión"
    >
      {cargando ? '...' : 'Cerrar Sesión'}
    </button>
  );
};
