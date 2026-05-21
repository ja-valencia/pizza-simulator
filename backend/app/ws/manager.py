import json

from fastapi import WebSocket


class WebSocketManager:
    """Gestiona conexiones WebSocket activas y broadcast de eventos."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        """Envía un evento JSON a todos los clientes conectados."""
        data = json.dumps(message, default=str)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(data)
            except Exception:
                self.disconnect(connection)


# Instancia global compartida por toda la app
ws_manager = WebSocketManager()
