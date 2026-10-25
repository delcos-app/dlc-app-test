// legado 076 · v2.166.0 baja, vuelta de Stripe, altas y Panel delcos: plegado en src/app/core/legacy-c (v2.425.0). Aquí queda su arranque, en el mismo sitio del orden de carga,
// y los nombres que siguen usando otros archivos o las pruebas.
let PAGO_IR_PLAN = location.hash === '#plan' || new URLSearchParams(location.search).has('pago');
let TD_ULTIMO = null, TD_PRESET = null;
window.delcos.legacyC.start076();
async function pintarPaginaPlan(...a) { return window.delcos.legacyC.paintPlanPage(a); }
