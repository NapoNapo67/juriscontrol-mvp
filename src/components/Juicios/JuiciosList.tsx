import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJuicios } from '../../hooks/useJuicios';

export const JuiciosList: React.FC = () => {
  const navigate = useNavigate();
  const { juicios, cargando, error, obtenerJuicios } = useJuicios();
  const [filtros, setFiltros] = useState({
    estado: '',
    etapa: '',
    juzgado_id: '',
    numero_expediente: '',
  });
  const [pagina, setPagina] = useState(0);
  const itemsPorPagina = 10;

  useEffect(() => {
    obtenerJuicios(filtros);
  }, [filtros]);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
    setPagina(0);
  };

  const juiciosPaginados = juicios.slice(pagina * itemsPorPagina, (pagina + 1) * itemsPorPagina);
  const totalPaginas = Math.ceil(juicios.length / itemsPorPagina);

  return (
    <div className="juicios-list">
      <div className="list-header">
        <h2>Gestión de Juicios</h2>
        <button
          onClick={() => navigate('/juicios/new')}
          className="btn-primary"
        >
          + Nuevo Juicio
        </button>
      </div>

      <div className="filtros">
        <input
          type="text"
          name="numero_expediente"
          placeholder="Buscar por No. Expediente"
          value={filtros.numero_expediente}
          onChange={handleFiltroChange}
          className="form-input"
        />
        <select
          name="estado"
          value={filtros.estado}
          onChange={handleFiltroChange}
          className="form-input"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="sentenciado">Sentenciado</option>
          <option value="en_remate">En Remate</option>
          <option value="terminado">Terminado</option>
        </select>
        <select
          name="etapa"
          value={filtros.etapa}
          onChange={handleFiltroChange}
          className="form-input"
        >
          <option value="">Todas las etapas</option>
          <option value="1">Presentación Demanda</option>
          <option value="2">Radicación</option>
          <option value="3">Demanda Admitida</option>
          <option value="4">Sentencia</option>
          <option value="5">Apelación</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {cargando ? (
        <div className="loading">Cargando...</div>
      ) : juicios.length === 0 ? (
        <div className="empty-state">No hay juicios registrados</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>No. Expediente</th>
                <th>Juzgado</th>
                <th>Caso</th>
                <th>Estado</th>
                <th>Etapa</th>
                <th>Fecha Presentación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {juiciosPaginados.map((juicio) => (
                <tr key={juicio.id}>
                  <td>{juicio.numero_expediente}</td>
                  <td>{juicio.juzgado_id}</td>
                  <td>{juicio.caso_id}</td>
                  <td>
                    <span className={`badge badge-${juicio.estado}`}>
                      {juicio.estado}
                    </span>
                  </td>
                  <td>{juicio.etapa_actual}</td>
                  <td>{new Date(juicio.fecha_presentacion).toLocaleDateString('es-MX')}</td>
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

          {totalPaginas > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagina(Math.max(0, pagina - 1))}
                disabled={pagina === 0}
                className="btn-small"
              >
                ← Anterior
              </button>
              <span>{pagina + 1} de {totalPaginas}</span>
              <button
                onClick={() => setPagina(Math.min(totalPaginas - 1, pagina + 1))}
                disabled={pagina === totalPaginas - 1}
                className="btn-small"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
