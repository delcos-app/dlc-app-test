// pantallas/inicio.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function inicioResumenSemanaYVentas() {
  if (TAB !== 'inicio') return;
  if (!$('iniextra')) $('kpis').insertAdjacentHTML('afterend', '<div class="iniextra" id="iniextra"></div>');
  const cont = $('iniextra');
  const esTop = VE_TODO();
  const desde = lunesDe(hoyISO()), hoy = hoyISO();
  const mesIni = hoy.slice(0, 8) + '01', ant = new Date(mesIni + 'T12:00:00'); ant.setMonth(ant.getMonth() - 1);
  const antIni = fechaLocal(ant), antFin = isoMas(mesIni, -1);
  const antMismoDia = isoMas(antIni, +hoy.slice(8, 10) - 1) > antFin ? antFin : isoMas(antIni, +hoy.slice(8, 10) - 1);
  cont.innerHTML = ['Mi semana'].concat(puedeModulo('ventas') ? ['Ventas del mes'] : [], ['Alertas'], esTop ? ['Equipo esta semana'] : []).map(t => `<div class="card">${skelCard(t)}</div>`).join('');
  const [sem, v1, v0, mias, cruce, equipo, toca] = await Promise.all([
    RPC_ORIG('agenda_rango', { p_desde: desde, p_hasta: isoMas(desde, 6), p_usuario: PERFIL.id }).then(r => r.data || []),
    db.rpc('analitica_v2', { p_dim: 'producto', p_desde: mesIni, p_hasta: hoy }).then(r => (r.data || {}).totales || {}),
    db.rpc('analitica_v2', { p_dim: 'producto', p_desde: antIni, p_hasta: antMismoDia }).then(r => (r.data || {}).totales || {}),
    db.rpc('alertas_mias').then(r => r.data || []),
    esTop ? Promise.all([db.rpc('alertas_cruce', { p_dias: 30 }), puedeCompras() || VE_TODO() ? db.rpc('alertas_stock') : Promise.resolve({ data: [] })])
      .then(([a, b]) => (a.data || []).concat(b.data || [])) : Promise.resolve([]),
    esTop ? db.rpc('supervision_equipo', { p_desde: desde, p_hasta: isoMas(desde, 6) }).then(r => r.data || []) : Promise.resolve([]),
    db.rpc('toca_actividad', { p_usuario: PERFIL.id, lim: 300 }).then(r => (r.data || []).length)
  ]);
  if (TAB !== 'inicio' || !$('iniextra')) return;
  const pasadas = sem.filter(c => c.fecha < hoy && !['Descartada'].includes(c.estado));
  const cerradasOk = pasadas.filter(c => c.estado === 'Visitada').length;
  const cumple = pasadas.length ? Math.round(cerradasOk / pasadas.length * 100) : null;
  const semVis = sem.filter(c => c.estado === 'Visitada').length, semPend = sem.filter(c => CITA_ABIERTA.includes(c.estado) && c.fecha >= hoy).length;
  const delta = (a, b) => !b ? '' : `<span class="delta ${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} ${Math.abs(Math.round((a - b) / b * 100))}%</span>`;
  const alertas = cruce.map(x => Object.assign({ equipo: true }, x)).concat(mias);
  const eqTot = equipo.reduce((t, x) => { ['visitadas', 'no_estaba', 'aplazadas', 'sin_hacer', 'atrasados'].forEach(k => t[k] = (t[k] || 0) + (+x[k] || 0)); return t; }, {});
  const eqBase = (eqTot.visitadas || 0) + (eqTot.no_estaba || 0) + (eqTot.aplazadas || 0) + (eqTot.sin_hacer || 0);
  cont.innerHTML = `
    <div class="card"><h2>Mi semana</h2>
      <div class="minis"><div><b>${num(semVis)}</b><span>visitadas</span></div><div><b>${num(semPend)}</b><span>por hacer</span></div>
        <div><b style="${cumple != null && cumple < 60 ? 'color:var(--warn)' : ''}">${cumple == null ? '—' : cumple + '%'}</b><span>cumplimiento</span></div>
        <div><b style="${toca ? 'color:var(--warn)' : ''}">${num(toca)}</b><span>les toca ${TT('visita', 's', '', 'l', 'l')}</span></div></div>
      <div class="acts" style="padding:0 16px 14px"><button class="btn sec" data-inisem="semana">Ver mi semana</button>${toca ? '<button class="btn sec" data-inisem="plan">Planificarlos</button>' : ''}</div></div>
    ${puedeModulo('ventas') ? `<div class="card"><h2>Ventas del mes</h2>
      <div class="minis"><div><b>${num(v1.unidades || 0)}</b><span>unidades ${delta(+v1.unidades || 0, +v0.unidades || 0)}</span></div>
        ${verImportes() ? `<div><b>${eurI(v1.importe || 0)}</b><span>sin IVA ${delta(+v1.importe || 0, +v0.importe || 0)}</span></div>` : ''}
        <div><b>${num(v1.medicos || 0)}</b><span>${TT('medico', 'p', '', 'l', 'l')} con ventas</span></div></div>
      <p class="sm" style="padding:0 16px 14px">Comparado con los mismos días del mes anterior (${num(v0.unidades || 0)} unidades).</p></div>` : ''}
    <div class="card"><h2>Alertas<span class="n">${alertas.reduce((n, a) => n + a.n, 0)}</span></h2>
      ${alertas.length ? `<div class="lista">${alertas.map((a, i) => `<details class="alerta2 ${a.gravedad || ''}">
        <summary><span class="an">${num(a.n)}</span> ${esc(a.titulo)}${a.equipo ? ' <span class="pill p-per">equipo</span>' : ''}</summary>
        <div>${(a.items || []).map(it => `<button class="item" ${a.tipo === 'pedido_sin_medico' ? `data-iniped="${it.id}"` : a.tipo === 'citas_sin_hacer' ? ''
          : ['stock_pedir', 'stock_minimo', 'caducidad', 'sin_lote'].includes(a.tipo) ? 'data-inistock="1"' : a.tipo === 'compra_retrasada' ? `data-inicomp="${it.id}"` : `data-inificha="${it.id}"`} style="padding:6px 8px">
          <span class="tx"><b>${esc(it.nombre)}</b><span class="sm">${esc(it.quien || '')}</span></span></button>`).join('')}
          ${a.n > (a.items || []).length ? `<div class="sm" style="padding:4px 8px">y ${num(a.n - a.items.length)} más</div>` : ''}</div></details>`).join('')}</div>`
        : '<div class="vacio">Todo en orden: no hay cruces ni pendientes.</div>'}</div>
    ${esTop ? `<div class="card"><h2>Equipo esta semana</h2>
      <div class="minis"><div><b>${eqBase ? Math.round((eqTot.visitadas || 0) / eqBase * 100) + '%' : '—'}</b><span>cumplimiento</span></div>
        <div><b>${num(eqTot.visitadas || 0)}</b><span>visitadas</span></div>
        <div><b style="${eqTot.sin_hacer ? 'color:var(--warn)' : ''}">${num(eqTot.sin_hacer || 0)}</b><span>sin hacer</span></div>
        <div><b style="${eqTot.atrasados ? 'color:var(--warn)' : ''}">${num(eqTot.atrasados || 0)}</b><span>les toca</span></div></div>
      <div class="acts" style="padding:0 16px 14px"><button class="btn sec" id="iniequipo">Ver el equipo</button></div></div>` : ''}`;
  cont.querySelectorAll('[data-inificha]').forEach(b => b.onclick = () => abrirFicha(b.dataset.inificha));
  cont.querySelectorAll('[data-iniped]').forEach(b => b.onclick = () => verPedido(b.dataset.iniped));
  cont.querySelectorAll('[data-inistock]').forEach(b => b.onclick = () => { PSEC = 'stock'; ir('productos'); });
  cont.querySelectorAll('[data-inicomp]').forEach(b => b.onclick = () => editorCompra(b.dataset.inicomp));
  cont.querySelectorAll('[data-inisem]').forEach(b => b.onclick = () => {
    AG_MODO = 'semana'; AG_FECHA = hoyISO(); ir('agenda');
    if (b.dataset.inisem === 'plan') setTimeout(() => $('semplan') && $('semplan').click(), 900);
  });
  if ($('iniequipo')) $('iniequipo').onclick = () => { AG_MODO = 'equipo'; ir('agenda'); };
}

