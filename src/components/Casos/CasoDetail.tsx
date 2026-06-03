import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCasos } from '../../hooks/useCasos';
import { useJuicios } from '../../hooks/useJuicios';
import { DemandadosList } from './DemandadosList';

export const CasoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { caso, cargando, error, obtenerCaso, obtenerDemandados, obtenerAvalistas } = useCasos();
  const { juicios, obtenerJuicios } = useJuicios();
  const [demandados, setDemandados] = useState<any[]>([]);
  const [avalistas, setAvalistas] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      obtenerCaso(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (caso) {
      obtenerDemandados(caso.id).then(setDemandados);
      obtenerAvalistas(caso.id).then(setAvalistas);
      obtenerJuicios({ caso_id: caso.id });
    }
  }, [caso]);

  if (cargando) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!caso) return <div className="empty-state">Caso no encontrado</div>;

  return (
    <div className="caso-detail">
      <div className="detail-header">
        <h2>Caso {caso.numero_caso}</h2>
        <div className="detail-actions">
          <button
            onClick={() => navigate(`/casos/${caso.id}/edit`)}
            className="btn-primary btn-small"
          >
            Editar
          </button>
          <button
            onClick={() => navigate('/casos')}
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
              <label>No. Caso</label>
              <span>{caso.numero_caso}</span>
            </div>
            <div className="info-item">
              <label>Estado</label>
              <span className={`badge badge-${caso.estado}`}>{caso.estado}</span>
            </div>
            <div className="info-item">
              <label>Capital MN</label>
              <span>${caso.capital_mn?.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label>Capital ME</label>
              <span>${caso.capital_me?.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label>Giro Deudor</label>
              <span>{caso.giro_deudor_id}</span>
            </div>
            <div className="info-item">
              <label>Fecha de Creación</label>
              <span>{new Date(caso.fecha_creacion).toLocaleDateString('es-MX')}</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h3>Demandados</h3>
            <button className="btn-small btn-secondary">+ Agregar</button>
          </div>
          <DemandadosList demandados={demandados} />
        </section>

        <section className="section">
          <div className="section-header">
            <h3>Avalistas</h3>
            <button className="btn-small btn-secondary">+ Agregar</button>
          </div>
          {avalistas.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>RFC</th>
                </tr>
              </thead>
              <tbody>
                {avalistas.map((avalista) => (
                  <tr key={avalista.id}>
                    <td>{avalista.nombre}</td>
                    <td>{avalista.tipo}</td>
                    <td>{avalista.rfc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">Sin avalistas registrados</p>
          )}
        </section>

        <section className="section">
          <div className="section-header">
            <h3>Juicios</h3>
            <button
              onClick={() => navigate(`/juicios/new?caso_id=${caso.id}`)}
              className="btn-small btn-secondary"
            >
              + Nuevo Juicio
            </button>
          </div>
          {juicios.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>No. Expediente</th>
                  <th>Juzgado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {juicios.map((juicio) => (
                  <tr key={juicio.id}>
                    <td>{juicio.numero_expediente}</td>
                    <td>{juicio.juzgado_id}</td>
                    <td>{juicio.estado}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/juicios/${juicio.id}`)}
                        className="btn-small btn-secondary"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">Sin juicios registrados</p>
          )}
        </section>
      </div>
    </div>
  );
};
