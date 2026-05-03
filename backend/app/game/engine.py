"""
Game engine — state machine for real-time game rounds.

Manages: round lifecycle, guess validation, scoring, and broadcasting.
Uses in-memory state tied to a database room.
"""

import asyncio
import logging
import random
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Room, RoomPlayer, Round as RoundModel, Game, User
from app.schemas import PlayerResponse
from app.game.scoring import calculate_points, rank_players
from app.game.modes import get_mode_config
from app.websocket.manager import ConnectionManager

logger = logging.getLogger("tuneup.engine")


# Pool of mock songs for development
MOCK_SONGS: list[dict] = [
    {"title": "Blinding Lights", "artist": "The Weeknd", "youtube_id": "fHI8X4OXluQ"},
    {"title": "Shape of You", "artist": "Ed Sheeran", "youtube_id": "JGwWNGJdvx8"},
    {"title": "Bohemian Rhapsody", "artist": "Queen", "youtube_id": "fJ9rUzIMcZQ"},
    {"title": "Billie Jean", "artist": "Michael Jackson", "youtube_id": "Zi_XLOBDo_Y"},
    {"title": "Smells Like Teen Spirit", "artist": "Nirvana", "youtube_id": "hTWKbfoikeg"},
    {"title": "Hotel California", "artist": "Eagles", "youtube_id": "EqPtz5qN7HM"},
    {"title": "Stairway to Heaven", "artist": "Led Zeppelin", "youtube_id": "QkF3oxziUI4"},
    {"title": "Yesterday", "artist": "The Beatles", "youtube_id": "wXTJBrZB9pQ"},
    {"title": "Rolling in the Deep", "artist": "Adele", "youtube_id": "rYEDA3JcQqw"},
    {"title": "Uptown Funk", "artist": "Mark Ronson ft. Bruno Mars", "youtube_id": "OPf0YbXqDm0"},
    {"title": "Hey Jude", "artist": "The Beatles", "youtube_id": "A_MjCqQoLLA"},
    {"title": "Lose Yourself", "artist": "Eminem", "youtube_id": "xTFU3Y3rI7E"},
    {"title": "Sweet Child O Mine", "artist": "Guns N' Roses", "youtube_id": "1w7OgIMMRc4"},
    {"title": "Imagine", "artist": "John Lennon", "youtube_id": "YkgkThdzX-8"},
    {"title": "Thriller", "artist": "Michael Jackson", "youtube_id": "sOnqjkJTMaA"},
    {"title": "Back in Black", "artist": "AC/DC", "youtube_id": "pAgnJDJN4VA"},
    {"title": "Piano Man", "artist": "Billy Joel", "youtube_id": "gxEPV4kolz0"},
    {"title": "Wannabe", "artist": "Spice Girls", "youtube_id": "gJLIiF15wjQ"},
    {"title": "Wonderwall", "artist": "Oasis", "youtube_id": "hp1dbWsmjjo"},
    {"title": "Take On Me", "artist": "a-ha", "youtube_id": "djV11Xbc914"},
]


