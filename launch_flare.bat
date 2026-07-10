@echo off
setlocal

start "Flare Backend :9001" powershell.exe -NoExit -ExecutionPolicy Bypass -File "C:\dev\Flare\scripts\start-flare-support-backend.ps1"

start "Flare Frontend :8081" powershell.exe -NoExit -ExecutionPolicy Bypass -File "C:\dev\Flare\scripts\start-flare-dev-child.ps1"

endlocal