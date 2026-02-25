"""
Request/Response Logging Middleware

Automatically logs every HTTP request and response with:
- Unique request ID for tracing
- Request details (method, path, headers)
- Response status and timing
- User ID if authenticated
- Error details if request fails
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logging_config import get_logger, request_id_ctx, user_id_ctx

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs all incoming requests and outgoing responses.
    Adds correlation IDs for request tracing across your system.
    """

    def __init__(self, app: ASGIApp, exclude_paths: list[str] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or ["/health", "/favicon.ico", "/api/docs", "/api/openapi.json"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request_id_ctx.set(request_id)

        # Extract user ID if available (from JWT token in header)
        user_id = self._extract_user_id(request)
        if user_id:
            user_id_ctx.set(user_id)

        # Start timing
        start_time = time.perf_counter()

        # Log incoming request
        await self._log_request(request, request_id)

        # Process the request
        response = None
        error_occurred = None

        try:
            response = await call_next(request)
        except Exception as e:
            error_occurred = e
            raise
        finally:
            # Calculate duration
            duration_ms = (time.perf_counter() - start_time) * 1000

            # Log the response/error
            await self._log_response(
                request=request,
                response=response,
                duration_ms=duration_ms,
                request_id=request_id,
                error=error_occurred
            )

            # Clear context
            request_id_ctx.set(None)
            user_id_ctx.set(None)

        # Add request ID to response headers for client-side debugging
        if response:
            response.headers["X-Request-ID"] = request_id

        return response

    def _extract_user_id(self, request: Request) -> str | None:
        """Extract user ID from JWT token without full validation."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        try:
            import base64
            import json
            token = auth_header.split(" ")[1]
            # Decode the payload part of JWT (second segment)
            payload_b64 = token.split(".")[1]
            # Add padding if needed
            padding = 4 - len(payload_b64) % 4
            if padding != 4:
                payload_b64 += "=" * padding
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            return payload.get("sub")  # User ID is typically in 'sub' claim
        except Exception:
            return None

    async def _log_request(self, request: Request, request_id: str):
        """Log incoming request details."""
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        # Get content length
        content_length = request.headers.get("Content-Length", "0")

        logger.info(
            f"→ {request.method} {request.url.path}",
            extra={
                "extra_data": {
                    "type": "request",
                    "method": request.method,
                    "path": request.url.path,
                    "query_params": str(request.query_params),
                    "client_ip": client_ip,
                    "user_agent": request.headers.get("User-Agent", ""),
                    "content_length": content_length,
                    "request_id": request_id
                }
            }
        )

    async def _log_response(
        self,
        request: Request,
        response: Response | None,
        duration_ms: float,
        request_id: str,
        error: Exception | None = None
    ):
        """Log response or error details."""
        status_code = response.status_code if response else 500
        
        # Determine log level based on status code
        if error or status_code >= 500:
            log_level = logger.error
            status_emoji = "❌"
        elif status_code >= 400:
            log_level = logger.warning
            status_emoji = "⚠️"
        else:
            log_level = logger.info
            status_emoji = "✓"

        log_data = {
            "type": "response",
            "method": request.method,
            "path": request.url.path,
            "status_code": status_code,
            "duration_ms": round(duration_ms, 2),
            "request_id": request_id
        }

        if error:
            log_data["error"] = str(error)
            log_data["error_type"] = type(error).__name__

        log_level(
            f"{status_emoji} {request.method} {request.url.path} → {status_code} ({duration_ms:.1f}ms)",
            extra={"extra_data": log_data}
        )
