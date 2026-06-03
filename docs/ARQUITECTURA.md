# 🏗️ ARQUITECTURA - JURISCONTROL WEB

Diagrama técnico y flujos de la arquitectura de JURISCONTROL WEB.

---

## 🎯 VISIÓN DE ALTO NIVEL

```
┌─────────────────────────────────────────────────────────────────┐
│                          USUARIOS                                │
│              (Super Admin, Coordinador, Asistente, Auditor)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼────────┐         ┌─────────▼──────┐
         │  WEB (React)  │         │  Mobile (Fut)  │
         │  Vite + TS    │         │   React Native │
         └──────┬────────┘         └─────────────────┘
                │
        ┌───────┴────────┐
        │                │
   ┌────▼──────┐   ┌────▼──────────┐
   │ Supabase  │   │ Netlify       │
   │ Auth (JWT)│   │ Functions     │
   └────┬──────┘   │ (Serverless)  │
        │          └────┬──────────┘
        │               │
   ┌────▼──────────┬────▼─────────┐
   │ PostgreSQL    │ Claude API   │
   │ Supabase DB   │ (Webhooks)   │
   │ RLS Policies  │              │
   └───────────────┴──────────────┘
```

---

## 📊 ARQUITECTURA POR CAPAS

### Capa de Presentación (Frontend)

```
React Components
├── Pages (routing)
├── Components (reutilizables)
│   ├── Auth (LoginForm, LogoutButton)
│   ├── Layout (Header, Sidebar, MainLayout)
│   ├── Casos (CRUD)
│   ├── Juicios (CRUD)
│   ├── Dashboard (KPIs)
│   └── Admin (Users, Catalogos, Reports)
├── Hooks (useAuth, useCasos, useJuicios)
└── Utils (reportGenerator, excelExporter)

Estilos: CSS vanilla + inline
Enrutamiento: React Router v6
```

### Capa de Lógica (BL)

```
Hooks personalizados
├── useAuth() - Gestión de sesión y perfil
├── useCasos() - CRUD de casos + demandados
└── useJuicios() - CRUD de juicios + avances

Contextos
└── AuthContext - Estado global de usuario

Utilidades
├── reportGenerator.ts - PDFs con jsPDF
├── excelExporter.ts - Excel con xlsx
└── supabase.ts - Cliente Supabase
```

### Capa de API/Backend

```
Supabase
├── Authentication (JWT via supabase-js)
├── PostgreSQL Database
│   ├── Tablas operativas (casos, juicios, avances)
│   ├── Catálogos (7 tipos)
│   ├── Notificaciones
│   └── Audit log
├── Row Level Security (RLS)
│   ├── super_admin: acceso total
│   ├── coordinador: su zona
│   ├── asistente: asignados
│   └── auditor: solo lectura
├── Realtime (WebSockets)
├── Storage (documentos, PDFs)
└── Edge Functions

Netlify Functions
├── notifications.js - Notificaciones en tiempo real
├── ai-suggestions.js - Claude API integraciones
├── smart-alerts.js - Alertas inteligentes
└── auth-webhook.js - Sincronización auth
```

### Capa de Datos

```
PostgreSQL (Supabase Cloud)
├── Schema público
│   ├── Tablas organizacionales
│   │   ├── regionales
│   │   ├── zonas
│   │   ├── plazas
│   │   ├── sucursales
│   │   ├── juzgados
│   │   └── asistentes
│   ├── Catálogos
│   │   ├── tipos_juicio
│   │   ├── tipos_credito
│   │   ├── etapas_procesales
│   │   ├── giros_deudor
│   │   ├── areas_banco
│   │   ├── tipos_baja
│   │   └── tipos_gasto
│   ├── Datos operativos
│   │   ├── casos
│   │   ├── demandados
│   │   ├── avalistas
│   │   ├── juicios
│   │   ├── avances_juicio
│   │   ├── gastos
│   │   ├── recuperaciones
│   │   ├── documentos
│   │   └── notificaciones
│   └── Audit
│       └── audit.log
├── Índices (FK, GIN, búsqueda)
└── Triggers (automáticos)
```

---

## 🔄 FLUJOS PRINCIPALES

### FLUJO 1: AUTENTICACIÓN

```
Usuario
   │
   ├─ Ingresar email + password
   │
   ▼
LoginForm.tsx
   │
   ├─ Llamar useAuth().iniciarSesion()
   │
   ▼
Supabase Auth (JWT)
   │
   ├─ Verificar credenciales
   │ ├─ Si válido: retornar JWT token
   │ └─ Si inválido: error
   │
   ▼
AuthContext (actualizar estado)
   │
   ├─ Guardar usuario en contexto
   ├─ Obtener perfil (rol, zona)
   ├─ Redirigir a /dashboard
   │
   ▼
Dashboard ✅
```

