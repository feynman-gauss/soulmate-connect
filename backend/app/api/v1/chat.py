from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.schemas.message import MessageCreate, MessageResponse, MessageListResponse, ConversationResponse
from app.utils.security import get_current_user
from bson import ObjectId
from datetime import datetime
from typing import List

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
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all conversations (matches with messages)"""
    
    # Get all matches
    matches = await db.matches.find({
        "$or": [
            {"user1_id": current_user["_id"]},
            {"user2_id": current_user["_id"]}
        ],
        "is_active": True
    }).sort("last_message_at", -1).to_list(length=None)
    
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


@router.get("/{match_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    match_id: str,
    limit: int = Query(default=50, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
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
    }).sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    
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
            "content": msg["content"],
            "message_type": msg["message_type"],
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
    db: AsyncIOMotorDatabase = Depends(get_database)
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
    
    return {
        "id": str(message_doc["_id"]),
        "match_id": str(message_doc["match_id"]),
        "sender_id": str(message_doc["sender_id"]),
        "receiver_id": str(message_doc["receiver_id"]),
        "content": message_doc["content"],
        "message_type": message_doc["message_type"],
        "read": message_doc["read"],
        "read_at": message_doc.get("read_at"),
        "created_at": message_doc["created_at"]
    }


@router.put("/{match_id}/read")
async def mark_messages_as_read(
    match_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
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
