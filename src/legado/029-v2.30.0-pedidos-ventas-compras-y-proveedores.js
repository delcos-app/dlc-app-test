/* ============================================================
   DLC OS 2.0 · v2.30.0 · Pedidos (Ventas, Compras y Proveedores)
   y Stock por lotes con trazabilidad
   ============================================================ */

Object.assign(RPC_TTL, { stock_resumen: 30, compras_lista: 30, proveedores_lista: 60, almacenes_lista: 60, alertas_stock: 60 });

const puedeCompras = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).V || 0) >= 3);
let PEDSEC = 'ventas', PROVEEDORES = [], ALMACENES = [];
async function cargarProveedores() { const { data } = await db.rpc('proveedores_lista'); PROVEEDORES = data || []; }
async function cargarAlmacenes() { const { data } = await db.rpc('almacenes_lista'); ALMACENES = data || []; }
const pillCompra = e => `<span class="pill ${e === 'Recibido' ? 'p-est' : e === 'Cancelado' ? 'p-anu' : e === 'Borrador' ? 'p-bor' : 'p-per'}">${esc(e)}</span>`;

/* ---------------- módulo Pedidos ---------------- */


/* ---------------- compras ---------------- */

async function pintarCompras() {
  cargando($('vcuerpo'), 'Cargando compras…');
  const { data, error } = await db.rpc('compras_lista');
  if (PEDSEC !== 'compras') return;   // v2.125.0: si mientras tanto se ha ido a otra pestaña (Oportunidades se monta sobre Compras), no se pisa
  if (error) { $('vcuerpo').innerHTML = `<div class="vacio">${esc(error.message)}</div>`; return; }
  const l = data || [];
  const abiertas = l.filter(c => ['Enviado', 'En tránsito', 'Recibido parcial'].includes(c.estado));
  $('vcuerpo').innerHTML = `<div class="panel">
    <div class="kpis vtot">
      <div class="kpi"><b>${num(abiertas.length)}</b><span>Pedidos de compra en curso</span></div>
      <div class="kpi"><b>${num(abiertas.reduce((n, c) => n + (c.unidades - c.recibidas), 0))}</b><span>Unidades en camino</span></div>
      <div class="kpi ${l.some(c => c.retrasada) ? 'warn' : ''}"><b>${num(l.filter(c => c.retrasada).length)}</b><span>Con retraso</span></div>
      <div class="kpi"><b>${eurI(l.filter(c => c.estado !== 'Cancelado' && c.fecha >= hoyISO().slice(0, 4) + '-01-01').reduce((n, c) => n + (+c.importe || 0), 0))}</b><span>Comprado este año (sin IVA)</span></div>
    </div>
    ${l.length ? `<div class="dgrid-wrap"><div class="dgrid comps">
      <div class="dh"><span>Número</span><span>Proveedor</span><span>Productos</span><span>Fecha</span><span>Llegada prevista</span>
        <span class="num">Unidades</span><span class="num">Importe</span><span>Estado</span></div>
      ${l.map(c => `<button class="dr" data-comp="${c.id}">
        <span><b>${esc(c.numero)}</b></span><span>${esc(c.proveedor || '—')}</span><span class="sm">${esc(c.productos || '')}</span>
        <span>${fechaCorta(c.fecha)}</span>
        <span style="${c.retrasada ? 'color:var(--danger);font-weight:700' : ''}">${c.fecha_prevista ? fechaCorta(c.fecha_prevista) + (c.retrasada ? ' · retraso' : '') : '—'}</span>
        <span class="num">${c.recibidas && c.recibidas < c.unidades ? `${num(c.recibidas)}/` : ''}${num(c.unidades)}</span>
        <span class="num">${eurI(c.importe)}</span><span>${pillCompra(c.estado)}</span></button>`).join('')}
    </div></div>` : `<div class="vacio">Todavía no hay pedidos de compra.${puedeCompras() ? ' Crea el primero con «+ Nuevo pedido de compra».' : ''}</div>`}</div>`;
  $('vcuerpo').querySelectorAll('[data-comp]').forEach(b => b.onclick = () => editorCompra(b.dataset.comp));
}