async function inicioOperativaPedidos() {
  if (TAB !== 'inicio' || !$('iniextra') || !(VE_TODO() && nivelDe2('V') >= 1)) return;
  const { data } = await RPC_ORIG('operativa_pendiente', {});
  const d = data || {}, n = k => (d[k] || []).length;
  if (!(n('pago') + n('paquete') + n('email_factura') + n('email_pago')) || $('iniops')) return;
  $('iniextra').insertAdjacentHTML('afterbegin', `<div class="card" id="iniops"><h2>Operativa de pedidos</h2>
    <div class="opfilas">${[[n('pago'), 'pendientes de cobro', n('pago') ? 'aviso' : ''], [n('paquete'), 'paquetes por preparar', ''],
      [n('email_factura') + n('email_pago'), 'emails por enviar', '']].map(([v, t, c]) =>
      `<button class="opfila" data-opver><b class="${c}">${num(v)}</b><span>${t}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>`).join('')}</div></div>`);
  $('iniops').querySelectorAll('[data-opver]').forEach(b => b.onclick = () => { PEDSEC = 'ventas'; ir('ventas'); });
}

async function inicioVistazoEIndicadores() {
  if (TAB !== 'inicio') return;
  // El aviso de duplicados ya está como indicador: se quita el cartel repetido
  document.querySelectorAll('#v-inicio .avisoh').forEach(a => { if (/unificar|duplicad/i.test(a.textContent)) a.remove(); });
  vistazoHoy();
}

