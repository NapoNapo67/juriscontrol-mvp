import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCasos } from '../../hooks/useCasos';
import { useAuth } from '../../hooks/useAuth';

interface CasoFormData {
  numero_caso: string;
  cliente_nombre: string;
  demandado_principal: string;
  cuantia: number;
  estado: string;
  tipo_credito_id?: string;
  numero_credito?: string;
  abogado_asignado_id?: string;
  observaciones?: string;
}

export const CasoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orgActiva } = useAuth();
  const { caso, cargando, error, crearCaso, actualizarCaso, obtenerCaso } =
    useCasos();

  const [formData, setFormData] = useState<CasoFormData>({
    numero_caso: '',
    cliente_nombre: '',
    demandado_principal: '',
    cuantia: 0,
    estado: 'abierto',
    tipo_credito_id: '',
    numero_credito: '',
    abogado_asignado_id: '',
    observaciones: '',
  });

  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Cargar caso si estamos editando
  useEffect(() => {
    if (id && orgActiva?.id) {
      obtenerCaso(id);
    }
  }, [id, orgActiva?.id, obtenerCaso]);

  // Actualizar form cuando carga el caso
  useEffect(() => {
    if (caso) {
      setFormData({
        numero_caso: caso.numero_caso,
        cliente_nombre: caso.cliente_nombre || '',
        demandado_principal: caso.demandado_principal || '',
        cuantia: caso.cuantia || 0,
        estado: caso.estado,
        tipo_credito_id: caso.tipo_credito_id || '',
        numero_credito: caso.numero_credito || '',
        abogado_asignado_id: caso.abogado_asignado_id || '',
        observaciones: caso.observaciones || '',
      });
    }
  }, [caso]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue = name === 'cuantia' ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);
    setEnviando(true);

    try {
      // Validaciones
      if (!formData.numero_caso.trim()) {
        setErrorForm('Por favor ingresa el número de caso');
        setEnviando(false);
        return;
      }

      if (!formData.cliente_nombre.trim()) {
        setErrorForm('Por favor ingresa el nombre del cliente');
        setEnviando(false);
        return;
      }

      if (!formData.demandado_principal.trim()) {
        setErrorForm('Por favor ingresa el demandado principal');
        setEnviando(false);
        return;
      }

      if (formData.cuantia <= 0) {
        setErrorForm('Por favor ingresa una cuantía mayor a cero');
        setEnviando(false);
        return;
      }

      if (id) {
        // Editar
        await actualizarCaso(id, formData);
      } else {
        // Crear
        const nuevoId = await crearCaso(formData);
        if (!nuevoId) throw new Error('Error creando caso');
      }

      navigate('/casos');
    } catch (err: any) {
      setErrorForm(err.message || 'Error guardando caso');
    } finally {
      setEnviando(false);
    }
  };

  if (id && cargando) {
    return <div className="loading">Cargando caso...</div>;
  }

  if (id && error) {
    return <div className="error-message">{error}</div>;
  }

  if (!orgActiva) {
    return (
      <div className="error-message">
        No hay organización activa. Por favor selecciona una en el menú.
      </div>
    );
  }

  const estadosCaso = [
    { value: 'abierto', label: 'Abierto' },
    { value: 'en_juicio', label: 'En Juicio' },
    { value: 'sentencia', label: 'Sentencia' },
    { value: 'apelacion', label: 'Apelación' },
    { value: 'terminado', label: 'Terminado' },
  ];

  return (
    <div className="caso-form">
      <h2>{id ? 'Editar Caso' : 'Nuevo Caso'}</h2>
      <p className="form-subtitle">
        Organización: <strong>{orgActiva.nombre}</strong>
      </p>

      {errorForm && <div className="error-message">{errorForm}</div>}

      <form onSubmit={handleSubmit} className="form">
        {/* Fila 1: Número de Caso y Cliente */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numero_caso">No. Caso *</label>
            <input
              id="numero_caso"
              name="numero_caso"
              type="text"
              value={formData.numero_caso}
              onChange={handleChange}
              placeholder="ej: 2024-001-JUR"
              className="form-input"
              disabled={enviando}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cliente_nombre">Cliente *</label>
            <input
              id="cliente_nombre"
              name="cliente_nombre"
              type="text"
              value={formData.cliente_nombre}
              onChange={handleChange}
              placeholder="Nombre del cliente"
              className="form-input"
              disabled={enviando}
              required
            />
          </div>
        </div>

        {/* Fila 2: Demandado y Cuantía */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="demandado_principal">Demandado Principal *</label>
            <input
              id="demandado_principal"
              name="demandado_principal"
              type="text"
              value={formData.demandado_principal}
              onChange={handleChange}
              placeholder="Nombre del demandado"
              className="form-input"
              disabled={enviando}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cuantia">Cuantía ($) *</label>
            <input
              id="cuantia"
              name="cuantia"
              type="number"
              value={formData.cuantia}
              onChange={handleChange}
              placeholder="0.00"
              className="form-input"
              disabled={enviando}
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Fila 3: Estado y Tipo Crédito */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="estado">Estado del Caso *</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="form-input"
              disabled={enviando}
            >
              {estadosCaso.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tipo_credito_id">Tipo de Crédito</label>
            <input
              id="tipo_credito_id"
              name="tipo_credito_id"
              type="text"
              value={formData.tipo_credito_id}
              onChange={handleChange}
              placeholder="ID del tipo de crédito"
              className="form-input"
              disabled={enviando}
            />
          </div>
        </div>

        {/* Fila 4: Número de Crédito y Abogado */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numero_credito">No. Crédito</label>
            <input
              id="numero_credito"
              name="numero_credito"
              type="text"
              value={formData.numero_credito}
              onChange={handleChange}
              placeholder="Número de crédito"
              className="form-input"
              disabled={enviando}
            />
          </div>
          <div className="form-group">
            <label htmlFor="abogado_asignado_id">Abogado Asignado</label>
            <input
              id="abogado_asignado_id"
              name="abogado_asignado_id"
              type="text"
              value={formData.abogado_asignado_id}
              onChange={handleChange}
              placeholder="ID del abogado"
              className="form-input"
              disabled={enviando}
            />
          </div>
        </div>

        {/* Fila 5: Observaciones */}
        <div className="form-group full-width">
          <label htmlFor="observaciones">Observaciones</label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Notas adicionales sobre el caso..."
            className="form-input form-textarea"
            disabled={enviando}
            rows={4}
          />
        </div>

        {/* Acciones */}
        <div className="form-actions">
          <button type="submit" disabled={enviando} className="btn-primary">
            {enviando ? 'Guardando...' : id ? 'Actualizar Caso' : 'Crear Caso'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/casos')}
            className="btn-secondary"
            disabled={enviando}
          >
            Cancelar
          </button>
        </div>
      </form>

      <style>{`
        .caso-form {
          max-width: 900px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .caso-form h2 {
          margin-bottom: 0.5rem;
          font-size: 24px;
        }

        .form-subtitle {
          color: #666;
          font-size: 13px;
          margin-bottom: 1.5rem;
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

        .loading {
          text-align: center;
          padding: 2rem;
          color: #999;
          font-size: 14px;
        }

        .form {
          background: white;
          border-radius: 6px;
          padding: 1.5rem;
          border: 1px solid #ddd;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 13px;
          color: #333;
        }

        .form-input {
          padding: 0.625rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          box-sizing: border-box;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .form-input:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.625rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid #ddd;
          color: #333;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #999;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }

          .caso-form {
            padding: 1rem;
          }

          .form {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};
