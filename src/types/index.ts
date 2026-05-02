// ─── User & Auth ───────────────────────────────────

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface MusicAuth {
  provider: 'youtube' | 'spotify' | 'apple_music';
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// ─── Room & Game ───────────────────────────────────

export type GameStatus = 'idle' | 'lobby' | 'playing' | 'round_end' | 'finished';

export type GameMode = 'classic_rush' | 'lyric_clues' | 'speed_round';

export type PlayerStatus = 'ready' | 'not_ready' | 'guessed';

export interface Player {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  status: PlayerStatus;
  isHost: boolean;
  joinedAt: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  status: GameStatus;
  mode: GameMode;
  settings: GameSettings;
  currentRound: number;
  totalRounds: number;
  createdAt: number;
}

export interface GameSettings {
  rounds: number;
  guessTime: number;          // seconds per round
  pointsPerCorrect: number;
  bonusPoints: number;        // bonus for fastest guess
  source: MusicSource;
}

export type MusicSource = 'youtube' | 'spotify';

// ─── Round / Song ──────────────────────────────────

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;           // seconds
  // Source-specific identifiers
  youtubeId?: string;
  spotifyId?: string;
}

export interface Round {
  id: string;
  roundNumber: number;
  song: Song;
  startTime: number;          // server timestamp
  endTime: number;
  clipDuration: number;       // how much of the song plays before reveal
  status: 'pending' | 'active' | 'answered' | 'timeout';
  answers: Answer[];
}

export interface Answer {
  playerId: string;
  guess: string;
  isCorrect: boolean;
  timestamp: number;
  timeMs: number;             // ms since round start
  pointsAwarded: number;
}

// ─── WebSocket Events ──────────────────────────────

export type ClientEvent =
  | { type: 'join_room'; code: string; username: string }
  | { type: 'create_room'; username: string; mode: GameMode; settings: Partial<GameSettings> }
  | { type: 'start_game' }
  | { type: 'submit_guess'; guess: string }
  | { type: 'player_ready' }
  | { type: 'next_round' }
  | { type: 'leave_room' };

export type ServerEvent =
  | { type: 'room_joined'; room: Room; player: Player }
  | { type: 'room_created'; room: Room; player: Player }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; playerId: string }
  | { type: 'game_starting'; countdown: number }
  | { type: 'round_start'; round: Round }
  | { type: 'round_end'; round: Round }
  | { type: 'answer_result'; answer: Answer; correctSong?: Song }
  | { type: 'game_over'; players: Player[]; winner: Player }
  | { type: 'error'; message: string; code: string };

// ─── Navigation ────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  CreateRoom: undefined;
  JoinRoom: undefined;
  Lobby: { roomId: string; code: string };
  Game: { roomId: string };
  Results: { roomId: string };
};
