/* ============================================================
   DLC OS 2.0 · v2.35.0 · Pedidos paginados y guardados en el dispositivo,
   factura en PDF como la de Holded y envío por email con el PDF adjunto,
   manual renovado y punto de salida sin valor por defecto
   ============================================================ */

Object.assign(RPC_TTL, { pedidos_pagina: 30 });

/* ---------------- punto de salida: cada persona configura el suyo ---------------- */

window.delcos.legacyB.listenToOrderListLinks();

/* ---------------- Pedidos → Ventas: por páginas y guardado en el dispositivo ---------------- */

// Cualquier cambio de filtro vuelve a la primera página

/* ---------------- paginación también en facturas y llamadas ---------------- */

let FACPAG = 0, LLPAG = 0;

/* ---------------- email con los datos de pago: envío directo si está configurado ---------------- */

window.delcos.legacyB.listenToPaymentEmailLinks();

/* ---------------- datos fiscales: web de la empresa para el pie de la factura ---------------- */

function pintarEmpresaBase2() { return window.delcos.legacyB.paintCompanyData(); }

/* ---------------- manual de uso renovado ---------------- */

const PRIMEROS_PASOS = window.delcos.content.firstSteps();

/* ---------------- ayudas ---------------- */

// Aviso de punto de salida en el plan y en «Tu día»
