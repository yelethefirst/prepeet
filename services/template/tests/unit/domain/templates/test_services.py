import pytest
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.templates.services import TemplateService
from app.domain.templates.models import ChannelType, TemplateCreate
from app.domain.templates.exceptions import DuplicateTemplateError
from app.infrastructure.db.models.templates import TemplateVersion

# We need to update existing tests to match the new Service capabilities if needed.
# But focusing on regression testing first via integration tests.

@pytest.fixture
def mock_session():
    return AsyncMock(spec=AsyncSession)

@pytest.mark.asyncio
class TestTemplateServiceLogic:
    
    async def test_resolve_exact_match(self, mock_session):
        service = TemplateService(mock_session)
        
        mock_result = MagicMock()
        expected_version = TemplateVersion(id="123", language="en-GB")
        mock_result.scalar_one_or_none.return_value = expected_version
        mock_session.execute.return_value = mock_result

        result = await service.resolve_template_version(
            key="order_created",
            channel=ChannelType.EMAIL,
            tenant_id="t1",
            language="en-GB"
        )
        assert result == expected_version

    # Add more unit tests for new service methods if desired
