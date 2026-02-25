"""Debug why Aadhya Sharma isn't showing in search for Aarav Sharma"""
import asyncio
from pymongo.asynchronous import AsyncMongoClient
from bson import ObjectId

import os
import sys

# Add the current directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.MONGODB_DB_NAME

async def debug_search():
    client = AsyncMongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Get Aarav Sharma (male user)
    aarav = await db.users.find_one({"email": "male1@test.com"})
    if not aarav:
        print("❌ Aarav Sharma not found!")
        return
    
    print(f"✅ Found Aarav Sharma:")
    print(f"   ID: {aarav['_id']}")
    print(f"   Gender: {aarav['gender']}")
    print(f"   Age: {aarav['age']}")
    prefs = aarav.get('preferences', {})
    age_range = prefs.get('age_range', {})
    print(f"   Age preference: {age_range}")
    
    # Get Aadhya Sharma (female user)
    aadhya = await db.users.find_one({"name": {"$regex": "Aadhya", "$options": "i"}})
    if not aadhya:
        print("\n❌ Aadhya Sharma not found!")
        return
    
    print(f"\n✅ Found Aadhya Sharma:")
    print(f"   ID: {aadhya['_id']}")
    print(f"   Gender: {aadhya['gender']}")
    print(f"   Age: {aadhya['age']}")
    print(f"   is_active: {aadhya.get('is_active', 'not set')}")
    
    # Check if Aarav has swiped on Aadhya
    swipe = await db.swipes.find_one({
        "user_id": aarav['_id'],
        "target_user_id": aadhya['_id']
    })
    
    if swipe:
        print(f"\n⚠️ Aarav has already swiped on Aadhya!")
        print(f"   Action: {swipe.get('action')}")
        print(f"   This is why Aadhya is excluded from discover results!")
    else:
        print(f"\n✅ Aarav has NOT swiped on Aadhya yet")
    
    # Check age filter
    min_age = age_range.get('min', 21)
    max_age = age_range.get('max', 35)
    if min_age <= aadhya['age'] <= max_age:
        print(f"\n✅ Aadhya's age ({aadhya['age']}) is within Aarav's preference ({min_age}-{max_age})")
    else:
        print(f"\n❌ Aadhya's age ({aadhya['age']}) is OUTSIDE Aarav's preference ({min_age}-{max_age})")
    
    # Count total swipes by Aarav
    swipes_count = await db.swipes.count_documents({"user_id": aarav['_id']})
    print(f"\n📊 Aarav has swiped on {swipes_count} profiles total")
    
    # List swiped profiles
    swipes = await db.swipes.find({"user_id": aarav['_id']}).to_list()
    if swipes:
        print("   Swiped profiles:")
        for s in swipes:
            target = await db.users.find_one({"_id": s['target_user_id']})
            if target:
                print(f"   - {target['name']} ({s['action']})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_search())
