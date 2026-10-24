/* ============================================================
   DLC OS 2.0 · v2.34.0 · Permisos por módulo e indicadores, zonas de
   los comerciales, operativa de pedidos, registro de llamadas,
   comisiones con fecha de efecto, varios meses en la agenda y
   «Calidad del dato»
   ============================================================ */

Object.assign(RPC_TTL, { operativa_pendiente: 20, llamadas_lista: 20, llamadas_resumen: 30, calidad_datos: 60, zonas_resumen: 120 });

/* ---------------- permisos nuevos ---------------- */

(function () {
  const i = AREAS.findIndex(a => a[0] === 'V');
  AREAS[i][1] = 'Pedidos (ventas y compras)';
  AREAS.splice(i + 1, 0, ['L', 'Clientes'], ['P', 'Productos y stock'], ['F', 'Facturación'], ['A', 'Analítica'],
    ['E', 'Importes de ventas'], ['Q', 'Calidad del dato']);
})();
const nivelDe2 = a => !PERFIL ? 0 : puede('administrar') ? 3 : +((PERFIL.areas || {})[a] || 0);
const verImportes = () => nivelDe2('E') >= 1;

// Qué permiso abre cada módulo
const MODULO_AREA = { inicio: 'H', agenda: 'G', rutas: 'R', directorio: 'M', pacientes: 'L', productos: 'P', seguimiento: 'Q',
  ventas: 'V', analitica: 'A', facturacion: 'F' };
const puedeModulo = t => {
  if (!PERFIL) return false;
  if (t === 'facturacion' && !VE_TODO()) return false;
  const a = MODULO_AREA[t];
  return !a || nivelDe2(a) >= 1;
};
/* aplicarPermisosMenu: la parte base y, en orden, cada paso que se le añade (antes eran 3 capas separadas). */
function aplicarPermisosMenu() {
  aplicarPermisosMenuBase();
  aplicarPermisosMenuPaso1();
  aplicarPermisosMenuPaso2();
  aplicarPermisosMenuPaso3();
}

function aplicarPermisosMenuPaso1() {
  document.querySelectorAll('nav.main [data-t]').forEach(b => {
    const t = b.dataset.t; if (!(t in MODULO_AREA)) return;
    const bloqueado = puedeModuloV2400(t) && !planIncluye(t);
    b.classList.toggle('bloq', bloqueado);
    if (bloqueado) { b.classList.remove('hide'); if (!b.querySelector('.cand')) b.insertAdjacentHTML('beforeend', '<span class="cand">🔒</span>'); }
    else { const c = b.querySelector('.cand'); if (c) c.remove(); }
  });
}

function aplicarPermisosMenuPaso2() {
 iconosMenu();
}

function aplicarPermisosMenuPaso3() {
 ordenarMenu(); const c = document.querySelector('nav.main [data-t="seguimiento"]'); if (c) c.classList.add('hide');
}

function aplicarPermisosMenuBase() {
  document.querySelectorAll('nav.main [data-t]').forEach(b => {
    if (b.dataset.t in MODULO_AREA) b.classList.toggle('hide', !puedeModulo(b.dataset.t));
  });
  if (typeof pintarBnav === 'function') pintarBnav();
}

/* ---------------- indicadores con su categoría y permiso ---------------- */

