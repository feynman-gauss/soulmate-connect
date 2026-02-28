@echo off
REM Start Soulmate Connect - Backend & Frontend

echo ============================================
echo  Soulmate Connect - Application Startup
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "api" (
    echo Error: api folder not found. Please run from project root.
    exit /b 1
)

if not exist "frontend" (
    echo Error: frontend folder not found. Please run from project root.
    exit /b 1
)

echo Starting API (FastAPI on port 8000)...
echo.
start cmd /k "cd api && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak

echo.
echo Starting Frontend (Vite on port 5173)...
echo.
start cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo  Applications Started!
echo ============================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/api/docs
echo.
echo Press CTRL+C in either window to stop the server.
echo.

