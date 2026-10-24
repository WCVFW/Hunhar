<#
.SYNOPSIS
  Starts a fully pre-configured Jenkins (http://localhost:8180) that builds, tests and deploys THEUNOiA
  to the Docker Desktop Kubernetes cluster. No manual Jenkins configuration needed:
    - plugins, admin user, credentials (kubeconfig + app secrets) and the pipeline job are created by
      Configuration-as-Code (jenkins/casc.yaml)
    - the job polls this folder's Git repository every 2 minutes and runs the Jenkinsfile

.EXAMPLE
  .\scripts\setup-jenkins.ps1            # set up + start + trigger the first build
  .\scripts\setup-jenkins.ps1 -Stop      # stop Jenkins
  .\scripts\setup-jenkins.ps1 -NoBuild   # start without triggering a build
#>
param([switch]$Stop, [switch]$NoBuild)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$Runtime = Join-Path $Root 'jenkins\.runtime'
$Url = 'http://localhost:8180'

function Step([string]$m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok([string]$m) { Write-Host "    [OK] $m" -ForegroundColor Green }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker is not installed - run scripts\install-prerequisites.ps1 as Administrator first.' }
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop is not running.' }

if ($Stop) { docker compose -f jenkins\docker-compose.yml down; Ok 'Jenkins stopped (jobs and history kept)'; return }

# ------------------------------------------------------------ 1. Git repository (Jenkins builds committed code)
Step 'Preparing the Git repository Jenkins builds from'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is not installed - run scripts\install-prerequisites.ps1' }
if (-not (Test-Path (Join-Path $Root '.git'))) {
    git init -b main | Out-Null
    if (-not (git config user.email)) { git config user.email 'dev@theunoia.local'; git config user.name 'THEUNOiA Developer' }
    git add -A
    git commit -q -m 'THEUNOiA backend: initial import'
    Ok 'Initialised repository on branch main'
} else {
    $dirty = git status --porcelain
    if ($dirty) { Write-Host '    [!] You have uncommitted changes - Jenkins only builds what is committed (git add -A; git commit)' -ForegroundColor Yellow }
    Ok "Repository: branch $(git rev-parse --abbrev-ref HEAD), commit $(git rev-parse --short HEAD)"
}

# ------------------------------------------------------------ 2. credentials material for Jenkins
Step 'Preparing credentials (kubeconfig + application secrets)'
New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
$secrets = & (Join-Path $PSScriptRoot 'new-secrets.ps1') -Overlay staging
Copy-Item $secrets (Join-Path $Runtime 'secrets.staging.env') -Force

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) { throw 'kubectl is not installed - run scripts\install-prerequisites.ps1' }
$ctx = kubectl config get-contexts -o name | Where-Object { $_ -eq 'docker-desktop' }
if (-not $ctx) { throw 'Kubernetes context "docker-desktop" not found - enable Kubernetes in Docker Desktop settings.' }
$kubeconfig = kubectl config view --minify --flatten --context docker-desktop
$kubeconfig = $kubeconfig -replace 'https://(127\.0\.0\.1|localhost):', 'https://kubernetes.docker.internal:'
[IO.File]::WriteAllText((Join-Path $Runtime 'kubeconfig'), ($kubeconfig -join "`n"), (New-Object Text.UTF8Encoding($false)))
Ok 'kubeconfig for docker-desktop exported'

$pwFile = Join-Path $Runtime 'admin-password.txt'
if (-not (Test-Path $pwFile)) {
    $b = New-Object byte[] 9; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    Set-Content $pwFile ([Convert]::ToBase64String($b).Replace('/', 'x').Replace('+', 'y')) -NoNewline
}
$env:JENKINS_ADMIN_PASSWORD = (Get-Content $pwFile -Raw).Trim()

# ------------------------------------------------------------ 3. start Jenkins
Step 'Building and starting Jenkins (first run downloads plugins - a few minutes)'
docker compose -f jenkins\docker-compose.yml up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Jenkins failed to start' }

$deadline = (Get-Date).AddMinutes(10)
$cred = New-Object PSCredential('admin', (ConvertTo-SecureString $env:JENKINS_ADMIN_PASSWORD -AsPlainText -Force))
while ($true) {
    try { Invoke-WebRequest "$Url/job/theunoia-backend/api/json" -Credential $cred -UseBasicParsing -TimeoutSec 5 | Out-Null; break }
    catch { if ((Get-Date) -gt $deadline) { throw 'Jenkins did not come up - docker compose -f jenkins\docker-compose.yml logs' }; Start-Sleep 5 }
}
Ok 'Jenkins is up and the theunoia-backend pipeline job exists'

# ------------------------------------------------------------ 4. trigger the first build
if (-not $NoBuild) {
    Step 'Triggering the first pipeline run'
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:$($env:JENKINS_ADMIN_PASSWORD)"))
    $headers = @{ Authorization = "Basic $basic" }
    $crumb = Invoke-RestMethod "$Url/crumbIssuer/api/json" -Headers $headers -WebSession $session
    $headers[$crumb.crumbRequestField] = $crumb.crumb
    Invoke-WebRequest "$Url/job/theunoia-backend/build" -Method Post -Headers $headers -WebSession $session -UseBasicParsing | Out-Null
    Ok 'Build #1 queued: tests (~15 min) -> 12 images -> deploy to theunoia-staging -> smoke test'
}

Write-Host ''
Write-Host '  Jenkins is ready' -ForegroundColor Green
Write-Host '  ------------------------------------------------------------'
Write-Host "  URL        $Url/job/theunoia-backend/"
Write-Host "  Login      admin / $($env:JENKINS_ADMIN_PASSWORD)   (saved in jenkins\.runtime\admin-password.txt)"
Write-Host '  Pipeline   every commit on main is built automatically (polls every 2 minutes)'
Write-Host '  After a green build:  kubectl -n theunoia-staging port-forward svc/api-gateway 8080:8080'
