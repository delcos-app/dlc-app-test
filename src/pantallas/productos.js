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


// Ficha de un centro: qué productos puede pedir y a qué precio (sin IVA; vacío = tarifa)

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

async function pintarServicios() {
  const esAdmin = puede('administrar');
  cargando($('vcuerpo'), 'Cargando servicios…');
  const { data } = await RPC_ORIG('productos_lista', { p_todos: esAdmin });
  const l = (data || []).filter(p => p.tipo === 'servicio');
  $('vcuerpo').innerHTML = `<div class="panel">
    <div class="cuenta"><b>${num(l.filter(p => p.activo).length)}</b> servicios activos · Un pedido puede llevar un servicio (envío, portes urgentes…), que se suma con su propio IVA.</div>
    <div class="dgrid-wrap"><div class="dgrid servs">
      <div class="dh"><span>Servicio</span><span class="num">Sin IVA</span><span class="num">IVA</span><span class="num">Con IVA</span><span>En pedidos nuevos</span><span>Estado</span></div>
      ${l.map(p => `<button class="dr" data-serv="${p.id}" style="${p.activo ? '' : 'opacity:.55'}">
        <span><b>${esc(p.nombre)}</b></span><span class="num">${p.precio != null ? eurI(p.precio) : '—'}</span>
        <span class="num">${num(p.iva || 0)}%</span><span class="num"><b>${p.pvp != null ? eurI(p.pvp) : '—'}</b></span>
        <span>${p.por_defecto ? '<span class="pill p-est">Se propone por defecto</span>' : '<span class="vac">—</span>'}</span>
        <span><span class="pill ${p.activo ? 'p-est' : 'p-anu'}">${p.activo ? 'Activo' : 'Inactivo'}</span></span></button>`).join('') || '<div class="vacio">Todavía no hay servicios.</div>'}
    </div></div></div>`;
  $('vcuerpo').querySelectorAll('[data-serv]').forEach(b => b.onclick = () => editorServicio(l.find(p => p.id === b.dataset.serv)));
}

