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



