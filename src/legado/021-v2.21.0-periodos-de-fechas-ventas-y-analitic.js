/* ============================================================
   DLC OS 2.0 · v2.21.0 · Periodos de fechas, ventas y analítica
   con totales, indicadores en tarjetas, ruta en curso reordenable
   ============================================================ */

const ICO = {
  gear: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  ojo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  ojoNo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  nav: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
  arriba: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>',
  abajo: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>'
};

/* ---------------- periodos de fechas ---------------- */

const fechaLocal = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const PERIODOS = [['todo', 'Todo'], ['hoy', 'Hoy'], ['ayer', 'Ayer'], ['semana', 'Esta semana'], ['7d', 'Últimos 7 días'],
  ['mes', 'Mes actual'], ['mesant', 'Mes anterior'], ['tri', 'Trimestre actual'], ['triant', 'Trimestre anterior'],
  ['anio', 'Año actual'], ['anioant', 'Año anterior'], ['pers', 'Personalizado']];

function rangoPeriodo(k) {
  const h = new Date(); h.setHours(12, 0, 0, 0);
  const y = h.getFullYear(), m = h.getMonth(), q = Math.floor(m / 3);
  const D = (a, b, c) => fechaLocal(new Date(a, b, c, 12));
  const mas = n => { const d = new Date(h); d.setDate(d.getDate() + n); return fechaLocal(d); };
  switch (k) {
    case 'hoy': return [fechaLocal(h), fechaLocal(h)];
    case 'ayer': return [mas(-1), mas(-1)];
    case 'semana': return [mas(-((h.getDay() + 6) % 7)), fechaLocal(h)];
    case '7d': return [mas(-6), fechaLocal(h)];
    case 'mes': return [D(y, m, 1), D(y, m + 1, 0)];
    case 'mesant': return [D(y, m - 1, 1), D(y, m, 0)];
    case 'tri': return [D(y, q * 3, 1), D(y, q * 3 + 3, 0)];
    case 'triant': return [D(y, q * 3 - 3, 1), D(y, q * 3, 0)];
    case 'anio': return [D(y, 0, 1), D(y, 11, 31)];
    case 'anioant': return [D(y - 1, 0, 1), D(y - 1, 11, 31)];
    default: return [null, null];
  }
}

/** Selector de periodo. el.__rango() devuelve { desde, hasta } (null = sin límite). */
function montarPeriodo(el, o) {
  const clave = 'dlc-per-' + (o.id || el.id) + '-' + (PERFIL ? PERFIL.id : '');
  let v = localStorage.getItem(clave) || o.valor || 'mes';
  el.innerHTML = `<label>Periodo</label>
    <select data-per>${PERIODOS.map(([k, t]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <div class="perpers ${v === 'pers' ? '' : 'hide'}"><input type="date" data-pd aria-label="Desde"><span class="sm">a</span><input type="date" data-ph aria-label="Hasta"></div>
    <div class="sm perrango"></div>`;
  const s = el.querySelector('[data-per]'), d = el.querySelector('[data-pd]'), hh = el.querySelector('[data-ph]');
  const texto = () => {
    const r = el.__rango();
    el.querySelector('.perrango').textContent = v === 'pers' || v === 'todo' ? '' :
      (r.desde === r.hasta ? fechaCorta(r.desde) : `${fechaCorta(r.desde)} – ${fechaCorta(r.hasta)}`);
  };
  el.__rango = () => { if (v === 'pers') return { desde: d.value || null, hasta: hh.value || null }; const [a, b] = rangoPeriodo(v); return { desde: a, hasta: b }; };
  s.onchange = () => {
    v = s.value; localStorage.setItem(clave, v);
    el.querySelector('.perpers').classList.toggle('hide', v !== 'pers');
    if (v === 'pers' && !d.value) { const [a, b] = rangoPeriodo('mes'); d.value = a; hh.value = b; }
    texto(); o.alCambiar && o.alCambiar(el.__rango());
  };
  d.onchange = hh.onchange = () => { texto(); o.alCambiar && o.alCambiar(el.__rango()); };
  texto();
  return el.__rango;
}

