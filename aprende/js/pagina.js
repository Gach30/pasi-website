/* ==========================================================================
   pagina.js — the page's furniture. Nothing here animates.

   1. Chapter index (the full-screen menu)
   2. Progress bar and the "which chapter am I in" label in the top bar
   3. The four excuse cards (chapter 3) and the folded list of sources
   4. Buttons whose links are still placeholders
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  /* ---- 1. Chapter index --------------------------------------------------- */
  const indice = $("#indice");
  const abrir = $("#abrir-indice");
  const cerrar = $("#cerrar-indice");

  function mostrarIndice(visible) {
    indice.hidden = !visible;
    abrir.setAttribute("aria-expanded", String(visible));
    document.documentElement.style.overflow = visible ? "hidden" : "";   // the page behind does not scroll
    (visible ? cerrar : abrir).focus({ preventScroll: true });
  }

  abrir.addEventListener("click", () => mostrarIndice(true));
  cerrar.addEventListener("click", () => mostrarIndice(false));

  // Choosing a chapter closes the menu and jumps straight there (no long smooth scroll)
  indice.addEventListener("click", (e) => {
    const enlace = e.target.closest("a[href^='#']");
    if (!enlace) return;
    e.preventDefault();
    const destino = $(enlace.getAttribute("href"));
    mostrarIndice(false);
    if (!destino) return;
    if (destino.id === "fuentes" && $("#fuentes-caja")) $("#fuentes-caja").open = true;   // "Fuentes" in the menu opens the list
    const y = destino.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: "instant" });
    history.replaceState(null, "", enlace.getAttribute("href"));
  });

  document.addEventListener("keydown", (e) => {
    if (indice.hidden) return;
    if (e.key === "Escape") mostrarIndice(false);
    if (e.key === "Tab") {                       // keep the keyboard inside the open menu
      const foco = $$("button, a[href]", indice);
      const primero = foco[0], ultimo = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });

  /* ---- 2. Progress bar + current chapter ---------------------------------- */
  const progreso = $("#progreso");
  const etiqueta = $("#cap-actual");
  const etiquetaNumero = $("b", etiqueta);
  const etiquetaTitulo = $("span", etiqueta);
  const capitulos = $$("[data-cap]");
  let enCola = false;
  let capActual = null;

  function medir() {
    enCola = false;
    const maximo = document.documentElement.scrollHeight - window.innerHeight;
    const avance = maximo > 0 ? Math.min(1, window.scrollY / maximo) : 0;
    progreso.style.transform = "scaleX(" + avance.toFixed(4) + ")";

    // The current chapter is the last one whose top has crossed 40% of the screen
    let actual = null;
    for (const cap of capitulos) {
      if (cap.getBoundingClientRect().top <= window.innerHeight * 0.4) actual = cap;
    }
    if (actual !== capActual) {
      capActual = actual;
      if (actual) {
        etiquetaNumero.textContent = actual.dataset.cap;
        etiquetaTitulo.textContent = actual.dataset.titulo;
      }
      etiqueta.classList.toggle("visible", Boolean(actual));
    }
  }

  window.addEventListener("scroll", () => {
    if (!enCola) { enCola = true; requestAnimationFrame(medir); }
  }, { passive: true });
  window.addEventListener("resize", medir);
  medir();

  /* ---- 3. Excuse cards (chapter 3) ---------------------------------------- */
  // Each card turns over: the excuse is on the front, the answer on the back.
  // Both faces work as buttons (tap, click, Enter or Space). The face that is
  // turned away is hidden by the stylesheet, so it cannot be reached by mistake.
  $$(".excusa").forEach((tarjeta) => {
    const frente = $(".excusa__frente", tarjeta);
    const dorso = $(".excusa__dorso", tarjeta);
    dorso.setAttribute("role", "button");                   // the answer is a paragraph: this lets it act as a button too
    dorso.tabIndex = 0;
    const voltear = () => {
      const conFoco = tarjeta.contains(document.activeElement);
      const volteada = tarjeta.classList.toggle("volteada");
      tarjeta.classList.remove("asoma");                    // (the nod the cards do when they first appear)
      // with a keyboard, the focus follows the card to the face that is now on show
      if (conFoco) setTimeout(() => (volteada ? dorso : frente).focus({ preventScroll: true }), 320);
    };
    frente.addEventListener("click", voltear);
    dorso.addEventListener("click", voltear);               // tapping the answer turns the card back
    dorso.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); voltear(); }
    });
  });
  document.addEventListener("touchstart", () => {}, { passive: true });   // lets iPhones show the "pressed" look of buttons

  /* ---- Sources: folded behind a button, opened by any citation ------------- */
  const cajaFuentes = $("#fuentes-caja");
  const botonVolver = $("#volver-lectura");
  let regreso = null;            // where the reader was before a citation took them to the sources: { y, cita }

  function irAFuente(id, cita) {
    const fuente = id && document.getElementById(id);
    if (!cajaFuentes || !fuente || !cajaFuentes.contains(fuente)) return false;
    if (cita && botonVolver) {                              // came from a citation in the text: remember the way back
      regreso = { y: window.scrollY, cita };
      // One step in the browser's history, so the phone's Back gesture returns to the text instead of leaving the page.
      // The browser also remembers the reading position at this exact moment, so on Back it and this file agree.
      history.pushState({ fuente: id }, "");
      botonVolver.hidden = false;
    }
    cajaFuentes.open = true;
    $$(".elegida", cajaFuentes).forEach((otra) => otra.classList.remove("elegida"));
    fuente.classList.add("elegida");                        // outlines the source that was asked for
    fuente.scrollIntoView({ block: "center" });
    fuente.tabIndex = -1;
    fuente.focus({ preventScroll: true });                  // keyboard and screen readers continue from the source
    return true;
  }

  // Back to the exact point of the text where the citation was tapped
  function volverALaLectura() {
    if (!regreso) return;
    const { y, cita } = regreso;
    regreso = null;
    botonVolver.hidden = true;
    $$(".elegida", cajaFuentes).forEach((otra) => otra.classList.remove("elegida"));
    window.scrollTo({ top: y, behavior: "instant" });
    cita.focus({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    const cita = e.target.closest(".cita a");
    if (cita && irAFuente(cita.getAttribute("href").slice(1), cita)) e.preventDefault();
  });
  if (botonVolver) {
    botonVolver.addEventListener("click", () => {
      if (history.state && history.state.fuente) history.back();   // same road as the phone's Back gesture
      else volverALaLectura();
    });
    window.addEventListener("popstate", volverALaLectura);         // Back (button or gesture) after visiting a source
  }
  if (/^#f\d+$/.test(location.hash)) irAFuente(location.hash.slice(1));   // arriving with a link to one source

  /* ---- Links that glide to their target ------------------------------------ */
  // ("Desliza" on the cover, "Saltar esta parte" and "Seguir" in the quiz)
  const calmado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$("a[data-suave]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const destino = $(a.getAttribute("href"));
      if (!destino) return;
      e.preventDefault();
      destino.scrollIntoView({ behavior: calmado ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---- 4. Placeholder links ----------------------------------------------- */
  // The app-store and course buttons still point to "#". Until the real links
  // are in, a tap should not throw the reader back to the top of the page.
  $$("a[data-pendiente]").forEach((a) => {
    a.addEventListener("click", (e) => { if (a.getAttribute("href") === "#") e.preventDefault(); });
  });
})();
