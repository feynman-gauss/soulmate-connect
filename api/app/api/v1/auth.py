from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase
from app.database import get_database
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse, PasswordReset
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user
)
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to serializable dict"""
    user["id"] = str(user["_id"])
    del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncDatabase = Depends(get_database)
):
    """Register a new user"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if phone already exists
    existing_phone = await db.users.find_one({"phone": user_data.phone})
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Create user document
    user_dict = user_data.dict(exclude={"password"})
    user_dict["password_hash"] = get_password_hash(user_data.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    user_dict["last_active"] = datetime.utcnow()
    user_dict["verified"] = False
    user_dict["premium"] = False
    user_dict["is_active"] = True
    user_dict["profile_completion"] = 30  # Basic info completed
    user_dict["photos"] = []
    user_dict["interests"] = []
    user_dict["looking_for"] = [user_data.looking_for] if user_data.looking_for else []
    user_dict["preferences"] = {
        "age_range": {"min": 21, "max": 35},
        "religion": [],
        "education": [],
        "location": [],
        "height_range": {"min": 150, "max": 200},
        "max_distance": 50
    }
    
    # Insert user
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Get created user
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    # Create tokens
    access_token = create_access_token(data={"sub": user_id, "email": user_data.email})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    # Serialize user
    user_response = serialize_user(created_user)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncDatabase = Depends(get_database)
):
    """Login user"""
    
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    user_id = str(user["_id"])
    
    # Update last active
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_active": datetime.utcnow()}}
    )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user_id, "email": credentials.email})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    # Serialize user
    user_response = serialize_user(user)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """Get current user information"""
    return serialize_user(current_user)


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client should delete tokens)"""
    return {"message": "Successfully logged out"}


@router.post("/refresh")
async def refresh_token(
    refresh_token: str,
    db: AsyncDatabase = Depends(get_database)
):
    """Refresh access token"""
    from app.utils.security import decode_token
    
    try:
        payload = decode_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new access token
        new_access_token = create_access_token(
            data={"sub": user_id, "email": user["email"]}
        )
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


@router.post("/forgot-password")
async def forgot_password(
    data: PasswordReset,
    db: AsyncDatabase = Depends(get_database)
):
    """Request password reset"""
    user = await db.users.find_one({"email": data.email})
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link will be sent"}
    
    # TODO: Generate reset token and send email
    # For now, just return success message
    
    return {"message": "If the email exists, a reset link will be sent"}
