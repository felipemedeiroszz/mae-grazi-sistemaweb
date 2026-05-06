@echo off
echo Iniciando servidor local para Mae Grazi...
echo.
echo URL: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

cd /d "%~dp0"

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js nao encontrado. Por favor, instale Node.js primeiro.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se live-server está instalado
npx live-server --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando live-server...
    npm install -g live-server
)

echo Iniciando live-server na porta 3000...
npx live-server --port=3000 --open=/index.html
