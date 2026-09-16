const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── DPR ──
export const createDpr = (data) => request("/dpr", { method: "POST", body: JSON.stringify(data) });
export const listDprs = () => request("/dpr");
export const getDpr = (id) => request(`/dpr/${id}`);
export const approveDpr = (id, data) => request(`/dpr/${id}/approve`, { method: "PUT", body: JSON.stringify(data) });
export const rejectDpr = (id) => request(`/dpr/${id}/reject`, { method: "PUT" });

// ── RFP ──
export const generateRfp = (dprId) => request(`/rfp/generate/${dprId}`, { method: "POST" });
export const listRfps = () => request("/rfp");
export const getRfp = (id) => request(`/rfp/${id}`);

// ── Bid ──
export const submitBid = (data) => request("/bid/submit", { method: "POST", body: JSON.stringify(data) });
export const evaluateBids = (rfpId) => request(`/bid/evaluate/${rfpId}`);
