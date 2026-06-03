#!/bin/bash

# Script para empacar JurisControl MVP - Mes 1
# Uso: bash build-package.sh

set -e

echo "🔧 Preparando JurisControl MVP Package..."

# Variables
PACKAGE_NAME="juriscontrol-mes1-mvp"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="/tmp"
PACKAGE_PATH="${OUTPUT_DIR}/${PACKAGE_NAME}-${TIMESTAMP}.zip"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Files to include:${NC}"
echo "  ✓ src/ (componentes, hooks, contextos)"
echo "  ✓ package.json"
echo "  ✓ vite.config.ts"
echo "  ✓ tsconfig.json"
echo "  ✓ .env.local.example"
echo "  ✓ Documentation (*.md)"
echo "  ✓ Setup scripts"

# Crear estructura temporal
TEMP_DIR="/tmp/juriscontrol-build-${TIMESTAMP}"
mkdir -p "${TEMP_DIR}/juriscontrol-web-COMPLETO"

cd "$(dirname "${BASH_SOURCE[0]}")"
PROJECT_ROOT=$(pwd)

echo -e "${BLUE}📂 Copiando archivos...${NC}"

# Copiar estructura principal
cp -r src "${TEMP_DIR}/juriscontrol-web-COMPLETO/"
cp -r public "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true
cp -r .github "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true

# Copiar archivos de configuración
cp package.json "${TEMP_DIR}/juriscontrol-web-COMPLETO/"
cp package-lock.json "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true
cp tsconfig.json "${TEMP_DIR}/juriscontrol-web-COMPLETO/"
cp vite.config.ts "${TEMP_DIR}/juriscontrol-web-COMPLETO/"
cp index.html "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true

# Crear .env.local.example
cat > "${TEMP_DIR}/juriscontrol-web-COMPLETO/.env.local.example" << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration (future)
# VITE_API_URL=http://localhost:3000
EOF

# Copiar documentación
cp ../TESTING_INVITACIONES.md "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true
cp ../IMPLEMENTACION_INVITACIONES.md "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true
cp ../MES1_CASOS_REFACTORING.md "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true
cp ../MES1_PROGRESS.md "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true
cp ../NEXT_STEPS.md "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true
cp ../MODELO_DATOS.md "${TEMP_DIR}/juriscontrol-web-COMPLETO/" 2>/dev/null || true

# Crear archivo README.md para guía rápida
cat > "${TEMP_DIR}/juriscontrol-web-COMPLETO/QUICKSTART.md" << 'EOF'
# JurisControl MVP - Quick Start Guide

## 🚀 Instalación Rápida (5 minutos)

### 1. Requisitos
- Node.js 16+ (`node --version`)
- npm o yarn

### 2. Setup
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local

# IMPORTANTE: Editar .env.local con tus credenciales Supabase
nano .env.local  # or vi, code, etc.
```

### 3. Obtener credenciales Supabase
1. Ir a https://app.supabase.com
2. Selecciona tu proyecto
3. Settings → API → copiar:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Pegar en .env.local

### 4. Correr el servidor
```bash
npm run dev

# Output:
# VITE v4.x.x ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

### 5. Abrir en navegador
```
http://localhost:5173
```

---

## 📝 Primera Prueba

### Admin Setup
1. Click "Registrarse"
2. Email: `admin@example.com`
3. Password: `TestPass123!`
4. Create account

### Crear Invitación
1. Go to `/admin`
2. Click "📧 Invitaciones"
3. Click "+ Nueva Invitación"
4. Fill form:
   - Email: `newuser@example.com`
   - Org: `Despacho Test`
   - Type: `Despacho`
   - Plan: `Despacho Pequeño`
5. Click "Crear Invitación"
6. Copy link, send to new user

### Aceptar Invitación
1. Open link in new browser/incognito
2. Fill form with name + password
3. Submit → creates org + account
4. Auto redirects to dashboard

### Test Casos
1. Sidebar → "Casos"
2. "+ Nuevo Caso"
3. Fill: numero_caso, cliente, demandado, cuantia
4. Save → see in list

---

## 🧪 Troubleshooting

### "VITE_SUPABASE_URL is not defined"
→ Check .env.local exists and has correct values

