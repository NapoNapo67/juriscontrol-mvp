// ============================================================================
// lib/supabase.ts
// Cliente Supabase para JURISCONTROL WEB v2
// ============================================================================
// Adaptado al schema v2 (multi-tenant). Ver:
//   - Final/MODELO_DATOS.md (modelo conceptual)
//   - Final/migration_v2_schema.sql (DDL)
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Vite expone env vars vía import.meta.env (no process.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas. ' +
    'Define ambas en .env.local antes de usar el cliente.'
  );
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TIPOS — IDENTIDAD Y TENANCY
// ============================================================================

export type TipoOrganizacion = 'individual' | 'despacho' | 'empresa' | 'banco';
export type ModoOrganizacion = 'ejecutor' | 'principal' | 'ambos';

export type RolOrganizacion =
  | 'titular'
  | 'admin_asuntos'
  | 'gestor_agenda'
  | 'abogado'
  | 'lectura';

export type RolClienteExterno = 'contacto_principal' | 'seguimiento' | 'lectura';

export interface PlanSuscripcion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  casos_max: number | null;
  usuarios_max: number | null;
  ia_creditos_mes: number;
  storage_gb: number;
  permite_cliente_portal: boolean;
  permite_ia_generacion: boolean;
  permite_branding_propio: boolean;
  precio_mn: number;
  activo: boolean;
}

export interface Organizacion {
  id: string;
  nombre: string;
  razon_social?: string;
  rfc?: string;
  tipo: TipoOrganizacion;
  modo: ModoOrganizacion;
  plan_id: number;
  logo_url?: string;
  color_primario?: string;
  email_contacto?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  verificado: boolean;
  created_at: string;
  updated_at: string;
}

