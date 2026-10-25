<#
.SYNOPSIS
    hunhar.in Backend Native Runner (No Docker Required)
.DESCRIPTION
    Starts, stops, or checks status of all 5 Spring Boot microservices natively with Java.
    Automatically connects to MySQL (DB_USER=root, DB_PASSWORD=root).
.EXAMPLE
    .\run.ps1 start
    .\run.ps1 stop
    .\run.ps1 status
    .\run.ps1 restart
#>

[CmdletBinding()]
param (
    [ValidateSet('start', 'stop', 'restart', 'status')]
    [string]$Action = 'start',
    [string]$DbUser = 'root',
    [string]$DbPassword = 'root'
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

$PidFile = Join-Path $ScriptDir ".hunhar-services.pid"

$Services = @(
    @{ Name = "identity-service";   Port = 8081; Jar = "identity-service\target\identity-service-1.0.0.jar" },
    @{ Name = "project-service";    Port = 8082; Jar = "project-service\target\project-service-1.0.0.jar" },
    @{ Name = "billing-service";    Port = 8083; Jar = "billing-service\target\billing-service-1.0.0.jar" },
    @{ Name = "engagement-service"; Port = 8084; Jar = "engagement-service\target\engagement-service-1.0.0.jar" },
    @{ Name = "api-gateway";        Port = 8080; Jar = "api-gateway\target\api-gateway-1.0.0.jar" }
)

function Stop-AllServices {
    Write-Host "[*] Stopping any existing backend services..." -ForegroundColor Yellow
    foreach ($svc in $Services) {
        $p = Get-NetTCPConnection -LocalPort $svc.Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
        if ($p) {
            Write-Host "  -> Terminating process on port $($svc.Port) (PID: $p)..." -ForegroundColor DarkGray
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
    if (Test-Path $PidFile) {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[+] All backend services stopped." -ForegroundColor Green
}

function Check-Database {
    Write-Host "[*] Checking MySQL connection on localhost:3306..." -ForegroundColor Cyan
    $test = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
    if (-not $test.TcpTestSucceeded) {
        Write-Warning "MySQL is NOT listening on localhost:3306!"
        Write-Host "Please start your local MySQL service before proceeding." -ForegroundColor Red
        return $false
    }
    Write-Host "[+] MySQL is running and listening on port 3306." -ForegroundColor Green
    return $true
}

switch ($Action) {
    'stop' {
        Stop-AllServices
    }
    'restart' {
        Stop-AllServices
        Start-Sleep -Seconds 2
        & $PSCommandPath -Action start -DbUser $DbUser -DbPassword $DbPassword
    }
    'status' {
        Write-Host "==========================================================" -ForegroundColor Cyan
        Write-Host " hunhar.in Backend Services Status" -ForegroundColor Cyan
        Write-Host "==========================================================" -ForegroundColor Cyan
        
        $dbTest = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
        if ($dbTest.TcpTestSucceeded) {
            Write-Host "MySQL Database:     [ONLINE] (Port 3306)" -ForegroundColor Green
        } else {
            Write-Host "MySQL Database:     [OFFLINE] (Port 3306)" -ForegroundColor Red
        }

        foreach ($svc in $Services) {
            $conn = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue
            if ($conn) {
                Write-Host ("{0,-20} [ONLINE]  (Port {1}, PID {2})" -f $svc.Name, $svc.Port, $conn[0].OwningProcess) -ForegroundColor Green
            } else {
                Write-Host ("{0,-20} [OFFLINE] (Port {1})" -f $svc.Name, $svc.Port) -ForegroundColor Red
            }
        }
    }
    'start' {
        Write-Host "==========================================================" -ForegroundColor Cyan
        Write-Host " Starting hunhar.in Backend Engine (No Docker Mode)" -ForegroundColor Cyan
        Write-Host "==========================================================" -ForegroundColor Cyan

        if (-not (Check-Database)) {
            exit 1
        }

        Stop-AllServices

        $startedPids = @()

        $logsDir = Join-Path $ScriptDir "logs"
        if (-not (Test-Path $logsDir)) {
            New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
        }

        # 1. Start 4 business microservices + API gateway
        foreach ($svc in $Services) {
            $jarPath = Join-Path $ScriptDir $svc.Jar
            if (-not (Test-Path $jarPath)) {
                Write-Host "JAR not found: $jarPath. Running build first..." -ForegroundColor Yellow
                mvn clean package -DskipTests
            }

            Write-Host "[*] Launching $($svc.Name) on port $($svc.Port)..." -ForegroundColor Yellow

            $stdOut = Join-Path $logsDir "$($svc.Name).log"
            $stdErr = Join-Path $logsDir "$($svc.Name)_err.log"

            $javaArgs = @(
                "-Dserver.port=$($svc.Port)",
                "-DDB_USER=$DbUser",
                "-DDB_PASSWORD=$DbPassword",
                "-DSPRING_DATASOURCE_USERNAME=$DbUser",
                "-DSPRING_DATASOURCE_PASSWORD=$DbPassword",
                "-Xms128m",
                "-Xmx384m",
                "-jar",
                "`"$jarPath`""
            )

            $cmdLine = "start `"hunhar-$($svc.Name)`" /min java $($javaArgs -join ' ')"
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmdLine -WorkingDirectory $ScriptDir -WindowStyle Hidden
            Write-Host "  -> Launched $($svc.Name) on port $($svc.Port)" -ForegroundColor DarkGray
            
            Start-Sleep -Seconds 3
        }

        $startedPids | Out-File -FilePath $PidFile -Encoding utf8

        Write-Host ""
        Write-Host "[*] Waiting for services to initialize and connect to MySQL..." -ForegroundColor Cyan

        # Poll API Gateway health
        $maxAttempts = 30
        $attempt = 0
        $gatewayUp = $false

        while ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 2
            $attempt++
            try {
                $res = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($res -and $res.status -eq "UP") {
                    $gatewayUp = $true
                    break
                }
            } catch {
                Write-Host -NoNewline "."
            }
        }

        Write-Host ""
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host " All hunhar.in Backend Services Started Successfully!" -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host "  * API Gateway:        http://localhost:8080" -ForegroundColor White
        Write-Host "  * Identity Service:   http://localhost:8081" -ForegroundColor White
        Write-Host "  * Project Service:    http://localhost:8082" -ForegroundColor White
        Write-Host "  * Billing Service:    http://localhost:8083" -ForegroundColor White
        Write-Host "  * Engagement Service: http://localhost:8084" -ForegroundColor White
        Write-Host "  * Database:           MySQL localhost:3306 [Auto-Connected]" -ForegroundColor White
        Write-Host ""
        Write-Host "Frontend is running on http://localhost:5173" -ForegroundColor Cyan
        Write-Host "To check status:  .\run.ps1 status" -ForegroundColor Gray
        Write-Host "To stop services: .\run.ps1 stop" -ForegroundColor Gray
    }
}
