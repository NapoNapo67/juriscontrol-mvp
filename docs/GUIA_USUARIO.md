# 👤 GUÍA DE USUARIO - JURISCONTROL WEB

Manual completo para usar JURISCONTROL WEB como usuario final.

---

## 🔐 ACCESO AL SISTEMA

### Login

1. Abrir https://juriscontrol.example.com (o tu URL)
2. Ingresar **Email** y **Contraseña**
3. Click "Iniciar Sesión"
4. Si es primer acceso, cambiar contraseña temporal

### Si olvidas tu contraseña

1. En login, click "¿Olvidaste tu contraseña?"
2. Ingresar tu email
3. Revisar correo (puede tardar 1 minuto)
4. Hacer click en link del email
5. Crear nueva contraseña

---

## 🗺️ NAVEGACIÓN PRINCIPAL

### Dashboard (Inicio)

Al iniciar sesión, ves el Dashboard con:
- **3 KPIs:** Casos Activos | Juicios en Trámite | Recuperación Total
- **Últimos 5 casos** creados
- **Últimos 5 juicios** actualizados
- **Gráfico** de distribución por estado

### Menú Lateral

Opciones según tu rol:
- 📊 **Dashboard** - Panel principal
- 📋 **Casos** - Gestión de casos
- ⚖️ **Juicios** - Gestión de juicios
- 📊 **Reportes** - Generar reportes (solo admin)
- ⚙️ **Admin** - Administración (solo super_admin)

---

## 💼 CREAR NUEVO CASO

### Paso 1: Ir a Casos

1. Menú lateral > Click "Casos"
2. Click botón "+ Nuevo Caso" (azul, arriba a la derecha)

### Paso 2: Llenar Formulario

Campos requeridos (marcados con *):

| Campo | Ejemplo | Descripción |
|-------|---------|------------|
| **No. Caso*** | CASO-2024-001 | Código único del caso |
| **Demandado*** | Juan García López | Nombre del deudor principal |
| **Sucursal** | Sucursal 1 | Oficina responsable |
| **Giro** | Comercial | Tipo de negocio del deudor |
| **Asistente** | Lic. Millán | Abogado responsable |
| **Grupo Cliente** | Grupo A | Clasificación interna |
| **Área** | Cobranza | Departamento |
| **Tipo Crédito** | P.Q. MN | Modalidad del crédito |
| **No. Crédito** | CRED-12345 | Referencia de crédito |
| **Capital MN** | 500,000 | Cantidad en pesos mexicanos |
| **Capital ME** | 10,000 | Cantidad en moneda extranjera |
| **Moneda ME** | DLLS | USD, EUR, etc. |

### Paso 3: Guardar

1. Revisar que todos los campos obligatorios estén llenos
2. Click "Guardar"
3. Si hay error, revisar mensajes rojos
4. Si es exitoso, ir a detalle del caso

### Estado del Caso

Al crear, el estado es automáticamente "Activo". Puede cambiar a:
- **Activo** - En seguimiento
- **En Juicio** - Litigio en juzgado
- **Terminado** - Caso cerrado
- **Archivado** - Sin movimiento

---

## ⚖️ CREAR JUICIO (EXPEDIENTE)

### Requisitos Previos

- Debe existir un caso activo
- El caso debe estar "En Juicio"

### Paso 1: Ir a Detalle del Caso

1. Menú lateral > "Casos"
2. Buscar caso
3. Click en la fila del caso

### Paso 2: Agregar Juicio

En la sección "Juicios":
1. Click "+ Nuevo Juicio" (botón azul)

### Paso 3: Llenar Datos del Juicio

| Campo | Ejemplo |
|-------|---------|
| **No. Expediente*** | EXP-2024-001 |
| **Juzgado** | Juzgado 1° Mercantil |
| **Tipo de Juicio** | Ejecutivo Mercantil |
| **Fecha Presentación** | 01/01/2024 |
| **Etapa Actual** | Presentación Demanda |
| **Garantías Muebles** | Auto Ford 2020 |
| **Garantías Inmuebles** | Casa en Polanco |
| **Lugar Gravamen** | CDMX |

### Paso 4: Guardar

1. Click "Guardar Juicio"
2. El sistema automáticamente crea el timeline de etapas

---

## 📊 REGISTRAR AVANCE

### Qué es un Avance

Un avance es cualquier movimiento en el juicio:
- Sentencia dictada
- Demanda admitida
- Apelación presentada
- Radicación completada
- Etc.

### Pasos para Registrar

1. Ir a detalle del **Juicio**
2. Sección "Historial de Avances"
3. Click "+ Nuevo Avance"
4. Llenar:
   - **Fecha:** Fecha del evento
   - **Etapa:** Seleccionar etapa (6 opciones)
   - **Descripción:** Detalles del avance
5. Click "Guardar Avance"

### Etapas Disponibles

1. 📝 **Presentación Demanda** - Inicio
2. 📋 **Radicación** - Admisión del juzgado
3. ✓ **Demanda Admitida** - Aceptada
4. ⚖️ **Sentencia** - Fallo del juez
5. 📤 **Apelación** - Recurso de apelación
6. 🔨 **Adjudicación** - Remate de bienes

---

## 🔍 BUSCAR Y FILTRAR

### Filtro Rápido

En cualquier listado (Casos, Juicios):
1. Campo de búsqueda en la parte superior
2. Ingresar: número caso, expediente, nombre, etc.
3. Presionar Enter o esperar 1 segundo
4. Resultados se filtran automáticamente

### Filtros Avanzados

Click en "Filtros" para acceder a:
- **Estado:** Activo / En Juicio / Terminado / Archivado
- **Sucursal:** Seleccionar oficina
- **Asistente:** Seleccionar abogado
- **Etapa:** Para juicios

