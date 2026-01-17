from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.schemas.user import UserUpdate, UserProfileResponse, PreferencesSchema
from app.utils.security import get_current_user
from bson import ObjectId
from typing import List
import os
import uuid
from pathlib import Path
from app.config import settings

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to serializable dict"""
    user["id"] = str(user["_id"])
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    return user


def calculate_profile_completion(user: dict) -> int:
    """Calculate profile completion percentage"""
    fields = {
        "name": 5,
        "email": 5,
        "phone": 5,
        "age": 5,
        "gender": 5,
        "location": 10,
        "religion": 10,
        "education": 10,
        "occupation": 10,
        "height": 5,
        "about": 15,
        "photos": 10,  # At least one photo
        "interests": 5,
    }
    
    score = 0
    for field, points in fields.items():
        if field == "photos":
            if user.get(field) and len(user.get(field, [])) > 0:
                score += points
        elif field == "location":
            if user.get(field) and user[field].get("city"):
                score += points
        elif user.get(field):
            score += points
    
    return min(score, 100)


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current user's profile"""
    # Recalculate profile completion
    completion = calculate_profile_completion(current_user)
    
    if completion != current_user.get("profile_completion", 0):
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"profile_completion": completion}}
        )
        current_user["profile_completion"] = completion
    
    return serialize_user(current_user)


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    profile_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update current user's profile"""
    from datetime import datetime
    
    # Prepare update data
    update_data = profile_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # Update user
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    # Recalculate profile completion
    completion = calculate_profile_completion(updated_user)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile_completion": completion}}
    )
    updated_user["profile_completion"] = completion
    
    return serialize_user(updated_user)


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get another user's profile"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Record profile view
    from datetime import datetime
    await db.profile_views.insert_one({
        "viewer_id": current_user["_id"],
        "viewed_user_id": user["_id"],
        "viewed_at": datetime.utcnow()
    })
    
    # Create notification for profile view (non-premium users get limited views)
    if user.get("premium", False):
        await db.notifications.insert_one({
            "user_id": user["_id"],
            "type": "profile_view",
            "title": "Profile View",
            "message": f"{current_user['name']} viewed your profile",
            "data": {"viewer_id": str(current_user["_id"])},
            "read": False,
            "created_at": datetime.utcnow()
        })
    
    return serialize_user(user)


@router.post("/photos", status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload a profile photo - stores as base64 in database"""
    import base64
    
    # Check file extension
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
        )
    
    # Check max photos
    current_photos = current_user.get("photos", [])
    if len(current_photos) >= settings.MAX_PHOTOS_PER_PROFILE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {settings.MAX_PHOTOS_PER_PROFILE} photos allowed"
        )
    
    # Read file content and convert to base64 data URL
    content = await file.read()
    base64_content = base64.b64encode(content).decode('utf-8')
    
    # Determine MIME type
    mime_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    }
    mime_type = mime_types.get(file_ext, 'image/jpeg')
    
    # Create data URL
    photo_data_url = f"data:{mime_type};base64,{base64_content}"
    
    # Update user photos in database
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$push": {"photos": photo_data_url}}
    )
    
    # Get updated user to return all photos
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    return {
        "photo_url": photo_data_url, 
        "photos": updated_user.get("photos", []),
        "message": "Photo uploaded successfully"
    }


@router.delete("/photos/{photo_index}")
async def delete_photo(
    photo_index: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a profile photo"""
    
    current_photos = current_user.get("photos", [])
    
    if photo_index < 0 or photo_index >= len(current_photos):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo index"
        )
    
    photo_url = current_photos[photo_index]
    
    # Delete file from filesystem
    try:
        file_path = Path(settings.UPLOAD_DIR).parent / photo_url.lstrip("/")
        if file_path.exists():
            os.remove(file_path)
    except Exception as e:
        pass  # Continue even if file deletion fails
    
    # Remove from database
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$pull": {"photos": photo_url}}
    )
    
    return {"message": "Photo deleted successfully"}


@router.put("/preferences")
async def update_preferences(
    preferences: PreferencesSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update match preferences"""
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"preferences": preferences.dict()}}
    )
    
    return {"message": "Preferences updated successfully", "preferences": preferences}
