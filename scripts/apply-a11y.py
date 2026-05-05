"""Apply Phase 4 a11y fixes (the safe ones — skip link, <main>, nav label,
SVG aria-hidden, skip-link CSS).

Heading hierarchy fixes are NOT applied here — they require per-page judgment.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
PAGES = ["index.html", "como-funciona.html", "seguridad.html", "ayuda.html", "nosotros.html", "waitlist.html"]

SKIP_LINK_HTML = '<a href="#main" class="skip-link">Saltar al contenido principal</a>\n'
SKIP_LINK_CSS = (
    ".skip-link{position:absolute;left:-9999px;top:0;background:var(--aquamarine);"
    "color:var(--black);padding:.75rem 1.25rem;font-weight:600;text-decoration:none;"
    "z-index:1000}\n"
    ".skip-link:focus{left:0}\n"
)


def step_nav_aria(html):
    """Add aria-label to <nav id=\"nav\"> opening tag, only if that specific tag lacks it."""
    new = re.sub(
        r'<nav id="nav"(?![^>]*\baria-label=)([^>]*)>',
        r'<nav id="nav" aria-label="Navegación principal"\1>',
        html,
        count=1,
    )
    return new, new != html


def step_skip_link(html):
    """Insert skip link as first child of <body>."""
    if 'class="skip-link"' in html:
        return html, False
    new = re.sub(r"(<body[^>]*>)\s*\n?", r"\1\n" + SKIP_LINK_HTML, html, count=1)
    return new, new != html


def step_skip_link_css(html):
    """Append skip-link CSS to first <style> block (right before its closing </style>)."""
    if ".skip-link{" in html:
        return html, False
    new = html.replace("</style>", SKIP_LINK_CSS + "</style>", 1)
    return new, new != html


def step_main_wrap(html):
    """Wrap from first <section to <footer in <main id=\"main\">...</main>.
    This keeps mobile drawer/overlay (which sit between </nav> and the first <section>)
    OUTSIDE the main landmark."""
    if '<main id="main">' in html:
        return html, False
    # Insert <main id="main"> right before the first <section opening tag
    m1 = re.search(r"<section\s", html)
    if not m1:
        return html, False
    # Insert </main> right before the first <footer opening tag
    m2 = re.search(r"<footer\s|<footer>", html)
    if not m2:
        return html, False
    a, b = m1.start(), m2.start()
    new = html[:a] + '<main id="main">\n' + html[a:b] + '</main>\n' + html[b:]
    return new, True


def step_svg_aria_hidden(html):
    """Add aria-hidden=\"true\" to every <svg that doesn't already have it."""
    # Match <svg followed by something other than 'aria-hidden'
    pattern = re.compile(r"<svg(?![^>]*\baria-hidden=)([^>]*)>")
    new, n = pattern.subn(r'<svg aria-hidden="true"\1>', html)
    return new, n > 0


STEPS = [
    ("nav aria-label",      step_nav_aria),
    ("skip link",           step_skip_link),
    ("skip link CSS",       step_skip_link_css),
    ("<main> wrap",         step_main_wrap),
    ("SVG aria-hidden",     step_svg_aria_hidden),
]


def main():
    for fname in PAGES:
        path = ROOT / fname
        html = path.read_text(encoding="utf-8")
        out = html
        results = []
        for label, fn in STEPS:
            out, changed = fn(out)
            results.append((label, changed))
        if out != html:
            path.write_text(out, encoding="utf-8")
            applied = ", ".join(l for l, c in results if c) or "no-op"
            print(f"{fname}: {applied}")
        else:
            print(f"{fname}: no changes (already a11y-fixed)")


if __name__ == "__main__":
    main()