function editorServicio(s) {
  const esAdmin = puede('administrar');
  s = s || { iva: 21, activo: true };
  const ro = esAdmin ? '' : 'disabled';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${s.id ? esc(s.nombre) : 'Nuevo servicio'}</h2>
      <div class="sm">Escribe el precio sin IVA o con IVA: el otro se calcula solo. En cada pedido se puede cambiar.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="svn">Nombre</label><input id="svn" value="${esc(s.nombre || '')}" placeholder="p. ej. Envío, Envío urgente" ${ro}>
    <div class="pvp">
      <div><label for="svs">Sin IVA (€)</label><input id="svs" type="number" step="0.01" min="0" value="${s.precio != null ? +(+s.precio).toFixed(4) : ''}" ${ro}></div>
      <div><label for="svi">IVA (%)</label><input id="svi" type="number" step="1" min="0" max="21" value="${s.iva != null ? s.iva : 21}" ${ro}></div>
      <div><label for="svc">Con IVA (€)</label><input id="svc" type="number" step="0.01" min="0" value="${s.precio != null ? r2(s.precio * (1 + (+s.iva || 0) / 100)) : ''}" ${ro}></div></div>
    <label class="opt" style="margin-top:12px"><input type="checkbox" id="svdef" ${s.por_defecto ? 'checked' : ''} ${ro}> Proponerlo por defecto en los pedidos nuevos</label>
    ${s.id ? `<label class="opt" style="margin-top:8px"><input type="checkbox" id="svact" ${s.activo ? 'checked' : ''} ${ro}> Activo</label>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>${esAdmin ? 'Cancelar' : 'Cerrar'}</button>
      ${esAdmin ? `<button class="btn" id="svok">${s.id ? 'Guardar' : 'Crear servicio'}</button>` : ''}</div>`;
  $('dlg').showModal();
  if (!esAdmin) return;
  const iva = () => (+$('svi').value || 0) / 100;
  $('svs').oninput = () => { $('svc').value = $('svs').value === '' ? '' : r2(+$('svs').value * (1 + iva())); };
  $('svc').oninput = () => { $('svs').value = $('svc').value === '' ? '' : +(+$('svc').value / (1 + iva())).toFixed(4); };
  $('svi').oninput = () => { if ($('svs').value !== '') $('svc').value = r2(+$('svs').value * (1 + iva())); };
  $('svok').onclick = async () => {
    if (!$('svn').value.trim()) { toast('Escribe el nombre', true); return; }
    const { data: r, error } = await db.rpc('guardar_producto', { p: { id: s.id || null, tipo: 'servicio', nombre: $('svn').value.trim(),
      precio: $('svs').value, iva: $('svi').value, por_defecto: $('svdef').checked, ...($('svact') ? { activo: $('svact').checked } : {}) } });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    $('dlg').close(); toast(s.id ? 'Servicio guardado' : 'Servicio creado');
    await cargarProductos(); if (TAB === 'productos') pintarServicios();
  };
}

let SERVICIOS = [];

let PSEC = 'productos';

let PRODF = {};   // v2.88.0: filtros por campos del producto (Clasificadores)

const estadoStock = s => {
  if (s.stock <= 0) return ['Sin stock', 'p-anu'];
  if (s.stock_minimo != null && s.stock < s.stock_minimo) return ['Bajo mínimo', 'p-bor'];
  if (s.dias_cobertura != null && s.dias_cobertura <= s.plazo_dias + 14 && !s.en_camino) return ['Pedir ya', 'p-bor'];
  return ['Correcto', 'p-est'];
};

const cadClase = f => !f ? '' : f < hoyISO() ? 'cad-pasada' : f <= isoMas(hoyISO(), 90) ? 'cad-pronto' : '';

let ESTADO_PROD = {};

const vendible = p => (p.estado || 'Activo') === 'Activo';

const pillMaterial = e => `<span class="pill ${e === 'Pendiente' ? 'p-warn' : e === 'Entregado' ? 'p-est' : 'p-anu'}">${esc(e)}</span>`;

/* v2.196.0 · Material en depósito en el cliente (segunda tanda del estudio por sectores, SQL 122). Decisiones de Eric: solo en fichas de tipo
   Centro; lo usado se sabe por recuento o apuntando cada uso; lo usado crea un pedido en borrador y se propone reponerlo.
   - Ficha de un centro: bloque «Material en depósito» (unidades y productos) con «Abrir el depósito» o «Dejar material en depósito».
   - Ventana del depósito: lo que hay por lote y caducidad (aviso si caduca en menos de 60 días), lo usado en 90 días y los últimos
     movimientos; «Reponer» (de tu maletín o del almacén central), «Apuntar uso» (con referencia, sin datos del paciente) y «Recuento».
     Lo usado deja un pedido en borrador del centro («Ver el pedido») y ofrece «Reponer lo usado». */
let DEP = null;   // { cuenta, nombre, estado }

const depCaducaPronto = f => f && f <= isoMas(hoyISO(), 60);

/* v2.198.0 · Cobertura por producto en el ciclo (segunda tanda, «Panel y ciclos», SQL 124). Decisiones de Eric: la cobertura mide los
   productos presentados en las visitas, y solo salen los que la administración marca como «Se promociona en las visitas».
   - Producto: casilla «Se promociona en las visitas».
   - Registrar visita: «Productos presentados» (los que se promocionan); el historial de la ficha dice qué se presentó.
   - Ciclo de visitas → «Por producto»: por cada producto, cuántos de A, B y C lo han oído este ciclo y a quiénes les falta (con «+ Cita»). */
let PROMO_PRODS = null;   // [{ id, nombre }] de los productos que se promocionan (última lista leída)


async function cargarProductosBase() {
  const { data } = await db.rpc('productos_lista');
  const l = data || [];
  PRODUCTOS = l.filter(p => (p.tipo || 'producto') === 'producto');
  SERVICIOS = l.filter(p => p.tipo === 'servicio');
}

async function cargarProductosModuloBase() {
  const esAdmin = puede('administrar');
  vaciarModulos('v-productos');
  $('v-productos').innerHTML = `
    <div class="saludo"><div><h1>Productos</h1><div class="fecha">Catálogo de productos y servicios, con precios sin IVA y con IVA</div></div>
      <div class="acts" style="margin:0">${esAdmin ? `<button class="btn" id="prodnuevo">+ Nuevo ${PSEC === 'servicios' ? 'servicio' : 'producto'}</button>` : ''}</div></div>
    <div class="subnav"><button data-ps="productos" aria-pressed="${PSEC === 'productos'}">Productos</button>
      <button data-ps="servicios" aria-pressed="${PSEC === 'servicios'}">Servicios</button></div>
    <div id="vcuerpo"></div>`;
  $('v-productos').querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { PSEC = b.dataset.ps; cargarProductosModulo(); });
  if ($('prodnuevo')) $('prodnuevo').onclick = () => PSEC === 'servicios' ? editorServicio(null) : editorProducto(null);
  if (PSEC === 'servicios') pintarServicios(); else pintarProductos();
}

async function cargarProductosModulo() {
  await cargarProductosModuloBase();
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
}

