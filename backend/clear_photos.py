"""Clear old photos from test user"""
import asyncio
from pymongo import AsyncMongoClient

import os
import sys

# Add the current directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.MONGODB_DB_NAME

async def clear_photos():
    client = AsyncMongoClient(
MONGODB_URL)
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
