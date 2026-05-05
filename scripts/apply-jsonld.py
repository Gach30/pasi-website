"""Apply Phase 3 JSON-LD structured data to each HTML page.

Inserts Organization (all pages), WebSite (homepage only), and
BreadcrumbList (non-homepage) inside <head>, just before </head>.

Idempotent: removes any prior Pasi JSON-LD block before inserting fresh.
"""
import re
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
DOMAIN = "https://pasi.capital"

ORG_DESCRIPTION = (
    "Pasi es una startup que construye una plataforma móvil de inversión que da a "
    "usuarios retail en Venezuela y América Latina acceso al mercado de valores de "
    "EE.UU. Los usuarios compran acciones tokenizadas y ETFs de EE.UU. — incluyendo "
    "xStocks emitidos por Backed Finance y activos tokenizados de Ondo — usando "
    "stablecoins (USDC, USDT), con liquidación on-chain en Solana vía Jupiter "
    "aggregator. Pasi planea eventualmente integrar la Bolsa de Caracas para "
    "expandir el acceso a la renta variable local venezolana."
)

ORGANIZATION = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pasi",
    "url": DOMAIN,
    "logo": f"{DOMAIN}/icon-512.png",
    "description": ORG_DESCRIPTION,
    "foundingDate": "2026",
    "sameAs": [
        "https://x.com/pasi_app",
        "https://www.instagram.com/pasi.app",
    ],
    "contactPoint": {
        "@type": "ContactPoint",
        "email": "gabriel@pasi.capital",
        "contactType": "customer support",
        "availableLanguage": ["Spanish", "English"],
    },
}

WEBSITE = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Pasi",
    "url": DOMAIN,
    "inLanguage": ["es-VE", "en-US"],
    "publisher": {"@type": "Organization", "name": "Pasi"},
}

# Per-page breadcrumb labels (in Spanish since the site is Spanish-first)
BREADCRUMBS = {
    "como-funciona.html": ("Cómo funciona", "/como-funciona"),
    "seguridad.html":      ("Seguridad y custodia", "/seguridad"),
    "ayuda.html":          ("Preguntas frecuentes", "/ayuda"),
    "nosotros.html":       ("Sobre Pasi", "/nosotros"),
    "waitlist.html":       ("Lista de espera", "/waitlist"),
}


def breadcrumb_for(label, path):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": f"{DOMAIN}/"},
            {"@type": "ListItem", "position": 2, "name": label, "item": f"{DOMAIN}{path}"},
        ],
    }


# Wrap any JSON-LD block produced by this script with these markers so future
# runs can find and replace cleanly without disturbing other inline scripts.
START_MARK = "<!-- pasi-jsonld:start -->"
END_MARK   = "<!-- pasi-jsonld:end -->"


def render_block(blocks):
    parts = [START_MARK]
    for b in blocks:
        # ensure_ascii=False keeps Spanish accents readable in source
        parts.append(f'<script type="application/ld+json">\n{json.dumps(b, ensure_ascii=False, indent=2)}\n</script>')
    parts.append(END_MARK)
    return "\n".join(parts)


def insert_or_replace(html, payload):
    block_re = re.compile(re.escape(START_MARK) + r".*?" + re.escape(END_MARK), re.DOTALL)
    if block_re.search(html):
        return block_re.sub(payload, html, count=1)
    # No prior block — insert just before </head>
    return html.replace("</head>", payload + "\n</head>", 1)


def main():
    pages = [
        ("index.html", [ORGANIZATION, WEBSITE]),
    ]
    for fname, (label, path) in BREADCRUMBS.items():
        pages.append((fname, [ORGANIZATION, breadcrumb_for(label, path)]))

    for fname, blocks in pages:
        path = ROOT / fname
        content = path.read_text(encoding="utf-8")
        payload = render_block(blocks)
        new_content = insert_or_replace(content, payload)
        if new_content == content:
            print(f"!! {fname}: no change")
            continue
        path.write_text(new_content, encoding="utf-8")
        print(f"updated {fname} with {len(blocks)} JSON-LD block(s)")


if __name__ == "__main__":
    main()
