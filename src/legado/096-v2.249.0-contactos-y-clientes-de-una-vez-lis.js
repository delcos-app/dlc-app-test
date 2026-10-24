/* ============================================================
   v2.249.0 · Contactos y Clientes de una vez (listas sin fantasmas, primer grupo). Se sigue enseñando el esqueleto sin cargador
   encima (modelo «Lista» de la v2.236), pero ahora es fiel: cada pieza de la estructura (cabecera, indicadores, barra con
   buscador, filtros rápidos y recuento, tabla) está en su sitio desde el primer momento y al llegar los datos solo cambia lo de
   dentro. Antes el recuento del esqueleto medía distinto que la cifra y empujaba el buscador y los filtros, y en Clientes los
   filtros rápidos aparecían tarde (su desplegable se crea al llegar los datos) y salían dos esqueletos seguidos porque la lista
   esperaba a la de poblaciones. Ahora:
   - El recuento tiene sitio fijo y los filtros rápidos sin desplegable todavía se ven con su nombre, en espera (plespera).
   - Clientes pide a la vez las poblaciones y la lista (DB_PRE: lo pedido antes se entrega una vez, sin volver a la red) y el
     buscador espera 300 ms (antes 600: la barra y el campo oculto esperaban cada uno lo suyo).
   - Arreglos: «Volver a la búsqueda» de «Cerca de mí» funciona desde la barra (era una copia sin clic y con el id repetido);
     con el mapa abierto no queda la tabla vacía debajo; el resumen de filtros de antes (#chips) ya no aparece encima
     de la tabla empujándola (lo dicen los filtros rápidos y el número de la barra).
   ============================================================ */
// ---- Lo pedido antes, entregado una vez sin volver a la red
const DB_PRE = new Map();
db.rpc = (orig => function (fn, p, ...x) {
  if (DB_PRE.size) { const k = fn + JSON.stringify(p || {}); if (DB_PRE.has(k)) { const r = DB_PRE.get(k); DB_PRE.delete(k); return Promise.resolve(r); } }
  return orig.call(this, fn, p, ...x);
})(db.rpc);
// Los mismos parámetros con que listaPacientes pide la lista
const pacParams = () => ({ q: PAC.q || null, p_medico: PAC.medico,
  lim: tamPagina(), desplaz: PAC.pagina * tamPagina(), p_tipo: PAC.tipo || null, p_pedidos: PAC.pedidos || null,
  p_municipio: PAC.municipio || null, ...(Object.keys(PAC.campos || {}).length ? { f_campos: PAC.campos } : {}) });
pintarPacientes = (orig => async function (...a) {
  const p = pacParams();
  const [m, l] = await Promise.all([db.rpc('municipios_clientes'), db.rpc('clientes_lista', p)]);
  DB_PRE.set('municipios_clientes{}', m); DB_PRE.set('clientes_lista' + JSON.stringify(p), l);
  return orig.apply(this, a);
})(pintarPacientes);
// El buscador de la barra busca directamente (antes pasaba por el campo oculto y esperaba dos veces)
PL.pacientes.buscarQ = v => { const i = $('pacq'); if (i) i.value = v; PAC.q = (v || '').trim(); PAC.pagina = 0; listaPacientes(); };

// ---- «Cerca de mí»: el recuento de la barra lleva «Volver a la búsqueda» de verdad
plRecuento = (orig => function (sec, c) {
  const r = orig.call(this, sec, c);
  return typeof r === 'string' ? r.replace(/\sid="cercacerrar"/g, ' data-cercavolver') : r;
})(plRecuento);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cercavolver]'); if (!b) return;
  e.stopPropagation(); CERCA = null; buscar(true);
});

// ---- La barra tiene sus filtros rápidos desde el primer momento: mientras su desplegable no existe (Clientes lo crea al llegar
// los datos), el filtro se ve con su nombre y en espera, en vez de aparecer después empujando el buscador
plSync = (orig => function (tab, ...x) {
  const r = orig.call(this, tab, ...x);
  const sec = $('v-' + tab), c = plCfg(tab); if (!sec || !c || !c.rapidos) return r;
  sec.querySelectorAll(':scope > .pltool [data-plr]').forEach(b => {
    if (plSel(b.dataset.plr)) { if (b.classList.contains('plespera')) b.classList.remove('plespera'); return; }
    const nom = (c.rapidos.find(x => x[0] === b.dataset.plr) || [])[1]; if (!nom) return;
    if (b.classList.contains('hide')) b.classList.remove('hide');
    if (!b.classList.contains('plespera')) b.classList.add('plespera');
    if (b.textContent !== nom) b.textContent = nom;
  });
  return r;
})(plSync);


