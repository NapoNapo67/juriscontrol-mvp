// ============================================================================
// netlify/functions/auth-webhook.js
// Webhook para sincronizar auth.users → tabla perfiles en Supabase
// Se ejecuta cuando se crean o modifican usuarios en Supabase Auth
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// Variables de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET || '';

// Cliente Supabase con service role (acceso sin RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

exports.handler = async (event) => {
  try {
    // Validar método HTTP
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método no permitido' }),
      };
    }

    // Validar secret (autenticación básica del webhook)
    const authHeader = event.headers['x-webhook-secret'] || event.headers['authorization'];
    
    if (!authHeader || !validarSecret(authHeader)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No autorizado' }),
      };
    }

    // Parsear payload
    const payload = JSON.parse(event.body);
    
    console.log('📨 Webhook recibido:', {
      event: payload.type,
      user_id: payload.data?.id,
      email: payload.data?.email,
    });

    // Procesar según tipo de evento
    switch (payload.type) {
      case 'user.created':
        await handleUserCreated(payload.data);
        break;

      case 'user.updated':
        await handleUserUpdated(payload.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(payload.data);
        break;

      default:
        console.log('⚠️  Evento desconocido:', payload.type);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Evento ${payload.type} procesado`,
      }),
    };

  } catch (error) {
    console.error('❌ Error en webhook:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error procesando webhook',
        details: error.message,
      }),
    };
  }
};

// ============================================================================
// HANDLERS POR TIPO DE EVENTO
// ============================================================================

/**
 * Crea un nuevo perfil cuando se registra un usuario en Auth
 */
async function handleUserCreated(userData) {
  try {
    const { id, email, user_metadata } = userData;

    // Extraer datos del metadata
    const nombreCompleto = user_metadata?.nombre_completo || email.split('@')[0];
    const rol = user_metadata?.rol || 'asistente';
    const zonaId = user_metadata?.zona_id || null;

    // Verificar si el perfil ya existe
    const { data: existingProfile } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', id)
      .single();

    if (existingProfile) {
      console.log('ℹ️  Perfil ya existe:', id);
      return;
    }

    // Crear nuevo perfil
    const { data, error } = await supabase
      .from('perfiles')
      .insert([
        {
          id,
          nombre_completo: nombreCompleto,
          email,
          rol,
          zona_id: zonaId,
        },
      ])
      .select();

    if (error) {
      throw new Error(`Error creando perfil: ${error.message}`);
    }

    console.log('✅ Perfil creado:', {
      id,
      email,
      rol,
      nombre_completo: nombreCompleto,
    });

    // Crear notificación de bienvenida
    await crearNotificacionBienvenida(id, nombreCompleto, email);

  } catch (error) {
    console.error('❌ Error en handleUserCreated:', error.message);
    throw error;
  }
}

/**
 * Actualiza el perfil cuando se modifica un usuario en Auth
 */
async function handleUserUpdated(userData) {
  try {
    const { id, email, user_metadata } = userData;

    // Obtener perfil actual
    const { data: perfil, error: fetchError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Error obteniendo perfil: ${fetchError.message}`);
    }

    if (!perfil) {
      console.log('ℹ️  Perfil no encontrado, creando nuevo:', id);
      await handleUserCreated(userData);
      return;
    }

    // Preparar datos actualizados
    const updates = {
      email,
      updated_at: new Date().toISOString(),
    };

    // Actualizar solo los campos que vienen en metadata
    if (user_metadata?.nombre_completo) {
      updates.nombre_completo = user_metadata.nombre_completo;
    }

    if (user_metadata?.rol) {
      updates.rol = user_metadata.rol;
    }

    if (user_metadata?.zona_id !== undefined) {
      updates.zona_id = user_metadata.zona_id;
    }

    // Ejecutar actualización
    const { error } = await supabase
      .from('perfiles')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(`Error actualizando perfil: ${error.message}`);
    }

    console.log('✅ Perfil actualizado:', {
      id,
      email,
      cambios: updates,
    });

  } catch (error) {
    console.error('❌ Error en handleUserUpdated:', error.message);
    throw error;
  }
}

/**
 * Realiza soft delete del perfil cuando se elimina un usuario
 */
async function handleUserDeleted(userData) {
  try {
    const { id } = userData;

    // Soft delete: marcar como eliminado
    const { error } = await supabase
      .from('perfiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Error eliminando perfil: ${error.message}`);
    }

    console.log('✅ Perfil eliminado (soft delete):', id);

  } catch (error) {
    console.error('❌ Error en handleUserDeleted:', error.message);
    throw error;
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Valida el secret del webhook
 */
function validarSecret(authHeader) {
  if (!WEBHOOK_SECRET) {
    console.warn('⚠️  WEBHOOK_SECRET no configurada, permitiendo todo');
    return true;
  }

  // Validar Bearer token o header directo
  const token = authHeader.replace('Bearer ', '');
  return token === WEBHOOK_SECRET;
}

/**
 * Crea una notificación de bienvenida para el nuevo usuario
 */
async function crearNotificacionBienvenida(usuarioId, nombreCompleto, email) {
  try {
    const { error } = await supabase
      .from('notificaciones')
      .insert([
        {
          usuario_id: usuarioId,
          tipo: 'sistema',
          prioridad: 'media',
          titulo: 'Bienvenido a JURISCONTROL',
          mensaje: `Hola ${nombreCompleto}, tu cuenta ha sido creada exitosamente. Bienvenido al sistema.`,
          leida: false,
          entidad_tipo: 'usuario',
          entidad_id: usuarioId,
        },
      ]);

    if (error) {
      console.warn('⚠️  Error creando notificación de bienvenida:', error.message);
      // No lanzar error, es no-crítico
      return;
    }

    console.log('✅ Notificación de bienvenida creada:', email);

  } catch (error) {
    console.warn('⚠️  Error en crearNotificacionBienvenida:', error.message);
  }
}

// ============================================================================
// CONFIGURACIÓN DEL WEBHOOK EN SUPABASE
// ============================================================================
/*
Para activar este webhook en Supabase Dashboard:

1. Dashboard → Project Settings → Webhooks
2. Create webhook
3. Nombre: "auth-webhook-juriscontrol"
4. URL: https://tu-dominio.netlify.app/.netlify/functions/auth-webhook
5. Eventos: user.created, user.updated, user.deleted
6. Header personalizado:
   Key: "x-webhook-secret"
   Value: (colocar valor en Netlify ENV como SUPABASE_WEBHOOK_SECRET)

Alternativa: usar Bearer token en Authorization header:
   Authorization: Bearer YOUR_SECRET

7. Guardar y probar
*/

// ============================================================================
// VARIABLES DE AMBIENTE REQUERIDAS
// ============================================================================
/*
Configurar en Netlify Site Settings → Build & Deploy → Environment:

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_WEBHOOK_SECRET=tu_secret_seguro

El SUPABASE_SERVICE_ROLE_KEY se obtiene de:
  Supabase Dashboard → Settings → API → Service Role Key
  (No exponer públicamente, solo en backend/Netlify functions)
*/

// ============================================================================
// FIN netlify/functions/auth-webhook.js
// ============================================================================
