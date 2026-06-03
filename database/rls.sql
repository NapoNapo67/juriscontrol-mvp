-- ============================================================================
-- utils/rls.sql
-- Políticas Row Level Security para JURISCONTROL WEB
-- Ejecutar después de schema.sql para activar seguridad por rol
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE plazas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE juzgados ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_juicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_procesales ENABLE ROW LEVEL SECURITY;
ALTER TABLE giros_deudor ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas_banco ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_baja ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE acciones_procesales ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandados ENABLE ROW LEVEL SECURITY;
ALTER TABLE avalistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE juicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE avances_juicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recuperaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE machotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. HELPER FUNCTION: obtener rol del usuario actual
-- ============================================================================

CREATE OR REPLACE FUNCTION obtener_rol_usuario()
RETURNS user_role AS $$
DECLARE
  v_rol user_role;
BEGIN
  SELECT rol INTO v_rol
  FROM perfiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(v_rol, 'asistente'::user_role);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_rol_usuario() IS 'Obtiene el rol del usuario autenticado actual';

-- ============================================================================
-- 3. HELPER FUNCTION: obtener zona_id del usuario actual
-- ============================================================================

CREATE OR REPLACE FUNCTION obtener_zona_usuario()
RETURNS INTEGER AS $$
DECLARE
  v_zona_id INTEGER;
BEGIN
  SELECT zona_id INTO v_zona_id
  FROM perfiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN v_zona_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_zona_usuario() IS 'Obtiene la zona_id del usuario autenticado actual';

-- ============================================================================
-- 4. POLÍTICAS: CATÁLOGOS FIJOS (públicos para lectura, protegidos para escritura)
-- ============================================================================

-- TIPOS_JUICIO
CREATE POLICY "cat_tipos_juicio_select_all" ON tipos_juicio
  FOR SELECT USING (true);

CREATE POLICY "cat_tipos_juicio_insert_admin" ON tipos_juicio
  FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_tipos_juicio_update_admin" ON tipos_juicio
  FOR UPDATE USING (obtener_rol_usuario() = 'super_admin'::user_role);

-- TIPOS_CREDITO
CREATE POLICY "cat_tipos_credito_select_all" ON tipos_credito
  FOR SELECT USING (true);

CREATE POLICY "cat_tipos_credito_insert_admin" ON tipos_credito
  FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_tipos_credito_update_admin" ON tipos_credito
  FOR UPDATE USING (obtener_rol_usuario() = 'super_admin'::user_role);

-- ETAPAS_PROCESALES
CREATE POLICY "cat_etapas_procesales_select_all" ON etapas_procesales
  FOR SELECT USING (true);

CREATE POLICY "cat_etapas_procesales_insert_admin" ON etapas_procesales
  FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_etapas_procesales_update_admin" ON etapas_procesales
  FOR UPDATE USING (obtener_rol_usuario() = 'super_admin'::user_role);

-- TIPOS_GASTO, TIPOS_BAJA, GIROS_DEUDOR, AREAS_BANCO (mismo patrón)
CREATE POLICY "cat_tipos_gasto_select_all" ON tipos_gasto FOR SELECT USING (true);
CREATE POLICY "cat_tipos_gasto_write_admin" ON tipos_gasto FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_tipos_baja_select_all" ON tipos_baja FOR SELECT USING (true);
CREATE POLICY "cat_tipos_baja_write_admin" ON tipos_baja FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_giros_deudor_select_all" ON giros_deudor FOR SELECT USING (true);
CREATE POLICY "cat_giros_deudor_write_admin" ON giros_deudor FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_areas_banco_select_all" ON areas_banco FOR SELECT USING (true);
CREATE POLICY "cat_areas_banco_write_admin" ON areas_banco FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_acciones_procesales_select_all" ON acciones_procesales FOR SELECT USING (true);
CREATE POLICY "cat_acciones_procesales_write_admin" ON acciones_procesales FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

-- ============================================================================
-- 5. POLÍTICAS: CATÁLOGOS ORGANIZACIONALES
-- ============================================================================

-- REGIONALES (solo super_admin puede modificar)
CREATE POLICY "cat_regionales_select_all" ON regionales FOR SELECT USING (true);
CREATE POLICY "cat_regionales_write_admin" ON regionales FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);
CREATE POLICY "cat_regionales_update_admin" ON regionales FOR UPDATE USING (obtener_rol_usuario() = 'super_admin'::user_role);

-- ZONAS (coordinador ve zonas, super_admin ve todas)
CREATE POLICY "cat_zonas_select_all" ON zonas FOR SELECT USING (true);
CREATE POLICY "cat_zonas_write_admin" ON zonas FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

-- PLAZAS, SUCURSALES, JUZGADOS (visible a todos)
CREATE POLICY "cat_plazas_select_all" ON plazas FOR SELECT USING (true);
CREATE POLICY "cat_plazas_write_admin" ON plazas FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_sucursales_select_all" ON sucursales FOR SELECT USING (true);
CREATE POLICY "cat_sucursales_write_admin" ON sucursales FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "cat_juzgados_select_all" ON juzgados FOR SELECT USING (true);
CREATE POLICY "cat_juzgados_write_admin" ON juzgados FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

