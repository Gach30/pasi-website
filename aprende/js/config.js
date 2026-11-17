/* ==========================================================================
   config.js — EVERYTHING YOU MAY WANT TO REVIEW OR TWEAK LIVES HERE.

   Gabriel: this is the only file you need to open to change the quiz
   (questions, goals, horizons, the allocation table) or the numbers the
   calculators use. Change a value, save, reload the page. Nothing else
   needs to be touched.

   Sections
     1. QUIZ  — "Descubre tu perfil" (chapter 10)
     2. CALC  — numbers behind the calculators and the charts
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. QUIZ — "Descubre tu perfil"
   -------------------------------------------------------------------------- */
const QUIZ = {

  /* --- 1a. The five questions ---------------------------------------------
     Each answer gives 0 to 3 points. More points = more tolerance for risk.
     Total possible: 0 to 15.                                               */
  preguntas: [
    {
      // reaction to a drop
      texto: "Inviertes $1.000 y a los tres meses valen $700. ¿Qué haces?",
      opciones: [
        { texto: "Vendo todo antes de perder más.", puntos: 0 },
        { texto: "Vendo una parte para dormir tranquilo.", puntos: 1 },
        { texto: "No toco nada y espero.", puntos: 2 },
        { texto: "Si puedo, compro más: está más barato.", puntos: 3 },
      ],
    },
    {
      // experience
      texto: "¿Cuánta experiencia tienes invirtiendo?",
      opciones: [
        { texto: "Ninguna. Esta sería mi primera vez.", puntos: 0 },
        { texto: "He probado algo, sin mucha constancia.", puntos: 1 },
        { texto: "Invierto con regularidad desde hace más de un año.", puntos: 2 },
        { texto: "Llevo años invirtiendo y ya viví una caída fuerte.", puntos: 3 },
      ],
    },
    {
      // income stability
      texto: "¿Qué tan estable es tu ingreso?",
      opciones: [
        { texto: "Muy variable: hay meses buenos y meses en cero.", puntos: 0 },
        { texto: "Variable, pero casi siempre alcanza.", puntos: 1 },
        { texto: "Estable: sé cuánto entra cada mes.", puntos: 2 },
        { texto: "Estable y con más de una fuente.", puntos: 3 },
      ],
    },
    {
      // time
      texto: "¿Cuándo vas a necesitar la mayor parte de este dinero?",
      opciones: [
        { texto: "En menos de 2 años.", puntos: 0 },
        { texto: "Entre 2 y 5 años.", puntos: 1 },
        { texto: "Entre 5 y 10 años.", puntos: 2 },
        { texto: "En más de 10 años.", puntos: 3 },
      ],
    },
    {
      // growth vs calm
      texto: "¿Con cuál de estas frases te identificas más?",
      opciones: [
        { texto: "Prefiero ganar poco con tal de no ver mi dinero bajar.", puntos: 0 },
        { texto: "Acepto bajadas pequeñas a cambio de un poco más de crecimiento.", puntos: 1 },
        { texto: "Aguanto ver caer 20% o 30% algún año si a la larga crece más.", puntos: 2 },
        { texto: "Busco el mayor crecimiento, aunque algún año caiga a la mitad.", puntos: 3 },
      ],
    },
  ],

  /* --- 1b. The three profiles ----------------------------------------------
     "hasta" = highest score (inclusive) that still lands in that profile.   */
  perfiles: [
    {
      id: "conservador", nombre: "Conservador", hasta: 5,
      descripcion: "Para ti, dormir tranquilo vale más que ganar más. Tiene sentido empezar con una parte pequeña en ETF amplios y el resto en reserva segura, y subir de a poco a medida que agarras confianza.",
    },
    {
      id: "moderado", nombre: "Moderado", hasta: 10,
      descripcion: "Aceptas bajadas razonables a cambio de crecimiento. Te calza una mezcla balanceada, que se va volviendo más segura a medida que se acerca la fecha de cada meta.",
    },
    {
      id: "arriesgado", nombre: "Arriesgado", hasta: 15,
      descripcion: "Toleras caídas fuertes sin vender, y tienes tiempo. Puedes inclinarte más hacia ETF amplios en tus metas de largo plazo. Ojo: arriesgado no significa adivinar ni apostar.",
    },
  ],

  /* --- 1c. The goals --------------------------------------------------------
     plazo  = the recommended horizon shown to the reader.
     tramo  = which row of the allocation table (1d) the goal uses.
     icono  = image file in /img (without extension).                        */
  maxMetas: 3,   // how many goals the reader may pick
  metas: [
    { id: "viaje",     nombre: "Un viaje",              plazo: "1 a 2 años",    tramo: "corto",      icono: "meta-viaje" },
    { id: "boda",      nombre: "Mi boda",               plazo: "1 a 3 años",    tramo: "corto",      icono: "meta-boda" },
    { id: "carro",     nombre: "Un carro",              plazo: "2 a 4 años",    tramo: "medioCorto", icono: "meta-carro" },
    { id: "estudios",  nombre: "Estudios",              plazo: "2 a 5 años",    tramo: "medioCorto", icono: "meta-estudios" },
    { id: "negocio",   nombre: "Negocio propio",        plazo: "3 a 7 años",    tramo: "medio",      icono: "meta-negocio" },
    { id: "casa",      nombre: "Mi casa",               plazo: "5 a 10 años",   tramo: "largo",      icono: "meta-casa" },
    { id: "hijos",     nombre: "Estudios de mis hijos", plazo: "10 a 18 años",  tramo: "muyLargo",   icono: "meta-hijos" },
    { id: "libertad",  nombre: "Libertad financiera",   plazo: "15 años o más", tramo: "muyLargo",   icono: "meta-libertad" },
    { id: "retiro",    nombre: "Mi retiro",             plazo: "20 años o más", tramo: "retiro",     icono: "meta-retiro" },
  ],

  /* --- 1d. The allocation table ---------------------------------------------
     For each horizon (tramo) and each profile: the share, in %, that goes to
     BROAD, LOW-COST ETFs. The rest goes to "reserva segura" (cash and
     short-term bonds).

     The rule behind the numbers:
       short horizon  -> mostly safe
       long horizon   -> more ETFs
       the risk profile shifts it up or down

     It is an educational starting point, NOT a recommendation.             */
  mezcla: {
    //              conservador  moderado  arriesgado
    corto:      { conservador: 0,  moderado: 0,  arriesgado: 10 },   // up to ~2-3 years
    medioCorto: { conservador: 10, moderado: 25, arriesgado: 40 },   // ~2 to 5 years
    medio:      { conservador: 25, moderado: 45, arriesgado: 60 },   // ~3 to 7 years
    largo:      { conservador: 40, moderado: 60, arriesgado: 75 },   // ~5 to 10 years
    muyLargo:   { conservador: 55, moderado: 75, arriesgado: 90 },   // ~10 to 20 years
    retiro:     { conservador: 65, moderado: 85, arriesgado: 95 },   // 20 years or more
  },

  /* One-line explanation shown under each goal, by horizon. */
  porque: {
    corto:      "Lo vas a necesitar pronto: una caída no te daría tiempo de recuperarte. Aquí manda la seguridad.",
    medioCorto: "Hay algo de tiempo, pero no tanto. Una parte pequeña puede crecer; el grueso se queda seguro.",
    medio:      "Tiempo suficiente para aguantar una caída normal, no una larga. Mitad y mitad, según tu perfil.",
    largo:      "Con cinco años o más, las caídas han tenido tiempo de recuperarse. Aquí el crecimiento pesa más.",
    muyLargo:   "Más de una década: el interés compuesto es el que hace el trabajo. Mayoría en ETF amplios.",
    retiro:     "Veinte años o más: es el plazo donde el tiempo trabaja más a tu favor. Ve bajando el riesgo cuando te acerques.",
  },
};

