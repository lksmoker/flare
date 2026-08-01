@echo off
setlocal EnableExtensions

if /i "%~1"=="control-restart" goto :control_restart

if not defined OPS_DIR set "OPS_DIR=C:\dev\ops"
if not defined OPS_PYTHON_EXE set "OPS_PYTHON_EXE=%OPS_DIR%\venv\Scripts\python.exe"
if not defined OPS_NOTIFIER_SCRIPT set "OPS_NOTIFIER_SCRIPT=%OPS_DIR%\telegram_notify.py"
if not defined OPS_LAUNCHER_LIFECYCLE set "OPS_LAUNCHER_LIFECYCLE=%OPS_DIR%\launcher_lifecycle.py"
if not defined FLARE_BACKEND_SCRIPT set "FLARE_BACKEND_SCRIPT=C:\dev\Flare\scripts\start-flare-support-backend.ps1"
if not defined FLARE_FRONTEND_SCRIPT set "FLARE_FRONTEND_SCRIPT=C:\dev\Flare\scripts\start-flare-dev-child.ps1"
if not defined FLARE_READY_TIMEOUT_SECONDS set "FLARE_READY_TIMEOUT_SECONDS=180"
if not defined FLARE_READY_POLL_SECONDS set "FLARE_READY_POLL_SECONDS=3"

set "RUN_ID=%COMPUTERNAME%_%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "RUN_ID=%RUN_ID: =0%"

if not exist "%OPS_PYTHON_EXE%" (
    echo [ERROR] Ops Python was not found at "%OPS_PYTHON_EXE%"
    endlocal & exit /b 10
)
if not exist "%OPS_NOTIFIER_SCRIPT%" (
    echo [ERROR] Ops notifier was not found at "%OPS_NOTIFIER_SCRIPT%"
    endlocal & exit /b 11
)
if not exist "%OPS_LAUNCHER_LIFECYCLE%" (
    echo [ERROR] Launcher lifecycle helper was not found at "%OPS_LAUNCHER_LIFECYCLE%"
    endlocal & exit /b 12
)
if not exist "%FLARE_BACKEND_SCRIPT%" (
    echo [ERROR] Flare backend launcher was not found at "%FLARE_BACKEND_SCRIPT%"
    endlocal & exit /b 13
)
if not exist "%FLARE_FRONTEND_SCRIPT%" (
    echo [ERROR] Flare frontend launcher was not found at "%FLARE_FRONTEND_SCRIPT%"
    endlocal & exit /b 14
)

call :notify_event flare_startup_started

start "Flare Backend :9001" /B powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%FLARE_BACKEND_SCRIPT%"
set "BACKEND_START_EXIT=%ERRORLEVEL%"
if not "%BACKEND_START_EXIT%"=="0" (
    call :notify_event flare_startup_failed --message "Flare backend launcher start returned %BACKEND_START_EXIT%."
    echo [Flare launcher exited with code %BACKEND_START_EXIT%]
    endlocal & exit /b %BACKEND_START_EXIT%
)

start "Flare Frontend :8081" /B powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%FLARE_FRONTEND_SCRIPT%"
set "FRONTEND_START_EXIT=%ERRORLEVEL%"
if not "%FRONTEND_START_EXIT%"=="0" (
    call :notify_event flare_startup_failed --message "Flare frontend launcher start returned %FRONTEND_START_EXIT%."
    echo [Flare launcher exited with code %FRONTEND_START_EXIT%]
    endlocal & exit /b %FRONTEND_START_EXIT%
)

"%OPS_PYTHON_EXE%" "%OPS_LAUNCHER_LIFECYCLE%" wait-flare-ready --run-id "%RUN_ID%" --hostname "%COMPUTERNAME%" --timeout-seconds %FLARE_READY_TIMEOUT_SECONDS% --poll-interval-seconds %FLARE_READY_POLL_SECONDS%
set "FLARE_EXIT_CODE=%ERRORLEVEL%"

if "%FLARE_EXIT_CODE%"=="0" (
    call :notify_event flare_ready --message "Flare frontend and backend passed readiness checks."
) else (
    call :notify_event flare_startup_failed --message "Flare frontend and backend did not both pass readiness checks before the deadline."
)

echo [Flare launcher exited with code %FLARE_EXIT_CODE%]
endlocal & exit /b %FLARE_EXIT_CODE%

:control_restart
set "CONTROL_PYTHON_EXE=C:\Users\lukes\AppData\Local\Programs\Python\Python312\python.exe"
set "CONTROL_SCRIPT=C:\dev\Flare\scripts\control_restart_flare_stack.py"
if not exist "%CONTROL_PYTHON_EXE%" (
    echo [ERROR] Control Python was not found at "%CONTROL_PYTHON_EXE%"
    endlocal & exit /b 20
)
if not exist "%CONTROL_SCRIPT%" (
    echo [ERROR] Control restart helper was not found at "%CONTROL_SCRIPT%"
    endlocal & exit /b 21
)
"%CONTROL_PYTHON_EXE%" "%CONTROL_SCRIPT%"
endlocal & exit /b %ERRORLEVEL%

:notify_event
"%OPS_PYTHON_EXE%" "%OPS_NOTIFIER_SCRIPT%" --event "%~1" --run-id "%RUN_ID%" --hostname "%COMPUTERNAME%" --dedupe-key "%~1:%COMPUTERNAME%:%RUN_ID%" %~2 %~3 %~4 %~5 %~6 %~7 %~8 %~9 >NUL 2>&1
exit /b 0
