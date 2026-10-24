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
