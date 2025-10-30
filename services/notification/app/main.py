from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from app.core.settings import settings
from app.core.logging import configure_logging, logger
from app.api.notifications import router as notifications_router

app = FastAPI(title="Prepeet Notification", version="0.1.0")

@app.on_event("startup")
def _startup():
    configure_logging()
    if settings.enable_metrics:
        Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
    logger.info("startup", env=settings.env, version=settings.app_version)

@app.get("/healthz")
def healthz():
    return {"ok": True}

app.include_router(notifications_router)
