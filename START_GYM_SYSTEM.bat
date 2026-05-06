@echo off
SETLOCAL EnableDelayedExpansion
TITLE GDK Gym - Master Launcher
echo ──────────────────────────────────────────────────────────
echo           GDK GYM MANAGEMENT SYSTEM
echo ──────────────────────────────────────────────────────────
echo.

:: Step 1: Cleanup old processes to prevent "Address in use" errors
echo [1/3] Cleaning up old sessions...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1

:: Step 2: Start the Tunnel in a new window
echo [2/3] Launching Internet Tunnel (Ngrok)...
start "GDK Gym Tunnel" cmd /c "run_ngrok.bat"

:: Step 3: Start the Gym App
echo [3/3] Launching Dashboard and Services...
echo.
echo ⚠️  KEEP THIS WINDOW OPEN to keep the gym running.
echo ──────────────────────────────────────────────────────────
echo.
call npm run dev:desktop
pause
