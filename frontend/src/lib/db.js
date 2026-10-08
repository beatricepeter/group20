// ============================================================
// src/lib/db.js
// Talks to the real Spring Boot backend. Only the login session is kept in
// localStorage; application data always comes from the backend.
// ============================================================

const KEYS = {
  SESSION: "egaz_session",
  TOKEN: "egaz_token",
};

// Base API URL (Vite env or default). Must point at the Spring Boot
// server's root + /api (default port 8080, no context-path).
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(KEYS.TOKEN);
  const headers = { ...(options.headers || {}) };

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // 204 No Content (DELETE) has no body to parse
  if (res.status === 204) {
    if (!res.ok) {
      const error = new Error('Request failed');
      error.status = res.status;
      throw error;
    }
    return null;
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || 'Request failed' };
  }

  if (!res.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function safeFetch(path, opts = {}) {
  return apiRequest(path, opts);
}

export { API_BASE, safeFetch, apiRequest };

// ---- USERS ----
// GET /api/users, GET /api/users/{id}, POST /api/users,
// PUT /api/users/{id}, DELETE /api/users/{id}

export async function refreshUsers() {
  const serverUsers = await apiRequest('/users');
  return Array.isArray(serverUsers) ? serverUsers : [];
}

export async function refreshUser(id) {
  return apiRequest(`/users/${encodeURIComponent(id)}`);
}

export async function createUser(payload) {
  const created = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return created;
}

export async function updateUser(id, payload) {
  const updated = await apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return updated;
}

export async function deleteUser(id) {
  await apiRequest(`/users/${id}`, { method: 'DELETE' });
}

// ---- EXPERTS ----
// GET /api/experts, POST /api/experts, PUT /api/experts/{id}, DELETE /api/experts/{id}

export async function refreshExperts() {
  const serverExperts = await apiRequest('/experts');
  return Array.isArray(serverExperts) ? serverExperts : [];
}

export async function refreshExpert(id) {
  return apiRequest(`/experts/${encodeURIComponent(id)}`);
}

export async function createExpert(payload) {
  const created = await apiRequest('/experts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return created;
}

export async function updateExpert(id, payload) {
  const updated = await apiRequest(`/experts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return updated;
}

export async function deleteExpert(id) {
  await apiRequest(`/experts/${id}`, { method: 'DELETE' });
}

// ---- VISITORS ----
// GET /api/visitors, POST /api/visitors, PUT /api/visitors/{id},
// PATCH /api/visitors/{id}/checkout, DELETE /api/visitors/{id}

export async function refreshVisitors() {
  const serverVisitors = await apiRequest('/visitors');
  return Array.isArray(serverVisitors) ? serverVisitors : [];
}

export async function findVisitorByIdentity(idNumber) {
  return apiRequest(`/visitors/lookup?idNumber=${encodeURIComponent(idNumber)}`);
}

export async function createVisitor(payload) {
  // Don't send checkInDate/id from the client — the backend fills
  // checkInDate with LocalDateTime.now() and generates its own id.
  const body = { ...payload };
  delete body.id;
  delete body.checkInDate;
  delete body.checkOutDate;
  const created = await apiRequest('/visitors', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return created;
}

export async function updateVisitor(id, payload) {
  const updated = await apiRequest(`/visitors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return updated;
}

export async function checkoutVisitor(id, reference) {
  const updated = await apiRequest(`/visitors/${id}/checkout`, {
    method: 'PATCH',
    body: JSON.stringify({ reference }),
  });
  return updated;
}

export async function deleteVisitor(id) {
  await apiRequest(`/visitors/${id}`, { method: 'DELETE' });
}

// ---- SYSTEM SETTINGS ----

export async function getSystemSettings() {
  return apiRequest('/settings');
}

export async function updateSystemSettings(settings) {
  return apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ---- APPOINTMENTS ----

export async function refreshAppointments() {
  const appointments = await apiRequest('/appointments');
  return Array.isArray(appointments) ? appointments : [];
}

export async function createAppointment(payload) {
  return apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---- SESSION (who is currently logged in — persists across refresh) ----
export function getSession() {
  try {
    const raw = localStorage.getItem(KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setSession(user) {
  if (user) localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  else localStorage.removeItem(KEYS.SESSION);
}

export { KEYS };
