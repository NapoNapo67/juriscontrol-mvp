@echo off
REM Script para empacar JurisControl MVP - Mes 1 (Windows)
REM Uso: build-package.bat

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo  JurisControl MVP - Package Builder
echo ==========================================
echo.

REM Check PowerShell available
powershell -command "exit 0" >nul 2>&1
if errorlevel 1 (
    echo Error: PowerShell no disponible
    pause
    exit /b 1
)

REM Generate timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set TIMESTAMP=%mydate%-%mytime%

set PACKAGE_NAME=juriscontrol-mes1-mvp
set PACKAGE_PATH=%TEMP%\%PACKAGE_NAME%-%TIMESTAMP%.zip

echo [*] Preparando archivos...

REM Create temp directory
set TEMP_DIR=%TEMP%\juriscontrol-build-%TIMESTAMP%
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%\juriscontrol-web-COMPLETO"

echo [*] Copiando archivos principales...

REM Copy source files
xcopy src "%TEMP_DIR%\juriscontrol-web-COMPLETO\src" /e /i /q
xcopy public "%TEMP_DIR%\juriscontrol-web-COMPLETO\public" /e /i /q 2>nul

REM Copy config files
copy package.json "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1
copy package-lock.json "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1
copy tsconfig.json "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1
copy vite.config.ts "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1
copy index.html "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1

REM Copy documentation
copy ..\TESTING_INVITACIONES.md "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1
copy ..\IMPLEMENTACION_INVITACIONES.md "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1
copy ..\MES1_CASOS_REFACTORING.md "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1
copy ..\MES1_PROGRESS.md "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1
copy ..\NEXT_STEPS.md "%TEMP_DIR%\juriscontrol-web-COMPLETO\" >nul 2>&1

REM Create .env.local.example
(
echo # Supabase Configuration
echo VITE_SUPABASE_URL=https://your-project.supabase.co
echo VITE_SUPABASE_ANON_KEY=your-anon-key-here
) > "%TEMP_DIR%\juriscontrol-web-COMPLETO\.env.local.example"

REM Create QUICKSTART.md
(
echo # JurisControl MVP - Quick Start Guide
echo.
echo ## Instalacion Rapida ^(5 minutos^)
echo.
echo ### 1. Requisitos
echo - Node.js 16+
echo - npm o yarn
echo.
echo ### 2. Setup
echo ```bash
echo npm install
echo ```
echo.
echo ### 3. Configurar variables
echo ```bash
echo copy .env.local.example .env.local
echo REM Edita .env.local con tus credenciales Supabase
echo ```
echo.
echo ### 4. Obtener credenciales en Supabase
echo 1. https://app.supabase.com
echo 2. Settings ^> API
echo 3. Copiar URL y anon key a .env.local
echo.
echo ### 5. Correr servidor
echo ```bash
echo npm run dev
echo ```
echo.
echo Luego abre: http://localhost:5173
echo.
echo Ver: NEXT_STEPS.md para mas detalles
) > "%TEMP_DIR%\juriscontrol-web-COMPLETO\QUICKSTART.md"

REM Create setup.bat
(
echo @echo off
echo setlocal enabledelayedexpansion
echo.
echo echo ==========================================
echo echo  JurisControl MVP - Auto Setup
echo echo ==========================================
echo.
echo echo Checking Node.js...
echo node --version >nul 2>&1
echo if errorlevel 1 (
echo     echo Error: Node.js no instalado
echo     echo Descargalo en: https://nodejs.org/
echo     pause
echo     exit /b 1
echo )
echo.
echo echo Installing dependencies...
echo call npm install
echo if errorlevel 1 (
echo     echo Error: No se pudieron instalar dependencias
echo     pause
echo     exit /b 1
echo )
echo.
echo echo Creating .env.local...
echo if not exist .env.local (
echo     copy .env.local.example .env.local
echo     echo IMPORTANTE: Edita .env.local con tus credenciales Supabase
echo )
echo.
echo echo Building project...
echo call npm run build
echo if errorlevel 1 (
echo     echo Error: Compilacion fallida
echo     pause
echo     exit /b 1
echo )
echo.
echo echo.
echo echo ==========================================
echo echo  SETUP COMPLETADO!
echo echo ==========================================
echo echo.
echo echo Proximos pasos:
echo echo 1. Edita .env.local con credenciales Supabase
echo echo 2. Corre: npm run dev
echo echo 3. Abre: http://localhost:5173
echo echo.
echo echo Documentacion:
echo echo  - QUICKSTART.md
echo echo  - TESTING_INVITACIONES.md
echo echo  - NEXT_STEPS.md
echo echo.
echo pause
) > "%TEMP_DIR%\juriscontrol-web-COMPLETO\setup.bat"

echo [*] Creando ZIP...

REM Use PowerShell to create ZIP
powershell -nologo -noprofile -command ^
  "Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::CreateFromDirectory('%TEMP_DIR%', '%PACKAGE_PATH%')" >nul 2>&1

if exist "%PACKAGE_PATH%" (
    echo [OK] ZIP creado exitosamente
    echo.
    echo Ubicacion: %PACKAGE_PATH%
    echo.
    echo ==========================================
    echo  PACKAGE LISTO PARA DISTRIBUIR!
    echo ==========================================
    echo.
    echo Para usar:
    echo 1. Descarga el ZIP
    echo 2. Extrae la carpeta
    echo 3. cd juriscontrol-web-COMPLETO
    echo 4. bash setup.bat
    echo 5. Edita .env.local
    echo 6. npm run dev
    echo.
) else (
    echo [ERROR] No se pudo crear ZIP
    pause
    exit /b 1
)

REM Cleanup
echo [*] Limpiando...
rmdir /s /q "%TEMP_DIR%"

echo.
echo Que lo disfrutes! 🚀
echo.
pause
