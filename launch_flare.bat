@echo off
setlocal

set "OPS_DIR=C:\dev\ops"
set "OPS_PYTHON_EXE=%OPS_DIR%\venv\Scripts\python.exe"
set "OPS_NOTIFIER_SCRIPT=%OPS_DIR%\telegram_notify.py"
set "OPS_LAUNCHER_LIFECYCLE=%OPS_DIR%\launcher_lifecycle.py"
set "RUN_ID=%COMPUTERNAME%_%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "RUN_ID=%RUN_ID: =0%"

call :notify_event flare_startup_started

start "Flare Backend :9001" powershell.exe -NoExit -ExecutionPolicy Bypass -File "C:\dev\Flare\scripts\start-flare-support-backend.ps1"

start "Flare Frontend :8081" powershell.exe -NoExit -ExecutionPolicy Bypass -File "C:\dev\Flare\scripts\start-flare-dev-child.ps1"

if exist "%OPS_PYTHON_EXE%" (
    "%OPS_PYTHON_EXE%" "%OPS_LAUNCHER_LIFECYCLE%" flare-post-launch --run-id "%RUN_ID%" --hostname "%COMPUTERNAME%"
)

endlocal
exit /b %ERRORLEVEL%

:notify_event
if not exist "%OPS_PYTHON_EXE%" exit /b 0
if not exist "%OPS_NOTIFIER_SCRIPT%" exit /b 0
"%OPS_PYTHON_EXE%" "%OPS_NOTIFIER_SCRIPT%" --event "%~1" --run-id "%RUN_ID%" --hostname "%COMPUTERNAME%" --dedupe-key "%~1:%COMPUTERNAME%:%RUN_ID%"
exit /b 0
