import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useJuicios } from '../../hooks/useJuicios';

export const JuicioForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { juicio, cargando, error, crearJuicio, actualizarJuicio, obtenerJuicio } = useJuicios();

  const [formData, setFormData] = useState({
    numero_expediente: '',
    caso_id: parseInt(searchParams.get('caso_id') || '0') || undefined,
    juzgado_id: 1,
    tipo_juicio_id: 1,
    estado: 'activo',
    etapa_actual: 'PRESENTACIÓN DEMANDA',
    fecha_presentacion: new Date().toISOString().split('T')[0],
    asistente_id: '',
    garantias_muebles: '',
    garantias_inmuebles: '',
    lugar_gravamen: '',
  });

  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      obtenerJuicio(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (juicio) {
      setFormData({
        numero_expediente: juicio.numero_expediente,
        caso_id: juicio.caso_id,
        juzgado_id: juicio.juzgado_id,
        tipo_juicio_id: juicio.tipo_juicio_id,
        estado: juicio.estado,
        etapa_actual: juicio.etapa_actual,
        fecha_presentacion: juicio.fecha_presentacion.split('T')[0],
        asistente_id: juicio.asistente_id || '',
        garantias_muebles: juicio.garantias_muebles || '',
        garantias_inmuebles: juicio.garantias_inmuebles || '',
        lugar_gravamen: juicio.lugar_gravamen || '',
      });
    }
  }, [juicio]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);
    setEnviando(true);

    try {
      if (!formData.numero_expediente || !formData.caso_id) {
        setErrorForm('Por favor completa los campos requeridos');
        setEnviando(false);
        return;
      }

      if (id) {
        await actualizarJuicio(parseInt(id), formData);
      } else {
        const nuevoId = await crearJuicio(formData);
        if (!nuevoId) throw new Error('Error creando juicio');
      }

      navigate('/juicios');
    } catch (err: any) {
      setErrorForm(err.message || 'Error guardando juicio');
    } finally {
      setEnviando(false);
    }
  };

  if (id && cargando) return <div className="loading">Cargando...</div>;
  if (id && error) return <div className="error-message">{error}</div>;

  return (
    <div className="juicio-form">
      <h2>{id ? 'Editar Juicio' : 'Nuevo Juicio'}</h2>

      {errorForm && <div className="error-message">{errorForm}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numero_expediente">No. Expediente *</label>
            <input
              id="numero_expediente"
              name="numero_expediente"
              type="text"
              value={formData.numero_expediente}
              onChange={handleChange}
              className="form-input"
              disabled={enviando}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="caso_id">Caso ID *</label>
            <input
              id="caso_id"
              name="caso_id"
              type="number"
              value={formData.caso_id || ''}
              onChange={handleChange}
              className="form-input"
              disabled={enviando || !!searchParams.get('caso_id')}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="juzgado_id">Juzgado</label>
            <select
              id="juzgado_id"
              name="juzgado_id"
              value={formData.juzgado_id}
              onChange={handleChange}
              className="form-input"
              disabled={enviando}
            >
              <option value="1">Juzgado 1</option>
              <option value="2">Juzgado 2</option>
              <option value="3">Juzgado 3</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tipo_juicio_id">Tipo de Juicio</label>
            <select
              id="tipo_juicio_id"
              name="tipo_juicio_id"
              value={formData.tipo_juicio_id}
              onChange={handleChange}
              className="form-input"
              disabled={enviando}
            >
              <option value="1">Ejecutivo Mercantil</option>
              <option value="2">Ordinario Mercantil</option>
              <option value="3">Especial Hipotecario</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fecha_presentacion">Fecha Presentación</label>
            <input
              id="fecha_presentacion"
              name="fecha_presentacion"
              type="date"
              value={formData.fecha_presentacion}
              onChange={handleChange}
              className="form-input"
              disabled={enviando}
            />
          </div>
          <div className="form-group">
            <label htmlFor="etapa_actual">Etapa Actual</label>
            <select
              id="etapa_actual"
              name="etapa_actual"
              value={formData.etapa_actual}
              onChange={handleChange}
              className="form-input"
              disabled={enviando}
            >
              <option value="PRESENTACIÓN DEMANDA">Presentación Demanda</option>
              <option value="RADICACIÓN">Radicación</option>
              <option value="DEMANDA ADMITIDA">Demanda Admitida</option>
              <option value="SENTENCIA">Sentencia</option>
              <option value="APELACIÓN">Apelación</option>
              <option value="ADJUDICACIÓN">Adjudicación</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="form-input"
              disabled={enviando}
            >
              <option value="activo">Activo</option>
              <option value="sentenciado">Sentenciado</option>
              <option value="en_remate">En Remate</option>
              <option value="terminado">Terminado</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="asistente_id">Asistente</label>
            <select
              id="asistente_id"
              name="asistente_id"
              value={formData.asistente_id}
              onChange={handleChange}
              className="form-input"
              disabled={enviando}
            >
              <option value="">Seleccionar asistente</option>
              <option value="1">LIC. MILLÁN</option>
              <option value="2">LIC. LÓPEZ</option>
              <option value="3">LIC. MORALES</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="garantias_muebles">Garantías Muebles</label>
          <textarea
            id="garantias_muebles"
            name="garantias_muebles"
            value={formData.garantias_muebles}
            onChange={handleChange}
            className="form-textarea"
            disabled={enviando}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="garantias_inmuebles">Garantías Inmuebles</label>
          <textarea
            id="garantias_inmuebles"
            name="garantias_inmuebles"
            value={formData.garantias_inmuebles}
            onChange={handleChange}
            className="form-textarea"
            disabled={enviando}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lugar_gravamen">Lugar de Gravamen</label>
          <input
            id="lugar_gravamen"
            name="lugar_gravamen"
            type="text"
            value={formData.lugar_gravamen}
            onChange={handleChange}
            className="form-input"
            disabled={enviando}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={enviando}
            className="btn-primary"
          >
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/juicios')}
            className="btn-secondary"
            disabled={enviando}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
