@echo off
TITLE GDK Gym Management Platform
echo ──────────────────────────────────────────────────────────
echo           GDK GYM MANAGEMENT SYSTEM
echo ──────────────────────────────────────────────────────────
echo.
echo [1/3] Checking environment...
IF NOT EXIST ".env" (
    echo [INFO] .env file missing. Creating from example...
    copy .env.example .env
)
IF NOT EXIST "node_modules" (
    echo [ERROR] Dependencies not found. Running npm install...
    call npm install
)

echo [2/3] Starting Database and Services...
echo.

:: Start the application in dev mode (API + Web + Desktop)
echo [3/3] Launching Desktop Dashboard...
echo.
echo Close this window to stop the gym system.
echo.
call npm run dev:desktop

pause
