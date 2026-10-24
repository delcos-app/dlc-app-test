// componentes/iconos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function iconosMenu() {
  document.querySelectorAll('nav.main [data-t]').forEach(b => {
    if (b.querySelector('.navico') || !ICO_NAV[b.dataset.t]) return;
    b.insertAdjacentHTML('afterbegin', `<span class="navico">${svgIco(ICON_NOM[ICO_NAV[b.dataset.t]])}</span>`);
  });
}
