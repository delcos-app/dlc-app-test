/* ============================================================
   v2.331.0 · Cobro con tarjeta o Bizum desde el pedido (petición de Eric, 20/10/2026; SQL 171 y función del servidor «cobro_tpv»).
   - Al confirmar un pedido con forma de pago tarjeta o Bizum (y el cobro configurado), delcos pide a Redsys un cobro PayGold y el banco
     envía al móvil del cliente un SMS con el enlace; en esa página paga con tarjeta o Bizum. Cuando paga, Redsys avisa y el pedido pasa
     solo a «Cobrado» (y, si tiene factura, se apunta el cobro). Nadie coge el TPV ni mira la cuenta.
   - En el pedido, dentro de «Pago», el cobro con tarjeta o Bizum: estado del envío (enviado, pagado, no pagado, caducado),
     «Volver a enviar» y, en el entorno de pruebas, «Abrir la página de pago» (el banco de pruebas no envía SMS).
   - Configuración → Facturación → «Cobro con tarjeta y Bizum» (quien configura la empresa): número de comercio, terminal, clave
     secreta, entorno pruebas/real, «Probar» y la dirección de aviso para el banco.
   ============================================================ */
const tpvCfg = () => AJUSTES.cobro_tpv || {};
// v2.345.0: solo en pruebas hasta tener el terminal del banco (decisión de Eric); para abrirlo en producción, TPV_VISIBLE = true
const TPV_VISIBLE = EN_PRUEBAS || /^(localhost|127\.)/.test(location.hostname);   // en local, para la batería
const tpvActivo = () => !!(TPV_VISIBLE && tpvCfg().activo && puedeModulo('ventas'));
const esPagoTpv = fp => /tarjeta|bizum/i.test(fp || '');
const tpvMovil = t => { let m = String(t || '').replace(/\D/g, ''); m = m.replace(/^(0034|34)(?=[67]\d{8}$)/, ''); return /^[67]\d{8}$/.test(m) ? m : ''; };
const TPV_ERR = {
  permiso: 'No tienes permiso para enviar cobros', estado: 'El pedido tiene que estar confirmado', pagado: 'Este pedido ya está cobrado',
  sin_cargo: 'Una entrega sin cargo no se cobra', importe: 'El pedido no tiene importe', sesion: 'La sesión ha caducado: vuelve a entrar',
  sin_configurar: 'El cobro con tarjeta o Bizum no está configurado (Configuración → Facturación)', no_encontrado: 'No se encuentra el pedido'
};
const TPV_EST = { Enviado: ['Enviado', 'p-est'], Pagado: ['Pagado', 'p-trfok'], Fallido: ['No pagado', 'p-urg'], Caducado: ['Caducado', 'p-urg'], Preparado: ['Enviando…', 'p-warn'] };
let TPV_MIRA = null;
pedidoPago = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  await tpvBloque(id);
  return r;
})(pedidoPago);

// Configuración → Facturación → «Cobro con tarjeta y Bizum»
arbolCfgUnico = (orig => function (...a) {
  const g = orig.apply(this, a);
  if (!TPV_VISIBLE || !puedeOrganizacion() || !puedeModulo('ventas')) return g;
  let fac = g.find(x => x[0] === 'Facturación');
  if (!fac) { fac = ['Facturación', []]; g.push(fac); }
  if (!fac[1].some(x => x.k === 'tpv'))
    fac[1].push({ k: 'tpv', t: 'Cobro con tarjeta y Bizum', ic: 'credit-card', d: 'El cliente paga desde un SMS y el pedido queda cobrado solo', r: () => pintarTpv() });
  return g;
})(arbolCfgUnico);
CFG_CLAVES.tpv = 'tarjeta bizum tpv redsys paygold cobro pago enlace sms banco';
// Datos públicos del entorno de pruebas de Redsys (no cobran nada)
const TPV_PRUEBAS = { comercio: '999008881', terminal: '1', clave: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7' };


