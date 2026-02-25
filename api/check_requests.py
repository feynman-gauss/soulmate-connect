"""Check match requests in the database"""
import asyncio
from pymongo.asynchronous import AsyncMongoClient

import os
import sys

# Add the current directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.MONGODB_DB_NAME

async def check_requests():
    client = AsyncMongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=== Match Requests ===")
    requests = await db.match_requests.find().to_list()
    
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
    notifications = await db.notifications.find().sort("created_at", -1).limit(10).to_list()
    
    for notif in notifications:
        user = await db.users.find_one({"_id": notif["user_id"]})
        print(f"\n{notif['type']}: {notif['title']}")
        print(f"  To: {user['name'] if user else 'Unknown'}")
        print(f"  Message: {notif['message']}")
        print(f"  Read: {notif['read']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_requests())
