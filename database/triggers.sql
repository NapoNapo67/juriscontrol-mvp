-- netlify/functions/triggers.sql
-- SQL Triggers para FASE 6: Notificaciones & IA

-- Trigger: Nuevo avance → webhook notificaciones
CREATE OR REPLACE FUNCTION trigger_nuevo_avance()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar webhook de notificaciones
  PERFORM
    net.http_post(
      url:='https://tu-netlify-domain.netlify.app/.netlify/functions/notifications',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', current_setting('app.webhook_secret')
      ),
      body:=jsonb_build_object(
        'type', 'INSERT',
        'table', 'avances_juicio',
        'record', row_to_json(NEW)
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nuevo_avance
AFTER INSERT ON avances_juicio
FOR EACH ROW
EXECUTE FUNCTION trigger_nuevo_avance();

-- Trigger: Cambio de estado caso → webhook alertas
CREATE OR REPLACE FUNCTION trigger_cambio_estado_caso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    PERFORM
      net.http_post(
        url:='https://tu-netlify-domain.netlify.app/.netlify/functions/smart-alerts',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', current_setting('app.webhook_secret')
        ),
        body:=jsonb_build_object(
          'type', 'UPDATE',
          'table', 'casos',
          'record', jsonb_build_object('new', row_to_json(NEW), 'old', row_to_json(OLD))
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cambio_estado_caso
AFTER UPDATE ON casos
FOR EACH ROW
EXECUTE FUNCTION trigger_cambio_estado_caso();

-- Trigger: Cambio de etapa juicio → webhook alertas
CREATE OR REPLACE FUNCTION trigger_cambio_etapa_juicio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.etapa_actual IS DISTINCT FROM OLD.etapa_actual THEN
    PERFORM
      net.http_post(
        url:='https://tu-netlify-domain.netlify.app/.netlify/functions/smart-alerts',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', current_setting('app.webhook_secret')
        ),
        body:=jsonb_build_object(
          'type', 'UPDATE',
          'table', 'juicios',
          'record', jsonb_build_object('new', row_to_json(NEW), 'old', row_to_json(OLD))
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cambio_etapa_juicio
AFTER UPDATE ON juicios
FOR EACH ROW
EXECUTE FUNCTION trigger_cambio_etapa_juicio();

-- Trigger: Nuevo avance → trigger IA sugerencias
CREATE OR REPLACE FUNCTION trigger_ia_sugerencias_avance()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar función IA (asincrónico via HTTP)
  PERFORM
    net.http_post(
      url:='https://tu-netlify-domain.netlify.app/.netlify/functions/ai-suggestions',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body:=jsonb_build_object(
        'action', 'sugerencia-proximo-paso',
        'entityId', NEW.juicio_id
      ),
      timeout_milliseconds:=5000
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ia_sugerencias_avance
AFTER INSERT ON avances_juicio
FOR EACH ROW
EXECUTE FUNCTION trigger_ia_sugerencias_avance();

-- Trigger: Cambio de estado caso → trigger IA análisis riesgo
CREATE OR REPLACE FUNCTION trigger_ia_analisis_riesgo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    PERFORM
      net.http_post(
        url:='https://tu-netlify-domain.netlify.app/.netlify/functions/ai-suggestions',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body:=jsonb_build_object(
          'action', 'analizar-riesgo',
          'entityId', NEW.id
        ),
        timeout_milliseconds:=5000
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ia_analisis_riesgo
AFTER UPDATE ON casos
FOR EACH ROW
EXECUTE FUNCTION trigger_ia_analisis_riesgo();

-- Función para marcar notificaciones como leídas
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(notif_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE notificaciones
  SET leida = true, fecha_lectura = NOW()
  WHERE id = notif_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener notificaciones no leídas de usuario
CREATE OR REPLACE FUNCTION obtener_notificaciones_no_leidas(user_id UUID)
RETURNS TABLE (
  id INTEGER,
  tipo TEXT,
  titulo TEXT,
  descripcion TEXT,
  prioridad INTEGER,
  fecha_creacion TIMESTAMP,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.tipo,
    n.titulo,
    n.descripcion,
    n.prioridad,
    n.fecha_creacion,
    n.metadata
  FROM notificaciones n
  WHERE n.usuario_id = user_id
    AND n.leida = false
    AND n.activa = true
  ORDER BY n.prioridad DESC, n.fecha_creacion DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para cleanup de notificaciones antiguas
CREATE OR REPLACE FUNCTION limpiar_notificaciones_antiguas()
RETURNS void AS $$
BEGIN
  UPDATE notificaciones
  SET activa = false
  WHERE fecha_creacion < NOW() - INTERVAL '90 days'
    AND leida = true;
  
  DELETE FROM notificaciones
  WHERE fecha_creacion < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- Grant permisos para funciones
GRANT EXECUTE ON FUNCTION marcar_notificacion_leida TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_notificaciones_no_leidas TO authenticated;
GRANT EXECUTE ON FUNCTION limpiar_notificaciones_antiguas TO postgres;

-- Crear índices para performance
CREATE INDEX idx_notificaciones_usuario_leida ON notificaciones(usuario_id, leida);
CREATE INDEX idx_notificaciones_prioridad ON notificaciones(prioridad, fecha_creacion DESC);
CREATE INDEX idx_casos_metadata_riesgo ON casos USING GIN(metadata);
CREATE INDEX idx_juicios_metadata_prediccion ON juicios USING GIN(metadata);
CREATE INDEX idx_documentos_metadata_clasificacion ON documentos USING GIN(metadata);

-- Crear tabla de logs para auditoría
CREATE TABLE IF NOT EXISTS audit_alerts (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  result JSONB,
  error_message TEXT
);

CREATE INDEX idx_audit_alerts_timestamp ON audit_alerts(timestamp DESC);
CREATE INDEX idx_audit_alerts_action ON audit_alerts(action);

-- Policy: usuarios ven solo sus notificaciones
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias notificaciones"
ON notificaciones
FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Admin ve todas las notificaciones"
ON notificaciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.user_id = auth.uid()
    AND perfiles.rol = 'super_admin'
  )
);

-- Crear tabla metadata_log para tracking de cambios IA
CREATE TABLE IF NOT EXISTS metadata_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  tabla TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  cambio_anterior JSONB,
  cambio_nuevo JSONB,
  razon TEXT
);

CREATE INDEX idx_metadata_log_tabla_entity ON metadata_log(tabla, entity_id);
CREATE INDEX idx_metadata_log_timestamp ON metadata_log(timestamp DESC);
