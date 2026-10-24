<#
.SYNOPSIS
  Run the complete THEUNOiA platform on Windows WITHOUT Docker (Java 17 + Maven only).
  Infrastructure runs in one JVM (tools/local-runner): embedded PostgreSQL :5433, AMQP broker :5672,
  Redis-protocol server :6379, SMTP catcher :1025 with inbox http://localhost:8025.
  The 12 microservices run as plain JARs with small heaps.

.EXAMPLE
  .\run-local.ps1 start     # build (if needed) + start infra + 12 services, wait until all healthy
  .\run-local.ps1 status    # health of every service
  .\run-local.ps1 demo      # end-to-end business flow through the gateway
  .\run-local.ps1 logs payment-service
  .\run-local.ps1 stop      # stop everything (database data kept in .local-data)
  .\run-local.ps1 clean     # stop + delete local data
#>
param(
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs', 'demo', 'clean', 'build', 'test')]
    [string]$Action = 'start',
    [string]$Service = ''
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot
$Data = Join-Path $PSScriptRoot '.local-data'
$Logs = Join-Path $Data 'logs'
$PidFile = Join-Path $Data 'pids.txt'

$Services = [ordered]@{
    'auth-service' = 8081; 'user-service' = 8082; 'project-service' = 8083; 'credit-service' = 8084
    'payment-service' = 8085; 'messaging-service' = 8086; 'notification-service' = 8087; 'community-service' = 8088
    'content-service' = 8089; 'analytics-service' = 8090; 'file-service' = 8091; 'api-gateway' = 8080
}
$JvmOpts = @('-Xms64m', '-Xmx200m', '-Xss512k', '-XX:MaxMetaspaceSize=192m', '-XX:ReservedCodeCacheSize=48m',
    '-XX:+UseSerialGC', '-XX:TieredStopAtLevel=1', '-Dspring.jmx.enabled=false')

function Step([string]$m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok([string]$m) { Write-Host "    [OK] $m" -ForegroundColor Green }

function Test-Port([int]$port) {
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

function Get-Health([int]$port) {
    try { return (Invoke-RestMethod "http://localhost:$port/actuator/health" -TimeoutSec 3).status } catch { return 'DOWN' }
}

function Build-All {
    Step 'Building service JARs (mvn package -DskipTests)'
    mvn -q -B package -DskipTests
    if ($LASTEXITCODE -ne 0) { throw 'Maven build failed' }
    Push-Location tools\local-runner
    mvn -q -B package -DskipTests
    mvn -q -B dependency:build-classpath "-Dmdep.outputFile=target/classpath.txt"
    Pop-Location
    Ok 'Build complete'
}

# Rebuild when a JAR is missing or any source / config file is newer than the oldest JAR.
function Test-NeedsBuild {
    if (-not (Test-Path 'tools\local-runner\target\classpath.txt')) { return $true }
    $jars = foreach ($name in $Services.Keys) {
        $j = Get-ChildItem "$name\target\$name-*.jar" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '*original*' } | Select-Object -First 1
        if (-not $j) { return $true }
        $j
    }
    $oldestJar = ($jars | Measure-Object -Property LastWriteTime -Minimum).Minimum
    $paths = @('common-lib\src') + @($Services.Keys | ForEach-Object { "$_\src\main" }) + @('pom.xml')
    $newestSource = Get-ChildItem -Path $paths -Recurse -File -ErrorAction SilentlyContinue |
        Measure-Object -Property LastWriteTime -Maximum
    return $newestSource.Maximum -gt $oldestJar
}

function Start-Infra {
    if (Test-Port 5672) { Ok 'Local infrastructure already running'; return }
    Step 'Starting local infrastructure (PostgreSQL :5433, AMQP :5672, Redis :6379, SMTP :1025 / inbox :8025)'
    $cp = 'tools\local-runner\target\classes;' + (Get-Content 'tools\local-runner\target\classpath.txt' -Raw).Trim()
    $p = Start-Process java -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $Logs 'infra.log') -RedirectStandardError (Join-Path $Logs 'infra.err.log') `
        -ArgumentList @('-Xmx256m', '-XX:+UseSerialGC', '-Djava.protocol.handler.pkgs=org.apache.qpid.server.util.urlstreamhandler',
            "-Ddata.dir=$Data", '-cp', "`"$cp`"", 'com.theunoia.tools.LocalInfrastructure')
    Add-Content $PidFile "infra=$($p.Id)"
    $deadline = (Get-Date).AddMinutes(3)
    while (-not (Select-String -Path (Join-Path $Logs 'infra.log') -Pattern 'READY' -Quiet -ErrorAction SilentlyContinue)) {
        if ((Get-Date) -gt $deadline -or $p.HasExited) { throw 'Infrastructure failed to start - see .local-data\logs\infra.log' }
        Start-Sleep -Seconds 2
    }
    Ok 'Infrastructure ready'
}

function Start-Services {
    Step 'Starting 12 microservices'
    $env:DB_PORT = '5433'
    $env:S3_CREATE_BUCKET = 'false'
    # the embedded AMQP broker (Qpid) has no RabbitMQ dead-letter-exchange extension
    $env:THEUNOIA_EVENTS_DEADLETTERENABLED = 'false'
    foreach ($name in $Services.Keys) {
        $port = $Services[$name]
        if (Test-Port $port) { Ok "$name already running on :$port"; continue }
        $jar = Get-ChildItem "$name\target\$name-*.jar" | Where-Object { $_.Name -notlike '*original*' } | Select-Object -First 1
        if (-not $jar) { throw "JAR for $name not found - run .\run-local.ps1 build" }
        $p = Start-Process java -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $Logs "$name.log") -RedirectStandardError (Join-Path $Logs "$name.err.log") `
            -ArgumentList ($JvmOpts + @('-jar', "`"$($jar.FullName)`""))
        Add-Content $PidFile "$name=$($p.Id)"
        Write-Host "    started $name (pid $($p.Id), port $port)"
        Start-Sleep -Seconds 4   # stagger JVM start-up on small machines
    }
}