-- ASISTENTES (ver asistentes de mi zona o todos si super_admin)
CREATE POLICY "cat_asistentes_select_own_zona" ON asistentes
  FOR SELECT USING (
    obtener_rol_usuario() = 'super_admin'::user_role
    OR zona_id = obtener_zona_usuario()
  );

CREATE POLICY "cat_asistentes_write_admin" ON asistentes
  FOR INSERT WITH CHECK (obtener_rol_usuario() = 'super_admin'::user_role);

-- GRUPOS_CLIENTES (ver de mi zona o todos si super_admin)
CREATE POLICY "cat_grupos_clientes_select_own_zona" ON grupos_clientes
  FOR SELECT USING (
    obtener_rol_usuario() = 'super_admin'::user_role
    OR zona_id = obtener_zona_usuario()
  );

-- ============================================================================
-- 6. POLÍTICAS: PERFILES
-- ============================================================================

-- Los usuarios ven su propio perfil, super_admin ve todos
CREATE POLICY "perfiles_select_own_or_admin" ON perfiles
  FOR SELECT USING (
    id = auth.uid()
    OR obtener_rol_usuario() = 'super_admin'::user_role
  );

CREATE POLICY "perfiles_update_own" ON perfiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "perfiles_update_admin" ON perfiles
  FOR UPDATE USING (obtener_rol_usuario() = 'super_admin'::user_role);

-- ============================================================================
-- 7. POLÍTICAS: CASOS
-- ============================================================================

-- SUPER_ADMIN: ve todo
-- COORDINADOR: ve casos de su zona (via sucursal → zona)
-- ASISTENTE: ve casos asignados a él
-- AUDITOR: ve todo pero solo lectura

CREATE POLICY "casos_select_super_admin" ON casos
  FOR SELECT USING (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "casos_select_coordinador" ON casos
  FOR SELECT USING (
    obtener_rol_usuario() = 'coordinador'::user_role
    AND EXISTS (
      SELECT 1 FROM sucursales s
      WHERE s.id = casos.sucursal_id
      AND (
        s.zona_id = obtener_zona_usuario()
        OR s.regional_id = (SELECT regional_id FROM zonas WHERE id = obtener_zona_usuario())
      )
    )
  );

CREATE POLICY "casos_select_asistente" ON casos
  FOR SELECT USING (
    obtener_rol_usuario() = 'asistente'::user_role
    AND asistente_id = (
      SELECT id FROM asistentes WHERE perfil_id = auth.uid()
    )
  );

CREATE POLICY "casos_select_auditor" ON casos
  FOR SELECT USING (obtener_rol_usuario() = 'auditor'::user_role);

-- INSERT: solo coordinador y super_admin
CREATE POLICY "casos_insert_coordinador_admin" ON casos
  FOR INSERT WITH CHECK (
    obtener_rol_usuario() IN ('coordinador'::user_role, 'super_admin'::user_role)
  );

-- UPDATE: super_admin todo, coordinador su zona, asistente su caso
CREATE POLICY "casos_update_super_admin" ON casos
  FOR UPDATE USING (obtener_rol_usuario() = 'super_admin'::user_role);

CREATE POLICY "casos_update_coordinador" ON casos
  FOR UPDATE USING (
    obtener_rol_usuario() = 'coordinador'::user_role
    AND EXISTS (
      SELECT 1 FROM sucursales s
      WHERE s.id = casos.sucursal_id
      AND (
        s.zona_id = obtener_zona_usuario()
        OR s.regional_id = (SELECT regional_id FROM zonas WHERE id = obtener_zona_usuario())
      )
    )
  );

CREATE POLICY "casos_update_asistente" ON casos
  FOR UPDATE USING (
    obtener_rol_usuario() = 'asistente'::user_role
    AND asistente_id = (
      SELECT id FROM asistentes WHERE perfil_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. POLÍTICAS: JUICIOS (heredan visibilidad de CASOS)
-- ============================================================================

CREATE POLICY "juicios_select_via_caso" ON juicios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM casos c
      WHERE c.id = juicios.caso_id
      AND (
        -- super_admin ve todo
        obtener_rol_usuario() = 'super_admin'::user_role
        -- coordinador ve su zona
        OR (obtener_rol_usuario() = 'coordinador'::user_role
          AND EXISTS (
            SELECT 1 FROM sucursales s
            WHERE s.id = c.sucursal_id
            AND (s.zona_id = obtener_zona_usuario()
              OR s.regional_id = (SELECT regional_id FROM zonas WHERE id = obtener_zona_usuario()))
          ))
        -- asistente ve sus juicios
        OR (obtener_rol_usuario() = 'asistente'::user_role
          AND asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid()))
        -- auditor ve todo (lectura)
        OR obtener_rol_usuario() = 'auditor'::user_role
      )
    )
  );

