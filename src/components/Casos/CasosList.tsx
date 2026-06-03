import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCasos } from '../../hooks/useCasos';

interface FiltrosState {
  estado: string;
  numero_caso: string;
  abogado_asignado_id?: string;
  cliente_id?: string;
}

export const CasosList: React.FC = () => {
  const navigate = useNavigate();
  const { casos, cargando, error, obtenerCasos } = useCasos();
  const [filtros, setFiltros] = useState<FiltrosState>({
    estado: '',
    numero_caso: '',
  });
  const [pagina, setPagina] = useState(0);
  const itemsPorPagina = 10;

  // Cargar casos cuando cambian los filtros
  useEffect(() => {
    obtenerCasos(filtros);
  }, [filtros, obtenerCasos]);

  const handleFiltroChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    setPagina(0);
  };

  const casosPaginados = casos.slice(
    pagina * itemsPorPagina,
    (pagina + 1) * itemsPorPagina
  );
  const totalPaginas = Math.ceil(casos.length / itemsPorPagina);

  // Mapeo de estados para las opciones del dropdown
  const estadosCaso = [
    'abierto',
    'en_juicio',
    'sentencia',
    'apelacion',
    'terminado',
  ];

  return (
    <div className="casos-list">
      <div className="list-header">
        <h2>Gestión de Casos</h2>
        <button
          onClick={() => navigate('/casos/new')}
          className="btn-primary"
        >
          + Nuevo Caso
        </button>
      </div>

      <div className="filtros">
        <input
          type="text"
          name="numero_caso"
          placeholder="Buscar por No. Caso"
          value={filtros.numero_caso}
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
          {estadosCaso.map((estado) => (
            <option key={estado} value={estado}>
              {estado.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {cargando ? (
        <div className="loading">Cargando casos...</div>
      ) : casos.length === 0 ? (
        <div className="empty-state">No hay casos registrados</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>No. Caso</th>
                <th>Cliente</th>
                <th>Demandado Principal</th>
                <th>Cuantía</th>
                <th>Estado</th>
                <th>Abogado Asignado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {casosPaginados.map((caso) => (
                <tr key={caso.id}>
                  <td className="numero-caso">
                    <strong>{caso.numero_caso}</strong>
                  </td>
                  <td>{caso.cliente_nombre || '-'}</td>
                  <td>{caso.demandado_principal || '-'}</td>
                  <td className="numeric">
                    ${(caso.cuantia || 0).toLocaleString('es-MX')}
                  </td>
                  <td>
                    <span className={`badge badge-${caso.estado}`}>
                      {caso.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{caso.abogado_asignado_id || '-'}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/casos/${caso.id}`)}
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
              <span className="pagination-info">
                {pagina + 1} de {totalPaginas}
              </span>
              <button
                onClick={() =>
                  setPagina(Math.min(totalPaginas - 1, pagina + 1))
                }
                disabled={pagina === totalPaginas - 1}
                className="btn-small"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .casos-list {
          padding: 0;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .list-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: opacity 0.2s;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .filtros {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-input {
          padding: 0.625rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .error-message {
          background: #fee;
          border-left: 4px solid #f44;
          color: #c00;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 13px;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #999;
          font-size: 14px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          background: white;
        }

        .table thead {
          background: #f5f5f5;
          border-bottom: 2px solid #ddd;
        }

        .table th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: #333;
        }

        .table td {
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
        }

        .table tbody tr:hover {
          background: #f9f9f9;
        }

        .numero-caso {
          color: #667eea;
          font-weight: 600;
        }

        .numeric {
          text-align: right;
          font-family: monospace;
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-abierto {
          background: #d4edda;
          color: #155724;
        }

        .badge-en_juicio {
          background: #cce5ff;
          color: #0056b3;
        }

        .badge-sentencia {
          background: #fff3cd;
          color: #856404;
        }

        .badge-apelacion {
          background: #f8d7da;
          color: #721c24;
        }

        .badge-terminado {
          background: #e2e3e5;
          color: #383d41;
        }

        .btn-small {
          padding: 0.35rem 0.75rem;
          border: 1px solid #ddd;
          background: white;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .btn-small:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #999;
        }

        .btn-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          color: #667eea;
          border-color: #667eea;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #667eea;
          color: white;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .pagination-info {
          font-size: 13px;
          color: #666;
          min-width: 80px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .filtros {
            grid-template-columns: 1fr;
          }

          .table {
            font-size: 11px;
          }

          .table th,
          .table td {
            padding: 0.5rem;
          }

          .list-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
