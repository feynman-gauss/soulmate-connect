"""Test discover query"""
import asyncio
from pymongo.asynchronous import AsyncMongoClient

import os
import sys

# Add the current directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.MONGODB_DB_NAME

async def test_discover():
    client = AsyncMongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Get a male user
    male_user = await db.users.find_one({"email": "male1@test.com"})
    if not male_user:
        print("❌ Male user not found!")
        return
    
    print(f"✅ Found male user: {male_user['name']}")
    print(f"   Gender: {male_user['gender']}")
    print(f"   Looking for: {male_user.get('looking_for', [])}")
    print(f"   Preferences: {male_user.get('preferences', {})}")
    
    # Count female users
    female_count = await db.users.count_documents({"gender": "female"})
    print(f"\n📊 Total female users in DB: {female_count}")
    
    # Test the discover query
    prefs = male_user.get("preferences", {})
    age_range = prefs.get("age_range", {"min": 21, "max": 35})
    
    filter_query = {
        "is_active": True,
        "gender": "female",
        "age": {
            "$gte": age_range.get("min", 18),
            "$lte": age_range.get("max", 100)
        }
    }
    
    print(f"\n🔍 Query filter: {filter_query}")
    
    # Get matching profiles
    matches = await db.users.find(filter_query).limit(10).to_list()
    print(f"\n✅ Found {len(matches)} matching female profiles:")
    
    for m in matches:
        print(f"   - {m['name']}, Age: {m['age']}, Gender: {m['gender']}")
    
    # Check if age range is too restrictive
    all_females = await db.users.find({"gender": "female"}).to_list()
    print(f"\n📋 All female ages:")
    for f in all_females:
        in_range = age_range["min"] <= f["age"] <= age_range["max"]
        status = "✅" if in_range else "❌"
        print(f"   {status} {f['name']}: {f['age']} years")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_discover())
