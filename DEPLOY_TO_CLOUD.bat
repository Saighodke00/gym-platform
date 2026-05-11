@echo off
TITLE GDK Gym - Cloud Deployer
echo ──────────────────────────────────────────────────────────
echo           GDK GYM - CLOUD DEPLOYER (HF)
echo ──────────────────────────────────────────────────────────
echo.
echo This script will push your latest code to Hugging Face.
echo.
echo 1. Go to: https://huggingface.co/settings/tokens
echo 2. Create a "WRITE" token and COPY it.
echo.
set /p HF_TOKEN="🔑 Paste your Hugging Face Token here: "

if "%HF_TOKEN%"=="" (
    echo.
    echo ❌ No token provided. Exiting...
    pause
    exit
)

echo.
echo [1/2] Setting up Hugging Face connection...
:: Use the token in the URL for silent authentication
git remote remove hf >nul 2>&1
git remote add hf https://Sai-ban111:%HF_TOKEN%@huggingface.co/spaces/Sai-ban111/gym_app

echo [2/2] Pushing code to Hugging Face (this may take a minute)...
git push hf main --force

echo.
echo ──────────────────────────────────────────────────────────
echo ✅ DEPLOYMENT COMPLETE!
echo ──────────────────────────────────────────────────────────
echo.
echo Your app is now building on Hugging Face.
echo Check status here: https://huggingface.co/spaces/Sai-ban111/gym_app
echo.
echo IMPORTANT: Don't forget to add your .env SECRETS in the 
echo Hugging Face "Settings > Variables and secrets" page!
echo.
pause
