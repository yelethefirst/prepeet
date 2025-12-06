import pytest
from pydantic import ValidationError

from app.domain.templates.models import TemplateVersionCreate, TemplateVersionUpdate

class TestTemplateValidation:
    def test_valid_jinja2(self):
        # Should not raise
        TemplateVersionCreate(
            language="en",
            subject="Hello {{ name }}",
            body_text="Welcome {{ name }}"
        )

    def test_invalid_jinja2_create(self):
        with pytest.raises(ValidationError) as excinfo:
            TemplateVersionCreate(
                language="en",
                subject="Hello {{ name",  # Missing closing braces
            )
        assert "Invalid template syntax" in str(excinfo.value)

    def test_invalid_jinja2_update(self):
        with pytest.raises(ValidationError) as excinfo:
            TemplateVersionUpdate(
                body_html="<div>{% if x %}</div>"  # Unclosed block
            )
        assert "Invalid template syntax" in str(excinfo.value)

    def test_mixed_valid_invalid(self):
        # Valid subject, invalid body
        with pytest.raises(ValidationError) as excinfo:
            TemplateVersionCreate(
                language="en",
                subject="Ok {{ x }}",
                body_text="Bad {{ y"
            )
        assert "body_text" in str(excinfo.value)
