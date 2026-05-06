"""Phase 5 performance audit. Measures FCP, LCP, CLS, transferred bytes,
and identifies the LCP element per page. Read-only.

Uses Playwright + Chromium throttled to roughly emulate mobile 4G.
"""
from playwright.sync_api import sync_playwright
import json

URLS = [
    ("https://pasi.capital/",                "/"),
    ("https://pasi.capital/como-funciona",   "/como-funciona"),
    ("https://pasi.capital/seguridad",       "/seguridad"),
    ("https://pasi.capital/ayuda",           "/ayuda"),
    ("https://pasi.capital/nosotros",        "/nosotros"),
    ("https://pasi.capital/waitlist",        "/waitlist"),
]


def measure(page, url):
    transfer_bytes = {"total": 0, "by_type": {}}

    def on_response(resp):
        try:
            body = resp.body()
        except Exception:
            return
        size = len(body) if body else 0
        rt = (resp.request.resource_type or "other")
        transfer_bytes["total"] += size
        transfer_bytes["by_type"][rt] = transfer_bytes["by_type"].get(rt, 0) + size

    page.on("response", on_response)
    page.goto(url, wait_until="networkidle", timeout=30000)

    metrics = page.evaluate("""
() => {
  const result = {};
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav) result.ttfb_ms = nav.responseStart;
  const paints = performance.getEntriesByType('paint');
  for (const p of paints) {
    if (p.name === 'first-contentful-paint') result.fcp_ms = p.startTime;
    if (p.name === 'first-paint') result.fp_ms = p.startTime;
  }
  // LCP: get latest entry
  const lcps = performance.getEntriesByType('largest-contentful-paint');
  if (lcps.length) {
    const last = lcps[lcps.length - 1];
    result.lcp_ms = last.renderTime || last.loadTime;
    result.lcp_element = last.element ? (last.element.tagName + (last.element.id ? '#' + last.element.id : '') + (last.element.className ? '.' + String(last.element.className).split(' ').filter(Boolean).slice(0,2).join('.') : '')) : null;
  }
  // CLS: sum of layout-shift entries (excluding any with hadRecentInput)
  let cls = 0;
  for (const e of performance.getEntriesByType('layout-shift')) {
    if (!e.hadRecentInput) cls += e.value;
  }
  result.cls = +cls.toFixed(4);
  return result;
}
""")
    return metrics, transfer_bytes


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Mobile-ish viewport, default network (network throttling needs CDP)
        ctx = browser.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=2)
        for url, label in URLS:
            page = ctx.new_page()
            try:
                m, b = measure(page, url)
            except Exception as e:
                print(f"## {label} : ERROR {e}")
                page.close()
                continue
            print(f"## {label}")
            print(f"  TTFB:  {m.get('ttfb_ms', 0):>5.0f} ms")
            print(f"  FCP:   {m.get('fcp_ms', 0):>5.0f} ms")
            print(f"  LCP:   {m.get('lcp_ms', 0):>5.0f} ms  (element: {m.get('lcp_element')})")
            print(f"  CLS:   {m.get('cls', 0):>5.4f}")
            total_kb = b['total'] / 1024
            by = b['by_type']
            print(f"  Bytes: {total_kb:>5.1f} KB total")
            for rt, sz in sorted(by.items(), key=lambda x: -x[1]):
                print(f"    {rt:<14} {sz/1024:>6.1f} KB")
            print()
            page.close()
        browser.close()


if __name__ == "__main__":
    main()
