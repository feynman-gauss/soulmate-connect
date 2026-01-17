from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.schemas.match import SwipeCreate, SwipeResponse, MatchResponse, MatchListResponse
from app.schemas.user import UserProfileResponse
from app.utils.security import get_current_user
from bson import ObjectId
from datetime import datetime
from typing import List
from app.config import settings

router = APIRouter(prefix="/discover", tags=["Discovery & Matching"])


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to serializable dict"""
    user["id"] = str(user["_id"])
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    return user


def calculate_compatibility_score(user: dict, target: dict) -> float:
    """Calculate compatibility score between two users"""
    score = 0.0
    
    # Location proximity (30%)
    if user.get("location") and target.get("location"):
        if user["location"].get("city") == target["location"].get("city"):
            score += settings.COMPATIBILITY_WEIGHTS_LOCATION
        elif user["location"].get("state") == target["location"].get("state"):
            score += settings.COMPATIBILITY_WEIGHTS_LOCATION * 0.5
    
    # Shared interests (25%)
    user_interests = set(user.get("interests", []))
    target_interests = set(target.get("interests", []))
    if user_interests and target_interests:
        common_interests = len(user_interests & target_interests)
        max_interests = max(len(user_interests), len(target_interests))
        if max_interests > 0:
            score += (common_interests / max_interests) * settings.COMPATIBILITY_WEIGHTS_INTERESTS
    
    # Education match (15%)
    if user.get("education") and target.get("education"):
        if user["education"] == target["education"]:
            score += settings.COMPATIBILITY_WEIGHTS_EDUCATION
    
    # Age preference match (15%)
    user_prefs = user.get("preferences", {})
    age_range = user_prefs.get("age_range", {"min": 21, "max": 35})
    target_age = target.get("age", 0)
    if age_range["min"] <= target_age <= age_range["max"]:
        score += settings.COMPATIBILITY_WEIGHTS_AGE
    
    # Religion match (10%)
    if user.get("religion") and target.get("religion"):
        if user["religion"] == target["religion"]:
            score += settings.COMPATIBILITY_WEIGHTS_RELIGION
    
    # Profile completion (5%)
    target_completion = target.get("profile_completion", 0)
    score += (target_completion / 100) * settings.COMPATIBILITY_WEIGHTS_PROFILE_COMPLETION
    
    return round(score * 100, 2)  # Return as percentage


@router.get("", response_model=List[UserProfileResponse])
async def get_discovery_profiles(
    limit: int = Query(default=20, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get profiles for discovery feed"""
    
    # Get user's swiped profiles
    swiped = await db.swipes.find(
        {"user_id": current_user["_id"]}
    ).to_list(length=None)
    
    swiped_ids = [swipe["target_user_id"] for swipe in swiped]
    swiped_ids.append(current_user["_id"])  # Exclude self
    
    # Build filter based on preferences
    prefs = current_user.get("preferences", {})
    filter_query = {
        "_id": {"$nin": swiped_ids},
        "is_active": True
    }
    
    # Gender filter (looking for opposite gender in matrimonial context)
    user_gender = current_user.get("gender")
    if user_gender == "male":
        filter_query["gender"] = "female"
    elif user_gender == "female":
        filter_query["gender"] = "male"
    
    # Age range filter
    age_range = prefs.get("age_range", {})
    if age_range:
        filter_query["age"] = {
            "$gte": age_range.get("min", 18),
            "$lte": age_range.get("max", 100)
        }
    
    # Religion filter
    if prefs.get("religion") and len(prefs["religion"]) > 0:
        filter_query["religion"] = {"$in": prefs["religion"]}
    
    # Education filter
    if prefs.get("education") and len(prefs["education"]) > 0:
        filter_query["education"] = {"$in": prefs["education"]}
    
    # Get potential matches
    potential_matches = await db.users.find(filter_query).limit(limit * 2).to_list(length=None)
    
    # Calculate compatibility scores and sort
    scored_profiles = []
    for profile in potential_matches:
        score = calculate_compatibility_score(current_user, profile)
        profile["compatibility_score"] = score
        scored_profiles.append(profile)
    
    # Sort by compatibility score and last active
    scored_profiles.sort(
        key=lambda x: (x.get("compatibility_score", 0), x.get("last_active", datetime.min)),
        reverse=True
    )
    
    # Return top N profiles
    top_profiles = scored_profiles[:limit]
    
    return [serialize_user(profile) for profile in top_profiles]


