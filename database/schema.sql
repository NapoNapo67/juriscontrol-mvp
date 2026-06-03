-- ============================================================================
-- JURISCONTROL WEB - SCHEMA SQL COMPLETO
-- PostgreSQL 14+ (Supabase compatible)
-- ============================================================================

-- ============================================================================
-- 1. TIPOS ENUM
-- ============================================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'coordinador', 'asistente', 'auditor');
CREATE TYPE moneda AS ENUM ('MXN', 'USD', 'EUR');
CREATE TYPE caso_estado AS ENUM ('activo', 'en_juicio', 'terminado', 'archivado');
CREATE TYPE juicio_estado AS ENUM ('activo', 'sentenciado', 'en_remate', 'terminado');
CREATE TYPE notificacion_tipo AS ENUM ('vencimiento', 'cambio_estado', 'nuevo_avance', 'asignacion', 'alerta_ia', 'sistema');
CREATE TYPE notificacion_prioridad AS ENUM ('baja', 'media', 'alta', 'critica');

-- ============================================================================
-- 2. TABLA: PERFILES
-- ============================================================================

CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol user_role NOT NULL DEFAULT 'asistente',
  zona_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE perfiles IS 'Perfiles de usuarios vinculados con auth.users de Supabase';
COMMENT ON COLUMN perfiles.rol IS 'Rol del usuario: super_admin, coordinador, asistente, auditor';
COMMENT ON COLUMN perfiles.zona_id IS 'Zona asignada (opcional para permisos regionales)';

-- ============================================================================
-- 3. TABLAS ORGANIZACIONALES
-- ============================================================================

