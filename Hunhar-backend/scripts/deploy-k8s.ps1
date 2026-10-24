<#
.SYNOPSIS
  Build and deploy THEUNOiA to Kubernetes (Docker Desktop Kubernetes, minikube, EKS/GKE/AKS).

.EXAMPLE
  # local cluster (Docker Desktop -> Settings -> Kubernetes -> Enable). Images stay local, no registry needed.
  .\scripts\deploy-k8s.ps1 -Overlay staging

  # real cluster: push to your own registry
  .\scripts\deploy-k8s.ps1 -Overlay production -Registry <your-registry>/theunoia -Tag 1.0.0

  .\scripts\deploy-k8s.ps1 -Overlay staging -SkipBuild -Tag 202610201200   # redeploy existing images
  .\scripts\deploy-k8s.ps1 -Delete                                         # remove the staging deployment
#>
param(
    [ValidateSet('staging', 'production')][string]$Overlay = 'staging',
    [string]$Registry = '',
    [string]$Tag = (Get-Date -Format 'yyyyMMddHHmm'),
    [string]$SecretsFile = '',
    [switch]$SkipBuild,
    [switch]$Delete
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Namespace = if ($Overlay -eq 'production') { 'theunoia' } else { 'theunoia-staging' }
$Services = @('api-gateway', 'auth-service', 'user-service', 'project-service', 'credit-service', 'payment-service',
    'messaging-service', 'notification-service', 'community-service', 'content-service', 'analytics-service', 'file-service')

function Step([string]$m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Repo([string]$svc) { if ($Registry) { "$Registry/$svc" } else { "theunoia/$svc" } }

foreach ($tool in @('kubectl', 'docker')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "$tool is not installed. Run scripts\install-prerequisites.ps1 as Administrator (see DEPLOYMENT.md)."
    }
}
kubectl cluster-info *> $null
if ($LASTEXITCODE -ne 0) { throw 'No Kubernetes cluster reachable. Enable Kubernetes in Docker Desktop (Settings -> Kubernetes).' }
Step "Target cluster: $(kubectl config current-context)   namespace: $Namespace   tag: $Tag"

if ($Delete) {
    kubectl delete namespace $Namespace --ignore-not-found
    Write-Host "Deleted namespace $Namespace" -ForegroundColor Green
    return
}

# ---------------------------------------------------------------- 1. images
if (-not $SkipBuild) {
    Step "Building 12 images (tag $Tag)"
    foreach ($svc in $Services) {
        Write-Host "    building $svc"
        docker build -q --build-arg SERVICE=$svc -t "$(Repo $svc):$Tag" .
        if ($LASTEXITCODE -ne 0) { throw "build of $svc failed" }
        if ($Registry) {
            docker push "$(Repo $svc):$Tag"
            if ($LASTEXITCODE -ne 0) { throw "push of $svc failed (run: docker login $($Registry.Split('/')[0]))" }
        }
    }
}

# ---------------------------------------------------------------- 2. secrets
if (-not $SecretsFile) { $SecretsFile = & (Join-Path $PSScriptRoot 'new-secrets.ps1') -Overlay $Overlay }
Step 'Namespace and application secret'
kubectl get namespace $Namespace *> $null
if ($LASTEXITCODE -ne 0) { kubectl create namespace $Namespace | Out-Null }
kubectl -n $Namespace create secret generic theunoia-secrets --from-env-file=$SecretsFile --dry-run=client -o yaml | kubectl apply -f -

# ---------------------------------------------------------------- 3. render overlay with image tags and apply
$deployDir = Join-Path $Root ".deploy\$Overlay"
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null
$images = ($Services | ForEach-Object { "  - name: theunoia/$_`n    newName: $(Repo $_)`n    newTag: `"$Tag`"" }) -join "`n"
$kustomization = "apiVersion: kustomize.config.k8s.io/v1beta1`nkind: Kustomization`nresources:`n  - ../../k8s/overlays/$Overlay`nimages:`n$images`n"
[IO.File]::WriteAllText((Join-Path $deployDir 'kustomization.yaml'), $kustomization, (New-Object Text.UTF8Encoding($false)))

Step "Applying k8s/overlays/$Overlay"
kubectl -n $Namespace delete job db-provisioner --ignore-not-found | Out-Null
kubectl apply -k $deployDir
if ($LASTEXITCODE -ne 0) { throw 'kubectl apply failed' }

Step 'Provisioning databases (db-provisioner Job)'
kubectl -n $Namespace wait --for=condition=complete job/db-provisioner --timeout=900s
if ($LASTEXITCODE -ne 0) { kubectl -n $Namespace logs job/db-provisioner; throw 'database provisioning failed' }

# ---------------------------------------------------------------- 4. rollouts
Step 'Waiting for rollouts (first start runs Flyway migrations)'
foreach ($svc in $Services) {
    kubectl -n $Namespace rollout status deployment/$svc --timeout=900s
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    rollout of $svc failed - rolling back" -ForegroundColor Red
        kubectl -n $Namespace rollout undo deployment/$svc
        throw "deployment of $svc failed (kubectl -n $Namespace logs deploy/$svc)"
    }
}

kubectl -n $Namespace get pods
Write-Host "`nDeployed THEUNOiA ($Tag) to $Namespace." -ForegroundColor Green
Write-Host 'Open the API gateway (keep this window open):'
Write-Host "    kubectl -n $Namespace port-forward svc/api-gateway 8080:8080" -ForegroundColor Yellow
Write-Host 'Admin login: admin@theunoia.com / password in k8s\secrets.<overlay>.env (admin-password)'
