#!/usr/bin/env bash
# GovDraft Ecosystem – Setup Script (Linux/macOS)
set -e

echo "════════════════════════════════════════════════"
echo "  GovDraft Ecosystem – Setup"
echo "════════════════════════════════════════════════"

# ── Backend ──
echo ""
echo "→ Setting up Python backend..."
cd backend

if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "  Created virtual environment"
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
echo "  Dependencies installed"

cd ..

# ── Environment ──
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  Created .env from template – please add your GROQ_API_KEY"
fi

# ── Frontend ──
echo ""
echo "→ Setting up React frontend..."
cd frontend
npm install --silent
echo "  Dependencies installed"
cd ..

echo ""
echo "════════════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Start backend:   cd backend && source venv/bin/activate && uvicorn backend.main:app --reload"
echo "  Start frontend:  cd frontend && npm run dev"
echo "════════════════════════════════════════════════"
