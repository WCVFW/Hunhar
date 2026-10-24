<#
.SYNOPSIS
  Creates k8s/secrets.<overlay>.env with strong random values (used by deploy-k8s.ps1 and setup-jenkins.ps1).
  Existing files are never overwritten. Third-party keys are left empty - fill them in for real integrations.
#>
param(
    [ValidateSet('staging', 'production')][string]$Overlay = 'staging',
    [string]$Path = ''
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
if (-not $Path) { $Path = Join-Path $Root "k8s\secrets.$Overlay.env" }
if (Test-Path $Path) { Write-Host "    secrets file exists: $Path"; return $Path }

$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
function Rand([int]$n) { $b = New-Object byte[] $n; $rng.GetBytes($b); [Convert]::ToBase64String($b) }
function Hex([int]$n) { $b = New-Object byte[] $n; $rng.GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join '' }

$adminPassword = "Adm1n-$(Hex 6)"
$lines = @(
    "jwt-secret=$(Rand 48)", "internal-service-token=$(Hex 32)",
    "payment-encryption-key=$(Rand 32)", "notification-encryption-key=$(Rand 32)",
    'admin-email=admin@theunoia.com', "admin-password=$adminPassword",
    "postgres-password=$(Hex 16)", "rabbitmq-password=$(Hex 16)", "redis-password=$(Hex 16)",
    "s3-access-key=theunoia$(Hex 4)", "s3-secret-key=$(Hex 20)")
foreach ($db in @('auth', 'user', 'project', 'credit', 'payment', 'messaging', 'notification', 'community', 'content', 'analytics', 'file')) {
    $lines += "$db-db-password=$(Hex 16)"
}
foreach ($k in @('razorpay-key-id', 'razorpay-key-secret', 'razorpay-webhook-secret', 'razorpayx-account-number',
        'cashfree-client-id', 'cashfree-client-secret', 'whatsapp-phone-number-id', 'whatsapp-access-token',
        'google-client-id', 'google-client-secret', 'smtp-username', 'smtp-password')) { $lines += "$k=" }
# LF line endings + no BOM so kubectl --from-env-file reads it cleanly
[IO.File]::WriteAllText($Path, ($lines -join "`n") + "`n", (New-Object Text.UTF8Encoding($false)))
Write-Host "    created $Path" -ForegroundColor Green
Write-Host "    platform admin: admin@theunoia.com / $adminPassword" -ForegroundColor Yellow
return $Path
