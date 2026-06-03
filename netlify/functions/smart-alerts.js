// netlify/functions/smart-alerts.js
// Sistema de alertas inteligentes basadas en reglas de negocio

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALERT_TYPES = {
  CASO_DORMIDO: 'caso_dormido',
  PERSEGUIR_RECUPERACION: 'perseguir_recuperacion',
  VENCIMIENTO_CRITICO: 'vencimiento_critico',
  CAMBIO_ETAPA: 'cambio_etapa',
  OPORTUNIDAD_GARANTIA: 'oportunidad_garantia',
};

const PRIORITY_LEVELS = {
  BAJA: 1,
  MEDIA: 2,
  ALTA: 3,
  CRITICA: 4,
};

/**
 * Crear alerta en notificaciones
 */
async function crearAlerta(usuarioId, tipo, titulo, descripcion, metadata = {}, prioridad = PRIORITY_LEVELS.MEDIA) {
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
      console.error(`[ERROR] Crear alerta: ${error.message}`);
      return null;
    }

    console.log(`[ALERT] ${tipo} para usuario ${usuarioId}`);
    return data[0];
  } catch (err) {
    console.error(`[ERROR] crearAlerta: ${err.message}`);
    return null;
  }
}

/**
 * REGLA 1: Caso sin avance > 30 días
 */
