param(
  [string]$RepoRoot = "C:\dev\Flare",
  [string]$EnvFile = "C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env",
  [int]$Port = 8081,
  [string]$NpmCmd = "C:\Program Files\nodejs\npm.cmd",
  [string]$NodeExe = "C:\Program Files\nodejs\node.exe",
  [switch]$NonInteractive,
  [switch]$SkipPortCleanup
)

Set-Location $RepoRoot

$envFile = $EnvFile
$port = $Port

Write-Host "Checking port $port..." -ForegroundColor Cyan

if (-not $SkipPortCleanup) {
  $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

  if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $processIds) {
      $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
      if ($proc) {
        Write-Host "Killing PID $processId on port $port ($($proc.ProcessName))" -ForegroundColor Yellow
        Stop-Process -Id $processId -Force
      }
    }

    Start-Sleep -Seconds 1
  } else {
    Write-Host "No process found on port $port"
  }
}

$allowed = @(
  "EXPO_PUBLIC_FLARE_SUPABASE_URL",
  "EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL",
  "EXPO_PUBLIC_FLARE_API_BASE_URL"
)

if (-not (Test-Path $envFile)) {
  Write-Host "Missing env file: $envFile" -ForegroundColor Red
  if (-not $NonInteractive) {
    Read-Host "Press Enter to close"
  }
  exit 1
}

if (-not (Test-Path $NpmCmd)) {
  Write-Host "Missing npm.cmd: $NpmCmd" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $NodeExe)) {
  Write-Host "Missing node.exe: $NodeExe" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Loading Flare public Expo env vars..." -ForegroundColor Cyan

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
    return
  }

  $parts = $_ -split '=', 2
  if ($parts.Count -ne 2) {
    return
  }

  $name = $parts[0].Trim()
  $value = $parts[1].Trim().Trim('"').Trim("'")

  if ($allowed -contains $name) {
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
    Write-Host "Loaded $name"
  }
}

Write-Host ""
Write-Host "Starting Flare dev server..." -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot"
Write-Host "Port: $port"
Write-Host ""

$env:EXPO_NO_TELEMETRY = "1"

& $NpmCmd run dev -- --clear

Write-Host ""
if (-not $NonInteractive) {
  Read-Host "Press Enter to close"
}