async function pintarMaterialBase() {
  await Promise.all([cargarAjustes(), cargarProductos()]);
  const m = Object.assign({ producto_id: null, restar_stock: false }, AJUSTES.muestras || {});
  const { data: clas } = await db.rpc('clasificadores_actividad');
  const mat = (clas || []).find(c => c.papel === 'material_visita');
  const { data: cid } = await db.from('clasificadores').select('id').eq('papel', 'material_visita').maybeSingle();
  const { data: vals } = cid ? await db.from('valores_clasificador').select('id,valor,activo,dato_tipo').eq('clasificador_id', cid.id).order('orden') : { data: [] };
  $('cfgcuerpo').innerHTML = `
    <div class="card cfgpanel"><h2>Material de ${TT('visita', 's', '', 'l', 'l')}</h2>
      <p class="sm">Todo lo que un comercial puede dejar en ${TT('visita', 's', 'un', 'l', 'l')}. Al registrar ${TT('visita', 's', 'el', 'l', 'l')} se marca qué se entregó y cuánto, y queda en la ficha ${TT('medico', 's', 'del', 'l', 'l')} y en Analítica (material por comercial, por ${TT('medico', 's', '', 'l', 'l')} y por mes).</p>
      <div class="mattipos"><div><b>📦 Muestras de producto</b><span>Unidades de un producto del catálogo. Pueden descontarse del stock.</span></div>
        <div><b>📚 Material promocional</b><span>Dípticos, catálogos, flyers, tarjetas… Se cuentan, pero no descuentan stock.</span></div></div></div>
    <div class="card cfgpanel"><h2>📦 Muestras de producto</h2>
      <div class="g2"><div><label for="muprod">Producto que se entrega como muestra</label><select id="muprod"><option value="">— Ninguno —</option>${PRODUCTOS.filter(p => p.tipo !== 'servicio').map(p => `<option value="${p.id}" ${p.id === m.producto_id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div><div></div></div>
      <label class="vfswitch" style="margin-top:10px"><input type="checkbox" id="murest" ${m.restar_stock ? 'checked' : ''}><span class="sw"></span>
        <span><b>Descontar las muestras del stock</b><br><span class="sm">Salen del maletín de quien registra ${TT('visita', 's', 'el', 'l', 'l')} (o del almacén central si no tiene), empezando por el lote que caduca antes. Así sabes cuántas muestras quedan y a quién llegó cada lote.</span></span></label>
      <div class="acts" style="justify-content:flex-end"><button class="btn" id="muok">Guardar</button></div></div>
    <div class="card cfgpanel"><h2>📚 Material promocional</h2>
      <p class="sm">Lo que aparece para marcar al registrar ${TT('visita', 's', 'un', 'l', 'l')}. En cada uno eliges si al registrar se anotan las unidades entregadas y, con el portal, si se puede pedir desde él y cuántas como máximo por petición.</p>
      <div class="matlista">${(vals || []).map(v => `<div class="matfila ${v.activo ? '' : 'off'}"><b>${esc(v.valor)}</b><span class="sm">${v.dato_tipo === 'numero' ? 'Pide cantidad' : 'Solo se marca'}</span>
        <label class="vfswitch mini"><input type="checkbox" data-mact="${v.id}" ${v.activo ? 'checked' : ''}><span class="sw"></span><span class="sm">${v.activo ? 'Activo' : 'Oculto'}</span></label></div>`).join('') || '<div class="sm">Todavía no hay material.</div>'}</div>
      <div class="matadd"><input id="matn" placeholder="Nuevo material, p. ej. Cartel para el mostrador"><label class="opt" style="margin:0"><input type="checkbox" id="matq" checked> Anotar cuántas se entregan</label>
        <button class="btn sec" id="matok" ${cid ? '' : 'disabled'}>Añadir</button></div></div>`;
  $('muok').onclick = async () => {
    if ($('murest').checked && !$('muprod').value) { toast('Elige el producto de las muestras', true); return; }
    const { error } = await db.rpc('guardar_ajuste', { p_clave: 'muestras', p_valor: { producto_id: $('muprod').value || null, restar_stock: $('murest').checked } });
    if (error) { toast('No se ha podido guardar', true); return; } AJUSTES.muestras = { producto_id: $('muprod').value || null, restar_stock: $('murest').checked }; toast('Guardado');
  };
  $('cfgcuerpo').querySelectorAll('[data-mact]').forEach(c => c.onchange = async () => { await db.rpc('guardar_valor', { p: { id: c.dataset.mact, activo: c.checked } }); toast(c.checked ? `Visible en ${TT('visita', 'p', 'el', 'l', 'l')}` : `Oculto en ${TT('visita', 'p', 'el', 'l', 'l')}`); cargarCatalogos(); pintarMaterial(); });
  $('matok').onclick = async () => {
    const v = $('matn').value.trim(); if (!v) return;
    const { error } = await db.rpc('guardar_valor', { p: Object.assign({ clasificador_id: cid.id, valor: v }, $('matq').checked ? { dato_tipo: 'numero', dato_etiqueta: 'Unidades' } : {}) });
    if (error) { toast('No se ha podido: ' + error.message, true); return; } toast('Añadido'); cargarCatalogos(); pintarMaterial();
  };
}

async function cargarProductos() {
  await cargarProductosBase();
  const { data } = await db.from('productos').select('id,estado');
  ESTADO_PROD = {}; (data || []).forEach(x => { ESTADO_PROD[x.id] = x.estado || 'Activo'; });
  [...PRODUCTOS, ...SERVICIOS].forEach(p => { p.estado = ESTADO_PROD[p.id] || 'Activo'; });
}

async function productosPromocionadosBase() {
  if (!navigator.onLine) return PROMO_PRODS || [];   // v2.259.0: sin red, la última lista leída
  try {
    const { data, error } = await db.from('productos').select('id,nombre,estado').eq('promocionado', true).order('nombre');
    if (!error) PROMO_PRODS = (data || []).filter(p => (p.estado || 'Activo') !== 'Descatalogado').map(p => ({ id: p.id, nombre: p.nombre }));
  } catch (e) {}
  return PROMO_PRODS || [];
}

// La lista de material se pide a la vez que los productos promocionados (así «Presentar» sale con ellos, no después)
async function productosPromocionados(...a) {
  const [r] = await Promise.all([productosPromocionadosBase.apply(this, a), presMateriales()]);
  return r;
}

/* ============================================================
   v2.278.0 · Material de visita: cada material con su cantidad y su máximo en el portal (aviso de Eric, 12/10/2026).
   Antes, «Pide cantidad» solo se elegía al añadir y el máximo que puede pedir el profesional desde su portal (20 si nadie lo
   cambiaba) estaba en otro apartado. Ahora cada fila de «Material promocional» lleva:
   - Al registrar: «Anotar cuántas se entregan» o «Solo marcar que se entregó» (guardar_valor dato_tipo).
   - Con el portal: «Se puede pedir desde el portal» y «Máximo por petición» (1 a 1.000; vacío o fuera de rango avisa en la fila
     y no se guarda). Se guarda en el mismo ajuste que «Portal del profesional» (portal.material).
   ============================================================ */
async function pintarMaterial(...x) {
  const r = await pintarMaterialBase.apply(this, x);
  try { await matMejorar(); } catch (e) { registrarError('error', 'Material promocional: ' + e.message); }
  return r;
}

function editorProductoBase(p) {
  const esAdmin = puede('administrar');
  p = p || { iva: 10, activo: true, unidades_envase: 1 };
  const ro = esAdmin ? '' : 'disabled';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${p.id ? esc(p.nombre) : 'Nuevo producto'}</h2>
      <div class="sm">${esAdmin ? 'Escribe el precio sin IVA o con IVA: el otro se calcula solo.' : 'Solo administración puede cambiar productos.'}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div style="display:flex;gap:14px;align-items:center;margin-top:8px">
      <span class="pfoto" id="prfprev" style="width:72px;height:72px;${p.foto_url ? `background-image:url('${esc(p.foto_url)}')` : ''}">${p.foto_url ? '' : '◧'}</span>
      ${esAdmin ? '<div style="flex:1"><label for="prfoto" style="margin-top:0">Foto</label><input id="prfoto" type="file" accept="image/*"></div>' : ''}</div>
    <div class="g2">
      <div><label for="prn">Nombre</label><input id="prn" value="${esc(p.nombre || '')}" ${ro}></div>
      <div><label for="prp">Presentación</label><input id="prp" value="${esc(p.presentacion || '')}" placeholder="Caja de 30 sobres" ${ro}></div></div>
    <div class="pvp">
      <div><label for="prpr">Precio sin IVA (€)</label><input id="prpr" type="number" step="0.01" min="0" value="${p.precio != null ? +(+p.precio).toFixed(4) : ''}" ${ro}></div>
      <div><label for="priva">IVA (%)</label><input id="priva" type="number" step="1" min="0" max="21" value="${p.iva != null ? p.iva : 10}" ${ro}></div>
      <div><label for="prpvp">Precio con IVA (€)</label><input id="prpvp" type="number" step="0.01" min="0" value="${p.precio != null ? r2(p.precio * (1 + (+p.iva || 0) / 100)) : ''}" ${ro}></div></div>
    <div class="g2">
      <div><label for="prref">Referencia</label><input id="prref" value="${esc(p.referencia || '')}" ${ro}></div>
      <div><label for="prcb">Código de barras</label><input id="prcb" value="${esc(p.codigo_barras || '')}" ${ro}></div></div>
    <div class="g2">
      <div><label for="prue">Unidades por envase</label><input id="prue" type="number" min="1" value="${p.unidades_envase || 1}" ${ro}></div>
      <div><label for="prco">Coste (€, sin IVA)</label><input id="prco" type="number" step="0.01" min="0" value="${p.coste != null ? p.coste : ''}" ${ro}></div></div>
    ${esAdmin && p.id ? `<label class="opt" style="margin-top:12px"><input type="checkbox" id="pract" ${p.activo ? 'checked' : ''}> Activo: aparece al crear pedidos</label>` : ''}
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>${esAdmin ? 'Cancelar' : 'Cerrar'}</button>
      ${esAdmin ? `<button class="btn" id="prok">${p.id ? 'Guardar' : 'Crear producto'}</button>` : ''}</div>`;
  $('dlg').showModal();
  if (!esAdmin) return;

  const iva = () => (+$('priva').value || 0) / 100;
  $('prpr').oninput = () => { $('prpvp').value = $('prpr').value === '' ? '' : r2(+$('prpr').value * (1 + iva())); };
  $('prpvp').oninput = () => { $('prpr').value = $('prpvp').value === '' ? '' : +(+$('prpvp').value / (1 + iva())).toFixed(4); };
  $('priva').oninput = () => { if ($('prpr').value !== '') $('prpvp').value = r2(+$('prpr').value * (1 + iva())); };
  $('prfoto').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    $('prfprev').style.backgroundImage = `url('${URL.createObjectURL(f)}')`; $('prfprev').textContent = '';
  };
  camposInsertar($('dbody'), 'producto', p.id, $('prok') && $('prok').closest('.acts'));
  $('prok').onclick = async ev => {
    if (!$('prn').value.trim()) { toast('Escribe el nombre', true); return; }
    const cps = camposLeer($('dbody'));
    if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    let foto_url;
    const f = $('prfoto').files && $('prfoto').files[0];
    if (f) {
      const ruta = 'p-' + Date.now() + '-' + f.name.replace(/[^a-zA-Z0-9.]/g, '');
      const { error: eu } = await db.storage.from('productos').upload(ruta, f, { upsert: true });
      if (!eu) foto_url = db.storage.from('productos').getPublicUrl(ruta).data.publicUrl;
      else toast('La foto no se ha podido subir: ' + eu.message, true);
    }
    const { data: r, error } = await db.rpc('guardar_producto', { p: {
      id: p.id || null, nombre: $('prn').value.trim(), presentacion: $('prp').value.trim(),
      precio: $('prpr').value, iva: $('priva').value, referencia: $('prref').value.trim(),
      codigo_barras: $('prcb').value.trim(), unidades_envase: $('prue').value, coste: $('prco').value,
      ...(foto_url ? { foto_url } : {}), ...($('pract') ? { activo: $('pract').checked } : {}) } });
    ev.target.disabled = false; ev.target.textContent = p.id ? 'Guardar' : 'Crear producto';
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar: ' + ((error && error.message) || (r && r.error) || ''), true); return; }
    if (cps && !(await camposGuardar(cps, (r && r.id) || p.id))) return;
    $('dlg').close(); toast(p.id ? 'Producto guardado' : 'Producto creado');
    await cargarProductos(); if (TAB === 'productos') pintarProductos();
  };
}

