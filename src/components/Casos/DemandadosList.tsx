import React from 'react';

interface Demandado {
  id: number;
  nombre: string;
  rfc?: string;
  domicilio?: string;
  tipo?: string;
}

interface DemandadosListProps {
  demandados: Demandado[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const DemandadosList: React.FC<DemandadosListProps> = ({
  demandados,
  onEdit,
  onDelete,
}) => {
  if (demandados.length === 0) {
    return <p className="empty-state">Sin demandados registrados</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>RFC</th>
          <th>Domicilio</th>
          <th>Tipo</th>
          {(onEdit || onDelete) && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {demandados.map((demandado) => (
          <tr key={demandado.id}>
            <td>{demandado.nombre}</td>
            <td>{demandado.rfc || '-'}</td>
            <td>{demandado.domicilio || '-'}</td>
            <td>{demandado.tipo || '-'}</td>
            {(onEdit || onDelete) && (
              <td>
                {onEdit && (
                  <button
                    onClick={() => onEdit(demandado.id)}
                    className="btn-small btn-secondary"
                  >
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(demandado.id)}
                    className="btn-small btn-danger"
                  >
                    Eliminar
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
