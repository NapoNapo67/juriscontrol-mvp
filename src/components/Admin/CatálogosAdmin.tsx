import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type CatalogoTipo = 'tipos_juicio' | 'tipos_credito' | 'etapas' | 'giros' | 'areas' | 'tipos_baja' | 'tipos_gasto';

interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
}

const CATALOGOS: { label: string; tabla: CatalogoTipo }[] = [
  { label: 'Tipos de Juicio', tabla: 'tipos_juicio' },
  { label: 'Tipos de Crédito', tabla: 'tipos_credito' },
  { label: 'Etapas Procesales', tabla: 'etapas_procesales' },
  { label: 'Giros del Deudor', tabla: 'giros_deudor' },
  { label: 'Áreas', tabla: 'areas_banco' },
  { label: 'Tipos de Baja', tabla: 'tipos_baja' },
  { label: 'Tipos de Gasto', tabla: 'tipos_gasto' },
];

export const CatálogosAdmin: React.FC = () => {
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState<CatalogoTipo>('tipos_juicio');
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    orden: 0,
  });

  const [confirmacion, setConfirmacion] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  useEffect(() => {
    cargarCatalogo(catalogoSeleccionado);
  }, [catalogoSeleccionado]);

  const cargarCatalogo = async (tabla: CatalogoTipo) => {
    setCargando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from(tabla)
        .select('*')
        .order('id', { ascending: true });

      if (err) throw err;

      setItems(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.nombre) {
        setError('El nombre es requerido');
        return;
      }

      if (editando) {
        // Actualizar
        const { error: err } = await supabase
          .from(catalogoSeleccionado)
          .update({
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            orden: formData.orden || null,
          })
          .eq('id', editando);

        if (err) throw err;
      } else {
        // Crear
        const { error: err } = await supabase.from(catalogoSeleccionado).insert([
          {
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            orden: formData.orden || null,
          },
        ]);

        if (err) throw err;
      }

      setFormData({ nombre: '', descripcion: '', orden: 0 });
      setEditando(null);
      setMostrarFormulario(false);
      await cargarCatalogo(catalogoSeleccionado);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditar = (item: CatalogoItem) => {
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      orden: item.orden || 0,
    });
    setEditando(item.id);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id: number) => {
    try {
      const { error: err } = await supabase
        .from(catalogoSeleccionado)
        .delete()
        .eq('id', id);

      if (err) throw err;

      setConfirmacion(null);
      await cargarCatalogo(catalogoSeleccionado);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelar = () => {
    setFormData({ nombre: '', descripcion: '', orden: 0 });
    setEditando(null);
    setMostrarFormulario(false);
  };

  return (
    <div className="catalogos-admin">
      <div className="section-header">
        <h2>Gestión de Catálogos</h2>
      </div>

      <div className="catalogo-selector">
        <label htmlFor="catalogo">Seleccionar Catálogo:</label>
        <select
          id="catalogo"
          value={catalogoSeleccionado}
          onChange={(e) => setCatalogoSeleccionado(e.target.value as CatalogoTipo)}
          className="form-input"
        >
          {CATALOGOS.map((c) => (
            <option key={c.tabla} value={c.tabla}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="actions-header">
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="btn-primary btn-small"
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Agregar Item'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {mostrarFormulario && (
        <form onSubmit={handleGuardar} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="orden">Orden</label>
              <input
                id="orden"
                type="number"
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={handleCancelar} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <div className="loading">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No hay items en este catálogo</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Orden</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>{item.nombre}</td>
                <td>{item.descripcion || '-'}</td>
                <td>{item.orden || '-'}</td>
                <td>
                  <button
                    onClick={() => handleEditar(item)}
                    className="btn-small btn-secondary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() =>
                      setConfirmacion({ id: item.id, nombre: item.nombre })
                    }
                    className="btn-small btn-danger"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmacion && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>⚠️ Eliminar Item</h3>
            <p>¿Deseas eliminar "{confirmacion.nombre}"? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button
                onClick={() => handleEliminar(confirmacion.id)}
                className="btn-danger"
              >
                Eliminar
              </button>
              <button onClick={() => setConfirmacion(null)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .catalogos-admin {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .catalogo-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--light);
          padding: 1rem;
          border-radius: var(--radius);
        }

        .catalogo-selector label {
          font-weight: 600;
          white-space: nowrap;
        }

        .catalogo-selector .form-input {
          min-width: 250px;
        }

        .actions-header {
          display: flex;
          justify-content: flex-end;
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          padding: 2rem;
          border-radius: var(--radius);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          max-width: 400px;
        }

        .modal h3 {
          margin: 0 0 1rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .catalogo-selector {
            flex-direction: column;
            align-items: flex-start;
          }

          .catalogo-selector .form-input {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
