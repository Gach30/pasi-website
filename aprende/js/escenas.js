/* ==========================================================================
   escenas.js — everything that MOVES when the reader scrolls.

   The page is complete and readable without this file. When it runs, it adds
   the class "anima" to <html>; the stylesheet then pins each scene to the
   screen (section 9 of css/style.css) and this file plays the scene forwards
   and backwards with the scroll.

   It does nothing (the page stays still) when:
     - the visitor's device asks for reduced motion,
     - the animation library (GSAP, from a CDN) did not load,
     - the browser is too old to pin the scenes safely.

   Scenes, in story order:
     ceros      ch. 1   a 15-digit number loses its zeros: three, five, six
     dolares    ch. 1   the coin turns from bolívares to dollars and goes under the mattress
     hielo      ch. 2   the sun comes out and the frozen dollar melts
     corriente  ch. 3   the sleeping shrimp is carried away by the current
     miedo      ch. 3   four fears close in, then turn out to be four ordinary objects
     empleos    ch. 4   the four jobs for a banknote, one plate at a time
     cesta      ch. 4   nine fruits fly into the basket while a counter runs to 500
     ojo        ch. 5   a closed eye snaps open: "accept your reality"
     siembra    ch. 6   one mango tree becomes sixteen
     pajarito   ch. 7   the little bird swells until it bursts
     grafico    ch. 8   the S&P 500 line draws itself, fall by fall
     escampa    ch. 8   a rainy day clears into a sunny one
     casa       ch. 9   the house is built: base, three columns, roof
     mar        ch. 11  the sea parts
   plus the moving titles and a few one-off moments.
   ========================================================================== */
