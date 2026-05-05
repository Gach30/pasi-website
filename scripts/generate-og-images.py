"""Generate Pasi OG cards (1200x630) via Playwright + HTML."""
from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path(__file__).parent.parent / "og"

CARDS = [
    {
        "slug": "index",
        "label": "Pasi",
        "headline": "Invierte en acciones de EE.UU. desde Venezuela",
        "tagline": "Con stablecoins. Sin banco en EE.UU. Sin mínimos.",
    },
    {
        "slug": "como-funciona",
        "label": "Cómo funciona",
        "headline": "De tu USDT a tu primera acción del S&P 500",
        "tagline": "Tres pasos. Liquidación on-chain en Solana.",
    },
    {
        "slug": "seguridad",
        "label": "Seguridad",
        "headline": "Self-custody, fondos segregados, transparencia on-chain",
        "tagline": "Así protege Pasi tu dinero.",
    },
    {
        "slug": "ayuda",
        "label": "Ayuda",
        "headline": "Preguntas frecuentes sobre Pasi",
        "tagline": "Cuenta, depósitos, inversiones, seguridad.",
    },
    {
        "slug": "nosotros",
        "label": "Sobre Pasi",
        "headline": "Construido por venezolanos que vivieron la misma exclusión",
        "tagline": "Conoce al equipo detrás de Pasi.",
    },
    {
        "slug": "waitlist",
        "label": "Waitlist",
        "headline": "Únete a la lista de espera",
        "tagline": "Sé de los primeros en invertir desde tu teléfono.",
    },
]

TEMPLATE = """<!doctype html>
<html><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:#050505;color:#fff;font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
.card{position:relative;width:1200px;height:630px;padding:72px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
.grid{position:absolute;inset:0;background-image:linear-gradient(#222 1px,transparent 1px),linear-gradient(90deg,#222 1px,transparent 1px);background-size:60px 60px;opacity:.35;
mask-image:radial-gradient(ellipse 80% 60% at 75% 40%,black 20%,transparent 70%);
-webkit-mask-image:radial-gradient(ellipse 80% 60% at 75% 40%,black 20%,transparent 70%)}
.glow{position:absolute;width:780px;height:780px;right:-120px;top:-120px;background:radial-gradient(circle,rgba(0,224,158,0.22) 0%,rgba(0,224,158,0.08) 35%,transparent 70%);pointer-events:none}
.top{position:relative;display:flex;align-items:center;gap:14px;z-index:2}
.logo-mark{width:48px;height:48px}
.logo-text{font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#fff}
.label{position:relative;z-index:2;color:#00E09E;font-size:18px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase}
.body{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;justify-content:center;max-width:1000px}
h1{font-size:62px;font-weight:700;letter-spacing:-1.5px;line-height:1.08;color:#fff;margin-bottom:24px}
.tagline{font-size:24px;color:rgba(255,255,255,0.5);font-weight:400;line-height:1.4;max-width:820px}
.foot{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;color:rgba(255,255,255,0.4);font-size:18px;font-weight:500}
.foot .domain{color:#00E09E;font-weight:600}
.divider{height:1px;background:linear-gradient(90deg,transparent,rgba(0,224,158,0.25),transparent);margin-bottom:18px}
</style></head>
<body><div class="card">
<div class="grid"></div>
<div class="glow"></div>
<div class="top">
  <svg class="logo-mark" viewBox="0 0 28 28" fill="none">
    <rect x="2" y="2" width="24" height="24" rx="4" stroke="#00E09E" stroke-width="1.5" fill="none"/>
    <line x1="9" y1="9" x2="19" y2="19" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="19" y1="9" x2="9" y2="19" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  <span class="logo-text">Pasi</span>
</div>
<div class="body">
  <div class="label">__LABEL__</div>
  <div style="height:18px"></div>
  <h1>__HEADLINE__</h1>
  <div class="tagline">__TAGLINE__</div>
</div>
<div>
  <div class="divider"></div>
  <div class="foot">
    <span>Inversión móvil para LatAm</span>
    <span class="domain">pasi.capital</span>
  </div>
</div>
</div></body></html>
"""


def build_html(card):
    return (
        TEMPLATE
        .replace("__LABEL__", card["label"])
        .replace("__HEADLINE__", card["headline"])
        .replace("__TAGLINE__", card["tagline"])
    )


def main(only_slug=None):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        page = ctx.new_page()
        for card in CARDS:
            if only_slug and card["slug"] != only_slug:
                continue
            html = build_html(card)
            page.set_content(html, wait_until="networkidle")
            # Give Inter a moment to render
            page.wait_for_timeout(300)
            out = OUT / f"{card['slug']}.png"
            page.screenshot(path=str(out), clip={"x": 0, "y": 0, "width": 1200, "height": 630}, type="png")
            print(f"wrote {out.name}")
        browser.close()


if __name__ == "__main__":
    import sys
    only = sys.argv[1] if len(sys.argv) > 1 else None
    main(only)