// En la ficha del producto: selector de estado
function editorProductoBase2(p, ...r) {
  const x = editorProductoBase(p, ...r);
  setTimeout(() => {
    if (!p || !p.id || $('prestado') || !$('dbody')) return;
    const est = ESTADO_PROD[p.id] || p.estado || 'Activo';
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prestado"><h3>Estado</h3><div class="segs">${['Activo', 'En pausa', 'Descatalogado'].map(e => `<button type="button" data-pest="${e}" class="${e === est ? 'on' : ''}">${e}</button>`).join('')}</div>
      <div class="sm" style="margin-top:6px">«En pausa»: no aparece al hacer pedidos, pero se conserva su stock. «Descatalogado»: deja de venderse.</div></div>`);
    $('dbody').querySelectorAll('[data-pest]').forEach(b => b.onclick = async () => {
      const { data, error } = await RPC_ORIG('estado_producto', { p_id: p.id, p_estado: b.dataset.pest });
      if (error || !data || !data.ok) { toast('No se ha podido cambiar el estado', true); return; }
      ESTADO_PROD[p.id] = b.dataset.pest; const pp = PRODUCTOS.find(z => z.id === p.id); if (pp) pp.estado = b.dataset.pest;
      $('dbody').querySelectorAll('[data-pest]').forEach(z => z.classList.toggle('on', z === b)); toast('Estado: ' + b.dataset.pest);
    });
  }, 80);
  return x;
}

function editorProductoBase3(p, ...a) { const r = editorProductoBase2.call(this, p, ...a); if (p && p.id) setTimeout(() => bloqueCampos('productos', p.id, $('dbody')), 150); return r; }

// Producto: datos de la muestra regulada (solo administración; se guardan al cambiarlos)
function editorProductoBase4(p, ...r) {
  const x = editorProductoBase3.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prmuestra')) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    if (!p || !p.id) { ref.insertAdjacentHTML('beforebegin', '<div class="blk" id="prmuestra"><h3>Muestras con control legal</h3><p class="sm">Guarda el producto y vuelve a abrirlo para marcarlo como muestra con control legal.</p></div>'); return; }
    const { data: m } = await db.from('productos').select('muestra_regulada,muestra_desde,muestra_max').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prmuestra')) return;
    const d = m || {};
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prmuestra"><h3>Muestras con control legal</h3>
      <label class="opt"><input type="checkbox" id="prmreg" ${d.muestra_regulada ? 'checked' : ''}> Es un medicamento: sus muestras llevan firma y límite</label>
      <div class="g2 ${d.muestra_regulada ? '' : 'hide'}" id="prmdat">
        <div><label for="prmdesde">Autorizado el</label><input id="prmdesde" type="date" value="${esc(d.muestra_desde || '')}"></div>
        <div><label for="prmmax">Máximo por profesional y año</label><input id="prmmax" type="number" min="1" max="10" step="1" value="${d.muestra_max || 10}"></div></div>
      <p class="sm">La ley permite como mucho 10 muestras por medicamento, profesional y año, durante los 2 años siguientes a su autorización, y con la solicitud firmada.</p></div>`);
    const guardar = async () => {
      const reg = $('prmreg').checked, max = Math.min(10, Math.max(1, +$('prmmax').value || 10));
      $('prmdat').classList.toggle('hide', !reg);
      const { error } = await db.from('productos').update({ muestra_regulada: reg, muestra_desde: $('prmdesde').value || null, muestra_max: max }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : 'Muestras: guardado', !!error);
    };
    ['prmreg', 'prmdesde', 'prmmax'].forEach(k => $(k).addEventListener('change', guardar));
  }, 120);
  return x;
}

