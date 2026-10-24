/* ============================================================
   v2.250.0 · Ventas sin paginadores repetidos (listas sin fantasmas, segundo grupo). Las listas de Ventas (Pedidos,
   Oportunidades, Compras, Proveedores, Facturas, Catálogo, Servicios y Stock) ya llegaban de una vez (v2.238) y no se
   recolocan al buscar, filtrar, pulsar un indicador, pasar de página u ordenar (prueba ventas2250). Lo que sí fallaba: en
   Facturas y Oportunidades el paginador se crea dentro de la lista y la plantilla lo saca al pie de la tabla; al volver a
   pintar se creaba otro y quedaban dos (con el mismo id). Ahora, antes de pintar un paginador se quita el anterior con su nombre.
   ============================================================ */
paginador = (orig => function (el, ...a) {
  if (el && el.id) document.querySelectorAll('#' + el.id).forEach(x => { if (x !== el) x.remove(); });
  return orig.call(this, el, ...a);
})(paginador);


