/* ============================================================
   v2.320.0 · Ventas tras la visita (petición de Eric, 16/10/2026; SQL 163). En Analítica → Resumen, arriba, una tarjeta con
   flechas ‹ › que enseña el mismo dato de tres maneras (le gustaban las tres propuestas por igual):
     1. Embudo: visitas, profesionales visitados y los que tienen una venta en los 30 días siguientes; % grande, unidades y días.
     2. El efecto de la visita: unidades por visita y día, 30 días antes y después (media de 7 días), con el día de la visita.
     3. Mes a mes: visitas y visitas con venta de los 6 últimos meses, con la línea del %.
   Usa el periodo de Analítica y lo compara con el anterior. La vista elegida se recuerda (localStorage delcos-tvvista).
   Solo para el equipo: nunca en el portal del profesional.
   ============================================================ */
const TV_VISTAS = [['embudo', 'Embudo'], ['efecto', 'El efecto'], ['meses', 'Mes a mes'], ['tipos', 'Por tipo']];
let TV_DATOS = null, TV_I = 0;
try { TV_I = Math.max(0, TV_VISTAS.findIndex(v => v[0] === localStorage.getItem('delcos-tvvista'))); } catch (e) {}
const tvPct = (a, b) => b ? Math.round(a / b * 100) : 0;
const tvSub = () => {
  const d = TV_DATOS || {};
  return [`${TT('visita', 'p', '', 'l', 'C')} del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)} y pedidos atribuidos ${TT('medico', 's', 'al', 'l', 'l')} en los ${d.dias || 30} días siguientes`,
    `Unidades pedidas por ${TT('visita', 's', '', 'l', 'l')}, de media, en los ${d.dias || 30} días antes y después de ella`,
    `Por mes: ${TT('visita', 'p', '', 'l', 'l')} hechas y cuántas tienen un pedido atribuido ${TT('medico', 's', 'al', 'l', 'l')} en los ${d.dias || 30} días siguientes`,
    `${TT('visita', 'p', 'el', 'C', 'l')} de captación, de presentación y de seguimiento, y cuántas tienen un pedido en los ${d.dias || 30} días siguientes`][TV_I];
};
document.addEventListener('click', e => {
  const b = e.target.closest('#tvvis [data-tvn]'); if (!b) return;
  TV_I = (TV_I + (+b.dataset.tvn) + TV_VISTAS.length) % TV_VISTAS.length;
  try { localStorage.setItem('delcos-tvvista', TV_VISTAS[TV_I][0]); } catch (x) {}
  tvPintar();
});
anCargarKpis = (orig => async function (...a) {
  const r = $('anper') && $('anper').__rango ? $('anper').__rango() : null;
  const p = r ? Promise.resolve(RPC_ORIG('ventas_tras_visita', { p_desde: r.desde || null, p_hasta: r.hasta || null, p_dias: 30 })).then(x => (x && x.data) || null, () => null) : null;
  const res = await orig.apply(this, a);
  const d = p ? await p : null;
  if (TAB === 'analitica') tvTarjeta(d);
  return res;
})(anCargarKpis);
// v2.320.0 · Fuera el indicador «Conversión visita → venta» (decisión de Eric): lo mide, más completo, la tarjeta «Ventas tras la visita»
anCatalogo = (orig => function (...a) { return orig.apply(this, a).filter(k => k.id !== 'conversion_pct'); })(anCatalogo);


