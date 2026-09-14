import urllib.request
import urllib.error
import json

def seed():
    url = "http://localhost:8000/api/dpr"
    headers = {'Content-Type': 'application/json'}
    
    dprs = [
        {
            "department": "Public Works Department",
            "title": "Construction of Suspension Bridge over Alaknanda River",
            "project_cost": 50000000.0,
            "duration_months": 18,
            "scope_of_work": "Design, engineering, procurement, and construction of a 150m pedestrian suspension bridge to connect remote villages.",
            "technical_milestones": [
                {"name": "Site Survey & Soil Testing", "weight": 10.0},
                {"name": "Foundation & Pillar Construction", "weight": 40.0},
                {"name": "Suspension Cable Installation", "weight": 30.0},
                {"name": "Decking & Final Inspection", "weight": 20.0}
            ]
        },
        {
            "department": "Department of Health & Family Welfare",
            "title": "Procurement of Advanced MRI Machines for District Hospitals",
            "project_cost": 120000000.0,
            "duration_months": 6,
            "scope_of_work": "Supply, installation, testing, and commissioning of 3 Tesla MRI machines with a 5-year comprehensive maintenance contract.",
            "technical_milestones": [
                {"name": "Delivery of Equipment", "weight": 50.0},
                {"name": "Installation & Site Preparation", "weight": 30.0},
                {"name": "Testing & Staff Training", "weight": 20.0}
            ]
        },
        {
            "department": "Information Technology Development Agency (ITDA)",
            "title": "State Wide Area Network (SWAN) Phase II Upgrade",
            "project_cost": 85000000.0,
            "duration_months": 12,
            "scope_of_work": "Upgrading the core network infrastructure, deploying new firewalls, and establishing a redundant disaster recovery site.",
            "technical_milestones": [
                {"name": "Network Design & Security Audit", "weight": 15.0},
                {"name": "Hardware Procurement & Delivery", "weight": 45.0},
                {"name": "Deployment & Configuration", "weight": 30.0},
                {"name": "UAT & Go-Live", "weight": 10.0}
            ]
        }
    ]
    
    print("Seeding database with 3 sample DPRs...")
    for dpr in dprs:
        data = json.dumps(dpr).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers)
        try:
            with urllib.request.urlopen(req) as response:
                if response.status == 201:
                    print(f"[OK] Created DPR: {dpr['title']}")
                else:
                    print(f"[ERR] Failed to create DPR: {dpr['title']} - Status: {response.status}")
        except urllib.error.URLError as e:
            print(f"[ERR] Request failed for {dpr['title']}: {e.reason}")

if __name__ == "__main__":
    seed()
