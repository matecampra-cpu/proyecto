@echo off
title TallerPro Web - Despliegue en Firebase Hosting
echo =======================================================
echo    TallerPro Web - Compilacion y Despliegue en Firebase
echo =======================================================
echo.
cd /d "%~dp0"

set NODE_TLS_REJECT_UNAUTHORIZED=0

echo 1. Compilando aplicacion optimizada para produccion...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERROR] La compilacion fallo. Corrige los errores antes de desplegar.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Subiendo archivos a Firebase Hosting...
call npx.cmd -y firebase-tools@latest deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Si ves un error de autenticacion, ejecuta primero en tu terminal:
    echo        npx firebase-tools login
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo [EXITO] Despliegue completado satisfactoriamente en Firebase!
echo.
pause
