ir = (orig => function (t, ...a) {
  if (t && t !== TAB) try { cometa(); } catch (e) {}
  return orig.call(this, t, ...a);
})(ir);

inicioEsqueleto = (orig => function (...a) { const r = orig.apply(this, a); inicioCabecera(); return r; })(inicioEsqueleto);
// Al abrir la app, el esqueleto de Inicio se pinta antes de que llegue esta parte del código: se completa aquí mismo
if (document.querySelector('#v-inicio.conmos')) inicioCabecera();

// ---- Menú del móvil: la sección que se ve, no la página que la contiene
const SUBSEC_MENU = { llamadas: 'oportunidades', compras: 'compras', proveedores: 'proveedores' };
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




