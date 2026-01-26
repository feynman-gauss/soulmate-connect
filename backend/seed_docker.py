"""
Quick seed script for test users - uses Docker internal MongoDB connection
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import bcrypt

# Docker internal connection
MONGODB_URL = "mongodb://admin:admin123@mongodb:27017"
DATABASE_NAME = "soulmate_connect"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Check if users exist
    count = await db.users.count_documents({})
    print(f"Existing users: {count}")
    
    if count == 0:
        base_password = hash_password("Test@123")
        users = [
            {
                "email": "male1@test.com",
                "name": "Aarav Sharma",
                "phone": "9876500001",
                "age": 28,
                "gender": "male",
                "password_hash": base_password,
                "location": {"city": "Mumbai", "state": "Maharashtra", "country": "India"},
                "religion": "Hindu",
                "education": "B.Tech",
                "occupation": "Software Engineer",
                "height": "5'10\"",
                "salary": "15-20 LPA",
                "about": "Software Engineer looking for a life partner.",
                "interests": ["Reading", "Traveling", "Music"],
                "looking_for": ["female"],
                "marital_status": "Never Married",
                "photos": [],
                "verified": True,
                "premium": False,
                "is_active": True,
                "profile_completion": 85,
                "preferences": {"age_range": {"min": 21, "max": 32}},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_active": datetime.utcnow()
            },
            {
                "email": "female1@test.com",
                "name": "Aadhya Sharma",
                "phone": "9123400001",
                "age": 25,
                "gender": "female",
                "password_hash": base_password,
                "location": {"city": "Delhi", "state": "Delhi", "country": "India"},
                "religion": "Hindu",
                "education": "MBA",
                "occupation": "Product Manager",
                "height": "5'4\"",
                "salary": "10-15 LPA",
                "about": "Product Manager looking for a life partner.",
                "interests": ["Yoga", "Photography", "Cooking"],
                "looking_for": ["male"],
                "marital_status": "Never Married",
                "photos": [],
                "verified": True,
                "premium": False,
                "is_active": True,
                "profile_completion": 90,
                "preferences": {"age_range": {"min": 24, "max": 35}},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_active": datetime.utcnow()
            }
        ]
        result = await db.users.insert_many(users)
        print(f"Created {len(result.inserted_ids)} test users!")
        print("Credentials:")
        print("  male1@test.com / Test@123")
        print("  female1@test.com / Test@123")
    else:
        print("Users already exist. Skipping seed.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
