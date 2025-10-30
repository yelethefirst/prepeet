from __future__ import annotations

import os
from typing import Optional, Tuple
from jinja2 import Environment, FileSystemLoader, select_autoescape, TemplateNotFound
from .settings import settings

_env = Environment(
    loader=FileSystemLoader(settings.templates_path),
    autoescape=select_autoescape(["html", "xml"]),
    enable_async=False,
)


def render(template_id: str, locale: Optional[str], variables: dict) -> Tuple[Optional[str], Optional[str]]:
    """
    Returns (html, text), any may be None if not present.
    Template resolution order:
      1) <locale>/<template_id>.html/.txt
      2) default locale (settings.default_locale)
    """
    candidates = []
    if locale:
        candidates.append(os.path.join(locale, template_id))
    candidates.append(os.path.join(settings.default_locale, template_id))

    html = txt = None
    for base in candidates:
        try:
            html = html or _env.get_template(f"{base}.html").render(**variables)
        except TemplateNotFound:
            pass
        try:
            txt = txt or _env.get_template(f"{base}.txt").render(**variables)
        except TemplateNotFound:
            pass
        if html or txt:
            break
    return html, txt
