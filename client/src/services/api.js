// Prefer VITE_API_URL; in local Vite use localhost so new routes (e.g. candidates) work
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  // (import.meta.env.DEV
  //   ? "http://localhost:5000/api"
  //   : "https://home-expense-tracker-one.vercel.app/api");
  "https://home-expense-tracker-one.vercel.app/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Read token from localStorage
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    let data = {};
    if (contentType.includes("application/json") && raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error("Invalid JSON response from server");
      }
    } else if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
      throw new Error(
        `API route not found (${endpoint}). Is the server running and up to date?`
      );
    } else if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(raw.slice(0, 120) || "Unexpected server response");
      }
    }

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMe: () => request("/auth/me"),

  // Providers
  getProviders: (status) =>
    request(`/providers${status ? `?status=${status}` : ""}`),
  getProviderById: (id) => request(`/providers/${id}`),
  createProvider: (payload) =>
    request("/providers", { method: "POST", body: JSON.stringify(payload) }),
  updateProvider: (id, payload) =>
    request(`/providers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProvider: (id) => request(`/providers/${id}`, { method: "DELETE" }),

  // Daily Logs
  getDailyLogs: (providerId, month) =>
    request(
      `/daily-logs?providerId=${providerId}${month ? `&month=${month}` : ""}`
    ),
  upsertDailyLog: (payload) =>
    request("/daily-logs", { method: "POST", body: JSON.stringify(payload) }),
  bulkUpsertDailyLogs: (payload) =>
    request("/daily-logs/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteDailyLog: (id) => request(`/daily-logs/${id}`, { method: "DELETE" }),

  // Payments / Advances
  getPayments: (providerId, month) => {
    const params = new URLSearchParams();
    if (providerId) params.append("providerId", providerId);
    if (month) params.append("month", month);
    return request(`/payments?${params.toString()}`);
  },
  recordPayment: (payload) =>
    request("/payments", { method: "POST", body: JSON.stringify(payload) }),
  updatePayment: (id, payload) =>
    request(`/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePayment: (id) => request(`/payments/${id}`, { method: "DELETE" }),

  // Billing
  getDashboardOverview: (month) => request(`/billing/overview?month=${month}`),
  getProviderMonthlySummary: (providerId, month) =>
    request(`/billing/summary/${providerId}?month=${month}`),

  // Candidates
  getCandidates: (status, category) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    const qs = params.toString();
    return request(`/candidates${qs ? `?${qs}` : ""}`);
  },
  getCandidateById: (id) => request(`/candidates/${id}`),
};
