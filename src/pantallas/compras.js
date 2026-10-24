// pantallas/compras.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarProveedores() { const { data } = await db.rpc('proveedores_lista'); PROVEEDORES = data || []; }

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
