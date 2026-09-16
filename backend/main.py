"""GovDraft Ecosystem – FastAPI Backend
All financial computations are handled by math_engine (never by the LLM).
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import init_db, seed_initial_data, get_db, DPR, RFP, Bid, DprStatus, BidStatus
from backend.math_engine import (
    calculate_emd,
    calculate_performance_guarantee,
    calculate_liquidated_damages,
)
from backend.rag_engine import get_clauses, generate_rfp


# ──────────────────────────────────────────────
# Lifespan: create tables & seed initial data on startup
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_initial_data()
    yield


app = FastAPI(
    title="GovDraft API",
    description="Enterprise workflow for DPR → RFP → Bid pipeline",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Pydantic Schemas
# ──────────────────────────────────────────────
class MilestoneSchema(BaseModel):
    name: str
    weight: float = Field(..., ge=0, le=100, description="Weight percentage")


class DprCreate(BaseModel):
    department: str
    title: str
    project_cost: float = Field(..., gt=0)
    duration_months: int = Field(..., gt=0)
    scope_of_work: str
    technical_milestones: list[MilestoneSchema]


class DprApprove(BaseModel):
    budget_cap: float = Field(..., gt=0)
    conditions: Optional[dict] = None


class BidCreate(BaseModel):
    rfp_id: int
    vendor_name: str
    gstin: str
    financial_quote: float = Field(..., gt=0)
    technical_score: float = Field(..., ge=0, le=100)


class DprOut(BaseModel):
    id: int
    department: str
    title: str
    project_cost: float
    duration_months: int
    scope_of_work: str
    technical_milestones: list
    status: str
    budget_cap: Optional[float] = None
    conditions: Optional[dict] = None

    class Config:
        from_attributes = True


class RfpOut(BaseModel):
    id: int
    dpr_id: int
    emd: dict
    liquidated_damages: dict
    performance_guarantee: dict
    generated_markdown: str

    class Config:
        from_attributes = True


class BidOut(BaseModel):
    id: int
    rfp_id: int
    vendor_name: str
    gstin: str
    financial_quote: float
    technical_score: float
    status: str

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# DPR Endpoints
# ──────────────────────────────────────────────
@app.post("/api/dpr", response_model=DprOut, status_code=201)
async def create_dpr(payload: DprCreate, db: AsyncSession = Depends(get_db)):
    dpr = DPR(
        department=payload.department,
        title=payload.title,
        project_cost=payload.project_cost,
        duration_months=payload.duration_months,
        scope_of_work=payload.scope_of_work,
        technical_milestones=[m.model_dump() for m in payload.technical_milestones],
        status=DprStatus.PENDING_FINANCE.value,
    )
    db.add(dpr)
    await db.commit()
    await db.refresh(dpr)
    return dpr


@app.get("/api/dpr", response_model=list[DprOut])
async def list_dprs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DPR).order_by(DPR.id.desc()))
    return result.scalars().all()


@app.get("/api/dpr/{dpr_id}", response_model=DprOut)
async def get_dpr(dpr_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DPR).where(DPR.id == dpr_id))
    dpr = result.scalar_one_or_none()
    if not dpr:
        raise HTTPException(404, "DPR not found")
    return dpr


@app.put("/api/dpr/{dpr_id}/approve", response_model=DprOut)
async def approve_dpr(
    dpr_id: int, payload: DprApprove, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(DPR).where(DPR.id == dpr_id))
    dpr = result.scalar_one_or_none()
    if not dpr:
        raise HTTPException(404, "DPR not found")
    if dpr.status == DprStatus.APPROVED.value:
        raise HTTPException(400, "DPR has already been approved")
    if dpr.status == DprStatus.REJECTED.value:
        raise HTTPException(400, "DPR has already been rejected and cannot be approved")
    if dpr.status != DprStatus.PENDING_FINANCE.value:
        raise HTTPException(400, "DPR is not pending finance approval")

    dpr.status = DprStatus.APPROVED.value
    dpr.budget_cap = payload.budget_cap
    dpr.conditions = payload.conditions
    await db.commit()
    await db.refresh(dpr)
    return dpr


@app.put("/api/dpr/{dpr_id}/reject", response_model=DprOut)
async def reject_dpr(dpr_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DPR).where(DPR.id == dpr_id))
    dpr = result.scalar_one_or_none()
    if not dpr:
        raise HTTPException(404, "DPR not found")
    if dpr.status == DprStatus.APPROVED.value:
        raise HTTPException(400, "DPR has already been approved and cannot be rejected")
    if dpr.status == DprStatus.REJECTED.value:
        raise HTTPException(400, "DPR has already been rejected")
    if dpr.status != DprStatus.PENDING_FINANCE.value:
        raise HTTPException(400, "DPR is not pending finance review")

    dpr.status = DprStatus.REJECTED.value
    await db.commit()
    await db.refresh(dpr)
    return dpr


# ──────────────────────────────────────────────
# RFP Endpoints
# ──────────────────────────────────────────────
@app.post("/api/rfp/generate/{dpr_id}", response_model=RfpOut, status_code=201)
async def generate_rfp_endpoint(dpr_id: int, db: AsyncSession = Depends(get_db)):
    # Fetch the DPR
    result = await db.execute(select(DPR).where(DPR.id == dpr_id))
    dpr = result.scalar_one_or_none()
    if not dpr:
        raise HTTPException(404, "DPR not found")
    if dpr.status != DprStatus.APPROVED.value:
        raise HTTPException(400, "DPR must be APPROVED before generating an RFP")

    # Prevent duplicate RFP for the same DPR
    existing_rfp = await db.execute(select(RFP).where(RFP.dpr_id == dpr_id))
    if existing_rfp.scalar_one_or_none():
        raise HTTPException(400, "An RFP has already been generated for this DPR")

    # ── Deterministic calculations (NEVER by LLM) ──
    emd = calculate_emd(dpr.project_cost)
    perf_guarantee = calculate_performance_guarantee(dpr.project_cost)
    ld = calculate_liquidated_damages(dpr.project_cost, 4)  # sample: 4 weeks delay

    # ── RAG: retrieve clauses + generate markdown ──
    clauses = get_clauses("default")
    dpr_dict = {
        "department": dpr.department,
        "title": dpr.title,
        "project_cost": dpr.project_cost,
        "duration_months": dpr.duration_months,
        "scope_of_work": dpr.scope_of_work,
        "technical_milestones": dpr.technical_milestones,
        "budget_cap": dpr.budget_cap,
    }
    markdown = generate_rfp(dpr_dict, clauses, emd, perf_guarantee, ld)

    # ── Persist ──
    rfp = RFP(
        dpr_id=dpr_id,
        emd=emd,
        liquidated_damages=ld,
        performance_guarantee=perf_guarantee,
        generated_markdown=markdown,
    )
    db.add(rfp)
    await db.commit()
    await db.refresh(rfp)
    return rfp


@app.get("/api/rfp", response_model=list[RfpOut])
async def list_rfps(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RFP).order_by(RFP.id.desc()))
    return result.scalars().all()


@app.get("/api/rfp/{rfp_id}", response_model=RfpOut)
async def get_rfp(rfp_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RFP).where(RFP.id == rfp_id))
    rfp = result.scalar_one_or_none()
    if not rfp:
        raise HTTPException(404, "RFP not found")
    return rfp


# ──────────────────────────────────────────────
# Bid Endpoints
# ──────────────────────────────────────────────
@app.post("/api/bid/submit", response_model=BidOut, status_code=201)
async def submit_bid(payload: BidCreate, db: AsyncSession = Depends(get_db)):
    # Verify RFP exists
    result = await db.execute(select(RFP).where(RFP.id == payload.rfp_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "RFP not found")

    bid = Bid(
        rfp_id=payload.rfp_id,
        vendor_name=payload.vendor_name,
        gstin=payload.gstin,
        financial_quote=payload.financial_quote,
        technical_score=payload.technical_score,
        status=BidStatus.SUBMITTED.value,
    )
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return bid


@app.get("/api/bid/evaluate/{rfp_id}")
async def evaluate_bids(rfp_id: int, db: AsyncSession = Depends(get_db)):
    """Deterministic bid evaluation: L1 (lowest price) + L2 (compliance score)."""
    # Fetch RFP for budget cap reference
    rfp_result = await db.execute(select(RFP).where(RFP.id == rfp_id))
    rfp = rfp_result.scalar_one_or_none()
    if not rfp:
        raise HTTPException(404, "RFP not found")

    # Get associated DPR for budget cap
    dpr_result = await db.execute(select(DPR).where(DPR.id == rfp.dpr_id))
    dpr = dpr_result.scalar_one_or_none()
    budget_cap = dpr.budget_cap if dpr and dpr.budget_cap else dpr.project_cost if dpr else 0

    # Fetch bids
    bids_result = await db.execute(
        select(Bid).where(Bid.rfp_id == rfp_id).order_by(Bid.financial_quote)
    )
    bids = bids_result.scalars().all()
    if not bids:
        return {"rfp_id": rfp_id, "budget_cap": budget_cap, "evaluations": [], "message": "No bids submitted yet"}

    # Deterministic ranking
    lowest_quote = bids[0].financial_quote
    evaluations = []
    for rank, bid in enumerate(bids, 1):
        within_budget = bid.financial_quote <= budget_cap
        # L1 score: ratio of lowest quote to this quote (1.0 = best)
        l1_score = round(lowest_quote / bid.financial_quote, 4) if bid.financial_quote > 0 else 0
        # Combined: 60% financial (L1) + 40% technical
        combined_score = round(l1_score * 60 + (bid.technical_score / 100) * 40, 2)
        evaluations.append({
            "rank": rank,
            "bid_id": bid.id,
            "vendor_name": bid.vendor_name,
            "gstin": bid.gstin,
            "financial_quote": bid.financial_quote,
            "technical_score": bid.technical_score,
            "l1_score": l1_score,
            "combined_score": combined_score,
            "within_budget": within_budget,
            "status": "PASS" if within_budget and bid.technical_score >= 60 else "FAIL",
        })

    # Update bid statuses
    for bid in bids:
        bid.status = BidStatus.EVALUATED.value
    await db.commit()

    return {
        "rfp_id": rfp_id,
        "budget_cap": budget_cap,
        "evaluations": evaluations,
    }


# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "GovDraft API"}


# ──────────────────────────────────────────────
# Static files & SPA Catch-all (Single-Server Production)
# ──────────────────────────────────────────────
FRONTEND_DIST = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist"
)

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(404, "API endpoint not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
