/* ============================================================
   v2.316.0 · Pedidos en el móvil (aviso de Eric: la tarjeta apenas enseñaba lo esencial). Cada pedido en tres líneas:
   quién (cliente), estado e importe a la derecha; qué y cuántas (unidades y productos); y forma de pago, fecha y
   profesional de referencia.
   ============================================================ */
PL.ventas.pedidos.card = dr => {
  const p = (typeof PEDIDOS !== 'undefined' ? PEDIDOS : []).find(x => x.id === dr.dataset.ped);
  if (!p) return { a: '', b: '', c: '' };
  const cli = p.contacto || p.centro || p.cuenta_texto || '', quien = cli || p.medico || 'Sin cliente';
  const que = [num(p.unidades || 0) + (+p.unidades === 1 ? ' ud.' : ' uds.'), p.productos].filter(Boolean).join(' · ');
  const otros = [sinCargoP(p, p.total) ? 'Entrega sin cargo' : p.forma_pago || 'Sin forma de pago', fechaCorta(p.fecha), cli ? (p.medico || '') : ''].filter(Boolean).join(' · ');
  return { a: quien, b: que, c: pillPaso(p) + (verImportes() && p.total != null ? `<span class="plcimp">${eurI(p.total)}</span>` : ''), d: otros };
};


/* v2.317.0 · Entrega sin cargo (decisión de Eric; SQL 161): en el editor del pedido, «Entrega sin cargo (muestra)» (#psincargo) quita forma de pago,
   descuento y envío (CSS con :has) y pone las líneas al 100 %; guardar_pedido recibe sin_cargo. En el pedido, sin «Emitir factura» ni «Pago recibido»;
   en la lista, la pastilla «Sin cargo» y sin el icono de pago; en el móvil, «Sin cargo (muestra)» en lugar de la forma de pago. */


