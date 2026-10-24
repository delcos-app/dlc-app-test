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
const RPC_V2370 = db.rpc;
db.rpc = function (fn, params, opts) {
  const b = RPC_V2370.call(db, fn, params, opts);
  if (fn !== 'guardar_pedido') return b;
  try { const l = ((params || {}).p || {}).lineas || []; if (l[0] && l[0].producto_id) localStorage.setItem('dlc-prod-habitual', l[0].producto_id); } catch (e) {}
  if (!LLAMADA_PEND) return b;
  // Pedido creado desde una llamada: queda enlazado con ella
  return conCatch(Promise.resolve(b).then(async res => {
    if (!res.error && res.data && res.data.ok && res.data.id && LLAMADA_PEND) {
      await RPC_ORIG('vincular_llamada_pedido', { p_llamada: LLAMADA_PEND, p_pedido: res.data.id });
      LLAMADA_PEND = null; toast('Pedido enlazado con la llamada');
    }
    return res;
  }));
};

/* ---------------- selector de fecha: siempre junto a su campo ---------------- */

function colocarPop(pop, ref) {
  const d = $('seldlg');
  // v2.87.0: en móvil es una hoja pegada abajo (su estilo ya la coloca); junto al campo solo en escritorio
  if (ES_MOVIL()) { d.style.right = ''; d.style.bottom = ''; } else { d.style.right = 'auto'; d.style.bottom = 'auto'; }
  if (!d.open) d.__abierto = Date.now();
  colocarPopBase(pop, ref);
}

/* ---------------- llamadas: cliente, médico, resultado y pedido en un flujo ---------------- */



// Pestaña Llamadas: seguimientos pendientes arriba y análisis ampliado

// Accesos a «Registrar llamada» desde Pedidos (ventas) y desde la ficha del cliente

// Inicio: llamadas de seguimiento para hoy (televenta y administración)

/* ---------------- comisiones: quién cobra, dentro del propio esquema ---------------- */



// En la ficha de la persona solo se informa: el esquema se gestiona en Comisiones


