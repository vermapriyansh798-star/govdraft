# backend/math_engine.py
"""Deterministic financial calculation utilities for GovDraft.
All functions return a dictionary with a raw numeric value and a formatted INR string.
"""

def _format_inr(value: float) -> str:
    """Format a float as Indian Rupee string with two decimal places.
    Example: 12345.6 -> "₹12,345.60"
    """
    return f"₹{value:,.2f}"


def calculate_emd(project_cost: float) -> dict:
    """Calculate Earnest Money Deposit (EMD) as 2% of project cost.
    Returns:
        {
            "value": float,  # numeric value
            "formatted": str  # INR formatted string
        }
    """
    emd = round(project_cost * 0.02, 2)
    return {"value": emd, "formatted": _format_inr(emd)}


def calculate_performance_guarantee(project_cost: float, percentage: float = 5.0) -> dict:
    """Calculate Performance Guarantee as a percentage of project cost.
    Default is 5%.
    """
    guarantee = round(project_cost * (percentage / 100), 2)
    return {"value": guarantee, "formatted": _format_inr(guarantee)}


def calculate_liquidated_damages(milestone_cost: float, weeks_delayed: int) -> dict:
    """Calculate Liquidated Damages.
    Formula: min(milestone_cost * 0.005 * weeks_delayed, milestone_cost * 0.10)
    """
    raw = milestone_cost * 0.005 * weeks_delayed
    cap = milestone_cost * 0.10
    ld = round(min(raw, cap), 2)
    return {"value": ld, "formatted": _format_inr(ld)}