Seleccionar criterios y click "Aplicar"

### Paginación

- Tabla muestra 10 registros por página
- Botones "Anterior" y "Siguiente" en la parte inferior
- Indicador: "Página 1 de 5"

---

## 📊 GENERAR REPORTES

### Tipos de Reportes Disponibles

1. **Casos por Sucursal**
   - Agrupa por oficina
   - Muestra cantidad y capital por sucursal
   - Descarga: PDF

2. **Juicios por Estado**
   - Tabla de expedientes
   - Filtrado por estado y etapa
   - Descarga: PDF

3. **Recuperación Mensual**
   - Análisis de ingresos por mes
   - Porcentaje de recuperación
   - Descarga: PDF

4. **Actividad de Asistentes**
   - Casos asignados por persona
   - Totales de capital y recuperación
   - Descarga: PDF

5. **Vencimientos Próximos**
   - Casos próximos a vencer (30 días)
   - Indicador de urgencia
   - Descarga: PDF

### Pasos para Generar

1. Menú lateral > "Reportes" (solo si eres admin)
2. Seleccionar fecha inicio y fin
3. (Opcional) Filtrar por sucursal/asistente
4. Click en el reporte que quieres
5. Esperar a que se genere (1-3 segundos)
6. **Automáticamente descarga PDF**
7. También puedes "Exportar a Excel"

### Filtros de Reporte

- **Fecha Inicio:** Desde cuándo (default: 30 días atrás)
- **Fecha Fin:** Hasta cuándo (default: hoy)
- **Sucursal:** Opcional, una sucursal específica
- **Asistente:** Opcional, un abogado específico

---

## 📄 GESTIÓN DE DOCUMENTOS

### Agregar Documento

1. En detalle de Caso o Juicio
2. Sección "Documentos"
3. Click "+ Agregar Documento"
4. Subir archivo (PDF, Word, Excel)
5. Descripción (opcional)
6. Click "Guardar"

### Descargar Documento

1. En la tabla de documentos
2. Click en la fila del documento
3. Click "Descargar"

### Buscar Documentos

En la sección de documentos:
1. Campo de búsqueda
2. Ingresar nombre, tipo, etc.
3. Filtrar resultados

---

## 👥 ROLES Y PERMISOS

### ¿Qué puedo hacer según mi rol?

#### 👑 SUPER_ADMIN
- ✅ Crear, editar, eliminar casos
- ✅ Crear, editar, eliminar juicios
- ✅ Ver todos los reportes
- ✅ Acceso a Administración
  - Crear usuarios
  - Editar catálogos
  - Cambiar roles

#### 📊 COORDINADOR
- ✅ Crear, editar casos de su zona
- ✅ Crear, editar juicios de su zona
- ✅ Ver reportes de su zona
- ❌ Acceso a Administración

#### ⚖️ ASISTENTE
- ✅ Editar casos asignados
- ✅ Crear avances en juicios asignados
- ✅ Ver reportes de sus casos
- ❌ Eliminar casos
- ❌ Crear nuevos casos (debe coordinador)

#### 🔍 AUDITOR
- ✅ Ver casos (solo lectura)
- ✅ Ver juicios (solo lectura)
- ✅ Descargar reportes
- ❌ Editar nada
- ❌ Crear nada

---

## ❓ PREGUNTAS FRECUENTES

### P: ¿Puedo deshacer un cambio?
**R:** No hay "deshacer", pero todos los cambios quedan en el historial (auditoría). Contactar admin si necesitas revertir.

### P: ¿Cuál es la diferencia entre Caso y Juicio?
**R:** Un **Caso** = cobanza (cliente + deuda). Un **Juicio** = litigio en juzgado (expediente). Un caso puede tener múltiples juicios.

### P: ¿Qué es un Avance?
**R:** Registro de cualquier evento en el juicio (sentencia, radicación, apelación, etc.)

### P: ¿Cómo agrego un demandado?
**R:** En detalle del caso, sección "Demandados", click "+ Agregar Demandado"

### P: ¿Puedo cambiar el estado de un caso?
**R:** Sí, en edición del caso, cambiar "Estado" a: Activo / En Juicio / Terminado / Archivado

### P: ¿Dónde veo mis notificaciones?
**R:** Ícono de campana en la parte superior derecha (si hay nuevas, muestra número rojo)

### P: ¿Cómo exporto datos?
**R:** En reportes, click "Exportar Excel". Los PDFs se descargan automáticamente.

### P: ¿Cuáles son los mejores horarios de acceso?
**R:** El sistema está disponible 24/7, pero reportes grandes se procesan mejor entre 2 AM - 6 AM (mantenimiento).

### P: ¿Qué pasa si pierdo mi contraseña?
**R:** Click "¿Olvidaste tu contraseña?" en login. Se envía email en 1 minuto.

### P: ¿Cómo cambio mi información de perfil?
**R:** Click en tu nombre (arriba a la derecha) > "Mi Perfil" (próxima versión)

### P: ¿Por qué no puedo editar este caso?
**R:** Probablemente:
- No es de tu zona (coordinador)
- No está asignado a ti (asistente)
- Tu rol no tiene permisos (auditor)

---

## 📞 CONTACTO SOPORTE

¿Problemas o preguntas?

| Canal | Contacto |
|-------|----------|
| 📧 Email | soporte@juriscontrol.com |
| 💬 Chat | En app (próximo) |
| 📞 Teléfono | +52 55 1234 5678 |
| 🐛 Reportar Bug | issues@juriscontrol.com |
| 📚 Documentación | /docs/ en la app |

**Horario de soporte:** Lunes-Viernes 9 AM - 6 PM (CDMX)

---

**Última actualización:** Junio 2026
**Versión:** 1.0.0
