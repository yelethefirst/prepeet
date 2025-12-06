import sys
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add the project root to sys.path so 'app' module can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import settings
from app.api.v1.deps import get_db

# Use the same DB for now but usually we'd want a separate test DB
TEST_DATABASE_URL = settings.DATABASE_URL

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(engine):
    connection = await engine.connect()
    trans = await connection.begin()
    
    # Bind session to this connection
    Session = sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False
    )
    session = Session()

    yield session

    await session.close()
    await trans.rollback()
    await connection.close()

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    
    app.dependency_overrides.clear()
