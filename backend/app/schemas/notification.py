from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    new_match = "new_match"
    new_message = "new_message"
    new_like = "new_like"
    profile_view = "profile_view"
    super_like = "super_like"


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[dict] = None
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread_count: int
