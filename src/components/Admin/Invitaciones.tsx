import React, { useState, useEffect } from 'react';
import {
  obtenerTodasLasInvitaciones,
  crearInvitacion,
  cancelarInvitacion,
  InvitacionOrganizacion,
  TipoOrganizacion,
} from '../../lib/supabase';

interface FormData {
  email: string;
  nombre_invitado: string;
  tipo_organizacion: TipoOrganizacion;
  plan_id: string;
  nombre_organizacion: string;
  rfc_organizacion: string;
  notas: string;
}

const PLANES = [
  { id: 1, nombre: 'Pasante' },
  { id: 2, nombre: 'Despacho Pequeño' },
  { id: 3, nombre: 'Despacho Mediano' },
  { id: 4, nombre: 'Despacho Grande' },
  { id: 5, nombre: 'Empresa' },
];

const TIPOS_ORG: { value: TipoOrganizacion; label: string }[] = [
  { value: 'individual', label: 'Pasante Individual' },
  { value: 'despacho', label: 'Despacho' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'banco', label: 'Banco/Financiera' },
];

export const Invitaciones: React.FC = () => {
  // Estado de invitaciones
  const [invitaciones, setInvitaciones] = useState<InvitacionOrganizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    nombre_invitado: '',
    tipo_organizacion: 'despacho',
    plan_id: '2',
    nombre_organizacion: '',
    rfc_organizacion: '',
    notas: '',
  });

  // Cargar invitaciones al montar
  useEffect(() => {
    cargarInvitaciones();
  }, []);

  const cargarInvitaciones = async () => {
    setCargando(true);
    setError(null);
    try {
      const inv = await obtenerTodasLasInvitaciones();
      setInvitaciones(inv);
    } catch (err: any) {
      setError(err.message || 'Error cargando invitaciones');
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setEnviando(true);

    try {
      // Validaciones
      if (!formData.email.trim()) {
        setFormError('Por favor ingresa un correo electrónico');
        setEnviando(false);
        return;
      }

      if (!formData.nombre_organizacion.trim()) {
        setFormError('Por favor ingresa el nombre de la organización');
        setEnviando(false);
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setFormError('Correo electrónico inválido');
        setEnviando(false);
        return;
      }

      // Crear invitación
      await crearInvitacion(
        formData.email,
        formData.tipo_organizacion,
        parseInt(formData.plan_id),
        formData.nombre_organizacion,
        formData.rfc_organizacion || undefined,
        formData.nombre_invitado || undefined,
        formData.notas || undefined
      );

      // Limpiar formulario y recargar
      setFormData({
        email: '',
        nombre_invitado: '',
        tipo_organizacion: 'despacho',
        plan_id: '2',
        nombre_organizacion: '',
        rfc_organizacion: '',
        notas: '',
      });
      setMostrarForm(false);
      await cargarInvitaciones();
    } catch (err: any) {
      setFormError(err.message || 'Error creando invitación');
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelarInvitacion = async (invitacionId: string) => {
    if (
      !window.confirm(
        '¿Estás seguro que deseas cancelar esta invitación?'
      )
    ) {
      return;
    }

    try {
      await cancelarInvitacion(invitacionId);
      await cargarInvitaciones();
    } catch (err: any) {
      setError(err.message || 'Error cancelando invitación');
    }
  };

  const handleCopiarLink = (token: string) => {
    const link = `${window.location.origin}/aceptar-invitacion?token=${token}`;
    navigator.clipboard.writeText(link).then(
      () => {
        alert('Link copiado al portapapeles');
      },
      () => {
        alert('No se pudo copiar el link');
      }
    );
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; color: string; label: string }> = {
      pendiente: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
      aceptada: { bg: '#d4edda', color: '#155724', label: 'Aceptada' },
      expirada: { bg: '#f8d7da', color: '#721c24', label: 'Expirada' },
      cancelada: { bg: '#e2e3e5', color: '#383d41', label: 'Cancelada' },
    };
    const badge = badges[estado] || badges.pendiente;
    return (
      <span
        style={{
          background: badge.bg,
          color: badge.color,
          padding: '0.25rem 0.5rem',
          borderRadius: '3px',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        {badge.label}
      </span>
    );
  };

  if (cargando) {
    return (
      <div className="invitaciones-panel">
        <p className="loading-text">Cargando invitaciones...</p>
      </div>
    );
  }

  return (
    <div className="invitaciones-panel">
      <div className="invitaciones-header">
        <h2>Gestión de Invitaciones</h2>
        <button
          className="btn-crear-invitacion"
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '✕ Cancelar' : '+ Nueva Invitación'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {mostrarForm && (
        <div className="invitacion-form-container">
          <h3>Crear Nueva Invitación</h3>

          {formError && <div className="error-message">{formError}</div>}

          <form onSubmit={handleSubmit} className="invitacion-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico del Invitado *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="usuario@example.com"
                  disabled={enviando}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="nombre_invitado">Nombre del Invitado</label>
                <input
                  id="nombre_invitado"
                  type="text"
                  name="nombre_invitado"
                  value={formData.nombre_invitado}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez"
                  disabled={enviando}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre_organizacion">
                  Nombre Organización *
                </label>
                <input
                  id="nombre_organizacion"
                  type="text"
                  name="nombre_organizacion"
                  value={formData.nombre_organizacion}
                  onChange={handleInputChange}
                  placeholder="Despacho García & Asociados"
                  disabled={enviando}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rfc_organizacion">RFC Organización</label>
                <input
                  id="rfc_organizacion"
                  type="text"
                  name="rfc_organizacion"
                  value={formData.rfc_organizacion}
                  onChange={handleInputChange}
                  placeholder="ABC123456XYZ"
                  disabled={enviando}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tipo_organizacion">Tipo Organización *</label>
                <select
                  id="tipo_organizacion"
                  name="tipo_organizacion"
                  value={formData.tipo_organizacion}
                  onChange={handleInputChange}
                  disabled={enviando}
                  className="form-input"
                  required
                >
                  {TIPOS_ORG.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="plan_id">Plan *</label>
                <select
                  id="plan_id"
                  name="plan_id"
                  value={formData.plan_id}
                  onChange={handleInputChange}
                  disabled={enviando}
                  className="form-input"
                  required
                >
                  {PLANES.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas Internas</label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                placeholder="Notas sobre esta invitación..."
                disabled={enviando}
                className="form-input form-textarea"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="btn-submit"
            >
              {enviando ? 'Creando...' : 'Crear Invitación'}
            </button>
          </form>
        </div>
      )}

      <div className="invitaciones-list">
        {invitaciones.length === 0 ? (
          <p className="no-data">No hay invitaciones aún</p>
        ) : (
          <div className="table-container">
            <table className="invitaciones-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Organización</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Enviada</th>
                  <th>Expira</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invitaciones.map((inv) => (
                  <tr key={inv.id} className={`row-${inv.estado}`}>
                    <td>{inv.email_invitado}</td>
                    <td>{inv.nombre_organizacion}</td>
                    <td className="tipo-cell">
                      <span className="tipo-badge">
                        {inv.tipo_organizacion}
                      </span>
                    </td>
                    <td>{getEstadoBadge(inv.estado)}</td>
                    <td className="date-cell">
                      {new Date(inv.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="date-cell">
                      {new Date(inv.expires_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="actions-cell">
                      {inv.estado === 'pendiente' && (
                        <>
                          <button
                            className="btn-action btn-copy"
                            onClick={() => handleCopiarLink(inv.token)}
                            title="Copiar link de invitación"
                          >
                            📋 Copiar Link
                          </button>
                          <button
                            className="btn-action btn-cancel"
                            onClick={() => handleCancelarInvitacion(inv.id)}
                            title="Cancelar invitación"
                          >
                            ✕ Cancelar
                          </button>
                        </>
                      )}
                      {inv.estado === 'aceptada' && (
                        <span className="action-info">✓ Aceptada</span>
                      )}
                      {inv.estado === 'expirada' && (
                        <span className="action-info">⏰ Expirada</span>
                      )}
                      {inv.estado === 'cancelada' && (
                        <span className="action-info">✕ Cancelada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .invitaciones-panel {
          padding: 0;
        }

        .invitaciones-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .invitaciones-header h2 {
          font-size: 20px;
          margin: 0;
        }

        .btn-crear-invitacion {
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

        .btn-crear-invitacion:hover {
          opacity: 0.9;
        }

        .invitacion-form-container {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .invitacion-form-container h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 16px;
        }

        .invitacion-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
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
          background: #f0f0f0;
          color: #999;
          cursor: not-allowed;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: monospace;
        }

        .btn-submit {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          align-self: flex-start;
          transition: opacity 0.2s;
        }

        .btn-submit:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .invitaciones-list {
          margin-top: 2rem;
        }

        .no-data {
          text-align: center;
          color: #999;
          padding: 2rem;
          font-size: 14px;
        }

        .table-container {
          overflow-x: auto;
        }

        .invitaciones-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .invitaciones-table thead {
          background: #f5f5f5;
          border-bottom: 2px solid #ddd;
        }

        .invitaciones-table th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: #333;
        }

        .invitaciones-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
        }

        .invitaciones-table tbody tr:hover {
          background: #f9f9f9;
        }

        .invitaciones-table tbody tr.row-aceptada {
          opacity: 0.7;
        }

        .tipo-cell,
        .date-cell {
          font-size: 12px;
          color: #666;
        }

        .tipo-badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-action {
          background: transparent;
          border: 1px solid #ddd;
          padding: 0.35rem 0.75rem;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-copy {
          color: #667eea;
          border-color: #667eea;
        }

        .btn-copy:hover {
          background: #667eea;
          color: white;
        }

        .btn-cancel {
          color: #f44;
          border-color: #f44;
        }

        .btn-cancel:hover {
          background: #f44;
          color: white;
        }

        .action-info {
          color: #666;
          font-size: 12px;
          font-weight: 500;
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

        .loading-text {
          color: #999;
          font-size: 14px;
          padding: 2rem;
          text-align: center;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .invitaciones-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .btn-crear-invitacion {
            width: 100%;
          }

          .invitaciones-table {
            font-size: 12px;
          }

          .invitaciones-table th,
          .invitaciones-table td {
            padding: 0.5rem;
          }

          .actions-cell {
            flex-direction: column;
          }

          .btn-action {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
