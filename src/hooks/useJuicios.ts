import { useState, useCallback } from 'react';
import { supabase, Juicio, AvanceJuicio } from '../lib/supabase';

interface UseJuiciosReturn {
  juicios: Juicio[];
  juicio: Juicio | null;
  cargando: boolean;
  error: string | null;
  obtenerJuicios: (filtros?: any) => Promise<void>;
  obtenerJuicio: (id: number) => Promise<void>;
  crearJuicio: (datos: any) => Promise<number | null>;
  actualizarJuicio: (id: number, datos: any) => Promise<void>;
  eliminarJuicio: (id: number) => Promise<void>;
  obtenerAvances: (juicioId: number) => Promise<AvanceJuicio[]>;
  crearAvance: (datos: any) => Promise<void>;
  actualizarAvance: (id: number, datos: any) => Promise<void>;
}

export const useJuicios = (): UseJuiciosReturn => {
  const [juicios, setJuicios] = useState<Juicio[]>([]);
  const [juicio, setJuicio] = useState<Juicio | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerJuicios = useCallback(async (filtros?: any) => {
    setCargando(true);
    setError(null);
    try {
      let query = supabase
        .from('juicios')
        .select('*')
        .eq('activo', true)
        .order('fecha_presentacion', { ascending: false });

      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado);
      }
      if (filtros?.etapa) {
        query = query.eq('etapa_actual', filtros.etapa);
      }
      if (filtros?.juzgado_id) {
        query = query.eq('juzgado_id', filtros.juzgado_id);
      }
      if (filtros?.numero_expediente) {
        query = query.ilike('numero_expediente', `%${filtros.numero_expediente}%`);
      }
      if (filtros?.caso_id) {
        query = query.eq('caso_id', filtros.caso_id);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setJuicios(data || []);
    } catch (err: any) {
      setError(err.message || 'Error obteniendo juicios');
    } finally {
      setCargando(false);
    }
  }, []);

  const obtenerJuicio = useCallback(async (id: number) => {
    setCargando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('juicios')
        .select('*')
        .eq('id', id)
        .single();
      if (err) throw err;
      setJuicio(data);
    } catch (err: any) {
      setError(err.message || 'Error obteniendo juicio');
    } finally {
      setCargando(false);
    }
  }, []);

  const crearJuicio = useCallback(async (datos: any) => {
    setCargando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('juicios')
        .insert([datos])
        .select('id')
        .single();
      if (err) throw err;
      return data?.id || null;
    } catch (err: any) {
      setError(err.message || 'Error creando juicio');
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  const actualizarJuicio = useCallback(async (id: number, datos: any) => {
    setCargando(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('juicios')
        .update(datos)
        .eq('id', id);
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || 'Error actualizando juicio');
    } finally {
      setCargando(false);
    }
  }, []);

  const eliminarJuicio = useCallback(async (id: number) => {
    setCargando(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('juicios')
        .update({ activo: false })
        .eq('id', id);
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || 'Error eliminando juicio');
    } finally {
      setCargando(false);
    }
  }, []);

  const obtenerAvances = useCallback(async (juicioId: number) => {
    try {
      const { data, error: err } = await supabase
        .from('avances_juicio')
        .select('*')
        .eq('juicio_id', juicioId)
        .order('fecha_avance', { ascending: false });
      if (err) throw err;
      return data || [];
    } catch (err: any) {
      setError(err.message || 'Error obteniendo avances');
      return [];
    }
  }, []);

  const crearAvance = useCallback(async (datos: any) => {
    try {
      const { error: err } = await supabase
        .from('avances_juicio')
        .insert([datos]);
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || 'Error creando avance');
    }
  }, []);

  const actualizarAvance = useCallback(async (id: number, datos: any) => {
    try {
      const { error: err } = await supabase
        .from('avances_juicio')
        .update(datos)
        .eq('id', id);
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || 'Error actualizando avance');
    }
  }, []);

  return {
    juicios,
    juicio,
    cargando,
    error,
    obtenerJuicios,
    obtenerJuicio,
    crearJuicio,
    actualizarJuicio,
    eliminarJuicio,
    obtenerAvances,
    crearAvance,
    actualizarAvance,
  };
};
