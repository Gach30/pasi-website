# Pasi.capital — SEO Audit (Phase 0)

**Date:** 2026-05-04
**Branch:** `seo` (created from `main`)
**Auditor:** Claude Code, per `pasi-seo-spec-v2.md`

---

## 1. Stack confirmation

| Item | Finding |
|------|---------|
| Hosting | Vercel (`Server: Vercel`, `X-Vercel-Cache: HIT`) |
| Production domain | `https://pasi.capital` (HTTP 200) |
| Vercel project | `pasi-website` (`prj_GoyPlFvyQACHyO9bEPB5mBrVCnFc`) |
| Stack | Static multi-page HTML, all content in raw HTML (no JS injection of content) |
| Repo layout | **Flat, no `/public/` directory** — all files live in repo root |
| `vercel.json` | `cleanUrls: true`, `trailingSlash: false`, security headers (`X-Frame-Options: DENY`, `nosniff`, `X-XSS-Protection`) |
| HSTS | Enabled (`max-age=63072000`) ✅ |
| Last production deploy | 2026-04-25 (matches `main`; the 4 unpushed `experiments` commits are not live) |

### Spec deviations confirmed

- **Files go in repo root**, not `/public/`. The spec writes `/public/robots.txt` etc. — for this site that becomes `/robots.txt` at repo root.
- **Clean URLs.** `cleanUrls: true` means `/como-funciona.html` → 308 redirect to `/como-funciona`. The spec's sitemap and canonical tags use `.html` suffixes; **those must be rewritten without `.html`**, otherwise every canonical and sitemap entry points at a redirecting URL.

---

## 2. Page inventory

Six production pages, all in repo root:

| File | Live URL (clean) | `<title>` | `<meta description>` |
|------|------------------|-----------|----------------------|
| `index.html` | `/` | `Pasi — Invierte sin fronteras` | "Invierte en acciones de EE.UU. desde Venezuela usando USDT y tu teléfono. Sin cuenta en banco en EE.UU.." |
| `como-funciona.html` | `/como-funciona` | `Cómo Funciona — Pasi` | "Así funciona Pasi: de tu USDT a tu primera acción en el S&P 500. Sin banco en EE.UU., sin mínimos." |
| `seguridad.html` | `/seguridad` | `Seguridad — Pasi` | "Self-custody, fondos segregados, y transparencia total. Así protege Pasi tu dinero." |
| `ayuda.html` | `/ayuda` | `Centro de Ayuda — Pasi` | "Respuestas a tus preguntas sobre Pasi. Cuenta, depósitos, inversiones, seguridad y más." |
| `nosotros.html` | `/nosotros` | `Sobre Pasi — Pasi` | "Construido por venezolanos que vivieron la misma exclusión. Conoce al equipo detrás de Pasi." |
| `waitlist.html` | `/waitlist` | `Waitlist — Pasi` | "Únete al waitlist de Pasi. Sé de los primeros en invertir en acciones de EE.UU. desde Venezuela." |

Plus untracked: `passage-section.html` (orphan, from experiments branch — not linked, not deployed).

### Title quality issues

- Most titles end with `— Pasi` but `nosotros.html` says `Sobre Pasi — Pasi` (redundant). Spec rewrites planned in Phase 2 fix this.
- `Waitlist — Pasi` should be `Únete a la lista de espera · Pasi` per spec — spec is correct here.

---

## 3. `<head>` completeness — what each page already has

✅ Present on all 6 pages:
- `<meta charset="UTF-8">`
- `<meta name="viewport" ...>`
- `<title>`
- `<meta name="description">`
- `<link rel="icon" type="image/png" href="favicon.png">`
- `<link rel="preconnect" href="https://fonts.googleapis.com">` + gstatic
- Inter from Google Fonts via `&display=swap`

