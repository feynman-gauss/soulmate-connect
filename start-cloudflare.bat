@echo off
setlocal

echo ========================================================
echo   Soulmate Connect - Cloudflare Tunnel Deployment
echo ========================================================

REM Always use local executable for reliability
if not exist "cloudflared.exe" (
    echo [INFO] cloudflared.exe not found locally. Downloading...
    curl -L -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download cloudflared. Please download it manually:
        echo         https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
        pause
        exit /b 1
    )
    echo [INFO] Download complete.
)

set "CMD=.\cloudflared.exe"
echo [INFO] Using command: %CMD%

echo [INFO] Starting Docker services...
docker-compose -f docker-compose.cloudflare.yml down >nul 2>nul
docker-compose -f docker-compose.cloudflare.yml up -d --build

echo.
echo [INFO] Waiting for services to be ready...
:WAIT_LOOP
timeout /t 5 /nobreak >nul
curl -s -f http://localhost/health >nul
if %errorlevel% neq 0 (
    echo    - Waiting for Nginx/Backend...
    goto WAIT_LOOP
)

echo [INFO] Services are running!
echo.
echo ========================================================
echo   STARTING TUNNEL - YOUR PUBLIC URL WILL APPEAR BELOW
echo ========================================================
echo.
echo [NOTE] Press Ctrl+C to stop the tunnel
echo.

%CMD% tunnel --url http://localhost:80
