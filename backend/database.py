import os
import enum
from typing import AsyncGenerator

from sqlalchemy import Column, Integer, String, Float, Text, JSON, Enum, select
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

Base = declarative_base()


class DprStatus(str, enum.Enum):
    PENDING_FINANCE = "PENDING_FINANCE"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DPR(Base):
    __tablename__ = "dpr"
    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=False)
    title = Column(String, nullable=False)
    project_cost = Column(Float, nullable=False)
    duration_months = Column(Integer, nullable=False)
    scope_of_work = Column(Text, nullable=False)
    technical_milestones = Column(JSON, nullable=False)  # list of milestones
    status = Column(String, default=DprStatus.PENDING_FINANCE.value, nullable=False)
    budget_cap = Column(Float, nullable=True)  # set by finance approval
    conditions = Column(JSON, nullable=True)   # optional conditions dict


class RFP(Base):
    __tablename__ = "rfp"
    id = Column(Integer, primary_key=True, index=True)
    dpr_id = Column(Integer, nullable=False)
    emd = Column(JSON, nullable=False)  # result from math_engine
    liquidated_damages = Column(JSON, nullable=False)
    performance_guarantee = Column(JSON, nullable=False)
    generated_markdown = Column(Text, nullable=False)


class BidStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    EVALUATED = "EVALUATED"


class Bid(Base):
    __tablename__ = "bid"
    id = Column(Integer, primary_key=True, index=True)
    rfp_id = Column(Integer, nullable=False)
    vendor_name = Column(String, nullable=False)
    gstin = Column(String, nullable=False)
    financial_quote = Column(Float, nullable=False)
    technical_score = Column(Float, nullable=False)
    status = Column(String, default=BidStatus.SUBMITTED.value, nullable=False)


# Async engine setup – default to SQLite file in project root
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./govdraft.db")
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_initial_data():
    """Seed sample DPRs if database is empty."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(DPR))
        if result.scalars().first() is None:
            sample_dprs = [
                DPR(
                    department="Public Works Department",
                    title="Construction of Suspension Bridge over Alaknanda River",
                    project_cost=50000000.0,
                    duration_months=18,
                    scope_of_work="Design, engineering, procurement, and construction of a 150m pedestrian suspension bridge to connect remote villages.",
                    technical_milestones=[
                        {"name": "Site Survey & Soil Testing", "weight": 10.0},
                        {"name": "Foundation & Pillar Construction", "weight": 40.0},
                        {"name": "Suspension Cable Installation", "weight": 30.0},
                        {"name": "Decking & Final Inspection", "weight": 20.0},
                    ],
                    status=DprStatus.APPROVED.value,
                    budget_cap=50000000.0,
                ),
                DPR(
                    department="Department of Health & Family Welfare",
                    title="Procurement of Advanced MRI Machines for District Hospitals",
                    project_cost=120000000.0,
                    duration_months=6,
                    scope_of_work="Supply, installation, testing, and commissioning of 3 Tesla MRI machines with a 5-year comprehensive maintenance contract.",
                    technical_milestones=[
                        {"name": "Delivery of Equipment", "weight": 50.0},
                        {"name": "Installation & Site Preparation", "weight": 30.0},
                        {"name": "Testing & Staff Training", "weight": 20.0},
                    ],
                    status=DprStatus.PENDING_FINANCE.value,
                ),
                DPR(
                    department="Information Technology Development Agency (ITDA)",
                    title="State Wide Area Network (SWAN) Phase II Upgrade",
                    project_cost=85000000.0,
                    duration_months=12,
                    scope_of_work="Upgrading the core network infrastructure, deploying new firewalls, and establishing a redundant disaster recovery site.",
                    technical_milestones=[
                        {"name": "Network Design & Security Audit", "weight": 15.0},
                        {"name": "Hardware Procurement & Delivery", "weight": 45.0},
                        {"name": "Deployment & Configuration", "weight": 30.0},
                        {"name": "UAT & Go-Live", "weight": 10.0},
                    ],
                    status=DprStatus.PENDING_FINANCE.value,
                ),
            ]
            session.add_all(sample_dprs)
            await session.commit()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields an async DB session."""
    async with AsyncSessionLocal() as session:
        yield session
