Object.keys(ORD_MEM).forEach(t => { ORD_SRV[t] = (i, n) => (ORD_MEM[t].campos[i] != null && !htCeldaNoOrdenable(n)) ? 'c' + i : null; });
// La lista llega ordenada de la base según la columna elegida
db.rpc = (orig => async function (fn, args, ...r) {
  const res = await orig.call(this, fn, args, ...r);
  const tipo = Object.keys(ORD_MEM).find(t => ORD_MEM[t].fn === fn);
  if (tipo && res && Array.isArray(res.data) && HT_ORDEN[tipo]) return Object.assign({}, res, { data: ordMemOrdenar(tipo, res.data) });
  return res;
})(db.rpc);
// Pulsar la columna vuelve a pintar la lista entera desde la primera página
document.addEventListener('click', e => {
  const c = e.target.closest('.dgrid > .dh > *'); if (!c || e.target.closest('input, button, select, .res')) return;
  const tipo = htTipo(c.closest('.dgrid')); if (!ORD_MEM[tipo]) return;
  if (tipo === 'facts' && $('fcob')) { FACPAG = 0; $('fcob').dispatchEvent(new Event('change')); }
  if (tipo === 'llam' && $('llfres')) { LLPAG = 0; $('llfres').dispatchEvent(new Event('change')); }
});




