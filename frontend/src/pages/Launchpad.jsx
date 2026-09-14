import { useNavigate } from "react-router-dom";
import { FileText, Landmark, ScrollText, Users } from "lucide-react";

const cards = [
  {
    to: "/dpr",
    icon: FileText,
    color: "blue",
    title: "DPR Generation",
    desc: "Create and manage Detailed Project Reports with structured milestones and scope definitions.",
  },
  {
    to: "/finance",
    icon: Landmark,
    color: "green",
    title: "Finance Triage",
    desc: "Review pending DPRs, set budget caps, and approve projects for procurement.",
  },
  {
    to: "/rfp",
    icon: ScrollText,
    color: "gold",
    title: "RFP Management",
    desc: "Generate AI-powered Request for Proposals with deterministic financial calculations.",
  },
  {
    to: "/bidder",
    icon: Users,
    color: "red",
    title: "Bidder Portal",
    desc: "Submit vendor bids and view deterministic evaluation rankings.",
  },
];

export default function Launchpad() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="page-header" style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.25)",
            }}
          >
            <Landmark size={36} color="white" />
          </div>
        </div>
        <h1 style={{ fontSize: "2.25rem", color: "#0f172a" }}>GovDraft Ecosystem</h1>
        <p>
          Enterprise workflow platform for the Budget Department of Uttarakhand.
          <br />
          DPR → RFP → Bid — unified data continuity with AI-assisted document generation.
        </p>
      </div>

      <div className="launchpad-grid">
        {cards.map((c) => (
          <div key={c.to} className="launch-card" onClick={() => navigate(c.to)}>
            <div className={`card-icon ${c.color}`}>
              <c.icon size={24} />
            </div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>


    </div>
  );
}