async function editorCompra(id) {
  await Promise.all([cargarProductos(), cargarProveedores(), cargarAlmacenes()]);
  let det = null;
  if (id) det = (await RPC_ORIG('compra_detalle', { p_id: id })).data;
  const c = det ? det.compra : { estado: 'Borrador', fecha: hoyISO(), portes: 0 };
  const editable = puedeCompras() && ['Borrador', 'Enviado', 'En tránsito'].includes(c.estado);
  let lineas = det ? det.lineas.map(l => Object.assign({}, l)) : [{ producto_id: (PRODUCTOS[0] || {}).id, unidades: 1, coste_unitario: (PRODUCTOS[0] || {}).coste }];
  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${id ? 'Pedido de compra ' + esc(c.numero) : 'Nuevo pedido de compra'} ${id ? pillCompra(c.estado) : ''}</h2>
        <div class="sm">${id ? 'Creado el ' + fechaCorta(c.fecha) : 'Se numera solo al guardarlo'}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="g2">
        <div><label for="cpprov">Proveedor</label><select id="cpprov" ${editable ? '' : 'disabled'}>
          ${PROVEEDORES.filter(p => p.activo || p.id === c.proveedor_id).map(p => `<option value="${p.id}" data-plazo="${p.plazo_dias || 90}" ${p.id === c.proveedor_id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
        <div class="g2" style="margin:0">
          <div><label for="cpfecha">Fecha</label><input id="cpfecha" type="date" value="${esc(c.fecha || hoyISO())}" ${editable ? '' : 'disabled'}></div>
          <div><label for="cpprev">Llegada prevista</label><input id="cpprev" type="date" value="${esc(c.fecha_prevista || '')}" ${editable ? '' : 'disabled'}></div></div>
      </div>
      <label>Productos</label>
      <div id="cplin">${lineas.map((l, i) => `<div class="lin"><div class="lrow cprow">
        <div><label>Producto</label><select data-cl="${i}|producto_id" ${editable ? '' : 'disabled'}>${PRODUCTOS.map(p => `<option value="${p.id}" ${p.id === l.producto_id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
        <div><label>Unidades</label><input type="number" min="1" data-cl="${i}|unidades" value="${l.unidades}" ${editable ? '' : 'disabled'}></div>
        <div><label>Coste unidad sin IVA</label><input type="number" step="0.0001" min="0" data-cl="${i}|coste_unitario" value="${l.coste_unitario != null ? l.coste_unitario : ''}" ${editable ? '' : 'disabled'}></div>
        <div>${id ? `<label>Recibidas</label><div class="cprec">${num(l.recibidas || 0)} de ${num(l.unidades)}</div>` : ''}</div>
        <div>${editable && lineas.length > 1 ? `<button type="button" class="btn sec" data-clx="${i}" aria-label="Quitar">✕</button>` : ''}</div></div></div>`).join('')}</div>
      ${editable ? '<div class="acts" style="margin-top:0"><button type="button" class="btn sec" id="cpmas">+ Añadir producto</button></div>' : ''}
      <div class="g2">
        <div><label for="cpport">Portes sin IVA (€)</label><input id="cpport" type="number" step="0.01" min="0" value="${c.portes || 0}" ${editable ? '' : 'disabled'}></div>
        <div><label for="cpnota">Nota</label><input id="cpnota" value="${esc(c.nota || '')}" ${editable ? '' : 'disabled'}></div></div>
      <div class="totbox" id="cptot"></div>
      ${det && det.lotes.length ? `<div class="blk"><h3>Lotes recibidos</h3>${det.lotes.map(lo => `<div class="sm">📦 <b>${esc(lo.producto)}</b> · lote ${esc(lo.numero_lote)} · ${num(lo.unidades)} uds${lo.caducidad ? ' · caduca ' + fechaCorta(lo.caducidad) : ''}</div>`).join('')}</div>` : ''}
      <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn sec" data-cerrar>Cerrar</button>
        ${puedeCompras() && id && !['Recibido', 'Cancelado'].includes(c.estado) ? '<button class="btn sec dang" id="cpcancel">Cancelar pedido</button>' : ''}
        ${editable ? `<button class="btn sec" id="cpguardar">${c.estado === 'Borrador' ? 'Guardar borrador' : 'Guardar cambios'}</button>` : ''}
        ${puedeCompras() && c.estado === 'Borrador' ? '<button class="btn sec" id="cpenviar">Marcar como enviado</button>' : ''}
        ${puedeCompras() && c.estado === 'Enviado' ? '<button class="btn sec" id="cptransito">En tránsito</button>' : ''}
        ${puedeCompras() && id && ['Enviado', 'En tránsito', 'Recibido parcial'].includes(c.estado) ? '<button class="btn" id="cprecibir">📦 Recibir mercancía</button>' : ''}
      </div>`;
    const total = () => {
      const base = lineas.reduce((n, l) => n + (+l.unidades || 0) * (+l.coste_unitario || 0), 0) + (+$('cpport').value || 0);
      $('cptot').innerHTML = `<div><span>Unidades</span><b>${num(lineas.reduce((n, l) => n + (+l.unidades || 0), 0))}</b></div>
        <div class="tot"><span>Importe sin IVA (con portes)</span><b>${eurI(base)}</b></div>`;
    };
    total();
    if (!editable) { bind(); return; }
    $('cplin').oninput = $('cplin').onchange = e => {
      const [i, k] = (e.target.dataset.cl || '').split('|'); if (!k) return;
      lineas[+i][k] = k === 'producto_id' ? e.target.value : +e.target.value;
      if (k === 'producto_id') { const p = PRODUCTOS.find(x => x.id === e.target.value); if (p && p.coste != null) { lineas[+i].coste_unitario = p.coste; pinta(); return; } }
      total();
    };
    $('cpport').oninput = total;
    $('cpmas').onclick = () => { lineas.push({ producto_id: (PRODUCTOS[0] || {}).id, unidades: 1, coste_unitario: (PRODUCTOS[0] || {}).coste }); pinta(); };
    $('cplin').querySelectorAll('[data-clx]').forEach(b => b.onclick = () => { lineas.splice(+b.dataset.clx, 1); pinta(); });
    $('cpprov').onchange = () => { if (!$('cpprev').value) $('cpprev').value = isoMas($('cpfecha').value || hoyISO(), +$('cpprov').selectedOptions[0].dataset.plazo || 90); };
    if (!$('cpprev').value && $('cpprov').value) $('cpprov').onchange();
    bind();
  };
  const guardar = async estado => {
    if (!$('cpprov').value) { toast('Elige el proveedor (créalo antes en la pestaña Proveedores)', true); return false; }
    const { data: r, error } = await db.rpc('guardar_compra', { p: { id: id || null, proveedor_id: $('cpprov').value, fecha: $('cpfecha').value,
      fecha_prevista: $('cpprev').value, estado: estado || c.estado, portes: $('cpport').value, nota: $('cpnota').value.trim(),
      lineas: lineas.filter(l => l.producto_id && +l.unidades > 0).map(l => ({ producto_id: l.producto_id, unidades: +l.unidades, coste_unitario: l.coste_unitario })) } });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar: ' + ((error && error.message) || r.error), true); return false; }
    toast(`Pedido de compra ${r.numero} guardado`); $('dlg').close(); if (TAB === 'ventas') cargarVentas(); return true;
  };
  const bind = () => {
    if ($('cpguardar')) $('cpguardar').onclick = () => guardar();
    if ($('cpenviar')) $('cpenviar').onclick = () => guardar('Enviado');
    if ($('cptransito')) $('cptransito').onclick = async () => {
      const { error } = await db.rpc('guardar_compra', { p: { id, proveedor_id: c.proveedor_id, fecha: c.fecha, fecha_prevista: c.fecha_prevista, estado: 'En tránsito', portes: c.portes, nota: c.nota } });
      if (error) { toast('No se ha podido', true); return; } toast('Marcado en tránsito'); $('dlg').close(); cargarVentas();
    };
    if ($('cpcancel')) $('cpcancel').onclick = async () => {
      if (!await preguntar('El pedido de compra queda cancelado. Lo ya recibido se mantiene en stock.', { titulo: '¿Cancelar el pedido de compra?', ok: 'Cancelar pedido', peligro: true })) return;
      await db.rpc('guardar_compra', { p: { id, proveedor_id: c.proveedor_id, fecha: c.fecha, fecha_prevista: c.fecha_prevista, estado: 'Cancelado', portes: c.portes, nota: c.nota } });
      toast('Pedido de compra cancelado'); $('dlg').close(); cargarVentas();
    };
    if ($('cprecibir')) $('cprecibir').onclick = () => recibirCompra(id, det);
  };
  pinta();
  $('dlg').showModal();
}

function recibirCompra(id, det) {
  const pend = det.lineas.filter(l => l.unidades > l.recibidas);
  const central = ALMACENES.find(a => a.tipo === 'central') || ALMACENES[0] || {};
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Recibir mercancía · ${esc(det.compra.numero)}</h2>
      <div class="sm">Anota cada lote con su caducidad. Si llega en varios lotes, usa «+ Otro lote».</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div id="rclin">${pend.map((l, i) => `<div class="lin" data-rl="${l.id}">
      <b>${esc(l.producto)}</b> <span class="sm">· pendientes ${num(l.unidades - l.recibidas)} de ${num(l.unidades)}</span>
      <div class="rclotes">${loteRecepcion(l, l.unidades - l.recibidas, central.id)}</div>
      <button type="button" class="kcfg" data-rlmas="${l.id}">+ Otro lote de este producto</button></div>`).join('')}</div>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="rcok">Registrar la entrada</button></div>`;
  $('rclin').querySelectorAll('[data-rlmas]').forEach(b => b.onclick = () => {
    const l = pend.find(x => x.id === b.dataset.rlmas);
    b.previousElementSibling.insertAdjacentHTML('beforeend', loteRecepcion(l, '', central.id));
  });
  $('rcok').onclick = async ev => {
    const filas = [...$('rclin').querySelectorAll('.rcl')].map(f => ({
      linea_id: f.closest('[data-rl]').dataset.rl, unidades: +f.querySelector('[data-r=u]').value || 0,
      numero_lote: f.querySelector('[data-r=lote]').value.trim(), caducidad: f.querySelector('[data-r=cad]').value,
      fecha_fabricacion: f.querySelector('[data-r=fab]').value, almacen_id: f.querySelector('[data-r=alm]').value })).filter(x => x.unidades > 0);
    if (!filas.length) { toast('Indica las unidades recibidas', true); return; }
    if (filas.some(x => !x.numero_lote)) { toast('Cada entrada necesita su número de lote', true); return; }
    if (filas.some(x => !x.caducidad) && !await preguntar('Hay lotes sin fecha de caducidad. Sin ella no se pueden avisar ni ordenar las salidas por caducidad.', { titulo: '¿Registrar sin caducidad?', ok: 'Registrar igualmente' })) return;
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('recibir_compra', { p_compra: id, p_lineas: filas });
    if (error || (r && r.ok === false)) { ev.target.disabled = false; toast('No se ha podido: ' + ((error && error.message) || r.error), true); return; }
    $('dlg').close(); toast(r.pendientes ? `Entrada registrada · quedan ${num(r.pendientes)} unidades por llegar` : 'Pedido recibido completo');
    cargarVentas();
  };
}
function loteRecepcion(l, uds, almId) {
  return `<div class="g2 rcl">
    <div class="g2" style="margin:0"><div><label>Unidades</label><input type="number" min="0" data-r="u" value="${uds}"></div>
      <div><label>Nº de lote</label><input data-r="lote" placeholder="p. ej. L2609"></div></div>
    <div class="g2" style="margin:0"><div><label>Caducidad</label><input type="date" data-r="cad"></div>
      <div><label>Fabricación</label><input type="date" data-r="fab"></div></div>
    <div><label>Almacén</label><select data-r="alm">${ALMACENES.filter(a => a.activo).map(a => `<option value="${a.id}" ${a.id === almId ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select></div></div>`;
}

/* ---------------- proveedores ---------------- */

async function pintarProveedores() {
  cargando($('vcuerpo'), 'Cargando proveedores…');
  await cargarProveedores();
  $('vcuerpo').innerHTML = `<div class="panel">${PROVEEDORES.length ? `<div class="dgrid-wrap"><div class="dgrid provs">
    <div class="dh"><span>Proveedor</span><span>NIF</span><span>Contacto</span><span class="num">Plazo</span><span class="num">Compras</span><span>Última compra</span><span>Estado</span></div>
    ${PROVEEDORES.map(p => `<button class="dr" data-prov="${p.id}" style="${p.activo ? '' : 'opacity:.55'}">
      <span><b>${esc(p.nombre)}</b><span class="sm">${esc([p.municipio, p.pais].filter(Boolean).join(' · '))}</span></span>
      <span>${esc(p.nif || '—')}</span><span class="sm">${esc([p.contacto, p.email, p.telefono].filter(Boolean).join(' · ') || '—')}</span>
      <span class="num">${num(p.plazo_dias || 0)} días</span><span class="num">${num(p.compras)}</span>
      <span>${p.ultima_compra ? fechaCorta(p.ultima_compra) : '—'}</span>
      <span><span class="pill ${p.activo ? 'p-est' : 'p-anu'}">${p.activo ? 'Activo' : 'Inactivo'}</span></span></button>`).join('')}
  </div></div>` : '<div class="vacio">Todavía no hay proveedores.</div>'}</div>`;
  $('vcuerpo').querySelectorAll('[data-prov]').forEach(b => b.onclick = () => editorProveedor(PROVEEDORES.find(p => p.id === b.dataset.prov)));
}

function editorProveedor(p) {
  p = p || { activo: true, plazo_dias: 90, pais: 'España' };
  const ro = puedeCompras() ? '' : 'disabled';
  const f = (k, t, extra) => `<div><label for="pv_${k}">${t}</label><input id="pv_${k}" value="${esc(p[k] != null ? p[k] : '')}" ${extra || ''} ${ro}></div>`;
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${p.id ? esc(p.nombre) : 'Nuevo proveedor'}</h2><div class="sm">Datos para pedidos de compra, lotes y contabilidad</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">${f('nombre', 'Nombre o razón social')}${f('nif', 'NIF / CIF')}</div>
    <div class="g2">${f('contacto', 'Persona de contacto')}${f('email', 'Email', 'type="email"')}</div>
    <div class="g2">${f('telefono', 'Teléfono')}${f('direccion', 'Dirección')}</div>
    <div class="g2">${f('cp', 'Código postal')}${f('municipio', 'Población')}</div>
    <div class="g2">${f('provincia', 'Provincia')}${f('pais', 'País')}</div>
    <div class="g2">${f('plazo_dias', 'Plazo de entrega habitual (días)', 'type="number" min="0"')}${f('forma_pago', 'Forma de pago')}</div>
    <div class="g2">${f('condiciones', 'Condiciones (pedido mínimo, portes…)')}${f('cuenta_contable', 'Cuenta contable', 'placeholder="400xxxxx"')}</div>
    <label for="pv_nota">Nota</label><input id="pv_nota" value="${esc(p.nota || '')}" ${ro}>
    ${p.id ? `<label class="opt" style="margin-top:10px"><input type="checkbox" id="pv_activo" ${p.activo ? 'checked' : ''} ${ro}> Activo</label>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cerrar</button>${puedeCompras() ? `<button class="btn" id="pvok">${p.id ? 'Guardar' : 'Crear proveedor'}</button>` : ''}</div>`;
  $('dlg').showModal();
  if (!$('pvok')) return;
  $('pvok').onclick = async () => {
    const v = { id: p.id || null };
    ['nombre', 'nif', 'contacto', 'email', 'telefono', 'direccion', 'cp', 'municipio', 'provincia', 'pais', 'plazo_dias', 'forma_pago', 'condiciones', 'cuenta_contable', 'nota']
      .forEach(k => v[k] = $('pv_' + k).value.trim());
    if ($('pv_activo')) v.activo = $('pv_activo').checked;
    if (!v.nombre) { toast('Escribe el nombre', true); return; }
    const { data: r, error } = await db.rpc('guardar_proveedor', { p: v });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    $('dlg').close(); toast(p.id ? 'Proveedor guardado' : 'Proveedor creado'); await cargarProveedores();
    if (TAB === 'ventas' && PEDSEC === 'proveedores') pintarProveedores();
  };
}

/* ---------------- Productos: pestaña «Stock y lotes» ---------------- */

cargarProductosModulo = (orig => async function () {
  await orig();
  const sn = $('v-productos').querySelector('.subnav');
  if (sn && !sn.querySelector('[data-ps="stock"]')) {
    sn.insertAdjacentHTML('beforeend', `<button data-ps="stock" aria-pressed="${PSEC === 'stock'}">Stock y lotes</button>`);
    sn.querySelector('[data-ps="stock"]').onclick = () => { PSEC = 'stock'; cargarProductosModulo(); };
  }
  if (PSEC === 'stock') {
    const acts = $('v-productos').querySelector('.saludo .acts');
    acts.innerHTML = puedeCompras() ? '<button class="btn sec" id="stalm">Almacenes</button><button class="btn sec" id="stmue">⚙ Muestras</button><button class="btn" id="stini">+ Entrada de stock</button>' : '';
    if ($('stalm')) $('stalm').onclick = editorAlmacenes;
    if ($('stmue')) $('stmue').onclick = editorMuestras;
    if ($('stini')) $('stini').onclick = () => movimientoStock(null, 'inicial');
    pintarStock();
  }
})(cargarProductosModulo);

const estadoStock = s => {
  if (s.stock <= 0) return ['Sin stock', 'p-anu'];
  if (s.stock_minimo != null && s.stock < s.stock_minimo) return ['Bajo mínimo', 'p-bor'];
  if (s.dias_cobertura != null && s.dias_cobertura <= s.plazo_dias + 14 && !s.en_camino) return ['Pedir ya', 'p-bor'];
  return ['Correcto', 'p-est'];
};
const cadClase = f => !f ? '' : f < hoyISO() ? 'cad-pasada' : f <= isoMas(hoyISO(), 90) ? 'cad-pronto' : '';

async function pintarStock() {
  cargando($('vcuerpo'), 'Calculando el stock…');
  await cargarAlmacenes();
  const { data, error } = await RPC_ORIG('stock_resumen', {});
  if (error) { $('vcuerpo').innerHTML = `<div class="vacio">${esc(error.message)}</div>`; return; }
  const l = (data || []).filter(s => s.activo || s.stock);
  $('vcuerpo').innerHTML = `<div class="panel">
    <div class="cuenta">Stock calculado con todas las entradas y salidas: compras, pedidos confirmados, muestras, ajustes y traspasos. Las ventas salen primero del lote que caduca antes.</div>
    <div class="dgrid-wrap"><div class="dgrid stock">
      <div class="dh"><span>Producto</span><span class="num">Stock</span><span>Por almacén</span><span>Próxima caducidad</span><span>Cobertura</span><span class="num">En camino</span><span>Estado</span></div>
      ${l.map(s => { const [et, ec] = estadoStock(s); return `<button class="dr" data-stk="${s.id}">
        <span><b>${esc(s.nombre)}</b><span class="sm">${esc(s.presentacion || '')}${s.sin_lote ? ` · <span style="color:var(--warn)">${num(-s.sin_lote)} uds vendidas sin lote</span>` : ''}</span></span>
        <span class="num"><b>${num(s.stock)}</b></span>
        <span class="sm">${(s.por_almacen || []).map(a => `${esc(a.almacen)}: ${num(a.unidades)}`).join(' · ') || '—'}</span>
        <span class="${cadClase(s.proxima_caducidad)}">${s.proxima_caducidad ? fechaCorta(s.proxima_caducidad) : '—'}</span>
        <span class="sm">${s.dias_cobertura != null ? `${num(s.dias_cobertura)} días · proveedor ${num(s.plazo_dias)}` : 'Sin ventas en 90 días'}</span>
        <span class="num">${s.en_camino ? num(s.en_camino) + (s.llegada ? `<span class="sm">${fechaCorta(s.llegada)}</span>` : '') : '—'}</span>
        <span><span class="pill ${ec}">${et}</span></span></button>`; }).join('') || '<div class="vacio">Sin productos.</div>'}
    </div></div></div>`;
  $('vcuerpo').querySelectorAll('[data-stk]').forEach(b => b.onclick = () => fichaStock(l.find(s => s.id === b.dataset.stk)));
}

async function fichaStock(s) {
  await cargarProveedores();
  const [et, ec] = estadoStock(s);
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${esc(s.nombre)} <span class="pill ${ec}">${et}</span></h2>
      <div class="sm">${num(s.stock)} unidades · ${+s.consumo_diario ? 'consumo medio ' + String(s.consumo_diario).replace('.', ',') + ' al día' : 'sin consumo en los últimos meses'}${s.dias_cobertura != null ? ` · cubre ${num(s.dias_cobertura)} días` : ''}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    ${puedeCompras() ? `<div class="g2">
      <div><label for="stmin">Stock mínimo (aviso)</label><input id="stmin" type="number" min="0" value="${s.stock_minimo != null ? s.stock_minimo : ''}" placeholder="Sin mínimo"></div>
      <div><label for="stprov">Proveedor habitual</label><select id="stprov"><option value="">—</option>${PROVEEDORES.map(p => `<option value="${p.id}" ${p.nombre === s.proveedor ? 'selected' : ''}>${esc(p.nombre)} · ${num(p.plazo_dias)} días</option>`).join('')}</select></div></div>` : ''}
    <div class="blk"><h3>Lotes</h3>
      ${(s.lotes || []).length ? `<div class="lista">${s.lotes.map(lo => `<div class="item" style="cursor:default">
        <span class="ic ${cadClase(lo.caducidad) === 'cad-pasada' ? 'w' : ''}">📦</span>
        <span class="tx"><b>Lote ${esc(lo.numero_lote)} · ${num(lo.unidades)} uds</b>
          <span class="sm"><span class="${cadClase(lo.caducidad)}">${lo.caducidad ? 'Caduca el ' + fechaCorta(lo.caducidad) : 'Sin caducidad'}</span>${lo.fecha_fabricacion ? ' · fabricado el ' + fechaCorta(lo.fecha_fabricacion) : ''} · ${esc(lo.almacen)}${lo.proveedor ? ' · ' + esc(lo.proveedor) : ''}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" data-traz="${lo.id}">Trazabilidad</button>
          ${puedeCompras() ? `<button class="btn sec" data-aju="${lo.id}|${lo.almacen_id}">Ajustar</button>${ALMACENES.filter(a => a.activo).length > 1 ? `<button class="btn sec" data-tras="${lo.id}|${lo.almacen_id}">Traspasar</button>` : ''}` : ''}</span></div>`).join('')}</div>`
        : '<div class="sm">Sin lotes con stock.</div>'}</div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cerrar</button>
      ${puedeCompras() ? '<button class="btn sec" id="stent">+ Entrada o lote</button><button class="btn" id="stgu">Guardar mínimo y proveedor</button>' : ''}</div>`;
  $('dlg').showModal();
  $('dbody').querySelectorAll('[data-traz]').forEach(b => b.onclick = () => trazabilidad(b.dataset.traz));
  $('dbody').querySelectorAll('[data-aju]').forEach(b => { const [lo, al] = b.dataset.aju.split('|'); b.onclick = () => movimientoStock(s, 'ajuste', lo, al); });
  $('dbody').querySelectorAll('[data-tras]').forEach(b => { const [lo, al] = b.dataset.tras.split('|'); b.onclick = () => movimientoStock(s, 'traspaso', lo, al); });
  if ($('stent')) $('stent').onclick = () => movimientoStock(s, 'inicial');
  if ($('stgu')) $('stgu').onclick = async () => {
    const { error } = await db.from('productos').update({ stock_minimo: $('stmin').value === '' ? null : +$('stmin').value, proveedor_id: $('stprov').value || null }).eq('id', s.id);
    if (error) { toast('No se ha podido guardar', true); return; }
    $('dlg').close(); toast('Guardado'); pintarStock();
  };
}

async function trazabilidad(loteId) {
  const { data } = await RPC_ORIG('trazabilidad_lote', { p_lote: loteId });
  const lo = (data && data.lote) || {}, m = (data && data.movimientos) || [];
  const tipos = { inicial: 'Stock inicial', entrada_compra: 'Entrada por compra', salida_venta: 'Venta', anulacion_venta: 'Anulación de venta',
    salida_muestra: `Muestra en ${TT('visita', 's', '', 'l', 'l')}`, ajuste: 'Ajuste de inventario', traspaso_salida: 'Traspaso (sale)', traspaso_entrada: 'Traspaso (entra)', devolucion: 'Devolución',
    consumo_deposito: 'Usado en un depósito', consumo_cirugia: 'Usado en una intervención' };
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>Trazabilidad · lote ${esc(lo.numero_lote || '')}</h2>
      <div class="sm">${esc(lo.producto || '')}${lo.caducidad ? ' · caduca el ' + fechaCorta(lo.caducidad) : ''}${lo.proveedor ? ' · ' + esc(lo.proveedor) : ''}${lo.compra ? ' · compra ' + esc(lo.compra) : ''}</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <p class="sm">Todas las entradas y salidas de este lote. Ante una alerta de un lote, aquí están los clientes a los que llegó.</p>
    <div class="dgrid-wrap"><div class="dgrid traz">
      <div class="dh"><span>Fecha</span><span>Movimiento</span><span class="num">Uds.</span><span>Cliente</span><span>${TT('medico', 's', '', 'l', 'C')}</span><span>Almacén</span></div>
      ${m.map(x => `<div class="dr" style="cursor:default"><span>${fechaCorta(String(x.fecha).slice(0, 10))}</span><span>${esc(tipos[x.tipo] || x.tipo)}${x.pedido ? `<span class="sm">Pedido ${esc(x.pedido)}</span>` : ''}</span>
        <span class="num" style="color:${x.unidades < 0 ? 'var(--danger)' : 'var(--ok)'}"><b>${x.unidades > 0 ? '+' : ''}${num(x.unidades)}</b></span>
        <span>${esc(x.cliente || '—')}${x.telefono ? `<span class="sm">${esc(x.telefono)}</span>` : ''}</span><span class="sm">${esc(x.medico || '—')}</span><span class="sm">${esc(x.almacen)}</span></div>`).join('')
        || '<div class="vacio">Sin movimientos.</div>'}</div></div>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar2>Cerrar</button></div>`;
  $('dlg2').showModal();
}

async function movimientoStock(s, tipo, loteId, almId) {
  await Promise.all([cargarProductos(), cargarAlmacenes(), cargarProveedores()]);
  const tit = tipo === 'inicial' ? 'Entrada de stock' : tipo === 'ajuste' ? 'Ajuste de inventario' : 'Traspaso entre almacenes';
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>${tit}</h2><div class="sm">${tipo === 'inicial' ? 'Stock inicial o una entrada sin pedido de compra, con su lote' : tipo === 'ajuste' ? 'Suma o resta unidades de este lote (recuento, rotura, caducado…)' : 'Mueve unidades de este lote a otro almacén, por ejemplo al maletín de un comercial'}</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    ${tipo === 'inicial' ? `<div class="g2">
      <div><label for="mvp">Producto</label><select id="mvp">${PRODUCTOS.map(p => `<option value="${p.id}" ${s && p.id === s.id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
      <div><label for="mva">Almacén</label><select id="mva">${ALMACENES.filter(a => a.activo).map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select></div></div>
      <div class="g2"><div><label for="mvl">Nº de lote</label><input id="mvl" placeholder="p. ej. L2609"></div>
        <div><label for="mvpr">Proveedor</label><select id="mvpr"><option value="">—</option>${PROVEEDORES.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></div></div>
      <div class="g2"><div><label for="mvc">Caducidad</label><input id="mvc" type="date"></div><div><label for="mvf">Fabricación</label><input id="mvf" type="date"></div></div>` : ''}
    ${tipo === 'traspaso' ? `<label for="mvd">Almacén de destino</label><select id="mvd">${ALMACENES.filter(a => a.activo && a.id !== almId).map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select>` : ''}
    <div class="g2"><div><label for="mvu">${tipo === 'ajuste' ? 'Unidades (+ suma, − resta)' : 'Unidades'}</label><input id="mvu" type="number" ${tipo === 'ajuste' ? '' : 'min="1"'}></div>
      <div><label for="mvn">Motivo o nota</label><input id="mvn" placeholder="${tipo === 'ajuste' ? 'Recuento, rotura, caducado…' : 'Opcional'}"></div></div>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar2>Cancelar</button><button class="btn" id="mvok">Registrar</button></div>`;
  $('dlg2').showModal();
  $('mvok').onclick = async () => {
    const n = +$('mvu').value;
    if (!n) { toast('Indica las unidades', true); return; }
    if (tipo === 'inicial' && !$('mvl').value.trim()) { toast('Indica el número de lote', true); return; }
    const p = tipo === 'inicial'
      ? { tipo, producto_id: $('mvp').value, almacen_id: $('mva').value, numero_lote: $('mvl').value.trim(), caducidad: $('mvc').value, fecha_fabricacion: $('mvf').value, proveedor_id: $('mvpr').value, unidades: n, nota: $('mvn').value.trim() }
      : { tipo, producto_id: s.id, lote_id: loteId, almacen_id: almId, destino_id: $('mvd') ? $('mvd').value : null, unidades: n, nota: $('mvn').value.trim() };
    const { data: r, error } = await db.rpc('movimiento_manual', { p });
    if (error || (r && r.ok === false)) { toast('No se ha podido: ' + ((error && error.message) || r.error), true); return; }
    $('dlg2').close(); $('dlg').close(); toast('Movimiento registrado'); if (TAB === 'productos') pintarStock();
  };
}

async function editorAlmacenes() {
  await cargarAlmacenes(); if (!COMS.length) await cargarComerciales();
  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Almacenes</h2><div class="sm">El central y, si quieres, un «maletín» por comercial para sus muestras</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="lista">${ALMACENES.map(a => `<div class="item" style="cursor:default"><span class="ic">${a.tipo === 'central' ? '🏢' : a.tipo === 'deposito' ? '🏢' : '💼'}</span>
        <span class="tx"><b>${esc(a.nombre)}</b><span class="sm">${a.tipo === 'central' ? 'Almacén central' : a.tipo === 'deposito' ? 'Depósito en un centro' : 'Maletín de ' + esc(a.usuario || '—')} · ${num(a.unidades)} uds${a.activo ? '' : ' · inactivo'}</span></span></div>`).join('')}</div>
      <h3 style="margin-top:14px">Nuevo maletín de comercial</h3>
      <div class="g2"><div><label for="almu">Comercial</label><select id="almu">${COMS.map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select></div>
        <div><label>&nbsp;</label><button class="btn" id="almok">Crear maletín</button></div></div>
      <p class="sm">Pasa unidades del central a un maletín con «Traspasar» en la ficha del producto. Si las muestras restan stock, salen del maletín de quien registra ${TT('visita', 's', 'el', 'l', 'l')}.</p>`;
    $('almok').onclick = async () => {
      const u = COMS.find(x => x.id === $('almu').value);
      const { error } = await db.rpc('guardar_almacen', { p: { nombre: 'Maletín ' + String(u.nombre).split(' ')[0], tipo: 'maletin', usuario_id: u.id } });
      if (error) { toast('No se ha podido crear', true); return; }
      toast('Maletín creado'); await cargarAlmacenes(); pinta();
    };
  };
  pinta(); $('dlg').showModal();
}

async function editorMuestras() {
  await Promise.all([cargarAjustes(), cargarProductos()]);
  const m = Object.assign({ producto_id: null, restar_stock: false }, AJUSTES.muestras || {});
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Muestras y stock</h2><div class="sm">Qué pasa con el stock cuando se registran muestras en ${TT('visita', 's', 'un', 'l', 'l')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="murest" ${m.restar_stock ? 'checked' : ''}>
      <span><b>Restar las muestras del stock</b><br><span class="sm">Salen del maletín de quien registra ${TT('visita', 's', 'el', 'l', 'l')} o, si no tiene, del almacén central, por lote y caducidad.</span></span></label>
    <label for="muprod">Producto de las muestras</label><select id="muprod"><option value="">—</option>${PRODUCTOS.map(p => `<option value="${p.id}" ${p.id === m.producto_id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="muok">Guardar</button></div>`;
  $('dlg').showModal();
  $('muok').onclick = async () => {
    if ($('murest').checked && !$('muprod').value) { toast('Elige el producto de las muestras', true); return; }
    const { error } = await db.rpc('guardar_ajuste', { p_clave: 'muestras', p_valor: { producto_id: $('muprod').value || null, restar_stock: $('murest').checked } });
    if (error) { toast('No se ha podido guardar', true); return; }
    $('dlg').close(); toast('Guardado');
  };
}

/* ---------------- nombre del módulo en el menú y ayudas ---------------- */

document.querySelectorAll('[data-t="ventas"]').forEach(b => { if (b.closest('nav.main')) b.textContent = 'Pedidos'; });
Object.assign(AYUDA, {
  ventas: ['Pedidos', 'Ventas, compras y proveedores.', [
    '<b>Ventas</b>: pedidos de clientes. En borrador no cuentan; al confirmarlos cuentan en métricas y comisiones y <b>salen del stock</b>, primero del lote que caduca antes.',
    '<b>Compras</b>: pedidos a proveedores. Borrador → Enviado → En tránsito → Recibido. Al recibir se anota cada lote con su caducidad y entra en el stock.',
    '<b>Proveedores</b>: datos, plazo de entrega y cuenta contable. El plazo se usa para avisar de cuándo hay que pedir.',
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y a su comercial; la venta a centro, a la ficha del centro si la tiene.`]]
});
AYUDA.productos[2].push('<b>Stock y lotes</b>: stock por almacén y lote, caducidades, cobertura según el ritmo de venta, trazabilidad de cada lote (a qué clientes llegó), entradas, ajustes y traspasos a los maletines.');
MANUAL.forEach(s => { if (s.id === 'ventas') { s.t = 'Pedidos, Clientes y Productos'; s.para = 'Pedidos de venta y de compra, proveedores, clientes, productos, servicios y stock por lotes.'; s.hacer.push([3, 'Crear pedidos de compra, recibir mercancía por lotes, ajustar stock y gestionar proveedores y almacenes']); } });