class GameEngine:
    """Manages the game state for one room."""

    def __init__(self, room_id: str, db: Session, ws_manager: ConnectionManager):
        self.room_id = room_id
        self.db = db
        self.ws = ws_manager
        self._round_task: Optional[asyncio.Task] = None
        self._current_round_number = 0
        self._used_songs: set[int] = set()

    # ─── Room helpers ──────────────────────────────

    def _get_room(self) -> Optional[Room]:
        return self.db.query(Room).filter(Room.id == self.room_id).first()

    def _get_players(self) -> list[RoomPlayer]:
        room = self._get_room()
        if not room:
            return []
        return (
            self.db.query(RoomPlayer)
            .filter(RoomPlayer.room_id == self.room_id)
            .all()
        )

    def _get_scores(self) -> dict[str, int]:
        return {rp.user_id: rp.score for rp in self._get_players()}

    def _broadcast_state(self):
        """Send current room state to all players."""
        room = self._get_room()
        if not room:
            return
        players = self._get_players()
        player_list = [
            PlayerResponse(
                id=rp.user_id,
                username=rp.user.username if rp.user else rp.user_id,
                display_name=rp.user.display_name if rp.user else rp.user_id,
                score=rp.score,
                is_host=rp.is_host,
                status=rp.status,
            ).model_dump()
            for rp in players
        ]

        asyncio.ensure_future(
            self.ws.broadcast(self.room_id, {
                "type": "room_state",
                "room_id": self.room_id,
                "status": room.status,
                "mode": room.mode,
                "current_round": self._current_round_number,
                "total_rounds": room.total_rounds,
                "players": player_list,
            })
        )

    # ─── Event handlers ────────────────────────────

    async def start_game(self, player_id: str, data: dict):
        """Host starts the game."""
        room = self._get_room()
        if not room or room.host_id != player_id:
            await self.ws.send_to(player_id, self.room_id, {
                "type": "error", "message": "Only the host can start the game"
            })
            return

        if room.status != "lobby":
            await self.ws.send_to(player_id, self.room_id, {
                "type": "error", "message": "Game already started"
            })
            return

        # Mark all players as ready
        for rp in self._get_players():
            rp.status = "ready"

        room.status = "playing"
        self.db.commit()

        # Create game record
        game = Game(
            room_id=self.room_id,
            host_id=room.host_id,
            mode=room.mode,
            music_source=room.music_source,
            total_rounds=room.total_rounds,
            status="playing",
            player_count=len(self._get_players()),
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(game)
        self.db.commit()

        await self.ws.broadcast(self.room_id, {
            "type": "game_starting",
            "countdown": 3,
        })

        # Countdown then start first round
        await asyncio.sleep(3)
        self._current_round_number = 0
        await self._start_new_round()

    async def player_ready(self, player_id: str, data: dict):
        """Player marks themselves as ready."""
        rp = self.db.query(RoomPlayer).filter(
            RoomPlayer.room_id == self.room_id,
            RoomPlayer.user_id == player_id,
        ).first()
        if rp:
            rp.status = "ready"
            self.db.commit()
            self._broadcast_state()

    async def submit_guess(self, player_id: str, data: dict):
        """Player submits a guess for the current round."""
        guess = data.get("guess", "").strip().lower()
        if not guess:
            return

        room = self._get_room()
        if not room or room.status != "playing":
            return

        # Find the active round
        round_record = (
            self.db.query(RoundModel)
            .filter(
                RoundModel.room_id == self.room_id,
                RoundModel.status == "active",
            )
            .first()
        )
        if not round_record:
            return

        # Check if already answered
        for ans in (round_record.answers or []):
            if ans.get("player_id") == player_id:
                await self.ws.send_to(player_id, self.room_id, {
                    "type": "error", "message": "Already answered this round"
                })
                return

        # Check answer (simple title match)
        title = (round_record.song_title or "").lower()
        is_correct = guess == title or guess in title or title in guess

        time_ms = None
        if round_record.started_at:
            elapsed = datetime.now(timezone.utc) - round_record.started_at.replace(tzinfo=timezone.utc)
            time_ms = int(elapsed.total_seconds() * 1000)

        points = 0
        if is_correct:
            round_duration_ms = (room.guess_time or 30) * 1000
            remaining = max(0, round_duration_ms - (time_ms or 0))
            points = calculate_points(remaining, round_duration_ms)

            # Update score
            rp = self.db.query(RoomPlayer).filter(
                RoomPlayer.room_id == self.room_id,
                RoomPlayer.user_id == player_id,
            ).first()
            if rp:
                rp.score += points

        # Record answer
        answer = {
            "player_id": player_id,
            "guess": data.get("guess", ""),
            "is_correct": is_correct,
            "time_ms": time_ms,
            "points_awarded": points,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if not round_record.answers:
            round_record.answers = []
        round_record.answers.append(answer)
        self.db.commit()

        # Send result to player
        await self.ws.send_to(player_id, self.room_id, {
            "type": "answer_result",
            "correct": is_correct,
            "points": points,
            "time_ms": time_ms,
        })

        # Broadcast guess (with correct status hidden from others)
        await self.ws.broadcast(self.room_id, {
            "type": "player_guessed",
            "player_id": player_id,
            "guessed": True,
        }, exclude=player_id)

        # If all players answered, end round early
        total = len(self._get_players())
        answered = len(round_record.answers or [])
        if answered >= total:
            await self._end_round(round_record)

    async def next_round(self, player_id: str, data: dict):
        """Host triggers next round."""
        room = self._get_room()
        if not room or room.host_id != player_id:
            return
        await self._start_new_round()

    async def skip_song(self, player_id: str, data: dict):
        """Host skips the current song."""
        room = self._get_room()
        if not room or room.host_id != player_id:
            return

        round_record = self.db.query(RoundModel).filter(
            RoundModel.room_id == self.room_id,
            RoundModel.status == "active",
        ).first()

        if round_record:
            await self._end_round(round_record)

    # ─── Round management ──────────────────────────

    async def _start_new_round(self):
        """Start a new round."""
        room = self._get_room()
        if not room:
            return

        self._current_round_number += 1

        if self._current_round_number > room.total_rounds:
            await self._end_game()
            return

        # Pick a song (avoid repeats)
        available = [i for i in range(len(MOCK_SONGS)) if i not in self._used_songs]
        if not available:
            self._used_songs.clear()
            available = list(range(len(MOCK_SONGS)))

        idx = random.choice(available)
        self._used_songs.add(idx)
        song = MOCK_SONGS[idx]

        mode_config = get_mode_config(room.mode)
        clip_duration = mode_config.clip_duration

        round_record = RoundModel(
            room_id=self.room_id,
            round_number=self._current_round_number,
            song_title=song["title"],
            song_artist=song["artist"],
            youtube_id=song.get("youtube_id"),
            clip_duration=clip_duration,
            status="active",
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(round_record)
        self.db.commit()

        await self.ws.broadcast(self.room_id, {
            "type": "round_start",
            "round_number": self._current_round_number,
            "total_rounds": room.total_rounds,
            "clip_duration": clip_duration,
            "guess_time": room.guess_time,
            "youtube_id": song.get("youtube_id"),
            "mode": room.mode,
        })

        self._broadcast_state()

        # Schedule auto-end after guess time
        self._round_task = asyncio.ensure_future(
            self._auto_end_round(round_record.id, room.guess_time or 30)
        )

    async def _auto_end_round(self, round_id: str, delay: int):
        """End the round after the guess timer expires."""
        await asyncio.sleep(delay)
        round_record = self.db.query(RoundModel).filter(
            RoundModel.id == round_id,
            RoundModel.status == "active",
        ).first()
        if round_record:
            await self._end_round(round_record)

    async def _end_round(self, round_record: RoundModel):
        """End the current round and show results."""
        # Cancel auto-end timer
        if self._round_task and not self._round_task.done():
            self._round_task.cancel()

        round_record.status = "answered"
        round_record.ended_at = datetime.now(timezone.utc)
        self.db.commit()

        # Collect correct answers
        correct_answers = [
            a for a in (round_record.answers or [])
            if a.get("is_correct")
        ]

        # Get current scores
        scores = self._get_scores()
        rankings = rank_players(scores)

        await self.ws.broadcast(self.room_id, {
            "type": "round_end",
            "round_number": round_record.round_number,
            "song": {
                "title": round_record.song_title,
                "artist": round_record.song_artist,
                "youtube_id": round_record.youtube_id,
            },
            "correct_count": len(correct_answers),
            "rankings": [
                {"player_id": pid, "score": sc, "rank": rk}
                for pid, sc, rk in rankings
            ],
        })

        self._broadcast_state()

    async def _end_game(self):
        """End the game and save results."""
        room = self._get_room()
        if not room:
            return

        room.status = "finished"
        scores = self._get_scores()
        rankings = rank_players(scores)
        winner_id = rankings[0][0] if rankings else None

        # Update game record
        game = self.db.query(Game).filter(
            Game.room_id == self.room_id,
            Game.status == "playing",
        ).first()
        if game:
            game.status = "finished"
            game.winner_id = winner_id
            game.finished_at = datetime.now(timezone.utc)

        # Update user stats
        for pid, score, _ in rankings:
            user = self.db.query(User).filter(User.id == pid).first()
            if user:
                user.games_played += 1
                user.total_score += score
                if pid == winner_id:
                    user.games_won += 1

        self.db.commit()

        # Build player results
        players_data = []
        for pid, sc, rk in rankings:
            user = self.db.query(User).filter(User.id == pid).first()
            players_data.append({
                "player_id": pid,
                "username": user.username if user else pid,
                "display_name": user.display_name if user else pid,
                "score": sc,
                "rank": rk,
            })

        await self.ws.broadcast(self.room_id, {
            "type": "game_over",
            "winner_id": winner_id,
            "players": players_data,
        })

        self._broadcast_state()
