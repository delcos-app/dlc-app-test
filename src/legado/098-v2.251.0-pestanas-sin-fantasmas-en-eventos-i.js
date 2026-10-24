/* ============================================================
   v2.251.0 · Pestañas sin fantasmas en Eventos, Intervenciones, Concursos y Parque (listas sin fantasmas, tercer grupo). Las cuatro
   listas de bloques llegan de una vez y no se recolocan al buscar, filtrar, pulsar un bloque u ordenar (prueba bloques2251),
   pero al cambiar de pestaña (Concursos: En marcha, Contratos, Cerrados) la página entera se volvía a montar y, mientras
   llegaban los datos, la cabecera se quedaba sin su botón, el filtro de bloques desaparecía y la barra se movía. Ahora:
   - Cambiar entre pestañas que son listas no vuelve a montar la página: la pestaña se marca al momento, la lista de antes se
     atenúa y la nueva la sustituye de una vez cuando llegan sus datos (a Informe de gastos de Eventos, que no es una lista, se
     sigue llegando montando la página entera).
   - El filtro de bloques se queda en su sitio, desactivado, si la pestaña tiene un solo bloque (antes desaparecía y el buscador
     se ensanchaba).
   ============================================================ */
cargarPagina = (orig => function (t, ...a) {
  const P = PAGINAS[t], sec = $('v-' + t), caja = sec && sec.querySelector('#cfgcuerpo'), tabs = sec && sec.querySelector(':scope > .pagtabs');
  if (!P || !BLQ[t] || TAB !== t || !caja || !tabs || !sec.classList.contains('plantilla')) return orig.call(this, t, ...a);
  const tab = P.tabs.some(x => x[0] === PAG_TAB[t]) ? PAG_TAB[t] : P.tabs[0][0];
  tabs.querySelectorAll('[data-ptab]').forEach(b => b.classList.toggle('on', b.dataset.ptab === tab));
  // Solo entre pestañas que son listas (Informe de gastos de Eventos no lo es: esa página se vuelve a montar entera, como antes)
  if (PL_SECC[t] && !PL_SECC[t]()) return orig.call(this, t, ...a);
  caja.classList.add('pagcambia');
  return Promise.resolve().then(P.tabs.find(x => x[0] === tab)[2]).finally(() => { const c = $('cfgcuerpo'); if (c) c.classList.remove('pagcambia'); });
})(cargarPagina);
// El filtro de bloques no desaparece: con un solo bloque se queda desactivado
plSync = (orig => function (tab, ...x) {
  const r = orig.call(this, tab, ...x);
  if (!BLQ[tab]) return r;
  const b = document.querySelector(`#v-${tab} > .pltool [data-plr="#plg-${tab}"]`), s = $('plg-' + tab);
  if (b && s) {
    const nada = s.options.length < 2;
    if (nada && b.classList.contains('hide')) b.classList.remove('hide');
    if (b.classList.contains('plnada') !== nada) b.classList.toggle('plnada', nada);
    if (nada && b.textContent !== BLQ[tab].grupo) b.textContent = BLQ[tab].grupo;
  }
  return r;
})(plSync);


