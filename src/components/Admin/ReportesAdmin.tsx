import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { generarReportePDF } from '../../utils/reportGenerator';
import { exportarExcel } from '../../utils/excelExporter';

type TipoReporte = 'casos-sucursal' | 'juicios-estado' | 'recuperacion' | 'asistentes' | 'vencimientos';

interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  sucursalId: string;
  asistenteId: string;
  estado: string;
}

export const ReportesAdmin: React.FC = () => {
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    sucursalId: '',
    asistenteId: '',
    estado: '',
  });

  const [reporteSeleccionado, setReporteSeleccionado] = useState<TipoReporte | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const generarReporteCasosPorSucursal = async () => {
    setCargando(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('casos')
        .select('id, numero_caso, sucursal_id, estado, capital_mn, fecha_creacion')
        .gte('fecha_creacion', filtros.fechaInicio)
        .lte('fecha_creacion', filtros.fechaFin)
        .order('sucursal_id');

      if (err) throw err;

      // Agrupar por sucursal
      const porSucursal: any = {};
      (data || []).forEach((caso) => {
        if (!porSucursal[caso.sucursal_id]) {
          porSucursal[caso.sucursal_id] = [];
        }
        porSucursal[caso.sucursal_id].push(caso);
      });

      setPreview({ tipo: 'casos-sucursal', datos: porSucursal });
      await generarReportePDF(porSucursal, {
        titulo: 'Reporte: Casos por Sucursal',
        filtros: `Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`,
        tipo: 'casos-sucursal',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const generarReporteJuiciosPorEstado = async () => {
    setCargando(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('juicios')
        .select(`
          id,
          numero_expediente,
          estado,
          etapa_actual,
          fecha_presentacion,
          casos(numero_caso)
        `)
        .gte('fecha_presentacion', filtros.fechaInicio)
        .lte('fecha_presentacion', filtros.fechaFin)
        .order('estado');

      if (err) throw err;

      setPreview({ tipo: 'juicios-estado', datos: data });
      await generarReportePDF(data, {
        titulo: 'Reporte: Juicios por Estado',
        filtros: `Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`,
        tipo: 'juicios-estado',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const generarReporteRecuperacion = async () => {
    setCargando(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('casos')
        .select(`
          numero_caso,
          capital_mn,
          metadata,
          fecha_creacion
        `)
        .gte('fecha_creacion', filtros.fechaInicio)
        .lte('fecha_creacion', filtros.fechaFin);

      if (err) throw err;

      const recuperacionPorMes: any = {};
      (data || []).forEach((caso) => {
        const mes = new Date(caso.fecha_creacion).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
        });

        if (!recuperacionPorMes[mes]) {
          recuperacionPorMes[mes] = {
            capital: 0,
            recuperado: 0,
            casos: 0,
          };
        }

        recuperacionPorMes[mes].capital += caso.capital_mn || 0;
        recuperacionPorMes[mes].recuperado += caso.metadata?.recuperacion_total || 0;
        recuperacionPorMes[mes].casos += 1;
      });

      setPreview({ tipo: 'recuperacion', datos: recuperacionPorMes });
      await generarReportePDF(recuperacionPorMes, {
        titulo: 'Reporte: Recuperación Mensual',
        filtros: `Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`,
        tipo: 'recuperacion',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const generarReporteAsistentes = async () => {
    setCargando(true);
    setError(null);

    try {
      const { data: casos, error: err } = await supabase
        .from('casos')
        .select(`
          asistente_id,
          numero_caso,
          capital_mn,
          metadata,
          juicios(id)
        `)
        .gte('fecha_creacion', filtros.fechaInicio)
        .lte('fecha_creacion', filtros.fechaFin);

      if (err) throw err;

      // Agrupar por asistente
      const porAsistente: any = {};
      (casos || []).forEach((caso) => {
        const asistId = caso.asistente_id || 'Sin asignar';
        if (!porAsistente[asistId]) {
          porAsistente[asistId] = {
            casosAsignados: 0,
            capitalTotal: 0,
            recuperado: 0,
            juicios: 0,
          };
        }

        porAsistente[asistId].casosAsignados += 1;
        porAsistente[asistId].capitalTotal += caso.capital_mn || 0;
        porAsistente[asistId].recuperado += caso.metadata?.recuperacion_total || 0;
        porAsistente[asistId].juicios += caso.juicios?.length || 0;
      });

      setPreview({ tipo: 'asistentes', datos: porAsistente });
      await generarReportePDF(porAsistente, {
        titulo: 'Reporte: Actividad de Asistentes',
        filtros: `Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`,
        tipo: 'asistentes',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const generarReporteVencimientos = async () => {
    setCargando(true);
    setError(null);

    try {
      const hoy = new Date();
      const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error: err } = await supabase
        .from('casos')
        .select('numero_caso, fecha_vencimiento, asistente_id, estado')
        .gte('fecha_vencimiento', hoy.toISOString())
        .lte('fecha_vencimiento', en30Dias.toISOString())
        .order('fecha_vencimiento');

      if (err) throw err;

      setPreview({ tipo: 'vencimientos', datos: data });
      await generarReportePDF(data, {
        titulo: 'Reporte: Vencimientos Próximos (30 días)',
        filtros: `Desde: ${hoy.toLocaleDateString('es-MX')}`,
        tipo: 'vencimientos',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="reportes-admin">
      <div className="section-header">
        <h2>Generador de Reportes</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filtros-contenedor">
        <h3>Filtros</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fechaInicio">Fecha Inicio</label>
            <input
              id="fechaInicio"
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="fechaFin">Fecha Fin</label>
            <input
              id="fechaFin"
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="sucursal">Sucursal</label>
            <select
              id="sucursal"
              value={filtros.sucursalId}
              onChange={(e) => setFiltros({ ...filtros, sucursalId: e.target.value })}
              className="form-input"
            >
              <option value="">Todas</option>
              <option value="1">Sucursal 1</option>
              <option value="2">Sucursal 2</option>
              <option value="3">Sucursal 3</option>
            </select>
          </div>
        </div>
      </div>

      <div className="reportes-grid">
        <h3>Reportes Disponibles</h3>

        <div className="reporte-card">
          <h4>📊 Casos por Sucursal</h4>
          <p>Distribución de casos agrupados por sucursal</p>
          <button
            onClick={generarReporteCasosPorSucursal}
            disabled={cargando}
            className="btn-primary btn-small"
          >
            {cargando && reporteSeleccionado === 'casos-sucursal'
              ? '⏳ Generando...'
              : '📥 Descargar PDF'}
          </button>
          <button
            onClick={() => exportarExcel([], 'Casos_por_Sucursal')}
            className="btn-secondary btn-small"
          >
            📊 Exportar Excel
          </button>
        </div>

        <div className="reporte-card">
          <h4>⚖️ Juicios por Estado</h4>
          <p>Listado de juicios filtrados por estado y etapa</p>
          <button
            onClick={generarReporteJuiciosPorEstado}
            disabled={cargando}
            className="btn-primary btn-small"
          >
            {cargando && reporteSeleccionado === 'juicios-estado'
              ? '⏳ Generando...'
              : '📥 Descargar PDF'}
          </button>
        </div>

        <div className="reporte-card">
          <h4>💰 Recuperación Mensual</h4>
          <p>Análisis de recuperación por mes con gráficos</p>
          <button
            onClick={generarReporteRecuperacion}
            disabled={cargando}
            className="btn-primary btn-small"
          >
            {cargando && reporteSeleccionado === 'recuperacion'
              ? '⏳ Generando...'
              : '📥 Descargar PDF'}
          </button>
        </div>

        <div className="reporte-card">
          <h4>👥 Actividad de Asistentes</h4>
          <p>Casos, juicios y recuperación por asistente</p>
          <button
            onClick={generarReporteAsistentes}
            disabled={cargando}
            className="btn-primary btn-small"
          >
            {cargando && reporteSeleccionado === 'asistentes'
              ? '⏳ Generando...'
              : '📥 Descargar PDF'}
          </button>
        </div>

        <div className="reporte-card">
          <h4>⏰ Vencimientos Próximos</h4>
          <p>Casos próximos a vencer en los próximos 30 días</p>
          <button
            onClick={generarReporteVencimientos}
            disabled={cargando}
            className="btn-primary btn-small"
          >
            {cargando && reporteSeleccionado === 'vencimientos'
              ? '⏳ Generando...'
              : '📥 Descargar PDF'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="preview-contenedor">
          <h3>Vista Previa</h3>
          <pre className="preview-datos">{JSON.stringify(preview.datos, null, 2)}</pre>
        </div>
      )}

      <style>{`
        .reportes-admin {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .filtros-contenedor {
          background: var(--light);
          padding: 1.5rem;
          border-radius: var(--radius);
        }

        .filtros-contenedor h3 {
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .reportes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .reportes-grid h3 {
          grid-column: 1 / -1;
          margin: 0;
        }

        .reporte-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .reporte-card h4 {
          margin: 0;
          font-size: 16px;
        }

        .reporte-card p {
          margin: 0;
          color: var(--gray);
          font-size: 13px;
          flex: 1;
        }

        .reporte-card button {
          width: 100%;
        }

        .preview-contenedor {
          background: var(--light);
          padding: 1.5rem;
          border-radius: var(--radius);
        }

        .preview-datos {
          background: white;
          padding: 1rem;
          border-radius: var(--radius);
          overflow-x: auto;
          font-size: 11px;
          line-height: 1.4;
          max-height: 400px;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .reportes-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
