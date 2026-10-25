














// ——— Sin manual, sin «Inicio» y Configuración con lo suyo ———
function arbolCfgUnicoBase5(...a) {
  const g = arbolCfgUnicoBase4.apply(this, a);
  if (!ES_MEDICO()) return g;
  return g.map(([t, l]) => [t, (l || []).filter(x => x.k === 'datos' || x.k === 'notif').map(x => x.k === 'datos' ? Object.assign({}, x, { d: 'Nombre, teléfono, idioma y contraseña' }) : x)]).filter(([, l]) => l.length);
}
function resumirAyuda(pop) {
  resumirAyudaBase2.call(this, pop);
  if (ES_MEDICO()) pop.querySelectorAll('.aiman').forEach(x => x.remove());
}