async function detectarCasosDormidos() {
  try {
    const haceUnMes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Obtener casos activos sin avances recientes
    const { data: casos } = await supabase
      .from('casos')
      .select(`
        id,
        numero_caso,
        asistente_id,
        metadata,
        juicios(
          id,
          numero_expediente,
          avances_juicio(fecha_avance)
        )
      `)
      .eq('estado', 'activo')
      .eq('activo', true);

    for (const caso of casos || []) {
      if (!caso.juicios || caso.juicios.length === 0) continue;

      // Encontrar último avance de todos los juicios
      const ultimoAvance = caso.juicios
        .flatMap((j) => j.avances_juicio || [])
        .sort((a, b) => new Date(b.fecha_avance) - new Date(a.fecha_avance))[0];

      if (!ultimoAvance) continue;

      const diasSinAvance = Math.floor(
        (Date.now() - new Date(ultimoAvance.fecha_avance).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasSinAvance > 30) {
        // Marcar como alerta si no se ha enviado
        const metadataActual = caso.metadata || {};
        if (!metadataActual.alerta_caso_dormido_enviada) {
          if (caso.asistente_id) {
            await crearAlerta(
              caso.asistente_id,
              ALERT_TYPES.CASO_DORMIDO,
              '😴 CASO SIN MOVIMIENTO',
              `Caso ${caso.numero_caso} lleva ${diasSinAvance} días sin registrar avances. Requerimiento de revisión inmediata.`,
              {
                caso_id: caso.id,
                dias_sin_avance: diasSinAvance,
                ultimo_avance: ultimoAvance.fecha_avance,
              },
              PRIORITY_LEVELS.ALTA
            );

            // Actualizar metadata
            await supabase
              .from('casos')
              .update({
                metadata: {
                  ...metadataActual,
                  alerta_caso_dormido_enviada: true,
                  fecha_alerta_dormido: new Date().toISOString(),
                },
              })
              .eq('id', caso.id);
          }
        }
      }
    }

    console.log('[ALERT] Verificación de casos dormidos completada');
  } catch (err) {
    console.error(`[ERROR] detectarCasosDormidos: ${err.message}`);
  }
}

/**
 * REGLA 2: Juicio sentenciado sin recuperación > 60 días
 */
async function detectarJuiciosPorPerseguir() {
  try {
    const hace2Meses = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const { data: juicios } = await supabase
      .from('juicios')
      .select(`
        id,
        numero_expediente,
        asistente_id,
        caso_id,
        estado,
        fecha_presentacion,
        metadata,
        casos(numero_caso, capital_mn, metadata)
      `)
      .eq('estado', 'sentenciado')
      .eq('activo', true)
      .lte('fecha_presentacion', hace2Meses.toISOString());

    for (const juicio of juicios || []) {
      const caso = juicio.casos;
      const recuperacion = caso.metadata?.recuperacion_total || 0;
      const capital = caso.capital_mn || 0;
      const porcentajeRecuperacion = capital > 0 ? (recuperacion / capital) * 100 : 0;

      // Si hay sentencia pero poca recuperación
      if (porcentajeRecuperacion < 50) {
        const metadataActual = juicio.metadata || {};
        if (!metadataActual.alerta_perseguir_enviada) {
          if (juicio.asistente_id) {
            await crearAlerta(
              juicio.asistente_id,
              ALERT_TYPES.PERSEGUIR_RECUPERACION,
              '⚖️ SENTENCIA SIN RECUPERACIÓN',
              `Juicio ${juicio.numero_expediente} (Caso ${caso.numero_caso}) está sentenciado pero solo se recuperó ${porcentajeRecuperacion.toFixed(1)}%. Activar diligencias de remate/embargo.`,
              {
                juicio_id: juicio.id,
                caso_id: juicio.caso_id,
                porcentaje_recuperacion: porcentajeRecuperacion,
                capital_pendiente: capital - recuperacion,
              },
              PRIORITY_LEVELS.ALTA
            );

            // Actualizar metadata
            await supabase
              .from('juicios')
              .update({
                metadata: {
                  ...metadataActual,
                  alerta_perseguir_enviada: true,
                  fecha_alerta_perseguir: new Date().toISOString(),
                },
              })
              .eq('id', juicio.id);
          }
        }
      }
    }

    console.log('[ALERT] Verificación de juicios sin recuperación completada');
  } catch (err) {
    console.error(`[ERROR] detectarJuiciosPorPerseguir: ${err.message}`);
  }
}

/**
 * REGLA 3: Vencimiento crítico (< 3 días)
 */
async function detectarVencimientosCriticos() {
  try {
    const hoy = new Date();
    const en3Dias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: casos } = await supabase
      .from('casos')
      .select('id, numero_caso, asistente_id, fecha_vencimiento, estado')
      .gte('fecha_vencimiento', hoy.toISOString())
      .lte('fecha_vencimiento', en3Dias.toISOString())
      .eq('activo', true)
      .eq('estado', 'activo');

    for (const caso of casos || []) {
      const diasRestantes = Math.ceil(
        (new Date(caso.fecha_vencimiento) - hoy) / (1000 * 60 * 60 * 24)
      );

      if (diasRestantes <= 3 && caso.asistente_id) {
        await crearAlerta(
          caso.asistente_id,
          ALERT_TYPES.VENCIMIENTO_CRITICO,
          `🚨 VENCIMIENTO CRÍTICO EN ${diasRestantes} DÍA(S)`,
          `Caso ${caso.numero_caso} vencerá el ${new Date(caso.fecha_vencimiento).toLocaleDateString('es-MX')}. ACCIÓN INMEDIATA REQUERIDA.`,
          {
            caso_id: caso.id,
            dias_restantes: diasRestantes,
            fecha_vencimiento: caso.fecha_vencimiento,
          },
          diasRestantes <= 1 ? PRIORITY_LEVELS.CRITICA : PRIORITY_LEVELS.ALTA
        );
      }
    }

    console.log('[ALERT] Vencimientos críticos verificados');
  } catch (err) {
    console.error(`[ERROR] detectarVencimientosCriticos: ${err.message}`);
  }
}

/**
 * REGLA 4: Cambio de etapa → notificar coordinador
 */
async function notificarCambioEtapa(juicioData, etapaAnterior) {
  try {
    if (juicioData.etapa_actual === etapaAnterior) return;

    // Obtener info del caso
    const { data: caso } = await supabase
      .from('casos')
      .select('numero_caso, sucursal_id')
      .eq('id', juicioData.caso_id)
      .single();

    if (!caso) return;

    // Obtener coordinador de la sucursal
    const { data: sucursal } = await supabase
      .from('sucursales')
      .select('regional_id, regionales(id)')
      .eq('id', caso.sucursal_id)
      .single();

    // Notificar al asistente y coordinador
    if (juicioData.asistente_id) {
      await crearAlerta(
        juicioData.asistente_id,
        ALERT_TYPES.CAMBIO_ETAPA,
        '📊 CAMBIO DE ETAPA PROCESAL',
        `Juicio ${juicioData.numero_expediente} (Caso ${caso.numero_caso}) cambió a etapa: ${juicioData.etapa_actual}`,
        {
          juicio_id: juicioData.id,
          caso_id: juicioData.caso_id,
          etapa_anterior: etapaAnterior,
          etapa_nueva: juicioData.etapa_actual,
        },
        PRIORITY_LEVELS.MEDIA
      );
    }

    console.log(`[ALERT] Cambio etapa: ${etapaAnterior} → ${juicioData.etapa_actual}`);
  } catch (err) {
    console.error(`[ERROR] notificarCambioEtapa: ${err.message}`);
  }
}

