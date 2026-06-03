import React, { useState, useEffect } from 'react';
import { useCasos } from '../../hooks/useCasos';
import { useJuicios } from '../../hooks/useJuicios';

export const Dashboard: React.FC = () => {
  const { casos, obtenerCasos } = useCasos();
  const { juicios, obtenerJuicios } = useJuicios();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      await obtenerCasos();
      await obtenerJuicios();
      setCargando(false);
    };
    cargar();
  }, []);

  // KPIs
  const casosActivos = casos.filter(c => c.estado === 'activo').length;
  const juiciosEnTramite = juicios.filter(j => j.estado === 'activo').length;
  const recuperacionTotal = casos.reduce((sum, c) => sum + (c.capital_mn || 0), 0);

  // Datos para gráfico (conteo por estado)
  const distribucionCasos = {
    activo: casos.filter(c => c.estado === 'activo').length,
    en_juicio: casos.filter(c => c.estado === 'en_juicio').length,
    terminado: casos.filter(c => c.estado === 'terminado').length,
    archivado: casos.filter(c => c.estado === 'archivado').length,
  };

  const ultimosCasos = casos.slice(0, 5);
  const ultimosAvances = juicios.slice(0, 5);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {cargando ? (
        <div className="loading">Cargando datos...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Casos Activos</div>
              <div className="kpi-value">{casosActivos}</div>
              <div className="kpi-description">Casos en seguimiento</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Juicios en Trámite</div>
              <div className="kpi-value">{juiciosEnTramite}</div>
              <div className="kpi-description">Juicios activos</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Recuperación Total</div>
              <div className="kpi-value">${(recuperacionTotal / 1000000).toFixed(1)}M</div>
              <div className="kpi-description">Capital en pesos</div>
            </div>
          </div>

          {/* Gráfico de distribución */}
          <section className="dashboard-section">
            <h2>Distribución de Casos por Estado</h2>
            <div className="chart-container">
              <div className="simple-chart">
                {Object.entries(distribucionCasos).map(([estado, count]) => (
                  <div key={estado} className="chart-bar-item">
                    <label>{estado.toUpperCase()}</label>
                    <div className="bar-container">
                      <div
                        className={`bar bar-${estado}`}
                        style={{
                          width: `${(count / Math.max(...Object.values(distribucionCasos), 1)) * 100}%`,
                        }}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Últimos casos */}
          <section className="dashboard-section">
            <h2>Últimos Casos</h2>
            {ultimosCasos.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Caso</th>
                    <th>Demandado</th>
                    <th>Capital MN</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosCasos.map((caso) => (
                    <tr key={caso.id}>
                      <td>{caso.numero_caso}</td>
                      <td>{caso.demandado_principal || '-'}</td>
                      <td>${caso.capital_mn?.toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${caso.estado}`}>
                          {caso.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">Sin casos registrados</p>
            )}
          </section>

          {/* Últimos juicios */}
          <section className="dashboard-section">
            <h2>Últimos Juicios</h2>
            {ultimosAvances.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Expediente</th>
                    <th>Juzgado</th>
                    <th>Estado</th>
                    <th>Etapa Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosAvances.map((juicio) => (
                    <tr key={juicio.id}>
                      <td>{juicio.numero_expediente}</td>
                      <td>{juicio.juzgado_id}</td>
                      <td>
                        <span className={`badge badge-${juicio.estado}`}>
                          {juicio.estado}
                        </span>
                      </td>
                      <td>{juicio.etapa_actual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">Sin juicios registrados</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};