### FLUJO 2: CREAR CASO

```
Usuario (Coordinador+)
   │
   ├─ Navegar a /casos/new
   │
   ▼
CasoForm.tsx
   │
   ├─ Llenar formulario (número, demandado, capital, etc.)
   ├─ Validar campos requeridos
   │
   ▼
useC asos().crearCaso()
   │
   ├─ INSERT en tabla `casos`
   ├─ PostgreSQL RLS verifica rol
   │ └─ coordinador: ✅ puede crear en su zona
   │ └─ asistente: ❌ no puede crear
   │
   ▼
Trigger SQL (after INSERT)
   │
   ├─ Actualizar metadata
   ├─ Crear notificación a asignado
   │
   ▼
Caso creado ✅
   │
   └─ Redirigir a /casos/:id
```

### FLUJO 3: CREAR JUICIO & REGISTRAR AVANCE

```
Usuario ve caso
   │
   ├─ Click "+ Nuevo Juicio"
   │
   ▼
JuicioForm.tsx
   │
   ├─ Llenar expediente, juzgado, tipo
   │
   ▼
useJuicios().crearJuicio()
   │
   ├─ INSERT en `juicios`
   ├─ Set etapa_actual = "PRESENTACIÓN DEMANDA"
   │
   ▼
Trigger (after INSERT)
   │
   ├─ Webhook a notifications.js
   ├─ Webhook a ai-suggestions.js (sugerir próximo paso)
   │
   ▼
Juicio creado con timeline ✅
   │
   ▼
Usuario registra avance
   │
   ├─ Click "+ Nuevo Avance"
   │
   ▼
Llenar: fecha, etapa, descripción
   │
   ▼
useJuicios().crearAvance()
   │
   ├─ INSERT en `avances_juicio`
   │
   ▼
Trigger (after INSERT)
   │
   ├─ Webhook a notifications.js
   │   ├─ Crear notificación para asistente
   │ ├─ Enviar a Supabase Real-time
   │ └─ Usuario ve notificación 🔔
   │
   ├─ Webhook a ai-suggestions.js
   │   ├─ Llamar Claude API
   │   ├─ Generar sugerencia próximo paso
   │   └─ Guardar en metadata
   │
   ├─ Webhook a smart-alerts.js
   │   ├─ Evaluar reglas de negocio
   │   └─ Crear alertas si aplica
   │
   ▼
Avance registrado ✅
```

### FLUJO 4: GENERACIÓN DE REPORTE

```
Usuario (Admin)
   │
   ├─ Ir a /admin > Reportes
   │
   ▼
ReportesAdmin.tsx
   │
   ├─ Seleccionar filtros (fecha, sucursal, etc.)
   ├─ Click "Descargar PDF" (Casos por Sucursal)
   │
   ▼
generarReportePDF()
   │
   ├─ Query: SELECT casos WHERE fecha BETWEEN ? AND ?
   │ └─ Supabase retorna datos filtrados
   │
   ├─ Procesar datos:
   │   ├─ Agrupar por sucursal
   │   ├─ Calcular totales
   │   └─ Formatear moneda
   │
   ├─ Generar PDF:
   │   ├─ jsPDF: crear documento
   │   ├─ autoTable: crear tablas
   │   ├─ Encabezado: JURISCONTROL WEB
   │   ├─ Datos: tablas por sucursal
   │   ├─ Pie de página: fecha/hora/página
   │   │
   │ └─ doc.save('reporte.pdf')
   │
   ▼
PDF descargado automáticamente ✅
```

### FLUJO 5: NOTIFICACIONES EN TIEMPO REAL

```
Evento en BD (INSERT avances_juicio)
   │
   ▼
SQL Trigger
   │
   ├─ Ejecutar: trigger_nuevo_avance()
   │
   ▼
Webhook POST
   │
   ├─ URL: https://netlify.../notifications
   ├─ Body: evento + datos
   ├─ Header: x-webhook-secret
   │
   ▼
Netlify Function: notifications.js
   │
   ├─ Verificar secret
   ├─ INSERT en `notificaciones` tabla
   │   └─ usuario_id = asistente
   │   └─ tipo = "NUEVO_AVANCE"
   │   └─ prioridad = MEDIA
   │
   ▼
Supabase Realtime
   │
   ├─ Emitir evento a cliente
   │ └─ Canal: `notificaciones:user_id`
   │
   ▼
Frontend (useNotificaciones hook)
   │
   ├─ Escuchar cambios
   ├─ Actualizar estado local
   ├─ Mostrar notificación 🔔
   │
   ▼
Usuario ve notificación en tiempo real ✅
```

### FLUJO 6: IA - SUGERENCIA PRÓXIMO PASO

