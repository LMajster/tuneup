from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app.models import User, Room, RoomPlayer
from app.schemas import (
    RoomCreateRequest, RoomResponse, PlayerResponse,
    RoomJoinRequest,
)
from app.auth import require_user, get_current_user

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def room_to_response(room: Room) -> RoomResponse:
    return RoomResponse(
        id=room.id,
        code=room.code,
        host_id=room.host_id,
        mode=room.mode,
        music_source=room.music_source,
        total_rounds=room.total_rounds,
        guess_time=room.guess_time,
        status=room.status,
        players=[
            PlayerResponse(
                id=rp.user_id,
                username=rp.user.username,
                display_name=rp.user.display_name,
                score=rp.score,
                is_host=rp.is_host,
                status=rp.status,
            )
            for rp in room.players
        ] if room.players else [],
        created_at=room.created_at,
    )


@router.post("", response_model=RoomResponse, status_code=201)
def create_room(
    req: RoomCreateRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    room = Room(
        host_id=user.id,
        mode=req.mode,
        music_source=req.music_source,
        total_rounds=req.total_rounds,
        guess_time=req.guess_time,
    )
    # Add host as a player
    rp = RoomPlayer(room=room, user_id=user.id, is_host=True, status="ready")
    db.add(room)
    db.add(rp)
    db.commit()

    # Reload with relationships
    db.refresh(room)
    room = db.query(Room).options(
        joinedload(Room.players).joinedload(RoomPlayer.user)
    ).filter(Room.id == room.id).first()

    return room_to_response(room)


@router.get("/{code}", response_model=RoomResponse)
def get_room(code: str, db: Session = Depends(get_db)):
    room = db.query(Room).options(
        joinedload(Room.players).joinedload(RoomPlayer.user)
    ).filter(Room.code == code.upper()).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    return room_to_response(room)


@router.post("/join", response_model=RoomResponse)
def join_room(
    req: RoomJoinRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    room = db.query(Room).options(
        joinedload(Room.players).joinedload(RoomPlayer.user)
    ).filter(Room.code == req.code.upper()).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room.status != "lobby":
        raise HTTPException(status_code=400, detail="Game already started")

    # Check if already joined
    existing = [p for p in room.players if p.user_id == user.id]
    if existing:
        return room_to_response(room)

    rp = RoomPlayer(room_id=room.id, user_id=user.id, is_host=False)
    db.add(rp)
    db.commit()
    db.refresh(room)

    room = db.query(Room).options(
        joinedload(Room.players).joinedload(RoomPlayer.user)
    ).filter(Room.id == room.id).first()

    return room_to_response(room)


@router.post("/{code}/leave", status_code=200)
def leave_room(
    code: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.code == code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    rp = db.query(RoomPlayer).filter(
        RoomPlayer.room_id == room.id,
        RoomPlayer.user_id == user.id,
    ).first()

    if rp:
        db.delete(rp)
        db.commit()

    return {"status": "left"}