function Wait-Healthy([int]$minutes = 15) {
    Step 'Waiting until every service reports UP (first start runs all database migrations)'
    $deadline = (Get-Date).AddMinutes($minutes)
    while ((Get-Date) -lt $deadline) {
        $down = @($Services.Keys | Where-Object { (Get-Health $Services[$_]) -ne 'UP' })
        if ($down.Count -eq 0) { Ok 'All 12 microservices are UP'; return }
        Write-Host ("    starting: " + ($down -join ', '))
        Start-Sleep -Seconds 10
    }
    throw 'Timed out - check .local-data\logs\<service>.log'
}

function Stop-All {
    if (Test-Path $PidFile) {
        foreach ($line in Get-Content $PidFile) {
            $id = [int]($line.Split('=')[1])
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
        }
        Remove-Item $PidFile -Force
    }
    # also stop anything still bound to our ports (e.g. started from another shell)
    $ports = @($Services.Values) + @(5433, 5672, 6379, 1025, 8025)
    Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Get-Process postgres -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*embedded-pg*' } |
        Stop-Process -Force -ErrorAction SilentlyContinue
    Ok 'Stopped'
}

New-Item -ItemType Directory -Force -Path $Logs | Out-Null

switch ($Action) {
    'build' { Build-All }
    'start' {
        if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java 17 is required' }
        if (@($Services.Keys | Where-Object { Test-Port $Services[$_] }).Count -gt 0) {
            Write-Host '    Some services are already running - stopping them first so the JARs can be rebuilt' -ForegroundColor Yellow
            Stop-All
            Start-Sleep -Seconds 3
        }
        if (Test-NeedsBuild) { Build-All } else { Ok 'JARs are up to date' }
        Start-Infra
        Start-Services
        Wait-Healthy
        Write-Host ''
        Write-Host '  THEUNOiA is running (no Docker)' -ForegroundColor Green
        Write-Host '  ------------------------------------------------------------'
        Write-Host '  API Gateway        http://localhost:8080'
        Write-Host '  Email inbox        http://localhost:8025'
        Write-Host '  Swagger UI         http://localhost:8081/swagger-ui.html ... :8091'
        Write-Host '  PostgreSQL         localhost:5433  (postgres / postgres)'
        Write-Host '  Admin login        admin@theunoia.com / Admin@12345'
        Write-Host '  Logs               .local-data\logs\'
        Write-Host '  Demo               .\run-local.ps1 demo'
        Write-Host '  Stop               .\run-local.ps1 stop'
    }
    'status' {
        foreach ($name in $Services.Keys) {
            $h = Get-Health $Services[$name]
            $color = if ($h -eq 'UP') { 'Green' } else { 'Red' }
            Write-Host ("  {0,-22} :{1}  {2}" -f $name, $Services[$name], $h) -ForegroundColor $color
        }
        foreach ($p in @(@('PostgreSQL', 5433), @('AMQP broker', 5672), @('Redis', 6379), @('SMTP', 1025))) {
            $state = if (Test-Port $p[1]) { 'UP' } else { 'DOWN' }
            Write-Host ("  {0,-22} :{1}  {2}" -f $p[0], $p[1], $state)
        }
    }
    'logs' {
        $file = if ($Service) { Join-Path $Logs "$Service.log" } else { Join-Path $Logs 'infra.log' }
        Get-Content $file -Tail 100 -Wait
    }
    'demo' { & (Join-Path $PSScriptRoot 'scripts\demo-flow.ps1') -Gateway 'http://localhost:8080' -MailHog 'http://localhost:8025' }
    'stop' { Stop-All }
    'clean' { Stop-All; Start-Sleep -Seconds 2; Remove-Item $Data -Recurse -Force -ErrorAction SilentlyContinue; Ok 'Local data deleted' }
}
