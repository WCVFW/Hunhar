@echo off
title Stop hunhar.in Backend
echo Stopping all hunhar.in backend microservices (ports 8080-8084)...

powershell -NoProfile -Command "8080,8081,8082,8083,8084 | ForEach-Object { (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue).OwningProcess } | Where-Object { $_ } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host ('Stopped PID {0}' -f $_) -ForegroundColor Green }"

echo.
echo All backend services stopped.
pause
