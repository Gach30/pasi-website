"""Download Inter (woff2, latin subset) for self-hosting.

Fetches the Google Fonts CSS, parses the @font-face blocks, picks the
'latin' subset for each requested weight, and downloads the woff2 files
to /fonts/.
"""
import urllib.request
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
FONTS_DIR = ROOT / "fonts"
FONTS_DIR.mkdir(exist_ok=True)

CSS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=Inter:wght@400;500;600;700"
    "&display=swap"
)
WANTED_WEIGHTS = {"400", "500", "600", "700"}
WANTED_SUBSET = "latin"

# Modern browser UA — Google Fonts serves woff2 only to modern UAs.
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def http_get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def main():
    css = http_get(CSS_URL).decode("utf-8")

    # Parse blocks like: /* latin */\n@font-face {\n  ...  }
    block_re = re.compile(
        r"/\*\s*(?P<subset>[a-z0-9-]+)\s*\*/\s*"
        r"@font-face\s*\{(?P<body>.*?)\}",
        re.DOTALL,
    )

    found = {}  # weight -> (url, unicode_range)
    for m in block_re.finditer(css):
        subset = m.group("subset")
        if subset != WANTED_SUBSET:
            continue
        body = m.group("body")
        weight_m = re.search(r"font-weight:\s*(\d+)", body)
        url_m = re.search(r"url\((https://[^)]+\.woff2)\)", body)
        unicode_m = re.search(r"unicode-range:\s*([^;]+);", body)
        if not (weight_m and url_m):
            continue
        weight = weight_m.group(1)
        if weight not in WANTED_WEIGHTS:
            continue
        found[weight] = (url_m.group(1), unicode_m.group(1).strip() if unicode_m else None)

    missing = WANTED_WEIGHTS - set(found.keys())
    if missing:
        print(f"!! missing latin block for weights: {sorted(missing)}")

    # Download each
    for weight in sorted(found.keys()):
        url, urange = found[weight]
        data = http_get(url)
        out = FONTS_DIR / f"inter-{weight}-latin.woff2"
        out.write_bytes(data)
        print(f"wrote {out.relative_to(ROOT)} ({len(data)/1024:.1f} KB)")
        if urange:
            print(f"  unicode-range: {urange}")

    # Save the unicode-range used (we'll embed it in the inline @font-face for
    # correct subset signaling)
    if found:
        any_range = next(iter(found.values()))[1]
        if any_range:
            (FONTS_DIR / "_unicode-range-latin.txt").write_text(any_range, encoding="utf-8")
            print(f"\nlatin unicode-range saved to fonts/_unicode-range-latin.txt")


if __name__ == "__main__":
    main()
