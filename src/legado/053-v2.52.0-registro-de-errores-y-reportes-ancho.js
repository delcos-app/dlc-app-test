// legado 053 · v2.52.0 registro de errores y «Reportar un problema»: plegado en src/app/core/legacy-c (v2.425.0). Aquí queda su arranque, en el mismo sitio del orden de carga,
// y los nombres que siguen usando otros archivos o las pruebas.
const VERSION_APP = (((document.querySelector('script[src*="app.js"]') || {}).src || '').split('v=')[1]) || '';
window.delcos.legacyC.start053();
