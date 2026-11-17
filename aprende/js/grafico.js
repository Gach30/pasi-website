/* ==========================================================================
   grafico.js — draws the S&P 500 chart of chapter 8.

   The data comes from js/datos-sp500.js (month-end closes, 2000 to 2026) and
   the four big drops come from CALC.caidas in js/config.js.

   The vertical axis is proportional (logarithmic): a 50% fall looks the same
   size whether the index was at 1,500 or at 6,000. On a plain axis the falls
   of 2000 and 2008 would look tiny next to today's numbers, which would be
   misleading in a chapter about how deep falls can be.

   The finished chart is left in window.GRAFICO so that js/escenas.js can draw
   the line little by little as the reader scrolls.
   ========================================================================== */
(function () {
  "use strict";

  const svg = document.querySelector("#grafico-sp500 svg");
  if (!svg || typeof SP500 === "undefined") return;

  const NS = "http://www.w3.org/2000/svg";
  const ANCHO = 360, ALTO = 300;
  const MARGEN = { izq: 6, der: 8, arriba: 30, abajo: 22 };
  const cierres = SP500.cierres;
  const [anioInicial, mesInicial] = SP500.inicio.split("-").map(Number);

  // month "2008-10" -> position in the list of closes
  const posicion = (anioMes) => {
    const [a, m] = anioMes.split("-").map(Number);
    return Math.max(0, Math.min(cierres.length - 1, (a - anioInicial) * 12 + (m - mesInicial)));
  };
  const X = (i) => MARGEN.izq + (ANCHO - MARGEN.izq - MARGEN.der) * i / (cierres.length - 1);
  const LOG_MIN = Math.log(Math.min(...cierres) * 0.9);
  const LOG_MAX = Math.log(Math.max(...cierres) * 1.06);
  const Y = (valor) => MARGEN.arriba + (ALTO - MARGEN.arriba - MARGEN.abajo) * (1 - (Math.log(valor) - LOG_MIN) / (LOG_MAX - LOG_MIN));

  function crear(tipo, atributos, padre) {
    const el = document.createElementNS(NS, tipo);
    for (const nombre in atributos) el.setAttribute(nombre, atributos[nombre]);
    (padre || svg).append(el);
    return el;
  }

  /* Year marks along the bottom */
  const base = ALTO - MARGEN.abajo;
  crear("line", { class: "grafico__eje", x1: MARGEN.izq, x2: ANCHO - MARGEN.der, y1: base, y2: base });
  for (let anio = anioInicial; anio <= anioInicial + Math.floor(cierres.length / 12); anio += 5) {
    const x = X(posicion(anio + "-01"));
    crear("line", { class: "grafico__eje", x1: x, x2: x, y1: base, y2: base + 4 });
    const texto = crear("text", { x: x, y: base + 15, "text-anchor": anio === anioInicial ? "start" : "middle" });
    texto.textContent = anio;
  }

  /* The four falls: a shaded band from the peak to the lowest point, plus its percentage */
  const bandas = [], rotulos = [], fondos = [];
  const centros = CALC.caidas.map((c) => (X(posicion(c.desde)) + X(posicion(c.hasta))) / 2);
  CALC.caidas.forEach((caida, k) => {
    const x1 = X(posicion(caida.desde));
    const x2 = Math.max(X(posicion(caida.hasta)), x1 + 5);
    bandas.push(crear("rect", { class: "caida", x: x1, y: MARGEN.arriba - 4, width: x2 - x1, height: base - MARGEN.arriba + 4, rx: 2 }));

    // Two falls close together (2020 and 2022) get their labels pushed apart
    let ancla = "middle", x = centros[k];
    if (k + 1 < centros.length && centros[k + 1] - centros[k] < 42) { ancla = "end"; x = x2 + 1; }
    if (k > 0 && centros[k] - centros[k - 1] < 42) { ancla = "start"; x = x1 - 1; }
    const grupo = crear("g", { class: "hito" });
    const pct = crear("text", { class: "hito__pct", x: x, y: MARGEN.arriba - 9, "text-anchor": ancla }, grupo);
    pct.textContent = "−" + Math.abs(caida.caida) + "%";
    rotulos.push(grupo);
    fondos.push(posicion(caida.hasta));
  });

  /* The line itself. While building it, keep the running length so we know how
     far along the line each lowest point is (escenas.js needs that). */
  let trazo = "", largo = 0;
  const acumulado = [0];
  cierres.forEach((valor, i) => {
    const x = X(i), y = Y(valor);
    trazo += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    if (i) {
      const dx = x - X(i - 1), dy = y - Y(cierres[i - 1]);
      largo += Math.sqrt(dx * dx + dy * dy);
      acumulado.push(largo);
    }
  });
  const linea = crear("path", { class: "grafico__linea", d: trazo });
  const ultimo = cierres.length - 1;
  const punto = crear("circle", { class: "grafico__hoy", cx: X(ultimo), cy: Y(cierres[ultimo]), r: 4 });

  window.GRAFICO = {
    linea: linea,
    punto: punto,
    bandas: bandas,
    rotulos: rotulos,
    largo: linea.getTotalLength ? linea.getTotalLength() : largo,
    // how far along the line (0 to 1) the lowest point of each fall is
    fracciones: fondos.map((i) => acumulado[i] / largo),
  };
})();
