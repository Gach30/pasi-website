/* ==========================================================================
   calculadoras.js — every calculator on the page. All the numbers they use
   come from js/config.js (the CALC object), so nothing is hidden in here.

   1. Number helpers (Spanish format)
   2. Chapter 2 — what inflation does to savings
   3. Chapter 6 — compound interest, and "starting early beats starting big"
   4. Chapter 7 — turn a monthly promise into a yearly one
   5. Chapter 7 — the scam checklist verdict
   6. Chapter 8 — "pasito a pasito" (investing the same amount every month)
   7. Chapter 9 — emergency fund
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const calmado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Number helpers --------------------------------------------------- */
  // 1234567 -> "1.234.567"
  function miles(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  // 1234.5 -> "$1.235"
  function dinero(n) { return "$" + miles(n); }

  // Illustrative totals look falsely exact to the last dollar, so round them a little
  function redondear(n) {
    if (n >= 10000) return Math.round(n / 100) * 100;
    if (n >= 1000) return Math.round(n / 10) * 10;
    return Math.round(n);
  }

  // One decimal, Spanish comma: 92.71 -> "92,7"
  function unDecimal(n) {
    const t = (Math.round(n * 10) / 10).toFixed(1).replace(".", ",");
    return t.endsWith(",0") ? t.slice(0, -2) : t;
  }

  // Very large amounts in words. In Spanish: millón = 10^6, billón = 10^12, trillón = 10^18
  function dineroGrande(n) {
    if (n < 1e6) return dinero(n);
    if (n < 1e9) return "$" + unDecimal(n / 1e6) + " millones";
    if (n < 1e12) return "$" + miles(n / 1e6) + " millones";
    if (n < 1e15) return "$" + unDecimal(n / 1e12) + " billones";
    if (n < 1e18) return "$" + miles(n / 1e12) + " billones";
    if (n < 1e21) return "$" + unDecimal(n / 1e18) + " trillones";
    return "un número de " + (Math.floor(Math.log10(n)) + 1) + " cifras";
  }

  // 0.796 -> "80%";  0.1003 -> "10%";  0.134 -> "13,4%";  36.78 -> "3.678%"
  function porcentaje(x) {
    const p = x * 100;
    return (p < 20 ? unDecimal(p) : miles(p)) + "%";
  }

  // Reads a typed amount ("1.000", "1,000", "1000 $") as a whole number
  function leerMonto(campo, maximo) {
    const digitos = campo.value.replace(/\D/g, "").slice(0, 10);
    return Math.min(maximo, parseInt(digitos || "0", 10));
  }

  // Keeps the field formatted with thousand dots while the reader types
  function campoDeMonto(campo, maximo, alCambiar) {
    campo.addEventListener("input", () => {
      const n = leerMonto(campo, maximo);
      campo.value = n ? miles(n) : "";
      alCambiar(n);
    });
    campo.addEventListener("focus", () => campo.select());
  }

  const anios = (n) => n + (n === 1 ? " año" : " años");

  /* ---- 2. Chapter 2: inflation --------------------------------------------- */
  const ahorro = $("#ahorro");
  if (ahorro) {
    const pintarInflacion = (monto) => {
      const k10 = 1 / Math.pow(1 + CALC.inflacionAnual, 10);   // what is left of each dollar's buying power
      const k20 = 1 / Math.pow(1 + CALC.inflacionAnual, 20);
      $("#inf-hoy").textContent = dinero(monto);
      $("#inf-10").textContent = dinero(monto * k10);
      $("#inf-20").textContent = dinero(monto * k20);
      $("#inf-img-10").style.setProperty("--k", k10.toFixed(3));   // the ice block shrinks by the same share
      $("#inf-img-20").style.setProperty("--k", k20.toFixed(3));
      $("#inf-frase").textContent = monto ? "Los mismos billetes. Compran menos." : "Escribe un monto para hacer la cuenta.";
    };
    ahorro.value = miles(CALC.ahorroInicial);
    campoDeMonto(ahorro, 999999999, pintarInflacion);
    pintarInflacion(CALC.ahorroInicial);
  }

  /* ---- 3. Chapter 6: compound interest ------------------------------------- */
  // Value after depositing the same amount at the end of every month
  function valorFuturo(mensual, cuantosAnios, tasaAnual) {
    const tasaMensual = Math.pow(1 + tasaAnual, 1 / 12) - 1;
    const meses = cuantosAnios * 12;
    return mensual * (Math.pow(1 + tasaMensual, meses) - 1) / tasaMensual;
  }

  const aporte = $("#aporte");
  const plazo = $("#anios");
  if (aporte && plazo) {
    const arbol = $("#arbol-img");
    // The drawing changes with the years: sprout, young tree, full mango tree
    const etapas = [
      { hasta: 5,  archivo: "/aprende/img/brote.webp",    desde: 0.42, a: 0.62 },
      { hasta: 15, archivo: "/aprende/img/arbolito.webp", desde: 0.58, a: 0.96 },
      { hasta: 40, archivo: "/aprende/img/arbol.webp",    desde: 0.62, a: 1.0 },
    ];
    let etapaActual = -1;

    const pintarCompuesto = () => {
      const mensual = Number(aporte.value);
      const tiempo = Number(plazo.value);
      const total = valorFuturo(mensual, tiempo, CALC.rendimientoAnual);
      const puesto = mensual * 12 * tiempo;

      $("#aporte-out").textContent = dinero(mensual);
      $("#anios-out").textContent = anios(tiempo);
      $("#comp-total").textContent = dinero(redondear(total));
      $("#comp-puesto").textContent = dinero(puesto);
      $("#comp-crecio").textContent = dinero(Math.max(0, redondear(total) - puesto));
      $("#comp-reparto i").style.setProperty("--a", (100 * puesto / total).toFixed(1) + "%");

      const i = etapas.findIndex((e) => tiempo <= e.hasta);
      const etapa = etapas[i];
      const inicio = i === 0 ? 1 : etapas[i - 1].hasta + 1;
      const dentro = (tiempo - inicio) / Math.max(1, etapa.hasta - inicio);   // 0..1 inside this stage
      if (i !== etapaActual) { arbol.src = etapa.archivo; etapaActual = i; }
      arbol.style.setProperty("--k", (etapa.desde + (etapa.a - etapa.desde) * dentro).toFixed(3));
    };

    aporte.value = CALC.aporteInicial;
    plazo.value = CALC.aniosInicial;
    aporte.addEventListener("input", pintarCompuesto);
    plazo.addEventListener("input", pintarCompuesto);
    pintarCompuesto();
  }

  // "Starting early beats starting big": two people, same rate
  const madrugar = $("#madrugar");
  if (madrugar) {
    const personas = [CALC.madrugar.temprano, CALC.madrugar.tarde].map((p) => {
      const total = redondear(valorFuturo(p.mensual, p.anios, CALC.rendimientoAnual));
      return { ...p, total, puesto: p.mensual * 12 * p.anios, edad: 65 - p.anios };
    });
    const mayor = Math.max(personas[0].total, personas[1].total);
    $$(".persona", madrugar).forEach((caja, i) => {
      const p = personas[i];
      $("h4", caja).textContent = p.nombre + " empieza a los " + p.edad;
      $("p", caja).textContent = "Aparta " + dinero(p.mensual) + " al mes durante " + p.anios + " años.";
      const [barraPuso, barraTiene] = $$(".persona__barra", caja);
      barraPuso.textContent = "Puso " + dinero(p.puesto);
      barraPuso.style.setProperty("--w", (100 * p.puesto / mayor).toFixed(1) + "%");
      barraTiene.textContent = "Llega con " + dinero(p.total);
      barraTiene.style.setProperty("--w", (100 * p.total / mayor).toFixed(1) + "%");
    });
    const [a, b] = personas;
    const frase = $("#madrugar-frase");
    if (b.puesto > a.puesto && b.total < a.total) {
      frase.textContent = b.nombre + " puso " + dinero(b.puesto - a.puesto) + " más y llegó con menos. La diferencia no la hizo el dinero: la hicieron " + (a.anios - b.anios) + " años.";
    } else {
      frase.textContent = "Mismo rendimiento, distinto tiempo: los años pesan más que el monto.";
    }
  }

  /* ---- 4. Chapter 7: a monthly promise, per year ---------------------------- */
  const chips = $("#promesa-chips");
  if (chips) {
    const pintarPromesa = (i) => {
      const mensual = CALC.promesas[i].mensual;
      const anual = Math.pow(1 + mensual, 12) - 1;
      $("#promesa-anual").textContent = porcentaje(anual) + " al año";
      [1, 5, 10].forEach((cuantos) => {
        $("#promesa-" + cuantos).textContent = dineroGrande(1000 * Math.pow(1 + anual, cuantos));
      });

      const veredicto = $("#promesa-veredicto");
      const veces = anual / 0.197;   // 19.7% a year: Warren Buffett's company, 1965-2025
      if (anual <= CALC.umbralSospecha) {
        veredicto.dataset.nivel = "0";
        veredicto.textContent = "Más o menos lo que la bolsa ha dado en el largo plazo. Posible, pero con años malos en el medio y sin que nadie pueda prometértelo.";
      } else if (anual <= CALC.umbralAlarma) {
        veredicto.dataset.nivel = "1";
        veredicto.textContent = "Más de lo que logra casi cualquier profesional. Pregunta muchísimo antes de poner un dólar.";
      } else if (veces < 2) {
        veredicto.dataset.nivel = "2";
        veredicto.textContent = "Más que el promedio de uno de los mejores inversores de la historia. Desconfía y pregunta todo.";
      } else {
        veredicto.dataset.nivel = "2";
        veredicto.textContent = miles(veces) + " veces lo que logró uno de los mejores inversores de la historia. Si eso fuera real, quien te lo ofrece no necesitaría tu dinero.";
      }
    };

    const porDefecto = Math.min(2, CALC.promesas.length - 1);   // "5% al mes"
    CALC.promesas.forEach((promesa, i) => {
      const etiqueta = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "promesa";
      radio.checked = i === porDefecto;
      radio.addEventListener("change", () => pintarPromesa(i));
      const texto = document.createElement("span");
      texto.textContent = promesa.etiqueta;
      etiqueta.append(radio, texto);
      chips.append(etiqueta);
    });
    pintarPromesa(porDefecto);
  }

  /* ---- 5. Chapter 7: scam checklist ----------------------------------------- */
  const lista = $("#lista-estafa");
  if (lista) {
    const veredicto = $("#estafa-veredicto");
    const casillas = $$("input[type=checkbox]", lista);
    const pintarLista = () => {
      const marcadas = casillas.filter((c) => c.checked).length;
      veredicto.dataset.nivel = String(Math.min(2, marcadas));
      veredicto.textContent =
        marcadas === 0 ? "Ninguna marcada. Igual: nunca inviertas en algo que no entiendes."
        : marcadas === 1 ? "Una señal ya es motivo para frenar y preguntar."
        : marcadas + " señales. Aléjate, no importa quién te lo recomendó.";
    };
    casillas.forEach((c) => c.addEventListener("change", pintarLista));
    pintarLista();
  }

  /* ---- 6. Chapter 8: pasito a pasito ---------------------------------------- */
  // Draws a price that goes up and down for twelve months, with one equal purchase
  // per month, and the average price paid at the end. Prices come from CALC.dca.
  const dibujo = $("#dca-dibujo");
  if (dibujo) {
    const { cadaMes, precios } = CALC.dca;
    const NS = "http://www.w3.org/2000/svg";
    const ANCHO = 320, ALTO = 170, LADO = 14, ARRIBA = 14, ABAJO = 26;
    const techo = Math.max(...precios) * 1.06, piso = Math.min(...precios) * 0.8;
    const x = (i) => LADO + (ANCHO - 2 * LADO) * i / (precios.length - 1);
    const y = (precio) => ARRIBA + (ALTO - ARRIBA - ABAJO) * (1 - (precio - piso) / (techo - piso));
    // The same money buys more when it is cheap, so the average price paid is
    // (all the money) / (everything bought): a bit below the plain average of prices.
    const comprado = precios.reduce((suma, precio) => suma + cadaMes / precio, 0);
    const promedio = cadaMes * precios.length / comprado;

    const crear = (nombre, atributos, padre) => {
      const el = document.createElementNS(NS, nombre);
      Object.entries(atributos).forEach(([clave, valor]) => el.setAttribute(clave, valor));
      padre.append(el);
      return el;
    };
    const svg = crear("svg", { viewBox: "0 0 " + ANCHO + " " + ALTO, "aria-hidden": "true" }, dibujo);
    const linea = crear("path", {
      class: "dca__precio",
      d: precios.map((precio, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(precio).toFixed(1)).join(" "),
    }, svg);
    const media = crear("line", { class: "dca__media", x1: LADO, x2: ANCHO - LADO, y1: y(promedio).toFixed(1), y2: y(promedio).toFixed(1) }, svg);
    const puntos = precios.map((precio, i) => crear("circle", { class: "dca__punto", cx: x(i).toFixed(1), cy: y(precio).toFixed(1), r: 6 }, svg));
    crear("text", { x: LADO, y: ALTO - 6 }, svg).textContent = "Mes 1";
    crear("text", { x: ANCHO - LADO, y: ALTO - 6, "text-anchor": "end" }, svg).textContent = "Mes " + precios.length;
    $("#dca-monto").textContent = dinero(cadaMes);

    // how far along the line each month's point is (0 = start, 1 = end), so every
    // point lands exactly when the line reaches it
    const tramos = precios.map((precio, i) => (i ? Math.hypot(x(i) - x(i - 1), y(precio) - y(precios[i - 1])) : 0));
    const total = tramos.reduce((a, b) => a + b, 0);
    let recorrido = 0;
    const avances = tramos.map((tramo) => (recorrido += tramo) / total);

    // Plays the drawing: the price line draws itself, a point lands each month,
    // and the average line appears at the end.
    const DURACION = 2600;
    let relojes = [];
    const reproducir = () => {
      relojes.forEach(clearTimeout);
      relojes = [];
      const largo = linea.getTotalLength();
      linea.style.transition = "none";
      linea.style.strokeDasharray = largo;
      linea.style.strokeDashoffset = largo;
      puntos.forEach((punto) => punto.classList.add("oculto"));
      media.classList.add("oculto");
      linea.getBoundingClientRect();                       // lets the browser register the starting state
      linea.style.transition = "stroke-dashoffset " + DURACION + "ms linear";
      linea.style.strokeDashoffset = 0;
      puntos.forEach((punto, i) => {
        relojes.push(setTimeout(() => punto.classList.remove("oculto"), DURACION * avances[i]));
      });
      relojes.push(setTimeout(() => media.classList.remove("oculto"), DURACION + 350));
    };

    const otraVez = $("#dca-otra");
    if (calmado || !("IntersectionObserver" in window)) {
      otraVez.hidden = true;                               // still version: the finished drawing is simply shown
    } else {
      otraVez.addEventListener("click", reproducir);
      // plays by itself the first time the drawing scrolls into view
      const vigia = new IntersectionObserver((entradas) => {
        if (entradas.some((e) => e.isIntersecting)) { vigia.disconnect(); reproducir(); }
      }, { threshold: 0.6 });
      vigia.observe(dibujo);
    }
  }

  /* ---- 7. Chapter 9: emergency fund ----------------------------------------- */
  const gasto = $("#gasto");
  if (gasto) {
    const [minimo, maximo] = CALC.emergenciaMeses;
    const pintarTanque = (monto) => {
      $("#tanque-out").textContent = monto
        ? "entre " + dinero(monto * minimo) + " y " + dinero(monto * maximo)
        : "escribe cuánto gastas al mes";
    };
    gasto.value = miles(CALC.gastoInicial);
    campoDeMonto(gasto, 9999999, pintarTanque);
    pintarTanque(CALC.gastoInicial);
  }
})();
