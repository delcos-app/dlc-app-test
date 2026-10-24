
document.addEventListener('change', filtroGuardar, true);
document.addEventListener('input', filtroGuardar, true);
// Las pantallas montan su periodo justo antes de pedir la lista: es el momento de devolver los filtros
function montarPeriodo(el, ...a) {
  const r = montarPeriodoBase.call(this, el, ...a);
  try { filtrosRestaurar(el && el.closest('main > section')); } catch (e) {}
  return r;
}





