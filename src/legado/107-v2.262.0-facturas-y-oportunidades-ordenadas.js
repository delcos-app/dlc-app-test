/* ============================================================
   v2.262.0 · Facturas y Oportunidades ordenadas de verdad (punto 3 del plan del 11/10/2026). Las dos listas traen ya todo el periodo
   elegido (la base filtra por fechas, búsqueda y estado) y se paginaban en la pantalla, pero al pulsar una columna solo se ordenaban
   las filas de la página que se veía. Ahora el orden se aplica a toda la lista del periodo antes de paginar y se vuelve a la primera
   página: es lo más eficiente (los datos ya están en el móvil; no hace falta otra consulta ni cambiar la base). Si algún día una
   empresa tiene miles de facturas en un mismo periodo, se pasaría la paginación a la base.
   ============================================================ */
const ORD_MEM = {
  facts: { fn: 'facturas_lista', campos: ['numero', 'fecha', 'cliente', 'nif', 'base', 'cuota_iva', 'total', 'vencimiento', 'estado_cobro'] },
  llam: { fn: 'llamadas_lista', campos: ['fecha', x => x.cliente || x.nombre, 'importe_estimado', x => x.medico || x.cuenta_texto, x => x.resultado || (x.pedido_id ? 'Pedido hecho' : ''), 'proxima_fecha', 'usuario'] }
};
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




