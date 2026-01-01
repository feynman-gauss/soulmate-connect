from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set
from app.utils.security import decode_token
from app.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections"""
    
    def __init__(self):
        # user_id -> Set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a new WebSocket"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a WebSocket"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"User {user_id} disconnected")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to a specific user (all their connections)"""
        if user_id in self.active_connections:
            disconnected = set()
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


manager = ConnectionManager()


async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """WebSocket endpoint for real-time chat"""
    
    try:
        # Verify token
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        # Connect user
        await manager.connect(websocket, user_id)
        
        # Send online status to user
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "user_id": user_id
        })
        
        # Listen for messages
        while True:
            try:
                data = await websocket.receive_json()
                
                message_type = data.get("type")
                
                if message_type == "ping":
                    # Heartbeat
                    await websocket.send_json({"type": "pong"})
                
                elif message_type == "typing":
                    # Typing indicator
                    receiver_id = data.get("receiver_id")
                    if receiver_id:
                        await manager.send_personal_message({
                            "type": "user.typing",
                            "user_id": user_id,
                            "match_id": data.get("match_id")
                        }, receiver_id)
                
                elif message_type == "message":
                    # New message notification (actual message is sent via REST API)
                    receiver_id = data.get("receiver_id")
                    if receiver_id:
                        await manager.send_personal_message({
                            "type": "message.new",
                            "message": data.get("message"),
                            "sender_id": user_id,
                            "match_id": data.get("match_id")
                        }, receiver_id)
                
                elif message_type == "read":
                    # Read receipt
                    receiver_id = data.get("receiver_id")
                    if receiver_id:
                        await manager.send_personal_message({
                            "type": "message.read",
                            "match_id": data.get("match_id"),
                            "reader_id": user_id
                        }, receiver_id)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })
            except Exception as e:
                logger.error(f"Error in WebSocket: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": "An error occurred"
                })
        
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    
    finally:
        manager.disconnect(websocket, user_id)


# Export manager for use in other modules
__all__ = ["manager", "websocket_endpoint"]
