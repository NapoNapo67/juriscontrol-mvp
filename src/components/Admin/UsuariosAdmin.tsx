import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Perfil {
  id: string;
  user_id: string;
  rol: string;
  zona_id: number | null;
  regional_id: number | null;
  activo: boolean;
  email?: string;
}

export const UsuariosAdmin: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    rol: 'asistente',
    zona_id: null,
    regional_id: null,
  });

  const [confirmacion, setConfirmacion] = useState<{
    accion: string;
    usuarioId: string;
  } | null>(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('perfiles')
        .select('*')
        .order('id', { ascending: true });

      if (err) throw err;

      // Obtener emails de auth
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      const usuariosConEmail = (data || []).map((u) => ({
        ...u,
        email: authUsers?.users.find((au) => au.id === u.user_id)?.email || 'N/A',
      }));

      setUsuarios(usuariosConEmail);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.email || !formData.rol) {
        setError('Email y Rol son requeridos');
        return;
      }

      // Crear usuario en Auth
      const { data: newUser, error: errAuth } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: Math.random().toString(36).slice(-12),
        email_confirm: true,
      });

      if (errAuth) throw errAuth;

      // Crear perfil
      const { error: errPerfil } = await supabase.from('perfiles').insert([
        {
          user_id: newUser.user.id,
          rol: formData.rol,
          zona_id: formData.zona_id,
          regional_id: formData.regional_id,
          activo: true,
        },
      ]);

      if (errPerfil) throw errPerfil;

      setFormData({ email: '', rol: 'asistente', zona_id: null, regional_id: null });
      setMostrarFormulario(false);
      await cargarUsuarios();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDesactivar = async (usuarioId: string) => {
    try {
      const { error: err } = await supabase
        .from('perfiles')
        .update({ activo: false })
        .eq('id', usuarioId);

      if (err) throw err;

      setConfirmacion(null);
      await cargarUsuarios();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleActivar = async (usuarioId: string) => {
    try {
      const { error: err } = await supabase
        .from('perfiles')
        .update({ activo: true })
        .eq('id', usuarioId);

      if (err) throw err;

      await cargarUsuarios();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (cargando) return <div className="loading">Cargando usuarios...</div>;

  return (
    <div className="usuarios-admin">
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="btn-primary btn-small"
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Crear Usuario'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {mostrarFormulario && (
        <form onSubmit={handleCrear} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="rol">Rol *</label>
              <select
                id="rol"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="form-input"
              >
                <option value="super_admin">Super Admin</option>
                <option value="coordinador">Coordinador</option>
                <option value="asistente">Asistente</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zona_id">Zona</label>
              <select
                id="zona_id"
                value={formData.zona_id || ''}
                onChange={(e) =>
                  setFormData({ ...formData, zona_id: e.target.value ? parseInt(e.target.value) : null })
                }
                className="form-input"
              >
                <option value="">Ninguna</option>
                <option value="1">Zona 1</option>
                <option value="2">Zona 2</option>
                <option value="3">Zona 3</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="regional_id">Regional</label>
              <select
                id="regional_id"
                value={formData.regional_id || ''}
                onChange={(e) =>
                  setFormData({ ...formData, regional_id: e.target.value ? parseInt(e.target.value) : null })
                }
                className="form-input"
              >
                <option value="">Ninguna</option>
                <option value="1">Regional 1</option>
                <option value="2">Regional 2</option>
                <option value="3">Regional 3</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Crear Usuario
          </button>
        </form>
      )}

      {usuarios.length === 0 ? (
        <div className="empty-state">No hay usuarios registrados</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol</th>
              <th>Zona</th>
              <th>Regional</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.email}</td>
                <td>
                  <span className="badge" style={{ textTransform: 'capitalize' }}>
                    {usuario.rol}
                  </span>
                </td>
                <td>{usuario.zona_id || '-'}</td>
                <td>{usuario.regional_id || '-'}</td>
                <td>
                  <span className={`badge badge-${usuario.activo ? 'activo' : 'archivado'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  {usuario.activo ? (
                    <button
                      onClick={() => setConfirmacion({ accion: 'desactivar', usuarioId: usuario.id })}
                      className="btn-small btn-danger"
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivar(usuario.id)}
                      className="btn-small btn-secondary"
                    >
                      Activar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmacion && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>⚠️ Confirmar Acción</h3>
            <p>¿Desactivar este usuario? Se mantendrán los datos históricos.</p>
            <div className="modal-actions">
              <button
                onClick={() => handleDesactivar(confirmacion.usuarioId)}
                className="btn-danger"
              >
                Confirmar
              </button>
              <button onClick={() => setConfirmacion(null)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .usuarios-admin {
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
      `}</style>
    </div>
  );
};