(function () {
  "use strict";

  const calmado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const navegadorApto = window.CSS && CSS.supports && CSS.supports("overflow", "clip");
  if (calmado || !navegadorApto || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });   // the phone's address bar hiding is not a resize
  gsap.defaults({ ease: "none" });
  document.documentElement.classList.add("anima");

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  /* ---- Helpers ------------------------------------------------------------ */

  // A pinned scene. Its timeline is tied to the scroll: scroll down = play, scroll up = rewind.
  function escena(nombre, construir) {
    const el = $('[data-escena="' + nombre + '"]');
    if (!el) return;
    const linea = gsap.timeline({
      scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.5, invalidateOnRefresh: true },
    });
    construir(linea, el, $$(".pasos > *", el));
  }

  // Wraps each word of an element in its own <span>, so the words can appear one
  // by one. Citations, small print and drawings are left whole.
  function palabras(el) {
    const hechas = [];
    const recorrer = (nodo) => {
      Array.from(nodo.childNodes).forEach((hijo) => {
        if (hijo.nodeType === 3) {
          const fragmento = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach((trozo) => {
            if (!trozo) return;
            if (/^\s+$/.test(trozo)) { fragmento.append(" "); return; }
            const palabra = document.createElement("span");
            palabra.className = "pl";
            palabra.textContent = trozo;
            fragmento.append(palabra);
            hechas.push(palabra);
          });
          hijo.replaceWith(fragmento);
        } else if (hijo.nodeType === 1 && !hijo.matches(".cita, small, img, svg, .num, .pct")) {
          recorrer(hijo);
        }
      });
    };
    recorrer(el);
    return hechas;
  }

  // The narration: each line gets one "beat" of the timeline. A line arrives word
  // by word and leaves just before the next one.
  function narrar(linea, pasos) {
    pasos.forEach((paso, i) => {
      if (i > 0) {
        const partes = paso.classList.contains("lamina") ? [] : palabras(paso);
        const letraChica = $("small", paso);
        linea.fromTo(paso, { opacity: 0 }, { opacity: 1, duration: 0.04 }, i);
        if (partes.length) linea.fromTo(partes, { opacity: 0 }, { opacity: 1, duration: 0.1, stagger: 0.2 / partes.length }, i);
        else linea.fromTo(paso, { y: 18 }, { y: 0, duration: 0.2 }, i);
        if (letraChica) linea.fromTo(letraChica, { opacity: 0 }, { opacity: 1, duration: 0.15 }, i + 0.3);
      }
      if (i < pasos.length - 1) linea.to(paso, { opacity: 0, y: -14, duration: 0.16 }, i + 0.84);
    });
    linea.to({}, { duration: 0.01 }, pasos.length);   // makes the timeline exactly one beat per line
  }

  /* ---- Titles that move ------------------------------------------------------ */

  // Every chapter title: its words rise from behind a mask when it scrolls into view.
  // A word marked data-actua also "acts out" what it says.
  const actos = {
    // "derrite": the letters sag and stretch a little, each one a bit more than the last, like wax
    derrite(palabra, letras) {
      return gsap.to(letras, {
        scaleY: (i) => 1.12 + i * 0.045, y: (i) => 0.02 * i + "em", transformOrigin: "50% 0%",
        duration: 1.3, stagger: 0.07, ease: "power1.inOut",
      });
    },
    // "corre": the word dashes off the screen and comes back in from the other side
    corre(palabra) {
      return gsap.timeline()
        .to(palabra, { x: () => window.innerWidth, skewX: -24, duration: 0.45, ease: "power2.in" })
        .set(palabra, { x: () => -window.innerWidth })
        .to(palabra, { x: 0, skewX: 0, duration: 0.7, ease: "back.out(1.3)" });
    },
    // "primer": it lands like a rubber stamp
    sello(palabra) {
      return gsap.timeline()
        .fromTo(palabra, { scale: 2.6, rotation: -10 }, { scale: 1, rotation: -4, duration: 0.3, ease: "power3.in" })
        .to(palabra, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    },
  };

  $$(".titular, .subtitulo").forEach((titulo) => {
    const piezas = [];
    Array.from(titulo.childNodes).forEach((nodo) => {
      if (nodo.nodeType !== 3) return;
      const fragmento = document.createDocumentFragment();
      nodo.textContent.split(/(\s+)/).forEach((trozo) => {
        if (!trozo) return;
        if (/^\s+$/.test(trozo)) { fragmento.append(" "); return; }
        const mascara = document.createElement("span");
        mascara.className = "pm";
        const palabra = document.createElement("span");
        palabra.className = "pw";
        palabra.textContent = trozo;
        mascara.append(palabra);
        fragmento.append(mascara);
        piezas.push(palabra);
      });
      nodo.replaceWith(fragmento);
    });

    const entrada = gsap.timeline({ scrollTrigger: { trigger: titulo, start: "top 86%" } });
    entrada.from(piezas, { yPercent: 118, duration: 0.7, stagger: 0.055, ease: "power3.out" });

    const actor = $("[data-actua]", titulo);
    if (actor && actos[actor.dataset.actua]) {
      const letras = actor.textContent.split("").map((letra) => {
        const caja = document.createElement("span");
        caja.className = "letra";
        caja.textContent = letra;
        return caja;
      });
      actor.textContent = "";
      actor.append(...letras);
      entrada.from(actor, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0.25);
      entrada.add(actos[actor.dataset.actua](actor, letras), 0.75);
    }
  });

  // The big statements between scenes: the words fill with ink as you scroll past them
  $$("main .flujo > .grande").forEach((frase) => {
    const partes = palabras(frase);
    if (!partes.length) return;
    gsap.fromTo(partes, { opacity: 0.16 }, {
      opacity: 1, duration: 0.3, stagger: 0.12,
      scrollTrigger: { trigger: frase, start: "top 88%", end: "top 48%", scrub: 0.4 },
    });
  });

  /* ---- Cover: the banknote drifts as you leave it --------------------------- */
  gsap.to(".portada__arte", {
    yPercent: -14, rotation: -3,
    scrollTrigger: { trigger: "#portada", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---- Chapter 1: the number loses its zeros -------------------------------- */
  escena("ceros", (linea, el, pasos) => {
    const caja = $(".ceros", el);
    const numero = $(".ceros__numero", el);
    const digitos = $$(".d", numero);
    const quedan = [15, 12, 7, 1];   // digits left at the start and after each cut

    // the scale at which the first n digits span the drawing (but never taller than a third of it)
    const escala = (n) => {
      const ancho = digitos[n - 1].offsetLeft + digitos[n - 1].offsetWidth;
      return Math.min(caja.clientWidth / ancho, (caja.clientHeight * 0.3) / numero.offsetHeight);
    };

    gsap.set($$(".cero", el), { opacity: 0, yPercent: -280 });
    [1, 2, 3].forEach((lote, i) => {
      linea
        // the zeros drop out of the number...
        .to($$('.d[data-lote="' + lote + '"]', numero), {
          y: () => (caja.clientHeight * 0.45) / escala(quedan[i]), rotation: (k) => (k % 2 ? 60 : -60), opacity: 0,
          duration: 0.4, stagger: { each: 0.05, from: "end" }, ease: "power2.in",
        }, i + 0.08)
        // ...what is left grows to fill the line...
        .fromTo(numero, { scale: () => escala(quedan[i]) }, {
          scale: () => escala(quedan[i + 1]), duration: 0.45, ease: "power2.inOut", immediateRender: i === 0,
        }, i + 0.42)
        // ...and the zeros land on the pile
        .to($$('.cero[data-lote="' + lote + '"]', el), {
          opacity: 1, yPercent: 0, duration: 0.5, stagger: 0.06, ease: "bounce.out",
        }, i + 0.3);
    });
    linea
      .to($(".ceros__antes", el), { opacity: 0, duration: 0.15 }, 2.8)
      .to($(".ceros__hoy", el), { opacity: 1, duration: 0.15 }, 2.9)
      .to($(".ceros__pila", el), { scale: 1.04, transformOrigin: "50% 100%", duration: 0.25, yoyo: true, repeat: 1 }, 3.1);
    narrar(linea, pasos);
  });

  /* ---- Chapter 1: bolívares to dollars, and under the mattress --------------- */
  escena("dolares", (linea, el, pasos) => {
    const caja = $(".cambio", el);
    const moneda = $(".moneda", el);
    const bolivares = $(".moneda__cara--bs", el);
    const dolares = $(".moneda__cara--usd", el);
    const formas = $$(".cambio__formas li", el);
    const colchon = $(".cambio__colchon", el);
    gsap.set(dolares, { scaleX: 0 });                     // starts on the bolívar face
    gsap.set(formas, { scale: 0 });
    gsap.set(colchon, { xPercent: -50, x: 0, yPercent: 45, autoAlpha: 0, transformOrigin: "50% 100%" });
    linea
      // the coin turns: the bolívar face closes until it is edge-on, then the dollar face opens
      // (two flat halves instead of a 3D flip, so Safari and Chrome draw it the same)
      .to(bolivares, { scaleX: 0, duration: 0.3, ease: "power2.in" }, 0.12)
      .to(dolares, { scaleX: 1, duration: 0.4, ease: "back.out(2)" }, 0.42)
      .to(formas, { scale: 1, duration: 0.3, stagger: 0.16, ease: "back.out(2)" }, 1.02)
      .to(formas, { scale: 0, duration: 0.2, stagger: 0.05 }, 1.86)
      .to(colchon, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 1.95)
      .to(moneda, { y: () => caja.clientHeight * 0.55, scale: 0.4, duration: 0.5, ease: "power2.in" }, 2.3)
      .to(colchon, { scaleY: 0.9, duration: 0.08, yoyo: true, repeat: 1 }, 2.78)
      .to(colchon, { rotation: -3, duration: 0.12, yoyo: true, repeat: 3 }, 3.15);
    narrar(linea, pasos);
  });

  /* ---- Chapter 2: the melting dollar --------------------------------------- */
  escena("hielo", (linea, el, pasos) => {
    const bloque = $(".hielo img", el);
    gsap.set(bloque, { transformOrigin: "50% 96%" });
    linea
      // the sun rises from behind the ice; it never leaves the drawing's own box
      .fromTo($(".sol", el), { yPercent: 70, scale: 0.6 }, { yPercent: 0, scale: 1, duration: 0.9, ease: "power1.out" }, 0)
      .to($(".sol__rayos", el), { rotation: 150, duration: 4 }, 0)
      .to(bloque, { scale: 0.5, duration: 3.3 }, 0.55);
    $$(".gota", el).forEach((gota, i) => {
      linea.fromTo(gota, { opacity: 0, y: 0 }, {
        keyframes: [{ opacity: 1, duration: 0.08 }, { y: 80, duration: 0.42 }, { opacity: 0, duration: 0.08 }],
        repeat: 4, repeatDelay: 0.1,
      }, 0.5 + i * 0.27);
    });
    narrar(linea, pasos);
  });

  /* ---- Chapter 3: the shrimp and the current ------------------------------- */
  escena("corriente", (linea, el, pasos) => {
    const camaron = $(".camaron", el);
    const zzz = $(".zzz", el);
    gsap.set(camaron, { xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: -5 });
    linea
      .to($(".corriente__olas", el), { backgroundPositionX: "-640px", duration: 3 }, 0)
      .to(zzz, { y: -26, opacity: 0.25, duration: 0.4, yoyo: true, repeat: 3 }, 0)
      .to(camaron, { x: 26, rotation: 2, duration: 1 }, 0)                                   // still asleep, starting to drift
      .to(camaron, { x: () => window.innerWidth, rotation: 16, duration: 1.7, ease: "power1.in" }, 1.1)
      .to(zzz, { opacity: 0, duration: 0.3 }, 1.6);
    narrar(linea, pasos);
  });

  /* ---- Chapter 3: fear ------------------------------------------------------ */
  escena("miedo", (linea, el, pasos) => {
    const sombras = $$(".sombras img", el);
    const haciaElCentro = [[34, 38], [-34, 42], [30, -34], [-30, -40]];   // how far each one moves in (px)
    gsap.set(sombras, { opacity: 0.4, scale: 0.6 });
    linea
      .to(sombras, { opacity: 1, scale: 1, duration: 0.9, stagger: 0.1 }, 0.05)                      // they come out of the dark
      .to(sombras, {                                                                                 // they close in and grow
        scale: 1.75, x: (i) => haciaElCentro[i][0], y: (i) => haciaElCentro[i][1], duration: 0.85, ease: "power2.in",
      }, 1.15)
      .to(sombras, { rotation: "+=8", duration: 0.07, yoyo: true, repeat: 9 }, 2.02)                 // "Es miedo": they tremble
      .to(sombras, { scale: 0.85, x: 0, y: 0, duration: 0.6, ease: "power2.out" }, 3.0);             // only four ordinary objects
    narrar(linea, pasos);
  });

  /* ---- Chapter 4: the four jobs --------------------------------------------- */
  escena("empleos", (linea, el, pasos) => {
    pasos.forEach((lamina, i) => {
      const dibujo = $("img", lamina);
      if (i > 0) {
        linea
          .fromTo(dibujo, { scale: 0.4, rotation: i % 2 ? 16 : -16 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(1.7)" }, i)
          .fromTo($$(":scope > :not(img)", lamina), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.16, stagger: 0.07 }, i + 0.12);
      }
      linea.to(dibujo, { y: -8, duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, i + 0.42);   // a small nod while you read
    });
    narrar(linea, pasos);
  });

  /* ---- Chapter 4: the basket ----------------------------------------------- */
  escena("cesta", (linea, el, pasos) => {
    const arte = $(".cesta-arte", el);
    const cesta = $(".cesta", el);
    const numero = $("#cesta-n");
    const rotulo = $("#cesta-rotulo");
    const cuenta = { valor: 1 };
    const pintar = () => {
      const n = Math.round(cuenta.valor);
      numero.textContent = n;
      rotulo.textContent = n === 1 ? "empresa" : "empresas";
    };
    gsap.set(cesta, { xPercent: -50, x: 0, transformOrigin: "50% 100%" });
    pintar();

    linea.to(cuenta, { valor: 500, duration: 2.5, ease: "power1.in", onUpdate: pintar }, 0.2);

    // where a fruit has to travel to land in the mouth of the basket
    const viaje = (fruta, eje) => {
      const a = arte.getBoundingClientRect(), f = fruta.getBoundingClientRect();
      const actual = Number(gsap.getProperty(fruta, eje)) || 0;
      return eje === "x"
        ? actual + (a.left + a.width * 0.5) - (f.left + f.width / 2)
        : actual + (a.top + a.height * 0.5) - (f.top + f.height / 2);
    };
    $$(".vuela", el).forEach((fruta, i) => {
      const t = 0.3 + i * 0.25;
      linea
        .to(fruta, { x: () => viaje(fruta, "x"), y: () => viaje(fruta, "y"), scale: 0.35, rotation: "+=220", duration: 0.5, ease: "power2.in" }, t)
        .to(fruta, { opacity: 0, duration: 0.04 }, t + 0.47)
        .to(cesta, { scaleY: 0.95, scaleX: 1.04, duration: 0.05, yoyo: true, repeat: 1 }, t + 0.47);
    });
    narrar(linea, pasos);
  });

  /* ---- Chapter 5: the eye opens ---------------------------------------------- */
  escena("ojo", (linea, el, pasos) => {
    const parpados = $$(".ojo__forma", el).concat([$(".ojo__pestanas", el)]);   // the outline, the cut-out and the lashes move together
    const iris = $(".ojo__iris", el);
    const pupila = $(".ojo__pupila", el);
    const susto = $$(".ojo__susto line", el);
    gsap.set(parpados, { scaleY: 0.05, svgOrigin: "160 110" });               // starts closed
    gsap.set(susto, { opacity: 0 });
    linea
      .to(parpados, { scaleY: 1, duration: 0.3, ease: "back.out(2.6)" }, 0.32)                 // it snaps open
      .to(susto, { opacity: 1, duration: 0.08, stagger: 0.02 }, 0.4)
      .to(pupila, { scale: 0.55, svgOrigin: "160 110", duration: 0.25, ease: "power2.out" }, 0.5)   // the pupil shrinks: the shock
      .to(susto, { opacity: 0, duration: 0.2 }, 0.92)
      .to(iris, { x: -46, duration: 0.3, ease: "power2.inOut" }, 1.1)                          // it looks one way...
      .to(iris, { x: 46, duration: 0.4, ease: "power2.inOut" }, 1.45)                          // ...and the other
      .to(iris, { x: 0, y: 14, duration: 0.3, ease: "power2.inOut" }, 2.05)                    // ...and down, at the facts
      .to(pupila, { scale: 0.8, duration: 0.3 }, 2.1)
      .to(parpados, { scaleY: 0.05, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.in" }, 3.1)   // one blink
      .to(iris, { y: 30, duration: 0.3 }, 3.4);
    narrar(linea, pasos);
  });

  /* ---- Chapter 6: one mango tree becomes sixteen ---------------------------- */
  escena("siembra", (linea, el, pasos) => {
    const campo = $(".huerto__campo", el);
    const madre = $(".mata--madre", el);
    const semillas = $$(".semilla", el);
    const numero = $("#huerto-n");
    const rotulo = $(".huerto__cuenta small", el);
    const generacion = (g) => $$('.mata[data-g="' + g + '"]', el);
    // where the three mangoes hang (on the big first tree) and where they land:
    // the spots of the next three trees. In % of the field.
    const enLaMata = [[29, 62], [40, 52], [48, 66]];
    const enElSuelo = [[62, 97], [14, 97], [86, 97]];
    semillas.forEach((semilla, i) => {
      semilla.style.setProperty("--x", enLaMata[i][0] + "%");
      semilla.style.setProperty("--y", enLaMata[i][1] + "%");
    });
    const ancho = (porcentaje) => porcentaje / 100 * campo.clientWidth;
    const alto = (porcentaje) => porcentaje / 100 * campo.clientHeight;

    const cuenta = { valor: 1 };
    const pintar = () => {
      const n = Math.round(cuenta.valor);
      numero.textContent = n;
      rotulo.textContent = n === 1 ? "mata" : "matas";
    };
    pintar();

    gsap.set($$(".mata:not(.mata--madre)", el), { scale: 0 });
    gsap.set(semillas.slice(1), { scale: 0 });
    linea
      // the first mango sits on the ground, big; it goes into the soil and the tree comes up
      .fromTo(semillas[0], { x: () => ancho(38 - enLaMata[0][0]), y: () => alto(93 - enLaMata[0][1]), scale: 3 }, { scale: 0, duration: 0.35, ease: "power2.in" }, 0.1)
      .fromTo(madre, { scale: 0 }, { scale: 2.2, duration: 0.6, ease: "back.out(1.4)" }, 0.38)
      .set(semillas[0], { x: 0, y: 0 }, 0.98)
      // the tree gives mangoes
      .to(semillas, { scale: 1, duration: 0.25, stagger: 0.14, ease: "back.out(2.4)" }, 1.05)
      // they are planted: each one lands where a new tree will grow
      .to(semillas, {
        x: (i) => ancho(enElSuelo[i][0] - enLaMata[i][0]), y: (i) => alto(enElSuelo[i][1] - enLaMata[i][1]),
        rotation: (i) => (i % 2 ? 200 : -200), duration: 0.6, stagger: 0.08, ease: "power2.in",
      }, 2.15)
      .to(semillas, { scale: 0, duration: 0.15 }, 3.0)
      .to(madre, { scale: 1, duration: 0.5, ease: "power2.inOut" }, 3.0)
      // more trees, and more with every round: 2, 4, 8, 16
      .to(generacion(1), { scale: 1, duration: 0.3, ease: "back.out(1.8)" }, 3.08)
      .to(cuenta, { valor: 2, duration: 0.05, onUpdate: pintar }, 3.1)
      .to(generacion(2), { scale: 1, duration: 0.3, stagger: 0.08, ease: "back.out(1.8)" }, 3.26)
      .to(cuenta, { valor: 4, duration: 0.05, onUpdate: pintar }, 3.3)
      .to(generacion(3), { scale: 1, duration: 0.25, stagger: 0.05, ease: "back.out(1.8)" }, 3.52)
      .to(cuenta, { valor: 8, duration: 0.1, onUpdate: pintar }, 3.56)
      .to(generacion(4), { scale: 1, duration: 0.25, stagger: 0.035, ease: "back.out(1.8)" }, 3.82)
      .to(cuenta, { valor: 16, duration: 0.2, onUpdate: pintar }, 3.86)
      .to($$(".mata", el), { rotation: 4, duration: 0.2, yoyo: true, repeat: 3, stagger: 0.02, ease: "sine.inOut" }, 4.3);
    narrar(linea, pasos);
  });

  /* ---- Chapter 7: the pajarito swells until it bursts ------------------------ */
  escena("pajarito", (linea, el, pasos) => {
    const ave = $(".globo__ave", el);
    const pum = $(".globo__pum", el);
    const plumas = $$(".globo__plumas i", el);
    gsap.set(ave, { scale: 0.62, transformOrigin: "50% 62%" });
    gsap.set(pum, { scale: 0, opacity: 0 });
    gsap.set(plumas, { opacity: 0, scale: 0.6 });
    linea
      .to(ave, { scale: 1.9, duration: 0.97, ease: "power1.in" }, 0)                                   // it swells...
      .to(ave, { rotation: 4, duration: 0.06, yoyo: true, repeat: 9, ease: "sine.inOut" }, 0.4)        // ...trembles...
      .to(ave, { scale: 2.15, opacity: 0, duration: 0.04 }, 0.98)                                      // ...and bursts
      .to(pum, { scale: 1.15, opacity: 1, duration: 0.07, ease: "power2.out" }, 0.98)
      .to(pum, { scale: 1.6, opacity: 0, duration: 0.25 }, 1.06)
      .to(plumas, { opacity: 1, duration: 0.03 }, 0.99)
      .to(plumas, {                                                                                    // feathers everywhere...
        x: (i) => Math.cos(i * Math.PI / 6) * (110 + (i % 3) * 30),
        y: (i) => Math.sin(i * Math.PI / 6) * (100 + (i % 2) * 36) - 10,
        rotation: (i) => (i % 2 ? 260 : -220), scale: 1, duration: 0.5, ease: "power2.out",
      }, 0.99)
      .to(plumas, {                                                                                    // ...that drift down and stay on the floor
        x: (i) => (i - 5.5) * 25, y: (i) => 128 + (i % 3) * 13,
        rotation: (i) => ((i * 53) % 150) - 75, duration: 0.5, ease: "power1.inOut",
      }, 1.5);
    narrar(linea, pasos);
  });

  /* ---- Chapter 8: the chart draws itself ----------------------------------- */
  escena("grafico", (linea, el, pasos) => {
    const g = window.GRAFICO;
    if (!g) { narrar(linea, pasos); return; }
    const largo = g.largo;
    gsap.set(g.linea, { strokeDasharray: largo, strokeDashoffset: largo });
    gsap.set(g.bandas.concat(g.rotulos, [g.punto]), { opacity: 0 });
    // one beat per fall: the line runs to the bottom of that fall and waits there while you read
    g.fracciones.forEach((fraccion, k) => {
      linea
        .to(g.linea, { strokeDashoffset: largo * (1 - fraccion), duration: 0.5 }, k)
        .to([g.bandas[k], g.rotulos[k]], { opacity: 1, duration: 0.15 }, k + 0.38);
    });
    const ultimo = g.fracciones.length;
    linea
      .to(g.linea, { strokeDashoffset: 0, duration: 0.6 }, ultimo)
      .to(g.punto, { opacity: 1, duration: 0.1 }, ultimo + 0.55);
    narrar(linea, pasos);
  });

  /* ---- Chapter 8: the rain clears ---------------------------------------------- */
  escena("escampa", (linea, el, pasos) => {
    const caja = $(".clima", el);
    const nube = $(".clima__nube", el);
    const sol = $(".clima__sol", el);
    const arcos = $$(".clima__arco path", el);
    gsap.set(nube, { xPercent: -50, x: 0 });
    gsap.set(sol, { yPercent: 260, scale: 0.6, transformOrigin: "50% 50%" });   // hidden behind the hill
    gsap.set(arcos, { strokeDashoffset: 100 });                                   // the rainbow is not drawn yet
    linea
      .to($(".clima__lluvia", el), { opacity: 0, duration: 0.55 }, 0.95)          // the rain stops
      .to($(".clima__cielo", el), { opacity: 1, duration: 0.8 }, 0.95)            // the sky clears
      .to(nube, { x: () => -caja.clientWidth * 1.15, duration: 0.95, ease: "power1.in" }, 1.0)   // the cloud leaves
      .to(sol, { yPercent: 0, scale: 1, duration: 0.7, ease: "back.out(1.5)" }, 1.15)            // the sun comes out
      .to($(".sol__rayos", sol), { rotation: 200, duration: 2.1 }, 1.15)
      .to(arcos, { strokeDashoffset: 0, duration: 0.6, stagger: 0.12, ease: "power1.inOut" }, 1.7)   // a rainbow
      .fromTo($(".clima__ave", el), { x: () => -caja.clientWidth * 0.45, y: 22 },                // and the macaw flies across
        { x: () => caja.clientWidth * 1.05, y: -26, duration: 1.0 }, 2.15);
    narrar(linea, pasos);
  });

  /* ---- Chapter 9: the house is built ---------------------------------------- */
  escena("casa", (linea, el, pasos) => {
    const techo = $(".casa__techo", el);
    const ave = $(".casa__ave", el);
    gsap.set($$(".casa__col", el), { scaleY: 0, transformOrigin: "50% 100%" });
    gsap.set($$(".casa__icono", el), { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0 });
    gsap.set(techo, { y: -150, opacity: 0, transformOrigin: "50% 100%" });
    gsap.set(ave, { x: 120, y: -110, rotation: 22, opacity: 0 });
    linea.to($(".casa__base", el), { scaleY: 1.18, transformOrigin: "50% 100%", duration: 0.12, yoyo: true, repeat: 1 }, 0.25);
    [1, 2, 3].forEach((n) => {
      linea
        .to($('.casa__col[data-col="' + n + '"]', el), { scaleY: 1, duration: 0.45, ease: "back.out(1.5)" }, n + 0.02)
        .to($('.casa__icono[data-col="' + n + '"]', el), { scale: 1, duration: 0.3, ease: "back.out(2.2)" }, n + 0.34);
    });
    linea
      .to(techo, { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out" }, 4.02)
      .to(ave, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, 4.45);
    narrar(linea, pasos);
  });

  /* ---- Chapter 11: the sea parts ------------------------------------------- */
  escena("mar", (linea, el) => {
    const texto = $(".mar__texto", el);
    gsap.set(texto, { autoAlpha: 0, scale: 0.88 });
    linea
      .to({}, { duration: 0.7 })                                            // time to read the sentence
      .to($(".mar__dificil", el), { opacity: 0, duration: 0.25 }, 0.7)
      .to($(".mar__mitad--izq", el), { xPercent: -82, duration: 1, ease: "power1.inOut" }, 0.8)
      .to($(".mar__mitad--der", el), { xPercent: 82, duration: 1, ease: "power1.inOut" }, 0.8)
      .to(texto, { autoAlpha: 1, scale: 1, duration: 0.5 }, 1.3)
      .to({}, { duration: 0.9 });                                           // hold the open sea a moment
  });

  /* ---- One-off moments (play once when they scroll into view) --------------- */

  // Chapter 3: when the excuse cards first come into view, each one nods in turn, to show that they turn over
  // (the nod itself is the "asoma" animation in the stylesheet)
  const tarjetas = $$(".excusa");
  if (tarjetas.length) {
    ScrollTrigger.create({
      trigger: ".excusas", start: "top 68%", once: true,
      onEnter: () => tarjetas.forEach((tarjeta, i) => setTimeout(() => {
        if (!tarjeta.classList.contains("volteada")) tarjeta.classList.add("asoma");
      }, i * 170)),
    });
  }

  // Chapter 4: the dots of the comparison table fill in
  gsap.from(".tabla--puntos .puntos i.on", {
    scale: 0, duration: 0.25, stagger: 0.025, ease: "back.out(3)",
    scrollTrigger: { trigger: ".tabla--puntos", start: "top 78%" },
  });

  // Chapter 5: nine of the ten mangoes lose their colour, one by one
  gsap.from(".diez img.mal", {
    opacity: 1, filter: "grayscale(0) contrast(1)", duration: 0.3, stagger: 0.12, ease: "power1.out",
    scrollTrigger: { trigger: ".diez", start: "top 80%" },
  });

  // Chapter 5, "moverse sale caro": the dice tumble in (the bars grow with the other yardsticks)
  gsap.from(".hallazgo__dibujo", {
    rotation: 220, scale: 0, duration: 0.7, ease: "back.out(1.6)",
    scrollTrigger: { trigger: ".hallazgos", start: "top 78%" },
  });

  // Chapter 5, "casi nadie gana": a hundred dots appear, ninety-nine go dark, one keeps beating
  const cien = $$(".cien i");
  if (cien.length) {
    gsap.timeline({ scrollTrigger: { trigger: ".cien", start: "top 76%" } })
      .from(cien, { scale: 0, duration: 0.2, stagger: { each: 0.008, from: "random" }, ease: "back.out(2)" })
      .to(cien.filter((punto) => !punto.classList.contains("gana")), { opacity: 0.16, duration: 0.25, stagger: { each: 0.012, from: "random" } }, "+=0.25")
      .to(".cien .gana", { scale: 1.9, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, "-=0.2");
  }

  // Chapter 5, "no intentes volverte experto": the skills pop out, then the two coins land
  gsap.from(".oficios li", {
    scale: 0, rotation: (i) => (i % 2 ? 20 : -20), duration: 0.4, stagger: 0.1, ease: "back.out(2.2)",
    scrollTrigger: { trigger: ".oficios", start: "top 86%" },
  });
  gsap.from(".moneda-vs__disco", {
    scale: 0, rotation: -140, duration: 0.6, stagger: 0.35, ease: "back.out(1.6)",
    scrollTrigger: { trigger: ".dos-monedas", start: "top 80%" },
  });

  // Chapter 7, "le pasa a muchísima gente": the figure counts up, the hook swings and takes the banknotes
  const cifra = $("#pesca-n");
  if (cifra) {
    const monto = { valor: 0 };
    const conPuntos = (n) => "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const final = Number(cifra.textContent.replace(/\D/g, ""));      // the figure written in the page (7.900)
    cifra.textContent = conPuntos(0);
    gsap.to(monto, {
      valor: final, duration: 1.6, ease: "power2.out", onUpdate: () => { cifra.textContent = conPuntos(monto.valor); },
      scrollTrigger: { trigger: ".pesca", start: "top 72%" },
    });
    gsap.fromTo(".pesca__anzuelo", { rotation: -13 }, {
      rotation: 13, transformOrigin: "50% -70%", duration: 0.9, yoyo: true, repeat: 5, ease: "sine.inOut",
      scrollTrigger: { trigger: ".pesca", start: "top 82%" },
    });
    gsap.to(".pesca__billete", {
      y: -170, opacity: 0, duration: 1, stagger: 0.3, ease: "power1.in",
      scrollTrigger: { trigger: ".pesca", start: "top 55%", end: "bottom 25%", scrub: 0.6 },
    });
  }

  // Chapter 7: the megaphone "shouts" the three promises
  gsap.from(".rotulo", {
    scale: 0, rotation: "-=50", duration: 0.5, stagger: 0.16, ease: "back.out(2)",
    scrollTrigger: { trigger: ".rotulos", start: "top 75%" },
  });
  gsap.from(".megafono", {
    rotation: -30, duration: 0.6, ease: "elastic.out(1, 0.4)",
    scrollTrigger: { trigger: ".rotulos", start: "top 75%" },
  });

  // The yardsticks (chapter 5: two ways of earning more; chapter 7: real returns against a
  // promise). Their bars grow; in chapter 7 the promise bar runs off the screen last.
  $$(".escala").forEach((escala) => {
    gsap.from($$("i", escala), {
      scaleX: 0, transformOrigin: "left center", duration: 0.6, stagger: 0.16, ease: "power2.out",
      scrollTrigger: { trigger: escala, start: "top 78%" },
    });
  });

  // Chapter 8: the cloud drifts in over the title
  gsap.set(".nube", { xPercent: -50, x: 0 });
  gsap.fromTo(".nube", { x: -70 }, {
    x: 30,
    scrollTrigger: { trigger: ".tormenta", start: "top bottom", end: "bottom top", scrub: true },
  });

  // Chapter 8: the bars for "missing the best days" grow
  gsap.from(".barras .barra-h div", {
    scaleX: 0, transformOrigin: "left center", duration: 0.6, stagger: 0.14, ease: "power2.out",
    scrollTrigger: { trigger: ".barras", start: "top 80%" },
  });

  // Chapter 8: "suelta el teléfono": the phone tips over and drops out of sight as you scroll
  gsap.to(".calma__telefono", {
    y: 150, rotation: 100, opacity: 0, ease: "power1.in",
    scrollTrigger: { trigger: ".calma", start: "top 45%", end: "bottom 25%", scrub: 0.5 },
  });

  // Chapter 9: the ways of investing in yourself pop in
  gsap.from(".en-ti li", {
    scale: 0, duration: 0.35, stagger: 0.09, ease: "back.out(2)",
    scrollTrigger: { trigger: ".en-ti", start: "top 85%" },
  });

  // Chapter 12: the road appears from the signpost down, the cards arrive from each side,
  // the macaw flies in and lands, and the banknote gets its stamp
  gsap.fromTo(".caminos__ruta", { clipPath: "inset(0% 0% 100% 0%)" }, {
    clipPath: "inset(0% 0% 0% 0%)",
    scrollTrigger: { trigger: ".caminos", start: "top 80%", end: "bottom 70%", scrub: 0.4 },
  });
  gsap.from(".caminos__letrero", {
    scale: 0, rotation: -25, transformOrigin: "50% 100%", duration: 0.6, ease: "back.out(1.8)",
    scrollTrigger: { trigger: ".caminos__letrero", start: "top 85%" },
  });
  gsap.from(".camino--a", {
    xPercent: -24, opacity: 0, duration: 0.6, ease: "power2.out",
    scrollTrigger: { trigger: ".camino--a", start: "top 82%" },
  });
  gsap.from(".camino--b", {
    xPercent: 24, opacity: 0, duration: 0.6, ease: "power2.out",
    scrollTrigger: { trigger: ".camino--b", start: "top 82%" },
  });
  gsap.from(".camino__ave", {
    x: () => -window.innerWidth * 0.95, y: -90, rotation: -14,
    scrollTrigger: { trigger: ".camino--a", start: "top 95%", end: "top 30%", scrub: 0.6, invalidateOnRefresh: true },
  });
  gsap.from(".billete__sello", {
    scale: 2.8, opacity: 0, rotation: 12, duration: 0.3, ease: "back.out(2.4)",
    scrollTrigger: { trigger: ".billete--final", start: "top 60%" },
  });

  /* ---- Keep measurements right --------------------------------------------- */
  // Once fonts and images are in...
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  // ...and every time the page gets taller or shorter (the game shows its result,
  // the sources open, the quiz shows the profile). Without this, every scene below
  // the change would start too early or too late.
  if ("ResizeObserver" in window) {
    let alto = document.documentElement.scrollHeight;
    let reloj = null;
    new ResizeObserver(() => {
      const nuevo = document.documentElement.scrollHeight;
      if (nuevo === alto) return;
      alto = nuevo;
      clearTimeout(reloj);
      reloj = setTimeout(() => ScrollTrigger.refresh(), 150);
    }).observe(document.querySelector("main"));
  }
})();
