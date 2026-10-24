#Requires -RunAsAdministrator
<#
.SYNOPSIS
  One-time installation of everything THEUNOiA needs on Windows 10/11.
  Run in an ADMINISTRATOR PowerShell:
      Set-ExecutionPolicy -Scope Process Bypass -Force
      E:\Hunhar\theunoia-backend\scripts\install-prerequisites.ps1

  Installs (via winget, official packages):
    - WSL 2 (required by Docker Desktop)
    - Docker Desktop   (Docker engine + Docker Compose + single-node Kubernetes)
    - kubectl          (Kubernetes CLI)
    - Git
    - Eclipse Temurin JDK 17 and Apache Maven (only if missing)
  Jenkins is NOT installed on Windows - it runs as a pre-configured container (scripts\setup-jenkins.ps1).
#>
$ErrorActionPreference = 'Stop'

function Step([string]$m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Has([string]$cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function WingetInstall([string]$id, [string]$name) {
    Step "Installing $name ($id)"
    winget install --id $id --exact --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1978335189) {   # -1978335189 = already installed
        Write-Host "    winget returned $LASTEXITCODE for $name - check the output above" -ForegroundColor Yellow
    }
}

if (-not (Has 'winget')) {
    throw 'winget is missing. Install "App Installer" from the Microsoft Store, then re-run this script.'
}

$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
if ($ram -lt 15) {
    Write-Host "`n[!] This PC has $ram GB RAM. THEUNOiA (12 services) + Docker + Kubernetes + Jenkins needs 16 GB to run" -ForegroundColor Yellow
    Write-Host "    comfortably. With 8 GB, run ONE of: Docker Compose  OR  Kubernetes  OR  Jenkins at a time." -ForegroundColor Yellow
}

Step 'Enabling WSL 2 (Windows Subsystem for Linux)'
wsl --install --no-distribution
wsl --set-default-version 2 2>$null

WingetInstall 'Docker.DockerDesktop' 'Docker Desktop'
WingetInstall 'Kubernetes.kubectl' 'kubectl'
if (-not (Has 'git')) { WingetInstall 'Git.Git' 'Git' }
if (-not (Has 'java')) { WingetInstall 'EclipseAdoptium.Temurin.17.JDK' 'JDK 17' }
if (-not (Has 'mvn')) { WingetInstall 'Apache.Maven' 'Apache Maven' }

# Allow the project scripts to run for this user
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force

Write-Host @'

====================================================================================
 Installation finished. Remaining MANUAL steps (Docker Desktop cannot be scripted):

  1. RESTART Windows (required by WSL 2 / Docker Desktop).
  2. Start "Docker Desktop", accept the terms, wait for "Engine running".
  3. Docker Desktop -> Settings -> Resources -> Memory: as high as possible (>= 6 GB).
  4. Docker Desktop -> Settings -> Kubernetes -> tick "Enable Kubernetes" -> Apply & restart.
     Wait until the bottom-left shows "Kubernetes running".
  5. Open a NEW PowerShell (not admin) and verify:
        docker version
        kubectl get nodes
  6. Then continue with DEPLOYMENT.md, section "Full setup from zero":
        cd E:\Hunhar\theunoia-backend
        .\run.ps1 start                          # Docker Compose
        .\scripts\deploy-k8s.ps1 -Overlay staging # Kubernetes
        .\scripts\setup-jenkins.ps1              # Jenkins CI/CD
====================================================================================
'@ -ForegroundColor Green