CREATE POLICY "juicios_insert_coordinador_admin" ON juicios
  FOR INSERT WITH CHECK (
    obtener_rol_usuario() IN ('coordinador'::user_role, 'super_admin'::user_role)
  );

CREATE POLICY "juicios_update_via_caso" ON juicios
  FOR UPDATE USING (
    obtener_rol_usuario() = 'super_admin'::user_role
    OR (obtener_rol_usuario() = 'asistente'::user_role
      AND asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid()))
  );

-- ============================================================================
-- 9. POLÍTICAS: DEMANDADOS, AVALISTAS, AVANCES, GASTOS (heredan de CASOS)
-- ============================================================================

-- DEMANDADOS
CREATE POLICY "demandados_select_via_caso" ON demandados
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM casos c
      WHERE c.id = demandados.caso_id
      AND (obtener_rol_usuario() IN ('super_admin'::user_role, 'auditor'::user_role)
        OR (obtener_rol_usuario() = 'coordinador'::user_role
          AND EXISTS (SELECT 1 FROM sucursales s WHERE s.id = c.sucursal_id
            AND (s.zona_id = obtener_zona_usuario()
              OR s.regional_id = (SELECT regional_id FROM zonas WHERE id = obtener_zona_usuario()))))
        OR (obtener_rol_usuario() = 'asistente'::user_role
          AND c.asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid())))
    )
  );

CREATE POLICY "demandados_write_via_caso" ON demandados
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM casos c
      WHERE c.id = demandados.caso_id
      AND (obtener_rol_usuario() = 'super_admin'::user_role
        OR (obtener_rol_usuario() = 'asistente'::user_role
          AND c.asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid())))
    )
  );

-- AVALISTAS (igual que demandados)
CREATE POLICY "avalistas_select_via_caso" ON avalistas FOR SELECT USING (
  EXISTS (SELECT 1 FROM casos c WHERE c.id = avalistas.caso_id
    AND (obtener_rol_usuario() IN ('super_admin'::user_role, 'auditor'::user_role)
      OR (obtener_rol_usuario() = 'coordinador'::user_role
        AND EXISTS (SELECT 1 FROM sucursales s WHERE s.id = c.sucursal_id))
      OR (obtener_rol_usuario() = 'asistente'::user_role
        AND c.asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid()))))
);

-- AVANCES_JUICIO
CREATE POLICY "avances_juicio_select_via_juicio" ON avances_juicio FOR SELECT USING (
  EXISTS (SELECT 1 FROM juicios j WHERE j.id = avances_juicio.juicio_id
    AND (obtener_rol_usuario() IN ('super_admin'::user_role, 'auditor'::user_role)
      OR (obtener_rol_usuario() = 'asistente'::user_role
        AND j.asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid()))))
);

CREATE POLICY "avances_juicio_insert_asistente" ON avances_juicio FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM juicios j WHERE j.id = avances_juicio.juicio_id
    AND j.asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid()))
  OR obtener_rol_usuario() = 'super_admin'::user_role
);

-- GASTOS
CREATE POLICY "gastos_select_via_juicio" ON gastos FOR SELECT USING (
  EXISTS (SELECT 1 FROM juicios j WHERE j.id = gastos.juicio_id
    AND (obtener_rol_usuario() IN ('super_admin'::user_role, 'auditor'::user_role)
      OR (obtener_rol_usuario() = 'asistente'::user_role
        AND j.asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid()))))
);

-- ============================================================================
-- 10. POLÍTICAS: NOTIFICACIONES (personal)
-- ============================================================================

CREATE POLICY "notificaciones_select_own" ON notificaciones
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "notificaciones_insert_own" ON notificaciones
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "notificaciones_update_own" ON notificaciones
  FOR UPDATE USING (usuario_id = auth.uid());

-- ============================================================================
-- 11. POLÍTICAS: DOCUMENTOS (heredan de CASOS/JUICIOS)
-- ============================================================================

CREATE POLICY "documentos_select_via_entidad" ON documentos FOR SELECT USING (
  (EXISTS (SELECT 1 FROM casos c WHERE c.id = documentos.caso_id
    AND (obtener_rol_usuario() IN ('super_admin'::user_role, 'auditor'::user_role)
      OR (obtener_rol_usuario() = 'asistente'::user_role
        AND c.asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid())))))
  OR
  (EXISTS (SELECT 1 FROM juicios j WHERE j.id = documentos.juicio_id
    AND (obtener_rol_usuario() IN ('super_admin'::user_role, 'auditor'::user_role)
      OR (obtener_rol_usuario() = 'asistente'::user_role
        AND j.asistente_id = (SELECT id FROM asistentes WHERE perfil_id = auth.uid())))))
);

-- ============================================================================
-- 12. POLÍTICAS: MACHOTES (templates públicos)
-- ============================================================================

CREATE POLICY "machotes_select_all" ON machotes FOR SELECT USING (activo = TRUE);

CREATE POLICY "machotes_write_admin" ON machotes FOR INSERT WITH CHECK (
  obtener_rol_usuario() = 'super_admin'::user_role
);

-- ============================================================================
-- FIN utils/rls.sql
-- ============================================================================
