import { useState, useEffect } from "react";
import { Send, BarChart3, Trophy } from "lucide-react";
import { listRfps, submitBid, evaluateBids } from "../api";
import { useToast } from "../components/Toast";

export default function BidderPortal() {
  const [tab, setTab] = useState("submit");
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Submission form state
  const [form, setForm] = useState({ rfp_id: "", vendor_name: "", gstin: "", financial_quote: "", technical_score: "" });
  const [submitting, setSubmitting] = useState(false);

  // Evaluation state
  const [evalRfpId, setEvalRfpId] = useState("");
  const [evalData, setEvalData] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await listRfps();
        setRfps(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        rfp_id: parseInt(form.rfp_id),
        vendor_name: form.vendor_name,
        gstin: form.gstin,
        financial_quote: parseFloat(form.financial_quote),
        technical_score: parseFloat(form.technical_score),
      };
      const bid = await submitBid(payload);
      toast.success(`Bid #${bid.id} submitted by ${bid.vendor_name}`);
      setForm({ rfp_id: form.rfp_id, vendor_name: "", gstin: "", financial_quote: "", technical_score: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluate = async () => {
    if (!evalRfpId) return toast.error("Select an RFP");
    setEvaluating(true);
    try {
      const data = await evaluateBids(evalRfpId);
      setEvalData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Bidder Portal</h1>
        <p>Submit vendor bids and view deterministic evaluation rankings.</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === "submit" ? "active" : ""}`} onClick={() => setTab("submit")}>
          <Send size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Submit Bid
        </button>
        <button className={`tab-btn ${tab === "evaluate" ? "active" : ""}`} onClick={() => setTab("evaluate")}>
          <BarChart3 size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Evaluation Matrix
        </button>
      </div>

      {/* ── Submit Bid Tab ── */}
      {tab === "submit" && (
        <div className="glass-card" style={{ maxWidth: 600 }}>
          {rfps.length === 0 && !loading ? (
            <div className="empty-state"><p>No RFPs available. Generate one from the RFP Management portal first.</p></div>
          ) : (
            <form onSubmit={handleSubmitBid}>
              <div className="form-group">
                <label>Select RFP</label>
                <select className="form-control" required value={form.rfp_id} onChange={(e) => set("rfp_id", e.target.value)}>
                  <option value="">— choose an RFP —</option>
                  {rfps.map((r) => (
                    <option key={r.id} value={r.id}>RFP #{r.id} (DPR #{r.dpr_id})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.25rem" }}>
                <div className="form-group">
                  <label>Vendor Name</label>
                  <input className="form-control" required value={form.vendor_name} onChange={(e) => set("vendor_name", e.target.value)} placeholder="Company name" />
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input className="form-control" required value={form.gstin} onChange={(e) => set("gstin", e.target.value)} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="form-group">
                  <label>Financial Quote (₹)</label>
                  <input className="form-control" type="number" required min="1" step="0.01" value={form.financial_quote} onChange={(e) => set("financial_quote", e.target.value)} placeholder="Bid amount" />
                </div>
                <div className="form-group">
                  <label>Technical Score (0–100)</label>
                  <input className="form-control" type="number" required min="0" max="100" step="0.1" value={form.technical_score} onChange={(e) => set("technical_score", e.target.value)} placeholder="Self-assessed score" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="spinner" /> : <Send size={16} />}
                {submitting ? "Submitting…" : "Submit Bid"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Evaluation Matrix Tab ── */}
      {tab === "evaluate" && (
        <div className="glass-card">
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label>Select RFP to Evaluate</label>
              <select className="form-control" value={evalRfpId} onChange={(e) => setEvalRfpId(e.target.value)}>
                <option value="">— choose —</option>
                {rfps.map((r) => (
                  <option key={r.id} value={r.id}>RFP #{r.id}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleEvaluate} disabled={evaluating || !evalRfpId}>
              {evaluating ? <span className="spinner" /> : <BarChart3 size={16} />}
              {evaluating ? "Evaluating…" : "Run Evaluation"}
            </button>
          </div>

          {evalData && evalData.evaluations?.length > 0 ? (
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                Budget Cap: <strong style={{ color: "var(--color-gold)" }}>₹{Number(evalData.budget_cap).toLocaleString("en-IN")}</strong>
                &nbsp;| Scoring: 60% Financial (L1) + 40% Technical
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Vendor</th>
                    <th>GSTIN</th>
                    <th>Quote (₹)</th>
                    <th>Tech Score</th>
                    <th>L1 Score</th>
                    <th>Combined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {evalData.evaluations.map((ev) => (
                    <tr key={ev.bid_id}>
                      <td>
                        {ev.rank === 1 && <Trophy size={14} style={{ color: "var(--color-gold)", marginRight: 4, verticalAlign: -2 }} />}
                        #{ev.rank}
                      </td>
                      <td>{ev.vendor_name}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>{ev.gstin}</td>
                      <td>₹{Number(ev.financial_quote).toLocaleString("en-IN")}</td>
                      <td>{ev.technical_score}</td>
                      <td>{ev.l1_score}</td>
                      <td style={{ fontWeight: 700 }}>{ev.combined_score}</td>
                      <td><span className={`badge ${ev.status === "PASS" ? "badge-pass" : "badge-fail"}`}>{ev.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : evalData && evalData.evaluations?.length === 0 ? (
            <div className="empty-state"><p>{evalData.message || "No bids submitted for this RFP."}</p></div>
          ) : null}
        </div>
      )}
    </div>
  );
}
