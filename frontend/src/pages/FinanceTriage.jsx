import { useState, useEffect } from "react";
import { CheckCircle, Eye, X, XCircle, Download } from "lucide-react";
import { listDprs, approveDpr, rejectDpr } from "../api";
import { useToast } from "../components/Toast";

export default function FinanceTriage() {
  const [dprs, setDprs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [budgetCap, setBudgetCap] = useState("");
  const [conditions, setConditions] = useState("");
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
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

  const handleReject = async () => {
    if (!window.confirm(`Are you sure you want to reject DPR #${selected.id}? This action cannot be undone.`)) return;
    setRejecting(true);
    try {
      await rejectDpr(selected.id);
      toast.success(`DPR #${selected.id} rejected`);
      setSelected(null);
      setBudgetCap("");
      setConditions("");
      fetchDprs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRejecting(false);
    }
  };

  const statusBadge = (s) => {
    const cls =
      s === "APPROVED" ? "badge-approved" :
      s === "REJECTED" ? "badge-rejected" :
      "badge-pending";
    return <span className={`badge ${cls}`}>{s}</span>;
  };

  const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

  const downloadDpr = (d) => {
    const milestones = (d.technical_milestones || [])
      .map((m, i) => `<tr><td>${i + 1}</td><td>${typeof m === "object" ? m.name : m}</td><td>${typeof m === "object" ? m.weight + "%" : ""}</td></tr>`)
      .join("");
    const html = `
      <!DOCTYPE html><html><head><title>DPR #${d.id} — ${d.title}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #1e293b; }
        h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; }
        h2 { color: #334155; font-size: 1rem; margin-top: 1.5rem; margin-bottom: 4px; }
        p { margin: 0; color: #475569; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #1e40af; color: white; padding: 8px 12px; text-align: left; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 0.8rem; font-weight: 600; background: ${d.status === "APPROVED" ? "#d1fae5" : d.status === "REJECTED" ? "#fee2e2" : "#fef3c7"}; color: ${d.status === "APPROVED" ? "#065f46" : d.status === "REJECTED" ? "#991b1b" : "#92400e"}; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
        .meta-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .meta-item label { font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 4px; }
        .meta-item strong { color: #1e293b; font-size: 1rem; }
        footer { margin-top: 2rem; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        @media print { body { margin: 20px; } }
      </style></head><body>
      <h1>Detailed Project Report</h1>
      <p>Government of Uttarakhand &nbsp;|&nbsp; Budget Department</p>
      <div style="margin: 12px 0"><span class="badge">${d.status.replace("_", " ")}</span></div>
      <div class="meta">
        <div class="meta-item"><label>DPR ID</label><strong>#${d.id}</strong></div>
        <div class="meta-item"><label>Department</label><strong>${d.department}</strong></div>
        <div class="meta-item"><label>Estimated Cost</label><strong>${fmt(d.project_cost)}</strong></div>
        <div class="meta-item"><label>Duration</label><strong>${d.duration_months} Months</strong></div>
        ${d.budget_cap ? `<div class="meta-item"><label>Approved Budget Cap</label><strong>${fmt(d.budget_cap)}</strong></div>` : ""}
      </div>
      <h2>Project Title</h2><p>${d.title}</p>
      <h2>Scope of Work</h2><p style="white-space: pre-wrap">${d.scope_of_work}</p>
      <h2>Technical Milestones</h2>
      <table><thead><tr><th>#</th><th>Milestone</th><th>Weight</th></tr></thead><tbody>${milestones}</tbody></table>
      ${d.conditions?.notes ? `<h2>Finance Conditions</h2><p>${d.conditions.notes}</p>` : ""}
      <footer>Generated by GovDraft Ecosystem · ${new Date().toLocaleString("en-IN")}</footer>
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const isPending = selected?.status === "PENDING_FINANCE";

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Finance Triage</h1>
        <p>Review Detailed Project Reports and approve or reject funding with budget caps.</p>
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
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-outline btn-sm" onClick={() => downloadDpr(selected)} title="Download as PDF">
                  <Download size={14} /> Download PDF
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}><X size={14} /></button>
              </div>
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

            {isPending && (
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
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <button className="btn btn-success" onClick={handleApprove} disabled={approving || rejecting}>
                    {approving ? <span className="spinner" /> : <CheckCircle size={16} />}
                    {approving ? "Approving…" : "Approve DPR"}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: "#ef4444", color: "#ef4444" }}
                    onClick={handleReject}
                    disabled={rejecting || approving}
                  >
                    {rejecting ? <span className="spinner" /> : <XCircle size={16} />}
                    {rejecting ? "Rejecting…" : "Reject DPR"}
                  </button>
                </div>
              </>
            )}

            {selected.status === "APPROVED" && (
              <div style={{ marginTop: "1rem" }}>
                <span className="badge badge-approved">✓ Approved</span>
                {selected.budget_cap && <span style={{ marginLeft: 8, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Budget Cap: {fmt(selected.budget_cap)}</span>}
              </div>
            )}

            {selected.status === "REJECTED" && (
              <div style={{ marginTop: "1rem" }}>
                <span className="badge badge-rejected">✗ Rejected</span>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                  This DPR has been rejected and no further actions can be taken.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
