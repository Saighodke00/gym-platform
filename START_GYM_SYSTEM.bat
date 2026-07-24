@echo off
TITLE GDK Gym - PC App Launcher

echo ──────────────────────────────────────────────────────────
echo           GDK GYM MANAGEMENT PLATFORM (PC APP)
echo ──────────────────────────────────────────────────────────
echo.
echo Launching your Desktop App...
echo (Connecting securely to Hugging Face and Neon Database)
echo.

:: Launch the UI and Electron App (no local API needed)
call npm run start:pc

pause
