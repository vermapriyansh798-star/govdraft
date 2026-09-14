import { useState, useEffect } from "react";
import { CheckCircle, Eye, X } from "lucide-react";
import { listDprs, approveDpr } from "../api";
import { useToast } from "../components/Toast";

export default function FinanceTriage() {
  const [dprs, setDprs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [budgetCap, setBudgetCap] = useState("");
  const [conditions, setConditions] = useState("");
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const toast = useToast();

  const fetchDprs = async () => {
    try {
      setLoading(true);
      const data = await listDprs();
      setDprs(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDprs(); }, []);

  const handleApprove = async () => {
    if (!budgetCap) return toast.error("Budget cap is required");
    setApproving(true);
    try {
      const payload = {
        budget_cap: parseFloat(budgetCap),
        conditions: conditions.trim() ? { notes: conditions } : null,
      };
      await approveDpr(selected.id, payload);
      toast.success(`DPR #${selected.id} approved`);
      setSelected(null);
      setBudgetCap("");
      setConditions("");
      fetchDprs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setApproving(false);
    }
  };

  const statusBadge = (s) => {
    const cls = s === "APPROVED" ? "badge-approved" : s === "REJECTED" ? "badge-rejected" : "badge-pending";
    return <span className={`badge ${cls}`}>{s}</span>;
  };

  const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Finance Triage</h1>
        <p>Review Detailed Project Reports and approve funding with budget caps.</p>
      </div>

      <div className="glass-card">
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /><span>Loading DPRs…</span></div>
        ) : dprs.length === 0 ? (
          <div className="empty-state"><p>No DPRs found. Create one from the DPR Generation portal.</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Department</th>
                <th>Cost</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dprs.map((d) => (
                <tr key={d.id}>
                  <td>#{d.id}</td>
                  <td>{d.title}</td>
                  <td>{d.department}</td>
                  <td>{fmt(d.project_cost)}</td>
                  <td>{d.duration_months} mo</td>
                  <td>{statusBadge(d.status)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => { setSelected(d); setBudgetCap(String(d.project_cost)); }}>
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail / Approval Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>DPR #{selected.id}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>

            <div className="form-group"><label>Title</label><p>{selected.title}</p></div>
            <div className="form-group"><label>Department</label><p>{selected.department}</p></div>
            <div className="form-group"><label>Estimated Cost</label><p>{fmt(selected.project_cost)}</p></div>
            <div className="form-group"><label>Duration</label><p>{selected.duration_months} months</p></div>
            <div className="form-group"><label>Scope</label><p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{selected.scope_of_work}</p></div>
            <div className="form-group">
              <label>Milestones</label>
              <ul style={{ marginLeft: "1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                {(selected.technical_milestones || []).map((m, i) => (
                  <li key={i}>{typeof m === "object" ? `${m.name} (${m.weight}%)` : m}</li>
                ))}
              </ul>
            </div>

            {selected.status === "PENDING_FINANCE" && (
              <>
                <hr style={{ borderColor: "var(--color-glass-border)", margin: "1rem 0" }} />
                <div className="form-group">
                  <label>Budget Cap (₹)</label>
                  <input className="form-control" type="number" min="1" value={budgetCap} onChange={(e) => setBudgetCap(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Conditions (optional)</label>
                  <textarea className="form-control" rows={2} value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Any conditions for approval..." />
                </div>
                <button className="btn btn-success" onClick={handleApprove} disabled={approving}>
                  {approving ? <span className="spinner" /> : <CheckCircle size={16} />}
                  {approving ? "Approving…" : "Approve DPR"}
                </button>
              </>
            )}

            {selected.status === "APPROVED" && (
              <div style={{ marginTop: "1rem" }}>
                <span className="badge badge-approved">✓ Approved</span>
                {selected.budget_cap && <span style={{ marginLeft: 8, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Budget Cap: {fmt(selected.budget_cap)}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
