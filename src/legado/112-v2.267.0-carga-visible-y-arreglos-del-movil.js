ir = (orig => function (t, ...a) {
  if (t && t !== TAB) try { cometa(); } catch (e) {}
  return orig.call(this, t, ...a);
})(ir);

// Al abrir la app, el esqueleto de Inicio se pinta antes de que llegue esta parte del código: se completa aquí mismo
if (document.querySelector('#v-inicio.conmos')) inicioCabecera();

// «Usuarios y roles» → «Usuarios»: los roles se gestionan en Configuración
PAGINAS.usuarios.t = 'Usuarios';
PAGINAS.usuarios.d = 'Personas de tu equipo, su rol y su cartera';
PAGINAS.usuarios.tabs = PAGINAS.usuarios.tabs.filter(x => x[0] !== 'roles');

// ---- El «+» redondo vuelve al volver a vertical
window.addEventListener('resize', () => {
  if (!ES_MOVIL()) return;
  document.querySelectorAll('main button[data-txt]:not(.fab)').forEach(f => {
    if (!/^\s*\+/.test(f.textContent) && !f.dataset.plfab) return;
    f.classList.add('fab'); f.setAttribute('aria-label', f.dataset.txt || 'Añadir'); f.innerHTML = svgIco(ICON_NOM.plus);
  });
});




