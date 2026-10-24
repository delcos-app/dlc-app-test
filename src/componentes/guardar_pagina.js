// componentes/guardar_pagina.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

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
