/* ============================================================
   v2.256.0 · Fichas sin fantasmas. La ficha de una cuenta se enseña cuando está entera (revelado de las ventanas), pero se rendía a
   los 1,5 s: con la red lenta, los bloques que llegan después (historial de visitas, campos, muestras, ciclo…) aparecían ya abierta
   y empujaban lo de debajo. Ahora la ficha espera hasta 5 s a tener todos sus bloques. Pedido, factura, evento y ficha de centro ya
   se abrían de una vez (prueba fichas2256).
   ============================================================ */
revelar = (orig => function (el, max, desde) {
  if (el && el.id === 'fbody') max = Math.max(max || 0, 5000);
  return orig.call(this, el, max, desde);
})(revelar);


