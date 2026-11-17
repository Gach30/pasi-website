/* ==========================================================================
   quiz.js — "Descubre tu perfil" (chapter 10).

   This file only moves the reader through the screens. Everything the quiz
   SAYS and every number it uses (questions, points, profiles, goals, horizons
   and the allocation table) is in js/config.js, in the QUIZ object.

   Screens:  intro  ->  5 questions  ->  goals  ->  result
   ========================================================================== */
(function () {
  "use strict";

  const caja = document.querySelector("#quiz");
  if (!caja || typeof QUIZ === "undefined") return;

  const $ = (sel) => caja.querySelector(sel);
  const vistas = Array.from(caja.querySelectorAll("[data-vista]"));
  const preguntas = QUIZ.preguntas;

  let numero = 0;              // which question is on screen (0 = first)
  let respuestas = [];         // chosen option per question
  let metas = [];              // ids of the chosen goals

  /* Show one screen, hide the others, and move keyboard focus to its heading */
  function mostrar(nombre, foco) {
    vistas.forEach((v) => { v.hidden = v.dataset.vista !== nombre; });
    if (foco) foco.focus({ preventScroll: true });
    // if the top of the card went off-screen (long result), bring it back
    const arriba = caja.getBoundingClientRect().top;
    if (arriba < 0 || arriba > window.innerHeight * 0.6) caja.scrollIntoView({ block: "start" });
  }

  /* ---- Questions ---------------------------------------------------------- */
  function pintarPregunta() {
    const p = preguntas[numero];
    const avance = $("#quiz-avance");
    avance.textContent = "";
    preguntas.forEach((_, i) => {
      const raya = document.createElement("i");
      if (i <= numero) raya.className = "on";
      avance.append(raya);
    });
    $("#quiz-cuenta").textContent = "Pregunta " + (numero + 1) + " de " + preguntas.length;
    $("#quiz-pregunta").textContent = p.texto;

    const opciones = $("#quiz-opciones");
    opciones.textContent = "";
    p.opciones.forEach((opcion, i) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "opcion";
      boton.textContent = opcion.texto;
      boton.setAttribute("aria-pressed", String(respuestas[numero] === i));
      boton.addEventListener("click", () => responder(i));
      opciones.append(boton);
    });
  }

  function responder(i) {
    respuestas[numero] = i;
    if (numero < preguntas.length - 1) {
      numero += 1;
      pintarPregunta();
      $("#quiz-pregunta").focus({ preventScroll: true });
    } else {
      pintarMetas();
      mostrar("metas", $("#quiz-metas-titulo"));
    }
  }

  /* ---- Goals -------------------------------------------------------------- */
  function pintarMetas() {
    const rejilla = $("#quiz-metas");
    rejilla.textContent = "";
    $("#quiz-metas-ayuda").textContent = "Elige hasta " + QUIZ.maxMetas + " metas.";
    QUIZ.metas.forEach((meta) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "meta";
      boton.dataset.id = meta.id;
      const dibujo = document.createElement("img");
      dibujo.src = "/aprende/img/" + meta.icono + ".webp";
      dibujo.alt = "";
      dibujo.width = 64;
      dibujo.height = 64;
      const nombre = document.createElement("span");
      nombre.textContent = meta.nombre;
      boton.append(dibujo, nombre);
      boton.addEventListener("click", () => alternarMeta(meta.id));
      rejilla.append(boton);
    });
    actualizarMetas();
  }

  function alternarMeta(id) {
    const ya = metas.indexOf(id);
    if (ya >= 0) metas.splice(ya, 1);
    else if (metas.length < QUIZ.maxMetas) metas.push(id);
    actualizarMetas();
  }

  function actualizarMetas() {
    const lleno = metas.length >= QUIZ.maxMetas;
    Array.from($("#quiz-metas").children).forEach((boton) => {
      const elegida = metas.includes(boton.dataset.id);
      boton.setAttribute("aria-pressed", String(elegida));
      boton.disabled = lleno && !elegida;       // once 3 are chosen, the rest wait
    });
    $("#quiz-ver").disabled = metas.length === 0;
  }

  /* ---- Result ------------------------------------------------------------- */
  function pintarResultado() {
    const puntos = respuestas.reduce((suma, opcion, i) => suma + preguntas[i].opciones[opcion].puntos, 0);
    const perfil = QUIZ.perfiles.find((p) => puntos <= p.hasta) || QUIZ.perfiles[QUIZ.perfiles.length - 1];
    $("#quiz-perfil").textContent = perfil.nombre;
    $("#quiz-descripcion").textContent = perfil.descripcion;

    const recetas = $("#quiz-recetas");
    recetas.textContent = "";
    QUIZ.metas.filter((m) => metas.includes(m.id)).forEach((meta) => {
      const etf = QUIZ.mezcla[meta.tramo][perfil.id];     // % in broad ETFs
      const seguro = 100 - etf;                           // % in the safe reserve

      const receta = document.createElement("div");
      receta.className = "receta";

      const titulo = document.createElement("h4");
      titulo.textContent = meta.nombre;
      const plazo = document.createElement("p");
      plazo.className = "receta__plazo";
      plazo.textContent = "Plazo sugerido: " + meta.plazo;

      const barra = document.createElement("div");
      barra.className = "mezcla";
      barra.style.setProperty("--seguro", seguro + "%");
      barra.setAttribute("aria-hidden", "true");
      const parteSegura = document.createElement("i");
      const parteEtf = document.createElement("b");
      if (seguro >= 18) parteSegura.textContent = seguro + "%";
      if (etf >= 18) parteEtf.textContent = etf + "%";
      if (seguro === 0) parteSegura.style.display = "none";
      if (etf === 0) parteEtf.style.display = "none";
      barra.append(parteSegura, parteEtf);

      const reparto = document.createElement("p");
      reparto.className = "receta__plazo";
      reparto.textContent = seguro + "% en reserva segura, " + etf + "% en ETF amplios.";

      const porque = document.createElement("p");
      porque.className = "receta__porque";
      porque.textContent = QUIZ.porque[meta.tramo];

      receta.append(titulo, plazo, barra, reparto, porque);
      recetas.append(receta);
    });
  }

  /* ---- Buttons ------------------------------------------------------------ */
  function empezar() {
    numero = 0;
    respuestas = [];
    metas = [];
    pintarPregunta();
    mostrar("pregunta", $("#quiz-pregunta"));
  }

  $("#quiz-empezar").addEventListener("click", empezar);
  $("#quiz-repetir").addEventListener("click", empezar);

  $("#quiz-atras").addEventListener("click", () => {
    if (numero === 0) { mostrar("intro", $("#quiz-empezar")); return; }
    numero -= 1;
    pintarPregunta();
    $("#quiz-pregunta").focus({ preventScroll: true });
  });

  $("#quiz-atras-metas").addEventListener("click", () => {
    numero = preguntas.length - 1;
    pintarPregunta();
    mostrar("pregunta", $("#quiz-pregunta"));
  });

  $("#quiz-ver").addEventListener("click", () => {
    pintarResultado();
    mostrar("resultado", $("#quiz-perfil"));
  });
})();
