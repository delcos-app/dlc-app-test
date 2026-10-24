/* ============================================================
   v2.57.0 · Auditoría visual completa: criterio único de pantallas,
   barras de tabla, ventanas y pila de ventanas, Mi perfil, Empresa,
   Plan, reporte de problemas guiado y un gráfico más en Analítica
   ============================================================ */

Object.assign(ICON_NOM, {"arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />", "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" />", "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /> <polyline points=\"16 17 21 12 16 7\" /> <line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />", "camera": "<path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z\" /> <circle cx=\"12\" cy=\"13\" r=\"3\" />", "circle-help": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\" /> <path d=\"M12 17h.01\" />", "zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />", "badge-check": "<path d=\"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z\" /> <path d=\"m9 12 2 2 4-4\" />", "rocket": "<path d=\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z\" /> <path d=\"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z\" /> <path d=\"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0\" /> <path d=\"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5\" />", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />", "credit-card": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\" /> <line x1=\"2\" x2=\"22\" y1=\"10\" y2=\"10\" />", "mouse-pointer-click": "<path d=\"M14 4.1 12 6\" /> <path d=\"m5.1 8-2.9-.8\" /> <path d=\"m6 12-1.9 2\" /> <path d=\"M7.2 2.2 8 5.1\" /> <path d=\"M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z\" />", "key-round": "<path d=\"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z\" /> <circle cx=\"16.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />", "chevron-down": "<path d=\"m6 9 6 6 6-6\" />"});

/* ---------------- 1. Controles de vista en la barra de cada tabla ---------------- */

// La cabecera de la pantalla es para acciones (crear, registrar…). Buscar, filtros y columnas
// van en la barra de la propia tabla, a la derecha, como en Prescriptores
function ordenarBotones(sec) {
  // Cabecera: secundarios → acción principal → «Filtros y columnas» (el último: el mismo sitio en todas las pantallas)
  sec.querySelectorAll('.saludo .acts, #dircab .acts').forEach(acts => {
    const bs = [...acts.children].filter(b => b.matches('button, a.btn, select'));
    const vista = b => b.dataset && b.dataset.ag && b.dataset.ag !== 'nueva';
    const peso = b => (b.classList.contains('htbtn') || b.id === 'dirtools') ? 4
      : (b.matches('.btn:not(.sec)') && !b.classList.contains('icobtn') && !b.classList.contains('iniact') && !vista(b)) ? 3 : b.matches('select') ? 0 : 1;
    const orden = [...bs].sort((a, c) => peso(a) - peso(c));
    if (orden.some((b, i) => b !== bs[i])) orden.forEach(b => acts.appendChild(b));
    const dt = acts.querySelector(':scope > #dirtools'), h = acts.querySelector(':scope > .ai-hueco');
    if (dt && h && h.nextElementSibling !== dt) acts.insertBefore(h, dt);
    acts.querySelectorAll(':scope > .ai-dir').forEach(x => x.remove());
  });
}

/* ---------------- 2. Inicio: actualizar como icono, igual que los de al lado ---------------- */

function pintarActualizado() {
  pintarActualizadoBase();
  const b = $('iniact'); if (!b) return;
  b.classList.add('icoredondo', 'icoonly');   // v2.337.0: botón de icono del sistema delcos (con el relleno de un botón normal el icono quedaba 3 px a la derecha)
  const c = CACHE_MOD.inicio; const m = c ? Math.floor((Date.now() - c.t) / 60000) : 0;
  b.title = (m < 1 ? 'Datos actualizados ahora' : `Datos actualizados hace ${m} min`) + ' · Pulsa para actualizar';
  b.setAttribute('aria-label', b.title);
  const sp = b.querySelector('span'); if (sp) sp.textContent = '';
}

/* ---------------- 3. Cuentas: una sola ayuda junto al título; nombre configurable en Calidad ---------------- */

// Si antes se subieron varias ayudas al título, se deja solo una
new MutationObserver(() => { const h = document.querySelector('#dircab h1'); if (h) h.querySelectorAll('.ai').forEach((a, i) => { if (i) a.remove(); }); }).observe(document.querySelector('main'), { childList: true, subtree: true });

/* ---------------- 4. IVA: solo los porcentajes (nunca un importe «con IVA») ---------------- */

