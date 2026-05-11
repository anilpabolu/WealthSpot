"""Template rendering: Jinja2 variable substitution, optional MJML→HTML, html2text fallback."""

from __future__ import annotations

import logging

from jinja2 import BaseLoader, Environment, Undefined, TemplateError

from app.comm.exceptions import TemplateRenderError

log = logging.getLogger(__name__)

# Lazy-imported optionals
_html2text = None
_mjml_fn = None


def _get_html2text():
    global _html2text
    if _html2text is None:
        try:
            import html2text as _h2t  # type: ignore[import-not-found]  # pyright: ignore[reportMissingImports]

            _h2t_instance = _h2t.HTML2Text()
            _h2t_instance.ignore_links = False
            _html2text = _h2t_instance
        except ImportError:
            log.warning("html2text not installed; text fallback will mirror HTML")
    return _html2text


def _get_mjml():
    global _mjml_fn
    if _mjml_fn is None:
        try:
            from mjml import mjml2html  # type: ignore[import-not-found]

            _mjml_fn = mjml2html
        except ImportError:
            log.warning("mjml not installed; MJML→HTML conversion disabled")
    return _mjml_fn


_jinja_env = Environment(loader=BaseLoader(), undefined=Undefined, autoescape=False)


def _render_jinja(template_str: str | None, variables: dict) -> str | None:
    if not template_str:
        return None
    try:
        tmpl = _jinja_env.from_string(template_str)
        return tmpl.render(**variables)
    except TemplateError as exc:
        raise TemplateRenderError(f"Jinja2 render failed: {exc}") from exc


def _mjml_to_html(mjml_source: str) -> str:
    fn = _get_mjml()
    if fn is None:
        return mjml_source
    result = fn(mjml_source)
    if result.get("errors"):
        errors = result["errors"]
        raise TemplateRenderError(f"MJML compile error: {errors}")
    return result["html"]


def render(
    body_mjml: str | None,
    body_html: str | None,
    body_text: str | None,
    subject: str | None,
    variables: dict,
) -> tuple[str | None, str | None, str | None]:
    """
    Returns: (rendered_subject, rendered_html, rendered_text)

    Priority:
      - HTML: mjml → html → (mjml source itself)
      - Text: explicit text → html2text(html) → plain html
    """
    rendered_subject = _render_jinja(subject, variables)

    # 1. Render MJML source if present (used to create HTML)
    rendered_html: str | None = None
    if body_mjml:
        try:
            rendered_mjml_src = _render_jinja(body_mjml, variables) or ""
            rendered_html = _mjml_to_html(rendered_mjml_src)
        except TemplateRenderError:
            raise
    else:
        rendered_html = _render_jinja(body_html, variables)

    # 2. Plaintext
    if body_text:
        rendered_text = _render_jinja(body_text, variables)
    elif rendered_html:
        h2t = _get_html2text()
        if h2t:
            try:
                rendered_text = h2t.handle(rendered_html)
            except Exception:
                rendered_text = rendered_html
        else:
            rendered_text = rendered_html
    else:
        rendered_text = None

    return rendered_subject, rendered_html, rendered_text
