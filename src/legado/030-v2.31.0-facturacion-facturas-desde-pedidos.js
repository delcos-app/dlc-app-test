// @ts-check
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