function editorProductoBase5(p, ...r) {
  const x = editorProductoBase4.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !planIncluyeSeccion('cobertura') || !$('dbody') || !$('prok') || $('prpromo') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const { data: m } = await db.from('productos').select('promocionado').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prpromo') || !m) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prpromo"><h3>Promoción</h3>
      <label class="opt"><input type="checkbox" id="prpromoc" ${m.promocionado ? 'checked' : ''}> Se promociona en las ${TT('visita', 'p', '', 'l', 'l')}</label>
      <p class="sm">Sale en «Registrar ${TT('visita', 's', '', 'l', 'l')}» para marcarlo como presentado, y en la cobertura por producto del ciclo.</p></div>`);
    $('prpromoc').onchange = async e => {
      const { error } = await db.from('productos').update({ promocionado: e.target.checked }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : (e.target.checked ? 'Se promociona en las ' + TT('visita', 'p', '', 'l', 'l') : 'Ya no se promociona'), !!error);
      if (!error) PROMO_PRODS = null;
    };
  }, 140);
  return x;
}

// Producto: es un equipo y cada cuánto se revisa
function editorProductoBase6(p, ...r) {
  const x = editorProductoBase5.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !planIncluyeSeccion('parque') || !$('dbody') || !$('prok') || $('prequipo') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const { data: m } = await db.from('productos').select('es_equipo,revision_meses').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prequipo') || !m) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prequipo"><h3>Equipo</h3>
      <label class="opt"><input type="checkbox" id="preqc" ${m.es_equipo ? 'checked' : ''}> Es un equipo: se instala con su número de serie</label>
      <div class="${m.es_equipo ? '' : 'hide'}" id="preqd"><label for="preqr">Revisión cada (meses; 0 = sin revisiones)</label><input id="preqr" type="number" min="0" max="120" step="1" value="${+m.revision_meses || 0}" style="max-width:140px"></div>
      <p class="sm">Al confirmar un pedido con este producto se pide el número de serie de cada unidad y queda en el parque instalado del cliente.</p></div>`);
    const guardar = async () => {
      $('preqd').classList.toggle('hide', !$('preqc').checked);
      const { error } = await db.from('productos').update({ es_equipo: $('preqc').checked, revision_meses: Math.min(120, Math.max(0, Math.floor(+$('preqr').value || 0))) }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : 'Equipo: guardado', !!error);
    };
    $('preqc').onchange = guardar; $('preqr').onchange = guardar;
  }, 160);
  return x;
}

