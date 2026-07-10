@echo off
setlocal

start "Flare Backend :9001" cmd /k ^
  "cd /d C:\dev\flare && call scripts\start-flare-support-backend.ps1"

start "Flare Frontend :8081" cmd /k ^
  "cd /d C:\dev\flare && call scripts\start-flare-dev-child.ps1"

endlocal