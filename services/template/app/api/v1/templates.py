import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_db
from app.domain.templates.models import (
    Template, TemplateCreate,
    TemplateVersion, TemplateVersionCreate,
    ChannelType, TemplateWithVersions
)
from app.domain.templates.schemas import PreviewContentRequest, PreviewContentResponse
from app.core.security import verify_admin_key
from app.domain.templates.services import TemplateService
from app.domain.templates.exceptions import (
    TemplateNotFound, VersionNotFound, 
    DuplicateTemplateError, InvalidTemplateSyntax
)

# Apply security to all routes in this router
router = APIRouter(dependencies=[Depends(verify_admin_key)])


@router.get("/", response_model=List[Template])
async def list_templates(
    tenant_id: Optional[str] = None,
    channel: Optional[ChannelType] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    return await service.list_templates(tenant_id, channel, category, skip, limit)


@router.post("/", response_model=Template)
async def create_template(
    template_in: TemplateCreate,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    try:
        return await service.create_template(template_in)
    except DuplicateTemplateError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}", response_model=TemplateWithVersions)
async def get_template(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    try:
        return await service.get_template(id)
    except TemplateNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{id}")
async def delete_template(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    try:
        await service.delete_template(id)
    except TemplateNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "deleted"}


@router.post("/{id}/versions", response_model=TemplateVersion)
async def create_version(
    id: uuid.UUID,
    version_in: TemplateVersionCreate,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    try:
        return await service.create_version(id, version_in)
    except TemplateNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{id}/versions", response_model=List[TemplateVersion])
async def list_versions(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    try:
        return await service.list_template_versions(id)
    except TemplateNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{id}/versions/{version_id}/publish")
async def publish_version(
    id: uuid.UUID,
    version_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    try:
        ver = await service.publish_version(id, version_id)
        return {"status": "published", "version": ver.version}
    except VersionNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidTemplateSyntax as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/versions/{version_id}/preview")
async def preview_version(
    id: uuid.UUID,
    version_id: uuid.UUID,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    try:
        return await service.preview_version(id, version_id, data)
    except VersionNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


