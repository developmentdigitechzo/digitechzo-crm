@echo off
set "PGDATA=C:\Program Files\PostgreSQL\18\data"
set "PGBIN=C:\Program Files\PostgreSQL\18\bin"

if exist "%PGDATA%\postmaster.pid" (
    "%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" >nul 2>&1
    if errorlevel 1 del /f /q "%PGDATA%\postmaster.pid"
)

"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" >nul 2>&1
if errorlevel 1 (
    "%PGBIN%\pg_ctl.exe" start -D "%PGDATA%" -l "%PGDATA%\server.log"
)
