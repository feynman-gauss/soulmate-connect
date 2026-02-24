"""Check discover API results directly"""
import asyncio
from pymongo.asynchronous import AsyncMongoClient

import os
import sys

# Add the current directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.MONGODB_DB_NAME

async def check_discover():
    client = AsyncMongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Get Aarav
    aarav = await db.users.find_one({"email": "male1@test.com"})
    
    # Get swiped IDs
    swiped = await db.swipes.find({"user_id": aarav["_id"]}).to_list()
    swiped_ids = [s["target_user_id"] for s in swiped]
    swiped_ids.append(aarav["_id"])  # Exclude self
    
    print(f"Excluded IDs: {len(swiped_ids)}")
    
    # Get age range filter
    prefs = aarav.get("preferences", {})
    age_range = prefs.get("age_range", {"min": 21, "max": 35})
    
    filter_query = {
        "_id": {"$nin": swiped_ids},
        "is_active": True,
        "gender": "female",
        "age": {
            "$gte": age_range.get("min", 18),
            "$lte": age_range.get("max", 100)
        }
    }
    
    print(f"\nFilter query: {filter_query}")
    
    # Get all matching users
    matches = await db.users.find(filter_query).to_list()
    
    print(f"\n✅ Found {len(matches)} matching profiles:")
    for m in matches:
        is_aadhya = "Aadhya" in m.get("name", "")
        marker = " ⭐" if is_aadhya else ""
        print(f"   - {m['name']}, Age: {m['age']}{marker}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_discover())
