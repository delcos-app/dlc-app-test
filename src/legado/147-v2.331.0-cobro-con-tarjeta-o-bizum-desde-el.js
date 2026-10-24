// v2.345.0: solo en pruebas hasta tener el terminal del banco (decisión de Eric); para abrirlo en producción, TPV_VISIBLE = true
const TPV_VISIBLE = EN_PRUEBAS || /^(localhost|127\.)/.test(location.hostname);   // en local, para la batería
pedidoPago = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  await tpvBloque(id);
  return r;
})(pedidoPago);

// Configuración → Facturación → «Cobro con tarjeta y Bizum»
function arbolCfgUnicoBase6(...a) {
  const g = arbolCfgUnicoBase5.apply(this, a);
  if (!TPV_VISIBLE || !puedeOrganizacion() || !puedeModulo('ventas')) return g;
  let fac = g.find(x => x[0] === 'Facturación');
  if (!fac) { fac = ['Facturación', []]; g.push(fac); }
  if (!fac[1].some(x => x.k === 'tpv'))
    fac[1].push({ k: 'tpv', t: 'Cobro con tarjeta y Bizum', ic: 'credit-card', d: 'El cliente paga desde un SMS y el pedido queda cobrado solo', r: () => pintarTpv() });
  return g;
}
CFG_CLAVES.tpv = 'tarjeta bizum tpv redsys paygold cobro pago enlace sms banco';


