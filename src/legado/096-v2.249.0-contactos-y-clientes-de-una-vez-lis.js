db.rpc = (orig => function (fn, p, ...x) {
  if (DB_PRE.size) { const k = fn + JSON.stringify(p || {}); if (DB_PRE.has(k)) { const r = DB_PRE.get(k); DB_PRE.delete(k); return Promise.resolve(r); } }
  return orig.call(this, fn, p, ...x);
})(db.rpc);
// El buscador de la barra busca directamente (antes pasaba por el campo oculto y esperaba dos veces)
PL.pacientes.buscarQ = v => { const i = $('pacq'); if (i) i.value = v; PAC.q = (v || '').trim(); PAC.pagina = 0; listaPacientes(); };

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


