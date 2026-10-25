/* ============================================================
   DLC OS 2.0 · v2.30.0 · Pedidos (Ventas, Compras y Proveedores)
   y Stock por lotes con trazabilidad
   ============================================================ */

Object.assign(RPC_TTL, { stock_resumen: 30, compras_lista: 30, proveedores_lista: 60, almacenes_lista: 60, alertas_stock: 60 });

let PEDSEC = 'ventas', PROVEEDORES = [], ALMACENES = [];

/* ---------------- nombre del módulo en el menú y ayudas ---------------- */

window.delcos.legacyB.renameMenuEntry('ventas');
Object.assign(AYUDA, {
  ventas: ['Pedidos', 'Ventas, compras y proveedores.', [
    '<b>Ventas</b>: pedidos de clientes. En borrador no cuentan; al confirmarlos cuentan en métricas y comisiones y <b>salen del stock</b>, primero del lote que caduca antes.',
    '<b>Compras</b>: pedidos a proveedores. Borrador → Enviado → En tránsito → Recibido. Al recibir se anota cada lote con su caducidad y entra en el stock.',
    '<b>Proveedores</b>: datos, plazo de entrega y cuenta contable. El plazo se usa para avisar de cuándo hay que pedir.',
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y a su comercial; la venta a centro, a la ficha del centro si la tiene.`]]
});
AYUDA.productos[2].push('<b>Stock y lotes</b>: stock por almacén y lote, caducidades, cobertura según el ritmo de venta, trazabilidad de cada lote (a qué clientes llegó), entradas, ajustes y traspasos a los maletines.');
MANUAL.forEach(s => { if (s.id === 'ventas') { s.t = 'Pedidos, Clientes y Productos'; s.para = 'Pedidos de venta y de compra, proveedores, clientes, productos, servicios y stock por lotes.'; s.hacer.push([3, 'Crear pedidos de compra, recibir mercancía por lotes, ajustar stock y gestionar proveedores y almacenes']); } });