@router.post("/swipes", response_model=SwipeResponse)
async def create_swipe(
    swipe_data: SwipeCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Swipe on a profile (like/pass/super_like)"""
    
    # Validate target user
    try:
        target_user = await db.users.find_one({"_id": ObjectId(swipe_data.target_user_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already swiped
    existing_swipe = await db.swipes.find_one({
        "user_id": current_user["_id"],
        "target_user_id": target_user["_id"]
    })
    
    if existing_swipe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already swiped on this profile"
        )
    
    # Create swipe
    swipe_doc = {
        "user_id": current_user["_id"],
        "target_user_id": target_user["_id"],
        "action": swipe_data.action.value,
        "created_at": datetime.utcnow()
    }
    
    result = await db.swipes.insert_one(swipe_doc)
    swipe_doc["_id"] = result.inserted_id
    
    # Handle match request logic (if action is like or super_like)
    is_match = False
    is_request_sent = False
    if swipe_data.action.value in ["like", "super_like"]:
        # Check if there's already a pending match request from target to current user
        existing_request = await db.match_requests.find_one({
            "from_user_id": target_user["_id"],
            "to_user_id": current_user["_id"],
            "status": "pending"
        })
        
        if existing_request:
            # Target already requested to match with us - auto accept and create match!
            is_match = True
            
            # Update the existing request to accepted
            await db.match_requests.update_one(
                {"_id": existing_request["_id"]},
                {"$set": {"status": "accepted", "resolved_at": datetime.utcnow()}}
            )
            
            # Create match
            match_doc = {
                "user1_id": target_user["_id"],  # Original requester
                "user2_id": current_user["_id"],  # Accepter
                "matched_at": datetime.utcnow(),
                "is_active": True,
                "unread_count_user1": 0,
                "unread_count_user2": 0
            }
            
            await db.matches.insert_one(match_doc)
            
            # Create notifications for both users
            await db.notifications.insert_many([
                {
                    "user_id": current_user["_id"],
                    "type": "new_match",
                    "title": "New Match! 💕",
                    "message": f"You and {target_user['name']} are now matched!",
                    "data": {"match_user_id": str(target_user["_id"])},
                    "read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "user_id": target_user["_id"],
                    "type": "new_match",
                    "title": "New Match! 💕",
                    "message": f"You and {current_user['name']} are now matched!",
                    "data": {"match_user_id": str(current_user["_id"])},
                    "read": False,
                    "created_at": datetime.utcnow()
                }
            ])
        else:
            # Create a new match request
            is_request_sent = True
            
            # Check if we already sent a request
            existing_outgoing = await db.match_requests.find_one({
                "from_user_id": current_user["_id"],
                "to_user_id": target_user["_id"]
            })
            
            if not existing_outgoing:
                # Create match request
                request_doc = {
                    "from_user_id": current_user["_id"],
                    "to_user_id": target_user["_id"],
                    "status": "pending",  # pending, accepted, rejected
                    "created_at": datetime.utcnow()
                }
                await db.match_requests.insert_one(request_doc)
                
                # Notify the sender that their request was sent
                await db.notifications.insert_one({
                    "user_id": current_user["_id"],
                    "type": "request_sent",
                    "title": "Interest Sent! 💌",
                    "message": f"Your interest has been sent to {target_user['name']}",
                    "data": {"user_id": str(target_user["_id"])},
                    "read": False,
                    "created_at": datetime.utcnow()
                })
                
                # Notify the target user about the match request
                request_type = "super_interest" if swipe_data.action.value == "super_like" else "match_request"
                title = "Super Interest Received! ⭐" if swipe_data.action.value == "super_like" else "New Interest! 💕"
                
                await db.notifications.insert_one({
                    "user_id": target_user["_id"],
                    "type": request_type,
                    "title": title,
                    "message": f"{current_user['name']} is interested in you! Accept or Decline?",
                    "data": {"user_id": str(current_user["_id"])},
                    "read": False,
                    "created_at": datetime.utcnow()
                })
    
    # Create notification for super like (additional visibility)
    if swipe_data.action.value == "super_like" and not is_match:
        await db.notifications.insert_one({
            "user_id": target_user["_id"],
            "type": "super_like",
            "title": "Super Like!",
            "message": f"{current_user['name']} super liked you!",
            "data": {"user_id": str(current_user["_id"])},
            "read": False,
            "created_at": datetime.utcnow()
        })
    
    # Create notification for regular like (premium feature)
    elif swipe_data.action.value == "like" and target_user.get("premium", False):
        await db.notifications.insert_one({
            "user_id": target_user["_id"],
            "type": "new_like",
            "title": "New Like",
            "message": f"{current_user['name']} liked you!",
            "data": {"user_id": str(current_user["_id"])},
            "read": False,
            "created_at": datetime.utcnow()
        })
    
    return {
        "id": str(swipe_doc["_id"]),
        "user_id": str(swipe_doc["user_id"]),
        "target_user_id": str(swipe_doc["target_user_id"]),
        "action": swipe_doc["action"],
        "created_at": swipe_doc["created_at"],
        "is_match": is_match
    }


@router.get("/likes/received")
async def get_received_likes(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get users who liked you (premium feature)"""
    
    if not current_user.get("premium", False):
        # Return count only for non-premium users
        count = await db.swipes.count_documents({
            "target_user_id": current_user["_id"],
            "action": {"$in": ["like", "super_like"]}
        })
        
        return {
            "count": count,
            "profiles": [],
            "message": "Upgrade to premium to see who liked you"
        }
    
    # Get likes
    likes = await db.swipes.find({
        "target_user_id": current_user["_id"],
        "action": {"$in": ["like", "super_like"]}
    }).sort("created_at", -1).to_list(length=50)
    
    # Get user profiles
    user_ids = [like["user_id"] for like in likes]
    users = await db.users.find({"_id": {"$in": user_ids}}).to_list(length=None)
    
    return {
        "count": len(likes),
        "profiles": [serialize_user(user) for user in users]
    }
