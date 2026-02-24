from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase
from app.database import get_database
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.utils.security import get_current_user
from bson import ObjectId
from typing import List

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Get all notifications for current user"""
    
    notifications = await db.notifications.find({
        "user_id": current_user["_id"]
    }).sort("created_at", -1).limit(50).to_list()
    
    result = []
    for notif in notifications:
        result.append({
            "id": str(notif["_id"]),
            "user_id": str(notif["user_id"]),
            "type": notif["type"],
            "title": notif["title"],
            "message": notif["message"],
            "data": notif.get("data"),
            "read": notif["read"],
            "created_at": notif["created_at"]
        })
    
    return result


@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Mark a notification as read"""
    
    try:
        notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid notification ID"
        )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification["user_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Mark all notifications as read"""
    
    result = await db.notifications.update_many(
        {"user_id": current_user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {
        "message": "All notifications marked as read",
        "count": result.modified_count
    }


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Delete a notification"""
    
    try:
        notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid notification ID"
        )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification["user_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    await db.notifications.delete_one({"_id": ObjectId(notification_id)})
    
    return {"message": "Notification deleted"}


@router.get("/unread/count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database)
):
    """Get count of unread notifications"""
    
    count = await db.notifications.count_documents({
        "user_id": current_user["_id"],
        "read": False
    })
    
    return {"unread_count": count}