/* ---------------- ventas: tabla con totales ---------------- */

/* Pedidos: la base y, en orden, las secciones, las llamadas y el botón de registrar llamada (antes eran 4 capas). */
async function cargarVentas() {
  // «Llamadas» solo para quien ve todo el equipo; la base pinta la cabecera como «Compras» y luego se sustituye
  if (PEDSEC === 'llamadas' && !VE_TODO()) PEDSEC = 'ventas';
  const sec = PEDSEC;
  if (sec === 'llamadas') PEDSEC = 'compras';
  PEDSEC_CARGA = sec;   // v2.335.0: mientras se monta sobre «Compras», el menú y las pestañas marcan ya la sección de verdad
  try {
    await cargarVentasBase();
    await pedidosSecciones();
  } finally { PEDSEC_CARGA = null; }
  await pedidosLlamadas(sec);
  await pedidosBotonLlamada();
}
var PEDSEC_CARGA = null;
function pedsecVista() { return PEDSEC_CARGA || PEDSEC; }

// Pedidos · Pestañas Ventas, Compras y Proveedores, y contenido de Compras y Proveedores
async function pedidosSecciones() {
  const v = $('v-ventas');
  v.querySelector('.saludo h1').firstChild.textContent = 'Pedidos';
  v.querySelector('.saludo .fecha').textContent = 'Ventas, compras y proveedores';
  v.querySelector('.saludo').insertAdjacentHTML('afterend', `<div class="subnav" id="pedsub">
    <button data-pedsec="ventas" aria-pressed="${pedsecVista() === 'ventas'}">Ventas</button>
    <button data-pedsec="compras" aria-pressed="${pedsecVista() === 'compras'}">Compras</button>
    <button data-pedsec="proveedores" aria-pressed="${pedsecVista() === 'proveedores'}">Proveedores</button></div>`);
  v.querySelectorAll('[data-pedsec]').forEach(b => b.onclick = () => { PEDSEC = b.dataset.pedsec; cargarVentas(); });
  if (PEDSEC === 'ventas') return;
  const acts = v.querySelector('.saludo .acts');
  acts.innerHTML = puedeCompras() ? (PEDSEC === 'compras' ? '<button class="btn" id="compnueva">+ Nuevo pedido de compra</button>'
    : '<button class="btn" id="provnuevo">+ Nuevo proveedor</button>') : '';
  if ($('compnueva')) $('compnueva').onclick = () => editorCompra(null);
  if ($('provnuevo')) $('provnuevo').onclick = () => editorProveedor(null);
  if (PEDSEC === 'compras') pintarCompras(); else pintarProveedores();
}

