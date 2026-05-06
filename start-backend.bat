@echo off
echo ==========================================
echo   Mae Grazi - Backend de Pagamentos
echo ==========================================
echo.

:: Verificar se node esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    echo Baixe em: https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias
        pause
        exit /b 1
    )
)

echo [OK] Dependencias instaladas
echo.
echo ==========================================
echo   Iniciando servidor...
echo   URL: http://localhost:3001
echo ==========================================
echo.

npm start

pause
