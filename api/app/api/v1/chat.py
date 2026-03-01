from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from pymongo.asynchronous.database import AsyncDatabase
from app.database import get_database
from app.schemas.message import MessageCreate, MessageResponse, MessageListResponse, ConversationResponse
from app.utils.security import get_current_user
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
import base64
import uuid

router = APIRouter(prefix="/chat", tags=["Chat & Messaging"])


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to serializable dict"""
    user["id"] = str(user["_id"])
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    return user


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Get all conversations (matches with messages)"""
    
    # Get all matches
    matches = await db.matches.find({
        "$or": [
            {"user1_id": current_user["_id"]},
            {"user2_id": current_user["_id"]}
        ],
        "is_active": True
    }).sort("last_message_at", -1).to_list()
    
    conversations = []
    for match in matches:
        # Get other user
        other_user_id = match["user2_id"] if match["user1_id"] == current_user["_id"] else match["user1_id"]
        other_user = await db.users.find_one({"_id": other_user_id})
        
        if other_user:
            # Determine unread count
            unread_count = match.get("unread_count_user1", 0) if match["user1_id"] == current_user["_id"] else match.get("unread_count_user2", 0)
            
            conversations.append({
                "match_id": str(match["_id"]),
                "other_user": serialize_user(other_user),
                "last_message": match.get("last_message"),
                "last_message_at": match.get("last_message_at"),
                "unread_count": unread_count
            })
    
    return conversations


