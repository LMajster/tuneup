// ─── Zustand Global Store ──────────────────────────
// Manages auth, game state, and WebSocket connection
// for the Tuneup app.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import type { User, Player, Room, GameStatus, GameMode } from '../types';

// ─── State Shape ───────────────────────────────────

export interface GameState {
  // Auth
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // Room
  roomId: string | null;
  roomCode: string | null;
  players: Player[];
  isHost: boolean;
  mode: GameMode;
  totalRounds: number;
  currentRound: number;
  gameStatus: GameStatus;

  // Last game stats (for results screen)
  lastGameResults: {
    winner: { id: string; displayName: string; score: number } | null;
    rankings: { id: string; displayName: string; score: number; rank: number }[];
  } | null;

  // Loading / error
  loading: boolean;
  error: string | null;

  // ─── Actions ────────────────────────────────

  // Auth
  setAuth: (token: string, user: User) => Promise<void>;
  restoreAuth: () => Promise<boolean>;
  logout: () => Promise<void>;

  // Room
  setRoom: (room: Partial<Room> & { players: Player[] }) => void;
  clearRoom: () => void;

  // Players
  updatePlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerScore: (playerId: string, score: number) => void;

  // Game
  setGameStatus: (status: GameStatus) => void;
  setCurrentRound: (round: number) => void;
  setLastGameResults: (results: GameState['lastGameResults']) => void;

  // UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Display name (stored separately)
  displayName: string;
  setDisplayName: (name: string) => void;
}

// ─── Store ─────────────────────────────────────────

const TOKEN_KEY = '@tuneup_token';
const USER_KEY = '@tuneup_user';
const DISPLAY_NAME_KEY = '@tuneup_display_name';

export const useStore = create<GameState>((set, get) => ({
  // ─── Initial state ──────────────────────────
  token: null,
  user: null,
  isAuthenticated: false,

  roomId: null,
  roomCode: null,
  players: [],
  isHost: false,
  mode: 'classic_rush',
  totalRounds: 10,
  currentRound: 0,
  gameStatus: 'idle',
  lastGameResults: null,

  loading: false,
  error: null,
  displayName: '',

  // ─── Auth Actions ───────────────────────────

  setAuth: async (token: string, user: User) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true, error: null });
  },

  restoreAuth: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);
      const name = await AsyncStorage.getItem(DISPLAY_NAME_KEY);
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, displayName: name || '' });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      roomId: null,
      roomCode: null,
      players: [],
      gameStatus: 'idle',
    });
  },

  // ─── Room Actions ───────────────────────────

  setRoom: (roomData) => {
    set({
      roomId: roomData.id || null,
      roomCode: roomData.code || null,
      players: roomData.players || [],
      isHost: roomData.hostId === get().user?.id || false,
      mode: roomData.mode || 'classic_rush',
      totalRounds: roomData.totalRounds || 10,
      currentRound: roomData.currentRound || 0,
      gameStatus: roomData.status || 'lobby',
      loading: false,
    });
  },

  clearRoom: () => {
    set({
      roomId: null,
      roomCode: null,
      players: [],
      isHost: false,
      gameStatus: 'idle',
      currentRound: 0,
      lastGameResults: null,
    });
  },

  updatePlayers: (players) => set({ players }),
  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players.filter((p) => p.id !== player.id), player],
    })),
  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),
  updatePlayerScore: (playerId, score) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, score } : p
      ),
    })),

  // ─── Game Actions ───────────────────────────

  setGameStatus: (status) => set({ gameStatus: status }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setLastGameResults: (results) => set({ lastGameResults: results }),

  // ─── UI Actions ─────────────────────────────

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setDisplayName: async (name) => {
    await AsyncStorage.setItem(DISPLAY_NAME_KEY, name);
    set({ displayName: name });
  },
}));

// ─── Convenience helper for register-or-login ──────
// Tries to register. If username taken, logs in instead.
// Convention: password = displayName.toLowerCase() + "!tuneup"

export async function registerOrLogin(
  displayName: string
): Promise<{ token: string; user: User }> {
  const username = displayName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 20);
  const password = displayName.toLowerCase() + '!tuneup';

  // Try register first
  try {
    return await api.register(username, displayName, password);
  } catch (err: any) {
    if (err.message?.includes('409') || err.message?.includes('already taken')) {
      // Username taken — try login
      return await api.login(username, password);
    }
    throw err;
  }
}

export default useStore;
