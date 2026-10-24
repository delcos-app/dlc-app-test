/* ============================================================
   v2.326.0 · Pedidos tras la visita, por tipo (petición de Eric, 16/10/2026; SQL 168). La tarjeta de Analítica se llama ya
   «Pedidos tras la visita» y no habla de ventas (regla de Eric: nunca «venta» al hablar de pedidos y profesionales). Cuarta
   vista «Por tipo»: visitas de captación (la primera a cada profesional), de presentación (resultado que avanza la ficha o un
   producto nuevo presentado) y de seguimiento, cuántas acaban en pedido, y lo mismo por persona del equipo.
   ============================================================ */
const TV_TIPOS = [['captacion', 'Captación'], ['presentacion', 'Presentación'], ['seguimiento', 'Seguimiento']];
function tvTipos(d) {
  const ts = d.tipos || [], eq = d.equipo || [];
  if (!ts.some(t => t.visitas)) return `<div class="vacio">Sin ${TT('visita', 'p', '', 'l', 'l')} en este periodo.</div>`;
  const tot = ts.reduce((a, t) => a + (+t.con_pedido || 0), 0);
  const nuevas = ts.filter(t => t.tipo !== 'seguimiento').reduce((a, t) => a + (+t.con_pedido || 0), 0);
  const nom = k => (TV_TIPOS.find(x => x[0] === k) || [k, k])[1];
  const par = o => o && o.visitas ? `${num(o.con_pedido)} de ${num(o.visitas)}` : '—';
  return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${num(tvPct(nuevas, tot))}<small> %</small></div>
      <div class="tvlbl">de ${TT('visita', 'p', 'el', 'l', 'l')} con pedido son de captación o de presentación</div>
      <div class="tvrow"><div class="tvmini"><b>${num(nuevas)}</b><span class="tvlbl">de captación o presentación</span></div>
        <div class="tvmini"><b>${num(tot - nuevas)}</b><span class="tvlbl">de seguimiento</span></div></div></div>
    <div class="tvfun">${ts.map(t => `<div class="tvst"><span>${esc(nom(t.tipo))} · ${num(t.con_pedido)} de ${num(t.visitas)}</span>
      <svg class="tvbar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect class="tvbg" width="100" height="10" rx="3"/><rect class="tvfg${t.tipo === 'seguimiento' ? '' : ' c'}" width="${Math.max(tvPct(t.con_pedido, t.visitas), t.con_pedido ? 3 : 0)}" height="10" rx="3"/></svg>
      <b>${num(tvPct(t.con_pedido, t.visitas))} %</b></div>`).join('')}
      <div class="tvlbl">${ts.map(t => `${esc(nom(t.tipo))}: ${num(t.unidades || 0)} uds.`).join(' · ')}</div></div></div>
    ${eq.length ? `<div class="tveq"><table class="trtabla"><thead><tr><th>Persona</th>${TV_TIPOS.map(x => `<th>${x[1]}</th>`).join('')}</tr></thead>
      <tbody>${eq.map(u => `<tr><td>${esc(u.nombre)}</td>${TV_TIPOS.map(x => `<td>${par(u[x[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="tvlbl">Con pedido de cada tipo, de las ${TT('visita', 'p', '', 'l', 'l')} que registró cada persona</div></div>` : ''}`;
}