// Ficha del producto: el material para presentar
function editorProductoBase7(p, ...r) {
  const x = editorProductoBase6.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prmat') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const l = (await presMateriales(true)).filter(m => m.producto_id === p.id);
    if (!$('dbody') || $('prmat') || !$('prok')) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prmat"><h3>Material para presentar</h3>
      <p class="sm">Imágenes o PDF (fichas técnicas, estudios, catálogo) que se enseñan a pantalla completa al registrar ${esc(TT('visita', 's', 'una', 'l', 'l'))}. Hasta 8 MB cada uno. Con «Para los centros», los centros que tienen el producto lo descargan desde su portal.</p>
      <div class="prmatl" id="prmatl"></div>
      <label class="btn sec prmatadd">+ Añadir imagen o PDF<input type="file" id="prmatf" accept="image/*,application/pdf" data-fp="1" multiple hidden></label></div>`);
    const pinta = lista => {
      $('prmatl').innerHTML = lista.length ? lista.map(m => `<div class="prmati"><span>${m.tipo === 'application/pdf' ? 'PDF' : 'Imagen'} · ${esc(m.nombre)}</span><label class="prmatpp"><input type="checkbox" data-prmatpp="${m.id}" ${m.para_portal ? 'checked' : ''}> Para los centros</label>
          <button type="button" class="lnk" data-prmatver="${m.id}">Ver</button><button type="button" class="lnk" data-prmatdel="${m.id}" aria-label="Quitar ${esc(m.nombre)}">Quitar</button></div>`).join('')
        : '<p class="sm">Todavía no tiene material.</p>';
      $('prmatl').querySelectorAll('[data-prmatver]').forEach(b => b.onclick = async () => {
        await presMateriales(); presentarSolo(p, b.dataset.prmatver);
      });
      $('prmatl').querySelectorAll('[data-prmatdel]').forEach(b => b.onclick = async () => {
        const m = lista.find(y => y.id === b.dataset.prmatdel); if (!m) return;
        if (!await preguntar(`Se quita «${m.nombre}» del material de este producto.`, { titulo: '¿Quitar el material?', ok: 'Quitar', peligro: true })) return;
        const { error } = await db.from('producto_materiales').delete().eq('id', m.id);
        if (error) { toast('No se ha podido quitar: ' + error.message, true); return; }
        PRES_DATOS.delete(m.id); pinta((await presMateriales(true)).filter(y => y.producto_id === p.id)); toast('Material quitado');
      });
    };
    pinta(l);
    $('prmatf').onchange = async e => {
      const fs = [...e.target.files]; e.target.value = '';
      let n = 0, orden = l.length;
      for (const f of fs) {
        let a = null;
        if (f.type === 'application/pdf') {
          if (f.size > PRES_MAX) { toast(`«${f.name}» pesa más de 8 MB`, true); continue; }
          a = { nombre: f.name, tipo: f.type, tamano: f.size, datos: await aBase64(f) };
        } else if (/^image\//.test(f.type)) a = await leerJustificante(f);
        else { toast(`«${f.name}» no es una imagen ni un PDF`, true); continue; }
        if (!a) continue;
        const { error } = await db.from('producto_materiales').insert({ producto_id: p.id, nombre: a.nombre, tipo: a.tipo, tamano: a.tamano, datos: a.datos, orden: orden++ });
        if (error) { toast(`No se ha podido subir «${f.name}»: ${error.message}`, true); continue; }
        n++;
      }
      if (n) toast(n === 1 ? 'Material añadido' : `${n} archivos añadidos`);
      if ($('prmatl')) pinta((await presMateriales(true)).filter(y => y.producto_id === p.id));
    };
  }, 160);
  return x;
}

// Producto: packs para los centros y PVP de referencia
function editorProductoBase8(p, ...r) {
  const x = editorProductoBase7.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prpacks') || !p || !p.id) return;
    const { data: d } = await db.from('productos').select('packs, pvp_recomendado').eq('id', p.id).maybeSingle();
    const ref = $('prmat') || $('dbody').querySelector('.acts:last-of-type'); if (!ref || $('prpacks')) return;
    let packs = (d && Array.isArray(d.packs) ? d.packs : []).map(k => ({ compra: +k.compra || 0, regalo: +k.regalo || 0 }));
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prpacks"><h3>Packs para los centros</h3>
      <p class="sm">Si pones packs, los centros piden este producto solo por packs desde su portal. El regalo va en el pedido como línea aparte al 100 % de descuento. El PVP de referencia (con IVA) sirve para enseñarles su margen.</p>
      <div id="prpkl"></div><button type="button" class="btn sec chico" id="prpkmas">+ Añadir pack</button>
      <div class="g2" style="margin-top:10px"><div><label for="prpkpvp">PVP de referencia (con IVA)</label><input id="prpkpvp" type="number" step="0.01" value="${d && d.pvp_recomendado != null ? +d.pvp_recomendado : ''}" placeholder="Sin indicar"></div></div>
      <span class="pcerr" id="prpkerr" hidden></span>
      <div class="prpkacts"><button type="button" class="btn sec" id="prpkok">Guardar packs</button></div></div>`);
    const leer = () => [...$('prpkl').querySelectorAll('.prpkf')].map(f => ({ compra: f.querySelector('[data-pkc]').value, regalo: f.querySelector('[data-pkg]').value }));
    const pinta = () => {
      $('prpkl').innerHTML = packs.length ? packs.map((k, i) => `<div class="prpkf"><label>Compra <input type="number" step="1" data-pkc value="${k.compra || ''}"></label>
          <label>Regalo <input type="number" step="1" data-pkg value="${k.regalo || 0}"></label><button type="button" class="pmhx" data-pkx="${i}" aria-label="Quitar este pack">✕</button></div>`).join('')
        : '<p class="sm">Sin packs: los centros lo piden por unidades.</p>';
      $('prpkl').querySelectorAll('[data-pkx]').forEach(b => b.onclick = () => { packs = leer(); packs.splice(+b.dataset.pkx, 1); pinta(); });
    };
    pinta();
    $('prpkmas').onclick = () => { packs = leer(); packs.push({ compra: '', regalo: 0 }); pinta(); };
    $('prpkok').onclick = async ev => {
      const l = leer().map(k => ({ compra: Number(k.compra), regalo: Number(k.regalo || 0) })), err = $('prpkerr');
      const malo = l.find(k => !Number.isInteger(k.compra) || k.compra < 1 || !Number.isInteger(k.regalo) || k.regalo < 0);
      const rep = l.some((k, i) => l.findIndex(y => y.compra === k.compra && y.regalo === k.regalo) !== i);
      const pv = $('prpkpvp').value === '' ? null : Number($('prpkpvp').value);
      const txt = malo ? 'Cada pack necesita una compra de 1 o más unidades y un regalo de 0 o más (números enteros).' : rep ? 'Hay dos packs iguales.' : pv != null && (!(pv >= 0) || isNaN(pv)) ? 'El PVP de referencia tiene que ser un importe de 0 o más.' : '';
      err.hidden = !txt; err.textContent = txt; if (txt) return;
      ev.target.disabled = true;
      const { error } = await db.from('productos').update({ packs: l.length ? l.sort((a, b) => a.compra - b.compra) : null, pvp_recomendado: pv }).eq('id', p.id);
      ev.target.disabled = false;
      if (error) { toast('No se han podido guardar los packs: ' + error.message, true); return; }
      packs = l; pinta(); toast(l.length ? `Packs guardados (${num(l.length)})` : 'Sin packs: se pide por unidades');
    };
  }, 0);
  return x;
}

