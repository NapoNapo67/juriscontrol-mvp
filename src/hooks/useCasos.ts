import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  obtenerCasos as supabaseObtenerCasos,
  obtenerCaso as supabaseObtenerCaso,
  crearCaso as supabaseCrearCaso,
  actualizarCaso as supabaseActualizarCaso,
  obtenerDemandados,
  crearDemandado as supabaseCrearDemandado,
  obtenerAvalistas,
  crearAvalista as supabaseCrearAvalista,
  Caso,
  Demandado,
  Avalista,
} from '../lib/supabase';

interface UseCasosReturn {
  casos: Caso[];
  caso: Caso | null;
  cargando: boolean;
  error: string | null;
  obtenerCasos: (filtros?: any) => Promise<void>;
  obtenerCaso: (id: string) => Promise<void>;
  crearCaso: (datos: any) => Promise<string | null>;
  actualizarCaso: (id: string, datos: any) => Promise<void>;
  eliminarCaso: (id: string) => Promise<void>;
  obtenerDemandados: (casoId: string) => Promise<Demandado[]>;
  obtenerAvalistas: (casoId: string) => Promise<Avalista[]>;
  crearDemandado: (datos: any) => Promise<void>;
  crearAvalista: (datos: any) => Promise<void>;
}

/**
 * Hook para gestión de casos con multi-tenancy
 * Todas las operaciones filtran automáticamente por org_id actual
 */
export const useCasos = (): UseCasosReturn => {
  const { orgActiva } = useAuth();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [caso, setCaso] = useState<Caso | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerCasos = useCallback(
    async (filtros?: any) => {
      if (!orgActiva?.id) {
        setError('No hay organización activa');
        return;
      }

      setCargando(true);
      setError(null);
      try {
        const datos = await supabaseObtenerCasos(orgActiva.id);

        // Filtrado en memoria (opcional - podrías hacerlo en BD)
        let resultado = datos;

        if (filtros?.estado) {
          resultado = resultado.filter((c) => c.estado === filtros.estado);
        }
        if (filtros?.abogado_asignado_id) {
          resultado = resultado.filter(
            (c) => c.abogado_asignado_id === filtros.abogado_asignado_id
          );
        }
        if (filtros?.numero_caso) {
          resultado = resultado.filter((c) =>
            c.numero_caso
              .toLowerCase()
              .includes(filtros.numero_caso.toLowerCase())
          );
        }
        if (filtros?.cliente_id) {
          resultado = resultado.filter((c) => c.cliente_id === filtros.cliente_id);
        }

        setCasos(resultado);
      } catch (err: any) {
        setError(err.message || 'Error obteniendo casos');
      } finally {
        setCargando(false);
      }
    },
    [orgActiva?.id]
  );

  const obtenerCaso = useCallback(
    async (id: string) => {
      if (!orgActiva?.id) {
        setError('No hay organización activa');
        return;
      }

      setCargando(true);
      setError(null);
      try {
        const dato = await supabaseObtenerCaso(id);

        // Validar que pertenece a la org actual (seguridad)
        if (dato && dato.org_id !== orgActiva.id) {
          throw new Error('Acceso denegado: caso no pertenece a esta organización');
        }

        setCaso(dato);
      } catch (err: any) {
        setError(err.message || 'Error obteniendo caso');
      } finally {
        setCargando(false);
      }
    },
    [orgActiva?.id]
  );

  const crearCaso = useCallback(
    async (datos: any) => {
      if (!orgActiva?.id) {
        setError('No hay organización activa');
        return null;
      }

      setCargando(true);
      setError(null);
      try {
        // Agregar org_id automáticamente
        const datosConOrg = {
          ...datos,
          org_id: orgActiva.id,
        };

        const resultado = await supabaseCrearCaso(orgActiva.id, datosConOrg);
        return resultado.id || null;
      } catch (err: any) {
        setError(err.message || 'Error creando caso');
        return null;
      } finally {
        setCargando(false);
      }
    },
    [orgActiva?.id]
  );

  const actualizarCaso = useCallback(
    async (id: string, datos: any) => {
      setCargando(true);
      setError(null);
      try {
        await supabaseActualizarCaso(id, datos);
      } catch (err: any) {
        setError(err.message || 'Error actualizando caso');
      } finally {
        setCargando(false);
      }
    },
    []
  );

  const eliminarCaso = useCallback(async (id: string) => {
    setCargando(true);
    setError(null);
    try {
      // Soft delete vía deleted_at
      const ahora = new Date().toISOString();
      await supabaseActualizarCaso(id, { deleted_at: ahora });
    } catch (err: any) {
      setError(err.message || 'Error eliminando caso');
    } finally {
      setCargando(false);
    }
  }, []);

  const crearDemandado = useCallback(async (datos: any) => {
    try {
      await supabaseCrearDemandado(datos);
    } catch (err: any) {
      setError(err.message || 'Error creando demandado');
    }
  }, []);

  const crearAvalista = useCallback(async (datos: any) => {
    try {
      await supabaseCrearAvalista(datos);
    } catch (err: any) {
      setError(err.message || 'Error creando avalista');
    }
  }, []);

  return {
    casos,
    caso,
    cargando,
    error,
    obtenerCasos,
    obtenerCaso,
    crearCaso,
    actualizarCaso,
    eliminarCaso,
    obtenerDemandados,
    obtenerAvalistas,
    crearDemandado,
    crearAvalista,
  };
};
