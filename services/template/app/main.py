from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from asgi_correlation_id import CorrelationIdMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1 import health, templates, render
from app.core.telemetry import setup_telemetry

setup_logging()

app = FastAPI(title="Template Service")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CorrelationIdMiddleware)

setup_telemetry(app)

# Metrics
# Metrics
Instrumentator().instrument(app).expose(app)

# Routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(render.router, prefix="/api/v1/render", tags=["render"])
