"""Clear old photos from test user"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "soulmate_connect"

async def clear_photos():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Clear photos for male1 user
    result = await db.users.update_one(
        {"email": "male1@test.com"},
        {"$set": {"photos": []}}
    )
    
    print(f"✅ Cleared photos for male1@test.com (modified: {result.modified_count})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_photos())