/**
 * REGLA 5: Oportunidad de garantía vendida bien
 */
async function detectarOportunidadesGarantia() {
  try {
    const { data: juicios } = await supabase
      .from('juicios')
      .select(`
        id,
        numero_expediente,
        asistente_id,
        caso_id,
        garantias_muebles,
        garantias_inmuebles,
        metadata,
        casos(numero_caso)
      `)
      .eq('estado', 'en_remate')
      .eq('activo', true);

    for (const juicio of juicios || []) {
      const metadataActual = juicio.metadata || {};

      // Si tiene garantías y está en remate
      const tieneGarantias = juicio.garantias_muebles || juicio.garantias_inmuebles;

      if (tieneGarantias && !metadataActual.alerta_oportunidad_garantia) {
        if (juicio.asistente_id) {
          await crearAlerta(
            juicio.asistente_id,
            ALERT_TYPES.OPORTUNIDAD_GARANTIA,
            '💎 OPORTUNIDAD DE VENTA DE GARANTÍA',
            `Juicio ${juicio.numero_expediente} en fase de remate y tiene garantías disponibles. Evaluaraproximación ágil de venta.`,
            {
              juicio_id: juicio.id,
              caso_id: juicio.caso_id,
              garantias: {
                muebles: juicio.garantias_muebles || null,
                inmuebles: juicio.garantias_inmuebles || null,
              },
            },
            PRIORITY_LEVELS.MEDIA
          );

          // Marcar como notificada
          await supabase
            .from('juicios')
            .update({
              metadata: {
                ...metadataActual,
                alerta_oportunidad_garantia: true,
                fecha_alerta_oportunidad: new Date().toISOString(),
              },
            })
            .eq('id', juicio.id);
        }
      }
    }

    console.log('[ALERT] Oportunidades de garantía detectadas');
  } catch (err) {
    console.error(`[ERROR] detectarOportunidadesGarantia: ${err.message}`);
  }
}

/**
 * Ejecutar todas las verificaciones
 */
async function ejecutarVerificaciones() {
  console.log('[ALERT] Iniciando ciclo de alertas inteligentes');

  try {
    await detectarCasosDormidos();
    await detectarJuiciosPorPerseguir();
    await detectarVencimientosCriticos();
    await detectarOportunidadesGarantia();

    console.log('[ALERT] Ciclo de alertas completado');
  } catch (err) {
    console.error(`[ERROR] ejecutarVerificaciones: ${err.message}`);
  }
}

/**
 * Webhook handler para cambios en BD
 */
exports.handler = async (event, context) => {
  try {
    // Verificar secret
    const secret = event.headers['x-webhook-secret'] || event.headers.authorization?.replace('Bearer ', '');
    if (secret !== webhookSecret) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body);
    const { type, record } = body;

    console.log(`[WEBHOOK] Evento: ${type} en ${record?.table}`);

    // Procesar cambios de etapa en juicios
    if (type === 'UPDATE' && record?.table === 'juicios') {
      if (record.new.etapa_actual !== record.old.etapa_actual) {
        await notificarCambioEtapa(record.new, record.old.etapa_actual);
      }
    }

    // Ejecutar verificaciones de alertas
    await ejecutarVerificaciones();

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
 * Cron handler: ejecutar diariamente
 */
exports.cronHandler = async (event, context) => {
  try {
    console.log('[CRON] Iniciando verificaciones diarias de alertas');
    await ejecutarVerificaciones();

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
