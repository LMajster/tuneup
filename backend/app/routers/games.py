from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, Game
from app.schemas import UserResponse, UserProfileResponse, GameHistoryResponse
from app.auth import require_user, get_current_user

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(user: User = Depends(require_user)):
    return UserProfileResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        games_played=user.games_played,
        games_won=user.games_won,
        total_score=user.total_score,
        created_at=user.created_at,
        has_youtube=bool(user.youtube_token),
        has_spotify=bool(user.spotify_token),
        has_apple_music=bool(user.apple_music_token),
    )


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    return UserResponse.model_validate(user)


@router.get("/games/history", response_model=list[GameHistoryResponse])
def get_game_history(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    games = (
        db.query(Game)
        .filter(Game.host_id == user.id)
        .order_by(Game.finished_at.desc())
        .limit(limit)
        .all()
    )
    return [GameHistoryResponse.model_validate(g) for g in games]
