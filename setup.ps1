# GovDraft Ecosystem – Setup Script (Windows PowerShell)
# Run: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GovDraft Ecosystem – Setup" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan

# ── Backend ──
Write-Host ""
Write-Host "→ Setting up Python backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "  Created virtual environment" -ForegroundColor Green
}

& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt --quiet
Write-Host "  Dependencies installed" -ForegroundColor Green

Set-Location ..

# ── Environment ──
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Created .env from template – please add your GROQ_API_KEY" -ForegroundColor Yellow
}

# ── Frontend ──
Write-Host ""
Write-Host "→ Setting up React frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install --silent
Write-Host "  Dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Start backend:   cd backend; .\venv\Scripts\Activate.ps1; uvicorn backend.main:app --reload" -ForegroundColor White
Write-Host "  Start frontend:  cd frontend; npm run dev" -ForegroundColor White
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
