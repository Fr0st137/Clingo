@echo off
setlocal

cd /d "%~dp0"
start "Clingo localhost" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/"
