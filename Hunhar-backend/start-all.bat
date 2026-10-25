@echo off
title hunhar.in Backend Auto-Runner
cd /d "%~dp0"

echo ==========================================================
echo  hunhar.in Backend Engine - Auto Start (No Docker)
echo ==========================================================
echo Checking MySQL Database connection on port 3306...
echo.

powershell -NoProfile -Command "if (-not (Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded) { Write-Host 'ERROR: MySQL is not running on port 3306. Please start MySQL first!' -ForegroundColor Red; exit 1 } else { Write-Host 'MySQL is ONLINE on port 3306. Auto-connecting services...' -ForegroundColor Green }"
if %errorlevel% neq 0 (
    echo.
    echo Please make sure your MySQL service is started before launching the backend.
    pause
    exit /b 1
)

echo.
echo Stopping any existing instances on ports 8080-8084...
powershell -NoProfile -Command "8080,8081,8082,8083,8084 | ForEach-Object { (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue).OwningProcess } | Where-Object { $_ } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo.
echo Launching 5 microservices in background...
start "hunhar-identity-service" /min java -Dserver.port=8081 -DDB_USER=root -DDB_PASSWORD=root -DSPRING_DATASOURCE_USERNAME=root -DSPRING_DATASOURCE_PASSWORD=root -Xms128m -Xmx256m -jar identity-service\target\identity-service-1.0.0.jar
timeout /t 3 /nobreak >nul

start "hunhar-project-service" /min java -Dserver.port=8082 -DDB_USER=root -DDB_PASSWORD=root -DSPRING_DATASOURCE_USERNAME=root -DSPRING_DATASOURCE_PASSWORD=root -Xms128m -Xmx256m -jar project-service\target\project-service-1.0.0.jar
timeout /t 3 /nobreak >nul

start "hunhar-billing-service" /min java -Dserver.port=8083 -DDB_USER=root -DDB_PASSWORD=root -DSPRING_DATASOURCE_USERNAME=root -DSPRING_DATASOURCE_PASSWORD=root -Xms128m -Xmx256m -jar billing-service\target\billing-service-1.0.0.jar
timeout /t 3 /nobreak >nul

start "hunhar-engagement-service" /min java -Dserver.port=8084 -DDB_USER=root -DDB_PASSWORD=root -DSPRING_DATASOURCE_USERNAME=root -DSPRING_DATASOURCE_PASSWORD=root -Xms128m -Xmx256m -jar engagement-service\target\engagement-service-1.0.0.jar
timeout /t 3 /nobreak >nul

start "hunhar-api-gateway" /min java -Dserver.port=8080 -Xms128m -Xmx256m -jar api-gateway\target\api-gateway-1.0.0.jar

echo.
echo ==========================================================
echo  All 5 backend services launched successfully!
echo ==========================================================
echo  * API Gateway:        http://localhost:8080
echo  * Identity Service:   http://localhost:8081 [MySQL Auto-Connected]
echo  * Project Service:    http://localhost:8082 [MySQL Auto-Connected]
echo  * Billing Service:    http://localhost:8083 [MySQL Auto-Connected]
echo  * Engagement Service: http://localhost:8084 [MySQL Auto-Connected]
echo.
echo Frontend URL:          http://localhost:5173
echo To check status:       run status.bat or powershell .\run.ps1 status
echo To stop all services:  run stop-all.bat
echo ==========================================================
echo.
pause
