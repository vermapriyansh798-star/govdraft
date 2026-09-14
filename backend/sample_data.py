'''Sample procurement clauses for Uttarakhand Government'''

ARBITRATION = """
**Arbitration Clause**
All disputes arising out of or in connection with this contract shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be Dehradun, Uttarakhand. The language of arbitration shall be English.
"""

FORCE_MAJEURE = """
**Force Majeure**
Neither Party shall be liable for failure or delay in performance caused by events beyond its reasonable control, including natural disasters, war, strikes, or government actions. The affected Party shall notify the other Party within five (5) days of the occurrence.
"""

TERMINATION_FOR_DEFAULT = """
**Termination for Default**
The Employer may terminate the contract without prejudice to any other rights if the Contractor fails to cure any material breach within fifteen (15) days of receipt of a written notice.
"""

ELIGIBILITY = """
**Eligibility Criteria**
Only firms duly registered under the Companies Act, possessing a valid GST registration, and having a minimum net worth of ₹10 crore are eligible to submit bids. Experience of at least three (3) years on similar projects is mandatory.
"""

# Mapping for quick lookup based on project type (can be expanded)
CLAUSES_BY_TYPE = {
    "default": [ARBITRATION, FORCE_MAJEURE, TERMINATION_FOR_DEFAULT, ELIGIBILITY],
    # Example: "infrastructure": [...], "energy": [...]
}
