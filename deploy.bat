@echo off
setlocal

set IMAGE_NAME=soulmate-all
set CONTAINER_NAME=soulmate-app
set PORT=8080

echo.
echo ==========================================
echo Soulmate Connect - All-in-One Deployment
echo ==========================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

:: Stop and remove existing container if it exists
echo [1/3] Cleaning up old containers...
docker stop %CONTAINER_NAME% >nul 2>&1
docker rm %CONTAINER_NAME% >nul 2>&1

:: Build the image
echo [2/3] Building Docker image (this may take a few minutes)...
docker build -f Dockerfile.deploy -t %IMAGE_NAME% .
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker build failed.
    pause
    exit /b 1
)

:: Run the container
echo [3/3] Starting the container on port %PORT%...
docker run -d --name %CONTAINER_NAME% -p %PORT%:80 %IMAGE_NAME%
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start the container.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo SUCCESS: Soulmate Connect is running!
echo URL: http://localhost:%PORT%
echo ==========================================
echo.
echo Press any key to view container logs (Ctrl+C to stop viewing)...
pause >nul
docker logs -f %CONTAINER_NAME%

endlocal
