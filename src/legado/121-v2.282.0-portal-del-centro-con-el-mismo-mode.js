/* ============================================================
   v2.282.0 · Portal del centro con el mismo modelo que el del profesional (petición de Eric, 12/10/2026).
   Una sola página con pestañas: «Resumen» (4 indicadores; «Tus pedidos» y «Lo que has comprado» del mismo tamaño, con su «i»),
   «Pedir reposición» (sus productos con su precio; sin máximo en el campo: por encima de 1.000 unidades —lo que acepta
   pedido_portal, que descartaba en silencio— avisa en la fila y no envía), «Mi centro» (la misma ficha que el profesional, con
   sus textos) y «Material y dudas». Configuración, ayudas y navegación, como el portal del profesional.
   ============================================================ */
const PM_CENTRO = () => typeof puede === 'function' && puede('portal_centro');
const PC_MAX = 1000;
window.PC_LISTO = true;

async function cargarCentro2282() {
  const v = $('v-informe');
  v.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">Tu centro</div><h1 id="ctnom">…</h1>
      <div class="sm" style="color:rgba(255,255,255,.85)">Pide la reposición de tus productos y sigue tus pedidos</div></div></div>
    <div class="pmtabs" role="tablist">${[['res', 'Resumen'], ['ped', 'Pedir reposición'], ['ficha', 'Mi centro'], ['mat', 'Material y dudas']].map(([k, t]) =>
      `<button type="button" role="tab" data-pmt="${k}" class="${PM.tab === k ? 'on' : ''}" aria-selected="${PM.tab === k}">${t}<span class="pmtpunto" hidden></span></button>`).join('')}</div>
    <div data-pmp="res" id="mdcuerpo" ${PM.tab === 'res' ? '' : 'hidden'}>${pmEsqueleto()}</div>
    <div data-pmp="ped" id="pcped" ${PM.tab === 'ped' ? '' : 'hidden'}>${pmEsqueleto(true)}</div>
    <div data-pmp="ficha" id="pmficha" ${PM.tab === 'ficha' ? '' : 'hidden'}>${pmEsqueleto(true)}</div>
    <div data-pmp="mat" id="pmmat" ${PM.tab === 'mat' ? '' : 'hidden'}><div id="mdportal" class="pmfila"></div></div>`;
  if (!['res', 'ped', 'ficha', 'mat'].includes(PM.tab)) PM.tab = 'res';
  v.querySelectorAll('[data-pmt]').forEach(b => b.onclick = () => pmTab(b.dataset.pmt));
  await centroPintar();
  portalMedico();
}

async function centroPintar() {
  if (!$('mdcuerpo')) return;
  const [{ data: prods }, { data: mp }, { data: f }] = await Promise.all([RPC_ORIG('productos_portal', {}), RPC_ORIG('mis_pedidos_portal', {}),
    PM.ficha ? Promise.resolve({ data: null }) : RPC_ORIG('portal_mi_ficha', {})]);
  if (f && f.ok) pmFichaDatos(f);
  if (!$('mdcuerpo')) return;
  if (mp && mp.nombre) $('ctnom').textContent = mp.nombre;
  const lp = Array.isArray(prods) ? prods : [], peds = (mp && mp.pedidos) || [], pp = (mp && mp.por_producto) || [];
  window.PC_ANT = !!(mp && mp.pago_anticipado);   // v2.284.0
  const conIva = x => r2((+x.precio || 0) * (1 + (+x.iva || 0) / 100));
  const enMarcha = peds.filter(p => p.estado !== 'Anulado' && p.estado !== 'Preparado').length;
  const uds = pp.reduce((s, x) => s + (+x.unidades || 0), 0);
  const ult = peds.length ? String(peds[0].fecha).slice(0, 10) : null;
  const falta = PM.faltan.length ? `<div class="pmaviso"><div><b>Completa la ficha de tu centro</b><span class="sm">Falta ${esc(pmFaltaTxt())}. Así tu comercial sabe cuándo os va mejor que pase.</span></div>
      <button type="button" class="btn" data-pmir="ficha">Completar la ficha</button></div>` : '';
  $('mdcuerpo').innerHTML = `${pcDebeHtml(peds)}${falta}
    <div class="pmk">
      <div class="kpi"><b>${num(enMarcha)}</b><span>pedidos en marcha</span></div>
      <div class="kpi"><b>${ult ? fechaCorta(ult) : '—'}</b><span>último pedido</span></div>
      <div class="kpi"><b>${num(uds)}</b><span>unidades en 12 meses</span></div>
      <div class="kpi"><b>${num(lp.length)}</b><span>productos para pedir</span></div></div>
    <div class="pmfila">
      <div class="card ancard pcpeds"><h2>Tus pedidos ${pmAyu('Tus pedidos', 'Los pedidos de reposición que habéis hecho y en qué punto están: pendiente de confirmar por tu comercial, pendiente de pago (si se paga por adelantado), confirmado, preparado o anulado. Cada pedido lleva los lotes que se os han enviado y sus facturas para descargar.')}</h2>
        ${peds.length ? `<div class="lista">${peds.slice(0, 8).map(p => `<div class="item"><span class="tx">
            <b>${p.numero ? esc(p.numero) + ' · ' : ''}${fechaCorta(String(p.fecha).slice(0, 10))}</b>
            <span class="sm">${esc((p.lineas || []).map(l => `${l.producto} × ${num(l.unidades)}${l.regalo ? ' de regalo' : ''}`).join(', '))}${p.total != null ? ' · ' + eurI(p.total) : ''}</span>${pcExtraPed(p)}</span>
            <span class="pcpst"><span class="pill ${NOMBRE_ESTADO_CENTRO[p.estado] || ''}">${esc(p.estado)}</span>${p.proforma ? `<button type="button" class="btn sec chico" data-pcpro="${p.id}">Factura proforma</button>` : ''}</span></div>`).join('')}</div>` : '<p class="sm">Todavía no hay pedidos.</p>'}</div>
      <div class="card ancard"><h2>Lo que habéis comprado ${pmAyu('Lo que habéis comprado', 'Unidades de los últimos 12 meses por producto, de los pedidos confirmados.')}</h2>
        ${pp.length ? barrasH(pp.map(x => ({ n: x.producto, v: x.unidades })), v => num(v) + ' uds.') : vacioGrafico('Aparecerá cuando tengáis pedidos confirmados.')}</div></div>`;
  $('mdcuerpo').querySelectorAll('[data-pmir]').forEach(b => b.onclick = () => pmTab(b.dataset.pmir));
  pcPintarPedido(lp);   // v2.283.0: por packs
  pmPintarFicha();
}




