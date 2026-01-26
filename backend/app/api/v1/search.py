from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.utils.security import get_current_user
from typing import List, Optional
from bson import ObjectId

router = APIRouter(prefix="/search", tags=["Search"])


def to_object_id(id_val):
    """Safely convert any ID to ObjectId"""
    if isinstance(id_val, ObjectId):
        return id_val
    if isinstance(id_val, str):
        try:
            return ObjectId(id_val)
        except:
            return None
    return None


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to serializable dict"""
    user["id"] = str(user["_id"])
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    return user


@router.get("")
async def search_profiles(
    query: Optional[str] = Query(None, min_length=2),
    gender: Optional[str] = None,
    min_age: Optional[int] = Query(None, ge=18),
    max_age: Optional[int] = Query(None, le=100),
    religion: Optional[str] = None,
    education: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = Query(default=20, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Search profiles with filters"""
    
    # Build list of IDs to exclude from search results
    current_user_id = current_user["_id"]
    current_user_id_str = str(current_user_id)
    excluded_ids = [current_user_id]  # Always exclude self
    
    # 1. Exclude users from active matches
    matches = await db.matches.find({
        "$or": [
            {"user1_id": current_user_id},
            {"user2_id": current_user_id}
        ],
        "is_active": True
    }).to_list(length=None)
    
    for match in matches:
        u1 = match.get("user1_id")
        u2 = match.get("user2_id")
        # Determine which user is the "other" user
        if str(u1) == current_user_id_str:
            other_id = to_object_id(u2)
        else:
            other_id = to_object_id(u1)
        if other_id and other_id not in excluded_ids:
            excluded_ids.append(other_id)
    
    # 2. Exclude users with pending sent requests
    sent_requests = await db.match_requests.find({
        "from_user_id": current_user_id,
        "status": "pending"
    }).to_list(length=None)
    
    for req in sent_requests:
        other_id = to_object_id(req.get("to_user_id"))
        if other_id and other_id not in excluded_ids:
            excluded_ids.append(other_id)
    
    # 3. Exclude users with pending received requests
    received_requests = await db.match_requests.find({
        "to_user_id": current_user_id,
        "status": "pending"
    }).to_list(length=None)
    
    for req in received_requests:
        other_id = to_object_id(req.get("from_user_id"))
        if other_id and other_id not in excluded_ids:
            excluded_ids.append(other_id)
    
    # Build search query with exclusions
    search_filter = {
        "_id": {"$nin": excluded_ids},
        "is_active": True
    }
    
    # Text search
    if query:
        search_filter["$or"] = [
            {"name": {"$regex": query, "$options": "i"}},
            {"occupation": {"$regex": query, "$options": "i"}},
            {"education": {"$regex": query, "$options": "i"}},
            {"location.city": {"$regex": query, "$options": "i"}},
            {"location.state": {"$regex": query, "$options": "i"}}
        ]
    
    # Gender filter
    if gender:
        search_filter["gender"] = gender
    
    # Age filter
    if min_age or max_age:
        age_filter = {}
        if min_age:
            age_filter["$gte"] = min_age
        if max_age:
            age_filter["$lte"] = max_age
        if age_filter:
            search_filter["age"] = age_filter
    
    # Religion filter
    if religion:
        search_filter["religion"] = {"$regex": religion, "$options": "i"}
    
    # Education filter
    if education:
        search_filter["education"] = {"$regex": education, "$options": "i"}
    
    # Location filter
    if location:
        search_filter["$or"] = [
            {"location.city": {"$regex": location, "$options": "i"}},
            {"location.state": {"$regex": location, "$options": "i"}}
        ]
    
    # Execute search
    profiles = await db.users.find(search_filter).limit(limit).to_list(length=None)
    
    return {
        "results": [serialize_user(profile) for profile in profiles],
        "total": len(profiles)
    }


@router.get("/suggestions")
async def get_search_suggestions(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get search suggestions (popular locations, educations, etc.)"""
    
    # Get unique values for filters
    pipeline_location = [
        {"$match": {"is_active": True, "location.city": {"$exists": True}}},
        {"$group": {"_id": "$location.city"}},
        {"$limit": 10}
    ]
    
    pipeline_education = [
        {"$match": {"is_active": True, "education": {"$exists": True}}},
        {"$group": {"_id": "$education"}},
        {"$limit": 10}
    ]
    
    pipeline_occupation = [
        {"$match": {"is_active": True, "occupation": {"$exists": True}}},
        {"$group": {"_id": "$occupation"}},
        {"$limit": 10}
    ]
    
    locations = await db.users.aggregate(pipeline_location).to_list(length=None)
    educations = await db.users.aggregate(pipeline_education).to_list(length=None)
    occupations = await db.users.aggregate(pipeline_occupation).to_list(length=None)
    
    return {
        "locations": [loc["_id"] for loc in locations if loc["_id"]],
        "educations": [edu["_id"] for edu in educations if edu["_id"]],
        "occupations": [occ["_id"] for occ in occupations if occ["_id"]]
    }
