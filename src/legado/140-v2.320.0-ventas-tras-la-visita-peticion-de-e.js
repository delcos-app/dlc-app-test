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
function tvEmbudo(d) {
  const r = d.resumen || {}, a = r.anterior || {}, p = tvPct(r.con_venta, r.profesionales), pa = tvPct(a.con_venta, a.profesionales);
  const fil = [[`${TT('visita', 'p', '', 'l', 'C')} hechas`, r.visitas, r.visitas ? 1 : 0, ''], [TT('medico', 'p', '', 'l', 'C', 'visitado'), r.profesionales, r.visitas ? r.profesionales / r.visitas : 0, ''],
    ['Con pedido en ' + d.dias + ' días', r.con_venta, r.visitas ? r.con_venta / r.visitas : 0, 'c']];
  const dif = a.profesionales ? p - pa : null;
  return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${num(p)}<small> %</small></div>
      <div class="tvlbl">${TT('medico', 'p', 'del', 'l', 'l', 'visitado')} tienen un pedido en ${d.dias} días</div>
      <div class="tvrow"><div class="tvmini"><b>${num(r.unidades || 0)}</b><span class="tvlbl">unidades</span></div>
        <div class="tvmini"><b>${r.dias_media != null ? num(r.dias_media) + ' días' : '—'}</b><span class="tvlbl">hasta el primer pedido</span></div></div></div>
    <div class="tvfun">${fil.map(([t, n, f, c]) => `<div class="tvst"><span>${esc(t)}</span>
      <svg class="tvbar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect class="tvbg" width="100" height="10" rx="3"/><rect class="tvfg ${c}" width="${Math.max(f * 100, n ? 3 : 0).toFixed(1)}" height="10" rx="3"/></svg>
      <b>${num(n || 0)}</b></div>`).join('')}
      ${dif != null ? `<div class="tvlbl"><span class="${dif >= 0 ? 'tvok' : 'tvmal'}">${dif >= 0 ? '▲ +' : '▼ '}${num(dif)} puntos</span> frente al periodo anterior</div>` : ''}</div></div>`;
}
function tvEfecto(d) {
  const e = d.efecto || {}, nv = e.visitas || 0, dd = d.dias || 30;
  if (!nv) return `<div class="vacio">Sin ${TT('visita', 'p', '', 'l', 'l')} en este periodo.</div>`;
  const raw = (e.dias || []).map(x => ({ k: x.k, v: (+x.u || 0) / nv }));
  const suav = raw.map((x, i) => { const w = raw.slice(Math.max(0, i - 3), i + 4).filter(y => (y.k < 0) === (x.k < 0)); return { k: x.k, v: w.reduce((s, y) => s + y.v, 0) / w.length }; });
  const ant = raw.filter(x => x.k < 0), des = raw.filter(x => x.k >= 0);
  const ma = ant.reduce((s, x) => s + x.v, 0) / (ant.length || 1), md = des.reduce((s, x) => s + x.v, 0) / (des.length || 1);
  const pico = suav.filter(x => x.k >= 0).reduce((m, x) => x.v > m.v ? x : m, { k: 0, v: -1 });
  const mov = ES_MOVIL(), W = mov ? 360 : 640, H = mov ? 170 : 200, P = 22, mx = Math.max(...suav.map(x => x.v), 0.001) * 1.2;
  const x = k => P + (k + dd) / (2 * dd) * (W - 2 * P), y = v => H - 24 - v / mx * (H - 52);
  const lin = suav.map((s, i) => (i ? 'L' : 'M') + x(s.k).toFixed(1) + ' ' + y(s.v).toFixed(1)).join(' ');
  const area = (f, k0, k1) => suav.filter(f).map((s, i) => (i ? 'L' : 'M') + x(s.k).toFixed(1) + ' ' + y(s.v).toFixed(1)).join(' ') + ` L${x(k1)} ${H - 24} L${x(k0)} ${H - 24} Z`;
  const fmt = v => v.toLocaleString('es-ES', { maximumFractionDigits: v < 10 ? 2 : 1 });
  const big = ma > 0 ? `${md >= ma ? '+' : ''}${num(Math.round((md / ma - 1) * 100))}<small> %</small>` : (md > 0 ? '—' : '0');
  return `<div class="tvgrid tvgb"><div class="tvizq"><div class="tvbig">${big}</div>
      <div class="tvlbl">${ma > 0 ? `${md >= ma ? 'más' : 'menos'} unidades en los ${dd} días siguientes ${TT('visita', 's', 'al', 'l', 'l')}` : md > 0 ? `antes ${TT('visita', 's', 'del', 'l', 'l')} no había pedidos` : 'sin pedidos en esas fechas'}</div>
      <div class="tvrow"><div class="tvmini"><b>${fmt(ma)}</b><span class="tvlbl">uds./día antes</span></div><div class="tvmini"><b>${fmt(md)}</b><span class="tvlbl">uds./día después</span></div></div></div>
    <div><svg class="tvsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Unidades por día antes y después">
      <defs><linearGradient id="tvgrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="tvs1"/><stop offset="1" class="tvs2"/></linearGradient></defs>
      <path d="${area(s => s.k <= 0, -dd, 0)}" class="tvantes"/><path d="${area(s => s.k >= 0, 0, dd)}" fill="url(#tvgrad)"/>
      <path d="${lin}" class="tvlin"/>
      <line x1="${x(0)}" x2="${x(0)}" y1="14" y2="${H - 24}" class="tvhoy"/>
      <text x="${x(0) + 6}" y="20" class="tvtxt tvtxthoy">Día ${TT('visita', 's', 'del', 'l', 'l')}</text>
      ${pico.k > 0 && pico.v > 0 ? `<text x="${Math.min(x(pico.k), W - 60)}" y="${Math.max(y(pico.v) - 8, 34)}" class="tvtxt tvtxtpico" text-anchor="middle">pico al ${pico.k}.º día</text>` : ''}
      ${[-dd, -dd / 2, 0, dd / 2, dd].map(k => `<text x="${x(k)}" y="${H - 6}" class="tvtxt tvtxteje" text-anchor="middle">${k > 0 ? '+' : ''}${Math.round(k)} d</text>`).join('')}
    </svg><div class="tvley"><span><i class="tvl1"></i>Antes</span><span><i class="tvl2"></i>Después</span></div></div></div>`;
}
function tvMeses(d) {
  const ms = d.meses || [], mov = ES_MOVIL();
  if (!ms.some(m => m.visitas)) return `<div class="vacio">Sin ${TT('visita', 'p', '', 'l', 'l')} en los últimos meses.</div>`;
  const W = mov ? 360 : 680, H = mov ? 190 : 210, PL = 14, PR = 14, mxv = Math.max(...ms.map(m => m.visitas), 1) * 1.15;
  const bw = (W - PL - PR) / ms.length, yv = v => H - 26 - v / mxv * (H - 54), yp = p => H - 26 - p / 100 * (H - 54);
  const nom = m => new Date(m + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
  const pts = ms.map((m, i) => [PL + bw * i + bw / 2, yp(tvPct(m.con_venta, m.visitas)), tvPct(m.con_venta, m.visitas), m.visitas]);
  const ult = ms[ms.length - 1], pen = ms[ms.length - 2];
  const pu = tvPct(ult.con_venta, ult.visitas), pp = pen ? tvPct(pen.con_venta, pen.visitas) : null;
  return `<div class="tvrow tvrowc"><div class="tvmini"><b>${num(pu)} %</b><span class="tvlbl">${esc(nom(ult.mes))}, acaban en pedido</span></div>
      ${pp != null && pen.visitas ? `<div class="tvmini"><b class="${pu >= pp ? 'tvok' : 'tvmal'}">${pu >= pp ? '+' : ''}${num(pu - pp)} pts</b><span class="tvlbl">frente a ${esc(nom(pen.mes))}</span></div>` : ''}</div>
    <svg class="tvsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Por mes, con pedido y sin él">
    ${ms.map((m, i) => { const x0 = PL + bw * i + bw * 0.2, w = bw * 0.6; return `<rect x="${x0}" y="${yv(m.visitas)}" width="${w}" height="${H - 26 - yv(m.visitas)}" rx="6" class="tvbv"/>
      <rect x="${x0}" y="${yv(m.con_venta)}" width="${w}" height="${H - 26 - yv(m.con_venta)}" rx="6" class="tvbc"/>
      <text x="${x0 + w / 2}" y="${H - 8}" class="tvtxt tvtxteje" text-anchor="middle">${esc(nom(m.mes))}</text>`; }).join('')}
    <path d="${pts.filter(p => p[3]).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}" class="tvlinp"/>
    ${pts.filter(p => p[3]).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="tvpt"/><text x="${p[0]}" y="${p[1] - 10}" class="tvtxt tvtxtpct" text-anchor="middle">${p[2]}%</text>`).join('')}
    </svg><div class="tvley"><span><i class="tvl3"></i>${TT('visita', 'p', '', 'l', 'C')}</span><span><i class="tvl4"></i>Con pedido en ${d.dias} días</span><span><i class="tvl5"></i>% que acaba en pedido</span></div>`;
}
function tvPintar() {
  const c = $('tvcuerpo'); if (!c || !TV_DATOS) return;
  c.innerHTML = [tvEmbudo, tvEfecto, tvMeses, tvTipos][TV_I](TV_DATOS);
  $('tvsub').textContent = tvSub();
  $('tvpos').textContent = `${TV_I + 1} de ${TV_VISTAS.length} · ${TV_VISTAS[TV_I][1]}`;
}
function tvTarjeta(d) {
  const caja = $('anareas'); if (!caja) return;
  const vieja = $('tvvis'); if (vieja) vieja.remove();
  TV_DATOS = d; if (!d || !d.resumen) return;
  caja.insertAdjacentHTML('afterbegin', `<section class="card tvcard" id="tvvis"><div class="tvcab">
      <div class="tvtit"><h2>Pedidos tras ${TT('visita', 's', 'el', 'l', 'l')} <button type="button" class="ai" data-ayuda-tit="Pedidos tras ${TT('visita', 's', 'el', 'l', 'l')}" data-ayuda-txt="${esc(`${TT('visita', 's', 'un', 'C', 'l')} a ${TT('medico', 's', 'un', 'l', 'l')} cuenta como con pedido si hay un pedido confirmado atribuido ${TT('medico', 's', 'al', 'l', 'l')} el mismo día o en los ${d.dias} días siguientes. No cuentan las entregas sin cargo. ${TT('visita', 'p', 'el', 'C', 'l')} de los últimos ${d.dias} días todavía pueden sumar pedidos. Por tipo: captación es la primera ${TT('visita', 's', '', 'l', 'l')} que se registra a ${TT('medico', 's', 'un', 'l', 'l')}; presentación, la que lleva la ficha a un estado de avance o interés o presenta un producto que no se le había presentado; seguimiento, las demás.`)}" aria-label="Qué es">i</button></h2>
        <div class="sm" id="tvsub"></div></div>
      <div class="tvnav"><button type="button" class="btn sec chico" data-tvn="-1" aria-label="Vista anterior">‹</button><span class="sm" id="tvpos"></span><button type="button" class="btn sec chico" data-tvn="1" aria-label="Vista siguiente">›</button></div>
    </div><div id="tvcuerpo"></div></section>`);
  tvPintar();
}
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


