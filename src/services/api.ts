// ─── REST API Client ───────────────────────────────
// Communicates with the Tuneup game server on the VPS.

import type { User } from '../types';

// VPS server URL
const BASE_URL = 'https://89-167-6-79.sslip.io/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = json.detail || json.message || text;
    } catch {}
    throw new Error(`API ${res.status}: ${detail}`);
  }

  return res.json();
}

// ─── API Response Shapes ───────────────────────────

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    games_played: number;
    games_won: number;
    total_score: number;
    created_at: string;
  };
}

interface RoomResponse {
  id: string;
  code: string;
  host_id: string;
  mode: string;
  music_source: string;
  total_rounds: number;
  guess_time: number;
  status: string;
  players: {
    id: string;
    username: string;
    display_name: string;
    score: number;
    is_host: boolean;
    status: string;
  }[];
  created_at: string;
}

// ─── API Methods ───────────────────────────────────

export const api = {
  // ─── Auth ───────────────────────────────────
  register: (
    username: string,
    displayName: string,
    password: string
  ): Promise<{ token: string; user: User }> =>
    request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        display_name: displayName,
        password,
      }),
    }).then((res) => ({
      token: res.access_token,
      user: {
        id: res.user.id,
        username: res.user.username,
        displayName: res.user.display_name,
        avatarUrl: res.user.avatar_url || undefined,
      },
    })),

  login: (username: string, password: string): Promise<{ token: string; user: User }> =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }).then((res) => ({
      token: res.access_token,
      user: {
        id: res.user.id,
        username: res.user.username,
        displayName: res.user.display_name,
        avatarUrl: res.user.avatar_url || undefined,
      },
    })),

  // ─── Rooms ──────────────────────────────────
  createRoom: (
    token: string,
    data: { mode?: string; music_source?: string; total_rounds?: number; guess_time?: number }
  ): Promise<RoomResponse> =>
    request<RoomResponse>('/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getRoom: (code: string): Promise<RoomResponse> =>
    request<RoomResponse>(`/rooms/${code}`),

  joinRoom: (token: string, code: string): Promise<RoomResponse> =>
    request<RoomResponse>('/rooms/join', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    }),

  leaveRoom: (token: string, code: string): Promise<{ status: string }> =>
    request<{ status: string }>(`/rooms/${code}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ─── Profile ─────────────────────────────────
  getProfile: (token: string) =>
    request('/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default api;