async function inicioLlamadasHoy() {
  if (TAB !== 'inicio' || !VE_TODO() || !hayOportunidades() || !$('iniextra') || $('inillam')) return;
  const { data } = await RPC_ORIG('llamadas_seguimiento', {});
  const hoy = hoyISO(), pend = (data || []).filter(x => x.proxima_fecha <= hoy);
  if (!pend.length || $('inillam')) return;
  $('iniextra').insertAdjacentHTML('afterbegin', `<div class="card" id="inillam"><h2>Volver a llamar hoy<span class="n">${pend.length}</span></h2>
    <p class="sm" style="padding:0 16px">Clientes a los que quedaste en volver a llamar${pend.some(x => x.proxima_fecha < hoy) ? ', algunas atrasadas' : ''}.</p>
    <div class="acts" style="padding:0 16px 14px"><button class="btn sec" id="inillamver">Ver oportunidades</button></div></div>`);
  $('inillamver').onclick = () => { PEDSEC = 'llamadas'; ir('ventas'); };
}

async function inicioFiltrarAlertas() {
 if (TAB === 'inicio') await filtrarAlertasInicio();
}

async function pintarInicioBase() {
  const sec = $('v-inicio');
  sec.classList.remove('ini-cargando');
  if (!$('inialerta')) sec.querySelector('.saludo').insertAdjacentHTML('afterend', '<div id="inialerta"></div>');
  const esAdmin = puede('administrar');

  // Cada bloque se pinta en cuanto llegan sus datos; mientras, se ve su esqueleto.
  const pComision = tarjetaComision().catch(() => {});
  const pRutas = tarjetasRuta().catch(() => {});
  const res = await rpcCache('panel_inicio', { lim: 6 }, 'inicio');
  marca('datos de Inicio recibidos');

  const data = res.data;
  if (!data) { $('c-agenda').innerHTML = '<h2>Tu agenda de hoy</h2><div class="vacio">Sin conexión y sin copia guardada todavía.</div>'; return; }
  const k = data.kpis;

  const avisoDup = () => {
    const nPend = (DUP_RES && DUP_RES.pendientes) || k.pendientes_unificar || 0;
    const nPar = (DUP_RES && DUP_RES.parecidos) || 0;
    $('inialerta').innerHTML = esAdmin && (nPend || nPar) ? `<div class="alerta">
        <span>⚠ ${[nPend ? `${num(nPend)} ${nPend === 1 ? 'ficha pendiente' : 'fichas pendientes'} de unificar` : '',
                  nPar ? `${num(nPar)}${nPar >= 200 ? '+' : ''} ${nPar === 1 ? 'posible duplicado' : 'posibles duplicados'} por nombre` : '']
                  .filter(Boolean).join(' y ')}</span>
        <button class="btn chico" data-k="dups">Revisar duplicados</button></div>` : '';
  };
  avisoDup();
  if (esAdmin) db.rpc('resumen_duplicados').then(r => { DUP_RES = r.data || null; avisoDup(); }).catch(() => {});

  window.delcos.screens.home.paintIndicators(res);

  tarjeta($('c-agenda'), 'Tu agenda de hoy', data.agenda_hoy.length,
    data.agenda_hoy.map(a => itemHTML(a.cuenta_id, a.hora ? esc(a.hora).slice(0, 5) : '·',
      a.estado === 'Visitada' ? 'o' : '', a.nombre,
      `${esc(a.centro_nombre || '')} · <b style="color:${a.estado === 'Visitada' ? 'var(--ok)' : 'var(--navy)'}">${esc(a.estado)}</b>`)),
    '', 'No tienes citas para hoy. En Agenda tienes sugerencias para el día.');
  tarjeta($('c-acciones'), 'Próximas acciones', data.acciones.length,
    data.acciones.map(a => itemHTML(a.cuenta_id, '↻', a.proxima_fecha < hoyISO() ? 'w' : '', a.nombre,
      `<b style="color:${a.proxima_fecha < hoyISO() ? 'var(--warn)' : 'var(--navy)'}">${fechaCorta(a.proxima_fecha)}</b> · ${esc(a.proxima_accion || 'Seguimiento')}`)),
    '', 'Sin acciones pendientes en los próximos 7 días.');
  tarjeta($('c-urgentes'), 'Urgentes sin visitar', k.urgentes,
    data.urgentes.map(u => itemHTML(u.cuenta_id, '!', 'w', u.nombre,
      `${esc(u.especialidad || '')} · ${esc(u.centro_nombre || u.municipio || '')}`)),
    k.urgentes > 6 ? `<button class="verlo" data-k="urgentes">Ver los ${num(k.urgentes)} urgentes</button>` : '',
    'Todos los urgentes están visitados.');
  tarjeta($('c-ultimas'), `${TT('visita', 'p', 'ultimo', 'C', 'l')}`, null,
    data.ultimas_visitas.map(v => itemHTML(v.cuenta_id, '✓', 'o', v.nombre,
      `${fechaCorta(v.fecha)} · ${esc((v.resultados || []).join(' + ') || 'Sin resultado')}`)),
    '', `Todavía no hay ${TT('visita', 'p', '', 'l', 'l', 'registrado')}.`);
  ponerAyudas();
  await Promise.all([pComision, pRutas]);
  marca('Inicio completo');
}