const KPI_CATEGORIA = {
  citas: 'Agenda', citas_7d: 'Agenda', urgentes: 'Cartera', interesados: 'Cartera', sin_contactar: 'Cartera', cartera: 'Cartera',
  sin_visita_60: 'Cartera', sin_horario: 'Calidad del dato', dups: 'Calidad del dato', visitas_sem: 'Actividad', visitas_mes: 'Actividad',
  visitas_7d: 'Actividad', muestras_mes: 'Actividad', material_mes: 'Actividad', uds_mes: 'Ventas (unidades)', prescriptores: 'Ventas (unidades)',
  nuevos_presc: 'Ventas (unidades)', activos_90: 'Ventas (unidades)', conversion: 'Cartera', importe_mes: 'Ventas (importes)', borradores: 'Pedidos'
};
const KPI_PERMISO = { importe_mes: ['E', 1], borradores: ['V', 1], dups: ['Q', 1], sin_horario: ['M', 1] };
/* v2.87.0 · Cada indicador pertenece a un módulo: solo lo ve quien tiene acceso a ese módulo */
const KPI_MOD = {
  citas: 'agenda', visitas_sem: 'agenda', visitas_mes: 'agenda', visitas_7d: 'agenda', citas_7d: 'agenda', muestras_mes: 'agenda', material_mes: 'agenda',
  urgentes: 'directorio', interesados: 'directorio', sin_contactar: 'directorio', cartera: 'directorio', dups: 'directorio', sin_visita_60: 'directorio', sin_horario: 'directorio',
  uds_mes: 'ventas', importe_mes: 'ventas', prescriptores: 'ventas', nuevos_presc: 'ventas', activos_90: 'ventas', borradores: 'ventas',
  conversion: 'analitica'
};
function kpiPermitido(c) {
  if (!c) return false;
  if (c.admin && !puede('administrar')) return false;
  if (KPI_MOD[c.id] && !puedeModulo(KPI_MOD[c.id])) return false;
  const r = KPI_PERMISO[c.id];
  return !r || nivelDe2(r[0]) >= r[1];
}

/* ---------------- zonas de cada comercial ---------------- */

let PROV_CCAA = null;
const zonasMarcadas = () => [...$('dbody').querySelectorAll('#uzonas [data-zp]:checked')].map(x => x.dataset.zp).sort();
async function bloqueZonas(u) {
  if (!PROV_CCAA) {
    const [{ data: pc }, { data: rz }] = await Promise.all([db.from('provincias_ccaa').select('provincia,comunidad'), db.rpc('zonas_resumen')]);
    const cuenta = {}; (rz || []).forEach(x => cuenta[x.provincia] = x.medicos);
    PROV_CCAA = {};
    (pc || []).forEach(x => (PROV_CCAA[x.comunidad] = PROV_CCAA[x.comunidad] || []).push({ p: x.provincia, n: cuenta[x.provincia] || 0 }));
  }
  const { data: yo } = await db.from('perfiles').select('zonas').eq('id', u.id).single();
  const sel = new Set((yo && yo.zonas) || []);
  const bonito = p => p.charAt(0) + p.slice(1).toLowerCase();
  return `<div class="blk" id="uzonas"><h3>Zona de trabajo</h3>
    <p class="sm">Marca las provincias de su zona. Al guardar, ${TT('medico', 'p', 'el', 'l', 'l')} de esas provincias que no tengan comercial entran en su cartera, y los que se den de alta después entran solos. Solo verá ${TT('medico', 'p', 'el', 'l', 'l')} de su cartera.</p>
    <div class="zonas">${Object.keys(PROV_CCAA).sort().map(cc => {
      const ps = PROV_CCAA[cc].filter((x, i, a) => a.findIndex(y => y.n === x.n && bonito(y.p).slice(0, 4) === bonito(x.p).slice(0, 4)) === i || x.n || sel.has(x.p));
      return `<details ${ps.some(x => sel.has(x.p)) ? 'open' : ''}><summary><label onclick="event.stopPropagation()"><input type="checkbox" data-zcc="${esc(cc)}" ${ps.every(x => sel.has(x.p)) ? 'checked' : ''}> ${esc(cc)}</label>
        <span class="sm">${num(ps.reduce((n, x) => n + x.n, 0))} ${TT('medico', 'p', '', 'l', 'l')}</span></summary>
        <div class="zprov">${ps.map(x => `<label><input type="checkbox" data-zp="${esc(x.p)}" data-zpc="${esc(cc)}" ${sel.has(x.p) ? 'checked' : ''}> ${esc(bonito(x.p))} <span class="sm">${num(x.n)}</span></label>`).join('')}</div></details>`;
    }).join('')}</div>
    <div class="acts" style="margin-top:8px"><button class="btn sec" id="uzok">Guardar zona y asignar sus ${TT('medico', 'p', '', 'l', 'l')}</button></div></div>`;
}


/* ---------------- operativa de los pedidos ---------------- */

const OPS = [['pago', 'Cobrado', 'pago_estado', '💳'], ['paquete', 'Paquete preparado', 'paquete_en', '📦'],
  ['email_factura', 'Email con la factura enviado', 'email_factura_en', '🧾'], ['email_pago', 'Email con los datos de pago enviado', 'email_pago_en', '✉️']];
