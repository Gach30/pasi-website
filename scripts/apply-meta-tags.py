"""Apply Phase 2 meta tags to each HTML page.

Replaces existing <title>, <meta description>, and old favicon link.
Inserts canonical, OG, Twitter, robots, theme-color, manifest, full
favicon set after the description.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

PAGES = {
    "index.html": {
        "path": "/",
        "slug": "index",
        "title": "Pasi · Invierte en acciones de EE.UU. desde Venezuela",
        "desc":  "Plataforma móvil para invertir en acciones tokenizadas de EE.UU. desde Venezuela y LatAm usando stablecoins. Liquidación on-chain en Solana.",
        "og_alt": "Pasi — Invierte en acciones de EE.UU. desde Venezuela con stablecoins.",
    },
    "como-funciona.html": {
        "path": "/como-funciona",
        "slug": "como-funciona",
        "title": "Cómo funciona Pasi · Inversión con USDT y USDC",
        "desc":  "Compra acciones tokenizadas de EE.UU. en pocos pasos: deposita stablecoins, compra xStocks, custodia on-chain en Solana. Sin broker tradicional.",
        "og_alt": "Cómo funciona Pasi: de tu USDT a tu primera acción del S&P 500.",
    },
    "seguridad.html": {
        "path": "/seguridad",
        "slug": "seguridad",
        "title": "Seguridad y custodia · Pasi",
        "desc":  "Cómo Pasi protege tus activos: self-custody, fondos segregados, transparencia on-chain y arquitectura auditable.",
        "og_alt": "Seguridad y custodia en Pasi: self-custody y transparencia on-chain.",
    },
    "ayuda.html": {
        "path": "/ayuda",
        "slug": "ayuda",
        "title": "Preguntas frecuentes · Pasi",
        "desc":  "Respuestas a las preguntas más comunes sobre Pasi: cuenta, depósitos, inversiones, seguridad y soporte.",
        "og_alt": "Centro de ayuda de Pasi: respuestas claras a tus dudas.",
    },
    "nosotros.html": {
        "path": "/nosotros",
        "slug": "nosotros",
        "title": "Sobre Pasi · Equipo y misión",
        "desc":  "Conoce al equipo, la misión y la historia de Pasi. Una plataforma de inversión móvil para Venezuela y América Latina.",
        "og_alt": "El equipo detrás de Pasi: venezolanos construyendo inversión móvil para LatAm.",
    },
    "waitlist.html": {
        "path": "/waitlist",
        "slug": "waitlist",
        "title": "Únete a la lista de espera · Pasi",
        "desc":  "Sé de los primeros en acceder a Pasi cuando lancemos. Invierte en EE.UU. desde tu teléfono, con stablecoins.",
        "og_alt": "Únete al waitlist de Pasi.",
    },
}

DOMAIN = "https://pasi.capital"


def build_head_block(p):
    canonical = DOMAIN + p["path"]
    og_image = f"{DOMAIN}/og/{p['slug']}.png"
    return f"""<title>{p['title']}</title>
<meta name="description" content="{p['desc']}" />

<!-- Canonical -->
<link rel="canonical" href="{canonical}" />

<!-- Robots -->
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

<!-- Theme color -->
<meta name="theme-color" content="#00E09E" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="{canonical}" />
<meta property="og:title" content="{p['title']}" />
<meta property="og:description" content="{p['desc']}" />
<meta property="og:image" content="{og_image}" />
<meta property="og:image:width" content="2400" />
<meta property="og:image:height" content="1260" />
<meta property="og:image:alt" content="{p['og_alt']}" />
<meta property="og:locale" content="es_VE" />
<meta property="og:site_name" content="Pasi" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="{canonical}" />
<meta name="twitter:title" content="{p['title']}" />
<meta name="twitter:description" content="{p['desc']}" />
<meta name="twitter:image" content="{og_image}" />
<meta name="twitter:image:alt" content="{p['og_alt']}" />

<!-- Favicons + manifest -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />"""


# Matches the existing block in each file:
# <title>...</title>
# <meta name="description" content="..." />
# <link rel="icon" type="image/png" href="favicon.png" />
PATTERN = re.compile(
    r'<title>[^<]*</title>\s*\n'
    r'<meta name="description" content="[^"]*" />\s*\n'
    r'<link rel="icon" type="image/png" href="favicon\.png" />',
    re.MULTILINE,
)


def main():
    for fname, meta in PAGES.items():
        path = ROOT / fname
        content = path.read_text(encoding="utf-8")
        new_block = build_head_block(meta)
        new_content, n = PATTERN.subn(new_block, content, count=1)
        if n != 1:
            print(f"!! {fname}: pattern matched {n} times — skipping for safety")
            continue
        path.write_text(new_content, encoding="utf-8")
        print(f"updated {fname}")


if __name__ == "__main__":
    main()
