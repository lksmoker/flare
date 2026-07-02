Set-Location "C:\dev\Flare"

$envFile = "C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env"

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
Write-Host ""

$env:EXPO_NO_TELEMETRY = "1"

npm run dev -- --clear

Write-Host ""
Read-Host "Press Enter to close"
