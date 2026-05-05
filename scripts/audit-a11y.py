"""Phase 4 accessibility audit — read-only.

Reports per-page issues; makes no changes. Use this output to scope
which fixes are worth applying.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from collections import Counter

ROOT = Path(__file__).parent.parent
PAGES = ["index.html", "como-funciona.html", "seguridad.html", "ayuda.html", "nosotros.html", "waitlist.html"]


def heading_outline(soup):
    """Return list of (level, text_preview) for h1..h6 in document order, body only."""
    body = soup.body or soup
    out = []
    for el in body.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        level = int(el.name[1])
        # Strip nested SVG/icon text noise; just use first 80 chars of stripped text
        text = el.get_text(" ", strip=True)[:80]
        out.append((level, text))
    return out


def heading_hierarchy_issues(outline):
    """Return list of issues like 'h2 -> h4 (skipped h3)'."""
    issues = []
    prev = None
    for level, _ in outline:
        if prev is not None and level > prev + 1:
            issues.append(f"jump h{prev} -> h{level}")
        prev = level
    return issues


def audit_page(path):
    html = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    body = soup.body
    if not body:
        return {"error": "no <body>"}

    # Headings
    outline = heading_outline(soup)
    h1_count = sum(1 for lvl, _ in outline if lvl == 1)

    # Landmarks
    has_main = bool(body.find("main"))
    navs = body.find_all("nav")
    navs_without_label = [n for n in navs if not (n.get("aria-label") or n.get("aria-labelledby"))]

    # SVGs in body
    svgs = body.find_all("svg")
    svg_total = len(svgs)
    # An SVG is "labeled" if it has aria-label, aria-labelledby, or contains a <title>
    svg_labeled = sum(
        1 for s in svgs
        if s.get("aria-label") or s.get("aria-labelledby") or s.find("title") or s.get("aria-hidden") == "true"
    )
    svg_unlabeled = svg_total - svg_labeled

    # Links: external w/o rel; non-descriptive text
    links = body.find_all("a", href=True)
    external_missing_rel = []
    bad_text_links = []
    GENERIC_TEXT = {"click here", "aquí", "aqui", "read more", "leer más", "leer mas", "more", "más", "mas"}
    for a in links:
        href = a.get("href", "")
        text = a.get_text(" ", strip=True).lower()
        target_blank = (a.get("target") == "_blank")
        rel = (a.get("rel") or [])
        if isinstance(rel, str):
            rel = rel.split()
        if href.startswith(("http://", "https://")) and target_blank:
            if "noopener" not in rel or "noreferrer" not in rel:
                external_missing_rel.append((href[:60], rel))
        if text in GENERIC_TEXT:
            bad_text_links.append((text, href[:60]))

    # Skip link: a link to #main / #content as one of the first focusable elements
    first_links = body.find_all("a", href=True, limit=3)
    has_skip_link = any(
        a.get("href", "").startswith("#") and "skip" in (a.get_text(strip=True).lower() + " " + (a.get("class") or [""])[0].lower() + " " + (a.get("href") or "").lower())
        or a.get("href") in ("#main", "#content", "#contenido", "#main-content")
        for a in first_links
    )

    return {
        "outline": outline,
        "h1_count": h1_count,
        "h1_skipped_levels": heading_hierarchy_issues(outline),
        "has_main": has_main,
        "nav_count": len(navs),
        "navs_without_label": len(navs_without_label),
        "svg_total": svg_total,
        "svg_labeled": svg_labeled,
        "svg_unlabeled": svg_unlabeled,
        "external_links_missing_rel": external_missing_rel,
        "bad_text_links": bad_text_links,
        "has_skip_link": has_skip_link,
    }


def main():
    print("# Phase 4 a11y audit — pasi-website\n")
    for fname in PAGES:
        p = ROOT / fname
        a = audit_page(p)
        if "error" in a:
            print(f"## {fname}: ERROR {a['error']}\n")
            continue
        print(f"## {fname}")
        print(f"  H1 count: {a['h1_count']}  (target: 1)")
        if a["h1_skipped_levels"]:
            print(f"  Heading order issues: {a['h1_skipped_levels']}")
        else:
            print(f"  Heading order: OK")
        # Show outline (first 12)
        print(f"  Outline:")
        for lvl, text in a["outline"][:12]:
            print(f"    h{lvl}: {text}")
        if len(a["outline"]) > 12:
            print(f"    ... and {len(a['outline'])-12} more")
        print(f"  <main>: {'yes' if a['has_main'] else 'NO'}")
        print(f"  <nav>: {a['nav_count']} total, {a['navs_without_label']} without aria-label")
        print(f"  SVGs: {a['svg_total']} total, {a['svg_unlabeled']} without label/aria-hidden")
        print(f"  External links missing rel=noopener noreferrer: {len(a['external_links_missing_rel'])}")
        for h, rel in a["external_links_missing_rel"][:3]:
            print(f"    - {h}  rel={rel}")
        print(f"  Generic-text links ('click here'/'aquí'/etc.): {len(a['bad_text_links'])}")
        for t, h in a["bad_text_links"][:3]:
            print(f"    - '{t}' -> {h}")
        print(f"  Skip link: {'yes' if a['has_skip_link'] else 'NO'}")
        print()


if __name__ == "__main__":
    main()
