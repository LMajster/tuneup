// ─── REST API Client ───────────────────────────────
// Communicates with the Tuneup game server

const BASE_URL = 'http://localhost:8000/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API ${res.status}: ${error}`);
  }

  return res.json();
}

export const api = {
  // ─── Auth ───────────────────────────────────
  register: (username: string, password: string) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // ─── Rooms ──────────────────────────────────
  createRoom: (token: string, data: any) =>
    request<{ room: any }>('/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getRoom: (code: string) =>
    request<{ room: any }>(`/rooms/${code}`),

  // ─── Stats ──────────────────────────────────
  getProfile: (token: string) =>
    request<{ user: any }>('/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default api;
