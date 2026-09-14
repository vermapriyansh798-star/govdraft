import { useState, useEffect } from "react";
import { Lock, Wand2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { listDprs, generateRfp, listRfps } from "../api";
import { useToast } from "../components/Toast";

export default function RfpManagement() {
  const [dprs, setDprs] = useState([]);
  const [rfps, setRfps] = useState([]);
  const [selectedDpr, setSelectedDpr] = useState("");
  const [currentRfp, setCurrentRfp] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [dprData, rfpData] = await Promise.all([listDprs(), listRfps()]);
        setDprs(dprData.filter((d) => d.status === "APPROVED"));
        setRfps(rfpData);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGenerate = async () => {
    if (!selectedDpr) return toast.error("Select an approved DPR first");
    setGenerating(true);
    setCurrentRfp(null);
    try {
      const rfp = await generateRfp(selectedDpr);
      setCurrentRfp(rfp);
      setRfps((prev) => [rfp, ...prev]);
      toast.success(`RFP #${rfp.id} generated`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Show existing RFP for selected DPR
  useEffect(() => {
    if (selectedDpr) {
      const existing = rfps.find((r) => r.dpr_id === parseInt(selectedDpr));
      setCurrentRfp(existing || null);
    }
  }, [selectedDpr, rfps]);

  const selectedDprObj = dprs.find((d) => d.id === parseInt(selectedDpr));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>RFP Management</h1>
        <p>Generate AI-powered Request for Proposals with deterministic financial calculations.</p>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>Select Approved DPR</label>
            <select className="form-control" value={selectedDpr} onChange={(e) => setSelectedDpr(e.target.value)}>
              <option value="">— choose a DPR —</option>
              {dprs.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} — {d.title} (₹{Number(d.project_cost).toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || !selectedDpr}>
            {generating ? <span className="spinner" /> : <Wand2 size={16} />}
            {generating ? "Generating…" : "Generate Tender Clauses"}
          </button>
        </div>
      </div>

      {/* Financial Badges */}
      {currentRfp && (
        <div className="finance-badges">
          <div className="finance-badge">
            <Lock size={14} className="lock-icon" />
            <div>
              <div className="label">EMD (2%)</div>
              <div className="amount">{currentRfp.emd?.formatted}</div>
            </div>
          </div>
          <div className="finance-badge">
            <Lock size={14} className="lock-icon" />
            <div>
              <div className="label">Performance Guarantee (5%)</div>
              <div className="amount">{currentRfp.performance_guarantee?.formatted}</div>
            </div>
          </div>
          <div className="finance-badge">
            <Lock size={14} className="lock-icon" />
            <div>
              <div className="label">Liquidated Damages</div>
              <div className="amount">{currentRfp.liquidated_damages?.formatted}</div>
            </div>
          </div>
        </div>
      )}

      {/* Generated RFP Preview */}
      {generating && (
        <div className="glass-card">
          <div className="loading-overlay">
            <div className="spinner" />
            <span>Generating RFP with AI… (financial numbers are pre-calculated)</span>
          </div>
        </div>
      )}

      {currentRfp && !generating && (
        <div className="glass-card" style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
              Generated RFP #{currentRfp.id}
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
              DPR #{currentRfp.dpr_id}
            </span>
          </div>
          <div className="markdown-preview">
            <ReactMarkdown>{currentRfp.generated_markdown}</ReactMarkdown>
          </div>
        </div>
      )}

      {!currentRfp && !generating && selectedDpr && (
        <div className="glass-card">
          <div className="empty-state">
            <Wand2 size={40} />
            <p>No RFP generated for this DPR yet. Click "Generate Tender Clauses" to create one.</p>
          </div>
        </div>
      )}

      {!selectedDpr && !loading && (
        <div className="glass-card">
          <div className="empty-state">
            <p>Select an approved DPR above to view or generate its RFP.</p>
          </div>
        </div>
      )}
    </div>
  );
}
