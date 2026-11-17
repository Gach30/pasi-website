/* ==========================================================================
   juego.js — "Escoge las ganadoras" (chapter 5).

   100 fruits stand for 100 companies. 4 of them are secretly "the winners"
   (in the real study, about 4% of companies explain all the net wealth the
   U.S. stock market created). The reader picks 3 and almost always misses,
   which is the point. The numbers (100, 4, 3) live in js/config.js.
   ========================================================================== */
(function () {
  "use strict";

  const caja = document.querySelector("#juego");
  if (!caja) return;

  const { total, ganadoras: cuantasGanan, elecciones } = CALC.juego;
  const tablero = caja.querySelector("#juego-grid");
  const estado = caja.querySelector("#juego-estado");
  const final = caja.querySelector("#juego-final");
  const titulo = caja.querySelector("#juego-titulo");
  const texto = caja.querySelector("#juego-texto");
  const TIPOS_DE_FRUTA = 9;          // drawings available in img/frutas-mini.webp

  let ganadoras = new Set();
  let elegidas = [];
  let terminado = false;

  function nuevaPartida() {
    terminado = false;
    elegidas = [];
    caja.classList.remove("terminado");
    final.hidden = true;
    tablero.textContent = "";

    // Decide the winners before the reader touches anything: an honest game
    ganadoras = new Set();
    while (ganadoras.size < cuantasGanan) ganadoras.add(Math.floor(Math.random() * total));

    for (let i = 0; i < total; i++) {
      const fruta = document.createElement("button");
      fruta.type = "button";
      fruta.className = "juego__fruta";
      fruta.style.setProperty("--f", Math.floor(Math.random() * TIPOS_DE_FRUTA));
      fruta.setAttribute("aria-label", "Empresa " + (i + 1));
      fruta.setAttribute("aria-pressed", "false");
      fruta.addEventListener("click", () => elegir(i, fruta));
      tablero.append(fruta);
    }
    contar();
  }

  function contar() {
    const faltan = elecciones - elegidas.length;
    estado.textContent = faltan === 0 ? "Listo. Vamos a ver." : faltan === 1 ? "Te falta 1 por elegir." : "Te faltan " + faltan + " por elegir.";
  }

  function elegir(i, fruta) {
    if (terminado) return;
    const ya = elegidas.indexOf(i);
    if (ya >= 0) {                      // tapping a chosen fruit un-chooses it
      elegidas.splice(ya, 1);
      fruta.setAttribute("aria-pressed", "false");
    } else if (elegidas.length < elecciones) {
      elegidas.push(i);
      fruta.setAttribute("aria-pressed", "true");
    }
    contar();
    if (elegidas.length === elecciones) {
      terminado = true;
      setTimeout(revelar, 450);
    }
  }

  function revelar() {
    const frutas = tablero.children;
    ganadoras.forEach((i) => frutas[i].classList.add("ganadora"));
    caja.classList.add("terminado");

    const aciertos = elegidas.filter((i) => ganadoras.has(i)).length;
    if (aciertos === 0) {
      titulo.textContent = "Ninguna.";
      texto.textContent = "Las " + cuantasGanan + " ganadoras eran otras. No fallaste por falta de talento: con " + cuantasGanan +
        " entre " + total + ", lo normal es fallar. Si hubieras comprado las " + total + ", las " + cuantasGanan + " ya estarían en tu cesta.";
    } else {
      titulo.textContent = aciertos === 1 ? "Le pegaste a una." : "Le pegaste a " + aciertos + ".";
      texto.textContent = "Fue suerte: ni tú ni yo sabíamos cuáles eran. Ahora intenta repetirlo todos los años, durante veinte años. Comprando las " +
        total + " no hace falta acertar.";
    }
    estado.textContent = "";
    final.hidden = false;
  }

  caja.querySelector("#juego-otra").addEventListener("click", nuevaPartida);
  nuevaPartida();
})();
