"""
Tuneup Backend — FastAPI server with WebSocket game loop.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.models import Room, RoomPlayer
from app.routers import auth, rooms, games
from app.websocket.handler import handle_websocket
from app.websocket.manager import manager

# ─── Logging ───────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-5s | %(name)s | %(message)s",
)
logger = logging.getLogger("tuneup")


# ─── Lifespan ──────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🎵 {settings.app_name} starting up...")
    init_db()
    logger.info("✅ Database tables created")
    yield
    logger.info("👋 Shutting down...")


# ─── App ───────────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(games.router)


# ─── Health Check ──────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Tuneup", "version": "0.1.0"}


# ─── WebSocket Endpoint ────────────────────────────

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(ws: WebSocket, room_id: str, token: str = Query(...)):
    await handle_websocket(ws, room_id, token)


# ─── Entry Point ───────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