const opHecho = (p, k) => k === 'pago' ? p.pago_estado === 'Cobrado' : !!p[OPS.find(o => o[0] === k)[2]];

function textoEmailPago(p, total, cliente) { return plantillaCorreo('pago', 'texto', varsCorreo({ documento: 'pedido', numero: p.numero, importe: total, nombre: cliente })); }


// (v2.183.0: aquí iba la primera versión de pintarOperativa; se redefine entera más abajo)

/* ---------------- Pedidos: pestaña «Llamadas» ---------------- */


async function catLlamadas() {
  for (const k of ['motivo_llamada', 'resultado_llamada']) {
    if (!(CAT[k] || []).length) { const { data } = await db.rpc('catalogo_papel', { p_papel: k }); CAT[k] = data || []; }
  }
}
async function pintarLlamadas() {
  await catLlamadas();
  $('vcuerpo').innerHTML = `<div class="panel">
    <div class="filtros"><div id="llper"></div>
      <div><label for="llq">Buscar</label><input id="llq" type="search" placeholder="Nombre, teléfono o ${TT('medico', 's', '', 'l', 'l')}"></div>
      <div><label for="llfres">Resultado</label><select id="llfres"><option value="">Todos</option>${(CAT.resultado_llamada || []).map(x => `<option>${esc(x.valor)}</option>`).join('')}</select></div></div>
    <div class="kpis vtot" id="lltot"></div>
    <div class="angrid" id="llres2" style="margin:0 0 14px"></div>
    <div id="lllista"></div></div>`;
  let tq;
  const pinta = async () => {
    const r = $('llper').__rango();
    const [{ data: l }, { data: s }] = await Promise.all([
      db.rpc('llamadas_lista', { p_desde: r.desde, p_hasta: r.hasta, q: $('llq').value.trim() || null, p_resultado: $('llfres').value || null }),
      db.rpc('llamadas_resumen', { p_desde: r.desde, p_hasta: r.hasta })]);
    if (!$('lllista')) return;
    const res = s || {}, lista = l || [];
    $('lltot').innerHTML = `<div class="kpi"><b>${num(res.total || 0)}</b><span>Llamadas</span></div>
      <div class="kpi"><b>${num(res.con_pedido || 0)}</b><span>Acaban en pedido</span></div>
      <div class="kpi"><b>${res.total ? Math.round(res.con_pedido / res.total * 100) + '%' : '—'}</b><span>Conversión</span></div>`;
    $('llres2').innerHTML = `<div class="card ancard"><h2>Cómo terminan</h2>${(res.por_resultado || []).length ? barrasH(res.por_resultado.map(x => ({ n: x.resultado, v: x.n })), num) : vacioGrafico('Registra llamadas para ver cómo terminan.')}
        <p class="leer"><b>Cómo leerlo:</b> si pesan «El precio no le convence» o «Solo quería información», conviene revisar el argumentario o las condiciones.</p></div>
      <div class="card ancard"><h2>De qué ${TT('medico', 's', '', 'l', 'l')} vienen</h2>${(res.por_medico || []).length ? `<div class="barrash">${res.por_medico.map((x, i) => `<div class="bh"><span class="bhn">${i + 1}. ${esc(x.medico)}</span>
          <span class="bhb"><i style="width:${Math.max(3, x.n / res.por_medico[0].n * 100)}%"></i></span><b>${num(x.pedidos)}/${num(x.n)}</b></div>`).join('')}</div>` : vacioGrafico(`Verás qué ${TT('medico', 'p', '', 'l', 'l')} generan llamadas y cuántas acaban en pedido.`)}
        <p class="leer"><b>Cómo leerlo:</b> pedidos sobre llamadas por ${TT('medico', 's', '', 'l', 'l')}. ${TT('medico', 's', 'un', 'C', 'l')} con muchas llamadas y pocos pedidos es una oportunidad de seguimiento.</p></div>`;
    const tamL = tamPagina(); LLPAG = Math.min(LLPAG, Math.max(0, Math.ceil(lista.length / tamL) - 1));
    const lvis = lista.slice(LLPAG * tamL, LLPAG * tamL + tamL);
    $('lllista').innerHTML = lista.length ? `<div class="dgrid-wrap"><div class="dgrid llam">
      <div class="dh"><span>Fecha</span><span>Quién llama</span><span>${TT('medico', 's', '', 'l', 'C')}</span><span>Motivo</span><span>Resultado</span><span>Próximo paso</span><span>Atendió</span></div>
      ${lvis.map(x => `<button class="dr" data-ll="${x.id}"><span>${new Date(x.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}<span class="sm">${esc(x.direccion || '')}</span></span>
        <span><b>${esc(x.nombre || x.cliente || '—')}</b><span class="sm">${esc(x.telefono || '')}</span></span><span class="corta">${esc(x.medico || x.cuenta_texto || '—')}</span>
        <span class="sm">${esc(x.motivo || '—')}</span><span>${esc(x.resultado || '—')}${x.pedido ? `<span class="sm">Pedido ${esc(x.pedido)}</span>` : ''}</span>
        <span class="sm">${x.proxima_fecha ? fechaCorta(x.proxima_fecha) + ' · ' : ''}${esc(x.proxima_accion || '')}</span><span class="sm">${esc(x.usuario || '')}</span></button>`).join('')}</div></div>`
      : '<div class="vacio">Sin llamadas en este periodo. Regístralas con «+ Registrar llamada», aunque no acaben en pedido: así se puede analizar por qué.</div>';
    $('lllista').querySelectorAll('[data-ll]').forEach(b => b.onclick = () => editorLlamada(lista.find(x => x.id === b.dataset.ll)));
    $('lllista').insertAdjacentHTML('beforeend', '<div id="llpag"></div>');
    paginador($('llpag'), lista.length, LLPAG, p => { LLPAG = p; pinta(); }, () => { LLPAG = 0; pinta(); });
  };
  montarPeriodo($('llper'), { id: 'llamadas', valor: 'mes', alCambiar: pinta });
  $('llq').oninput = () => { clearTimeout(tq); tq = setTimeout(pinta, 300); };
  $('llfres').onchange = pinta;
  pinta();
}


/* ---------------- Inicio: operativa pendiente para televenta y administración ---------------- */


/* ---------------- Agenda: ver varios meses ---------------- */


/* ---------------- «Seguimiento» pasa a «Calidad del dato» ---------------- */

document.querySelectorAll('[data-t="seguimiento"]').forEach(b => { if (b.closest('nav.main')) b.textContent = 'Calidad del dato'; });

/* ---------------- ayudas y manual ---------------- */

AYUDA.seguimiento = ['Calidad del dato', `Qué parte de la base está completa y qué falta, y el avance comercial de cada ${TT('medico', 's', '', 'l', 'l')}.`, [
  `Arriba, el porcentaje de fichas completas y cuántas fichas no tienen ubicación, horario, ${TT('especialidad', 's', '', 'l', 'l')}, contacto, provincia o comercial.`,
  `Debajo, cada ${TT('medico', 's', '', 'l', 'l')} con su estado, ${TT('visita', 'p', '', 'l', 'l')} y próxima acción, con filtros para localizar los atrasados.`]];
MANUAL.forEach(s => {
  if (s.id === 'ventas') s.hacer.push([1, 'Operativa de cada pedido: pago recibido, paquete preparado y emails enviados (televenta)'], [1, `Registro de llamadas de televenta, con motivo, resultado y ${TT('medico', 's', '', 'l', 'l')} del que viene`]);
  if (s.id === 'admin') s.hacer.push([3, `Zona de cada comercial por provincias; ${TT('medico', 'p', 'el', 'l', 'l', 'nuevo')} de su zona entran solos en su cartera`], [3, 'Esquema de comisión con fecha de efecto: hoy, todo el histórico o una fecha concreta']);
});
MANUAL.push({ id: 'permisos', t: 'Permisos por módulo', a: null, para: 'Cada módulo se abre con su permiso; si no lo tienes, no aparece en el menú.',
  hacer: [[0, 'Clientes, Productos y stock, Facturación, Analítica y Calidad del dato tienen su propio permiso'],
    [0, '«Importes de ventas» decide si se ven euros o solo unidades en Inicio, Analítica y listados']], config: ['Administración → Usuarios → Editar'] });


