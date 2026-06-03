import React from 'react';

interface Avance {
  id: number;
  juicio_id: number;
  fecha_avance: string;
  etapa_id: number;
  accion_id: number;
  descripcion?: string;
}

interface AvancesListProps {
  avances: Avance[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const AvancesList: React.FC<AvancesListProps> = ({
  avances,
  onEdit,
  onDelete,
}) => {
  if (avances.length === 0) {
    return <p className="empty-state">Sin avances registrados</p>;
  }

  return (
    <div className="avances-timeline">
      {avances.map((avance, index) => (
        <div key={avance.id} className="avance-item">
          <div className="avance-date">
            {new Date(avance.fecha_avance).toLocaleDateString('es-MX')}
          </div>
          <div className="avance-content">
            <h4>Etapa {avance.etapa_id}</h4>
            {avance.descripcion && <p>{avance.descripcion}</p>}
            {(onEdit || onDelete) && (
              <div className="avance-actions">
                {onEdit && (
                  <button
                    onClick={() => onEdit(avance.id)}
                    className="btn-small btn-secondary"
                  >
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(avance.id)}
                    className="btn-small btn-danger"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
