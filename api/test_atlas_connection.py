import asyncio
from pymongo import AsyncMongoClient
import sys
import os

# Add backend to path to import config if needed, or just use the URI directly for a quick test
# Fetch URI from environment
URI = os.getenv("MONGODB_URL")
if not URI:
    print("Error: MONGODB_URL environment variable not set")
    sys.exit(1)

async def test_connection():
    try:
        print(f"Connecting to {URI}...")
        client = AsyncMongoClient(URI)
        # The ping command is cheap and does not require auth errors to be caught specifically
        await client.admin.command('ping')
        print("Success: Connected to MongoDB Atlas!")
        
        # Test basic write/read
        db = client["soulmate_connect"]
        print(f"Connected to database: {db.name}")
        
    except Exception as e:
        print(f"Error: Could not connect to MongoDB Atlas: {e}")
        sys.exit(1)
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
