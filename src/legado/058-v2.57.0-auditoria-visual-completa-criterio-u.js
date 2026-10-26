// @ts-check
// legado 058 · v2.57.0 criterio único de pantallas y ventanas: plegado en src/app/core/legacy-c (v2.425.0). Aquí queda su arranque, en el mismo sitio del orden de carga,
// y los nombres que siguen usando otros archivos o las pruebas.
const PILA_VENT = [];  // v2.440.0: APILANDO → estado de src/app (plan 6.6), accesible en window
const RASTRO = [];   // últimas acciones de la persona (para reproducir el problema)
window.delcos.legacyC.start058();