export interface Perfil {
  id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  cedula_profesional?: string;
  rfc?: string;
  org_activa_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MembresiaOrganizacion {
  org_id: string;
  perfil_id: string;
  rol: RolOrganizacion;
  activo: boolean;
  invitado_por?: string;
  fecha_alta: string;
  fecha_baja?: string;
  // Datos de la org embebidos por conveniencia (poblado vía join)
  organizacion?: Organizacion;
}

export interface InvitacionOrganizacion {
  id: string;
  email_invitado: string;
  nombre_invitado?: string;
  tipo_organizacion: TipoOrganizacion;
  plan_id?: number;
  nombre_organizacion: string;
  rfc_organizacion?: string;
  token: string;
  estado: 'pendiente' | 'aceptada' | 'expirada' | 'cancelada';
  expires_at: string;
  organizacion_creada_id?: string;
  perfil_aceptado_id?: string;
  invitado_por?: string;
  notas?: string;
  created_at: string;
  aceptada_en?: string;
}

export interface ClienteDespacho {
  id: string;
  org_id: string;
  grupo_id?: string;
  nombre: string;
  razon_social?: string;
  rfc?: string;
  tipo?: string;
  email_contacto?: string;
  telefono?: string;
  activo: boolean;
  portal_habilitado: boolean;
  created_at: string;
  updated_at: string;
}

export interface EtapaAdministrativa {
  id: string;
  org_id: string;
  clave: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  color?: string;
  es_terminal: boolean;
  activo: boolean;
}

// ============================================================================
// TIPOS — OPERATIVAS
// ============================================================================

export type CasoEstado = 'activo' | 'en_juicio' | 'terminado' | 'archivado';
export type JuicioEstado =
  | 'activo'
  | 'sentenciado'
  | 'en_recurso'
  | 'en_remate'
  | 'terminado';
export type Moneda = 'MXN' | 'USD' | 'EUR';

export interface Caso {
  id: string;
  org_id: string;                           // tenant
  numero_caso: string;
  fecha_turno: string;
  cliente_despacho_id?: string;
  sucursal_id?: string;
  area_banco_id?: string;
  grupo_cliente_id?: string;
  giro_deudor_id?: number;
  tipo_credito_id: number;
  numero_credito?: string;
  referencia?: string;
  capital_mn?: number;
  capital_vencido_mn?: number;
  int_ordinarios_mn?: number;
  int_moratorios_mn?: number;
  moneda_ext?: Moneda;
  capital_me?: number;
  capital_vencido_me?: number;
  int_ordinarios_me?: number;
  int_moratorios_me?: number;
  mensualidades_vencidas?: number;
  estado: CasoEstado;
  tiene_avalistas: boolean;
  abogado_asignado_id?: string;
  fecha_asignacion?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Juicio {
  id: string;
  org_id: string;
  caso_id: string;
  numero_expediente: string;
  juzgado_id: string;
  tipo_juicio_id: number;
  abogado_responsable_id?: string;
  fecha_presentacion?: string;
  fecha_radicacion?: string;
  fecha_emplazamiento?: string;
  fecha_contestacion?: string;
  fecha_sentencia?: string;
  fecha_prim_almoneda?: string;
  fecha_segu_almoneda?: string;
  fecha_baja?: string;
  capital_demandado_mn?: number;
  int_ordinarios_mn?: number;
  int_moratorios_mn?: number;
  cuantia_mn?: number;
  saldo_mn?: number;
  capital_demandado_me?: number;
  int_ordinarios_me?: number;
  int_moratorios_me?: number;
  cuantia_me?: number;
  saldo_me?: number;
  valor_adjudicado?: number;
  estado: JuicioEstado;
  etapa_procesal_actual_id?: number;
  etapa_administrativa_actual_id?: string;
  sentido_sentencia_id?: number;
  tipo_baja_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Demandado {
  id: string;
  caso_id: string;
  nombre: string;
  rfc?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  ciudad_id?: number;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  es_principal: boolean;
  orden?: number;
  created_at: string;
}

export interface Avalista {
  id: string;
  caso_id: string;
  nombre: string;
  rfc?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  ciudad_id?: number;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  orden?: number;
  created_at: string;
}

export interface AvanceJuicio {
  id: string;
  juicio_id: string;
  fecha_avance: string;
  etapa_procesal_id: number;
  accion_id?: number;
  descripcion?: string;
  visible_cliente: boolean;
  documento_capturado_id?: string;
  registrado_por?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

export async function obtenerUsuarioActual() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function obtenerPerfilActual(): Promise<Perfil | null> {
  const user = await obtenerUsuarioActual();
  if (!user) return null;

  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[supabase] obtenerPerfilActual:', error);
    return null;
  }
  return data as Perfil;
}

/**
 * Cierra sesión actual
 */
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ============================================================================
// TENANCY: organizaciones, membresías, planes
// ============================================================================

/**
 * Obtiene todas las membresías activas del perfil con sus organizaciones.
 * Un usuario puede pertenecer a varias orgs simultáneamente.
 */
export async function obtenerMembresiasActivas(
  perfilId: string
): Promise<MembresiaOrganizacion[]> {
  const { data, error } = await supabase
    .from('membresia_organizacion')
    .select(`
      org_id,
      perfil_id,
      rol,
      activo,
      invitado_por,
      fecha_alta,
      fecha_baja,
      organizacion:organizaciones (
        id, nombre, razon_social, rfc, tipo, modo, plan_id,
        logo_url, color_primario, email_contacto, telefono,
        activo, verificado, created_at, updated_at
      )
    `)
    .eq('perfil_id', perfilId)
    .eq('activo', true);

  if (error) {
    console.error('[supabase] obtenerMembresiasActivas:', error);
    return [];
  }

  // Supabase typegen devuelve la relación como array; aplanamos
  return (data || []).map((m: any) => ({
    ...m,
    organizacion: Array.isArray(m.organizacion) ? m.organizacion[0] : m.organizacion,
  })) as MembresiaOrganizacion[];
}

/**
 * Actualiza la org activa del perfil. Esto se persiste para próximas sesiones.
 */
export async function actualizarOrgActiva(perfilId: string, orgId: string) {
  const { error } = await supabase
    .from('perfiles')
    .update({ org_activa_id: orgId })
    .eq('id', perfilId);

  if (error) throw error;
}

/**
 * Obtiene el plan de suscripción de la organización (para gating de features).
 */
export async function obtenerPlanDeOrg(orgId: string): Promise<PlanSuscripcion | null> {
  const { data, error } = await supabase
    .from('organizaciones')
    .select('plan:planes_suscripcion(*)')
    .eq('id', orgId)
    .single();

  if (error || !data) {
    console.error('[supabase] obtenerPlanDeOrg:', error);
    return null;
  }
  const plan = (data as any).plan;
  return (Array.isArray(plan) ? plan[0] : plan) as PlanSuscripcion;
}

// ============================================================================
// CRUD CASOS — todos filtrados implícitamente por RLS sobre org_id
// ============================================================================

/**
 * Lista casos de la org activa (RLS hace el filtrado).
 * Si el usuario es rol 'abogado', RLS también filtra por abogado_asignado_id.
 */
export async function obtenerCasos(orgId: string): Promise<Caso[]> {
  const { data, error } = await supabase
    .from('casos')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Caso[];
}

export async function obtenerCaso(casoId: string): Promise<Caso | null> {
  const { data, error } = await supabase
    .from('casos')
    .select('*')
    .eq('id', casoId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  return data as Caso | null;
}

export async function crearCaso(
  orgId: string,
  casoData: Partial<Caso>
): Promise<Caso> {
  const usuario = await obtenerUsuarioActual();

  const { data, error } = await supabase
    .from('casos')
    .insert([
      {
        ...casoData,
        org_id: orgId,
        created_by: usuario?.id,
        updated_by: usuario?.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Caso;
}

export async function actualizarCaso(
  casoId: string,
  casoData: Partial<Caso>
): Promise<Caso> {
  const usuario = await obtenerUsuarioActual();

  const { data, error } = await supabase
    .from('casos')
    .update({
      ...casoData,
      updated_by: usuario?.id,
    })
    .eq('id', casoId)
    .select()
    .single();

  if (error) throw error;
  return data as Caso;
}

export async function eliminarCaso(casoId: string) {
  const { error } = await supabase
    .from('casos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', casoId);
  if (error) throw error;
}

// ============================================================================
// CRUD JUICIOS
// ============================================================================

export async function obtenerJuiciosDeCaso(casoId: string): Promise<Juicio[]> {
  const { data, error } = await supabase
    .from('juicios')
    .select('*')
    .eq('caso_id', casoId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Juicio[];
}

export async function obtenerJuicio(juicioId: string): Promise<Juicio | null> {
  const { data, error } = await supabase
    .from('juicios')
    .select('*')
    .eq('id', juicioId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data as Juicio | null;
}

export async function crearJuicio(
  orgId: string,
  juicioData: Partial<Juicio>
): Promise<Juicio> {
  const { data, error } = await supabase
    .from('juicios')
    .insert([{ ...juicioData, org_id: orgId }])
    .select()
    .single();
  if (error) throw error;
  return data as Juicio;
}

export async function actualizarJuicio(
  juicioId: string,
  juicioData: Partial<Juicio>
): Promise<Juicio> {
  const { data, error } = await supabase
    .from('juicios')
    .update(juicioData)
    .eq('id', juicioId)
    .select()
    .single();
  if (error) throw error;
  return data as Juicio;
}

// ============================================================================
// CRUD DEMANDADOS / AVALISTAS
// ============================================================================

export async function obtenerDemandados(casoId: string): Promise<Demandado[]> {
  const { data, error } = await supabase
    .from('demandados')
    .select('*')
    .eq('caso_id', casoId)
    .is('deleted_at', null)
    .order('orden', { ascending: true });
  if (error) throw error;
  return (data || []) as Demandado[];
}

export async function crearDemandado(d: Partial<Demandado>): Promise<Demandado> {
  const { data, error } = await supabase
    .from('demandados')
    .insert([d])
    .select()
    .single();
  if (error) throw error;
  return data as Demandado;
}

export async function actualizarDemandado(
  id: string,
  d: Partial<Demandado>
): Promise<Demandado> {
  const { data, error } = await supabase
    .from('demandados')
    .update(d)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Demandado;
}

export async function obtenerAvalistas(casoId: string): Promise<Avalista[]> {
  const { data, error } = await supabase
    .from('avalistas')
    .select('*')
    .eq('caso_id', casoId)
    .is('deleted_at', null)
    .order('orden', { ascending: true });
  if (error) throw error;
  return (data || []) as Avalista[];
}

export async function crearAvalista(a: Partial<Avalista>): Promise<Avalista> {
  const { data, error } = await supabase
    .from('avalistas')
    .insert([a])
    .select()
    .single();
  if (error) throw error;
  return data as Avalista;
}

export async function actualizarAvalista(
  id: string,
  a: Partial<Avalista>
): Promise<Avalista> {
  const { data, error } = await supabase
    .from('avalistas')
    .update(a)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Avalista;
}

// ============================================================================
// CRUD AVANCES JUICIO
// ============================================================================

export async function obtenerAvancesJuicio(juicioId: string): Promise<AvanceJuicio[]> {
  const { data, error } = await supabase
    .from('avances_juicio')
    .select('*')
    .eq('juicio_id', juicioId)
    .is('deleted_at', null)
    .order('fecha_avance', { ascending: true });
  if (error) throw error;
  return (data || []) as AvanceJuicio[];
}

export async function crearAvanceJuicio(
  avanceData: Partial<AvanceJuicio>
): Promise<AvanceJuicio> {
  const usuario = await obtenerUsuarioActual();
  const { data, error } = await supabase
    .from('avances_juicio')
    .insert([{ ...avanceData, registrado_por: usuario?.id }])
    .select()
    .single();
  if (error) throw error;
  return data as AvanceJuicio;
}

// ============================================================================
// BÚSQUEDAS
// ============================================================================

export async function buscarCasosPorNumero(
  orgId: string,
  numeroCaso: string
): Promise<Caso[]> {
  const { data, error } = await supabase
    .from('casos')
    .select('*')
    .eq('org_id', orgId)
    .ilike('numero_caso', `%${numeroCaso}%`)
    .is('deleted_at', null)
    .limit(10);
  if (error) throw error;
  return (data || []) as Caso[];
}

export async function buscarJuiciosPorExpediente(
  orgId: string,
  numeroExpediente: string
): Promise<Juicio[]> {
  const { data, error } = await supabase
    .from('juicios')
    .select('*')
    .eq('org_id', orgId)
    .ilike('numero_expediente', `%${numeroExpediente}%`)
    .is('deleted_at', null)
    .limit(10);
  if (error) throw error;
  return (data || []) as Juicio[];
}

// ============================================================================
// INVITACIONES DE ORGANIZACIÓN
// ============================================================================

/**
 * Obtiene una invitación por su token (para aceptar invitación)
 */
export async function obtenerInvitacionPorToken(
  token: string
): Promise<InvitacionOrganizacion | null> {
  const { data, error } = await supabase
    .from('invitaciones_organizacion')
    .select('*')
    .eq('token', token)
    .single();
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('[supabase] obtenerInvitacionPorToken:', error);
    return null;
  }
  return (data || null) as InvitacionOrganizacion | null;
}

/**
 * Obtiene todas las invitaciones pendientes/aceptadas (para super-admin)
 */
export async function obtenerTodasLasInvitaciones(): Promise<
  InvitacionOrganizacion[]
> {
  const { data, error } = await supabase
    .from('invitaciones_organizacion')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[supabase] obtenerTodasLasInvitaciones:', error);
    return [];
  }
  return (data || []) as InvitacionOrganizacion[];
}

/**
 * Crea una nueva invitación de organización (solo super-admin)
 * Genera un token único y establece fecha de expiración a 30 días
 */
export async function crearInvitacion(
  email: string,
  tipo: TipoOrganizacion,
  plan_id: number,
  nombre_organizacion: string,
  rfc_organizacion?: string,
  nombre_invitado?: string,
  notas?: string
): Promise<InvitacionOrganizacion> {
  // Generar token único de 64 caracteres
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Expiración a 30 días
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);

  const usuario = await obtenerUsuarioActual();

  const { data, error } = await supabase
    .from('invitaciones_organizacion')
    .insert([
      {
        email_invitado: email,
        nombre_invitado: nombre_invitado || null,
        tipo_organizacion: tipo,
        plan_id,
        nombre_organizacion,
        rfc_organizacion: rfc_organizacion || null,
        token,
        estado: 'pendiente',
        expires_at: expira.toISOString(),
        invitado_por: usuario?.id,
        notas: notas || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[supabase] crearInvitacion:', error);
    throw error;
  }

  return (data || {}) as InvitacionOrganizacion;
}

/**
 * Acepta una invitación: crea auth.users, perfil, organización y membresia
 * Ejecutado desde /aceptar-invitacion con el token del link
 */
export async function aceptarInvitacion(
  token: string,
  password: string,
  nombre_completo: string
): Promise<{
  usuario_id: string;
  perfil_id: string;
  organizacion_id: string;
  membresia_id: string;
}> {
  // 1. Obtener la invitación
  const invitacion = await obtenerInvitacionPorToken(token);
  if (!invitacion) {
    throw new Error('Invitación no encontrada');
  }
  if (invitacion.estado !== 'pendiente') {
    throw new Error(`Invitación no válida (estado: ${invitacion.estado})`);
  }
  if (new Date(invitacion.expires_at) < new Date()) {
    throw new Error('Invitación expirada');
  }

  // 2. Crear cuenta en auth.users (Supabase maneja esto vía signUp)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitacion.email_invitado,
    password,
    options: {
      data: { nombre_completo },
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Error creando cuenta');
  }

  const usuarioId = authData.user.id;

  try {
    // 3. Crear perfil
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .insert([
        {
          id: usuarioId, // FK a auth.users.id
          nombre_completo,
          email: invitacion.email_invitado,
          org_activa_id: null, // Se setea después de crear la org
        },
      ])
      .select()
      .single();

    if (perfilError) {
      throw new Error('Error creando perfil: ' + perfilError.message);
    }

    // 4. Crear organización con los datos de la invitación
    const { data: orgData, error: orgError } = await supabase
      .from('organizaciones')
      .insert([
        {
          nombre: invitacion.nombre_organizacion,
          razon_social: invitacion.nombre_organizacion,
          rfc: invitacion.rfc_organizacion || null,
          tipo: invitacion.tipo_organizacion,
          modo: 'ejecutor', // Default para primera org
          plan_id: invitacion.plan_id,
          email_contacto: invitacion.email_invitado,
          activo: true,
          verificado: false,
        },
      ])
      .select()
      .single();

    if (orgError) {
      throw new Error('Error creando organización: ' + orgError.message);
    }

    const organizacionId = orgData.id;

    // 5. Crear membresia con rol 'titular'
    const { data: membresiaData, error: membresiaError } = await supabase
      .from('membresia_organizacion')
      .insert([
        {
          org_id: organizacionId,
          perfil_id: usuarioId,
          rol: 'titular',
          activo: true,
          invitado_por: invitacion.invitado_por || null,
          fecha_alta: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (membresiaError) {
      throw new Error('Error creando membresia: ' + membresiaError.message);
    }

    // 6. Actualizar perfil.org_activa_id
    const { error: updatePerfilError } = await supabase
      .from('perfiles')
      .update({ org_activa_id: organizacionId })
      .eq('id', usuarioId);

    if (updatePerfilError) {
      console.warn(
        'Advertencia actualizando org_activa_id:',
        updatePerfilError.message
      );
    }

    // 7. Seed de la organización (clonar catálogos template)
    const { error: seedError } = await supabase.rpc('seed_organizacion', {
      p_org_id: organizacionId,
    });

    if (seedError) {
      console.warn('Advertencia en seed_organizacion:', seedError.message);
      // No bloqueante: la org ya existe, será re-seeded si es necesario
    }

    // 8. Actualizar invitación como aceptada
    const { error: invitacionError } = await supabase
      .from('invitaciones_organizacion')
      .update({
        estado: 'aceptada',
        perfil_aceptado_id: usuarioId,
        organizacion_creada_id: organizacionId,
        aceptada_en: new Date().toISOString(),
      })
      .eq('token', token);

    if (invitacionError) {
      console.warn('Advertencia actualizando invitación:', invitacionError.message);
    }

    return {
      usuario_id: usuarioId,
      perfil_id: usuarioId,
      organizacion_id: organizacionId,
      membresia_id: membresiaData.id || '',
    };
  } catch (err) {
    // Si falla después de crear el usuario, intentar eliminar la cuenta
    console.error('Error en aceptarInvitacion, rollback:', err);
    try {
      const { error: delError } = await supabase.auth.admin.deleteUser(usuarioId);
      if (delError) console.warn('No se pudo eliminar usuario de rollback:', delError);
    } catch (e) {
      console.warn('Excepción en rollback:', e);
    }
    throw err;
  }
}

/**
 * Cancela una invitación (solo super-admin)
 */
export async function cancelarInvitacion(invitacionId: string): Promise<void> {
  const { error } = await supabase
    .from('invitaciones_organizacion')
    .update({ estado: 'cancelada' })
    .eq('id', invitacionId);
  if (error) throw error;
}

// ============================================================================
// FIN lib/supabase.ts
// ============================================================================
