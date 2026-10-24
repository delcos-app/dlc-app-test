let TV_DATOS = null, TV_I = 0;
try { TV_I = Math.max(0, TV_VISTAS.findIndex(v => v[0] === localStorage.getItem('delcos-tvvista'))); } catch (e) {}
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


