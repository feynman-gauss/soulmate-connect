from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class SwipeAction(str, Enum):
    like = "like"
    pass_ = "pass"
    super_like = "super_like"


class SwipeCreate(BaseModel):
    target_user_id: str
    action: SwipeAction


class SwipeResponse(BaseModel):
    id: str
    user_id: str
    target_user_id: str
    action: str
    created_at: datetime
    is_match: bool = False
    
    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    id: str
    user1_id: str
    user2_id: str
    matched_at: datetime
    is_active: bool
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    profile: Optional[dict] = None  # Will contain the other user's profile
    
    class Config:
        from_attributes = True


class MatchListResponse(BaseModel):
    matches: list[MatchResponse]
    total: int
