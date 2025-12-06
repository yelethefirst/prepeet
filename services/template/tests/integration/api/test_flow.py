import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.main import app
from app.core.config import settings
from app.api.v1.deps import get_db

@pytest.mark.asyncio
async def test_full_flow(client: AsyncClient):
    # Admin Key and Service Token headers
    admin_headers = {"X-Admin-Key": settings.ADMIN_API_KEY}
    service_headers = {"X-Service-Token": settings.INTERNAL_SERVICE_TOKEN}
    
    # 1. Create Template with Category
    create_payload = {
        "key": "welcome_email",
        "name": "Welcome Email",
        "description": "Sent after signup",
        "channel": "email",
        "tenant_id": "tenant-123",
        "category": "marketing" 
    }
    response = await client.post("/api/v1/templates/", json=create_payload, headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    template_id = data["id"]
    assert data["key"] == "welcome_email"
    assert data["category"] == "marketing"

    # 1.1 List Templates with Category Filter
    response = await client.get("/api/v1/templates/?category=marketing", headers=admin_headers)
    assert response.status_code == 200
    list_data = response.json()
    assert len(list_data) >= 1
    assert list_data[0]["id"] == template_id

    # 2. Add Version
    version_payload = {
        "language": "en-US",
        "subject": "Welcome, {{ name }}!",
        "body_html": "<h1>Hi {{ name }}</h1><p>Welcome to Prepeet!</p>",
        "body_text": "Hi {{ name }}, Welcome to Prepeet!"
    }
    response = await client.post(f"/api/v1/templates/{template_id}/versions", json=version_payload, headers=admin_headers)
    assert response.status_code == 200
    version_data = response.json()
    version_id = version_data["id"]

    # 2.1 List Versions
    response = await client.get(f"/api/v1/templates/{template_id}/versions", headers=admin_headers)
    assert response.status_code == 200
    versions_list = response.json()
    assert len(versions_list) == 1
    assert versions_list[0]["id"] == version_id

    # 3. Publish Version
    response = await client.post(f"/api/v1/templates/{template_id}/versions/{version_id}/publish", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "published"

    # 4. Render (Service API)
    render_payload = {
        "template_key": "welcome_email",
        "channel": "email",
        "tenant_id": "tenant-123",
        "language": "en-US",
        "data": {"name": "Alice"}
    }
    response = await client.post("/api/v1/render/", json=render_payload, headers=service_headers)
    assert response.status_code == 200
    rendered = response.json()
    assert rendered["subject"] == "Welcome, Alice!"

    # 5. Render Fallback (en-GB -> en)
    # Add 'en' version
    version_en_payload = {
        "language": "en",
        "subject": "Welcome (Generic), {{ name }}!",
        "body_html": "<p>Generic Welcome</p>",
        "body_text": "Generic Welcome"
    }
    r = await client.post(f"/api/v1/templates/{template_id}/versions", json=version_en_payload, headers=admin_headers)
    vid_en = r.json()["id"]
    await client.post(f"/api/v1/templates/{template_id}/versions/{vid_en}/publish", headers=admin_headers)

    # Now request en-GB -> expects fallback to en
    render_fallback_payload = {
        "template_key": "welcome_email",
        "channel": "email",
        "tenant_id": "tenant-123",
        "language": "en-GB", 
        "data": {"name": "Bob"}
    }
    response = await client.post("/api/v1/render/", json=render_fallback_payload, headers=service_headers)
    assert response.status_code == 200
    rendered = response.json()
    assert rendered["subject"] == "Welcome (Generic), Bob!"
    assert rendered["language_used"] == "en"
