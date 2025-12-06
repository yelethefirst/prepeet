from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_db
from app.domain.templates.schemas import RenderRequest, RenderResponse
from app.domain.templates.services import TemplateService
from app.core.security import verify_service_token
from app.domain.templates.exceptions import InvalidTemplateSyntax

router = APIRouter(dependencies=[Depends(verify_service_token)])


@router.post("/", response_model=RenderResponse)
async def render_template(
    request: RenderRequest,
    db: AsyncSession = Depends(get_db)
):
    service = TemplateService(db)
    
    strict = request.options.get("strict", True)
    
    try:
        result = await service.resolve_and_render(
            key=request.template_key,
            channel=request.channel,
            tenant_id=request.tenant_id,
            language=request.language,
            data=request.data,
            strict=strict
        )
    except InvalidTemplateSyntax as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result:
        raise HTTPException(status_code=404, detail="Template not found for these criteria")

    return RenderResponse(
        template_key=request.template_key,
        channel=request.channel,
        language_used=result["version"].language,
        version=result["version"].version,
        subject=result["subject"],
        body_html=result["body_html"],
        body_text=result["body_text"]
    )
