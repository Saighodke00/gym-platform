@echo off
TITLE GDK Gym - Public Tunnel
echo 🚀 Starting GDK Gym Public Tunnel...
echo --------------------------------------------------
echo This will allow members to scan the QR code using 
echo their mobile data (no WiFi required).
echo --------------------------------------------------
echo.
echo ⚠️  IMPORTANT:
echo 1. Once the tunnel starts, look for a URL like:
echo    "https://your-random-name.trycloudflare.com"
echo 2. Copy that URL and paste it into your .env file
echo    as PUBLIC_URL=https://your-random-name.trycloudflare.com
echo 3. Restart the Gym Application.
echo.
echo --------------------------------------------------
npx cloudflared tunnel --url http://127.0.0.1:5173
pause
