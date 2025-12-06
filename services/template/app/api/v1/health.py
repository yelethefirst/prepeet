from fastapi import APIRouter

router = APIRouter()


@router.get("/health/live", tags=["health"])
async def health_live() -> dict[str, str]:
    """
    Liveness probe.
    """
    return {"status": "ok"}


@router.get("/health/ready", tags=["health"])
async def health_ready() -> dict[str, str]:
    """
    Readiness probe. Checks dependencies (DB, etc).
    """
    # TODO: Check DB connection
    return {"status": "ready"}
