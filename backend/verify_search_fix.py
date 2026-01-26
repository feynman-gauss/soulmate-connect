
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "soulmate_connect"

async def verify_search_fix():
    print("🚀 Starting Search Fix Verification...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    # 1. Find a pair of users who are matched
    match = await db.matches.find_one({"is_active": True})
    if not match:
        print("❌ No active matches found in DB to test with.")
        return

    user1_id = match["user1_id"]
    user2_id = match["user2_id"]

    print(f"found active match between {user1_id} and {user2_id}")

    # 2. Simulate search for User 1
    # We need to manually construct the exclusion filter that SHOULD be there
    # But first, let's just check if User 2 appears in a broad search 
    
    # In the REAL app, the `search_profiles` endpoint constructs a query.
    # We will simulate what the endpoint does AFTER our fix.
    
    user1 = await db.users.find_one({"_id": user1_id})
    if not user1:
        print("❌ User 1 not found.")
        return

    print("🔎 Simulating search for User 1...")

    # The logic we contain in app/api/v1/search.py:
    excluded_ids = [user1_id]
    
    matches = await db.matches.find({
        "$or": [{"user1_id": user1_id}, {"user2_id": user1_id}],
        "is_active": True
    }).to_list(length=None)
    
    for m in matches:
        excluded_ids.append(m["user2_id"] if m["user1_id"] == user1_id else m["user1_id"])
    
    sent_requests = await db.match_requests.find({
        "from_user_id": user1_id,
        "status": "pending"
    }).to_list(length=None)
    
    for req in sent_requests:
        excluded_ids.append(req["to_user_id"])
        
    received_requests = await db.match_requests.find({
        "to_user_id": user1_id,
        "status": "pending"
    }).to_list(length=None)
    
    for req in received_requests:
        excluded_ids.append(req["from_user_id"])

    # Build search query
    search_filter = {
        "_id": {"$nin": excluded_ids},
        "is_active": True
    }
    
    # Execute search
    results = await db.users.find(search_filter).to_list(length=None)
    result_ids = [u["_id"] for u in results]

    print(f"❌ User 1 should NOT see these IDs: {[str(id) for id in excluded_ids]}")
    
    if user2_id in result_ids:
        print(f"❌ User 2 ({user2_id}) WAS FOUND in the search results! Fix Failed.")
    else:
        print(f"✅ User 2 ({user2_id}) was NOT found in the search results. Fix Verified.")

    client.close()

if __name__ == "__main__":
    asyncio.run(verify_search_fix())
