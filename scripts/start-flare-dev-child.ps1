Set-Location "C:\dev\Flare"

$envFile = "C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env"
$port = 8081

Write-Host "Checking port $port..." -ForegroundColor Cyan

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

$allowed = @(
  "EXPO_PUBLIC_FLARE_SUPABASE_URL",
  "EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL"
)

if (-not (Test-Path $envFile)) {
  Write-Host "Missing env file: $envFile" -ForegroundColor Red
  Read-Host "Press Enter to close"
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
Write-Host "Repo: C:\dev\Flare"
Write-Host "Port: $port"
Write-Host ""

$env:EXPO_NO_TELEMETRY = "1"

npm run dev -- --clear

Write-Host ""
Read-Host "Press Enter to close"
