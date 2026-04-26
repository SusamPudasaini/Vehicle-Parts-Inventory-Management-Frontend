const BASE_URL = "https://localhost:7193/api";

// ── Generic fetch helper ───────────────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (res.status === 204) return null; // No Content

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// ── Staff API  (Feature 2) ─────────────────────────────────────────────────────
export const staffApi = {
  getAll: () => request("/staff"),
  getById: (id) => request(`/staff/${id}`),
  create: (data) => request("/staff", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/staff/${id}`, { method: "DELETE" }),
};

// ── Vendor API  (Feature 5) ─────────────────────────────────────────────────────
export const vendorApi = {
  getAll: () => request("/vendor"),
  getById: (id) => request(`/vendor/${id}`),
  create: (data) => request("/vendor", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/vendor/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/vendor/${id}`, { method: "DELETE" }),
};

// ── Customer API  (Feature 6, 8, 10) ──────────────────────────────────────────
export const customerApi = {
  getAll: () => request("/customer"),
  getById: (id) => request(`/customer/${id}`),
  register: (data) => request("/customer", { method: "POST", body: JSON.stringify(data) }),
  search: (q) => request(`/customer/search?q=${encodeURIComponent(q)}`),
};
