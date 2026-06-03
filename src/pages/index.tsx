import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  if (usuario) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="home-page">
      <div className="hero">
        <h1>JURISCONTROL WEB</h1>
        <p>Sistema de Gestión Legal Integral</p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
}
