from typing import Optional, List, Any
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.domain.templates.models import (
    Template, ChannelType, TemplateStatus, 
    TemplateVersion, TemplateCreate, 
    TemplateVersionCreate
)
from app.infrastructure.db.models.templates import Template as DBTemplate, TemplateVersion as DBTemplateVersion
from app.domain.templates.exceptions import (
    TemplateNotFound, VersionNotFound, 
    DuplicateTemplateError, InvalidTemplateSyntax
)
from app.domain.templates.renderer import TemplateRenderer


class TemplateService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.renderer = TemplateRenderer()

    async def list_templates(
        self,
        tenant_id: Optional[str] = None,
        channel: Optional[ChannelType] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[DBTemplate]:
        query = select(DBTemplate)
        if tenant_id:
            query = query.where(DBTemplate.tenant_id == tenant_id)
        if channel:
            query = query.where(DBTemplate.channel == channel)
        if category:
            query = query.where(DBTemplate.category == category)
        
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create_template(self, template_in: TemplateCreate) -> DBTemplate:
        db_obj = DBTemplate(**template_in.model_dump())
        self.session.add(db_obj)
        try:
            await self.session.commit()
            await self.session.refresh(db_obj)
        except IntegrityError:
            await self.session.rollback()
            raise DuplicateTemplateError(f"Template with key '{template_in.key}' already exists for this tenant.")
        return db_obj

    async def get_template(self, id: uuid.UUID) -> DBTemplate:
        query = select(DBTemplate).where(DBTemplate.id == id).options(selectinload(DBTemplate.versions))
        result = await self.session.execute(query)
        tpl = result.scalar_one_or_none()
        if not tpl:
            raise TemplateNotFound(f"Template with id {id} not found")
        return tpl

    async def delete_template(self, id: uuid.UUID) -> None:
        tpl = await self.get_template(id)
        await self.session.delete(tpl)
        await self.session.commit()

    async def create_version(self, template_id: uuid.UUID, version_in: TemplateVersionCreate) -> DBTemplateVersion:
        # Verify template exists
        await self.get_template(template_id)

        # Calculate next version
        q_ver = select(func.max(DBTemplateVersion.version)).where(
            DBTemplateVersion.template_id == template_id,
            DBTemplateVersion.language == version_in.language
        )
        res_ver = await self.session.execute(q_ver)
        max_ver = res_ver.scalar() or 0
        new_ver = max_ver + 1

        db_ver = DBTemplateVersion(
            template_id=template_id,
            version=new_ver,
            status=TemplateStatus.DRAFT,
            **version_in.model_dump()
        )
        self.session.add(db_ver)
        await self.session.commit()
        await self.session.refresh(db_ver)
        return db_ver
        
    async def list_template_versions(self, template_id: uuid.UUID) -> List[DBTemplateVersion]:
        # Verify template exists
        await self.get_template(template_id)
        
        query = select(DBTemplateVersion).where(DBTemplateVersion.template_id == template_id).order_by(DBTemplateVersion.version.asc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def publish_version(self, template_id: uuid.UUID, version_id: uuid.UUID) -> DBTemplateVersion:
        # Get version
        q = select(DBTemplateVersion).where(
            DBTemplateVersion.id == version_id,
            DBTemplateVersion.template_id == template_id
        )
        res = await self.session.execute(q)
        ver = res.scalar_one_or_none()
        if not ver:
            raise VersionNotFound(f"Version {version_id} not found")

        # Syntax validation (double check even if models have it, models might be skipped if we just load DB obj)
        # But here we are dealing with DB obj directly.
        if ver.subject:
            err = self.renderer.validate_syntax(ver.subject)
            if err: raise InvalidTemplateSyntax(f"Subject syntax error: {err}")
        if ver.body_html:
            err = self.renderer.validate_syntax(ver.body_html)
            if err: raise InvalidTemplateSyntax(f"Body HTML syntax error: {err}")
        if ver.body_text:
            err = self.renderer.validate_syntax(ver.body_text)
            if err: raise InvalidTemplateSyntax(f"Body Text syntax error: {err}")

        # Unpublish current
        q_curr = select(DBTemplateVersion).where(
            DBTemplateVersion.template_id == template_id,
            DBTemplateVersion.language == ver.language,
            DBTemplateVersion.is_current == True
        )
        res_curr = await self.session.execute(q_curr)
        curr_ver = res_curr.scalar_one_or_none()
        if curr_ver:
            curr_ver.is_current = False
        
        ver.status = TemplateStatus.PUBLISHED
        ver.is_current = True
        
        await self.session.commit()
        return ver

    async def preview_version(self, template_id: uuid.UUID, version_id: uuid.UUID, data: dict) -> dict:
        q = select(DBTemplateVersion).where(
            DBTemplateVersion.id == version_id,
            DBTemplateVersion.template_id == template_id
        )
        res = await self.session.execute(q)
        ver = res.scalar_one_or_none()
        if not ver:
            raise VersionNotFound(f"Version {version_id} not found")

        # Forgiving render for preview
        strict = False 
        return {
            "subject": self.renderer.render(ver.subject or "", data, strict),
            "body_html": self.renderer.render(ver.body_html or "", data, strict),
            "body_text": self.renderer.render(ver.body_text or "", data, strict),
        }
    
    async def preview_content(self, content_html: Optional[str], content_text: Optional[str], subject: Optional[str], data: dict) -> dict:
        strict = False
        return {
             "subject": self.renderer.render(subject or "", data, strict),
             "body_html": self.renderer.render(content_html or "", data, strict),
             "body_text": self.renderer.render(content_text or "", data, strict),
        }

    async def resolve_and_render(
        self,
        key: str,
        channel: ChannelType,
        tenant_id: Optional[str],
        language: str,
        data: dict,
        strict: bool = True
    ) -> dict:
        version = await self.resolve_template_version(key, channel, tenant_id, language)
        if not version:
             return None

        try:
            subject = self.renderer.render(version.subject or "", data, strict)
            body_html = self.renderer.render(version.body_html or "", data, strict)
            body_text = self.renderer.render(version.body_text or "", data, strict)
        except Exception as e:
            raise InvalidTemplateSyntax(f"Rendering failed: {str(e)}")

        return {
            "version": version,
            "subject": subject,
            "body_html": body_html,
            "body_text": body_text
        }

    async def resolve_template_version(
        self,
        key: str,
        channel: ChannelType,
        tenant_id: Optional[str],
        language: str
    ) -> Optional[DBTemplateVersion]:
        """
        Resolves the best matching published template version.
        """
        # Exact match
        query = (
            select(DBTemplateVersion)
            .join(DBTemplate)
            .where(
                DBTemplate.key == key,
                DBTemplate.channel == channel,
                DBTemplate.tenant_id == tenant_id,
                DBTemplateVersion.language == language,
                DBTemplateVersion.status == TemplateStatus.PUBLISHED,
                DBTemplateVersion.is_current == True
            )
        )
        result = await self.session.execute(query)
        version = result.scalar_one_or_none()
        
        if version:
            return version

        # Base language fallback
        if "-" in language:
            base_lang = language.split("-")[0]
            query_base = (
                select(DBTemplateVersion)
                .join(DBTemplate)
                .where(
                    DBTemplate.key == key,
                    DBTemplate.channel == channel,
                    DBTemplate.tenant_id == tenant_id,
                    DBTemplateVersion.language == base_lang,
                    DBTemplateVersion.status == TemplateStatus.PUBLISHED,
                    DBTemplateVersion.is_current == True
                )
            )
            result_base = await self.session.execute(query_base)
            version_base = result_base.scalar_one_or_none()
            
            if version_base:
                return version_base

        return None