// Pedidos · Pestaña Llamadas y operativa de ventas
async function pedidosLlamadas(sec) {
  PEDSEC = sec;
  const sub = $('pedsub');
  if (PEDSEC === 'llamadas' && !hayOportunidades()) PEDSEC = 'ventas';
  if (sub && VE_TODO() && hayOportunidades() && !sub.querySelector('[data-pedsec="llamadas"]')) {
    sub.insertAdjacentHTML('beforeend', `<button data-pedsec="llamadas" aria-pressed="${PEDSEC === 'llamadas'}">Oportunidades</button>`);
    sub.querySelector('[data-pedsec="llamadas"]').onclick = () => { PEDSEC = 'llamadas'; cargarVentas(); };
  }
  if (sub) sub.querySelectorAll('[data-pedsec]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pedsec === PEDSEC)));
  if (PEDSEC === 'ventas' && VE_TODO()) pintarOperativa();
  if (PEDSEC === 'llamadas') {
    const acts = $('v-ventas').querySelector('.saludo .acts');
    acts.innerHTML = '<button class="btn" id="llnueva">+ Nueva venta</button>';
    $('llnueva').onclick = () => nuevaVenta();
    pintarLlamadas();
  }
}

// Pedidos · Botón «Registrar llamada» en Ventas
async function pedidosBotonLlamada() {
  return;   // v2.125.0: «+ Nueva venta» une llamada y pedido
  if (!VE_TODO() || PEDSEC !== 'ventas') return;
  const acts = $('v-ventas').querySelector('.saludo .acts');
  if (acts && !$('pedllam')) {
    acts.insertAdjacentHTML('afterbegin', '<button class="btn sec" id="pedllam">📞 Registrar llamada</button>');
    $('pedllam').onclick = () => editorLlamada(null);
  }
}

/* Parte base; cargarVentas le añade el resto */
async function cargarVentasBase() {
  vaciarModulos('v-ventas');
  $('v-ventas').innerHTML = `
    <div class="saludo"><div><h1>Ventas</h1><div class="fecha">Pedidos, unidades e importes</div></div>
      <div class="acts" style="margin:0">${puedeVentas() ? '<button class="btn" id="pednuevo">+ Nueva venta</button>' : ''}</div></div>
    <div id="vcuerpo">
      <div class="panel">
        <div class="filtros">
          <div id="pper"></div>
          <div><label for="pcanal">Canal</label><select id="pcanal">
            <option value="">Todos</option><option value="paciente">Venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
            <option value="centro">Venta a centro</option></select></div>
          <div><label for="pestado">Estado</label><select id="pestado">
            <option value="">Todos</option><option value="Confirmado">Confirmados</option>
            <option value="Borrador">Borradores</option><option value="Anulado">Anulados</option></select></div>
          <div><label for="pq">Buscar</label><input id="pq" type="search" placeholder="${TT('medico', 's', '', 'l', 'C')}, ${TT('paciente', 's', '', 'l', 'l')} o nº de pedido"></div>
        </div>
        <div class="kpis vtot" id="ptotales"></div>
        <div id="pedlista"></div>
      </div>
    </div>`;
  if ($('pednuevo')) $('pednuevo').onclick = () => nuevaVenta();   // v2.125.0: cliente, interés y cierre en un recorrido
  montarPeriodo($('pper'), { id: 'ventas', valor: 'mes', alCambiar: listaPedidos });
  ['pcanal', 'pestado'].forEach(id => $(id).onchange = listaPedidos);
  let tq; $('pq').oninput = () => { clearTimeout(tq); tq = setTimeout(listaPedidos, 350); };
  await cargarProductos();
  listaPedidos();
  pintarSinAtribuir();
}


/* ---------------- analítica con totales y filtros ---------------- */

let AN_MED = null;
async function cargarAnalitica() {
  if (!COMS.length && VE_TODO()) await cargarComerciales();
  await cargarProductos();
  $('v-analitica').innerHTML = `
    <div class="saludo"><div><h1>Analítica</h1><div class="fecha">Unidades e importes por ${TT('medico', 's', '', 'l', 'l')}, comercial, producto o zona</div></div></div>
    <div class="panel">
      <div class="filtros">
        <div id="aper"></div>
        <div><label for="adim">Ver por</label><select id="adim">
          <option value="medico">${TT('medico', 's', '', 'l', 'C')}</option><option value="comercial">Comercial</option>
          <option value="producto">Producto</option><option value="municipio">Municipio</option>
          <option value="mes">Mes</option><option value="canal">Canal</option></select></div>
        <div><label for="amedida">Ordenar por</label><select id="amedida">
          <option value="unidades">Unidades</option><option value="importe">Importe</option></select></div>
        <div><label for="acanal">Canal</label><select id="acanal">
          <option value="">Todos</option><option value="paciente">Venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
          <option value="centro">Venta a centro</option></select></div>
        <div><label for="aprod">Producto</label><select id="aprod"><option value="">Todos</option>
          ${PRODUCTOS.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></div>
        <div><label for="arep">Reporting</label><select id="arep"><option value="">Todos ${TT('medico', 'p', 'el', 'l', 'l')}</option>
          <option value="con">Con reporting</option><option value="sin">Sin reporting</option></select></div>
        ${VE_TODO() ? `<div><label for="areprt">Reporte</label><select id="areprt"><option value="">Todos</option><option value="si">Reportados</option><option value="no">Sin reportar</option></select></div>` : ''}
        ${VE_TODO() ? `<div><label for="acom">Comercial</label><select id="acom"><option value="">Todos</option>
          ${COMS.map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select></div>` : ''}
        <div style="grid-column:span 2"><label>${TT('medico', 's', '', 'l', 'C')}</label><div id="amed"></div></div>
        <input type="hidden" id="adesde"><input type="hidden" id="ahasta">
      </div>
      <div class="kpis vtot" id="atot"></div>
      <div id="aprods"></div>
      <div class="subnav"><button data-avista="rank" aria-pressed="true">Ranking</button>
        <button data-avista="tabla" aria-pressed="false">Tabla por meses</button></div>
      <div id="aserie" style="padding:14px"></div>
      <div id="atabla"></div>
      <div id="atabla2" class="hide"></div>
    </div>`;
  const sinc = () => { const r = $('aper').__rango(); $('adesde').value = r.desde || ''; $('ahasta').value = r.hasta || ''; };
  montarPeriodo($('aper'), { id: 'analitica', valor: 'anio', alCambiar: () => { sinc(); refrescarAnalitica(); } });
  sinc();
  selectorMedico($('amed'), { valor: AN_MED, placeholder: `Todos · busca ${TT('medico', 's', 'un', 'l', 'l')} para ver sus ventas`, alElegir: m => { AN_MED = m; refrescarAnalitica(); } });
  ['adim', 'acanal', 'amedida', 'aprod', 'acom', 'arep', 'areprt'].forEach(id => { if ($(id)) $(id).onchange = refrescarAnalitica; });
  $('v-analitica').querySelectorAll('[data-avista]').forEach(b => b.onclick = () => {
    const tabla = b.dataset.avista === 'tabla';
    $('v-analitica').querySelectorAll('[data-avista]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('atabla').classList.toggle('hide', tabla); $('aserie').classList.toggle('hide', tabla);
    $('atabla2').classList.toggle('hide', !tabla);
    if (tabla) pintarTablaAnalitica();
  });
  pintarAnalitica();
}

function refrescarAnalitica() {
  pintarAnalitica();
  if (!$('atabla2').classList.contains('hide')) pintarTablaAnalitica();
}

async function pintarAnalitica() {
  cargando($('atabla'), 'Calculando…');
  $('atot').innerHTML = Array.from({ length: 4 }, () => '<div class="kpi ksk"><div class="skel" style="width:40%;height:24px;margin:2px 0 8px"></div><div class="skel" style="width:70%;margin:0"></div></div>').join('');
  const r = $('aper').__rango(), dim = $('adim').value, medida = $('amedida').value;
  const { data, error } = await db.rpc('analitica_v2', {
    p_dim: dim, p_desde: r.desde, p_hasta: r.hasta, p_canal: $('acanal').value || null,
    p_medico: AN_MED ? AN_MED.id : null, p_comercial: ($('acom') && $('acom').value) || null,
    p_producto: $('aprod').value || null, lim: 100, p_reporting: ($('arep') && $('arep').value) || null, p_reportado: ($('areprt') && $('areprt').value) || null });
  if (error) { $('atabla').innerHTML = `<div class="vacio">No se ha podido calcular: ${esc(error.message)}</div>`; $('atot').innerHTML = ''; return; }
  const t = data.totales || {}, filas = (data.filas || []).slice().sort((a, b) => (+b[medida] || 0) - (+a[medida] || 0));
  const quien = [AN_MED ? AN_MED.nombre : '', $('acom') && $('acom').value ? $('acom').selectedOptions[0].textContent : '',
    $('aprod').value ? $('aprod').selectedOptions[0].textContent : '', $('arep') && $('arep').value ? $('arep').selectedOptions[0].textContent : '',
    $('areprt') && $('areprt').value ? $('areprt').selectedOptions[0].textContent : ''].filter(Boolean).join(' · ');
  $('atot').innerHTML = `
    <div class="kpi"><b>${num(t.unidades)}</b><span>Unidades${quien ? ' · ' + esc(quien) : ''}</span></div>
    <div class="kpi ok"><b>${eurI(t.importe)}</b><span>Importe sin IVA</span></div>
    <div class="kpi"><b>${num(t.pedidos)}</b><span>Pedidos</span></div>
    <div class="kpi"><b>${num(t.medicos)}</b><span>${TT('medico', 'p', '', 'l', 'C')} con ventas</span></div>`;
  const pp = data.por_producto || [];
  $('aprods').innerHTML = pp.length > 1 || (pp.length === 1 && dim !== 'producto') ? `<div class="dgrid-wrap"><div class="dgrid aprod">
    <div class="dh"><span>Por producto</span><span class="num">Unidades</span><span class="num">% uds.</span><span class="num">Importe</span></div>
    ${pp.map(p => `<div class="dr" style="cursor:default"><span><b>${esc(p.nombre)}</b></span><span class="num">${num(p.unidades)}</span>
      <span class="num">${Math.round(p.unidades / (t.unidades || 1) * 100)}%</span><span class="num">${eurI(p.importe)}</span></div>`).join('')}
  </div></div>` : '';

  const serie = data.serie || [];
  if (serie.length > 1) {
    const max = Math.max(...serie.map(s => +s[medida] || 0)) || 1;
    $('aserie').innerHTML = `<div style="display:flex;gap:6px;align-items:flex-end;height:130px">${serie.map(s => `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px">
        <span class="sm">${medida === 'importe' ? eurI(s.importe).replace(',00', '') : num(s.unidades)}</span>
        <div style="width:100%;background:var(--sky);border-radius:6px 6px 0 0;height:${Math.round((+s[medida] || 0) / max * 84)}px"></div>
        <span class="sm">${esc(s.mes.slice(5))}/${esc(s.mes.slice(2, 4))}</span></div>`).join('')}</div>`;
  } else $('aserie').innerHTML = '';

  const tot = +t[medida] || 1;
  $('atabla').innerHTML = filas.length ? `<div class="dgrid-wrap"><div class="dgrid arank">
    <div class="dh"><span>#</span><span>${esc($('adim').selectedOptions[0].textContent)}</span><span class="num">Unidades</span>
      <span class="num">Importe</span><span class="num">Pedidos</span><span>Peso</span></div>
    ${filas.map((f, i) => `<div class="dr" style="cursor:default"><span class="sm">${i + 1}</span><span><b>${esc(f.nombre)}</b></span>
      <span class="num">${num(f.unidades)}</span><span class="num">${eurI(f.importe)}</span><span class="num">${num(f.pedidos)}</span>
      <span class="barra"><i style="width:${Math.round((+f[medida] || 0) / tot * 100)}%"></i><em>${Math.round((+f[medida] || 0) / tot * 100)}%</em></span></div>`).join('')}
    <div class="dr dtot"><span></span><span><b>Total</b></span><span class="num"><b>${num(t.unidades)}</b></span>
      <span class="num"><b>${eurI(t.importe)}</b></span><span class="num"><b>${num(t.pedidos)}</b></span><span></span></div>
  </div></div>` : '<div class="vacio">Sin pedidos completados con estos filtros.</div>';
}

/* ---------------- auditoría con periodo ---------------- */

async function pintarAuditoria() {
  cargando($('admcuerpo'), 'Cargando la auditoría…');
  const nombreEnt = { cuentas: `${TT('medico', 's', '', 'l', 'C')}`, ubicaciones: TT('consulta', 's', '', 'l', 'C'), actividades: `${TT('visita', 's', '', 'l', 'C')}`, atribuciones: 'Cartera', agenda: 'Cita', rutas: 'Ruta',
    pedidos: 'Pedido', perfiles: 'Usuario', productos: 'Producto', contactos: `${TT('paciente', 's', '', 'l', 'C')}` };
  const { data: us } = await db.rpc('usuarios_lista');
  const usuarios = (us || []).slice().sort((x, y) => String(x.nombre).localeCompare(String(y.nombre), 'es'));
  ($('admcuerpo') || document.createElement('div')).innerHTML = `<h2>Auditoría<span class="n" id="audn">…</span></h2>
    <p class="sm">Quién ha cambiado qué y cuándo. Se guarda automáticamente.</p>
    <div class="filtros" style="border:0;padding:10px 16px">
      <div id="audper"></div>
      <div><label for="ausr">Usuario</label><select id="ausr"><option value="">Todos</option>
        ${usuarios.map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select></div>
      <div><label for="aent">Entidad</label><select id="aent"><option value="">Todas</option>
        ${Object.entries(nombreEnt).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div></div>
    <div id="auddes"></div>
    <div class="lista" id="audlista"></div>`;
  const pinta = async () => {
    cargando($('audlista'), 'Filtrando…');
    const r = $('audper').__rango();
    const { data } = await RPC_ORIG('auditoria_lista', { p_entidad: $('aent').value || null, p_usuario: $('ausr').value || null,
      p_desde: r.desde, lim: 500 });
    if (!$('audn') || !$('audlista')) return;   // v2.160.0: se cambió de pestaña mientras cargaba (error del registro de pruebas)
    const l = (data || []).filter(a => !r.hasta || String(a.creado_en).slice(0, 10) <= r.hasta);
    $('audn').textContent = num(l.length) + (l.length === 500 ? '+' : '');
    $('audlista').innerHTML = l.map(a => `<div class="item" style="cursor:default">
      <span class="ic ${a.accion === 'Baja' ? 'w' : a.accion === 'Alta' ? 'o' : ''}">${a.accion === 'Alta' ? '+' : a.accion === 'Baja' ? '−' : '✎'}</span>
      <span class="tx"><b>${esc(a.accion)} · ${esc(nombreEnt[a.entidad] || a.entidad)}</b>
        <span class="sm">${esc(a.usuario)} · ${new Date(a.creado_en).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span class="sm">${esc(resumenDetalle(a.detalle))}</span></span>${deshacible(a) ? `<button type="button" class="btn sec" data-audx="${a.id}">Deshacer</button>` : ''}</div>`).join('')
      || '<div class="vacio">Sin movimientos con estos filtros.</div>';
    // v2.123.0: deshacer un cambio, o todo lo de la persona elegida desde el inicio del periodo
    $('audlista').querySelectorAll('[data-audx]').forEach(b => b.onclick = () => deshacerUno(+b.dataset.audx, pinta));
    cajaDeshacerPersona($('auddes'), $('ausr').value, r.desde, ($('ausr').selectedOptions[0] || {}).textContent || '', pinta);
  };
  montarPeriodo($('audper'), { id: 'auditoria', valor: '7d', alCambiar: pinta });
  ['ausr', 'aent'].forEach(id => $(id).onchange = pinta);
  pinta();
}

/* ---------------- indicadores: configurador en tarjetas ---------------- */

function abrirKpis() {
  let D = kpiConfig().slice();
  KPI_CAT.forEach(k => { if (!D.some(x => x.id === k.id)) D.push({ id: k.id, on: false, t: '' }); });
  const esAdmin = puede('administrar');
  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Indicadores de Inicio</h2>
        <div class="sm">Pulsa el ojo para mostrar u ocultar. Ordénalos con las flechas y cambia el nombre si quieres.</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="kcards">${D.map((x, i) => {
        const k = KPI_CAT.find(y => y.id === x.id);
        if (!k && !x.filtro) return '';
        if (k && !kpiPermitido(k)) return '';
        const desc = x.filtro ? 'Filtro guardado del Directorio: ' + textoFiltro(x.filtro) + '.' : (AYUDA_KPI[x.id] || '');
        return `<div class="kcard ${x.on ? 'on' : ''}">
          <button type="button" class="kojo" data-kon="${i}" aria-pressed="${x.on}" title="${x.on ? 'Visible: pulsa para ocultar' : 'Oculto: pulsa para mostrar'}">${x.on ? ICO.ojo : ICO.ojoNo}</button>
          <div class="ktx"><input class="chico" data-kt="${i}" value="${esc(x.t)}" placeholder="${esc(k ? k.t.charAt(0).toUpperCase() + k.t.slice(1) : textoFiltro(x.filtro))}" aria-label="Nombre del indicador">
            <span class="sm">${esc(desc)}</span></div>
          <div class="kord">
            <button type="button" class="kmv" data-kmv="${i}|-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICO.arriba}</button>
            <button type="button" class="kmv" data-kmv="${i}|1" aria-label="Bajar" ${i === D.length - 1 ? 'disabled' : ''}>${ICO.abajo}</button>
            ${x.filtro ? `<button type="button" class="kmv" data-kdel="${i}" aria-label="Eliminar" title="Eliminar">✕</button>` : ''}</div>
        </div>`;
      }).join('')}</div>
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" id="kres">Restaurar</button>
        <button class="btn" id="kok">Guardar</button></div>`;
    const leer = () => $('dbody').querySelectorAll('[data-kt]').forEach(i => D[+i.dataset.kt].t = i.value.trim());
    $('dbody').querySelectorAll('[data-kon]').forEach(b => b.onclick = () => { leer(); D[+b.dataset.kon].on = !D[+b.dataset.kon].on; $('dlg').dataset.sucio = '1'; pinta(); });
    $('dbody').querySelectorAll('[data-kmv]').forEach(b => b.onclick = () => {
      leer(); const [i, dir] = b.dataset.kmv.split('|').map(Number), j = i + dir;
      if (j < 0 || j >= D.length) return; [D[i], D[j]] = [D[j], D[i]]; $('dlg').dataset.sucio = '1'; pinta();
    });
    $('dbody').querySelectorAll('[data-kdel]').forEach(b => b.onclick = () => { leer(); D.splice(+b.dataset.kdel, 1); $('dlg').dataset.sucio = '1'; pinta(); });
    $('kres').onclick = () => { D = KPI_CAT.map(k => ({ id: k.id, on: KPI_DEF.includes(k.id), t: '' })); $('dlg').dataset.sucio = '1'; pinta(); };
    $('kok').onclick = async ev => {
      leer(); ev.target.disabled = true; ev.target.textContent = 'Guardando…';
      const ok = await guardarKpis(D.map(x => ({ id: x.id, on: x.on, t: x.t, ...(x.filtro ? { filtro: x.filtro } : {}) })));
      ev.target.disabled = false; ev.target.textContent = 'Guardar';
      if (!ok) return;
      $('dlg').close(); toast('Indicadores guardados'); cargarInicio();
    };
  };
  pinta();
  $('dlg').showModal();
}

/* ---------------- ruta en curso: ficha al pulsar, acciones y orden ---------------- */



/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  analitica: ['Analítica', 'Unidades e importes de los pedidos completados.', [
    `Elige el <b>periodo</b> y la dimensión: ${TT('medico', 's', '', 'l', 'l')}, comercial, producto, municipio, mes o canal.`,
    `Filtra por un <b>${TT('medico', 's', '', 'l', 'l')}</b>, un <b>comercial</b> o un <b>producto</b> para ver sus totales y su reparto por producto.`,
    'El importe es sin IVA y con el descuento de cada línea.',
    'Los datos no se pueden descargar: se consultan solo dentro de la plataforma.']]
});
AYUDA.inicio[2].splice(1, 1, 'El icono ⚙ junto al saludo abre los indicadores: el ojo los muestra u oculta y las flechas cambian el orden.');
AYUDA.ventas[2].push('Arriba tienes los totales del periodo (solo pedidos completados: confirmados, cobrados, preparados y facturados) y al final de la tabla, la suma.');


