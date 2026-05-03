from datetime import datetime
from pydantic import BaseModel
from typing import Optional


# ─── Auth ──────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    display_name: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ─── User ──────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    games_played: int = 0
    games_won: int = 0
    total_score: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileResponse(UserResponse):
    has_youtube: bool = False
    has_spotify: bool = False
    has_apple_music: bool = False


# ─── Room ──────────────────────────────────────────

class RoomCreateRequest(BaseModel):
    mode: str = "classic_rush"
    music_source: str = "youtube"
    total_rounds: int = 10
    guess_time: int = 30

class RoomJoinRequest(BaseModel):
    code: str

class PlayerResponse(BaseModel):
    id: str
    username: str
    display_name: str
    score: int
    is_host: bool
    status: str

    class Config:
        from_attributes = True

class RoomResponse(BaseModel):
    id: str
    code: str
    host_id: str
    mode: str
    music_source: str
    total_rounds: int
    guess_time: int
    status: str
    players: list[PlayerResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Game ──────────────────────────────────────────

class GameHistoryResponse(BaseModel):
    id: str
    mode: str
    music_source: str
    total_rounds: int
    status: str
    winner_id: Optional[str]
    player_count: int
    finished_at: datetime

    class Config:
        from_attributes = True


# ─── WebSocket Messages ────────────────────────────

class WsClientMessage(BaseModel):
    type: str
    data: Optional[dict] = None

class WsServerMessage(BaseModel):
    type: str
    data: Optional[dict] = None
