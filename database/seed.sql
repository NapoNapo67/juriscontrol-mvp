-- ============================================================================
-- JURISCONTROL WEB - SEED DATA (database/seed.sql)
-- Datos iniciales: catálogos fijos y organizacionales
-- ============================================================================

-- ============================================================================
-- 1. CATÁLOGOS FIJOS
-- ============================================================================

-- TIPOS DE JUICIO
INSERT INTO tipos_juicio (id, clave, descripcion) VALUES
(1, '1', 'EJECUTIVO MERCANTIL'),
(2, '2', 'ESPECIAL HIPOTECARIO'),
(3, '3', 'MERCANTIL PRENDARIO'),
(4, '4', 'PRENDARIO'),
(5, '5', 'ORDINARIO MERCANTIL'),
(6, '6', 'ESPECIAL MERCANTIL'),
(7, '7', 'EJE. MER. CUMP. FORZ. CONTRATO'),
(14, '14', 'PROV. CAUTELAR EMBARGO'),
(15, '15', 'JUICIO SUM. HIPOTECARIO'),
(16, '16', 'PENAL');

-- TIPOS DE CRÉDITO
INSERT INTO tipos_credito (id, clave, descripcion) VALUES
(201, '201', 'P.Q. MN'),
(202, '202', 'P.Q. DLLS'),
(203, '203', 'CRÉDITO SIMPLE CON HIPOTECA'),
(204, '204', 'PRÉSTAMO PRENDARIO'),
(205, '205', 'CRÉDITO SIMPLE SIN GARANTÍA');

-- ETAPAS PROCESALES (con orden para timeline visual)
INSERT INTO etapas_procesales (id, clave, descripcion, orden) VALUES
(1, '1', 'PRESENTACIÓN DE DEMANDA', 1),
(2, '2', 'RADICACIÓN', 2),
(3, '3', 'EMPLAZAMIENTO', 3),
(4, '4', 'PERÍODO PROBATORIO', 4),
(5, '5', 'SENTENCIA', 5),
(6, '6', 'REMATE', 6),
(7, '7', 'ADJUDICACIÓN', 7);

-- GIROS DEL DEUDOR
INSERT INTO giros_deudor (id, clave, descripcion) VALUES
(1, '1', 'AGRICULTURA'),
(2, '2', 'GANADERÍA'),
(3, '3', 'INDUSTRIA'),
(4, '4', 'PESCA'),
(5, '5', 'COMERCIO'),
(6, '6', 'SERVICIOS');

-- ÁREAS DEL BANCO
INSERT INTO areas_banco (id, clave, descripcion) VALUES
(1, '01', 'BANCA COMERCIAL'),
(2, '02', 'BANCA EMPRESARIAL'),
(3, '03', 'BANCA DE CONSUMO');

-- TIPOS DE BAJA
INSERT INTO tipos_baja (id, clave, descripcion) VALUES
(1, '1', 'ADJUDICACIÓN'),
(2, '2', 'LIQUIDACIÓN'),
(3, '3', 'SE PUSO AL CORRIENTE'),
(4, '4', 'CASTIGO'),
(5, '5', 'CONVENIO JUDICIAL'),
(6, '6', 'DACIÓN EN PAGO'),
(7, '7', 'REESTRUCTURA');

-- TIPOS DE GASTO
INSERT INTO tipos_gasto (id, clave, descripcion) VALUES
(1, '1', 'COPIAS'),
(2, '2', 'CERTIFICACIÓN NOTARIAL'),
(3, '3', 'GASTOS DE EMPLAZAMIENTO'),
(4, '4', 'INSCRIPCIÓN DE EMBARGO'),
(5, '5', 'GASTOS DESAHOGO DE PRUEBA'),
(6, '6', 'EXPEDICIÓN DE CERTIFICADO'),
(7, '7', 'ELABORACIÓN DE AVALÚO'),
(8, '8', 'PUBLICACIÓN DE EDICTOS'),
(9, '9', 'GASTOS DE ESCRITORIO'),
(10, '10', 'HONORARIOS ABOGADO EXTERNO');

-- ============================================================================
-- 2. CATÁLOGOS ORGANIZACIONALES
-- ============================================================================

-- REGIONALES
INSERT INTO regionales (id, clave, descripcion) VALUES
(1, '1', 'METROPOLITANA'),
(2, '5', 'NOROESTE'),
(3, '6', 'SURESTE');

-- ZONAS
INSERT INTO zonas (id, clave, descripcion, regional_id) VALUES
(1, '51', 'BAJA CALIFORNIA', 2),
(2, '52', 'SONORA NORTE', 2),
(3, '53', 'SONORA SUR', 2);

-- PLAZAS
INSERT INTO plazas (id, clave, descripcion, zona_id) VALUES
(1, '5201', 'HERMOSILLO', 2),
(2, '5202', 'GUAYMAS', 2),
(3, '5203', 'CABORCA', 2);

-- SUCURSALES
INSERT INTO sucursales (id, clave, descripcion, plaza_id, zona_id, regional_id) VALUES
(1, '1001', 'OBREGÓN', NULL, 1, 2),
(2, '1002', 'NAVOJOA', NULL, 1, 2),
(3, '1003', 'HUATABAMPO', NULL, 1, 2);

-- JUZGADOS
INSERT INTO juzgados (id, clave, descripcion, zona_id) VALUES
(1, '52001', '1RO. CIVIL', 2),
(2, '52002', '2DO. CIVIL', 2),
(3, '52003', '3RO. CIVIL', 2);

-- ASISTENTES (nota: perfil_id requiere usuarios en auth.users previamente)
-- Para seed inicial, se insertan solo con datos básicos; perfil_id se linkea posteriormente
INSERT INTO asistentes (id, clave, nombre, zona_id, perfil_id) VALUES
(1, '52001', 'LIC. MANUEL MILLÁN DUARTE', 2, NULL),
(2, '52002', 'LIC. ARMANDO LÓPEZ CASTRO', 2, NULL),
(3, '52003', 'LIC. EFRAÍN MORALES P.', 2, NULL);

-- GRUPOS DE CLIENTES
INSERT INTO grupos_clientes (id, clave, descripcion, zona_id) VALUES
(1, '52001', 'GRUPO GONZALES', 2),
(2, '52002', 'GRUPO PÉREZ LÓPEZ', 2),
(3, '52003', 'GRUPO ICACC', 2);

-- ============================================================================
-- 3. ACCIONES PROCESALES
-- ============================================================================

INSERT INTO acciones_procesales (id, clave, descripcion, etapa_procesal_id) VALUES
(1, '1', 'EMPLAZAMIENTO POR EXHORTO', 3),
(2, '2', 'EMPLAZAMIENTO POR EDICTO', 3),
(3, '3', 'TRES', 3),
(4, '4', 'CUATRO', 3);

-- ============================================================================
-- 4. USUARIO DEMO (PARA TESTING LOCAL)
-- ============================================================================
-- NOTA: En producción, el usuario debe existir previamente en auth.users de Supabase
-- Este INSERT es solo para fines de demostración/testing local
-- Reemplazar el UUID con un auth.users.id válido en ambiente de producción

INSERT INTO perfiles (id, nombre_completo, email, rol, zona_id) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'Usuario Demo', 'demo@juriscontrol.local', 'super_admin'::user_role, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FIN SEED DATA
-- ============================================================================
