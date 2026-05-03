"""
WebSocket connection manager.

Maintains a mapping of room_id -> {player_id -> websocket}
for broadcasting game events to all players in a room.
"""

from fastapi import WebSocket
from typing import Optional

PlayerConnections = dict[str, WebSocket]  # player_id -> ws
RoomConnections = dict[str, PlayerConnections]  # room_id -> players


class ConnectionManager:
    def __init__(self):
        self.rooms: RoomConnections = {}

    async def connect(self, room_id: str, player_id: str, ws: WebSocket):
        await ws.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        self.rooms[room_id][player_id] = ws

    def disconnect(self, room_id: str, player_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].pop(player_id, None)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def send_to(self, player_id: str, room_id: str, message: dict):
        ws = self.rooms.get(room_id, {}).get(player_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(room_id, player_id)

    async def broadcast(self, room_id: str, message: dict, exclude: Optional[str] = None):
        players = self.rooms.get(room_id, {})
        for pid, ws in list(players.items()):
            if pid == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(room_id, pid)

    def is_connected(self, room_id: str, player_id: str) -> bool:
        return player_id in self.rooms.get(room_id, {})

    def get_room_player_count(self, room_id: str) -> int:
        return len(self.rooms.get(room_id, {}))


manager = ConnectionManager()
