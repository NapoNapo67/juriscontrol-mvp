// ============================================================================
// components/Layout/Sidebar.tsx
// Navegación lateral con filtrado por rol del usuario en la org activa
// ============================================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { RolOrganizacion } from '../../lib/supabase';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  label: string;
  path: string;
  roles: RolOrganizacion[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation();
  const { rol, orgActiva } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Todos los roles internos del despacho pueden ver el panel principal.
  // Los roles de cliente externo (contacto_principal, seguimiento, lectura)
  // típicamente entran a una vista distinta /portal-cliente/ — no a este menú.
  const TODOS_INTERNOS: RolOrganizacion[] = [
    'titular',
    'admin_asuntos',
    'gestor_agenda',
    'abogado',
    'lectura',
  ];

  const menuItems: MenuItem[] = [
    { label: 'Dashboard',      path: '/dashboard', roles: TODOS_INTERNOS },
    { label: 'Casos',          path: '/casos',     roles: TODOS_INTERNOS },
    { label: 'Juicios',        path: '/juicios',   roles: TODOS_INTERNOS },
    { label: 'Agenda',         path: '/agenda',    roles: TODOS_INTERNOS },
    { label: 'Administración', path: '/admin',     roles: ['titular', 'admin_asuntos'] },
  ];

  // Si no hay org activa, ocultar el sidebar (típico para usuarios recién
  // creados que aún no aceptaron invitación a ninguna organización)
  if (!orgActiva || !rol) {
    return null;
  }

  const visibleItems = menuItems.filter((item) => item.roles.includes(rol));

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={onClose}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