@router.get("/user/{user_id}/status")
async def get_user_status(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Get a user's online status and last seen time"""
    from app.websockets.chat import manager
    
    is_online = manager.is_user_online(user_id)
    last_seen = None
    
    if not is_online:
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                last_seen = user.get("last_seen")
        except Exception:
            pass
    
    return {
        "user_id": user_id,
        "is_online": is_online,
        "last_seen": last_seen.isoformat() if last_seen else None
    }


@router.get("/{match_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    match_id: str,
    limit: int = Query(default=50, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Get messages for a specific match"""
    
    # Verify match exists and user is part of it
    try:
        match = await db.matches.find_one({"_id": ObjectId(match_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid match ID"
        )
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    if match["user1_id"] != current_user["_id"] and match["user2_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these messages"
        )
    
    # Get messages
    messages = await db.messages.find({
        "match_id": ObjectId(match_id)
    }).sort("created_at", -1).skip(skip).limit(limit).to_list()
    
    # Reverse to get chronological order
    messages.reverse()
    
    # Serialize messages
    result = []
    for msg in messages:
        result.append({
            "id": str(msg["_id"]),
            "match_id": str(msg["match_id"]),
            "sender_id": str(msg["sender_id"]),
            "receiver_id": str(msg["receiver_id"]),
            "content": msg.get("content", ""),
            "message_type": msg["message_type"],
            "file_url": msg.get("file_url"),
            "file_name": msg.get("file_name"),
            "read": msg["read"],
            "read_at": msg.get("read_at"),
            "created_at": msg["created_at"]
        })
    
    return result


@router.post("/{match_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    match_id: str,
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Send a message"""
    
    # Verify match exists and user is part of it
    try:
        match = await db.matches.find_one({"_id": ObjectId(match_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid match ID"
        )
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    if match["user1_id"] != current_user["_id"] and match["user2_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send messages in this match"
        )
    
    # Determine receiver
    receiver_id = match["user2_id"] if match["user1_id"] == current_user["_id"] else match["user1_id"]
    
    # Create message
    message_doc = {
        "match_id": ObjectId(match_id),
        "sender_id": current_user["_id"],
        "receiver_id": receiver_id,
        "content": message_data.content,
        "message_type": message_data.message_type.value,
        "file_url": message_data.file_url,
        "file_name": message_data.file_name,
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db.messages.insert_one(message_doc)
    message_doc["_id"] = result.inserted_id
    
    # Update match with last message
    unread_field = "unread_count_user2" if match["user1_id"] == current_user["_id"] else "unread_count_user1"
    
    await db.matches.update_one(
        {"_id": ObjectId(match_id)},
        {
            "$set": {
                "last_message": message_data.content[:100],  # Truncate for preview
                "last_message_at": datetime.utcnow()
            },
            "$inc": {unread_field: 1}
        }
    )
    
    # Create notification for receiver
    receiver = await db.users.find_one({"_id": receiver_id})
    if receiver:
        # Create persistent notification
        await db.notifications.insert_one({
            "user_id": receiver_id,
            "type": "new_message",
            "title": "New Message",
            "message": f"{current_user['name']}: {message_data.content[:50]}...",
            "data": {
                "match_id": match_id,
                "sender_id": str(current_user["_id"])
            },
            "read": False,
            "created_at": datetime.utcnow()
        })
        
        # Send real-time update via WebSocket
        from app.websockets.chat import manager
        await manager.send_personal_message({
            "type": "message.new",
            "message": message_data.content,
            "sender_id": str(current_user["_id"]),
            "match_id": match_id,
            "created_at": datetime.utcnow().isoformat()
        }, str(receiver_id))
    
    return {
        "id": str(message_doc["_id"]),
        "match_id": str(message_doc["match_id"]),
        "sender_id": str(message_doc["sender_id"]),
        "receiver_id": str(message_doc["receiver_id"]),
        "content": message_doc["content"],
        "message_type": message_doc["message_type"],
        "file_url": message_doc.get("file_url"),
        "file_name": message_doc.get("file_name"),
        "read": message_doc["read"],
        "read_at": message_doc.get("read_at"),
        "created_at": message_doc["created_at"]
    }


@router.put("/{match_id}/read")
async def mark_messages_as_read(
    match_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Mark all messages in a conversation as read"""
    
    # Verify match
    try:
        match = await db.matches.find_one({"_id": ObjectId(match_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid match ID"
        )
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    if match["user1_id"] != current_user["_id"] and match["user2_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Mark messages as read
    await db.messages.update_many(
        {
            "match_id": ObjectId(match_id),
            "receiver_id": current_user["_id"],
            "read": False
        },
        {
            "$set": {
                "read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    
    # Reset unread count
    unread_field = "unread_count_user1" if match["user1_id"] == current_user["_id"] else "unread_count_user2"
    
    await db.matches.update_one(
        {"_id": ObjectId(match_id)},
        {"$set": {unread_field: 0}}
    )
    
    return {"message": "Messages marked as read"}


@router.post("/{match_id}/upload", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def upload_chat_file(
    match_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Upload a file (image, PDF, DOC) in chat and create a message for it"""
    
    # Verify match exists and user is part of it
    try:
        match = await db.matches.find_one({"_id": ObjectId(match_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid match ID"
        )
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    if match["user1_id"] != current_user["_id"] and match["user2_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send files in this match"
        )
    
    # Validate file extension
    file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
    allowed_extensions = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx"]
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Check file size (10MB max for chat attachments)
    max_size = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Max size: 10MB"
        )
    
    # Read and encode file
    content = await file.read()
    base64_content = base64.b64encode(content).decode('utf-8')
    
    # Determine MIME type
    mime_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    mime_type = mime_types.get(file_ext, 'application/octet-stream')
    file_data_url = f"data:{mime_type};base64,{base64_content}"
    
    # Determine message type
    image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    if file_ext in image_extensions:
        message_type = "image"
        preview_text = "📷 Image"
    else:
        message_type = "document"
        preview_text = f"📎 {file.filename}"
    
    # Determine receiver
    receiver_id = match["user2_id"] if match["user1_id"] == current_user["_id"] else match["user1_id"]
    
    # Create message document
    message_doc = {
        "match_id": ObjectId(match_id),
        "sender_id": current_user["_id"],
        "receiver_id": receiver_id,
        "content": preview_text,
        "message_type": message_type,
        "file_url": file_data_url,
        "file_name": file.filename,
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db.messages.insert_one(message_doc)
    message_doc["_id"] = result.inserted_id
    
    # Update match with last message
    unread_field = "unread_count_user2" if match["user1_id"] == current_user["_id"] else "unread_count_user1"
    
    await db.matches.update_one(
        {"_id": ObjectId(match_id)},
        {
            "$set": {
                "last_message": preview_text,
                "last_message_at": datetime.utcnow()
            },
            "$inc": {unread_field: 1}
        }
    )
    
    # Create notification
    receiver = await db.users.find_one({"_id": receiver_id})
    if receiver:
        await db.notifications.insert_one({
            "user_id": receiver_id,
            "type": "new_message",
            "title": "New Message",
            "message": f"{current_user['name']}: {preview_text}",
            "data": {
                "match_id": match_id,
                "sender_id": str(current_user["_id"])
            },
            "read": False,
            "created_at": datetime.utcnow()
        })
        
        # Send real-time update via WebSocket
        from app.websockets.chat import manager
        await manager.send_personal_message({
            "type": "message.new",
            "message": preview_text,
            "sender_id": str(current_user["_id"]),
            "match_id": match_id,
            "message_type": message_type,
            "file_url": file_data_url,
            "file_name": file.filename,
            "created_at": datetime.utcnow().isoformat()
        }, str(receiver_id))
    
    return {
        "id": str(message_doc["_id"]),
        "match_id": str(message_doc["match_id"]),
        "sender_id": str(message_doc["sender_id"]),
        "receiver_id": str(message_doc["receiver_id"]),
        "content": message_doc["content"],
        "message_type": message_doc["message_type"],
        "file_url": message_doc.get("file_url"),
        "file_name": message_doc.get("file_name"),
        "read": message_doc["read"],
        "read_at": message_doc.get("read_at"),
        "created_at": message_doc["created_at"]
    }
