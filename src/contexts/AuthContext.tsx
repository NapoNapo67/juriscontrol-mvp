// ============================================================================
// contexts/AuthContext.tsx
// Estado global de autenticación + multi-tenancy
// ============================================================================
// Adaptado al schema v2:
//   - Carga perfil del usuario al login (FK auth.users.id → perfiles.id)
//   - Carga TODAS las membresías activas del usuario (M:N con organizaciones)
//   - Mantiene una organización activa con su rol asociado
//   - Persiste la org activa para próximas sesiones
//   - Permite cambiar de organización via cambiarOrgActiva(orgId)
// ============================================================================

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import {
  supabase,
  Perfil,
  Organizacion,
  MembresiaOrganizacion,
  RolOrganizacion,
  obtenerMembresiasActivas,
  actualizarOrgActiva as persistirOrgActiva,
} from '../lib/supabase';

const ORG_ACTIVA_STORAGE_KEY = 'juriscontrol.orgActivaId';

interface AuthContextType {
  // Identidad
  usuario: User | null;
  perfil: Perfil | null;

  // Multi-tenancy
  membresias: MembresiaOrganizacion[];
  orgActiva: Organizacion | null;
  rol: RolOrganizacion | null;

  // UI state
  cargando: boolean;
  error: string | null;

  // Acciones
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  cambiarOrgActiva: (orgId: string) => Promise<void>;
  refrescarMembresias: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [membresias, setMembresias] = useState<MembresiaOrganizacion[]>([]);
  const [orgActivaId, setOrgActivaId] = useState<string | null>(
    () => localStorage.getItem(ORG_ACTIVA_STORAGE_KEY)
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derivar org activa y rol a partir de las membresías + orgActivaId
  const membresiaActiva = membresias.find((m) => m.org_id === orgActivaId) ?? null;
  const orgActiva = membresiaActiva?.organizacion ?? null;
  const rol = membresiaActiva?.rol ?? null;

  /**
   * Carga perfil del usuario y sus membresías. Selecciona org activa según:
   *   1. perfiles.org_activa_id (persistida en BD)
   *   2. localStorage (último uso en este dispositivo)
   *   3. Primera membresía disponible
   *   4. null si el usuario no pertenece a ninguna org (caso típico: aún no aceptó invitación)
   */
  const cargarPerfilYMembresias = useCallback(async (user: User) => {
    // Perfil
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (perfilError) {
      console.error('[AuthContext] error cargando perfil:', perfilError);
      setError('No se pudo cargar el perfil');
      return;
    }

    if (!perfilData) {
      // Caso: el user existe en auth.users pero aún no hay perfil
      // (típicamente porque aún no completó el flujo de aceptar-invitación)
      setPerfil(null);
      setMembresias([]);
      return;
    }

    const perfilTyped = perfilData as Perfil;
    setPerfil(perfilTyped);

    // Membresías
    const memList = await obtenerMembresiasActivas(user.id);
    setMembresias(memList);

    // Determinar org activa
    const candidatas = [
      perfilTyped.org_activa_id,
      orgActivaId,
      memList[0]?.org_id,
    ].filter(Boolean) as string[];

    const orgValida = candidatas.find((id) => memList.some((m) => m.org_id === id));

    if (orgValida) {
      setOrgActivaId(orgValida);
      localStorage.setItem(ORG_ACTIVA_STORAGE_KEY, orgValida);
    } else {
      setOrgActivaId(null);
      localStorage.removeItem(ORG_ACTIVA_STORAGE_KEY);
    }
  }, [orgActivaId]);

  // Carga inicial + listener de cambios de sesión
  useEffect(() => {
    let cancelado = false;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelado) return;
        setUsuario(user);

        if (user) {
          await cargarPerfilYMembresias(user);
        }
      } catch (err) {
        console.error('[AuthContext] init:', err);
        if (!cancelado) setError('Error verificando sesión');
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setUsuario(user);

        if (user) {
          await cargarPerfilYMembresias(user);
        } else {
          setPerfil(null);
          setMembresias([]);
          setOrgActivaId(null);
          localStorage.removeItem(ORG_ACTIVA_STORAGE_KEY);
        }
      }
    );

    return () => {
      cancelado = true;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // Acciones
  // ==========================================================================

  const iniciarSesion = async (email: string, password: string) => {
    setError(null);
    const { error: errorAuth } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (errorAuth) {
      setError(errorAuth.message);
      throw errorAuth;
    }
    // onAuthStateChange dispara cargarPerfilYMembresias
  };

  const cerrarSesion = async () => {
    setError(null);
    const { error: errorAuth } = await supabase.auth.signOut();
    if (errorAuth) {
      setError(errorAuth.message);
      throw errorAuth;
    }
    // onAuthStateChange limpia el estado
  };

  /**
   * Cambia la organización activa. Persiste tanto en localStorage como en BD
   * (perfiles.org_activa_id) para que el próximo login en otro dispositivo
   * recuerde la última usada.
   */
  const cambiarOrgActiva = async (orgId: string) => {
    if (!perfil) throw new Error('No hay perfil cargado');

    const pertenece = membresias.some((m) => m.org_id === orgId);
    if (!pertenece) {
      throw new Error('El usuario no pertenece a la organización solicitada');
    }

    setOrgActivaId(orgId);
    localStorage.setItem(ORG_ACTIVA_STORAGE_KEY, orgId);

    try {
      await persistirOrgActiva(perfil.id, orgId);
    } catch (err) {
      console.warn('[AuthContext] no se pudo persistir org_activa_id:', err);
      // No bloqueante: el cambio en memoria + localStorage ya surtió efecto
    }
  };

  const refrescarMembresias = async () => {
    if (!usuario) return;
    const memList = await obtenerMembresiasActivas(usuario.id);
    setMembresias(memList);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        perfil,
        membresias,
        orgActiva,
        rol,
        cargando,
        error,
        iniciarSesion,
        cerrarSesion,
        cambiarOrgActiva,
        refrescarMembresias,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
