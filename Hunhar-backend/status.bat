@echo off
title hunhar.in Backend Status
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" -Action status
echo.
pause
