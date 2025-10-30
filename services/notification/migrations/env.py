from __future__ import annotations

import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from alembic import context

# --- Load app settings & metadata
# Make sure the app is importable; adjust path if needed.
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(os.path.dirname(BASE_DIR), "app")
if APP_DIR not in sys.path:
    sys.path.append(APP_DIR)

from app.core.settings import settings
from app.db.base import Base
# Import models so their tables are registered on Base.metadata
from app.models import tenant, message, event, attachment, suppression  # noqa: F401

# Alembic Config
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Use app settings for DB URL (overrides alembic.ini if set)
target_metadata = Base.metadata
DB_URL = settings.db_url  # postgresql+asyncpg://...

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = DB_URL or config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_async_engine(
        DB_URL or config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
        future=True,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
