
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId

# Using the URL from typical config, adjust if needed
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017")
DB_NAME = "soulmate_connect"

async def check_match_types():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Checking 'matches' collection types...")
    matches = await db.matches.find({}).to_list(length=10)
    
    if not matches:
        print("No matches found.")
        return

    for m in matches:
        u1 = m.get("user1_id")
        u2 = m.get("user2_id")
        print(f"Match ID: {m['_id']}")
        print(f"  user1_id: {u1} (Type: {type(u1)})")
        print(f"  user2_id: {u2} (Type: {type(u2)})")
        
        # Check if they match format of ObjectId but are strings
        if isinstance(u1, str):
            print("  -> user1_id is STRING. This might be the issue.")
        if isinstance(u2, str):
            print("  -> user2_id is STRING. This might be the issue.")

if __name__ == "__main__":
    asyncio.run(check_match_types())