CREATE TABLE regionales (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE regionales IS 'Divisiones regionales de la organización';

CREATE TABLE zonas (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  regional_id INTEGER NOT NULL REFERENCES regionales(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE zonas IS 'Zonas dentro de regionales';
CREATE INDEX idx_zonas_regional ON zonas(regional_id);

CREATE TABLE plazas (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  zona_id INTEGER NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE plazas IS 'Plazas dentro de zonas';
CREATE INDEX idx_plazas_zona ON plazas(zona_id);

CREATE TABLE sucursales (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  plaza_id INTEGER REFERENCES plazas(id) ON DELETE RESTRICT,
  zona_id INTEGER REFERENCES zonas(id) ON DELETE RESTRICT,
  regional_id INTEGER REFERENCES regionales(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE sucursales IS 'Sucursales operacionales';
CREATE INDEX idx_sucursales_plaza ON sucursales(plaza_id);
CREATE INDEX idx_sucursales_zona ON sucursales(zona_id);
CREATE INDEX idx_sucursales_regional ON sucursales(regional_id);

CREATE TABLE juzgados (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  zona_id INTEGER NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE juzgados IS 'Catálogo de juzgados donde se radican expedientes';
CREATE INDEX idx_juzgados_zona ON juzgados(zona_id);

CREATE TABLE asistentes (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  zona_id INTEGER NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
  perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE asistentes IS 'Asistentes jurídicos y abogados';
CREATE INDEX idx_asistentes_zona ON asistentes(zona_id);
CREATE INDEX idx_asistentes_perfil ON asistentes(perfil_id);

CREATE TABLE grupos_clientes (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  zona_id INTEGER NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE grupos_clientes IS 'Grupos o clasificación de clientes por zona';
CREATE INDEX idx_grupos_clientes_zona ON grupos_clientes(zona_id);

-- ============================================================================
-- 4. CATÁLOGOS FIJOS
-- ============================================================================

CREATE TABLE tipos_juicio (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE tipos_juicio IS 'Tipos de juicio: Mercantil, Civil, etc.';

CREATE TABLE tipos_credito (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE tipos_credito IS 'Tipos de crédito: Tarjeta, Préstamo, Hipotecario, etc.';

CREATE TABLE etapas_procesales (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  orden INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE etapas_procesales IS 'Etapas del procedimiento judicial ordenadas: Demanda, Contestación, Sentencia, etc.';
CREATE INDEX idx_etapas_procesales_orden ON etapas_procesales(orden);

CREATE TABLE giros_deudor (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE giros_deudor IS 'Giro o actividad económica del deudor';

CREATE TABLE areas_banco (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE areas_banco IS 'Área del banco acreedor que originó la cobranza';

CREATE TABLE tipos_baja (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE tipos_baja IS 'Razones de baja: Recuperado, Incobrable, Prescrito, etc.';

CREATE TABLE tipos_gasto (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE tipos_gasto IS 'Tipos de gastos: Honorarios, Peritajes, Notaría, etc.';

CREATE TABLE acciones_procesales (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  etapa_procesal_id INTEGER NOT NULL REFERENCES etapas_procesales(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE acciones_procesales IS 'Acciones o movimientos dentro de cada etapa procesal';
CREATE INDEX idx_acciones_procesales_etapa ON acciones_procesales(etapa_procesal_id);

-- ============================================================================
-- 5. TABLAS OPERATIVAS PRINCIPALES
-- ============================================================================

CREATE TABLE casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_caso VARCHAR(50) NOT NULL UNIQUE,
  fecha_turno DATE NOT NULL,
  sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
  asistente_id INTEGER NOT NULL REFERENCES asistentes(id) ON DELETE RESTRICT,
  tipo_credito_id INTEGER NOT NULL REFERENCES tipos_credito(id) ON DELETE RESTRICT,
  numero_credito VARCHAR(50),
  capital_mn NUMERIC(18,2),
  capital_vencido_mn NUMERIC(18,2),
  int_ordinarios_mn NUMERIC(18,2),
  int_moratorios_mn NUMERIC(18,2),
  moneda_ext moneda,
  capital_me NUMERIC(18,2),
  capital_vencido_me NUMERIC(18,2),
  int_ordinarios_me NUMERIC(18,2),
  int_moratorios_me NUMERIC(18,2),
  estado caso_estado NOT NULL DEFAULT 'activo',
  tiene_avalistas BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  creado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  actualizado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE casos IS 'Casos de cobranza principales';
COMMENT ON COLUMN casos.numero_caso IS 'Identificador único del caso';
COMMENT ON COLUMN casos.estado IS 'Estado actual del caso';
CREATE INDEX idx_casos_numero ON casos(numero_caso);
CREATE INDEX idx_casos_sucursal ON casos(sucursal_id);
CREATE INDEX idx_casos_asistente ON casos(asistente_id);
CREATE INDEX idx_casos_estado ON casos(estado);
CREATE INDEX idx_casos_created_at ON casos(created_at);
CREATE INDEX idx_casos_numero_trgm ON casos USING GIN(numero_caso gin_trgm_ops);

CREATE TABLE demandados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  nombre VARCHAR(250) NOT NULL,
  direccion VARCHAR(500),
  colonia VARCHAR(150),
  ciudad VARCHAR(100),
  estado_rep VARCHAR(100),
  codigo_postal VARCHAR(10),
  telefono VARCHAR(20),
  es_principal BOOLEAN DEFAULT FALSE,
  orden INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE demandados IS 'Personas demandadas en cada caso (deudores principales)';
CREATE INDEX idx_demandados_caso ON demandados(caso_id);
CREATE INDEX idx_demandados_nombre_trgm ON demandados USING GIN(nombre gin_trgm_ops);

CREATE TABLE avalistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  nombre VARCHAR(250) NOT NULL,
  direccion VARCHAR(500),
  colonia VARCHAR(150),
  ciudad VARCHAR(100),
  estado_rep VARCHAR(100),
  codigo_postal VARCHAR(10),
  telefono VARCHAR(20),
  orden INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE avalistas IS 'Avalistas o codemandados en cada caso';
CREATE INDEX idx_avalistas_caso ON avalistas(caso_id);
CREATE INDEX idx_avalistas_nombre_trgm ON avalistas USING GIN(nombre gin_trgm_ops);

CREATE TABLE juicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_expediente VARCHAR(50) NOT NULL,
  juzgado_id INTEGER NOT NULL REFERENCES juzgados(id) ON DELETE RESTRICT,
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE RESTRICT,
  tipo_juicio_id INTEGER NOT NULL REFERENCES tipos_juicio(id) ON DELETE RESTRICT,
  asistente_id INTEGER NOT NULL REFERENCES asistentes(id) ON DELETE RESTRICT,
  fecha_presentacion DATE,
  fecha_radicacion DATE,
  fecha_emplazamiento DATE,
  fecha_sentencia DATE,
  fecha_prim_almoneda DATE,
  fecha_segu_almoneda DATE,
  capital_demandado_mn NUMERIC(18,2),
  int_ordinarios_mn NUMERIC(18,2),
  int_moratorios_mn NUMERIC(18,2),
  cuantia_mn NUMERIC(18,2),
  saldo_mn NUMERIC(18,2),
  capital_demandado_me NUMERIC(18,2),
  int_ordinarios_me NUMERIC(18,2),
  int_moratorios_me NUMERIC(18,2),
  cuantia_me NUMERIC(18,2),
  saldo_me NUMERIC(18,2),
  valor_adjudicado NUMERIC(18,2),
  garantias_muebles TEXT,
  garantias_inmuebles TEXT,
  resumen_garantias TEXT,
  lugar_gravamen TEXT,
  estado juicio_estado NOT NULL DEFAULT 'activo',
  etapa_actual_id INTEGER REFERENCES etapas_procesales(id) ON DELETE SET NULL,
  fecha_baja DATE,
  tipo_baja_id INTEGER REFERENCES tipos_baja(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(numero_expediente, juzgado_id)
);

COMMENT ON TABLE juicios IS 'Procedimientos judiciales (expedientes) dentro de casos';
COMMENT ON COLUMN juicios.numero_expediente IS 'Número de expediente asignado por el juzgado';
COMMENT ON COLUMN juicios.estado IS 'Estado actual del juicio';
CREATE INDEX idx_juicios_numero_expediente ON juicios(numero_expediente);
CREATE INDEX idx_juicios_caso ON juicios(caso_id);
CREATE INDEX idx_juicios_juzgado ON juicios(juzgado_id);
CREATE INDEX idx_juicios_asistente ON juicios(asistente_id);
CREATE INDEX idx_juicios_estado ON juicios(estado);
CREATE INDEX idx_juicios_etapa_actual ON juicios(etapa_actual_id);
CREATE INDEX idx_juicios_numero_expediente_trgm ON juicios USING GIN(numero_expediente gin_trgm_ops);

CREATE TABLE avances_juicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  juicio_id UUID NOT NULL REFERENCES juicios(id) ON DELETE CASCADE,
  fecha_avance DATE NOT NULL,
  etapa_procesal_id INTEGER NOT NULL REFERENCES etapas_procesales(id) ON DELETE RESTRICT,
  accion_id INTEGER NOT NULL REFERENCES acciones_procesales(id) ON DELETE RESTRICT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE avances_juicio IS 'Histórico de avances procesales en cada juicio';
CREATE INDEX idx_avances_juicio_juicio ON avances_juicio(juicio_id);
CREATE INDEX idx_avances_juicio_etapa ON avances_juicio(etapa_procesal_id);
CREATE INDEX idx_avances_juicio_fecha ON avances_juicio(fecha_avance);

CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  juicio_id UUID NOT NULL REFERENCES juicios(id) ON DELETE CASCADE,
  tipo_gasto_id INTEGER NOT NULL REFERENCES tipos_gasto(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  importe NUMERIC(18,2) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE gastos IS 'Gastos asociados a un juicio (honorarios, peritajes, etc.)';
CREATE INDEX idx_gastos_juicio ON gastos(juicio_id);
CREATE INDEX idx_gastos_tipo ON gastos(tipo_gasto_id);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);

CREATE TABLE recuperaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE RESTRICT,
  juicio_id UUID REFERENCES juicios(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  importe NUMERIC(18,2) NOT NULL,
  porcentaje NUMERIC(6,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE recuperaciones IS 'Recuperaciones de dinero por caso o por juicio';
CREATE INDEX idx_recuperaciones_caso ON recuperaciones(caso_id);
CREATE INDEX idx_recuperaciones_juicio ON recuperaciones(juicio_id);
CREATE INDEX idx_recuperaciones_fecha ON recuperaciones(fecha);

CREATE TABLE pendientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  juicio_id UUID REFERENCES juicios(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  fecha_limite DATE,
  completado BOOLEAN DEFAULT FALSE,
  prioridad notificacion_prioridad DEFAULT 'media',
  asignado_a UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE pendientes IS 'Tareas pendientes en juicios o casos con vencimientos';
CREATE INDEX idx_pendientes_juicio ON pendientes(juicio_id);
CREATE INDEX idx_pendientes_caso ON pendientes(caso_id);
CREATE INDEX idx_pendientes_fecha_limite ON pendientes(fecha_limite);
CREATE INDEX idx_pendientes_completado ON pendientes(completado);
CREATE INDEX idx_pendientes_asignado_a ON pendientes(asignado_a);

CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  juicio_id UUID REFERENCES juicios(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  storage_path TEXT NOT NULL,
  storage_bucket VARCHAR(100) DEFAULT 'documentos-juicio',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE documentos IS 'Documentos almacenados en Supabase Storage';
CREATE INDEX idx_documentos_caso ON documentos(caso_id);
CREATE INDEX idx_documentos_juicio ON documentos(juicio_id);
CREATE INDEX idx_documentos_nombre_trgm ON documentos USING GIN(nombre gin_trgm_ops);

CREATE TABLE machotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  machote_guia_id UUID REFERENCES machotes(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE machotes IS 'Plantillas de documentos (contratos, escritos, etc.)';
COMMENT ON COLUMN machotes.machote_guia_id IS 'Referencias a machotes guía o base para jerarquía';
CREATE INDEX idx_machotes_clave ON machotes(clave);
CREATE INDEX idx_machotes_activo ON machotes(activo);

CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  tipo notificacion_tipo NOT NULL,
  prioridad notificacion_prioridad DEFAULT 'media',
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  entidad_tipo VARCHAR(50),
  entidad_id UUID,
  url_destino TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notificaciones IS 'Notificaciones en tiempo real para usuarios';
COMMENT ON COLUMN notificaciones.entidad_tipo IS 'Tipo de entidad referenciada: caso, juicio, etc.';
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_created_at ON notificaciones(created_at);

-- ============================================================================
-- 6. ESQUEMA AUDITORÍA
-- ============================================================================

CREATE SCHEMA audit;

CREATE TABLE audit.log (
  id BIGSERIAL PRIMARY KEY,
  tabla TEXT NOT NULL,
  operacion TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  datos_antes JSONB,
  datos_despues JSONB,
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit.log IS 'Registro de auditoría de cambios en tablas principales';
CREATE INDEX idx_audit_log_tabla ON audit.log(tabla);
CREATE INDEX idx_audit_log_created_at ON audit.log(created_at);
CREATE INDEX idx_audit_log_usuario ON audit.log(usuario_id);

-- ============================================================================
-- 7. FUNCIONES SQL
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_updated_at() IS 'Trigger para actualizar updated_at automáticamente';

CREATE OR REPLACE FUNCTION registrar_cambio()
RETURNS TRIGGER AS $$
DECLARE
  v_operacion TEXT;
  v_datos_antes JSONB;
  v_datos_despues JSONB;
  v_usuario_id UUID;
BEGIN
  -- Determinar tipo de operación
  IF TG_OP = 'INSERT' THEN
    v_operacion := 'INSERT';
    v_datos_antes := NULL;
    v_datos_despues := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_operacion := 'UPDATE';
    v_datos_antes := to_jsonb(OLD);
    v_datos_despues := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_operacion := 'DELETE';
    v_datos_antes := to_jsonb(OLD);
    v_datos_despues := NULL;
  END IF;

  -- Obtener usuario actual (si existe en sesión)
  BEGIN
    v_usuario_id := COALESCE(
      (SELECT auth.uid()),
      NULL
    );
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
  END;

  -- Insertar en tabla de auditoría
  INSERT INTO audit.log (tabla, operacion, registro_id, datos_antes, datos_despues, usuario_id)
  VALUES (
    TG_TABLE_NAME,
    v_operacion,
    COALESCE((v_datos_despues ->> 'id'), (v_datos_antes ->> 'id')),
    v_datos_antes,
    v_datos_despues,
    v_usuario_id
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registrar_cambio() IS 'Trigger para auditoría completa de cambios';

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Triggers de updated_at en todas las tablas
CREATE TRIGGER trg_perfiles_updated_at BEFORE UPDATE ON perfiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_regionales_updated_at BEFORE UPDATE ON regionales FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_zonas_updated_at BEFORE UPDATE ON zonas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_plazas_updated_at BEFORE UPDATE ON plazas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sucursales_updated_at BEFORE UPDATE ON sucursales FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_juzgados_updated_at BEFORE UPDATE ON juzgados FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_asistentes_updated_at BEFORE UPDATE ON asistentes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_grupos_clientes_updated_at BEFORE UPDATE ON grupos_clientes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tipos_juicio_updated_at BEFORE UPDATE ON tipos_juicio FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tipos_credito_updated_at BEFORE UPDATE ON tipos_credito FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_etapas_procesales_updated_at BEFORE UPDATE ON etapas_procesales FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_giros_deudor_updated_at BEFORE UPDATE ON giros_deudor FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_areas_banco_updated_at BEFORE UPDATE ON areas_banco FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tipos_baja_updated_at BEFORE UPDATE ON tipos_baja FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tipos_gasto_updated_at BEFORE UPDATE ON tipos_gasto FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_acciones_procesales_updated_at BEFORE UPDATE ON acciones_procesales FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_casos_updated_at BEFORE UPDATE ON casos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_demandados_updated_at BEFORE UPDATE ON demandados FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_avalistas_updated_at BEFORE UPDATE ON avalistas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_juicios_updated_at BEFORE UPDATE ON juicios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_avances_juicio_updated_at BEFORE UPDATE ON avances_juicio FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_gastos_updated_at BEFORE UPDATE ON gastos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_recuperaciones_updated_at BEFORE UPDATE ON recuperaciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pendientes_updated_at BEFORE UPDATE ON pendientes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_documentos_updated_at BEFORE UPDATE ON documentos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_machotes_updated_at BEFORE UPDATE ON machotes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Triggers de auditoría en tablas críticas
CREATE TRIGGER trg_casos_audit AFTER INSERT OR UPDATE OR DELETE ON casos FOR EACH ROW EXECUTE FUNCTION registrar_cambio();
CREATE TRIGGER trg_juicios_audit AFTER INSERT OR UPDATE OR DELETE ON juicios FOR EACH ROW EXECUTE FUNCTION registrar_cambio();
CREATE TRIGGER trg_avances_juicio_audit AFTER INSERT OR UPDATE OR DELETE ON avances_juicio FOR EACH ROW EXECUTE FUNCTION registrar_cambio();
CREATE TRIGGER trg_recuperaciones_audit AFTER INSERT OR UPDATE OR DELETE ON recuperaciones FOR EACH ROW EXECUTE FUNCTION registrar_cambio();

-- ============================================================================
-- 9. ÍNDICES ADICIONALES PARA BÚSQUEDA Y PERFORMANCE
-- ============================================================================

-- Extensión para búsqueda fuzzy (trigramas)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices GIN ya creados en tabla documentos y demandados/avalistas/juicios/casos
-- Los anteriores son suficientes, consolidación aquí

-- ============================================================================
-- 10. COMENTARIOS FINALES
-- ============================================================================

COMMENT ON DATABASE postgres IS 'Base de datos JURISCONTROL WEB - Sistema Jurídico/Administrativo';

-- ============================================================================
-- FIN SCHEMA SQL
-- ============================================================================
