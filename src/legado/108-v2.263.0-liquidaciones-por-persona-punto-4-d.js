/* ============================================================
   v2.263.0 · Liquidaciones por persona (punto 4 del plan del 11/10/2026; auditoría del manual).
   - «Calcular el periodo» buscaba a quién liquidar por el NOMBRE (dos personas con el mismo nombre se confundían) y solo a quien
     tenía el esquema abierto hoy. Ahora va por la persona (su id) y liquida a todos los que tuvieron un esquema vigente algún día
     de ese mes (también a quien dejó de cobrar a mitad de mes).
   - Además, volver a calcular un mes devolvía a «Borrador» las liquidaciones ya aprobadas o pagadas (y las descongelaba). Ahora
     solo se recalculan las que siguen en borrador; las aprobadas y pagadas no se tocan.
   - La lista de liquidaciones se puede ver por persona y por mes, con el total de lo que se ve.
   ============================================================ */
let LIQ_FIL = { u: '', p: '' };
// (R-12: calcularLiquidaciones se definía aquí otra vez; ahora está en su sitio, más arriba)
// La lista, con filtros de persona y mes y el total de lo que se ve
pintarComisionesBase = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('admcuerpo'), boton = $('liqcalc'); if (!c || !boton) return r;
  const lista = boton.closest('.acts') && boton.closest('.acts').nextElementSibling;
  if (!lista || !lista.classList.contains('lista') || $('liqfil')) return r;
  const { data } = await db.rpc('liquidaciones_lista', { p_periodo: null });   // la misma de la pantalla (en memoria): se pinta en el mismo momento
  if (!$('admcuerpo') || !lista.isConnected) return r;
  const l = data || [];
  const personas = [...new Map(l.map(x => [x.usuario_id, x.nombre])).entries()].sort((x, y) => String(x[1]).localeCompare(String(y[1]), 'es'));
  const meses = [...new Set(l.map(x => x.periodo))].sort().reverse();
  if (LIQ_FIL.u && !personas.some(p => p[0] === LIQ_FIL.u)) LIQ_FIL.u = '';
  if (LIQ_FIL.p && !meses.includes(LIQ_FIL.p)) LIQ_FIL.p = '';
  const fila = x => `<div class="item" style="cursor:default" data-liqu="${x.usuario_id}" data-liqp="${x.periodo}">
      <span class="ic ${x.estado === 'Pagada' ? 'o' : ''}">${x.estado === 'Borrador' ? '○' : '✓'}</span>
      <span class="tx"><b>${esc(x.nombre)}</b><span class="sm">${periodoTxt(x.periodo)} · ${num(x.unidades)} unidades · ${eur(x.importe)} · ${esc(x.estado)}</span></span>
      <span class="acts" style="margin:0">
        ${x.estado === 'Borrador' ? `<button class="btn sec" data-liq="${x.usuario_id}|${x.periodo}|Aprobada">Aprobar</button>` : ''}
        ${x.estado === 'Aprobada' ? `<button class="btn sec" data-liq="${x.usuario_id}|${x.periodo}|Pagada">Marcar pagada</button>` : ''}
      </span></div>`;
  const pinta = () => {
    const v = l.filter(x => (!LIQ_FIL.u || x.usuario_id === LIQ_FIL.u) && (!LIQ_FIL.p || x.periodo === LIQ_FIL.p));
    const tot = v.reduce((n, x) => n + (+x.importe || 0), 0), uds = v.reduce((n, x) => n + (+x.unidades || 0), 0);
    const pend = v.filter(x => x.estado !== 'Pagada').reduce((n, x) => n + (+x.importe || 0), 0);
    $('liqres').textContent = v.length ? `${num(v.length)} ${v.length === 1 ? 'liquidación' : 'liquidaciones'} · ${num(uds)} unidades · ${eur(tot)}${pend && pend !== tot ? ' · ' + eur(pend) + ' sin pagar' : ''}` : '';
    lista.innerHTML = v.map(fila).join('') || `<div class="vacio">${l.length ? 'Sin liquidaciones con estos filtros.' : 'Sin liquidaciones todavía.'}</div>`;
    lista.querySelectorAll('[data-liq]').forEach(b => b.onclick = async () => {
      const [u, p, estado] = b.dataset.liq.split('|');
      if (!await preguntar(`La liquidación quedará ${estado === 'Aprobada' ? 'aprobada y congelada' : 'marcada como pagada'}.`,
        { titulo: '¿' + (estado === 'Aprobada' ? 'Aprobar' : 'Marcar pagada') + '?', ok: estado === 'Aprobada' ? 'Aprobar' : 'Marcar pagada' })) return;
      await db.rpc('liquidar', { p_usuario: u, p_periodo: p, p_estado: estado });
      toast('Liquidación ' + estado.toLowerCase()); pintarComisiones();
    });
  };
  lista.insertAdjacentHTML('beforebegin', `<div class="liqfil" id="liqfil">
      <div><label for="liqfu">Persona</label><select id="liqfu"><option value="">Todas</option>${personas.map(([id, n]) => `<option value="${id}" ${id === LIQ_FIL.u ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      <div><label for="liqfp">Mes</label><select id="liqfp"><option value="">Todos</option>${meses.map(m => `<option value="${m}" ${m === LIQ_FIL.p ? 'selected' : ''}>${esc(periodoTxt(m))}</option>`).join('')}</select></div>
      <p class="sm" id="liqres"></p></div>`);
  $('liqfu').onchange = e => { LIQ_FIL.u = e.target.value; pinta(); };
  $('liqfp').onchange = e => { LIQ_FIL.p = e.target.value; pinta(); };
  pinta();
  return r;
})(pintarComisionesBase);




