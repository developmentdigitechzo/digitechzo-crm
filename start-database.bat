@echo off
echo ===================================================
echo   DigiTechzo CRM - PostgreSQL 18 Service Launcher
echo ===================================================

set PGDATA=C:\Program Files\PostgreSQL\18\data
set PGBIN=C:\Program Files\PostgreSQL\18\bin

echo Checking status...
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" >nul 2>&1
if %errorlevel% EQU 0 (
    echo PostgreSQL is ALREADY RUNNING!
    goto end
)

if exist "%PGDATA%\postmaster.pid" (
    echo Cleaning up stale lock file...
    del /f /q "%PGDATA%\postmaster.pid"
)

echo Starting PostgreSQL Server...
"%PGBIN%\pg_ctl.exe" start -D "%PGDATA%"
if %errorlevel% EQU 0 (
    echo [OK] PostgreSQL started successfully!
) else (
    echo [ERROR] Failed to start PostgreSQL. Please check error logs in:
    echo "%PGDATA%\log"
)

:end
echo ===================================================
pause
