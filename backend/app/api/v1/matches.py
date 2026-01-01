from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.schemas.match import MatchResponse, MatchListResponse
from app.utils.security import get_current_user
from bson import ObjectId
from typing import List

router = APIRouter(prefix="/matches", tags=["Matches"])


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to serializable dict"""
    user["id"] = str(user["_id"])
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    return user


@router.get("", response_model=List[MatchResponse])
async def get_matches(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all matches for current user"""
    
    # Find matches where current user is either user1 or user2
    matches = await db.matches.find({
        "$or": [
            {"user1_id": current_user["_id"]},
            {"user2_id": current_user["_id"]}
        ],
        "is_active": True
    }).sort("matched_at", -1).to_list(length=None)
    
    # Get other user profiles
    result = []
    for match in matches:
        # Determine which user is the "other" user
        other_user_id = match["user2_id"] if match["user1_id"] == current_user["_id"] else match["user1_id"]
        
        # Get other user's profile
        other_user = await db.users.find_one({"_id": other_user_id})
        
        if other_user:
            # Determine unread count for current user
            unread_count = match.get("unread_count_user1", 0) if match["user1_id"] == current_user["_id"] else match.get("unread_count_user2", 0)
            
            result.append({
                "id": str(match["_id"]),
                "user1_id": str(match["user1_id"]),
                "user2_id": str(match["user2_id"]),
                "matched_at": match["matched_at"],
                "is_active": match["is_active"],
                "last_message": match.get("last_message"),
                "last_message_at": match.get("last_message_at"),
                "unread_count": unread_count,
                "profile": serialize_user(other_user)
            })
    
    return result


@router.get("/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get specific match details"""
    
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
    
    # Verify current user is part of this match
    if match["user1_id"] != current_user["_id"] and match["user2_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this match"
        )
    
    # Get other user's profile
    other_user_id = match["user2_id"] if match["user1_id"] == current_user["_id"] else match["user1_id"]
    other_user = await db.users.find_one({"_id": other_user_id})
    
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Determine unread count for current user
    unread_count = match.get("unread_count_user1", 0) if match["user1_id"] == current_user["_id"] else match.get("unread_count_user2", 0)
    
    return {
        "id": str(match["_id"]),
        "user1_id": str(match["user1_id"]),
        "user2_id": str(match["user2_id"]),
        "matched_at": match["matched_at"],
        "is_active": match["is_active"],
        "last_message": match.get("last_message"),
        "last_message_at": match.get("last_message_at"),
        "unread_count": unread_count,
        "profile": serialize_user(other_user)
    }


@router.delete("/{match_id}")
async def unmatch(
    match_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Unmatch with a user"""
    
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
    
    # Verify current user is part of this match
    if match["user1_id"] != current_user["_id"] and match["user2_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to unmatch"
        )
    
    # Soft delete (set is_active to False)
    await db.matches.update_one(
        {"_id": ObjectId(match_id)},
        {"$set": {"is_active": False}}
    )
    
    return {"message": "Successfully unmatched"}
