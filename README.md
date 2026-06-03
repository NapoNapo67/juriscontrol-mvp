# JURISCONTROL WEB

Sistema de Gestión Legal Integral modernizado a plataforma web.

## Estructura del Proyecto

```
proyecto-legal/
├── src/
│   ├── components/       # Componentes React reutilizables
│   │   ├── Auth/         # Autenticación
│   │   ├── Layout/       # Estructura principal
│   │   ├── Casos/        # Gestión de casos
│   │   ├── Juicios/      # Gestión de juicios
│   │   └── Dashboard/    # Panel de control
│   ├── pages/            # Páginas de la aplicación
│   ├── hooks/            # Custom hooks (useAuth, useCasos, useJuicios)
│   ├── contexts/         # Contextos React (AuthContext)
│   ├── lib/              # Cliente Supabase y utilidades
│   ├── styles/           # CSS global
│   ├── App.tsx           # Componente raíz con routing
│   └── main.tsx          # Entry point
├── netlify/
│   └── functions/        # Funciones serverless para webhooks
├── database/
│   ├── schema.sql        # Schema SQL de Supabase
│   ├── seed.sql          # Datos iniciales
│   └── rls.sql           # Row Level Security policies
├── package.json          # Dependencias
├── tsconfig.json         # Configuración TypeScript
├── vite.config.ts        # Configuración Vite
└── index.html            # HTML principal
```

## Stack Técnico

- **Frontend:** React 18 + TypeScript + Vite
- **Estilo:** CSS vanilla (responsive, mobile-first)
- **Enrutamiento:** React Router v6
- **Backend:** Supabase (PostgreSQL + RLS + Auth)
- **Deploy:** Netlify (frontend + serverless functions)

## Instalación

1. **Clonar/descargar el proyecto**
```bash
cd juriscontrol-web
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear `.env.local` con:
```
REACT_APP_SUPABASE_URL=tu-supabase-url
REACT_APP_SUPABASE_ANON_KEY=tu-anon-key
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Build para producción**
```bash
npm run build
```

## Componentes Principales

### Authentication
- **LoginForm.tsx:** Formulario de login con Supabase
- **LogoutButton.tsx:** Botón de logout
- **AuthContext.tsx:** Contexto global de autenticación
- **useAuth.ts:** Hook para acceder al contexto

### Layout
- **Header.tsx:** Encabezado con usuario y navegación
- **Sidebar.tsx:** Menú lateral con navegación
- **MainLayout.tsx:** Layout principal que envuelve Header + Sidebar

### Casos
- **CasosList.tsx:** Listado con paginación y filtros
- **CasoDetail.tsx:** Vista detallada de un caso
- **CasoForm.tsx:** Formulario crear/editar
- **DemandadosList.tsx:** Listado de demandados

### Juicios
- **JuiciosList.tsx:** Listado con filtros
- **JuicioDetail.tsx:** Vista detallada con timeline de etapas
- **JuicioForm.tsx:** Formulario crear/editar
- **AvancesList.tsx:** Timeline de avances procesales

### Dashboard
- **Dashboard.tsx:** Panel con KPIs, gráficos y tablas

## Hooks Personalizados

### useAuth
```typescript
const { usuario, perfil, cargando, error, iniciarSesion, cerrarSesion } = useAuth();
```

### useCasos
```typescript
const { casos, obtenerCasos, crearCaso, actualizarCaso, eliminarCaso } = useCasos();
```

### useJuicios
```typescript
const { juicios, obtenerJuicios, crearJuicio, actualizarJuicio } = useJuicios();
```

## Rutas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | HomePage | Landing page |
| `/login` | LoginPage | Formulario login |
| `/dashboard` | DashboardPage | Panel principal |
| `/casos` | CasosPage | Listado de casos |
| `/casos/new` | CasoFormPage | Nuevo caso |
| `/casos/:id` | CasoDetailPage | Detalle de caso |
| `/juicios` | JuiciosPage | Listado de juicios |
| `/juicios/new` | JuicioFormPage | Nuevo juicio |
| `/juicios/:id` | JuicioDetailPage | Detalle de juicio |

## Deployment en Netlify

1. **Conectar repositorio a Netlify**
2. **Configurar variables de entorno en Netlify:**
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
3. **Deploy automático en cada push**

## Base de Datos

Las migraciones SQL están en `database/`:
- `schema.sql` - Crear tablas y estructuras
- `seed.sql` - Cargar datos iniciales
- `rls.sql` - Configurar seguridad a nivel de fila

Ejecutar en Supabase SQL Editor:
```sql
-- 1. Crear schema
-- Copiar contenido de schema.sql
-- 2. Cargar datos iniciales
-- Copiar contenido de seed.sql
-- 3. Activar RLS
-- Copiar contenido de rls.sql
```

## Estilos

CSS global en `src/styles/globals.css` con:
- Variables CSS (colores, espacios, sombras)
- Componentes base (botones, formularios, tablas)
- Sistema de grid responsive
- Breakpoints para móvil (768px, 480px)

## Características

✅ Autenticación con Supabase
✅ CRUD completo para Casos y Juicios
✅ Filtros y búsqueda
✅ Paginación
✅ Timeline visual de etapas procesales
✅ Dashboard con KPIs
✅ Diseño responsive (mobile-first)
✅ RLS para seguridad a nivel de fila
✅ TypeScript para type safety
✅ Hooks personalizados para lógica compartida

## Próximas Fases

- [ ] FASE 6: Notificaciones & IA
- [ ] FASE 7: Admin & Configuración
- [ ] FASE 8: Documentación & Testing

## Licencia

Todos los derechos reservados © 2026 RANNIX Consulting
"# juriscontrol-mvp" 
