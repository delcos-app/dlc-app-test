db.rpc = (orig => function (fn, p, ...x) {
  if (DB_PRE.size) { const k = fn + JSON.stringify(p || {}); if (DB_PRE.has(k)) { const r = DB_PRE.get(k); DB_PRE.delete(k); return Promise.resolve(r); } }
  return orig.call(this, fn, p, ...x);
})(db.rpc);
// El buscador de la barra busca directamente: está en la configuración de Clientes (src/app/components/list-bar, v2.421.0)

document.addEventListener('click', e => {
  const b = e.target.closest('[data-cercavolver]'); if (!b) return;
  e.stopPropagation(); CERCA = null; buscar(true);
});



