# Soulmate Connect Backend - Quick Start Guide

Write-Host "🚀 Soulmate Connect Backend Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
python --version

# Create virtual environment
Write-Host "`n📦 Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv

# Activate virtual environment
Write-Host "`n✅ Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Create .env file if not exists
if (-not (Test-Path .env)) {
    Write-Host "`n📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env file with your configuration!" -ForegroundColor Red
}

Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your MongoDB URL" -ForegroundColor White
Write-Host "2. Start MongoDB: docker run -d -p 27017:27017 mongo:7.0" -ForegroundColor White
Write-Host "3. Run the app: uvicorn app.main:app --reload" -ForegroundColor White
Write-Host ""
Write-Host "Or use Docker Compose:" -ForegroundColor Cyan
Write-Host "docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation: http://localhost:8000/api/docs" -ForegroundColor Green
