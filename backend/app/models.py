import uuid
import random
import string
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, Float, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_id() -> str:
    return uuid.uuid4().hex[:12]


def generate_room_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


# ─── User ──────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_id)
    username = Column(String(20), unique=True, nullable=False, index=True)
    display_name = Column(String(30), nullable=False)
    password_hash = Column(String(128), nullable=False)
    avatar_url = Column(String(256), nullable=True)
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # OAuth music provider tokens (for host)
    youtube_token = Column(Text, nullable=True)
    spotify_token = Column(Text, nullable=True)
    apple_music_token = Column(Text, nullable=True)

    rooms = relationship("Room", back_populates="host", foreign_keys="Room.host_id")
    games = relationship("Game", foreign_keys="Game.host_id", back_populates="host")


# ─── Room ──────────────────────────────────────────

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, default=generate_id)
    code = Column(String(6), unique=True, nullable=False, index=True, default=generate_room_code)
    host_id = Column(String, ForeignKey("users.id"), nullable=False)
    mode = Column(String(20), default="classic_rush")
    music_source = Column(String(20), default="youtube")
    total_rounds = Column(Integer, default=10)
    guess_time = Column(Integer, default=30)
    status = Column(String(20), default="lobby")  # lobby, playing, finished
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    host = relationship("User", back_populates="rooms")
    players = relationship("RoomPlayer", back_populates="room", cascade="all, delete-orphan")
    rounds = relationship("Round", back_populates="room", cascade="all, delete-orphan")


class RoomPlayer(Base):
    __tablename__ = "room_players"

    id = Column(String, primary_key=True, default=generate_id)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, default=0)
    is_host = Column(Boolean, default=False)
    status = Column(String(20), default="not_ready")
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    room = relationship("Room", back_populates="players")
    user = relationship("User")


# ─── Game (aliased to Room for simplicity) ─────────

class Game(Base):
    """Mirrors Room for game history tracking."""
    __tablename__ = "games"

    id = Column(String, primary_key=True, default=generate_id)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=True)
    host_id = Column(String, ForeignKey("users.id"), nullable=False)
    mode = Column(String(20))
    music_source = Column(String(20))
    total_rounds = Column(Integer, default=10)
    status = Column(String(20), default="finished")
    winner_id = Column(String, nullable=True)
    player_count = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    host = relationship("User", back_populates="games")


# ─── Round ─────────────────────────────────────────

class Round(Base):
    __tablename__ = "rounds"

    id = Column(String, primary_key=True, default=generate_id)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    song_title = Column(String(200), nullable=True)
    song_artist = Column(String(200), nullable=True)
    youtube_id = Column(String(50), nullable=True)
    spotify_id = Column(String(50), nullable=True)
    clip_duration = Column(Integer, default=15)  # seconds to play
    status = Column(String(20), default="pending")  # pending, active, answered, timeout
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    answers = Column(JSON, default=list)  # [{player_id, guess, is_correct, time_ms, points}]

    room = relationship("Room", back_populates="rounds")