function editorProducto(p, ...r) {
  const x = editorProductoBase8.call(this, p, ...r);
  setTimeout(() => {
    if (!p || !p.id || !puedeEliminarProducto() || !$('dbody') || !$('prok') || $('prelim')) return;
    // dentro de la fila de botones del editor: un bloque nuevo al final despistaría a los que buscan .acts:last-of-type
    const fila = $('prok').closest('.acts') || $('dbody').querySelector('.acts:last-of-type'); if (!fila) return;
    fila.insertAdjacentHTML('afterbegin', '<button type="button" class="btn sec dang prelimb" id="prelim">Eliminar producto</button>');
    $('prelim').onclick = async () => {
      if (!await preguntar('Si no se ha vendido nunca, se borra del todo, también su stock, sus lotes y sus compras. Si tiene ventas, muestras firmadas, intervenciones o equipos, deja de salir en todas partes pero se conserva para el histórico (los pedidos y las facturas siguen con su nombre) y se puede recuperar.',
        { titulo: `¿Eliminar «${p.nombre}»?`, ok: 'Eliminar', peligro: true })) return;
      const { data: res, error } = await db.rpc('eliminar_producto', { p_id: p.id });
      if (error || !res || !res.ok) {
        toast(res && res.error === 'stock' ? `Tiene ventas y ${num(res.unidades)} unidades en stock: sácalas o regulariza el stock antes de eliminarlo`
          : res && res.error === 'permiso' ? 'No tienes permiso para eliminar productos' : 'No se ha podido eliminar: ' + ((error && error.message) || (res && res.error) || ''), true);
        return;
      }
      if ($('dlg').open) $('dlg').close();
      if (res.modo === 'borrado') toast('Producto eliminado' + (res.detalle && +res.detalle.unidades ? ` con sus ${num(res.detalle.unidades)} unidades de stock` : ''));   // v2.324.0
      else toast('Producto eliminado de las listas · se conserva en el histórico (' + Object.entries(res.detalle || {}).map(([k, n]) => `${num(n)} ${PROD_USOS[k] || k}`).join(', ') + ')');
      refrescarProductos();
    };
  }, 0);
  return x;
}

function productoPorDefecto() {
  const lista = PRODUCTOS.filter(p => p.tipo !== 'servicio' && vendible(p));
  const hab = localStorage.getItem('dlc-prod-habitual');
  return (lista.find(p => p.id === hab) || lista[0] || {}).id || '';
}

function opcionesProducto(id, nombre) {
  // En los pedidos solo aparecen los productos activos (y el que ya tuviera la línea)
  const lista = PRODUCTOS.filter(p => (p.tipo !== 'servicio' && vendible(p)) || p.id === id);
  const falta = id && !lista.some(p => p.id === id);
  return (falta ? `<option value="${id}" selected>${esc(nombre || 'Producto del pedido')}</option>` : '') +
    lista.map(p => `<option value="${p.id}" ${p.id === id ? 'selected' : ''}>${esc(p.nombre)}${vendible(p) ? '' : ' (' + esc(p.estado.toLowerCase()) + ')'}</option>`).join('')
    || '<option value="">Sin productos activos</option>';
}
