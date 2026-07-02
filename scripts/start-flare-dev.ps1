$childScript = "C:\dev\Flare\scripts\start-flare-dev-child.ps1"

Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-File",
  $childScript
)
