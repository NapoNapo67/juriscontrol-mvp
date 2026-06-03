// ============================================================================
// components/Layout/Header.tsx
// Header global con selector de organización
// ============================================================================
// Si el usuario pertenece a más de 1 organización, muestra un dropdown para
// cambiar entre ellas. Si solo pertenece a una, muestra el nombre estático.
// Si aún no tiene organización (caso post-signup sin invitación aceptada),
// muestra un placeholder informativo.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogoutButton } from '../Auth/LogoutButton';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { usuario, perfil, membresias, orgActiva, rol, cambiarOrgActiva } = useAuth();

  const tieneMultiplesOrgs = membresias.length > 1;

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <button
            className="menu-toggle"
            onClick={onToggleSidebar}
            aria-label="Alternar menú"
          >
            ☰
          </button>
          <div className="header-logo">
            <h1>JURISCONTROL WEB</h1>
          </div>
        </div>

        <div className="header-center">
          {orgActiva ? (
            tieneMultiplesOrgs ? (
              <OrgSelector
                membresias={membresias}
                orgActivaId={orgActiva.id}
                onCambiar={cambiarOrgActiva}
              />
            ) : (
              <div className="org-label">
                <span className="org-nombre">{orgActiva.nombre}</span>
                {rol && <span className="org-rol">· {formatearRol(rol)}</span>}
              </div>
            )
          ) : (
            usuario && (
              <span className="org-pendiente">
                Sin organización asignada
              </span>
            )
          )}
        </div>

        <div className="header-right">
          {usuario && (
            <div className="header-user">
              <span className="user-name">
                {perfil?.nombre_completo ?? usuario.email}
              </span>
            </div>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// Selector de organización (dropdown)
// ============================================================================

interface OrgSelectorProps {
  membresias: Array<{
    org_id: string;
    rol: string;
    organizacion?: { id: string; nombre: string; tipo: string };
  }>;
  orgActivaId: string;
  onCambiar: (orgId: string) => Promise<void>;
}

const OrgSelector: React.FC<OrgSelectorProps> = ({
  membresias,
  orgActivaId,
  onCambiar,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    if (!abierto) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  const activa = membresias.find((m) => m.org_id === orgActivaId);

  const handleSeleccionar = async (orgId: string) => {
    if (orgId === orgActivaId) {
      setAbierto(false);
      return;
    }
    setCambiando(true);
    try {
      await onCambiar(orgId);
      setAbierto(false);
    } catch (err) {
      console.error('Error cambiando de organización:', err);
      alert('No se pudo cambiar de organización. Intenta de nuevo.');
    } finally {
      setCambiando(false);
    }
  };

  return (
    <div className="org-selector" ref={ref}>
      <button
        className="org-selector-trigger"
        onClick={() => setAbierto((v) => !v)}
        disabled={cambiando}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >
        <span className="org-nombre">
          {activa?.organizacion?.nombre ?? 'Selecciona organización'}
        </span>
        {activa?.rol && (
          <span className="org-rol">· {formatearRol(activa.rol)}</span>
        )}
        <span className="org-chevron">{abierto ? '▴' : '▾'}</span>
      </button>

      {abierto && (
        <ul className="org-selector-dropdown" role="listbox">
          {membresias.map((m) => (
            <li
              key={m.org_id}
              role="option"
              aria-selected={m.org_id === orgActivaId}
              className={m.org_id === orgActivaId ? 'activa' : ''}
            >
              <button
                onClick={() => handleSeleccionar(m.org_id)}
                disabled={cambiando}
              >
                <span className="opcion-nombre">
                  {m.organizacion?.nombre ?? '(sin nombre)'}
                </span>
                <span className="opcion-meta">
                  {m.organizacion?.tipo && (
                    <span className="opcion-tipo">{m.organizacion.tipo}</span>
                  )}
                  <span className="opcion-rol">{formatearRol(m.rol)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ============================================================================
// Helpers
// ============================================================================

function formatearRol(rol: string): string {
  const mapa: Record<string, string> = {
    titular: 'Titular',
    admin_asuntos: 'Admin de asuntos',
    gestor_agenda: 'Gestor de agenda',
    abogado: 'Abogado',
    lectura: 'Lectura',
    contacto_principal: 'Contacto principal',
    seguimiento: 'Seguimiento',
  };
  return mapa[rol] ?? rol;
}
