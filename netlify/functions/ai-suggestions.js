// netlify/functions/ai-suggestions.js
// Sistema de sugerencias inteligentes con Claude API

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const claudeApiKey = process.env.ANTHROPIC_API_KEY;
const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting simple
const rateLimitMap = new Map();
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hora

/**
 * Verificar rate limiting
 */
function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    console.warn(`[RATE_LIMIT] Límite alcanzado para ${key}`);
    return false;
  }

  entry.count++;
  rateLimitMap.set(key, entry);
  return true;
}

/**
 * Llamar Claude API
 */
async function callClaudeAPI(prompt, maxTokens = 500) {
  try {
    if (!checkRateLimit('claude-api')) {
      throw new Error('Rate limit excedido');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    console.error(`[ERROR] Claude API: ${err.message}`);
    throw err;
  }
}

/**
 * Sugerencia de próximo paso en juicio
 */
async function sugerirProximoPaso(juicioId) {
  try {
    // Obtener últimos avances
    const { data: avances } = await supabase
      .from('avances_juicio')
      .select('etapa_id, accion_id, descripcion, fecha_avance')
      .eq('juicio_id', juicioId)
      .order('fecha_avance', { ascending: false })
      .limit(5);

    // Obtener info del juicio
    const { data: juicio } = await supabase
      .from('juicios')
      .select('numero_expediente, tipo_juicio_id, etapa_actual, estado, fecha_presentacion')
      .eq('id', juicioId)
      .single();

    if (!juicio) {
      console.warn(`[WARN] Juicio ${juicioId} no encontrado`);
      return null;
    }

    const prompt = `
Eres un abogado experto en litigación mercantil mexicana.

Analiza este historial de juicio y sugiere el próximo paso procesal:

Expediente: ${juicio.numero_expediente}
Etapa actual: ${juicio.etapa_actual}
Estado: ${juicio.estado}
Fecha de presentación: ${juicio.fecha_presentacion}

Últimos avances:
${(avances || []).map((a) => `- ${a.fecha_avance}: ${a.descripcion || 'Sin descripción'}`).join('\n')}

Basándote en los avances y la etapa actual, sugiere el próximo paso procesal recomendado. 
Sé conciso (max 2-3 líneas). Incluye plazo estimado si aplica.
`;

    const sugerencia = await callClaudeAPI(prompt, 300);

    // Guardar en metadata
    await supabase
      .from('juicios')
      .update({
        metadata: {
          ultima_sugerencia_ia: sugerencia,
          fecha_sugerencia: new Date().toISOString(),
        },
      })
      .eq('id', juicioId);

    console.log(`[IA] Sugerencia próximo paso para juicio ${juicioId}`);
    return sugerencia;
  } catch (err) {
    console.error(`[ERROR] sugerirProximoPaso: ${err.message}`);
    return null;
  }
}

/**
 * Análisis de riesgo del caso
 */
async function analizarRiesgo(casoId) {
  try {
    // Obtener datos del caso
    const { data: caso } = await supabase
      .from('casos')
      .select(`
        numero_caso,
        capital_mn,
        capital_me,
        estado,
        fecha_creacion,
        metadata,
        juicios(
          id,
          estado,
          etapa_actual,
          fecha_presentacion,
          avances_juicio(id, fecha_avance)
        )
      `)
      .eq('id', casoId)
      .single();

    if (!caso) {
      console.warn(`[WARN] Caso ${casoId} no encontrado`);
      return null;
    }

    // Calcular métricas
    const diasActivo = Math.floor((Date.now() - new Date(caso.fecha_creacion).getTime()) / (1000 * 60 * 60 * 24));
    const totalJuicios = caso.juicios?.length || 0;
    const juiciosTerminados = caso.juicios?.filter((j) => j.estado === 'terminado')?.length || 0;
    const tasaExito = totalJuicios > 0 ? (juiciosTerminados / totalJuicios) * 100 : 0;
    const recuperacion = caso.metadata?.recuperacion_total || 0;
    const porcentajeRecuperacion = caso.capital_mn > 0 ? (recuperacion / caso.capital_mn) * 100 : 0;

    const prompt = `
Eres un abogado senior especializado en análisis de riesgo.

Analiza este caso y proporciona un score de riesgo (BAJO/MEDIO/ALTO) con recomendación:

Caso: ${caso.numero_caso}
Días activo: ${diasActivo}
Capital: $${caso.capital_mn?.toLocaleString() || 0}
Estado: ${caso.estado}

Métricas:
- Juicios: ${totalJuicios} (${juiciosTerminados} terminados)
- Tasa de éxito: ${tasaExito.toFixed(1)}%
- Recuperación: ${porcentajeRecuperacion.toFixed(1)}% del capital

Basándote en estas métricas, clasifica el riesgo y da una recomendación específica.
Responde en formato: RIESGO: [BAJO/MEDIO/ALTO] | Recomendación: [texto conciso]
`;

    const analisis = await callClaudeAPI(prompt, 250);

    // Parsear respuesta
    const riesgoMatch = analisis.match(/RIESGO:\s*(BAJO|MEDIO|ALTO)/i);
    const nivelRiesgo = riesgoMatch ? riesgoMatch[1].toUpperCase() : 'DESCONOCIDO';

    // Guardar en metadata
    await supabase
      .from('casos')
      .update({
        metadata: {
          ...caso.metadata,
          analisis_riesgo: {
            nivel: nivelRiesgo,
            detalles: analisis,
            fecha_analisis: new Date().toISOString(),
          },
        },
      })
      .eq('id', casoId);

    console.log(`[IA] Análisis riesgo caso ${casoId}: ${nivelRiesgo}`);
    return { nivel: nivelRiesgo, detalles: analisis };
  } catch (err) {
    console.error(`[ERROR] analizarRiesgo: ${err.message}`);
    return null;
  }
}

/**
 * Predicción de tiempo hasta resolución
 */
async function predecirTiempoResolucion(juicioId) {
  try {
    const { data: juicio } = await supabase
      .from('juicios')
      .select(`
        numero_expediente,
        tipo_juicio_id,
        etapa_actual,
        fecha_presentacion,
        casos(numero_caso, fecha_creacion)
      `)
      .eq('id', juicioId)
      .single();

    if (!juicio) return null;

    const diasDesdeInicio = Math.floor(
      (Date.now() - new Date(juicio.fecha_presentacion).getTime()) / (1000 * 60 * 60 * 24)
    );

    const prompt = `
Eres un abogado mexicano especialista en predicción de plazos.

¿Cuántos días faltan aproximadamente para resolución?

Tipo de juicio: ${juicio.tipo_juicio_id === 1 ? 'Ejecutivo Mercantil' : 'Ordinario Mercantil'}
Etapa actual: ${juicio.etapa_actual}
Días transcurridos: ${diasDesdeInicio}

Considera la etapa actual y da una estimación en días.
Responde en formato: Estimación: [número] días | Comentario: [texto]
`;

    const prediccion = await callClaudeAPI(prompt, 200);

    // Parsear estimación
    const diasMatch = prediccion.match(/Estimación:\s*(\d+)/i);
    const diasEstimados = diasMatch ? parseInt(diasMatch[1]) : null;

    // Guardar en metadata
    await supabase
      .from('juicios')
      .update({
        metadata: {
          prediccion_tiempo: {
            dias_estimados: diasEstimados,
            prediccion_completa: prediccion,
            fecha_prediccion: new Date().toISOString(),
          },
        },
      })
      .eq('id', juicioId);

    console.log(`[IA] Predicción juicio ${juicioId}: ${diasEstimados} días`);
    return { diasEstimados, prediccion };
  } catch (err) {
    console.error(`[ERROR] predecirTiempoResolucion: ${err.message}`);
    return null;
  }
}

/**
 * Clasificación de documentos
 */
async function clasificarDocumento(documentoId) {
  try {
    const { data: doc } = await supabase
      .from('documentos')
      .select('nombre, descripcion')
      .eq('id', documentoId)
      .single();

    if (!doc) return null;

    const prompt = `
Clasifica este documento legal mexicano en una de estas categorías:
- ESCRITURA
- SENTENCIA
- ACTA
- CONSTANCIA
- PROMOCIÓN
- RESOLUCIÓN
- CONTRATO
- OTRO

Nombre: ${doc.nombre}
Descripción: ${doc.descripcion || 'Sin descripción'}

Responde solo con la categoría.
`;

    const clasificacion = await callClaudeAPI(prompt, 50);

    // Limpiar respuesta
    const categoria = clasificacion.trim().toUpperCase().split('\n')[0];

    await supabase
      .from('documentos')
      .update({
        metadata: {
          clasificacion: categoria,
          fecha_clasificacion: new Date().toISOString(),
        },
      })
      .eq('id', documentoId);

    console.log(`[IA] Clasificación doc ${documentoId}: ${categoria}`);
    return categoria;
  } catch (err) {
    console.error(`[ERROR] clasificarDocumento: ${err.message}`);
    return null;
  }
}

/**
 * Handler HTTP
 */
exports.handler = async (event, context) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true }),
      };
    }

    const { action, entityId } = JSON.parse(event.body || '{}');

    if (!action || !entityId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan parámetros: action, entityId' }),
      };
    }

    let result;

    switch (action) {
      case 'sugerencia-proximo-paso':
        result = await sugerirProximoPaso(entityId);
        break;
      case 'analizar-riesgo':
        result = await analizarRiesgo(entityId);
        break;
      case 'predicir-tiempo':
        result = await predecirTiempoResolucion(entityId);
        break;
      case 'clasificar-documento':
        result = await clasificarDocumento(entityId);
        break;
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Acción desconocida' }),
        };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, result }),
    };
  } catch (err) {
    console.error(`[ERROR] Handler: ${err.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
