from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    text = "text"
    image = "image"
    emoji = "emoji"


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    message_type: MessageType = MessageType.text


class MessageResponse(BaseModel):
    id: str
    match_id: str
    sender_id: str
    receiver_id: str
    content: str
    message_type: str
    read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]
    total: int


class ConversationResponse(BaseModel):
    match_id: str
    other_user: dict
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    
    class Config:
        from_attributes = True
