from fastapi import APIRouter, Depends, Query
from pymongo.asynchronous.database import AsyncDatabase
from app.database import get_database
from app.utils.security import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/search", tags=["Search"])


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
    db: AsyncDatabase = Depends(get_database)
):
    """Search profiles with filters"""
    
    # Build search query
    search_filter = {
        "_id": {"$ne": current_user["_id"]},  # Exclude self
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
    profiles = await db.users.find(search_filter).limit(limit).to_list()
    
    return {
        "results": [serialize_user(profile) for profile in profiles],
        "total": len(profiles)
    }


@router.get("/suggestions")
async def get_search_suggestions(
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database),
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
    
    locations = await db.users.aggregate(pipeline_location).to_list()
    educations = await db.users.aggregate(pipeline_education).to_list()
    occupations = await db.users.aggregate(pipeline_occupation).to_list()
    
    return {
        "locations": [loc["_id"] for loc in locations if loc["_id"]],
        "educations": [edu["_id"] for edu in educations if edu["_id"]],
        "occupations": [occ["_id"] for occ in occupations if occ["_id"]]
    }