### "Cannot find module"
→ Run: `npm install`

### Port 5173 in use
→ Run: `npm run dev -- --port 3000`

### TypeScript errors
→ Check src/ doesn't have v1 fields (asistente_id, sucursal_id)

---

## 📚 Documentation

- **TESTING_INVITACIONES.md** - Complete testing guide
- **IMPLEMENTACION_INVITACIONES.md** - Technical architecture
- **MES1_CASOS_REFACTORING.md** - Schema migration details
- **MES1_PROGRESS.md** - Full roadmap
- **NEXT_STEPS.md** - Action items

---

## 🎯 What's Included

✅ Multi-tenancy foundation
✅ Invitations system
✅ Casos CRUD
✅ Admin panel (Invitaciones tab)
✅ TypeScript + Vite setup
✅ RLS policies (schema-side)

⏳ Juicios (TODO)
⏳ Agenda (TODO)
⏳ Dashboard (TODO)

---

## 💬 Support

Check NEXT_STEPS.md for detailed guides on:
- Architecture overview
- Testing multi-org isolation
- Common patterns
- Performance tips

Happy building! 🚀
EOF

# Crear setup script
cat > "${TEMP_DIR}/juriscontrol-web-COMPLETO/setup.sh" << 'EOF'
#!/bin/bash

# JurisControl Auto-Setup Script

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  JurisControl MVP - Auto Setup${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Check Node.js
echo -e "\n${BLUE}🔍 Verificando requisitos...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Descárgalo en: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Install dependencies
echo -e "\n${BLUE}📦 Instalando dependencias...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${RED}❌ Error instalando dependencias${NC}"
    exit 1
fi

# Create .env.local
echo -e "\n${BLUE}⚙️  Configurando variables de entorno...${NC}"
if [ -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local ya existe${NC}"
else
    cp .env.local.example .env.local
    echo -e "${GREEN}✓ .env.local creado${NC}"
    echo -e "${YELLOW}IMPORTANTE: Edita .env.local con tus credenciales Supabase${NC}"
fi

# Check if can build
echo -e "\n${BLUE}🔨 Compilando proyecto...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Compilación exitosa${NC}"
else
    echo -e "${RED}❌ Error en compilación${NC}"
    exit 1
fi

# Summary
echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Setup Completado!${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Próximos pasos:${NC}"
echo "1. Edita .env.local con tus credenciales Supabase"
echo "2. Corre: ${YELLOW}npm run dev${NC}"
echo "3. Abre: ${YELLOW}http://localhost:5173${NC}"

echo -e "\n${BLUE}Documentación:${NC}"
echo "  - QUICKSTART.md (guía rápida)"
echo "  - TESTING_INVITACIONES.md (testing)"
echo "  - NEXT_STEPS.md (pasos siguientes)"

echo ""
EOF

chmod +x "${TEMP_DIR}/juriscontrol-web-COMPLETO/setup.sh"

# Crear ZIP
echo -e "${BLUE}📦 Creando ZIP...${NC}"
cd "${TEMP_DIR}"
zip -r -q "${PACKAGE_PATH}" juriscontrol-web-COMPLETO/

if [ -f "${PACKAGE_PATH}" ]; then
    SIZE=$(du -h "${PACKAGE_PATH}" | cut -f1)
    echo -e "${GREEN}✓ ZIP creado exitosamente${NC}"
    echo -e "${GREEN}  Ubicación: ${PACKAGE_PATH}${NC}"
    echo -e "${GREEN}  Tamaño: ${SIZE}${NC}"
else
    echo -e "${RED}❌ Error creando ZIP${NC}"
    exit 1
fi

# Cleanup temp
echo -e "\n${BLUE}🧹 Limpiando archivos temporales...${NC}"
rm -rf "${TEMP_DIR}"

# Final message
echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Package Listo Para Distribuir!${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Para usar:${NC}"
echo "1. Descarga: ${YELLOW}${PACKAGE_PATH}${NC}"
echo "2. Extrae el ZIP"
echo "3. cd juriscontrol-web-COMPLETO"
echo "4. bash setup.sh"
echo "5. Edita .env.local"
echo "6. npm run dev"

echo -e "\n${BLUE}Que lo disfrutes! 🚀${NC}\n"
