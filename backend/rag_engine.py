"""RAG Engine for GovDraft.
Retrieves relevant procurement clauses and generates RFP markdown
using the Groq LLM. All financial numbers are pre-calculated by
math_engine and injected into the prompt – the LLM never does maths.
"""

from backend.config import GROQ_API_KEY, GROQ_MODEL
from backend.sample_data import CLAUSES_BY_TYPE

try:
    from groq import Groq
except ImportError:
    Groq = None  # graceful fallback for environments without groq


def get_clauses(project_type: str = "default") -> list[str]:
    """Return the list of clause strings for a given project type."""
    return CLAUSES_BY_TYPE.get(project_type, CLAUSES_BY_TYPE["default"])


def generate_rfp(
    dpr: dict,
    clauses: list[str],
    emd: dict,
    performance_guarantee: dict,
    liquidated_damages: dict,
) -> str:
    """Call Groq LLM to produce a structured RFP document in markdown.

    Parameters
    ----------
    dpr : dict with keys department, title, project_cost, duration_months,
          scope_of_work, technical_milestones, budget_cap
    clauses : list of clause text strings
    emd, performance_guarantee, liquidated_damages : dicts from math_engine
          each with keys "value" and "formatted"

    Returns
    -------
    str  – markdown text of the generated RFP
    """
    clauses_text = "\n\n".join(clauses)

    milestones_text = ""
    if dpr.get("technical_milestones"):
        for i, m in enumerate(dpr["technical_milestones"], 1):
            if isinstance(m, dict):
                milestones_text += f"  {i}. {m.get('name', m)} – Weight: {m.get('weight', 'N/A')}%\n"
            else:
                milestones_text += f"  {i}. {m}\n"

    system_prompt = (
        "You are a legal procurement document writer for the Government of Uttarakhand. "
        "You generate Request for Proposal (RFP) documents in clean, professional Markdown. "
        "You MUST use the financial values provided below EXACTLY as given – do NOT "
        "recalculate, round, or modify any number. You MUST incorporate the provided "
        "legal clauses verbatim. Your output must be well-structured with proper headings, "
        "tables, and numbered sections."
    )

    user_prompt = f"""Generate a complete RFP document for the following project:

## Project Details
- **Department**: {dpr.get('department', 'N/A')}
- **Title**: {dpr.get('title', 'N/A')}
- **Estimated Cost**: ₹{dpr.get('project_cost', 0):,.2f}
- **Budget Cap**: ₹{dpr.get('budget_cap', dpr.get('project_cost', 0)):,.2f}
- **Duration**: {dpr.get('duration_months', 'N/A')} months
- **Scope of Work**: {dpr.get('scope_of_work', 'N/A')}

## Technical Milestones
{milestones_text}

## Pre-Calculated Financial Parameters (USE EXACTLY AS GIVEN)
| Parameter | Amount |
|---|---|
| Earnest Money Deposit (EMD) – 2% | {emd['formatted']} |
| Performance Guarantee – 5% | {performance_guarantee['formatted']} |
| Liquidated Damages (sample) | {liquidated_damages['formatted']} |

## Mandatory Legal Clauses (INCLUDE VERBATIM)
{clauses_text}

Generate the RFP with sections: Introduction, Scope, Eligibility, Financial Terms,
Technical Evaluation Criteria, Legal Clauses, Submission Guidelines, and Timeline.
"""

    # If Groq SDK is unavailable or no API key, return a template-based fallback
    if Groq is None or not GROQ_API_KEY:
        return _fallback_rfp(dpr, clauses_text, emd, performance_guarantee, liquidated_damages, milestones_text)

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=4096,
        )
        return response.choices[0].message.content
    except Exception as e:
        # On any LLM error, fall back to a deterministic template
        return _fallback_rfp(
            dpr, clauses_text, emd, performance_guarantee, liquidated_damages,
            milestones_text, error=str(e),
        )


def _fallback_rfp(
    dpr: dict,
    clauses_text: str,
    emd: dict,
    performance_guarantee: dict,
    liquidated_damages: dict,
    milestones_text: str,
    error: str | None = None,
) -> str:
    """Deterministic template-based RFP when the LLM is unavailable."""
    header = ""
    if error:
        header = f"> ⚠️ LLM unavailable ({error}). This RFP was generated from a static template.\n\n"

    return f"""{header}# Request for Proposal

## 1. Introduction
The Government of Uttarakhand, through the **{dpr.get('department', 'N/A')}** department,
invites sealed bids for the project **"{dpr.get('title', 'N/A')}"**.

## 2. Scope of Work
{dpr.get('scope_of_work', 'N/A')}

### Technical Milestones
{milestones_text if milestones_text else 'To be defined.'}

## 3. Financial Terms

| Parameter | Amount |
|---|---|
| Estimated Project Cost | ₹{dpr.get('project_cost', 0):,.2f} |
| Budget Cap | ₹{dpr.get('budget_cap', dpr.get('project_cost', 0)):,.2f} |
| Earnest Money Deposit (EMD) – 2% | {emd['formatted']} |
| Performance Guarantee – 5% | {performance_guarantee['formatted']} |
| Liquidated Damages (per milestone) | {liquidated_damages['formatted']} |

## 4. Duration
The project shall be completed within **{dpr.get('duration_months', 'N/A')} months**
from the date of award.

## 5. Legal Clauses
{clauses_text}

## 6. Submission Guidelines
- Bids must be submitted electronically via the GovDraft portal.
- Last date for submission: **30 days from publication**.
- Bids must include EMD proof and valid GSTIN.

---
*Generated by GovDraft Ecosystem – Budget Department, Uttarakhand*
"""