/** Primer minuto en que se puede empezar la visita llegando a «llegada», o null si no hay hueco. */
function inicioPosible(it, llegada, dura) {
  if (it.fija != null) return llegada <= it.fija + 10 ? Math.max(llegada, it.fija) : null;
  if (!it.ventanas) return llegada;
  for (const [a, b] of it.ventanas) { const s = Math.max(llegada, a); if (s + dura <= b) return s; }
  return null;
}

async function filtrarAlertasInicio() {
  const caja = $('iniextra'); if (!caja) return;
  const ocultas = new Set((await cargarOcultas()).map(x => x.clave));
  let total = 0;
  caja.querySelectorAll('details.alerta2').forEach(det => {
    const sum = det.querySelector(':scope > summary'), tit = tituloAlerta(sum);
    const items = [...det.querySelectorAll(':scope > div > .item, :scope .lista > .item')];
    items.forEach(x => { if (ocultas.has(claveAlerta(tit, x))) x.remove(); });
    const quedan = det.querySelectorAll(':scope > div > .item, :scope .lista > .item').length;
    if (!quedan && items.length) { det.remove(); return; }
    const nEl = [...sum.querySelectorAll('span, b')].find(e => /^\d+$/.test(e.textContent.trim()));
    if (nEl && items.length) nEl.textContent = quedan;
    total += quedan || 0;
  });
  const card = caja.querySelector('details.alerta2') ? caja.querySelector('details.alerta2').closest('.card') : null;
  const n = card && card.querySelector('h2 .n'); if (n) n.textContent = card.querySelectorAll('details.alerta2').length;
  if (ALERTAS_OCULTAS.length && card && !card.querySelector('.alocultas')) {
    card.insertAdjacentHTML('beforeend', `<button class="kcfg alocultas" style="margin:4px 16px 12px">Ver alertas ocultas (${ALERTAS_OCULTAS.length})</button>`);
    card.querySelector('.alocultas').onclick = verOcultas;
  }
}

