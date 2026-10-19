@echo off
chcp 65001 > nul
title TallerPro Web - Sistema de Gestion
echo ========================================================
echo       INICIANDO TALLERPRO WEB (http://127.0.0.1:5173)
echo ========================================================
echo.
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo Abriendo navegador en http://127.0.0.1:5173 ...
start http://127.0.0.1:5173

call npm.cmd run dev

if errorlevel 1 (
    echo.
    echo Ocurrio un error al ejecutar Vite.
    pause
)
