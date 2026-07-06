param(
  [string]$RepoRoot = "C:\dev\Flare",
  [string]$EnvFile = "C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env",
  [string]$FrontendOrigin = "http://100.118.27.101:8081",
  [string]$BackendBaseUrl = "http://100.118.27.101:9001",
  [string]$HostName = "0.0.0.0",
  [int]$Port = 9001
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $RepoRoot)) {
  throw "Repo root not found: $RepoRoot"
}

if (-not (Test-Path $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

function Import-DotEnvFile {
  param([string]$Path)

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $parts = $line -split "=", 2
    if ($parts.Count -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")

    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

Set-Location $RepoRoot

Import-DotEnvFile -Path $EnvFile

# Runtime values for Tailscale validation.
$env:FLARE_ALLOWED_FRONTEND_ORIGINS = $FrontendOrigin.TrimEnd("/")
$env:FLARE_PUBLIC_BACKEND_BASE_URL = $BackendBaseUrl.TrimEnd("/")

# Compatibility aliases in case the shared env file uses older names.
if (-not $env:GROUPME_OAUTH_CLIENT_ID -and $env:GROUPME_CLIENT_ID) {
  $env:GROUPME_OAUTH_CLIENT_ID = $env:GROUPME_CLIENT_ID
}

Write-Host ""
Write-Host "Starting Flare support-channel backend..." -ForegroundColor Cyan
Write-Host "Repo:      $RepoRoot"
Write-Host "Env file:  $EnvFile"
Write-Host "Frontend:  $env:FLARE_ALLOWED_FRONTEND_ORIGINS"
Write-Host "Backend:   $env:FLARE_PUBLIC_BACKEND_BASE_URL"
Write-Host "Listen:    http://${HostName}:$Port"
Write-Host ""
Write-Host "Health check from another window:" -ForegroundColor Yellow
Write-Host "Invoke-WebRequest $env:FLARE_PUBLIC_BACKEND_BASE_URL/health"
Write-Host ""

python -m backend.app.http.server --host $HostName --port $Port
