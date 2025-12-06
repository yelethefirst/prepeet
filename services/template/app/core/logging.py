import logging
import sys
from loguru import logger
from app.core.config import settings
from asgi_correlation_id import correlation_id

class InterceptHandler(logging.Handler):
    def emit(self, record):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

def setup_logging():
    # Intercept standard logging
    logging.root.handlers = [InterceptHandler()]
    logging.root.setLevel(settings.LOG_LEVEL)

    # Remove default loguru handler
    logger.remove()

    # Define format
    def format_record(record):
        # Add correlation id if exists
        cid = correlation_id.get()
        if cid:
            record["extra"]["correlation_id"] = cid
            return "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <magenta>{extra[correlation_id]}</magenta> - <level>{message}</level>\n"
        return "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>\n"

    # Add handler (JSON for prod, text for dev)
    serialize = settings.ENV == "production"
    
    logger.add(
        sys.stderr,
        level=settings.LOG_LEVEL,
        format=format_record if not serialize else "{message}",
        serialize=serialize,
        backtrace=True,
        diagnose=True,
    )
