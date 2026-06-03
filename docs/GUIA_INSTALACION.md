# 📖 GUÍA DE INSTALACIÓN - JURISCONTROL WEB

Paso a paso para instalar y desplegar JURISCONTROL WEB en desarrollo y producción.

**Tiempo estimado:** 30-45 minutos

---

## 🔍 Verificar Requisitos Previos

### Sistema Operativo
- Windows 10+ / macOS 10.14+ / Linux (Ubuntu 20.04+)

### Herramientas Necesarias

```bash
# Verificar Node.js
node --version
# Debe ser >= 18.0.0

# Verificar npm
npm --version
# Debe ser >= 9.0.0

# Verificar Git
git --version
# Debe ser >= 2.40.0
```

Si falta algo, instalar desde:
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/

### Cuentas en Línea
- [ ] GitHub (para clonar repo)
- [ ] Supabase (https://supabase.com)
- [ ] Netlify (https://netlify.com)
- [ ] Anthropic (para Claude API)

---

## PASO 1: CLONAR REPOSITORIO

```bash
# Crear carpeta de trabajo
mkdir ~/desarrollo
cd ~/desarrollo

# Clonar repo
git clone https://github.com/rannix/juriscontrol-web.git
cd juriscontrol-web

# Verificar contenido
ls -la
# Debe ver: src/, database/, netlify/, docs/, package.json, etc.
```

---

## PASO 2: INSTALAR DEPENDENCIAS

```bash
# Instalar todas las dependencias
npm install

# Esto descargará ~400MB y tomará 2-5 minutos
# Debe completar sin errores

# Verificar instalación
npm list --depth=0
# Debe ver React, Vite, Supabase, jsPDF, etc.
```

**Si hay errores:**
```bash
# Limpiar caché y reintentar
npm cache clean --force
npm install
```

---

## PASO 3: CREAR PROYECTO SUPABASE

### 3.1 Crear Proyecto

1. Ir a https://app.supabase.com
2. Click "New Project"
3. Llenar formulario:
   - Project Name: `juriscontrol-dev`
   - Database Password: `GenerarContrasenhaSegura123!`
   - Region: Seleccionar cercano (recomendado: us-east-1)
4. Click "Create new project"
5. **Esperar 2-3 minutos** mientras se crea

### 3.2 Obtener Credenciales

1. En Supabase dashboard, ir a **Settings > API**
2. Copiar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `VITE_SUPABASE_SERVICE_ROLE_KEY`

```bash
# Guardar estas credenciales, las usaremos en PASO 4
```

### 3.3 Habilitar Extensiones

En Supabase SQL Editor, ejecutar:

```sql
-- Habilitar extensión para http (webhooks)
CREATE EXTENSION IF NOT EXISTS http;

-- Habilitar extensión para búsqueda de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verificar que se crearon
SELECT extname FROM pg_extension;
```

---

## PASO 4: CONFIGURAR VARIABLES DE ENTORNO

### 4.1 Crear .env.local

```bash
# En la raíz del proyecto
cp .env.example .env.local

# Editar el archivo (usar editor favorito)
nano .env.local
# o con VS Code:
code .env.local
```

### 4.2 Llenar Variables

```bash
# ═══════════════════════════════════════════════════════════
# SUPABASE - Obtenidas en PASO 3.2
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CLAUDE API - De https://console.anthropic.com
VITE_CLAUDE_API_KEY=sk-ant-v0-...

# WEBHOOK SECRET - Generar valor seguro
VITE_SUPABASE_WEBHOOK_SECRET=tu_secret_largo_seguro_aqui_1234567890

# NETLIFY - Solo para producción (dejar en blanco por ahora)
NETLIFY_SITE_ID=
NETLIFY_AUTH_TOKEN=

# LOCAL DEV
VITE_API_URL=http://localhost:3000
```

**Guardar archivo (Ctrl+S).**

---

## PASO 5: CREAR ESQUEMA DE BASE DE DATOS

### 5.1 Ejecutar Schema

1. En Supabase, ir a **SQL Editor**
2. Click "New Query"
3. Copiar contenido de `database/schema.sql`
4. Pegar en el editor
5. Click "Run" (Ctrl+Enter)
6. **Esperar a que termine** (1-2 minutos)

```bash
# Verificar que se crearon las tablas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
# Debe listar: casos, juicios, demandados, avalistas, etc.
```

### 5.2 Cargar Datos Iniciales

1. Click "New Query" nuevamente
2. Copiar contenido de `database/seed.sql`
3. Pegar y ejecutar
4. **Esperar a que termine**

Ahora la BD tiene datos de ejemplo para testing.

### 5.3 Ejecutar Triggers (FASE 6)

1. Click "New Query"
2. Copiar contenido de `netlify/functions/triggers.sql`
3. Pegar y ejecutar

Esto crea los triggers para notificaciones y IA.

---

## PASO 6: PRUEBA LOCAL (DESARROLLO)

### 6.1 Iniciar Dev Server

```bash
# En la raíz del proyecto
npm run dev

# Output esperado:
# VITE v4.4.9 ready in 123 ms
# ➜ Local: http://localhost:3000/
# ➜ Press q to quit
```

### 6.2 Abrir en Navegador

1. Abrir http://localhost:3000
2. Debe ver página de login
3. Ingresar credenciales de prueba:
   - Email: `admin@example.com`
   - Password: `password123`

**Si funciona:** ✅ Pasar a PASO 7

**Si no funciona:** Ver troubleshooting en el final

---

## PASO 7: COMPILAR PARA PRODUCCIÓN

```bash
# Compilar (minificar, optimizar)
npm run build

# Output esperado:
# ✓ built in 12.23s
# dist/index.html               2.45 kB
# dist/assets/index-ABC123.js   125.34 kB
# dist/assets/index-XYZ789.css  5.67 kB

# Verificar que todo está en ./dist
ls -la dist/
```

---

## PASO 8: CONFIGURAR Y DESPLEGAR EN NETLIFY

### 8.1 Conectar Repositorio

1. Ir a https://netlify.com
2. Click "Add new site"
3. Seleccionar "Connect to Git"
4. Autorizar GitHub
5. Seleccionar repository `juriscontrol-web`
6. Click "Deploy site"

### 8.2 Configurar Build Settings

En Netlify Dashboard > Site settings > Build & deploy:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `18.x`

### 8.3 Agregar Variables de Entorno

En Netlify Dashboard > Site settings > Build & deploy > Environment:

```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...
VITE_CLAUDE_API_KEY = sk-ant-...
VITE_SUPABASE_WEBHOOK_SECRET = tu_secret
```

### 8.4 Configurar Netlify Functions

Las funciones serverless en `netlify/functions/` se deployan automáticamente.

Verificar que existan:
- `.netlify/functions/notifications`
- `.netlify/functions/ai-suggestions`
- `.netlify/functions/smart-alerts`
- `.netlify/functions/auth-webhook`

---

## PASO 9: CONFIGURAR WEBHOOKS EN SUPABASE

En Supabase > Database > Webhooks:

### Webhook 1: Nuevo Avance
```
Event: INSERT on avances_juicio
HTTP Method: POST
URL: https://tu-dominio.netlify.app/.netlify/functions/notifications
Headers:
  x-webhook-secret: tu_secret
```

### Webhook 2: Cambio de Casos
```
Event: UPDATE on casos
HTTP Method: POST
URL: https://tu-dominio.netlify.app/.netlify/functions/smart-alerts
Headers:
  x-webhook-secret: tu_secret
```

### Webhook 3: Cambio de Juicios
```
Event: UPDATE on juicios
HTTP Method: POST
URL: https://tu-dominio.netlify.app/.netlify/functions/smart-alerts
Headers:
  x-webhook-secret: tu_secret
```

---

## ✅ VERIFICACIÓN FINAL

Ejecutar este checklist:

- [ ] Dev server inicia sin errores (`npm run dev`)
- [ ] Login funciona con credenciales de prueba
- [ ] Puedo ver Dashboard
- [ ] Puedo crear un nuevo caso
- [ ] Supabase BD tiene datos (verificar en tabla `casos`)
- [ ] Netlify deploy se completó
- [ ] Sitio en vivo es accesible
- [ ] Webhooks están activos en Supabase
- [ ] Variables de entorno están configuradas

Si todo está ✅: **¡Listo para producción!**

---

## 🆘 TROUBLESHOOTING

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
npm install
```

### "Module not found: jspdf"
```bash
npm install jspdf jspdf-autotable
```

### "VITE_SUPABASE_URL is not defined"
- Verificar que `.env.local` existe
- Verificar que tiene las variables correctas
- Reiniciar dev server: `npm run dev`

### "Cannot connect to Supabase"
- Verificar URL es correcta (debe tener `.supabase.co`)
- Verificar VITE_SUPABASE_ANON_KEY
- Verificar que el proyecto Supabase está "Running"
- En Supabase Settings > API, verificar CORS está permitido

### "Login no funciona"
- Verificar usuario existe: En Supabase > Auth > Users
- Verificar contraseña es correcta
- Si necesario crear usuario nuevo en Supabase Auth
- Ejecutar `database/seed.sql` de nuevo

### "Notificaciones no llegan"
- Verificar webhook está activo en Supabase
- Comprobar URL del webhook es correcta
- Revisar logs en Netlify Functions > Log Streaming
- Verificar que `x-webhook-secret` es igual en ambos lados

### "PDF sale vacío"
- Verificar que jsPDF está instalado: `npm list jspdf`
- Comprobar que los datos no son null/undefined
- Revisar console de navegador para errores

### "Deploy en Netlify falla"
```bash
# Compilar localmente para probar
npm run build

# Si hay errores, arregarlos
npm run lint

# Luego hacer push a GitHub
git add .
git commit -m "Fix build"
git push origin main
# Netlify redeploy automáticamente
```

---

## 📞 SOPORTE

Si todo falla:

1. Revisar los logs:
   - Netlify: Dashboard > Functions > Log Streaming
   - Supabase: Dashboard > Database > Query Performance
   - Dev: Abrir DevTools (F12) y revisar Console

2. Consultar documentación:
   - `/docs/GUIA_USUARIO.md` - Manual de usuario
   - `/docs/ARQUITECTURA.md` - Diagrama técnico
   - README.md - Descripción general

3. Contactar soporte:
   - Email: soporte@juriscontrol.com
   - GitHub Issues: https://github.com/rannix/juriscontrol-web/issues

---

**¡Instalación completada! 🎉**

Próximo paso: Leer `/docs/GUIA_USUARIO.md` para aprender a usar el sistema.
