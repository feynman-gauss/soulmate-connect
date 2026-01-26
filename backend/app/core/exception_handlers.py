"""
Global Exception Handlers

Provides comprehensive error handling and logging for all exceptions.
Captures full stack traces, request context, and returns user-friendly error responses.
"""

import traceback
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging_config import get_logger, request_id_ctx

logger = get_logger(__name__)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handle FastAPI HTTPException (expected errors like 401, 403, 404).
    These are typically user errors or expected business logic errors.
    """
    request_id = request_id_ctx.get()
    
    # Log at appropriate level based on status code
    if exc.status_code >= 500:
        logger.error(
            f"HTTP {exc.status_code}: {exc.detail}",
            extra={"extra_data": {
                "path": request.url.path,
                "method": request.method,
                "status_code": exc.status_code,
                "detail": exc.detail
            }}
        )
    elif exc.status_code >= 400:
        logger.warning(
            f"HTTP {exc.status_code}: {exc.detail}",
            extra={"extra_data": {
                "path": request.url.path,
                "method": request.method,
                "status_code": exc.status_code,
                "detail": exc.detail
            }}
        )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail,
            "request_id": request_id
        },
        headers={"X-Request-ID": request_id} if request_id else {}
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle request validation errors (invalid input, missing fields, type mismatches).
    These are typically client errors.
    """
    request_id = request_id_ctx.get()
    
    # Format validation errors for readability
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error.get("loc", []))
        errors.append({
            "field": field,
            "message": error.get("msg"),
            "type": error.get("type")
        })

    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={"extra_data": {
            "path": request.url.path,
            "method": request.method,
            "validation_errors": errors
        }}
    )

    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "status_code": 422,
            "message": "Validation error",
            "details": errors,
            "request_id": request_id
        },
        headers={"X-Request-ID": request_id} if request_id else {}
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle all unhandled exceptions (bugs, unexpected errors).
    These are logged with full stack traces for debugging.
    """
    request_id = request_id_ctx.get()
    
    # Log full stack trace for debugging
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True,  # This includes the full stack trace
        extra={"extra_data": {
            "path": request.url.path,
            "method": request.method,
            "exception_type": type(exc).__name__,
            "exception_message": str(exc),
            "traceback": traceback.format_exc()
        }}
    )

    # Return a generic error response (don't expose internal details to clients)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "status_code": 500,
            "message": "An internal server error occurred",
            "request_id": request_id,
            "hint": "Check server logs with this request_id for details"
        },
        headers={"X-Request-ID": request_id} if request_id else {}
    )


def register_exception_handlers(app):
    """
    Register all exception handlers with the FastAPI app.
    Call this in your main.py after creating the app.
    """
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
    
    logger.info("Exception handlers registered")
