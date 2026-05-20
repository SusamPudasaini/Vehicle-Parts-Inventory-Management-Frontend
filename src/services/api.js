const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL. Set it in frontend/.env.");
}

// ── Generic fetch helper ───────────────────────────────────────────────────────
async function request(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers }
    : { "Content-Type": "application/json", ...options.headers };

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (res.status === 204) return null; // No Content

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || `Request failed with status ${res.status}`;
    const storedUser = sessionStorage.getItem("vp_user");
    const role = storedUser ? (() => {
      try {
        return JSON.parse(storedUser)?.role;
      } catch {
        return null;
      }
    })() : null;

    const isAuthError = (res.status === 401 || res.status === 403) && /log\s?in|logged\s?in/i.test(msg);

    if (role && role !== "Customer" && isAuthError) {
      return null;
    }

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

// ── Parts API  (Feature 3) ─────────────────────────────────────────────────────
export const partApi = {
  getAll: () => request("/part"),
  getById: (id) => request(`/part/${id}`),
  create: (data) => request("/part", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/part/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/part/${id}`, { method: "DELETE" }),
};

// ── Customer API  (Feature 6, 8, 10) ──────────────────────────────────────────
export const customerApi = {
  getAll: () => request("/customer"),
  getById: (id) => request(`/customer/${id}`),
  register: (data) => request("/customer", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/customer/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/customer/${id}`, { method: "DELETE" }),
  search: (q) => request(`/customer/search?q=${encodeURIComponent(q)}`),
};

// ── Appointments / Requests / Reviews ─────────────────────────────────────────
export const appointmentApi = {
  getByCustomer: (customerId) => request(`/appointments/customer/${customerId}`),
  create: (data) => request("/appointments", { method: "POST", body: JSON.stringify(data) }),
  getAll: () => request("/appointments"),
  updateStatus: (id, status) => request(`/appointments/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  reschedule: (id, appointmentDateTime) => request(`/appointments/${id}/schedule`, { method: "PUT", body: JSON.stringify({ appointmentDateTime }) }),
};

export const customerPartsApi = {
  getCatalog: () => request("/customer-parts"),
  getOrders: () => request("/customer-parts/orders"),
  checkout: (items) => request("/customer-parts/checkout", { method: "POST", body: JSON.stringify({ items }) }),
};

export const customerPartOrdersApi = {
  getAll: () => request("/customer-part-orders"),
  approve: (id, staffNotes) => request(`/customer-part-orders/${id}/approve`, { method: "PUT", body: JSON.stringify({ staffNotes }) }),
  reject: (id, staffNotes) => request(`/customer-part-orders/${id}/reject`, { method: "PUT", body: JSON.stringify({ staffNotes }) }),
};

export const partRequestApi = {
  getMine: () => request("/part-requests/customer"),
  create: (data) => request("/part-requests", { method: "POST", body: JSON.stringify(data) }),
  getAll: () => request("/part-requests"),
  updateStatus: (id, status) => request(`/part-requests/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
};

export const reviewApi = {
  getAll: () => request("/reviews"),
  getByCustomer: (customerId) => request(`/reviews/customer/${customerId}`),
  create: (data) => request("/reviews", { method: "POST", body: JSON.stringify(data) }),
};

export const customerReviewApi = {
  getMine: () => request("/customer-profile/reviews"),
  getReviewable: () => request("/customer-profile/reviewable-services"),
  create: (data) => request("/customer-profile/reviews", { method: "POST", body: JSON.stringify(data) }),
};

export const customerProfileApi = {
  getProfile: () => request("/customer-profile/profile"),
  getVehicles: () => request("/customer-profile/vehicles"),
  updateProfile: (data) => request("/customer-profile/profile", { method: "PUT", body: JSON.stringify(data) }),
  addVehicle: (data) => request("/customer-profile/vehicles", { method: "POST", body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/customer-profile/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVehicle: (id) => request(`/customer-profile/vehicles/${id}`, { method: "DELETE" }),
  getPurchaseHistory: () => request("/customer-profile/purchase-history"),
  getServiceHistory: () => request("/customer-profile/service-history"),
  getInvoices: () => request("/customer-profile/invoices"),
  getUnpaidInvoices: () => request("/customer-profile/unpaid-invoices"),
};

export const customerInvoiceApi = {
  getAll: (unpaidOnly = false) => request(`/customer-invoices${unpaidOnly ? "?unpaidOnly=true" : ""}`),
  getByCustomer: (customerId) => request(`/customer-invoices/customer/${customerId}`),
  submitPayment: (invoiceId, formData) =>
    request(`/customer-invoices/${invoiceId}/submit-payment`, {
      method: "POST",
      body: formData,
    }),
  markPaid: (invoiceId) => request(`/customer-invoices/${invoiceId}/mark-paid`, { method: "PUT" }),
  completeService: (appointmentId, data) =>
    request(`/customer-invoices/appointments/${appointmentId}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendReminders: () => request("/customer-invoices/send-overdue-reminders", { method: "POST" }),
};

export const customerReportsApi = {
  get: () => request("/customer-reports"),
};
