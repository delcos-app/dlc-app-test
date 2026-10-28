// @ts-check
// legado 076 · v2.166.0 baja, vuelta de Stripe, altas y Panel delcos: plegado en src/app/core/legacy-c (v2.425.0). Aquí queda su arranque, en el mismo sitio del orden de carga,
// y los nombres que siguen usando otros archivos o las pruebas.
let PAGO_IR_PLAN = location.hash === '#plan' || new URLSearchParams(location.search).has('pago');
 // v2.440.0: TD_ULTIMO, TD_PRESET → estado de src/app (plan 6.6), accesible en window
window.delcos.legacyC.start076();