/* --------------------------------------------------------------------------
   2. CALC — numbers behind the calculators and charts
   Every number here has its source in the footer of the page.
   -------------------------------------------------------------------------- */
const CALC = {

  /* Chapter 2 — inflation.
     3.7% a year: the latest official 12-month figure for the U.S. (CPI-U,
     September 2026, published 14 October 2026). Gabriel chose it on
     17 Nov 2026. The calculator ASSUMES prices keep rising at this pace.
     (For reference, the 20-year average, Oct 2006 to Oct 2026, was 2.61%.)  */
  inflacionAnual: 0.037,
  ahorroInicial: 1000,

  /* Chapter 6 — compound interest.
     10% a year = US stocks (S&P 500 with dividends), 1928-2025, compound
     average, BEFORE inflation (Damodaran, NYU Stern). The whole page uses
     this one figure. Illustrative, not a promise.                           */
  rendimientoAnual: 0.10,
  aporteInicial: 50,     // $ per month shown when the page loads
  aniosInicial: 20,

  /* "Starting early beats starting big" example (same rate as above). */
  madrugar: {
    temprano: { nombre: "Ana",  mensual: 100, anios: 40 },   // starts at 25
    tarde:    { nombre: "Luis", mensual: 200, anios: 30 },   // starts at 35
  },

  /* Chapter 7 — promised returns. Each chip: label + the MONTHLY rate. */
  promesas: [
    { etiqueta: "0,8% al mes", mensual: 0.008 },   // ~10% a year: the stock market's long-run average
    { etiqueta: "2% al mes",   mensual: 0.02 },
    { etiqueta: "5% al mes",   mensual: 0.05 },
    { etiqueta: "10% al mes",  mensual: 0.10 },
    { etiqueta: "1% diario",   mensual: Math.pow(1.01, 30.4167) - 1 },
  ],
  umbralSospecha: 0.12,   // above this per year: "ask a lot of questions"
  umbralAlarma: 0.20,     // above this per year: "be very suspicious"

  /* Chapter 8 — the four big S&P 500 drops since 2000 (price index, closing
     basis). desde/hasta = month of the peak and of the lowest point.       */
  caidas: [
    { nombre: "2000–2002", desde: "2000-03", hasta: "2002-10", caida: -49, recupero: "7 años" },
    { nombre: "2007–2009", desde: "2007-10", hasta: "2009-03", caida: -57, recupero: "5 años y medio" },
    { nombre: "2020",      desde: "2020-02", hasta: "2020-03", caida: -34, recupero: "6 meses" },
    { nombre: "2022",      desde: "2022-01", hasta: "2022-10", caida: -25, recupero: "2 años" },
  ],

  /* Chapter 8 — the "pasito a pasito" (DCA) drawing. Made-up prices, one per
     month; the reader buys the same amount every month.                     */
  dca: { cadaMes: 40, precios: [10, 11, 9, 7, 6, 8, 5, 6, 8, 9, 11, 12] },

  /* Chapter 5 — the guessing game. 100 companies, 4 of them are "the winners"
     (Bessembinder: about 4% of companies explain all the net wealth created).  */
  juego: { total: 100, ganadoras: 4, elecciones: 3 },

  /* Chapter 9 — emergency fund: months of expenses. */
  emergenciaMeses: [3, 6],
  gastoInicial: 600,
};
