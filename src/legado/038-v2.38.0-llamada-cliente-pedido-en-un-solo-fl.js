// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.38.0 · Llamada → cliente → pedido en un solo flujo,
   seguimientos de quien no compra, análisis por comercial, personas
   del esquema de comisión dentro del propio esquema, producto habitual
   en los pedidos nuevos y selector de fecha junto a su campo
   ============================================================ */

Object.assign(RPC_TTL, { llamadas_seguimiento: 20 });

/* ---------------- pedidos: producto habitual y líneas siempre con su producto ---------------- */

// (v2.183.0: aquí iba la primera versión de productoPorDefecto; se redefine entera más abajo)
// (v2.183.0: aquí iba la primera versión de opcionesProducto; se redefine entera más abajo)
// Se recuerda el producto del último pedido guardado para proponerlo en el siguiente
window.delcos.legacyB.rememberOrderProduct();

/* ---------------- selector de fecha: siempre junto a su campo ---------------- */


/* ---------------- llamadas: cliente, médico, resultado y pedido en un flujo ---------------- */

// Pestaña Llamadas: seguimientos pendientes arriba y análisis ampliado

// Accesos a «Registrar llamada» desde Pedidos (ventas) y desde la ficha del cliente

// Inicio: llamadas de seguimiento para hoy (televenta y administración)

/* ---------------- comisiones: quién cobra, dentro del propio esquema ---------------- */

// En la ficha de la persona solo se informa: el esquema se gestiona en Comisiones