```
Se registra nuevo avance
   │
   ▼
SQL Trigger: trigger_ia_sugerencias_avance
   │
   ├─ Webhook POST a ai-suggestions.js
   │
   ▼
Netlify Function: ai-suggestions.js
   │
   ├─ action: "sugerencia-proximo-paso"
   ├─ entityId: juicio_id
   │
   ▼
Obtener historial del juicio
   │
   ├─ SELECT avances WHERE juicio_id = ?
   ├─ SELECT juicio data (etapa, tipo, fecha)
   │
   ▼
Llamar Claude API
   │
   ├─ Prompt: historial + contexto legal
   ├─ Rate limit check: 10 req/hora
   ├─ Response: sugerencia de próximo paso
   │
   ▼
Guardar en metadata
   │
   ├─ UPDATE juicios SET metadata = {...}
   │ └─ metadata.ultima_sugerencia_ia = respuesta
   │
   ▼
Frontend actualiza
   │
   ├─ Mostrar sugerencia IA en detalle juicio
   │
   ▼
Usuario ve recomendación ✅
```

---

## 🔐 SEGURIDAD: RLS (Row Level Security)

### Cómo funciona RLS

```
Usuario intenta: SELECT * FROM casos

   ▼

PostgreSQL RLS Policy
   │
   ├─ super_admin
   │   └─ (auth.uid() has role 'super_admin')
   │   └─ ALLOW: todos los casos ✅
   │
   ├─ coordinador
   │   └─ (casos.sucursal_id IN user's zones)
   │   └─ ALLOW: casos de su zona ✅
   │
   ├─ asistente
   │   └─ (casos.asistente_id = auth.uid())
   │   └─ ALLOW: solo asignados ✅
   │
   └─ auditor
       └─ (SELECT only, no UPDATE/DELETE)
       └─ ALLOW: todo pero read-only ✅

Resultado: Solo datos permitidos son retornados
```

---

## 📱 RESPONSIVIDAD

### Breakpoints

```
Desktop (> 1024px)
├─ Sidebar siempre visible
├─ Layout: Header + Sidebar + Content
├─ Tablas: Horizontal scroll si es necesario

Tablet (768px - 1024px)
├─ Sidebar colapsible
├─ Menú togglable
├─ Tablas: Ajustadas

Mobile (< 768px)
├─ Sidebar: Hidden (menú hamburguesa)
├─ Header: Comprimido
├─ Tablas: Desplazamiento horizontal
├─ Modales: Fullscreen
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Development

```
Local Machine
├─ npm run dev (React dev server en :3000)
├─ .env.local (variables locales)
└─ Supabase Cloud (BD compartida)
```

### Production

```
GitHub
   │
   ├─ Push a main
   │
   ▼
GitHub Actions (CI/CD)
   │
   ├─ npm run lint
   ├─ npm run build
   ├─ Tests (próxima)
   │
   ▼
Netlify
   │
   ├─ Frontend (React SPA)
   │ └─ Deployed en https://juriscontrol.netlify.app
   │
   ├─ Netlify Functions (serverless)
   │ ├─ notifications.js
   │ ├─ ai-suggestions.js
   │ ├─ smart-alerts.js
   │ └─ auth-webhook.js
   │
   ▼
Supabase Cloud
   │
   ├─ PostgreSQL (prod DB)
   ├─ Supabase Auth
   ├─ Realtime (WebSockets)
   └─ Edge Functions
```

---

## 📈 ESCALABILIDAD

### Límites Actuales

- **BD:** PostgreSQL (Supabase managed) - hasta 500,000 filas
- **Usuarios:** Sin límite (JWT stateless)
- **Concurrencia:** Real-time para 100+ usuarios simultáneos
- **Almacenamiento:** 5GB (Supabase free tier)

### Mejoras Futuras

- [ ] Caché con Redis
- [ ] CDN para assets
- [ ] Lazy loading de tablas grandes
- [ ] Compresión de PDFs
- [ ] Async job queue (Bull)
- [ ] Search de texto completo (Meilisearch)

---

## 🔍 MONITOREO

### Qué monitorear

- **Uptime:** Netlify status page
- **Performance:** Netlify analytics
- **Errores:** Sentry (próximo)
- **Logs:** Netlify Functions logs
- **DB:** Supabase dashboard

### Métricas Clave

- Tiempo de respuesta < 200ms
- Uptime > 99.9%
- Tasa de error < 0.1%

---

## 📚 REFERENCIAS

- React 18: https://react.dev
- Supabase: https://supabase.com/docs
- Netlify: https://docs.netlify.com
- TypeScript: https://www.typescriptlang.org
- Vite: https://vitejs.dev

---

**Última actualización:** Junio 2026
**Versión:** 1.0.0
