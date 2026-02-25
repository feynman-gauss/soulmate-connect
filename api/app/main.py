"""FastAPI application entry point"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.api.v1 import auth, profiles, discover, matches, chat, search, notifications
from pathlib import Path

# Initialize structured logging system
from app.core.logging_config import setup_logging, get_logger
from app.middleware.logging_middleware import RequestLoggingMiddleware
from app.core.exception_handlers import register_exception_handlers

import os
is_vercel = os.environ.get("VERCEL") == "1"

# Setup logging - colored console in debug mode, JSON otherwise
logger = setup_logging(
    log_level="DEBUG" if settings.DEBUG else "INFO",
    log_dir="logs",
    enable_json_file=not is_vercel,
    enable_console=True,
    debug_mode=settings.DEBUG  # Colored output in development
)
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Soulmate Connect - A modern matrimonial platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)


# Add request logging middleware (logs all requests/responses with timing)
app.add_middleware(RequestLoggingMiddleware)

# Register global exception handlers
register_exception_handlers(app)

logger.info("Logging middleware and exception handlers initialized")

# Create uploads directory if it doesn't exist
uploads_dir = Path(settings.UPLOAD_DIR)
try:
    if not uploads_dir.exists():
        logger.info(f"Creating uploads directory at {uploads_dir}")
        uploads_dir.mkdir(parents=True, exist_ok=True)
except OSError as e:
    logger.warning(f"Could not create uploads directory at {uploads_dir}: {e}")
    if not is_vercel:
        raise

# Mount static files for uploads only if the directory exists
# On serverless environments (like Vercel), this may be skipped if creation fails
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
else:
    logger.warning(f"Uploads directory {uploads_dir} does not exist. Skipping static files mount.")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database connections on startup"""
    logger.info("Starting up application...")
    await connect_to_mongo()
    logger.info("Application started successfully")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    logger.info("Shutting down application...")
    await close_mongo_connection()
    logger.info("Application shut down successfully")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Soulmate Connect API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs"
    }


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(discover.router, prefix="/api/v1")
app.include_router(matches.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")

# WebSockets
from app.websockets.chat import websocket_endpoint
app.add_api_websocket_route("/ws/chat", websocket_endpoint)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
