const TOKEN_KEY = 'shift_creat_token';
const USER_KEY = 'shift_creat_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const error = new Error(payload?.error || '通信エラーが発生しました');
    error.status = res.status;
    throw error;
  }
  return payload;
}

export const api = {
  login: (loginId, password, role) => request('/auth/login', { method: 'POST', body: { loginId, password, role } }),
  currentPeriod: () => request('/periods/current'),
  submitPreference: (date, startTime, endTime) =>
    request('/preferences/submit', { method: 'POST', body: { date, startTime, endTime } }),
  generateShift: () => request('/shifts/generate', { method: 'POST' }),
  readjustShift: (periodId) => request('/shifts/readjust', { method: 'POST', body: { periodId } }),
  finalizeShift: (periodId, candidateId) =>
    request('/shifts/finalize', { method: 'POST', body: { periodId, candidateId } }),
  viewShift: () => request('/shifts/view'),
  submitReadjustmentRequest: (date, startTime, endTime, reason) =>
    request('/readjustment-requests/submit', { method: 'POST', body: { date, startTime, endTime, reason } }),
  listReadjustmentRequests: () => request('/readjustment-requests/list'),
  saveDraft: (key, data) => request('/drafts/save', { method: 'POST', body: { key, data } }),
  loadDraft: (key) => request(`/drafts/load?key=${encodeURIComponent(key)}`),
};
