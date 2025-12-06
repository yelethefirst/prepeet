from typing import Any, Dict, Optional
from jinja2 import Environment, StrictUndefined, Undefined, TemplateSyntaxError, BaseLoader


class TemplateRenderer:
    def __init__(self):
        # We don't use a loader because we render strings directly from DB
        self.env_strict = Environment(
            loader=BaseLoader(),
            undefined=StrictUndefined,
            autoescape=True
        )
        self.env_forgiving = Environment(
            loader=BaseLoader(),
            undefined=Undefined,
            autoescape=True
        )

    def render(
        self, 
        template_content: str, 
        data: Dict[str, Any], 
        strict: bool = True
    ) -> str:
        """
        Renders a template string with the provided data.
        
        Args:
            template_content: The variable-containing string (Jinja2 format).
            data: Dictionary of variables to substitute.
            strict: If True, raises error on missing variables. 
                    If False, missing variables are empty strings.
                    
        Returns:
            Rendered string.
            
        Raises:
            jinja2.exceptions.UndefinedError: If strict=True and variable missing.
            jinja2.exceptions.TemplateSyntaxError: If template syntax is invalid.
        """
        if not template_content:
            return ""

        env = self.env_strict if strict else self.env_forgiving
        
        try:
            # Create a template object from the string
            template = env.from_string(template_content)
            # Render it
            return template.render(**data)
        except (TemplateSyntaxError, Exception) as e:
            # Re-raise or wrap exception as needed.
            # strict=True will raise UndefinedError which inherits from Exception
            raise e

    def validate_syntax(self, template_content: str) -> Optional[str]:
        """
        Validates syntax of a template string. 
        Returns error message string if invalid, None if valid.
        """
        try:
            self.env_strict.parse(template_content)
            return None
        except TemplateSyntaxError as e:
            return f"Syntax error at line {e.lineno}: {e.message}"
