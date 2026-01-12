import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId

# MongoDB URL
import os
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017")
DB_NAME = "soulmate_connect"

async def seed_match():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Connected to MongoDB...")

    # 1. Ensure User A exists (The one user likely created: alphabeta@gmail.com)
    user_a_email = "alphabeta@gmail.com"
    user_a = await db.users.find_one({"email": user_a_email})
    
    if not user_a:
        print(f"User {user_a_email} not found. Creating...")
        user_a_id = await create_user(db, "Alpha Beta", user_a_email, "male", "female")
        user_a = await db.users.find_one({"_id": user_a_id})
    else:
        print(f"Found User A: {user_a['name']}")

    # 2. Ensure User B exists (A test partner)
    user_b_email = "juliet@example.com"
    user_b = await db.users.find_one({"email": user_b_email})
    
    if not user_b:
        print(f"User {user_b_email} not found. Creating...")
        user_b_id = await create_user(db, "Juliet Capulet", user_b_email, "female", "male")
        user_b = await db.users.find_one({"_id": user_b_id})
    else:
        print(f"Found User B: {user_b['name']}")

    # 3. Create Mutual Likes (Swipes)
    print("Creating mutual likes...")
    await create_swipe(db, user_a, user_b)
    await create_swipe(db, user_b, user_a)

    # 4. Create Match
    print("Checking/Creating match...")
    match = await db.matches.find_one({
        "$or": [
            {"user1_id": user_a["_id"], "user2_id": user_b["_id"]},
            {"user1_id": user_b["_id"], "user2_id": user_a["_id"]}
        ]
    })

    if not match:
        result = await db.matches.insert_one({
            "user1_id": user_a["_id"],
            "user2_id": user_b["_id"],
            "matched_at": datetime.utcnow(),
            "is_active": True,
            "unread_count_user1": 0,
            "unread_count_user2": 0
        })
        print(f"Match created! ID: {result.inserted_id}")
    else:
        print("Match already exists.")

    print("\nDONE! You can now login as:")
    print(f"1. {user_a_email} (Password: password123)")
    print(f"2. {user_b_email} (Password: password123)")

async def create_user(db, name, email, gender, looking_for):
    # Determine gender of target for looking_for matching
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hash = pwd_context.hash("password123")

    import time
    timestamp_suffix = str(int(time.time()))[-8:]
    unique_phone = f"99{timestamp_suffix}"
    
    user_doc = {
        "email": email,
        "name": name,
        "phone": unique_phone, # Unique phone
        "age": 25,
        "gender": gender,
        "password_hash": password_hash,
        "looking_for": [looking_for],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_active": datetime.utcnow(),
        "is_active": True,
        "verified": True,
        "premium": True,
        "profile_completion": 80,
        "photos": ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"] if gender == "female" else ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"],
        "interests": ["Travel", "Music"],
        "preferences": {
            "age_range": {"min": 18, "max": 100},
            "max_distance": 1000
        }
    }
    result = await db.users.insert_one(user_doc)
    return result.inserted_id

async def create_swipe(db, swiper, target):
    existing = await db.swipes.find_one({
        "user_id": swiper["_id"],
        "target_user_id": target["_id"]
    })
    if not existing:
        await db.swipes.insert_one({
            "user_id": swiper["_id"],
            "target_user_id": target["_id"],
            "action": "like",
            "created_at": datetime.utcnow()
        })
        print(f"{swiper['name']} liked {target['name']}")
    else:
        print(f"{swiper['name']} already liked {target['name']}")

if __name__ == "__main__":
    asyncio.run(seed_match())