❌ Missing on all 6 pages (Phase 1–3 will add):
- `<link rel="canonical">`
- All Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale`, `og:site_name`)
- All Twitter Card tags
- `<meta name="robots">`
- `<meta name="theme-color">`
- `<link rel="manifest">`
- `<link rel="apple-touch-icon">`
- All JSON-LD structured data (`Organization`, `WebSite`, `MobileApplication`, `BreadcrumbList`, `FAQPage`)
- `hreflang` (not applicable yet — see EN toggle finding below)
- Google / Bing site verification tags

---

## 4. Bilingualism — important finding

**EN is purely client-side.** Implementation in `index.html` lines 469–472:

```js
let currentLang = localStorage.getItem('pasi-lang') || 'es';
function applyLang() {
  document.documentElement.lang = currentLang;  // lang attr does update on toggle
  // swaps text via data-es / data-en attributes
}
function toggleLang() { ... localStorage.setItem('pasi-lang', currentLang); applyLang() }
```

What this means for SEO:
- **Initial HTML always renders in Spanish** — `<html lang="es">` is the static default.
- Googlebot does execute JS, but only Spanish content sits in raw HTML and Spanish is what gets indexed in practice.
- AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`) **do not execute JS** at all — they will only ever see Spanish.
- There is no separate URL for English (`/en/...`), so **`hreflang` is not applicable** today.

**Implication:** Pasi is effectively a Spanish-only site for search and AI engines. If English visibility matters, Phase 6+ should add real `/en/` paths (out of scope for v2 spec). Spec correctly notes this in section 2.1.

---

## 5. Images & media

**No `<img>` tags exist on any page.** All visuals are inline SVG (137 `<svg>` elements across the 6 pages: 48 in `index.html`, 36 in `ayuda.html`, etc.).

Implication for Phase 4 (alt tags):
- Standard `alt` audit doesn't apply — there are no raster images to label.
- For accessibility, decorative SVGs should have `aria-hidden="true"` and meaningful ones should have `<title>` elements or `aria-label`. **This needs a separate audit pass in Phase 4.**
- For Open Graph (Phase 2), OG images must be created from scratch as PNGs in `/og/` — there are no existing image assets to reuse besides `favicon.png` (32×32, too small).

---

## 6. Crawlability files — current state on production

| URL | Status | Action |
|-----|--------|--------|
| `https://pasi.capital/robots.txt` | **404** | Phase 1.1 |
| `https://pasi.capital/sitemap.xml` | **404** | Phase 1.2 |
| `https://pasi.capital/llms.txt` | **404** | Phase 1.3 |
| `https://pasi.capital/.well-known/security.txt` | **404** | Phase 1.4 |
| `https://pasi.capital/site.webmanifest` | **404** | Phase 1.5 |

---

## 7. Internal linking — finding

Nav links in all pages use `href="index.html"`, `href="como-funciona.html"`, etc. With `cleanUrls: true`, **every internal click triggers a 308 redirect** to the clean URL. Two costs:

1. SEO: 308s cost a tiny amount of crawl budget and are slightly weaker than direct 200s.
2. UX: extra round-trip on every nav click.

**Recommendation (not in spec):** rewrite internal hrefs to clean form (`href="/"`, `href="/como-funciona"`, etc.) as part of Phase 1 or Phase 2. Cheap, mechanical, and removes a permanent friction. **Flagging for your decision.**

---

## 8. Vercel security settings (spec Phase 0 item 5)

User confirmed: no "Block AI Bots" toggle is visible in Vercel dashboard → Settings → Security. This means the site is **not** blocking AI crawlers at the platform level — good. No action needed here.

---

## 9. Sitemap URLs — must use clean form

The spec's sitemap.xml uses `.html` URLs. Because of `cleanUrls: true`, those would all 308-redirect. The Phase 1 sitemap must use clean URLs:

```
https://pasi.capital/                    (instead of /index.html)
https://pasi.capital/como-funciona       (instead of /como-funciona.html)
https://pasi.capital/seguridad
https://pasi.capital/ayuda
https://pasi.capital/nosotros
https://pasi.capital/waitlist
```

Same correction applies to canonical tags in Phase 2 and BreadcrumbList items in Phase 3.

---

## 10. Summary of corrections to spec before Phase 1 begins

1. **Paths:** all `/public/foo` → `/foo` (repo root).
2. **URLs:** all `*.html` → clean form (no extension), in sitemap, canonicals, breadcrumbs, OG `og:url`, Twitter `twitter:url`, llms.txt links.
3. **Internal `href`s:** propose updating all nav links from `*.html` to clean form during Phase 1 or 2.
4. **Image alt audit (Phase 4):** reframe as SVG accessibility audit (`<title>`, `aria-label`, `aria-hidden`) — no `<img>` tags exist.
5. **EN translations:** confirmed JS-only, same URL. `hreflang` stays out until real `/en/` paths exist.

---

## Phase 0 status: COMPLETE

No code changes made. Awaiting human review before Phase 1 begins.
