import pytest
from jinja2 import UndefinedError, TemplateSyntaxError

from app.domain.templates.renderer import TemplateRenderer


class TestTemplateRenderer:
    def setup_method(self):
        self.renderer = TemplateRenderer()

    def test_basic_substitution(self):
        content = "Hello {{ name }}!"
        data = {"name": "World"}
        assert self.renderer.render(content, data) == "Hello World!"

    def test_strict_mode_missing_variable(self):
        content = "Hello {{ name }}!"
        data = {}
        with pytest.raises(UndefinedError):
            self.renderer.render(content, data, strict=True)

    def test_forgiving_mode_missing_variable(self):
        content = "Hello {{ name }}!"
        data = {}
        # In forgiving mode (Undefined), it usually renders as empty string
        assert self.renderer.render(content, data, strict=False) == "Hello !"

    def test_syntax_error(self):
        content = "Hello {{ name"  # Unclosed tag
        data = {"name": "World"}
        with pytest.raises(TemplateSyntaxError):
            self.renderer.render(content, data)

    def test_validate_syntax_valid(self):
        assert self.renderer.validate_syntax("Hello {{ name }}") is None

    def test_validate_syntax_invalid(self):
        error = self.renderer.validate_syntax("Hello {{ name")
        assert error is not None
        assert "Syntax error" in error
