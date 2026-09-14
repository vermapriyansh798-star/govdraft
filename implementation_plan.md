# GovDraft Ecosystem Prototype Implementation Plan

## Goal Description
Create a complete, working prototype of the **GovDraft Ecosystem** – an enterprise workflow platform for the Uttarakhand Budget Department. The implementation includes a FastAPI backend with deterministic financial calculations, a Groq‑powered RAG engine, and a React + Vite frontend styled with Tailwind CSS and Lucide icons. The solution must be ready to run locally with one‑click setup commands.

---

## User Review Required
> [!IMPORTANT]
> 1. **UI Theme & Branding** – Confirm the colour palette, state‑seal placeholder image, and any specific branding assets you want to use.
> 2. **Deployment Target** – Do you plan to later switch the SQLite DB to PostgreSQL? If so, indicate any required configuration (e.g., env vars).
> 3. **Groq API Key** – Provide a valid Groq API key (or a placeholder) for the backend to authenticate.
> 4. **Domain‑Specific Rules** – If you need additional procurement clauses beyond the four baseline, list them now.
> 5. **Error‑Handling Policy** – Should the API return detailed validation errors (400) or a generic message? Confirm preferred approach.

---

## Open Questions
> [!WARNING]
> - **Frontend State Management**: Should we use React Context, Zustand, or simple local component state? (Recommended: React Context for simplicity.)
> - **Form Validation**: Do you prefer HTML5 validation only, or integration of a library like `react-hook-form`/`yup`?
> - **Toast/Notification System**: Which library (e.g., `react-hot-toast`) should we include, or use a custom component?
> - **File Structure Variations**: Any preference for separating API service calls into a `services/` folder?
> - **Security**: Although no auth is required now, will you later need JWT or session‑based auth? If yes, we can scaffold basic middleware.

---

## Proposed Changes
### Backend (`backend/`)
#### [NEW] `requirements.txt`
- FastAPI, uvicorn, pydantic, groq, sqlalchemy, aiosqlite, python‑dotenv.

#### [NEW] `config.py`
- Load `GROQ_API_KEY` from environment, define model name constant.

#### [NEW] `database.py`
- SQLAlchemy models for DPR, RFP, Bid.
- SQLite engine with optional PostgreSQL URL via env var.
- Helper functions: `create_dpr`, `list_dprs`, `approve_dpr`, `save_rfp`, `save_bid`.

#### [NEW] `math_engine.py`
- Deterministic functions:
  - `calculate_emd(project_cost)` → `{value: float, formatted: str}`.
  - `calculate_performance_guarantee(project_cost, percentage=5.0)`.
  - `calculate_liquidated_damages(milestone_cost, weeks_delayed)`.
- All rounding to 2 decimals, INR formatting.

#### [NEW] `rag_engine.py`
- In‑memory dictionary of baseline rule chunks.
- `get_clauses(project_type)` returns relevant text.
- `generate_rfp(dpr, clauses)` calls Groq SDK with strict system prompt; injects calculated numbers from `math_engine`.
- Handles errors and returns markdown string.

#### [NEW] `sample_data.py`
- Python dict of procurement rule snippets (Arbitration, Force Majeure, Termination, Eligibility).

#### [NEW] `main.py`
- FastAPI app with CORS.
- Endpoints:
  - `POST /api/dpr` → create DPR (status PENDING_FINANCE).
  - `GET /api/dpr` → list DPRs.
  - `PUT /api/dpr/{id}/approve` → set status APPROVED, store `budget_cap`.
  - `POST /api/rfp/generate/{dpr_id}` → call math_engine, rag_engine, store RFP.
  - `POST /api/bid/submit` → store bid.
  - `GET /api/bid/evaluate/{rfp_id}` → deterministic ranking (L1 based on price, L2 compliance).
- Pydantic schemas for request/response models.

### Frontend (`frontend/`)
#### Project init
- `npm create vite@latest . -- --template react` then add Tailwind, Lucide, React Router, and optionally `react-hot-toast`.

#### `src/App.jsx`
- React Router v6 routes for `/`, `/dpr`, `/finance`, `/rfp`, `/bidder` linking to respective page components.

#### `src/pages/Launchpad.jsx`
- Card grid (4 cards) styled with Tailwind, using Lucide icons, placeholder seal image.
- Clicking a card navigates via `useNavigate`.

#### `src/pages/DprGeneration.jsx`
- Form (React Hook Form or native) with fields: department, title, cost, duration, scope, milestones.
- On submit POST to `/api/dpr`; show toast with returned DPR id.

#### `src/pages/FinanceTriage.jsx`
- Table of DPRs with status PENDING_FINANCE.
- Detail modal shows DPR data, approve button opens a small form to set budget cap and optional conditions → PUT `/api/dpr/{id}/approve`.

#### `src/pages/RfpManagement.jsx`
- Dropdown of approved DPRs.
- Badges showing EMD & Liquidated Damages (call backend `/api/rfp/generate/{id}` to get calculations).
- "Generate Tender Clauses" button triggers POST, shows loading spinner, then displays markdown preview (use `react-markdown`).
- Lock icon next to badges to indicate AI‑decoupled.

#### `src/pages/BidderPortal.jsx`
- Tabs (`@headlessui/react` or simple state) for "Submit Bid" and "Evaluation Matrix".
- Submission form POST `/api/bid/submit`.
- Evaluation view GET `/api/bid/evaluate/{rfp_id}` → table sorted by L1 score, color‑coded pass/fail.

#### `src/components/Navbar.jsx`
- Simple top navigation with logo and links.

#### Additional UI utilities
- Tailwind config with custom palette (Uttarakhand govt colours).
- Lucide icons for each portal card.
- Toast component (e.g., `react-hot-toast`).

---

## Verification Plan
### Automated Tests
- Backend: Use `pytest` with `httpx.AsyncClient` to test each endpoint (creation, approval, RFP generation, bid submission, evaluation).
- Verify math_engine outputs match expected values for sample inputs.
- Verify rag_engine returns markdown containing injected numbers.

### Manual Verification
- **Setup**: Run `pip install -r backend/requirements.txt` and `npm install` in frontend.
- **Run Backend**: `uvicorn backend.main:app --reload`.
- **Run Frontend**: `npm run dev`.
- Walk through each portal:
  1. Create a DPR, confirm toast.
  2. Approve in Finance Triage, set cap.
  3. Generate RFP, ensure calculation badges display correct INR values and markdown contains clauses.
  4. Submit a vendor bid, evaluate matrix, verify ranking respects budget cap and price.
- Check that no LLM is used for calculations – inspect network requests (only Groq call for text generation).

### Post‑deployment Checklist
- Ensure environment variable `GROQ_API_KEY` is set.
- Confirm SQLite file `govdraft.db` is created.
- Verify CORS allows frontend origin.
- Validate that all UI elements are responsive and adhere to the Uttarakhand theme.

---

*Once you approve this plan (or provide adjustments), I will generate the full code for each listed file and the necessary setup scripts.*
