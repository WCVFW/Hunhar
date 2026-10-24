<#
.SYNOPSIS
  THEUNOiA backend - Lightweight Local Runner (No Docker required).
  Runs infrastructure (Postgres :5433, AMQP :5672, Redis :6379, Mail :8025) and
  all microservices directly via Java 17.

.EXAMPLE
  .\run.ps1 start            # start local infrastructure + services
  .\run.ps1 status           # check status of all services
  .\run.ps1 demo             # run end-to-end demo flow
  .\run.ps1 logs [service]   # tail logs for a service
  .\run.ps1 restart          # restart all services
  .\run.ps1 stop             # stop all running processes
  .\run.ps1 clean            # stop and delete local data
  .\run.ps1 test             # run tests
#>
param(
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs', 'demo', 'clean', 'build', 'test')]
    [string]$Action = 'start',
    [string]$Service = ''
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

& (Join-Path $PSScriptRoot 'run-local.ps1') -Action $Action -Service $Service
