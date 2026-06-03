// netlify/functions/notifications.js
// Sistema de notificaciones en tiempo real con Supabase

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseWebhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tipos de notificaciones
const NOTIFICATION_TYPES = {
  VENCIMIENTO_PLAZO: 'vencimiento_plazo',
  CAMBIO_ESTADO: 'cambio_estado',
  NUEVO_AVANCE: 'nuevo_avance',
  ASIGNACION_CASO: 'asignacion_caso',
  ALERTA_RECUPERACION: 'alerta_recuperacion',
  CASO_DORMIDO: 'caso_dormido',
  PERSEGUIR_RECUPERACION: 'perseguir_recuperacion',
};

const PRIORITY_LEVELS = {
  BAJA: 1,
  MEDIA: 2,
  ALTA: 3,
  CRITICA: 4,
};

/**
 * Crear notificación en BD
 */
async function crearNotificacion(usuarioId, tipo, titulo, descripcion, metadata = {}, prioridad = PRIORITY_LEVELS.MEDIA) {
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert([
        {
          usuario_id: usuarioId,
          tipo,
          titulo,
          descripcion,
          metadata,
          prioridad,
          leida: false,
          activa: true,
          fecha_creacion: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error(`[ERROR] Crear notificación: ${error.message}`);
      return null;
    }

    console.log(`[NOTIF] ${tipo} creada para usuario ${usuarioId}`);
    return data[0];
  } catch (err) {
    console.error(`[ERROR] Exceción en crearNotificacion: ${err.message}`);
    return null;
  }
}

/**
 * Manejador para webhook: nuevo avance registrado
 */
async function handleNuevoAvance(avanceData) {
  try {
    // Obtener juicio asociado
    const { data: juicio, error: errorJuicio } = await supabase
      .from('juicios')
      .select('caso_id, asistente_id, etapa_actual')
      .eq('id', avanceData.juicio_id)
      .single();

    if (errorJuicio || !juicio) {
      console.error('[ERROR] Juicio no encontrado');
      return;
    }

    // Obtener caso para asignado
    const { data: caso } = await supabase
      .from('casos')
      .select('asistente_id')
      .eq('id', juicio.caso_id)
      .single();

    const asistenteId = caso?.asistente_id || juicio.asistente_id;

    // Crear notificación para asistente
    if (asistenteId) {
      await crearNotificacion(
        asistenteId,
        NOTIFICATION_TYPES.NUEVO_AVANCE,
        '🔔 Nuevo Avance Registrado',
        `Se registró un nuevo avance en etapa ${avanceData.etapa_actual}. Descripción: ${avanceData.descripcion || 'Sin descripción'}`,
        {
          juicio_id: avanceData.juicio_id,
          caso_id: juicio.caso_id,
          avance_id: avanceData.id,
        },
        PRIORITY_LEVELS.MEDIA
      );
    }

    console.log(`[NOTIF] Nuevo avance: juicio ${avanceData.juicio_id}`);
  } catch (err) {
    console.error(`[ERROR] handleNuevoAvance: ${err.message}`);
  }
}

/**
 * Manejador para webhook: cambio de estado de caso
 */
async function handleCambioEstadoCaso(casoData, estadoAnterior) {
  try {
    if (casoData.estado === estadoAnterior) return;

    // Obtener coordinador de la sucursal
    const { data: sucursal } = await supabase
      .from('sucursales')
      .select('regional:regionales(id)')
      .eq('id', casoData.sucursal_id)
      .single();

    // Notificar al asistente
    if (casoData.asistente_id) {
      await crearNotificacion(
        casoData.asistente_id,
        NOTIFICATION_TYPES.CAMBIO_ESTADO,
        '📋 Cambio de Estado de Caso',
        `Caso ${casoData.numero_caso} cambió de ${estadoAnterior} a ${casoData.estado}`,
        {
          caso_id: casoData.id,
          estado_anterior: estadoAnterior,
          estado_nuevo: casoData.estado,
        },
        PRIORITY_LEVELS.ALTA
      );
    }

    console.log(`[NOTIF] Estado caso ${casoData.id}: ${estadoAnterior} → ${casoData.estado}`);
  } catch (err) {
    console.error(`[ERROR] handleCambioEstadoCaso: ${err.message}`);
  }
}

/**
 * Verificar vencimientos de plazo (cron diario)
 */
async function verificarVencimientos() {
  try {
    const hoy = new Date();
    const en3Dias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Obtener casos con vencimiento próximo
    const { data: casosVencimiento, error } = await supabase
      .from('casos')
      .select('id, numero_caso, asistente_id, fecha_vencimiento')
      .gte('fecha_vencimiento', hoy.toISOString())
      .lte('fecha_vencimiento', en3Dias.toISOString())
      .eq('activo', true);

    if (error) {
      console.error(`[ERROR] Verificar vencimientos: ${error.message}`);
      return;
    }

    for (const caso of casosVencimiento || []) {
      const diasRestantes = Math.ceil(
        (new Date(caso.fecha_vencimiento) - hoy) / (1000 * 60 * 60 * 24)
      );

      const prioridad = diasRestantes <= 1 ? PRIORITY_LEVELS.CRITICA : PRIORITY_LEVELS.ALTA;

      if (caso.asistente_id) {
        await crearNotificacion(
          caso.asistente_id,
          NOTIFICATION_TYPES.VENCIMIENTO_PLAZO,
          `⏰ VENCIMIENTO EN ${diasRestantes} DÍA(S)`,
          `Caso ${caso.numero_caso} vence el ${new Date(caso.fecha_vencimiento).toLocaleDateString('es-MX')}`,
          {
            caso_id: caso.id,
            dias_restantes: diasRestantes,
            fecha_vencimiento: caso.fecha_vencimiento,
          },
          prioridad
        );
      }
    }

    console.log(`[NOTIF] Vencimientos verificados: ${casosVencimiento?.length || 0} casos`);
  } catch (err) {
    console.error(`[ERROR] verificarVencimientos: ${err.message}`);
  }
}

/**
 * Alertar por recuperación > 50%
 */
async function verificarRecuperacion() {
  try {
    // Casos con recuperación > 50% del capital
    const { data: casosRecuperacion } = await supabase
      .from('casos')
      .select('id, numero_caso, asistente_id, capital_mn, metadata')
      .eq('activo', true);

    for (const caso of casosRecuperacion || []) {
      const totalRecuperado = caso.metadata?.recuperacion_total || 0;
      const capital = caso.capital_mn || 0;
      const porcentaje = capital > 0 ? (totalRecuperado / capital) * 100 : 0;

      if (porcentaje > 50 && (!caso.metadata?.notificacion_recuperacion_50_enviada)) {
        if (caso.asistente_id) {
          await crearNotificacion(
            caso.asistente_id,
            NOTIFICATION_TYPES.ALERTA_RECUPERACION,
            '💰 Recuperación Significativa',
            `Caso ${caso.numero_caso} alcanzó ${porcentaje.toFixed(1)}% de recuperación (${totalRecuperado.toLocaleString()} de ${capital.toLocaleString()})`,
            {
              caso_id: caso.id,
              porcentaje_recuperacion: porcentaje,
              total_recuperado: totalRecuperado,
            },
            PRIORITY_LEVELS.MEDIA
          );

          // Marcar como enviada
          await supabase
            .from('casos')
            .update({
              metadata: {
                ...caso.metadata,
                notificacion_recuperacion_50_enviada: true,
              },
            })
            .eq('id', caso.id);
        }
      }
    }

    console.log(`[NOTIF] Recuperación verificada`);
  } catch (err) {
    console.error(`[ERROR] verificarRecuperacion: ${err.message}`);
  }
}

/**
 * Webhook handler para eventos
 */exports.handler = async (event, context) => {
  try {
    // Verificar secret
    const secret = event.headers['x-webhook-secret'] || event.headers.authorization?.replace('Bearer ', '');
    if (secret !== supabaseWebhookSecret) {
      console.warn('[WARN] Webhook secret inválido');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body);
    const { type, record, old_record } = body;

    console.log(`[WEBHOOK] Evento: ${type}`);

    // Routing por tipo de evento
    if (type === 'INSERT' && record?.table === 'avances_juicio') {
      await handleNuevoAvance(record.new);
    } else if (type === 'UPDATE' && record?.table === 'casos') {
      await handleCambioEstadoCaso(record.new, record.old.estado);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error(`[ERROR] Handler: ${err.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

/**
 * Cron: Ejecutar verificaciones diarias
 */
exports.cronHandler = async (event, context) => {
  console.log('[CRON] Iniciando verificaciones diarias');
  
  try {
    await verificarVencimientos();
    await verificarRecuperacion();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Verificaciones completadas' }),
    };
  } catch (err) {
    console.error(`[ERROR] Cron: ${err.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
