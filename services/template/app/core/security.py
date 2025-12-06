from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

from app.core.config import settings

# Define header schemes
# auto_error=False allows us to handle the error manually or let it pass if optional (not optional here)
header_scheme_admin = APIKeyHeader(name="X-Admin-Key", auto_error=True)
header_scheme_service = APIKeyHeader(name="X-Service-Token", auto_error=True)


async def verify_admin_key(api_key: str = Security(header_scheme_admin)) -> str:
    """
    Verifies that the request has a valid Admin API Key.
    """
    if not settings.ADMIN_API_KEY:
        # If no key configured in env, we might want to fail open (dev) or closed (prod).
        # Safe default: fail closed if key not set, or fail if key strictly doesn't match.
        # However, for dev convenience, if env var is empty, maybe allow? 
        # Better: Strict security -> if not set, no one can access.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server Authorization not configured"
        )
    
    if api_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials"
        )
    return api_key


async def verify_service_token(token: str = Security(header_scheme_service)) -> str:
    """
    Verifies that the request has a valid Internal Service Token.
    """
    if not settings.INTERNAL_SERVICE_TOKEN:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server Authorization not configured"
        )
        
    if token != settings.INTERNAL_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials"
        )
    return token
