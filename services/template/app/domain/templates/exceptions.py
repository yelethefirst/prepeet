class TemplateException(Exception):
    """Base exception for template domain."""
    pass

class TemplateNotFound(TemplateException):
    def __init__(self, detail: str = "Template not found"):
        self.detail = detail
        super().__init__(detail)

class VersionNotFound(TemplateException):
    def __init__(self, detail: str = "Template version not found"):
        self.detail = detail
        super().__init__(detail)

class DuplicateTemplateError(TemplateException):
    def __init__(self, detail: str = "Template already exists"):
        self.detail = detail
        super().__init__(detail)

class InvalidTemplateSyntax(TemplateException):
    def __init__(self, detail: str = "Invalid template syntax"):
        self.detail = detail
        super().__init__(detail)
