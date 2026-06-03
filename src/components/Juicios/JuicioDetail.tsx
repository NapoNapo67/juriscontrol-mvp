import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJuicios } from '../../hooks/useJuicios';
import { AvancesList } from './AvancesList';

export const JuicioDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { juicio, cargando, error, obtenerJuicio, obtenerAvances } = useJuicios();
  const [avances, setAvances] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      obtenerJuicio(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (juicio) {
      obtenerAvances(juicio.id).then(setAvances);
    }
  }, [juicio]);

  if (cargando) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!juicio) return <div className="empty-state">Juicio no encontrado</div>;

  // Etapas para timeline
  const etapas = ['PRESENTACIÓN DEMANDA', 'RADICACIÓN', 'DEMANDA ADMITIDA', 'SENTENCIA', 'APELACIÓN', 'ADJUDICACIÓN'];
  const etapaActualIndex = etapas.findIndex(e => e === juicio.etapa_actual);

  return (
    <div className="juicio-detail">
      <div className="detail-header">
        <h2>Juicio {juicio.numero_expediente}</h2>
        <div className="detail-actions">
          <button
            onClick={() => navigate(`/juicios/${juicio.id}/edit`)}
            className="btn-primary btn-small"
          >
            Editar
          </button>
          <button
            onClick={() => navigate('/juicios')}
            className="btn-secondary btn-small"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="detail-sections">
        <section className="section">
          <h3>Información General</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>No. Expediente</label>
              <span>{juicio.numero_expediente}</span>
            </div>
            <div className="info-item">
              <label>Juzgado</label>
              <span>{juicio.juzgado_id}</span>
            </div>
            <div className="info-item">
              <label>Caso ID</label>
              <span>
                <a href={`/casos/${juicio.caso_id}`} className="link">{juicio.caso_id}</a>
              </span>
            </div>
            <div className="info-item">
              <label>Estado</label>
              <span className={`badge badge-${juicio.estado}`}>{juicio.estado}</span>
            </div>
            <div className="info-item">
              <label>Tipo Juicio</label>
              <span>{juicio.tipo_juicio_id}</span>
            </div>
            <div className="info-item">
              <label>Etapa Actual</label>
              <span>{juicio.etapa_actual}</span>
            </div>
            <div className="info-item">
              <label>Fecha Presentación</label>
              <span>{new Date(juicio.fecha_presentacion).toLocaleDateString('es-MX')}</span>
            </div>
            <div className="info-item">
              <label>Asistente</label>
              <span>{juicio.asistente_id || '-'}</span>
            </div>
          </div>
        </section>

        <section className="section">
          <h3>Timeline de Etapas Procesales</h3>
          <div className="timeline">
            {etapas.map((etapa, index) => (
              <div key={index} className={`timeline-item ${index <= etapaActualIndex ? 'completed' : ''} ${etapa === juicio.etapa_actual ? 'active' : ''}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-label">{etapa}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h3>Garantías</h3>
          <div className="garantias-grid">
            <div className="garantia-item">
              <label>Garantías Muebles</label>
              <p className="text">{juicio.garantias_muebles || 'No especificadas'}</p>
            </div>
            <div className="garantia-item">
              <label>Garantías Inmuebles</label>
              <p className="text">{juicio.garantias_inmuebles || 'No especificadas'}</p>
            </div>
            <div className="garantia-item">
              <label>Lugar de Gravamen</label>
              <p className="text">{juicio.lugar_gravamen || 'No especificado'}</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h3>Historial de Avances</h3>
            <button
              onClick={() => navigate(`/juicios/${juicio.id}/avance/new`)}
              className="btn-small btn-secondary"
            >
              + Nuevo Avance
            </button>
          </div>
          <AvancesList avances={avances} />
        </section>
      </div>
    </div>
  );
};
