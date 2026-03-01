from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase
from app.database import get_database
from app.schemas.match import MatchResponse, MatchListResponse
from app.utils.security import get_current_user
from bson import ObjectId
from typing import List
from datetime import datetime

router = APIRouter(prefix="/matches", tags=["Matches"])


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to serializable dict"""
    user["id"] = str(user["_id"])
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    return user


# ============================================
# MATCH REQUESTS - Must be BEFORE /{match_id}
# ============================================

@router.get("/requests")
async def get_received_requests(
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Get pending match requests received by current user"""
    
    requests = await db.match_requests.find({
        "to_user_id": current_user["_id"],
        "status": "pending"
    }).sort("created_at", -1).to_list()
    
    result = []
    for req in requests:
        # Get sender's profile
        sender = await db.users.find_one({"_id": req["from_user_id"]})
        if sender:
            result.append({
                "id": str(req["_id"]),
                "from_user_id": str(req["from_user_id"]),
                "to_user_id": str(req["to_user_id"]),
                "status": req["status"],
                "created_at": req["created_at"],
                "profile": serialize_user(sender)
            })
    
    return result


@router.get("/requests/sent")
async def get_sent_requests(
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Get match requests sent by current user"""
    
    requests = await db.match_requests.find({
        "from_user_id": current_user["_id"]
    }).sort("created_at", -1).to_list()
    
    result = []
    for req in requests:
        # Get recipient's profile
        recipient = await db.users.find_one({"_id": req["to_user_id"]})
        if recipient:
            result.append({
                "id": str(req["_id"]),
                "from_user_id": str(req["from_user_id"]),
                "to_user_id": str(req["to_user_id"]),
                "status": req["status"],
                "created_at": req["created_at"],
                "profile": serialize_user(recipient)
            })
    
    return result


@router.post("/requests/{request_id}/accept")
async def accept_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Accept a match request"""
    
    try:
        request = await db.match_requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID"
        )
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Verify current user is the recipient
    if request["to_user_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to accept this request"
        )
    
    if request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request is no longer pending"
        )
    
    # Update request status
    await db.match_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "accepted", "resolved_at": datetime.utcnow()}}
    )
    
    # Create match
    match_doc = {
        "user1_id": request["from_user_id"],
        "user2_id": current_user["_id"],
        "matched_at": datetime.utcnow(),
        "is_active": True,
        "unread_count_user1": 0,
        "unread_count_user2": 0
    }
    await db.matches.insert_one(match_doc)
    
    # Get sender info for notifications
    sender = await db.users.find_one({"_id": request["from_user_id"]})
    
    # Notify both users
    await db.notifications.insert_many([
        {
            "user_id": current_user["_id"],
            "type": "new_match",
            "title": "New Match! 💕",
            "message": f"You and {sender['name']} are now matched!",
            "data": {"match_user_id": str(sender["_id"])},
            "read": False,
            "created_at": datetime.utcnow()
        },
        {
            "user_id": sender["_id"],
            "type": "request_accepted",
            "title": "Interest Accepted! 🎉",
            "message": f"{current_user['name']} accepted your interest!",
            "data": {"match_user_id": str(current_user["_id"])},
            "read": False,
            "created_at": datetime.utcnow()
        }
    ])
    
    return {"message": "Request accepted! You are now matched."}


@router.post("/requests/{request_id}/reject")
async def reject_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Reject a match request"""
    
    try:
        request = await db.match_requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID"
        )
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Verify current user is the recipient
    if request["to_user_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reject this request"
        )
    
    if request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request is no longer pending"
        )
    
    # Update request status
    await db.match_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "rejected", "resolved_at": datetime.utcnow()}}
    )
    
    return {"message": "Request declined"}


# ============================================
# MAIN MATCH ROUTES
# ============================================

@router.get("", response_model=List[MatchResponse])
async def get_matches(
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Get all matches for current user"""
    
    # Find matches where current user is either user1 or user2
    matches = await db.matches.find({
        "$or": [
            {"user1_id": current_user["_id"]},
            {"user2_id": current_user["_id"]}
        ],
        "is_active": True
    }).sort("matched_at", -1).to_list()
    
    # Get other user profiles
    from app.websockets.chat import manager
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
                "is_online": manager.is_user_online(str(other_user_id)),
                "profile": serialize_user(other_user)
            })
    
    return result


@router.get("/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
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
    
    from app.websockets.chat import manager
    return {
        "id": str(match["_id"]),
        "user1_id": str(match["user1_id"]),
        "user2_id": str(match["user2_id"]),
        "matched_at": match["matched_at"],
        "is_active": match["is_active"],
        "last_message": match.get("last_message"),
        "last_message_at": match.get("last_message_at"),
        "unread_count": unread_count,
        "is_online": manager.is_user_online(str(other_user_id)),
        "profile": serialize_user(other_user)
    }


@router.delete("/{match_id}")
async def unmatch(
    match_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
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
