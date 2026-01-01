from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from redis import asyncio as aioredis
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None
    redis_client: aioredis.Redis = None


db = Database()


async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        logger.info("Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db.db = db.client[settings.MONGODB_DB_NAME]
        
        # Test connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    try:
        logger.info("Closing MongoDB connection...")
        if db.client:
            db.client.close()
        logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")


async def connect_to_redis():
    """Connect to Redis"""
    try:
        logger.info("Connecting to Redis...")
        db.redis_client = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        # Test connection
        await db.redis_client.ping()
        logger.info("Successfully connected to Redis")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        # Redis is optional, so we don't raise


async def close_redis_connection():
    """Close Redis connection"""
    try:
        logger.info("Closing Redis connection...")
        if db.redis_client:
            await db.redis_client.close()
        logger.info("Redis connection closed")
    except Exception as e:
        logger.error(f"Error closing Redis connection: {e}")


async def create_indexes():
    """Create database indexes for optimal performance"""
    try:
        logger.info("Creating database indexes...")
        
        # Users collection indexes
        await db.db.users.create_index("email", unique=True)
        await db.db.users.create_index("phone", unique=True)
        await db.db.users.create_index("last_active")
        await db.db.users.create_index([("location.coordinates", "2dsphere")])
        
        # Swipes collection indexes
        await db.db.swipes.create_index("user_id")
        await db.db.swipes.create_index("target_user_id")
        await db.db.swipes.create_index([("user_id", 1), ("target_user_id", 1)], unique=True)
        await db.db.swipes.create_index("created_at")
        
        # Matches collection indexes
        await db.db.matches.create_index("user1_id")
        await db.db.matches.create_index("user2_id")
        await db.db.matches.create_index([("user1_id", 1), ("user2_id", 1)], unique=True)
        await db.db.matches.create_index("matched_at")
        
        # Messages collection indexes
        await db.db.messages.create_index("match_id")
        await db.db.messages.create_index("sender_id")
        await db.db.messages.create_index("receiver_id")
        await db.db.messages.create_index([("match_id", 1), ("created_at", -1)])
        
        # Notifications collection indexes
        await db.db.notifications.create_index("user_id")
        await db.db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        
        # Profile views collection indexes
        await db.db.profile_views.create_index("viewer_id")
        await db.db.profile_views.create_index("viewed_user_id")
        await db.db.profile_views.create_index([("viewer_id", 1), ("viewed_user_id", 1), ("viewed_at", -1)])
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")


def get_database() -> AsyncIOMotorDatabase:
    """Dependency to get database instance"""
    return db.db


def get_redis() -> aioredis.Redis:
    """Dependency to get Redis instance"""
    return db.redis_client
