@echo off
TITLE GDK Gym - Permanent Ngrok Tunnel
echo 🚀 Starting Permanent Ngrok Tunnel...
echo --------------------------------------------------
echo Your Link: https://vindicate-petunia-saline.ngrok-free.dev
echo --------------------------------------------------
echo.

:: Add the auth token (one-time setup)
echo [1/2] Verifying Auth Token...
call npx ngrok config add-authtoken 3DLXA5XBVTITsdAFwb5pnECj1BI_5QvpyvkUAken8gUWgvoro

:: Start the tunnel to port 5173 using your custom domain
echo [2/2] Launching Tunnel...
npx ngrok http --domain=vindicate-petunia-saline.ngrok-free.dev --request-header-add="ngrok-skip-browser-warning:true" http://127.0.0.1:5173
pause
