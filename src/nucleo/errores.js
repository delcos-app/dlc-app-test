// @ts-check
// nucleo/errores.js · está en src/app/core/errors.ts y core/problem-report.ts (v2.425.0). Estos nombres se quedan: el código viejo, los
// puentes y el menú de la persona los usan. Normas: docs/normas_codigo.md.

function registrarError(tipo, mensaje, detalle) { return window.delcos.core.errors.registerError(tipo, mensaje, detalle); }
function esErrorRed(e) { return window.delcos.core.errors.isNetworkError(e); }
