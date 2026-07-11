const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function getToken() {
  return localStorage.getItem("welserve_token") || "";
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = options.token ?? getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 60000;
  const timeoutId = setTimeout(() => controller.abort(new DOMException("Request timed out", "AbortError")), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out. The server is taking too long to respond.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}

// Multipart request (for file uploads)
async function requestForm(path, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new DOMException("Request timed out", "AbortError")), 60000);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out. The server is taking too long to respond.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────
  login: (username, password, email) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: username || email, password, email }),
      token: "",
    }),
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload), token: "" }),
  me: () => request("/auth/me"),

  // ── Admin: Tickets ────────────────────────────────────────────
  tickets: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/tickets?${search.toString()}`);
  },
  nextTicketId: () => request("/tickets/next-id"),
  ticket: (id) => request(`/tickets/${id}`),
  createTicket: (payload) => request("/tickets", { method: "POST", body: JSON.stringify(payload) }),
  updateTicket: (id, payload) => request(`/tickets/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTicket: (id) => request(`/tickets/${id}`, { method: "DELETE" }),
  ticketComments: (id) => request(`/tickets/${id}/comments`),
  addComment: (id, body) =>
    request(`/tickets/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
  ticketPdfUrl: (id) => `${API_BASE}/tickets/${id}/pdf`,
  ticketAttachmentUrl: (id) => `${API_BASE}/tickets/${id}/attachment?token=${encodeURIComponent(getToken())}`,

  // Admin: Status + Comment (with email triggers)
  updateTicketStatus: (id, status, note) =>
    request(`/admin/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) }),
  addAdminComment: (id, body) =>
    request(`/admin/tickets/${id}/comment`, { method: "POST", body: JSON.stringify({ body }) }),

  // Admin: Resolve ticket (updates status + sends resolution email)
  resolveTicket: (id, payload) =>
    request(`/tickets/${id}/resolve`, { method: "PUT", body: JSON.stringify(payload) }),


  // ── User Portal: Tickets ──────────────────────────────────────
  userTickets: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/user/tickets?${search.toString()}`);
  },
  userDashboard: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/user/dashboard?${search.toString()}`);
  },
  userTicket: (id) => request(`/user/tickets/${id}`),
  createUserTicket: (formData) => requestForm("/user/tickets", formData),
  addUserComment: (id, body) =>
    request(`/user/tickets/${id}/comment`, { method: "POST", body: JSON.stringify({ body }) }),

  // ── Users (admin) ─────────────────────────────────────────────
  users: (search = "") =>
    request(`/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createUser: (payload) => request("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

  // ── IT Staff Portal ───────────────────────────────────────────
  staffMembers: () => request("/staff/members"),
  staffTickets: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/staff/tickets?${search.toString()}`);
  },
  staffTicket: (id) => request(`/staff/tickets/${id}`),
  staffResolvedHistory: () => request("/staff/resolved-history"),
  staffReports: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/staff/reports?${search.toString()}`);
  },
  resolveStaffTicket: (id, payload) =>
    request(`/staff/tickets/${id}/resolve`, { method: "PUT", body: JSON.stringify(payload) }),
  updateStaffTicketStatus: (id, payload) =>
    request(`/staff/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  transferStaffTicket: (id, payload) =>
    request(`/staff/tickets/${id}/transfer`, { method: "POST", body: JSON.stringify(payload) }),
  addStaffComment: (id, body) =>
    request(`/staff/tickets/${id}/comment`, { method: "POST", body: JSON.stringify({ body }) }),

  // ── Reports ───────────────────────────────────────────────────
  reportSummary: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/reports/summary?${search.toString()}`);
  },
  reportAgeing: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/reports/ageing?${search.toString()}`);
  },
  reportDetail: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/reports/detail?${search.toString()}`);
  },
  reportExport: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return request(`/reports/export?${search.toString()}`);
  },
};

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearToken() {
  localStorage.removeItem("welserve_token");
}

export function setToken(token) {
  localStorage.setItem("welserve_token", token);
}
