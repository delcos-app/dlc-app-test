// legado 078 · v2.184.0 la app se pone al día sola y Agenda sin recargas: plegado en src/app/core/legacy-c (v2.425.0). Aquí queda su arranque, en el mismo sitio del orden de carga,
// y los nombres que siguen usando otros archivos o las pruebas.
const PANTALLA_TACTIL = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
let DLG_EPOCA = 0;
let DISTRIBUIDORES = null;   // v2.417.0: el bloque «Lo sirve» lo pinta y lo guarda el editor (src/app/screens/orders/editor/distributor.ts)
window.delcos.legacyC.start078();
