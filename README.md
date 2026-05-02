# 🎵 Tuneup

**Guess the song. Beat the room.**

Real-time multiplayer music guessing game. Players join live sessions, listen to music played through the host's device, and race to guess the song.

## How it Works

1. **Host** creates a room, picks game mode & music source (YouTube/Spotify)
2. **Guests** join with a 6-character room code — no account needed
3. **Host plays music** through their device (they authenticate with YouTube/Spotify)
4. **Everyone guesses** on their phones — fastest correct answer wins

## Tech Stack

- **Frontend:** React Native (Expo) — iOS + Android
- **Backend:** FastAPI (Python) — WebSocket game server
- **State:** Zustand
- **Auth:** OAuth (YouTube, Spotify, Apple Music)
- **Real-time:** WebSockets

## Getting Started

```bash
# Install dependencies
npm install

# Start dev
npx expo start
```

## Building APK (EAS Build)

1. Create a free Expo account at [expo.dev](https://expo.dev/signup)
2. Login:
   ```bash
   npx eas login
   ```
3. Init the project:
   ```bash
   npx eas init
   ```
4. Build:
   ```bash
   npx eas build --platform android --profile preview
   ```

## Structure

```
tuneup/
├── src/
│   ├── screens/         # App screens
│   │   ├── HomeScreen
│   │   ├── CreateRoomScreen
│   │   ├── JoinRoomScreen
│   │   ├── LobbyScreen
│   │   ├── GameScreen
│   │   └── ResultsScreen
│   ├── components/      # Reusable UI components
│   ├── services/        # API + WebSocket clients
│   ├── game/            # Game engine logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utilities
│   └── navigation/      # Navigation setup
└── App.tsx
```

## Game Modes

- **Classic Rush** — Guess from the intro, faster = more points
- **Lyric Clues** — Lyrics revealed one line at a time
- **Speed Round** — 0.5-second snippets only

## Phase Plan

| Phase | What |
|---|---|
| Phase 0 | ✅ Scaffold, navigation, screens (completed) |
| Phase 1 | 🔜 Backend server, WebSocket game loop, room system |
| Phase 2 | 🔜 YouTube integration, Spotify, lyric mode |
| Phase 3 | 🔜 Matchmaking, leaderboards, Apple Music |