/* ============================================================
   v2.243.0 · Inicio de verdad: solo se pinta lo que se ve. Desde el mosaico (v2.228) Inicio seguía pintando por debajo las
   tarjetas de antes (agenda de hoy, próximas acciones, urgentes, últimas visitas, comisión, rutas, Mi semana, ventas del mes,
   alertas, equipo, operativa, volver a llamar…) y las escondía, con unas 12 consultas que nadie veía. Ahora Inicio pinta el
   mosaico (aparte, pintarMosaico) y los indicadores (#kpis, que se ven con «Ver tus indicadores»); lo demás ya no se pide.
   El portal del profesional sigue como estaba.
   ============================================================ */
function inicioQuitarAntiguo() {
  const sec = $('v-inicio'); if (!sec) return;
  sec.querySelectorAll(':scope > .cols, :scope > #iniextra, :scope > #inialerta, :scope > #vistazo').forEach(x => x.remove());
}

// ---- Inicio: la cabecera en su sitio desde el esqueleto
function inicioCabecera() {
  try {
    const sal = document.querySelector('#v-inicio > .saludo'), acts = sal && sal.querySelector('.acts');
    if (acts && !ES_MEDICO()) {
      if (!acts.dataset.ico) { acts.dataset.ico = '1'; acts.classList.add('icoacts'); }
      if (!$('iniact')) pintarActualizado();
      document.body.classList.add('inilisto');
    }
  } catch (e) {}
}

async function vistazoHoy() {
  const sal = document.querySelector('#v-inicio .saludo'); if (!sal) return;
  const acts = sal.querySelector('.acts');
  if (acts && !acts.dataset.ico) {
    acts.dataset.ico = '1'; acts.classList.add('icoacts');
  }
  let v = $('vistazo');
  if (!v) { sal.firstElementChild.insertAdjacentHTML('beforeend', '<div id="vistazo" class="vistazo"></div>'); v = $('vistazo'); }
  if (ES_MEDICO()) return;
  const citas = await citasDelDia(hoyISO());
  const abiertas = citas.filter(c => CITA_ABIERTA.includes(c.estado)).sort((a, b) => (a.orden || 0) - (b.orden || 0) || String(a.hora || '').localeCompare(String(b.hora || '')));
  const hechas = citas.filter(c => c.estado === 'Visitada').length, prox = abiertas[0];
  if (!$('vistazo')) return;
  v.innerHTML = citas.length
    ? `<span><b>${num(citas.length)}</b> ${citas.length === 1 ? 'cita' : 'citas'} hoy · <b>${num(hechas)}</b> visitadas</span>
       ${prox ? `<span class="prox">Próxima: <b>${esc(prox.medico || prox.nombre || '')}</b>${prox.hora ? ' · ' + String(prox.hora).slice(0, 5) : ''}</span>` : '<span class="prox">Día completado ✓</span>'}`
    : `<span>Hoy no tienes citas.</span> <button class="lnk" data-irplan>Planifica tu día</button>`;
  const b = v.querySelector('[data-irplan]'); if (b) b.onclick = () => ir('rutas');
}

