/* ============================================================
   v2.267.0 · Carga visible y arreglos del móvil (avisos de Eric, 11/10/2026).
   - Al cambiar de pantalla, una línea de luz cruza la parte alta de punta a punta (como un cometa, con los colores de la marca).
   - Los esqueletos llevan su cargador pequeño en cada bloque (y el brillo es más visible): se ve que está cargando.
   - Inicio en el móvil: el engranaje y «Actualizar» están en su sitio desde el primer momento (antes aparecían tarde, primero en
     otra línea y después junto al título) y el saludo no se corta.
   - Menú del móvil: Oportunidades, Compras y Proveedores se marcan ellas (antes se marcaba Pedidos); «Usuarios y roles» pasa a
     «Usuarios» (los roles están en Configuración).
   - El «+» de las listas vuelve a ser el botón redondo después de girar el móvil (antes se quedaba como un botón de texto grande).
   ============================================================ */
// ---- La línea de luz al cambiar de pantalla
function cometa() {
  let c = $('cometa');
  if (!c) { document.body.insertAdjacentHTML('beforeend', '<div id="cometa" class="cometa" aria-hidden="true"><i></i></div>'); c = $('cometa'); }
  c.classList.remove('va'); void c.offsetWidth; c.classList.add('va');
}
ir = (orig => function (t, ...a) {
  if (t && t !== TAB) try { cometa(); } catch (e) {}
  return orig.call(this, t, ...a);
})(ir);

// ---- Inicio: la cabecera en su sitio desde el esqueleto
function inicioCabecera() {
  try {
    const sal = document.querySelector('#v-inicio > .saludo'), acts = sal && sal.querySelector('.acts');
    if (acts && !ES_MEDICO()) {
      if (!acts.dataset.ico) { acts.dataset.ico = '1'; acts.classList.add('icoacts'); }
      if (!$('iniact')) pintarActualizado();
      document.body.classList.add('inilisto');
    }
  } catch (e) {}
}
inicioEsqueleto = (orig => function (...a) { const r = orig.apply(this, a); inicioCabecera(); return r; })(inicioEsqueleto);
// Al abrir la app, el esqueleto de Inicio se pinta antes de que llegue esta parte del código: se completa aquí mismo
if (document.querySelector('#v-inicio.conmos')) inicioCabecera();

// ---- Menú del móvil: la sección que se ve, no la página que la contiene
const SUBSEC_MENU = { llamadas: 'oportunidades', compras: 'compras', proveedores: 'proveedores' };
function tabDelMenu() { return TAB === 'ventas' && typeof PEDSEC !== 'undefined' && SUBSEC_MENU[pedsecVista()] ? SUBSEC_MENU[pedsecVista()] : TAB; }
abrirMasMovil = (orig => function (...a) {
  const r = orig.apply(this, a);
  const t = tabDelMenu();
  document.querySelectorAll('#bmas [data-bm]').forEach(b => { const on = b.dataset.bm === t; if (b.classList.contains('on') !== on) b.classList.toggle('on', on); });
  return r;
})(abrirMasMovil);
// «Usuarios y roles» → «Usuarios»: los roles se gestionan en Configuración
PAGINAS.usuarios.t = 'Usuarios';
PAGINAS.usuarios.d = 'Personas de tu equipo, su rol y su cartera';
PAGINAS.usuarios.tabs = PAGINAS.usuarios.tabs.filter(x => x[0] !== 'roles');
menuPaginas2131 = (orig => function (...a) {
  const r = orig.apply(this, a);
  const b = document.querySelector('nav.main [data-t="usuarios"]');
  if (b) { const x = typeof txTexto === 'function' ? txTexto(b) : null; if (x && /roles/i.test(x.get())) x.set('Usuarios'); else if (!x && /roles/i.test(b.textContent)) b.textContent = 'Usuarios'; if (b.dataset.txdef) b.dataset.txdef = 'Usuarios'; }
  return r;
})(menuPaginas2131);

// ---- El «+» redondo vuelve al volver a vertical
window.addEventListener('resize', () => {
  if (!ES_MOVIL()) return;
  document.querySelectorAll('main button[data-txt]:not(.fab)').forEach(f => {
    if (!/^\s*\+/.test(f.textContent) && !f.dataset.plfab) return;
    f.classList.add('fab'); f.setAttribute('aria-label', f.dataset.txt || 'Añadir'); f.innerHTML = svgIco(ICON_NOM.plus);
  });
});




