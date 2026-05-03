"""
WebSocket handler for real-time game communication.

Routes incoming messages from players to the game engine.
"""

import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.websocket.manager import manager
from app.game.engine import GameEngine
from app.models import Room, RoomPlayer, User, Round
from app.database import SessionLocal
from app.auth import decode_access_token

logger = logging.getLogger("tuneup.ws")


async def handle_websocket(ws: WebSocket, room_id: str, token: str):
    """Main WebSocket handler for a room."""
    # Authenticate
    payload = decode_access_token(token)
    if not payload:
        await ws.close(code=4001, reason="Invalid token")
        return

    player_id = payload.get("sub")
    db = SessionLocal()
    try:
        # Verify player is in this room
        rp = (
            db.query(RoomPlayer)
            .join(Room)
            .filter(Room.id == room_id, RoomPlayer.user_id == player_id)
            .first()
        )
        if not rp:
            await ws.close(code=4003, reason="Not in this room")
            return

        user = db.query(User).filter(User.id == player_id).first()
        await manager.connect(room_id, player_id, ws)

        # Notify others
        await manager.broadcast(
            room_id,
            {
                "type": "player_connected",
                "player_id": player_id,
                "username": user.username if user else player_id,
            },
            exclude=player_id,
        )

        # Message loop
        async for raw in ws.iter_text():
            try:
                msg = json.loads(raw)
                await handle_message(room_id, player_id, msg, db)
            except json.JSONDecodeError:
                await manager.send_to(player_id, room_id, {
                    "type": "error",
                    "message": "Invalid JSON",
                })

    except WebSocketDisconnect:
        logger.info(f"Player {player_id} disconnected from room {room_id}")
    except Exception as e:
        logger.error(f"WS error in room {room_id}: {e}")
    finally:
        manager.disconnect(room_id, player_id)
        await manager.broadcast(room_id, {
            "type": "player_disconnected",
            "player_id": player_id,
        })
        db.close()


async def handle_message(room_id: str, player_id: str, msg: dict, db: Session):
    """Route a message to the appropriate handler."""
    msg_type = msg.get("type")
    data = msg.get("data", {})

    engine = GameEngine(room_id, db, manager)

    handlers = {
        "start_game": engine.start_game,
        "submit_guess": engine.submit_guess,
        "player_ready": engine.player_ready,
        "next_round": engine.next_round,
        "request_skip": engine.skip_song,
    }

    handler = handlers.get(msg_type)
    if handler:
        await handler(player_id, data)
    else:
        await manager.send_to(player_id, room_id, {
            "type": "error",
            "message": f"Unknown message type: {msg_type}",
        })
