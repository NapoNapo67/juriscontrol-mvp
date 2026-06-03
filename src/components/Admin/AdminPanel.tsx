import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '../Layout/MainLayout';
import { UsuariosAdmin } from './UsuariosAdmin';
import { CatálogosAdmin } from './CatálogosAdmin';
import { ReportesAdmin } from './ReportesAdmin';
import { Invitaciones } from './Invitaciones';

type TabAdmin = 'usuarios' | 'catalogos' | 'reportes' | 'invitaciones' | 'configuracion';

export const AdminPanel: React.FC = () => {
  const { rol } = useAuth();
  const [tabActual, setTabActual] = useState<TabAdmin>('usuarios');

  // Solo titular y admin_asuntos acceden al panel
  if (rol !== 'titular' && rol !== 'admin_asuntos') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Panel de Administración</h1>
          <p className="admin-subtitle">Gestión de usuarios, catálogos y reportes</p>
        </div>

        <div className="admin-navigation">
          <button
            className={`nav-btn ${tabActual === 'usuarios' ? 'active' : ''}`}
            onClick={() => setTabActual('usuarios')}
          >
            👥 Usuarios
          </button>
          <button
            className={`nav-btn ${tabActual === 'catalogos' ? 'active' : ''}`}
            onClick={() => setTabActual('catalogos')}
          >
            📋 Catálogos
          </button>
          <button
            className={`nav-btn ${tabActual === 'reportes' ? 'active' : ''}`}
            onClick={() => setTabActual('reportes')}
          >
            📊 Reportes
          </button>
          <button
            className={`nav-btn ${tabActual === 'invitaciones' ? 'active' : ''}`}
            onClick={() => setTabActual('invitaciones')}
          >
            📧 Invitaciones
          </button>
          <button
            className={`nav-btn ${tabActual === 'configuracion' ? 'active' : ''}`}
            onClick={() => setTabActual('configuracion')}
          >
            ⚙️ Configuración
          </button>
        </div>

        <div className="admin-content">
          {tabActual === 'usuarios' && <UsuariosAdmin />}
          {tabActual === 'catalogos' && <CatálogosAdmin />}
          {tabActual === 'reportes' && <ReportesAdmin />}
          {tabActual === 'invitaciones' && <Invitaciones />}
          {tabActual === 'configuracion' && (
            <div className="config-placeholder">
              <p>📝 Sección de configuración (próxima versión)</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-panel {
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          font-size: 28px;
          margin-bottom: 0.5rem;
          color: #000;
        }

        .admin-subtitle {
          color: var(--gray);
          font-size: 14px;
        }

        .admin-navigation {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid var(--border);
          flex-wrap: wrap;
        }

        .nav-btn {
          background: transparent;
          border: none;
          padding: 1rem 1.5rem;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .nav-btn:hover {
          color: var(--primary);
        }

        .nav-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .admin-content {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .config-placeholder {
          text-align: center;
          padding: 3rem;
          color: var(--gray);
        }

        @media (max-width: 768px) {
          .admin-navigation {
            gap: 0;
          }

          .nav-btn {
            padding: 0.75rem 1rem;
            font-size: 12px;
          }

          .admin-header h1 {
            font-size: 20px;
          }
        }
      `}</style>
    </MainLayout>
  );
};
