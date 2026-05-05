"""Phase 4 part 2: fix heading hierarchy without changing visuals.

For each affected page, we change BOTH:
- the HTML tag (e.g. h3 -> h2 on specific headings only, identified by data-es text),
- the CSS selector that styles them (e.g. `.cat-card h3` -> `.cat-card h2`).

This keeps every visual style identical while fixing the semantic hierarchy.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

# (file, container_class, old_level, new_level, list_of_data_es_anchors)
FIXES = [
    ("como-funciona.html", "journey-text", 3, 2,
        ["Crea tu cuenta", "Deposita USDT", "Elige e invierte"]),
    ("seguridad.html", "pillar-text", 3, 2,
        ["Self-custody nativo", "Fondos segregados", "Todo verificable"]),
    ("seguridad.html", "cert-card", 4, 3,
        ["Encriptación AES-256", "2FA + Biometría", "KYC/AML regulado"]),
    ("ayuda.html", "cat-card", 3, 2,
        ["Cuenta y registro", "Depósitos y retiros", "Inversiones",
         "Seguridad", "Legal y regulatorio", "General"]),
    ("nosotros.html", "value-left", 4, 3,
        ["Acceso real", "Sin hype. Sin aparentar.", "Invertir es esencial"]),
    ("waitlist.html", "fs-card", 4, 3,
        ["Self-custody", "Desde $1 USDT", "-30% fees"]),
]


def apply_fix(html, container_class, old_level, new_level, anchors):
    """Returns (new_html, css_swaps, tag_swaps)."""
    css_swaps = 0
    tag_swaps = 0

    # 1) CSS selector swap: `.<container_class> h<old>` -> `.<container_class> h<new>`
    css_pat = re.compile(rf"(\.{re.escape(container_class)}\s+)h{old_level}\b")
    new_html, css_swaps = css_pat.subn(rf"\1h{new_level}", html)

    # 2) Tag swap, anchored on data-es value to avoid hitting unrelated h3s
    for anchor in anchors:
        # Match: <hN data-es="anchor"...>...</hN>
        # We'll allow any other attributes between hN and >.
        anchor_re = re.escape(anchor)
        full_pat = re.compile(
            rf'(<)h{old_level}(\s[^>]*data-es="{anchor_re}"[^>]*>.*?</)h{old_level}(>)',
            re.DOTALL,
        )
        new_html, n = full_pat.subn(rf"\1h{new_level}\2h{new_level}\3", new_html)
        tag_swaps += n
        if n != 1:
            print(f"  ! anchor '{anchor}' matched {n} times (expected 1)")

    return new_html, css_swaps, tag_swaps


def main():
    # Group fixes by file so we apply all of them per-file in one pass
    from collections import defaultdict
    by_file = defaultdict(list)
    for f in FIXES:
        by_file[f[0]].append(f[1:])

    for fname, jobs in by_file.items():
        path = ROOT / fname
        html = path.read_text(encoding="utf-8")
        original = html
        print(f"=== {fname} ===")
        for container_class, old_level, new_level, anchors in jobs:
            html, css_swaps, tag_swaps = apply_fix(html, container_class, old_level, new_level, anchors)
            print(f"  .{container_class}: h{old_level} -> h{new_level}  (CSS:{css_swaps} tags:{tag_swaps})")
        if html != original:
            path.write_text(html, encoding="utf-8")
            print(f"  saved.")
        else:
            print(f"  no change.")


if __name__ == "__main__":
    main()
