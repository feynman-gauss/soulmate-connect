"""Check discover API results directly"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "soulmate_connect"

async def check_discover():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Get Aarav
    aarav = await db.users.find_one({"email": "male1@test.com"})
    
    # Get swiped IDs
    swiped = await db.swipes.find({"user_id": aarav["_id"]}).to_list(length=None)
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
    matches = await db.users.find(filter_query).to_list(length=None)
    
    print(f"\n✅ Found {len(matches)} matching profiles:")
    for m in matches:
        is_aadhya = "Aadhya" in m.get("name", "")
        marker = " ⭐" if is_aadhya else ""
        print(f"   - {m['name']}, Age: {m['age']}{marker}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_discover())
