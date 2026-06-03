# ⚡ NETLIFY FUNCTIONS

Funciones serverless para Juriscontrol Web.

## Funciones

1. **auth-webhook.js** - Sincronización de autenticación
   - Trigger: Supabase Auth → Webhook
   - Crea perfil de usuario automáticamente

2. **notifications.js** - Sistema de notificaciones
   - Trigger: INSERT en avances_juicio
   - Trigger: UPDATE en casos
   - Cron: 0 AM diaria

3. **ai-suggestions.js** - Inteligencia Artificial
   - Trigger: INSERT en avances_juicio
   - Calls: Claude API
   - Rate limit: 10 req/hora

4. **smart-alerts.js** - Alertas inteligentes
   - Trigger: UPDATE juicios
   - Reglas: casos dormidos, vencimientos, etc.
   - Cron: 6 AM diaria

## Deployment

Las funciones se despliegan automáticamente con Netlify:

1. Archivos están en `netlify/functions/`
2. Al hacer push a GitHub
3. Netlify automáticamente deploya

## Ambiente

Variables requeridas en Netlify:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_WEBHOOK_SECRET
- ANTHROPIC_API_KEY

Ver: `.env.example`

## Testing

```bash
# Local
netlify functions:invoke notifications

# Prod logs
netlify functions:invoke --prod
```
