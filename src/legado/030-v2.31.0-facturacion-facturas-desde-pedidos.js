/* ============================================================
   DLC OS 2.0 · v2.31.0 · Facturación: facturas desde pedidos,
   series y numeración, rectificativas, cobros, PDF y VeriFactu preparado
   ============================================================ */

Object.assign(RPC_TTL, { facturas_lista: 20, series_lista: 60, eventos_facturacion_lista: 20 });

/* ---------------- datos fiscales y preferencias de facturación ---------------- */

// Datos fiscales: src/app/screens/billing/company-data.ts (v2.424.0)

/* ---------------- VeriFactu (solo administración) ---------------- */

// (v2.183.0: aquí iba la primera versión de pintarVerifactu; se redefine entera más abajo)

/* ---------------- desde el pedido: emitir o ver la factura ---------------- */

// Emisión automática al validar, si está configurada
window.delcos.legacyB.invoiceOnConfirm();

/* ---------------- ayudas ---------------- */

AYUDA.facturacion = ['Facturación', 'Facturas emitidas desde los pedidos, rectificativas y cobros.', [
  'La factura se emite desde un pedido confirmado (<b>🧾 Emitir factura</b> en el pedido) o sola al confirmarlo, si está configurado en Datos fiscales.',
  'Cada serie numera de forma correlativa y puede continuar la numeración de tu programa anterior (indica el siguiente número al configurarla).',
  'Una factura emitida no se puede modificar ni borrar. Si hay un error, <b>Rectificar</b> emite una rectificativa en negativo, total o por unidades, y puede anular el pedido para devolver el stock.',
  'Registra los cobros (total o parcial). El estado pasa a Cobrada, Pendiente o Vencida según el vencimiento.',
  '<b>Ver e imprimir</b> abre la factura lista para imprimir o guardar en PDF.',
  'VeriFactu está preparado (huella encadenada, QR y registro de eventos) y se activa solo desde administración.']];
MANUAL.push({ id: 'facturacion', t: 'Facturación', a: 'V', para: 'Facturas desde pedidos confirmados, rectificativas, cobros, series y VeriFactu.',
  hacer: [[1, 'Ver facturas y cobros (administración y televenta)'], [2, 'Emitir facturas, rectificar y registrar cobros'], [3, 'Configurar series, datos fiscales y VeriFactu (administración)']],
  config: ['Series y numeración', 'Datos fiscales, vencimiento y emisión automática', 'VeriFactu (solo administración)'] });
