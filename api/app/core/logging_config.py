"""
Centralized Logging Configuration for FastAPI Backend

This module provides:
- Structured JSON logging for easy parsing/searching
- Console + File output with rotation
- Request correlation IDs for tracing
- Colored console output for development
"""

import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
import json
import traceback
from contextvars import ContextVar

# Context variable for request correlation ID
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_ctx: ContextVar[Optional[str]] = ContextVar("user_id", default=None)


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging.
    Each log line is a valid JSON object for easy parsing.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request context if available
        request_id = request_id_ctx.get()
        if request_id:
            log_data["request_id"] = request_id

        user_id = user_id_ctx.get()
        if user_id:
            log_data["user_id"] = user_id

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info)
            }

        # Add any extra fields passed to the logger
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data

        return json.dumps(log_data, default=str)


class ColoredConsoleFormatter(logging.Formatter):
    """
    Colored formatter for console output during development.
    Makes it easy to spot errors and warnings visually.
    """

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, "")
        
        # Add request ID if available
        request_id = request_id_ctx.get()
        req_str = f"[{request_id[:8]}]" if request_id else ""
        
        user_id = user_id_ctx.get()
        user_str = f"[user:{user_id[:8]}]" if user_id else ""

        # Format timestamp
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]

        # Base message
        message = (
            f"{color}{self.BOLD}{record.levelname:8}{self.RESET} "
            f"\033[90m{timestamp}\033[0m "
            f"{req_str}{user_str} "
            f"\033[90m{record.name}:{record.lineno}\033[0m "
            f"{record.getMessage()}"
        )

        # Add exception if present
        if record.exc_info:
            message += f"\n{color}{traceback.format_exception(*record.exc_info)[-1].strip()}{self.RESET}"

        return message


def setup_logging(
    log_level: str = "INFO",
    log_dir: str = "logs",
    enable_json_file: bool = True,
    enable_console: bool = True,
    debug_mode: bool = False
) -> logging.Logger:
    """
    Configure the application logging system.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        enable_json_file: Write JSON logs to file
        enable_console: Show logs in console
        debug_mode: Use colored console output for development

    Returns:
        Root logger instance
    """
    # Create logs directory if we're writing to files
    log_path = Path(log_dir)
    if enable_json_file:
        log_path.mkdir(parents=True, exist_ok=True)

    # Get the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Clear existing handlers
    root_logger.handlers.clear()

    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)

        if debug_mode:
            # Use colored output for development
            console_handler.setFormatter(ColoredConsoleFormatter())
        else:
            # Use JSON for production (easier to parse in log aggregators)
            console_handler.setFormatter(JSONFormatter())

        root_logger.addHandler(console_handler)

    # JSON file handler with rotation
    if enable_json_file:
        from logging.handlers import RotatingFileHandler

        # Main log file - all logs
        all_logs_handler = RotatingFileHandler(
            log_path / "app.log",
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding="utf-8"
        )
        all_logs_handler.setLevel(logging.DEBUG)
        all_logs_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(all_logs_handler)

        # Error-only log file - for quick debugging
        error_handler = RotatingFileHandler(
            log_path / "errors.log",
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding="utf-8"
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(error_handler)

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name)


class LoggerAdapter(logging.LoggerAdapter):
    """
    Custom adapter to add extra context to log messages.
    Usage: logger.info("message", extra_data={"key": "value"})
    """

    def process(self, msg, kwargs):
        extra_data = kwargs.pop("extra_data", None)
        if extra_data:
            kwargs.setdefault("extra", {})["extra_data"] = extra_data
        return msg, kwargs
