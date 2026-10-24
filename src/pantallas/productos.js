// pantallas/productos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function editorProductos() {
  await cargarProductos();
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Productos</h2><div class="sm">Catálogo usado en pedidos, muestras y analítica</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="lista">${PRODUCTOS.map(p => `<div class="item" style="cursor:default">
      <span class="ic" style="${p.foto_url ? `background:url('${esc(p.foto_url)}') center/cover` : ''}">${p.foto_url ? '' : '◧'}</span><span class="tx"><b>${esc(p.nombre)}</b>
        <span class="sm">${esc(p.presentacion || '')}${p.precio ? ' · ' + eur(p.precio) + ' + ' + (p.iva || 0) + '% IVA' : ''}${p.referencia ? ' · ref. ' + esc(p.referencia) : ''}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" data-pdel="${p.id}">Desactivar</button></span></div>`).join('')
      || '<div class="vacio">Todavía no hay productos.</div>'}</div>
    <div class="g2" style="margin-top:12px">
      <div><label for="prn">Nombre</label><input id="prn" placeholder="Nombre del producto"></div>
      <div><label for="prp">Presentación</label><input id="prp" placeholder="Caja de 60 cápsulas"></div>
    </div>
    <div class="g2">
      <div><label for="prpr">Precio sin IVA</label><input id="prpr" type="number" step="0.01" min="0" placeholder="41,82"></div>
      <div><label for="priva">IVA (%)</label><input id="priva" type="number" min="0" max="21" value="10"></div>
    </div>
    <div class="g2">
      <div><label for="prref">Referencia</label><input id="prref"></div>
      <div><label for="prcb">Código de barras</label><input id="prcb"></div>
    </div>
    <label for="prfoto">Foto del producto</label><input id="prfoto" type="file" accept="image/*">
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="pradd">Añadir producto</button></div>`;

  $('pradd').onclick = async ev => {
    if (!$('prn').value.trim()) { toast('Escribe el nombre', true); return; }
    ev.target.disabled = true;
    let foto_url = null;
    const f = $('prfoto').files && $('prfoto').files[0];
    if (f) {
      const ruta = 'p-' + Date.now() + '-' + f.name.replace(/[^a-zA-Z0-9.]/g, '');
      const { error: eu } = await db.storage.from('productos').upload(ruta, f, { upsert: true });
      if (!eu) foto_url = db.storage.from('productos').getPublicUrl(ruta).data.publicUrl;
      else toast('La foto no se ha podido subir: ' + eu.message, true);
    }
    const { data: r, error } = await db.rpc('guardar_producto', { p: { nombre: $('prn').value.trim(),
      presentacion: $('prp').value.trim(), precio: $('prpr').value, iva: +$('priva').value || 10,
      referencia: $('prref').value.trim(), codigo_barras: $('prcb').value.trim(),
      ...(foto_url ? { foto_url } : {}) } });
    ev.target.disabled = false;
    if (error || (r && r.ok === false)) { toast('No se ha podido crear', true); return; }
    toast('Producto añadido'); editorProductos();
  };
  $('dbody').querySelectorAll('[data-pdel]').forEach(b => b.onclick = async () => {
    await db.rpc('guardar_producto', { p: { id: b.dataset.pdel, activo: false } });
    toast('Producto desactivado'); editorProductos();
  });
  $('dlg').showModal();
}

async function pintarProductos() {
  const esAdmin = puede('administrar');
  cargando($('vcuerpo'), 'Cargando productos…');
  const { data } = await RPC_ORIG('productos_lista', { p_todos: esAdmin });
  // v2.88.0: filtros por campos (Clasificadores); la lista llega entera, así que se filtra aquí
  const l = (data || []).filter(p => (p.tipo || 'producto') === 'producto' && clasCumple(p.clasificadores, PRODF));
  const cpCols = clasVisibles('producto');
  $('vcuerpo').innerHTML = `<div class="panel">
    <div class="cuenta"><b>${num(l.filter(p => p.activo).length)}</b> ${l.filter(p => p.activo).length === 1 ? 'producto activo' : 'productos activos'}${l.some(p => !p.activo) ? ` · ${num(l.filter(p => !p.activo).length)} inactivos` : ''}</div>
    <div class="dgrid-wrap"><div class="dgrid prods">
      <div class="dh"><span></span><span>Producto</span><span>Referencia</span><span class="num">Sin IVA</span><span class="num">IVA</span><span class="num">Con IVA</span><span>Estado</span>${clasCabeceras(cpCols)}</div>
      ${l.map(p => `<button class="dr" data-prod="${p.id}" style="${p.activo ? '' : 'opacity:.55'}">
        <span><span class="pfoto" style="${p.foto_url ? `background-image:url('${esc(p.foto_url)}')` : ''}">${p.foto_url ? '' : '◧'}</span></span>
        <span><b>${esc(p.nombre)}</b><span class="sm">${esc(p.presentacion || 'Sin presentación')}</span></span>
        <span class="sm">${esc(p.referencia || '—')}</span><span class="num">${p.precio != null ? eurI(p.precio) : '—'}</span>
        <span class="num">${num(p.iva || 0)}%</span><span class="num"><b>${p.pvp != null ? eurI(p.pvp) : '—'}</b></span>
        <span><span class="pill ${p.activo ? 'p-est' : 'p-anu'}">${p.activo ? 'Activo' : 'Inactivo'}</span></span>${clasCeldas(cpCols, p.clasificadores)}</button>`).join('')
        || `<div class="vacio">${Object.keys(PRODF).length ? 'Ningún producto con estos filtros.' : 'Todavía no hay productos.'}</div>`}
    </div></div></div>`;
  clasRejilla($('vcuerpo').querySelector('.dgrid.prods'), cpCols.length);
  $('vcuerpo').querySelectorAll('[data-prod]').forEach(b => b.onclick = () => editorProducto(l.find(p => p.id === b.dataset.prod)));
}

async function cargarAlmacenes() { const { data } = await db.rpc('almacenes_lista'); ALMACENES = data || []; }

function loteRecepcion(l, uds, almId) {
  return `<div class="g2 rcl">
    <div class="g2" style="margin:0"><div><label>Unidades</label><input type="number" min="0" data-r="u" value="${uds}"></div>
      <div><label>Nº de lote</label><input data-r="lote" placeholder="p. ej. L2609"></div></div>
    <div class="g2" style="margin:0"><div><label>Caducidad</label><input type="date" data-r="cad"></div>
      <div><label>Fabricación</label><input type="date" data-r="fab"></div></div>
    <div><label>Almacén</label><select data-r="alm">${ALMACENES.filter(a => a.activo).map(a => `<option value="${a.id}" ${a.id === almId ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select></div></div>`;
}

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

async function pintarAlmacenes2() {
  await cargarAlmacenes(); if (!COMS.length) await cargarComerciales();
  const { data: st } = await RPC_ORIG('stock_resumen', {});
  const sinMaletin = COMS.filter(u => rolPuede(u.rol, 'almacen_propio') && !ALMACENES.some(a => a.usuario_id === u.id));
  $('cfgcuerpo').innerHTML = `
    <div class="card cfgpanel"><h2>Almacenes</h2>
      <p class="sm">Dónde está físicamente tu stock. Cada unidad está en un almacén y en un lote, así sabes qué hay, dónde y cuándo caduca.</p>
      <div class="mattipos"><div><b>🏢 Almacén central</b><span>Donde entra la mercancía al recibir las compras y de donde salen los pedidos.</span></div>
        <div><b>💼 Maletín de comercial</b><span>Las muestras que lleva cada comercial. Se reponen traspasando desde el central y se descuentan al registrar ${TT('visita', 'p', '', 'l', 'l')}.</span></div></div></div>
    <div class="card cfgpanel"><h2>Tus almacenes</h2>
      <div class="almgrid">${ALMACENES.map(a => `<div class="almc"><span class="ic">${a.tipo === 'central' ? '🏢' : a.tipo === 'deposito' ? '🏢' : '💼'}</span>
        <b>${esc(a.nombre)}</b><span class="sm">${a.tipo === 'central' ? 'Almacén central' : a.tipo === 'deposito' ? 'Depósito en un centro' : 'Maletín de ' + esc(a.usuario || '—')}${a.activo ? '' : ' · inactivo'}</span>
        <span class="almu"><b>${num(a.unidades || 0)}</b> unidades</span></div>`).join('')}</div>
      ${sinMaletin.length ? `<div class="avisoh" style="margin-top:12px"><span>${sinMaletin.length === 1 ? esc(sinMaletin[0].nombre) + ' no tiene' : sinMaletin.length + ' comerciales no tienen'} maletín: sus muestras saldrán del almacén central.</span></div>` : ''}
      <div class="matadd" style="margin-top:12px"><select id="almu">${COMS.filter(u => rolPuede(u.rol, 'almacen_propio')).map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select>
        <button class="btn sec" id="almok">Crear maletín</button></div>
      <p class="sm">Para pasar unidades del central a un maletín: Productos → Stock → abre el producto → «Traspasar».${Array.isArray(st) && st.length ? '' : ''}</p></div>`;
  $('almok').onclick = async () => {
    const u = COMS.find(x => x.id === $('almu').value); if (!u) return;
    const { error } = await db.rpc('guardar_almacen', { p: { nombre: 'Maletín ' + String(u.nombre).split(' ')[0], tipo: 'maletin', usuario_id: u.id } });
    if (error) { toast('No se ha podido crear', true); return; } toast('Maletín creado'); pintarAlmacenes2();
  };
}

async function impLotes(filas, modo, simular, imp, avance) {
  const res = { creados: 0, actualizados: 0, omitidos: 0, errores: [], filas: [] };
  for (let i = 0; i < filas.length; i += 200) {
    const { data, error } = await RPC_ORIG('importar_lote', { p_imp: imp || null, p_entidad: IMP.entidad, p_filas: filas.slice(i, i + 200), p_modo: modo, p_simular: simular });
    if (error || !data || !data.ok) throw new Error(error ? error.message : (data && data.error) || 'sin respuesta');
    res.creados += data.creados; res.actualizados += data.actualizados; res.omitidos += data.omitidos;
    res.errores.push(...data.errores); res.filas.push(...data.filas);
    if (avance) avance(Math.min(filas.length, i + 200), filas.length);
  }
  return res;
}

// Ficha de un centro: qué productos puede pedir y a qué precio (sin IVA; vacío = tarifa)
async function fichaProductosCentro(id) {
  if (ES_MEDICO() || !hayExtra('portal') || FICHA_ID !== id || !$('fbody') || $('fprodc')) return;
  const rf = await rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id);
  const m = (rf && rf.data && rf.data.medico) || {};
  if (m.tipo !== 'Centro' || FICHA_ID !== id || $('fprodc')) return;
  if (!PRODUCTOS.length) await cargarProductos();
  const { data: act } = await db.from('productos_cuenta').select('producto_id,precio').eq('cuenta_id', id);
  if (FICHA_ID !== id || $('fprodc')) return;
  const sel = {}; (act || []).forEach(x => sel[x.producto_id] = x);
  const lista = PRODUCTOS.filter(p => p.tipo !== 'servicio' && (p.estado || 'Activo') === 'Activo');
  const html = `<section class="blk" id="fprodc"><h3>Productos del centro <span class="n">${num((act || []).length)}</span></h3>
    <p class="sm">Lo que puede pedir desde su portal. Precio sin IVA; si lo dejas vacío, el de tarifa.</p>
    <div class="lista">${lista.map(p => `<label class="item" style="cursor:default"><input type="checkbox" data-fpcp="${p.id}" ${sel[p.id] ? 'checked' : ''}>
        <span class="tx"><b>${esc(p.nombre)}</b><span class="sm">Tarifa ${p.precio != null ? eurI(p.precio) : '—'} sin IVA</span></span>
        <input type="number" min="0" step="0.01" data-fpcx="${p.id}" value="${sel[p.id] && sel[p.id].precio != null ? +sel[p.id].precio : ''}" placeholder="Tarifa" style="max-width:120px" aria-label="Precio de ${esc(p.nombre)} para el centro"></label>`).join('')
      || '<div class="sm">No hay productos activos.</div>'}</div>
    <div class="acts" style="margin:8px 0 0;justify-content:flex-end"><button type="button" class="btn sec" id="fpcok">Guardar productos</button></div></section>`;
  const tras = $('fportal') || $('fbody').querySelector('section.fvis');
  if (tras) tras.insertAdjacentHTML('afterend', html); else $('fbody').insertAdjacentHTML('beforeend', html);
  $('fpcok').onclick = async ev => {
    const items = [...$('fprodc').querySelectorAll('[data-fpcp]')].filter(x => x.checked).map(x => {
      const v = $('fprodc').querySelector(`[data-fpcx="${x.dataset.fpcp}"]`).value;
      return { producto_id: x.dataset.fpcp, precio: v === '' ? null : Math.max(0, +v) };
    });
    ev.target.disabled = true;
    const { data: r } = await db.rpc('guardar_productos_cuenta', { p_cuenta: id, p_items: items });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(motivoPortal(r), true); return; }
    toast(`Productos del centro guardados (${num(r.productos)})`);
    const b = $('fprodc'); if (b) b.remove(); fichaProductosCentro(id);
  };
}

