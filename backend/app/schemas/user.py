from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class GenderEnum(str, Enum):
    male = "male"
    female = "female"


class LocationSchema(BaseModel):
    city: str
    state: str
    country: str = "India"
    coordinates: Optional[List[float]] = None  # [longitude, latitude]


class PreferencesSchema(BaseModel):
    age_range: dict = {"min": 21, "max": 35}
    religion: List[str] = []
    education: List[str] = []
    location: List[str] = []
    height_range: dict = {"min": 150, "max": 200}
    max_distance: int = 50  # in km


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    age: int = Field(..., ge=18, le=100)
    gender: GenderEnum


class UserRegister(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    looking_for: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isalpha() for char in v):
            raise ValueError('Password must contain at least one letter')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=100)
    location: Optional[LocationSchema] = None
    religion: Optional[str] = None
    education: Optional[str] = None
    occupation: Optional[str] = None
    height: Optional[str] = None
    about: Optional[str] = Field(None, max_length=500)
    interests: Optional[List[str]] = None
    looking_for: Optional[List[str]] = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    age: int
    gender: str
    phone: str
    location: Optional[LocationSchema] = None
    religion: Optional[str] = None
    education: Optional[str] = None
    occupation: Optional[str] = None
    height: Optional[str] = None
    about: Optional[str] = None
    photos: List[str] = []
    interests: List[str] = []
    looking_for: List[str] = []
    verified: bool = False
    premium: bool = False
    profile_completion: int = 0
    last_active: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileResponse(UserResponse):
    """Extended user response with additional profile details"""
    preferences: Optional[PreferencesSchema] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isalpha() for char in v):
            raise ValueError('Password must contain at least one letter')
        return v
