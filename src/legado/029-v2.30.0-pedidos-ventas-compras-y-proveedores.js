// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.30.0 · Pedidos (Ventas, Compras y Proveedores)
   y Stock por lotes con trazabilidad
   ============================================================ */

Object.assign(RPC_TTL, { stock_resumen: 30, compras_lista: 30, proveedores_lista: 60, almacenes_lista: 60, alertas_stock: 60 });

 // v2.440.0: PEDSEC, PROVEEDORES, ALMACENES → estado de src/app (plan 6.6), accesible en window

/* ---------------- nombre del módulo en el menú y ayudas ---------------- */

window.delcos.legacyB.renameMenuEntry('ventas');

