// componentes/carga.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function pantallaCarga(msg) {
  let o = $('cargatotal');
  if (!o) { document.body.insertAdjacentHTML('beforeend', '<div id="cargatotal" class="cargatotal"></div>'); o = $('cargatotal'); }
  o.innerHTML = `<div><span class="spin"></span><b>${esc(msg)}</b><span class="sm">Un momento: se está cargando todo de nuevo</span></div>`;
  o.classList.remove('hide');
}
