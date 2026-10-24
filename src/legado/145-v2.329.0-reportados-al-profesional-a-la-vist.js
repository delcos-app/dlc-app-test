/* ============================================================
   v2.329.0 · Reportados al profesional, a la vista en Pedidos y en Analítica (interno: solo quien ve todo)
   - Pedidos: filtro «Reporte» (Todos, Reportados, Sin reportar) en el panel y como filtro rápido; la lista y el resumen lo respetan.
   - Analítica → Resumen: «Reporte» en los filtros de arriba (indicadores y sus líneas de seis meses); Explorar: «Reporte» en el Ranking y
     en la «Tabla por meses».
   - Clientes: «Profesional distinto en cada pedido» (contactos.cuenta_por_pedido): la ficha no guarda profesional y el pedido no lo propone.
   - Pedido sin profesional elegido: toma el de la ficha del cliente al guardar (salvo los de la marca anterior).
   ============================================================ */
db.rpc = (orig => function (fn, args, ...r) {
  if (TAB === 'analitica' && AN_REP && args) {
    if ((fn === 'analitica_kpis' || fn === 'analitica_kpis_periodo') && !(args.p_filtro && args.p_filtro.reportado)) args = Object.assign({}, args, { p_filtro: Object.assign({}, args.p_filtro || {}, { reportado: AN_REP }) });
    else if (fn === 'analitica_v2' && !$('areprt') && !('p_reportado' in args)) args = Object.assign({}, args, { p_reportado: AN_REP });
  }
  return orig.call(this, fn, args, ...r);
})(db.rpc);