async function verDeposito(cuenta, nombre, aviso) {
  const { data: e, error } = await db.rpc('deposito_estado', { p_cuenta: cuenta });
  if (error || !e || e.ok === false) { toast(e && e.error === 'permiso' ? 'No puedes ver el depósito de este centro' : 'No se ha podido abrir el depósito', true); return; }
  DEP = { cuenta, nombre, estado: e };
  if (!PRODUCTOS.length) await cargarProductos();
  const l = (e.lineas || []).filter(x => x.unidades > 0), tot = l.reduce((s, x) => s + x.unidades, 0);
  const tipoMov = { traspaso_entrada: 'Repuesto', traspaso_salida: 'Sale', consumo_deposito: 'Usado', ajuste: 'Ajuste' };
  $('dbody').innerHTML = `<div class="fh"><div><h2>Depósito · ${esc(nombre)}</h2><div class="sm">${tot ? `${num(tot)} unidades de ${(z => z === 1 ? '1 producto' : z + ' productos')(new Set(l.map(x => x.producto_id)).size)}` : 'Sin material ahora mismo'} · sigue siendo vuestro hasta que se usa</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    ${aviso || ''}
    <div class="depacts"><button type="button" class="btn" data-dep="reponer">Reponer</button><button type="button" class="btn sec" data-dep="consumo" ${l.length ? '' : 'disabled'}>Apuntar uso</button>
      <button type="button" class="btn sec" data-dep="recuento" ${l.length ? '' : 'disabled'}>Recuento</button></div>
    <div id="depform"></div>
    ${l.length ? `<div class="deptab"><div class="deph"><span>Producto</span><span>Lote</span><span>Caduca</span><span>Uds</span></div>${l.map(x => `<div class="depf"><span>${esc(x.nombre)}</span>
      <span>${esc(x.numero_lote || 'Sin lote')}</span><span class="${depCaducaPronto(x.caducidad) ? 'depcad' : ''}">${x.caducidad ? fechaCorta(x.caducidad) : '—'}</span><b>${num(x.unidades)}</b></div>`).join('')}</div>`
      : '<div class="vacio vlinea">El depósito está vacío: repón para dejar material.</div>'}
    ${(e.usado_90 || []).length ? `<p class="sm">Usado en los últimos 90 días: ${e.usado_90.map(x => `${esc(x.nombre)} ${num(x.unidades)}`).join(' · ')}</p>` : ''}
    ${(e.movimientos || []).length ? `<details class="depmov"><summary>Últimos movimientos</summary>${e.movimientos.map(m => `<div class="depmf"><span>${fechaCorta(String(m.fecha).slice(0, 10))}</span>
      <span>${tipoMov[m.tipo] || esc(m.tipo)}</span><span>${esc(m.nombre)}${m.numero_lote ? ' · ' + esc(m.numero_lote) : ''}</span><b>${m.unidades > 0 ? '+' : ''}${num(m.unidades)}</b>
      <span class="sm">${esc(String(m.nota || '').replace(/\s*\[[^\]]*\]$/, ''))}</span></div>`).join('')}</details>` : ''}
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" data-cerrar>Cerrar</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  $('dbody').querySelectorAll('[data-dep]').forEach(b => b.onclick = () => formDeposito(b.dataset.dep));
}

function formDeposito(acc) {
  const f = $('depform'), l = (DEP.estado.lineas || []).filter(x => x.unidades > 0);
  const prods = PRODUCTOS.filter(p => p.activo !== false && (p.estado || 'Activo') !== 'Descatalogado');
  if (acc === 'reponer') {
    f.innerHTML = `<div class="depbox"><b>Reponer el depósito</b>
      <div class="segs" id="depori" role="group" aria-label="De dónde sale"><button type="button" data-o="maletin" class="on" aria-pressed="true">De mi maletín</button><button type="button" data-o="central" aria-pressed="false">Del almacén central</button></div>
      <div class="depitems">${prods.map(p => `<label><span>${esc(p.nombre)}</span><input type="number" min="0" step="1" data-dprod="${p.id}" placeholder="0" aria-label="Unidades de ${esc(p.nombre)}"></label>`).join('')}</div>
      <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="depcanc">Cancelar</button><button type="button" class="btn" id="depok">Reponer</button></div></div>`;
    f.querySelectorAll('[data-o]').forEach(b => b.onclick = () => f.querySelectorAll('[data-o]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }));
  } else if (acc === 'consumo') {
    f.innerHTML = `<div class="depbox"><b>Apuntar lo usado</b>
      <div class="depitems">${l.map((x, i) => `<label><span>${esc(x.nombre)} <span class="sm">· ${esc(x.numero_lote || 'sin lote')} · quedan ${num(x.unidades)}</span></span>
        <input type="number" min="0" max="${x.unidades}" step="1" data-dlin="${i}" placeholder="0" aria-label="Usadas de ${esc(x.nombre)}"></label>`).join('')}</div>
      <label for="depref">Referencia</label><input id="depref" maxlength="120" placeholder="p. ej. Intervención del martes, sala 2 (sin datos del paciente)">
      <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="depcanc">Cancelar</button><button type="button" class="btn" id="depok">Apuntar</button></div></div>`;
  } else {
    f.innerHTML = `<div class="depbox"><b>Recuento</b><span class="sm">Escribe lo que hay ahora; lo que falte se apunta como usado.</span>
      <div class="depitems">${l.map((x, i) => `<label><span>${esc(x.nombre)} <span class="sm">· ${esc(x.numero_lote || 'sin lote')} · había ${num(x.unidades)}</span></span>
        <input type="number" min="0" step="1" data-dcnt="${i}" value="${x.unidades}" aria-label="Contadas de ${esc(x.nombre)}"></label>`).join('')}</div>
      <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="depcanc">Cancelar</button><button type="button" class="btn" id="depok">Guardar recuento</button></div></div>`;
  }
  $('depcanc').onclick = () => { f.innerHTML = ''; };
  $('depok').onclick = async ev => {
    const op = 'd' + Date.now();
    let p;
    if (acc === 'reponer') {
      const items = [...f.querySelectorAll('[data-dprod]')].map(i => ({ producto_id: i.dataset.dprod, unidades: Math.max(0, Math.floor(+i.value || 0)) })).filter(x => x.unidades > 0);
      if (!items.length) { toast('Escribe cuántas unidades repones', true); return; }
      p = { cuenta_id: DEP.cuenta, accion: 'reponer', origen: f.querySelector('#depori .on').dataset.o, items, op_id: op };
    } else if (acc === 'consumo') {
      const items = [...f.querySelectorAll('[data-dlin]')].map(i => { const x = l[+i.dataset.dlin]; return { producto_id: x.producto_id, lote_id: x.lote_id, unidades: Math.max(0, Math.floor(+i.value || 0)), max: x.unidades }; }).filter(x => x.unidades > 0);
      if (!items.length) { toast('Escribe lo que se ha usado', true); return; }
      if (items.some(x => x.unidades > x.max)) { toast('No se puede usar más de lo que hay en el depósito', true); return; }
      p = { cuenta_id: DEP.cuenta, accion: 'consumo', items, referencia: $('depref').value.trim(), op_id: op };
    } else {
      const items = [...f.querySelectorAll('[data-dcnt]')].map(i => { const x = l[+i.dataset.dcnt]; return { producto_id: x.producto_id, lote_id: x.lote_id, contadas: Math.max(0, Math.floor(+i.value || 0)) }; });
      p = { cuenta_id: DEP.cuenta, accion: 'recuento', items, op_id: op };
    }
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('deposito_mover', { p });
    ev.target.disabled = false;
    if (error || !r || r.ok === false) { toast(r && r.error === 'sin_origen' ? 'No hay almacén del que sacar el material' : r && r.error === 'permiso' ? 'No puedes mover el depósito de este centro' : 'No se ha podido guardar', true); return; }
    const usado = r.usado || [];
    let aviso = '';
    if (acc === 'reponer') toast('Depósito repuesto');
    else if (!usado.length) toast('Recuento guardado: no falta nada');
    else {
      toast('Apuntado lo usado');
      aviso = `<div class="banda-ok depaviso">Usado: ${usado.map(x => `${esc(x.nombre)} ${num(x.unidades)}`).join(' · ')}. Queda un pedido en borrador del centro para confirmarlo.
        <span class="depav"><button type="button" class="btn sec" id="depverped">Ver el pedido</button><button type="button" class="btn" id="depreponer">Reponer lo usado</button></span></div>`;
    }
    await verDeposito(DEP.cuenta, DEP.nombre, aviso);
    if ($('depverped') && r.pedido_id) $('depverped').onclick = () => verPedido(r.pedido_id);
    if ($('depreponer')) $('depreponer').onclick = async b => {
      b.target.disabled = true;
      const { data: r2 } = await db.rpc('deposito_mover', { p: { cuenta_id: DEP.cuenta, accion: 'reponer', items: usado.map(x => ({ producto_id: x.producto_id, unidades: x.unidades })), op_id: 'r' + Date.now() } });
      if (!r2 || r2.ok === false) { b.target.disabled = false; toast(r2 && r2.error === 'sin_origen' ? 'No hay almacén del que sacar el material' : 'No se ha podido reponer', true); return; }
      toast('Repuesto lo usado'); verDeposito(DEP.cuenta, DEP.nombre);
    };
  };
}

async function refrescarProductos() {
  try { invalidarCache(); } catch (e) {}
  await cargarProductos();
  if (TAB === 'productos' && typeof cargarProductosModulo === 'function') cargarProductosModulo();
}
