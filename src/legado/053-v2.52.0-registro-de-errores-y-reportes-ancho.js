/* ============================================================
   v2.52.0 · Registro de errores y reportes, ancho completo en
   escritorio, avisos arriba a la derecha, sin parpadeos, Duplicados
   dentro de Calidad del dato, cabecera de Cuentas ordenada, listas
   completas en sugerencias y estados de producto
   ============================================================ */

Object.assign(ICON_NOM, {"map": "<path d=\"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z\" /> <path d=\"M15 5.764v15\" /> <path d=\"M9 3.236v15\" />", "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /> <line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /> <line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /> <line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /> <line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /> <line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /> <line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /> <line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />", "bug": "<path d=\"m8 2 1.88 1.88\" /> <path d=\"M14.12 3.88 16 2\" /> <path d=\"M9 7.13v-1a3.003 3.003 0 1 1 6 0v1\" /> <path d=\"M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6\" /> <path d=\"M12 20v-9\" /> <path d=\"M6.53 9C4.6 8.8 3 7.1 3 5\" /> <path d=\"M6 13H2\" /> <path d=\"M3 21c0-2.1 1.7-3.9 3.8-4\" /> <path d=\"M20.97 5c0 2.1-1.6 3.8-3.5 4\" /> <path d=\"M22 13h-4\" /> <path d=\"M17.2 17c2.1.1 3.8 1.9 3.8 4\" />", "message-square-warning": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" /> <path d=\"M12 7v2\" /> <path d=\"M12 13h.01\" />", "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />", "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\" /> <path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\" />", "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\" />"});
const VERSION_APP = (((document.querySelector('script[src*="app.js"]') || {}).src || '').split('v=')[1]) || '';

/* ---------------- registro de errores ---------------- */

window.addEventListener('error', e => registrarError('error', e.message, { archivo: (e.filename || '').split('/').pop(), linea: e.lineno, columna: e.colno, pila: e.error && e.error.stack ? String(e.error.stack).slice(0, 1500) : null }));
window.addEventListener('unhandledrejection', e => registrarError('error', (e.reason && (e.reason.message || e.reason)) || 'Promesa rechazada', { pila: e.reason && e.reason.stack ? String(e.reason.stack).slice(0, 1500) : null }));
// Errores de la base de datos (no los de permiso esperados)
db.rpc = (orig => function (fn, params, opts) {
  const r = orig.call(db, fn, params, opts);
  if (r && typeof r.then === 'function' && fn !== 'registrar_error') Promise.resolve(r).then(x => {
    if (x && x.error && !/permiso|JWT|TIEMPO/i.test(x.error.message || '') && x.error.code !== 'TIEMPO') registrarError('api', `${fn}: ${x.error.message || x.error.code}`, { funcion: fn, codigo: x.error.code });
  }, () => {});
  return r;
})(db.rpc);

// Reportar un problema (menú de usuario)
(function () {
  const sal = document.querySelector('[data-u="salir"]'); if (!sal || document.querySelector('[data-u="reportar"]')) return;
  sal.insertAdjacentHTML('beforebegin', `<button data-u="reportar">${svgIco(ICON_NOM.bug)} Reportar un problema</button>`);
  document.addEventListener('click', e => { if (e.target.closest('[data-u="reportar"]')) reportarProblema(); });
})();

/* ---------------- sin parpadeos ---------------- */

// El indicador de carga solo aparece si la pantalla tarda más de un cuarto de segundo:
// con respuestas rápidas se pasa directamente del contenido anterior al nuevo, sin destellos
const IR_V252 = ir;
ir = function (t) {
  IR_V252(t);
  const sec = $('v-' + TAB); if (!sec || !sec.classList.contains('cargando')) return;
  sec.classList.remove('cargando'); sec.classList.add('cargando-pend');
  if (PEND > 0) sec.classList.add('cargando'); sec.classList.remove('cargando-pend');
};

/* ---------------- Cuentas: cabecera ordenada; Duplicados dentro de Calidad del dato ---------------- */

// «Guardar filtro» pasa al panel de filtros y columnas
function abrirHerramientasBase2(ctx, ...r) {
  const x = abrirHerramientasBase(ctx, ...r);
  setTimeout(() => {
    // v2.203.0: el panel de filtros es lateral (#tools), no una ventana
    const cont = $('tools') && $('tools').classList.contains('abierto') ? $('tools') : (document.querySelector('dialog[open] .fh') ? document.querySelector('dialog[open]') : null);
    if (!cont || cont.querySelector('#hguardarf') || !$('guardarFiltro') || TAB !== 'directorio') return;
    cont.insertAdjacentHTML('beforeend', `<div class="acts" style="margin:12px 0 0"><button class="btn sec" id="hguardarf">${svgIco(ICON_NOM.star)} Guardar filtro como indicador</button></div>`);
    $('hguardarf').onclick = () => { if (cont.close) cont.close(); else cont.classList.remove('abierto'); $('guardarFiltro').click(); };
  }, 60);
  return x;
}

/* ---------------- listas completas donde antes ponía «y N más» ---------------- */

document.addEventListener('click', e => {
  const b = e.target.closest('[data-vermas]'); if (!b) return;
  const cont = b.closest('.lista') || b.parentElement;
  cont.querySelectorAll(':scope > .extra').forEach(x => x.classList.remove('extra'));
  b.remove();
});

/* ---------------- estados de producto ---------------- */



