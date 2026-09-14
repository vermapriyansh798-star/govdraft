import { useState } from "react";
import { Send, Plus, Trash2 } from "lucide-react";
import { createDpr } from "../api";
import { useToast } from "../components/Toast";

const INITIAL = {
  department: "",
  title: "",
  project_cost: "",
  duration_months: "",
  scope_of_work: "",
};

export default function DprGeneration() {
  const [form, setForm] = useState(INITIAL);
  const [milestones, setMilestones] = useState([{ name: "", weight: "" }]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addMilestone = () => setMilestones((p) => [...p, { name: "", weight: "" }]);
  const removeMilestone = (i) => setMilestones((p) => p.filter((_, idx) => idx !== i));
  const updateMilestone = (i, k, v) =>
    setMilestones((p) => p.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        project_cost: parseFloat(form.project_cost),
        duration_months: parseInt(form.duration_months),
        technical_milestones: milestones
          .filter((m) => m.name.trim())
          .map((m) => ({ name: m.name, weight: parseFloat(m.weight) || 0 })),
      };
      const dpr = await createDpr(payload);
      toast.success(`DPR #${dpr.id} created — "${dpr.title}"`);
      setForm(INITIAL);
      setMilestones([{ name: "", weight: "" }]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>DPR Generation</h1>
        <p>Create a Detailed Project Report to initiate the procurement pipeline.</p>
      </div>

      <div className="glass-card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.25rem" }}>
            <div className="form-group">
              <label>Department</label>
              <input
                className="form-control"
                required
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="e.g. Public Works"
              />
            </div>
            <div className="form-group">
              <label>Project Title</label>
              <input
                className="form-control"
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Rishikesh Bridge Construction"
              />
            </div>
            <div className="form-group">
              <label>Estimated Cost (₹)</label>
              <input
                className="form-control"
                type="number"
                required
                min="1"
                step="0.01"
                value={form.project_cost}
                onChange={(e) => set("project_cost", e.target.value)}
                placeholder="e.g. 50000000"
              />
            </div>
            <div className="form-group">
              <label>Duration (Months)</label>
              <input
                className="form-control"
                type="number"
                required
                min="1"
                value={form.duration_months}
                onChange={(e) => set("duration_months", e.target.value)}
                placeholder="e.g. 24"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Scope of Work</label>
            <textarea
              className="form-control"
              required
              value={form.scope_of_work}
              onChange={(e) => set("scope_of_work", e.target.value)}
              placeholder="Describe the project scope in detail..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Technical Milestones</label>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  className="form-control"
                  placeholder={`Milestone ${i + 1} name`}
                  value={m.name}
                  onChange={(e) => updateMilestone(i, "name", e.target.value)}
                  style={{ flex: 2 }}
                />
                <input
                  className="form-control"
                  type="number"
                  placeholder="Weight %"
                  min="0"
                  max="100"
                  value={m.weight}
                  onChange={(e) => updateMilestone(i, "weight", e.target.value)}
                  style={{ flex: 1, maxWidth: 100 }}
                />
                {milestones.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => removeMilestone(i)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addMilestone}>
              <Plus size={14} /> Add Milestone
            </button>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <Send size={16} />}
              {loading ? "Submitting…" : "Submit DPR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
