/* ============================================================
   v2.257.0 · Filtro por profesional en Clientes y uso de TomTom en el Panel delcos (pendientes repasados con Eric, 11/10/2026).
   - Clientes: el filtro por profesional (al llegar desde su ficha) se aplicaba pero no se veía en la pantalla: ahora es un filtro
     rápido marcado en la barra, con su «✕» para quitarlo. «Columnas» abría y cerraba el panel según estuviera: ahora siempre lo abre.
   - Panel delcos → Estado de la plataforma: cuántas consultas de rutas (TomTom) se han hecho hoy frente al tope de todas las empresas,
     en el mes, y por empresa frente a su cupo (rutas_uso_resumen, SQL 138).
   ============================================================ */
plSync = (orig => function (tab, ...x) {
  const r = orig.call(this, tab, ...x);
  if (tab !== 'pacientes') return r;
  const rap = document.querySelector('#v-pacientes > .pltool .plrap'); if (!rap) return r;
  let b = rap.querySelector('[data-plmed]');
  if (!PAC.medico) { if (b) b.remove(); return r; }
  const txt = `${TT('medico', 's', '', 'l', 'C')}: ${PAC.medicoNombre || '—'}`;
  if (!b) { rap.insertAdjacentHTML('afterbegin', '<button type="button" class="plchip on plmed" data-plmed title="Quitar este filtro"><span></span><i aria-hidden="true">✕</i></button>'); b = rap.querySelector('[data-plmed]'); }
  const s = b.querySelector('span'); if (s.textContent !== txt) s.textContent = txt;
  return r;
})(plSync);
document.addEventListener('click', e => {
  const b = e.target.closest('#v-pacientes [data-plmed]'); if (!b) return;
  // Solo se vuelve a pedir la lista (volver a pintar los filtros dejaba los de antes en el panel lateral, con los mismos id)
  e.stopPropagation(); PAC.medico = null; PAC.medicoNombre = ''; PAC.pagina = 0;
  const m = $('pacmedx'); if (m && m.parentElement && m.parentElement.parentElement) m.parentElement.parentElement.remove();
  listaPacientes();
}, true);
PL.pacientes.columnas = () => {
  const abrir = () => { const c = $('tools') && $('tools').querySelector('.t2abrir'); if (c) c.click(); };
  const t = $('tools');
  if (t && t.classList.contains('abierto') && t.querySelector('.t2abrir')) return abrir();
  const b = document.querySelector('#v-pacientes .htbtn'); if (!b) return;
  b.click(); setTimeout(abrir, 80);
};

// ---- Uso del servicio de rutas en Estado de la plataforma
pintarEstadoDelcos = (orig => async function (...a) {
  const p = Promise.resolve(RPC_ORIG('rutas_uso_resumen', {})).catch(() => ({}));
  await orig.apply(this, a);
  const { data: u } = (await p) || {};
  const c = $('cfgcuerpo'); if (!c || PAG_TAB.delcos !== 'estado' || !u || !u.ok) return;
  const card = c.querySelector('.card.cfgpanel'), pie = card && [...card.querySelectorAll(':scope > p.sm')].pop(); if (!card) return;
  const cfg = u.config || {}, glob = +cfg.global || 2000, emp = u.empresas || [];
  const html = `<h3 class="pdh3">Servicio de rutas (TomTom)</h3>
    ${pdKpis([[num(u.hoy || 0) + ' / ' + num(glob), 'peticiones hoy, entre todas las empresas', (u.hoy || 0) >= glob * 0.8 ? 'aviso' : ''],
      [num(u.mes || 0), 'peticiones este mes'], [cfg.activo === false ? 'Apagado' : 'Activo', 'servicio', cfg.activo === false ? 'aviso' : ''],
      [num(+cfg.por_usuario || 30), 'por usuario activo y día']])}
    ${emp.length ? `<div class="tablawrap"><table class="pdtabla"><thead><tr><th>Empresa</th><th class="num">Hoy</th><th class="num">Cupo diario</th><th class="num">Este mes</th></tr></thead><tbody>
      ${emp.map(x => `<tr><td>${esc(x.nombre)}</td><td class="num" style="${x.hoy >= x.cupo ? 'color:var(--warn);font-weight:700' : ''}">${num(x.hoy)}</td><td class="num">${num(x.cupo)}</td><td class="num">${num(x.mes)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="vacio">Ninguna empresa ha usado el servicio de rutas este mes.</div>'}`;
  if (pie) pie.insertAdjacentHTML('beforebegin', html); else card.insertAdjacentHTML('beforeend', html);
})(pintarEstadoDelcos);



