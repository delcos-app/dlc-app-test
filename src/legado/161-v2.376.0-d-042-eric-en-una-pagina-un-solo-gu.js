/* ============================================================
    v2.376.0 · D-042 (Eric): en una página, un solo «Guardar», arriba a la derecha. En Configuración cada bloque traía su
    propio botón (dentro de la tarjeta o suelto debajo); ahora la cabecera del apartado lleva «Descartar cambios» y «Guardar»,
    que se activa al cambiar algo y guarda cada bloque modificado con su propio guardado (que queda oculto). Los títulos que
    repiten el de encima se ocultan. Las acciones que no son guardar (enviar un correo de prueba, añadir…) siguen en su bloque.
   ============================================================ */
// Páginas que configuran algo con varios bloques: dónde está su cabecera (donde van los botones) y su contenido. Una ventana que se
// abre encima es ventana (sus botones, abajo); el contenido de un apartado que se pinta dentro de una ventana encajada lo declara con
// data-pagina (Diseño del PDF) y cuenta como página.
const PAG_GUARDA = [
  // toda la página del apartado (también la ventana encajada, p. ej. Diseño del PDF)
  { tab: 'config', cab: () => document.querySelector('#v-config .cfucab'), cuerpo: () => document.querySelector('#v-config .cfupag') || $('cfgcuerpo-hub') },
  { tab: 'facturacion', cab: () => document.querySelector('#v-facturacion .cfgsubs') && document.querySelector('#v-facturacion > .saludo'), cuerpo: () => $('fcuerpo') },
];
const PAG_GUARDA_RE = /^guardar(\s|$)/i, PAG_GUARDA_NO = '#coprueba, #copruebaarriba, .cfuguarda .btn';
// Lo que no cambia datos no activa «Guardar»: buscadores y filtros de la página
const PAG_NO_CAMBIA = 'input[type=search], #txq, #cfubus, [placeholder^="Busca"]';
const PAG_SUCIO = new Set();
let PAG_CLAVE = '';
function pagActual() { const p = PAG_GUARDA.find(x => x.tab === TAB); if (!p) return null; const cab = p.cab(), cuerpo = p.cuerpo(); return cab && cuerpo ? { cab, cuerpo } : null; }
function pagBloque(el, cuerpo) { return el.closest('.cfgsec') || cuerpo; }
function pagBotonesGuardar(cuerpo) {
  return [...cuerpo.querySelectorAll('button, a.btn')].filter(b => PAG_GUARDA_RE.test(b.textContent.trim()) && !b.matches(PAG_GUARDA_NO) && !b.closest('dialog:not(.encajada:has([data-pagina])), .cfucab, .saludo'));
}
// El guardado de cada bloque se queda (con su función) en un contenedor oculto de su mismo bloque; la fila que queda vacía, fuera
function pagOcultarBoton(b) {
  if (b.closest('.cfgocultos')) return;
  const fila = b.parentElement, blq = b.closest('.cfgsecc, .card, #cfgcuerpo, #fcuerpo') || fila;
  let h = blq.querySelector(':scope > .cfgocultos'); if (!h) { h = document.createElement('div'); h.className = 'cfgocultos'; h.hidden = true; blq.appendChild(h); }
  h.appendChild(b);
  if (fila && fila !== blq && ![...fila.children].some(x => x.getClientRects().length)) fila.style.display = 'none';
}
function pagPonerGuardar() {
  const p = pagActual();
  document.querySelectorAll('.cfuguarda').forEach(a => { if (!p || !p.cab.contains(a)) a.remove(); });   // al salir de la configuración (p. ej. a la lista de facturas)
  if (!p) return;
  const { cab, cuerpo } = p;
  // títulos repetidos: el que repite el texto del anterior se oculta
  let prev = '';
  for (const h of [...cab.querySelectorAll('h1, h2'), ...[...cuerpo.querySelectorAll('h2, h3')].filter(x => !cab.contains(x))]) {
    if (!h.getClientRects().length && !h.classList.contains('cfudup')) continue;
    const t = h.textContent.trim().toLowerCase(); if (t && t === prev) h.classList.add('cfudup'); else prev = t;
  }
  if (cab.querySelector('.cfuacts:not(.cfuguarda)')) return;   // el apartado ya trae sus botones en la cabecera (KPIs de Inicio)
  const bs = pagBotonesGuardar(cuerpo);
  let a = cab.querySelector('.cfuguarda');
  if (!bs.length) { if (a) a.remove(); return; }
  bs.forEach(pagOcultarBoton);
  if (!a) {
    // la marca de cambios solo se pierde al cambiar de apartado (una cabecera que se repinta no la borra)
    const clave = TAB + '|' + (TAB === 'config' ? CFG_KEY : (document.querySelector('#v-facturacion .cfgsubs .on, #v-facturacion .cfgsubs [aria-pressed="true"]') || {}).textContent);
    if (clave !== PAG_CLAVE) { PAG_SUCIO.clear(); PAG_CLAVE = clave; }
    a = document.createElement('div'); a.className = 'acts cfuacts cfuguarda';
    a.innerHTML = '<button type="button" class="btn sec" id="cfudescartar" disabled>Descartar cambios</button><button type="button" class="btn" id="cfuguardar" disabled>Guardar</button>';
    cab.appendChild(a);
    $('cfudescartar').onclick = () => { PAG_SUCIO.clear(); if (TAB === 'config') cargarConfig(); else (b => b && b.click())(document.querySelector('#v-facturacion .cfgsubs button.on, #v-facturacion .cfgsubs button[aria-pressed="true"]')); };
    $('cfuguardar').onclick = pagGuardarTodo;
  }
  pagMarcarSucio();
}
function pagMarcarSucio() { const n = PAG_SUCIO.size; ['cfuguardar', 'cfudescartar'].forEach(id => { const b = $(id); if (b) b.disabled = !n; }); }
async function pagGuardarTodo() {
  const g = $('cfuguardar'), p = pagActual(); if (!g || g.disabled || !p) return;
  g.disabled = true;
  const todos = pagBotonesGuardar(p.cuerpo), bs = todos.filter(b => [...PAG_SUCIO].some(c => c.contains(b)));
  for (const b of (bs.length ? bs : todos)) {
    if (!b.isConnected) continue;
    b.click();
    const t0 = Date.now(); await new Promise(r => setTimeout(r, 120));
    while (Date.now() - t0 < 15000 && (RED_VUELO > 0 || b.classList.contains('guardando'))) await new Promise(r => setTimeout(r, 80));
  }
  PAG_SUCIO.clear(); pagMarcarSucio();
}
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
  const p = pagActual(); if (!p || !e.isTrusted) return;
  const t = e.target; if (!t.closest || !p.cuerpo.contains(t) || t.closest('dialog:not(.encajada:has([data-pagina])), .cfucab') || t.matches(PAG_NO_CAMBIA)) return;
  PAG_SUCIO.add(pagBloque(t, p.cuerpo)); pagMarcarSucio();
}, true));
// Elegir con botones (segmentados, marcar) también es cambiar
document.addEventListener('click', e => {
  const p = pagActual(); if (!p || !e.isTrusted) return;
  const b = e.target.closest && e.target.closest('.segs > button, [aria-pressed], [role=radio], [role=switch]');
  if (!b || !p.cuerpo.contains(b) || b.closest('.cfucab, .cfuidx, .pagtabs, .cfgsubs, dialog:not(.encajada:has([data-pagina]))')) return;
  PAG_SUCIO.add(pagBloque(b, p.cuerpo)); pagMarcarSucio();
}, true);
// Las páginas se pintan por partes y algunas se repintan al guardar: se vuelve a colocar al cambiar el contenido
let PAG_GUARDA_RAF = 0;
new MutationObserver(() => { if (PAG_GUARDA_RAF || !PAG_GUARDA.some(x => x.tab === TAB)) return; PAG_GUARDA_RAF = requestAnimationFrame(() => { PAG_GUARDA_RAF = 0; pagPonerGuardar(); }); })
  .observe(document.body, { childList: true, subtree: true });
