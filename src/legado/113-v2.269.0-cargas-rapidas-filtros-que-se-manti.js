plCargarKpis = (orig => function (tab, ...a) {
  if (tab !== TAB) return;   // en otra pantalla, no (se piden al llegar a la suya)
  return orig.call(this, tab, ...a);
})(plCargarKpis);

document.addEventListener('change', filtroGuardar, true);
document.addEventListener('input', filtroGuardar, true);
// Las pantallas montan su periodo justo antes de pedir la lista: es el momento de devolver los filtros
montarPeriodo = (orig => function (el, ...a) {
  const r = orig.call(this, el, ...a);
  try { filtrosRestaurar(el && el.closest('main > section')); } catch (e) {}
  return r;
})(montarPeriodo);





