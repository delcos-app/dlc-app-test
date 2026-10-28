// @ts-check
// «Equipo», el orden de las tablas y el que viaja con la consulta: en src/app/core/layers (v2.424.0).
window.delcos.layers.installTeamToggle();
async function pintarSinAtribuir() { const c = window.delcos.core.byId('cardsinatr'); if (c) c.remove(); }
window.delcos.layers.installTableSort();
window.delcos.layers.installOrderParameter();
document.addEventListener('change', e => { if (e.target && /** @type {HTMLElement} */ (e.target).id === 'popf') window.delcos.screens.orders.markChosenCard(); });
var AN_REP = '';   // v2.329.0: Analítica → Resumen, «Reporte»