// Se deshace cualquier conversión errónea (un importe convertido en lista de IVA)
new MutationObserver(() => {
  document.querySelectorAll('select.ivasel').forEach(sel => {
    const inp = sel.previousElementSibling; if (!inp || inp.tagName !== 'INPUT' || esPorcentajeIva(inp)) return;
    inp.classList.remove('hide'); delete inp.dataset.ivasel; delete inp.dataset.sel; sel.remove();
    if (inp.id) { const l = document.querySelector(`label[for="${inp.id}_sel"]`); if (l) l.setAttribute('for', inp.id); }
  });
}).observe(document.body, { childList: true, subtree: true });
function ivaSelector(inp) { if (!inp || !esPorcentajeIva(inp)) return; return ivaSelectorBase2(inp); }

/* ---------------- 5. Archivos: sin el recuadro antiguo; notas de varias líneas ---------------- */

new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1)
  (n.matches && n.matches('input[type=text]') ? [n] : [...n.querySelectorAll('input[type=text]')]).forEach(notaAmplia);
}).observe(document.body, { childList: true, subtree: true });

/* ---------------- 6. Ventanas: tres tamaños según su contenido ---------------- */

VENT_AMPLIA.forEach(fn => {
  const orig = eval(fn);
  const nueva = function (...a) { $('dlg').classList.add('amplia'); return orig.apply(this, a); };
  eval(`${fn} = nueva`);
});
new MutationObserver(() => { if (!$('dlg').open) $('dlg').classList.remove('amplia'); }).observe($('dlg'), { attributes: true, attributeFilter: ['open'] });
new MutationObserver(() => { if (!$('dlg').open) $('dlg').classList.remove('pequena'); }).observe($('dlg'), { attributes: true, attributeFilter: ['open'] });

/* ---------------- 7. Pila de ventanas: abrir una encima de otra sin perder la anterior ---------------- */

const PILA_VENT = []; let APILANDO = false;
$('dlg').addEventListener('close', () => {
  if (APILANDO || !PILA_VENT.length) return;
  const prev = PILA_VENT.pop(), d = $('dlg'), b = $('dbody');
  b.replaceChildren(...prev.nodos); d.className = prev.clases;
  setTimeout(() => { if (!d.open) d.showModal(); }, 0);
});

/* ---------------- 8. Mi perfil y Empresa: pantallas completas ---------------- */


/* ---------------- 9. Plan: «Cómo funciona» explicado paso a paso ---------------- */


/* ---------------- 10. Reportar un problema: guiado y útil para quien lo resuelve ---------------- */

const RASTRO = [];   // últimas acciones de la persona (para reproducir el problema)
document.addEventListener('click', e => {
  const b = e.target.closest('button, a, [data-t], [data-cfg], .dr, .trow'); if (!b) return;
  RASTRO.push({ t: new Date().toISOString().slice(11, 19), pantalla: TAB, que: (b.getAttribute('aria-label') || b.title || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) });
  if (RASTRO.length > 25) RASTRO.shift();
}, true);

/* ---------------- 11. Analítica: «Ventas por canal» junto al embudo ---------------- */

new MutationObserver(() => { if (TAB === 'analitica' && !$('ancanal')) graficoCanal(); }).observe($('v-analitica'), { childList: true, subtree: true });

/* ---------------- se aplica en cada pantalla ---------------- */

let V257_PEND = false;
new MutationObserver(() => {
  if (V257_PEND) return; V257_PEND = true;
  queueMicrotask(() => { V257_PEND = false; const sec = $('v-' + TAB); if (sec) { barraTabla(sec); ordenarBotones(sec); } });
}).observe(document.querySelector('main'), { childList: true, subtree: true });


/* ---------------- v2.58.0 · la configuración de Facturación solo vive en su módulo ---------------- */

const IR_V258 = ir;
ir = function (t) {
  const mapa = { fiscal: 'empresa', series: 'series', vf: 'verifactu', fact: FAC_ULTIMA || 'empresa' };
  if (t === 'config' && (mapa[CFG_SEC] || (CFG_SEC === 'fact' && mapa[CFG_SUB]))) {
    FSEC = mapa[CFG_SEC === 'fact' ? (CFG_SUB || 'fact') : CFG_SEC] || 'empresa'; CFG_SEC = 'rutas'; t = 'facturacion';
  }
  IR_V258(t);
};


/* ---------------- v2.59.0 · nombre configurado en todos los textos; sin ayuda en la tabla de Cuentas ---------------- */

new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) nombreEnTextos(n.nodeType === 1 ? n : n.parentElement); })
  .observe(document.body, { childList: true, subtree: true });
nombreEnTextos(document.body);
// Cuentas: sin ayudas dentro de la barra ni de la tabla
// (se ocultan con estilo: quitarlas hacía que otro componente las volviera a poner, en bucle)


