@echo off
title Nidus - Dev UI
echo Starting Nidus...
echo.
cd /d "%~dp0"
set "NIDUS_PLUGIN_DIR=%~dp0plugins"
npm run tauri dev
pause
