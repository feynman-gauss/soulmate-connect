"""Check match requests in the database"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "soulmate_connect"

async def check_requests():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=== Match Requests ===")
    requests = await db.match_requests.find().to_list(length=None)
    
    if not requests:
        print("No match requests found in database!")
    else:
        for req in requests:
            from_user = await db.users.find_one({"_id": req["from_user_id"]})
            to_user = await db.users.find_one({"_id": req["to_user_id"]})
            print(f"\nRequest ID: {req['_id']}")
            print(f"  From: {from_user['name'] if from_user else 'Unknown'}")
            print(f"  To: {to_user['name'] if to_user else 'Unknown'}")
            print(f"  Status: {req['status']}")
            print(f"  Created: {req['created_at']}")
    
    print("\n=== Recent Notifications ===")
    notifications = await db.notifications.find().sort("created_at", -1).limit(10).to_list(length=None)
    
    for notif in notifications:
        user = await db.users.find_one({"_id": notif["user_id"]})
        print(f"\n{notif['type']}: {notif['title']}")
        print(f"  To: {user['name'] if user else 'Unknown'}")
        print(f"  Message: {notif['message']}")
        print(f"  Read: {notif['read']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_requests())
