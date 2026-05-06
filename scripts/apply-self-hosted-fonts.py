"""Phase 5: swap Google Fonts <link> to self-hosted Inter.

For each HTML page:
  1) Remove the two `<link rel="preconnect">` lines pointing at Google.
  2) Remove the `<link href="https://fonts.googleapis.com/css2?...">` line.
  3) Add `<link rel="preload">` for the 700-weight woff2 (LCP-critical).
  4) Inject a self-hosted @font-face block at the top of the inline <style>.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
PAGES = ["index.html", "como-funciona.html", "seguridad.html", "ayuda.html",
         "nosotros.html", "waitlist.html", "404.html"]

UNICODE_RANGE = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"

FONT_FACE_CSS = "\n".join([
    f"@font-face{{font-family:'Inter';font-style:normal;font-weight:{w};font-display:swap;"
    f"src:url('/fonts/inter-{w}-latin.woff2') format('woff2');"
    f"unicode-range:{UNICODE_RANGE}}}"
    for w in (400, 500, 600, 700)
]) + "\n"

PRELOAD_LINK = '<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-700-latin.woff2" crossorigin />\n'


def transform(html):
    out = html
    # 1) drop the preconnect lines (only the two Google Fonts ones)
    out = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com"\s*/>\s*\n', '', out)
    out = re.sub(r'<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin\s*/>\s*\n', '', out)
    # 2) drop the Google Fonts stylesheet link
    out = re.sub(
        r'<link href="https://fonts\.googleapis\.com/css2\?family=Inter[^"]+" rel="stylesheet"\s*/>\s*\n',
        '',
        out,
    )
    # 3) add preload right after </title> ... actually right before existing favicon block.
    if 'rel="preload"' not in out or '/fonts/inter-700-latin.woff2' not in out:
        # Insert just before the manifest link, which we know exists post-Phase 2.
        out = out.replace(
            '<link rel="manifest" href="/site.webmanifest" />',
            PRELOAD_LINK + '<link rel="manifest" href="/site.webmanifest" />',
            1,
        )
    # 4) inject the @font-face block at the top of the first <style> tag's content
    if "@font-face{font-family:'Inter'" not in out:
        out = re.sub(r'(<style>\s*)', r'\1' + FONT_FACE_CSS, out, count=1)
    return out


def main():
    for fname in PAGES:
        path = ROOT / fname
        if not path.exists():
            continue
        original = path.read_text(encoding="utf-8")
        new = transform(original)
        if new != original:
            path.write_text(new, encoding="utf-8")
            print(f"updated {fname}")
        else:
            print(f"no change in {fname}")


if __name__ == "__main__":
    main()