function tarjeta(el, titulo, n, items, pie, vacio) {
  el.innerHTML = `<h2>${titulo}${n != null ? `<span class="n">${num(n)}</span>` : ''}</h2>` +
    (items.length ? `<div class="lista">${items.join('')}</div>` : `<div class="vacio">${vacio}</div>`) +
    (pie && items.length ? pie : '');
}

async function cargarOcultas(forzar) {
  if (ALERTAS_OCULTAS && !forzar) return ALERTAS_OCULTAS;
  const { data } = await RPC_ORIG('mis_alertas_descartadas', {});
  ALERTAS_OCULTAS = data || [];
  return ALERTAS_OCULTAS;
}

async function verOcultas() {
  const l = await cargarOcultas(true);
  $('dbody').innerHTML = `<div class="fh"><div><h2>Alertas ocultas</h2><div class="sm">Las que ocultaste. Al recuperarlas vuelven a aparecer en Inicio si siguen pasando.</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="alcards">${l.map(x => `<div class="alcard"><div class="alc1"><b>${esc(x.detalle || x.clave)}</b>
      <span class="pill ${x.hasta ? 'p-per' : 'p-anu'}">${x.hasta ? 'Hasta ' + fechaCorta(x.hasta) : 'Para siempre'}</span></div>
      <div class="sm">${esc(x.titulo || '')}</div><button class="btn sec chico" data-alrec="${esc(x.clave)}">Recuperar</button></div>`).join('') || '<div class="vacio">No tienes alertas ocultas.</div>'}</div>`;
  $('dlg').showModal();
  $('dbody').querySelectorAll('[data-alrec]').forEach(b => b.onclick = async () => {
    await db.rpc('restaurar_alerta', { p_clave: b.dataset.alrec }); b.closest('.alcard').remove(); ALERTAS_OCULTAS = null; toast('Recuperada');
    if (TAB === 'inicio') cargarInicio();
  });
}

let ALERTAS_OCULTAS = null;

const tituloAlerta = s => s.textContent.replace(/\s+/g, ' ').replace(/^\s*\d+\s*/, '').replace(/\bequipo\b\s*$/, '').trim();

const normAl = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 60);

const SALUDOS = { en: ['Good morning', 'Good afternoon', 'Good evening'], de: ['Guten Morgen', 'Guten Tag', 'Guten Abend'], fr: ['Bonjour', 'Bon après-midi', 'Bonsoir'], it: ['Buongiorno', 'Buon pomeriggio', 'Buonasera'] };

/* pintarInicio: la parte base y, en orden, cada paso que se le añade (antes eran 5 capas separadas). */
async function pintarInicioBase2() {
  await pintarInicioBase();
  await inicioResumenSemanaYVentas();
  await inicioOperativaPedidos();
  await inicioVistazoEIndicadores();
  await inicioLlamadasHoy();
  await inicioFiltrarAlertas();
}






// Inicio está migrado a src/app/screens/home (v2.385.0). Estos dos nombres se quedan como adaptadores porque los llama mucho código
// antiguo; desaparecerán cuando la navegación pase al router.
function cargarInicio() { return window.delcos.screens.home.load(); }
function inicioEsqueleto() { window.delcos.screens.home.renderSkeleton(); inicioCabecera(); }
