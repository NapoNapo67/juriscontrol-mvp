import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  obtenerInvitacionPorToken,
  aceptarInvitacion,
  InvitacionOrganizacion,
} from '../../lib/supabase';

export const AceptarInvitacionForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const [invitacion, setInvitacion] = useState<InvitacionOrganizacion | null>(
    null
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Formulario
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // Cargar invitación al montar
  useEffect(() => {
    const cargarInvitacion = async () => {
      if (!token) {
        setError('Token de invitación faltante');
        setCargando(false);
        return;
      }

      try {
        const inv = await obtenerInvitacionPorToken(token);
        if (!inv) {
          setError('Invitación no encontrada o expirada');
        } else if (inv.estado !== 'pendiente') {
          setError(`Invitación no válida (estado: ${inv.estado})`);
        } else if (new Date(inv.expires_at) < new Date()) {
          setError('Invitación expirada');
        } else {
          setInvitacion(inv);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || 'Error cargando invitación');
      } finally {
        setCargando(false);
      }
    };

    cargarInvitacion();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      // Validaciones
      if (!nombreCompleto.trim()) {
        setError('Por favor completa tu nombre completo');
        setEnviando(false);
        return;
      }

      if (!password || password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        setEnviando(false);
        return;
      }

      if (password !== passwordConfirm) {
        setError('Las contraseñas no coinciden');
        setEnviando(false);
        return;
      }

      if (!token) {
        setError('Token faltante');
        setEnviando(false);
        return;
      }

      // Aceptar invitación (crea auth, perfil, org, membresia, seed)
      await aceptarInvitacion(token, password, nombreCompleto);

      // Éxito: navegar a dashboard
      // (onAuthStateChange en AuthContext se dispara y carga perfil/membresias)
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error aceptando invitación');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="aceptar-invitacion-container">
        <div className="aceptar-invitacion-card">
          <p className="loading-text">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (!invitacion || error) {
    return (
      <div className="aceptar-invitacion-container">
        <div className="aceptar-invitacion-card">
          <div className="error-box">
            <h2>⚠️ Invitación no válida</h2>
            <p>{error || 'No se pudo cargar la invitación.'}</p>
            <p className="error-hint">
              Si crees que esto es un error, contacta al administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aceptar-invitacion-container">
      <div className="aceptar-invitacion-card">
        <h1 className="aceptar-invitacion-title">¡Bienvenido!</h1>
        <p className="aceptar-invitacion-subtitle">
          Completa tu registro para acceder a{' '}
          <strong>{invitacion.nombre_organizacion}</strong>
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="aceptar-invitacion-form">
          {/* Email (lectura) */}
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={invitacion.email_invitado}
              disabled
              className="form-input form-input-disabled"
            />
            <small className="form-hint">
              Este correo fue usado para enviar la invitación
            </small>
          </div>

          {/* Nombre completo (editable) */}
          <div className="form-group">
            <label htmlFor="nombreCompleto">Nombre Completo</label>
            <input
              id="nombreCompleto"
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Juan Pérez García"
              disabled={enviando}
              className="form-input"
            />
          </div>

          {/* Organización (lectura) */}
          <div className="form-group">
            <label htmlFor="organizacion">Organización</label>
            <input
              id="organizacion"
              type="text"
              value={invitacion.nombre_organizacion}
              disabled
              className="form-input form-input-disabled"
            />
            <small className="form-hint">
              Tipo: {invitacion.tipo_organizacion}
            </small>
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={enviando}
              className="form-input"
            />
            <small className="form-hint">Mínimo 6 caracteres</small>
          </div>

          {/* Confirmar contraseña */}
          <div className="form-group">
            <label htmlFor="passwordConfirm">Confirmar Contraseña</label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              disabled={enviando}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="aceptar-invitacion-button"
          >
            {enviando ? 'Creando cuenta...' : 'Aceptar Invitación y Crear Cuenta'}
          </button>
        </form>

        <div className="aceptar-invitacion-footer">
          <p>¿Tienes dudas?</p>
          <p className="footer-hint">
            Esta invitación expira el{' '}
            {new Date(invitacion.expires_at).toLocaleDateString('es-MX')}
          </p>
        </div>
      </div>

      <style>{`
        .aceptar-invitacion-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
        }

        .aceptar-invitacion-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 2rem;
          width: 100%;
          max-width: 500px;
        }

        .aceptar-invitacion-title {
          font-size: 28px;
          margin-bottom: 0.5rem;
          color: #000;
          text-align: center;
        }

        .aceptar-invitacion-subtitle {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-bottom: 1.5rem;
        }

        .aceptar-invitacion-subtitle strong {
          color: #667eea;
          font-weight: 600;
        }

        .error-message {
          background: #fee;
          border-left: 4px solid #f44;
          color: #c00;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 14px;
        }

        .error-box {
          text-align: center;
          padding: 2rem 1rem;
        }

        .error-box h2 {
          color: #c00;
          margin-bottom: 0.5rem;
        }

        .error-box p {
          color: #666;
          margin-bottom: 0.5rem;
          font-size: 14px;
        }

        .error-hint {
          color: #999;
          font-size: 12px !important;
        }

        .loading-text {
          text-align: center;
          color: #666;
          padding: 2rem;
        }

        .aceptar-invitacion-form {
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 14px;
          color: #333;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .form-input:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .form-input-disabled {
          background: #f5f5f5;
          color: #666;
          cursor: not-allowed;
        }

        .form-hint {
          display: block;
          font-size: 12px;
          color: #999;
          margin-top: 0.25rem;
        }

        .aceptar-invitacion-button {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          font-size: 14px;
        }

        .aceptar-invitacion-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .aceptar-invitacion-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .aceptar-invitacion-footer {
          text-align: center;
          padding-top: 1rem;
          border-top: 1px solid #eee;
          font-size: 13px;
          color: #999;
        }

        .aceptar-invitacion-footer p {
          margin: 0.25rem 0;
        }

        .footer-hint {
          color: #ccc;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};
