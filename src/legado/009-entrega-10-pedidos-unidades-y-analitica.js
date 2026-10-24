/* ============================================================
   DLC OS 2.0 · Entrega 10: pedidos, unidades y analítica
   ============================================================ */

let PRODUCTOS = [], PEDIDOS = [], SIN_ATRIB = [];
const AN = { dim: 'medico', desde: '', hasta: '', canal: '', producto: '' };
// Crear o cambiar pedidos y pacientes: administración y televenta (el comercial solo consulta lo suyo)
const puedeVentas = () => PERFIL && (puede('administrar') || (((PERFIL.areas || {}).V || 0) >= 2 && puede('televenta')));
const veVentas = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).V || 0) >= 1 || puede('cartera'));


/* ---------------- pedidos ---------------- */



async function pintarSinAtribuir() {
  if (!$('cardsinatr')) return;
  const { data } = await db.rpc('lineas_sin_atribuir');
  if (!$('cardsinatr')) return;
  SIN_ATRIB = data || [];
  if (!SIN_ATRIB.length) { $('cardsinatr').innerHTML = ''; return; }
  $('cardsinatr').innerHTML = `<h2><span style="color:var(--warn)">Pedidos sin atribuir</span><span class="n">${SIN_ATRIB.length}</span></h2>
    <p class="sm">No hemos podido identificar ${TT('medico', 's', 'al', 'l', 'l')}. Asígnalo y las métricas se corrigen solas.</p>
    <div class="lista">${SIN_ATRIB.map(l => `<div class="item" style="cursor:default">
      <span class="ic w">?</span>
      <span class="tx"><b>${esc(l.cuenta_texto || 'Sin indicar')}</b>
        <span class="sm">${fechaCorta(l.fecha)} · ${num(l.unidades)} uds. · ${esc(l.producto || '')} · ${esc(l.contacto || '')}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" data-atr="${l.id}|${esc(l.cuenta_texto || '')}">Atribuir</button></span>
    </div>`).join('')}</div>`;
  $('cardsinatr').querySelectorAll('[data-atr]').forEach(b => b.onclick = () => {
    const [id, texto] = b.dataset.atr.split('|'); atribuir(id, texto);
  });
}

async function atribuir(lineaId, texto) {
  const { data } = await db.rpc('resolver_cuenta', { p_texto: texto || '' });
  const cand = data || [];
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Atribuir a ${TT('medico', 's', 'un', 'l', 'l')}</h2><div class="sm">Texto del pedido: ${esc(texto || '(vacío)')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="abusca">Buscar ${TT('medico', 's', '', 'l', 'l')}</label><input id="abusca" value="${esc(texto || '')}" placeholder="Código o nombre">
    <div id="acand" class="lista">${cand.map(c => `<button class="item" data-am="${c.id}">
      <span class="ic">${c.pct}%</span><span class="tx"><b>${esc(c.nombre)}</b><span class="sm">Código ${esc(c.codigo)}</span></span></button>`).join('')
      || '<div class="vacio">Sin coincidencias. Escribe otro nombre o código.</div>'}</div>`;

  const pintar = lista => {
    $('acand').innerHTML = lista.length ? lista.map(c => `<button class="item" data-am="${c.id}">
      <span class="ic">${c.pct}%</span><span class="tx"><b>${esc(c.nombre)}</b><span class="sm">Código ${esc(c.codigo)}</span></span></button>`).join('')
      : '<div class="vacio">Sin coincidencias.</div>';
    $('acand').querySelectorAll('[data-am]').forEach(b => b.onclick = async () => {
      const { data: r, error } = await db.rpc('atribuir_linea', { p_linea: lineaId, p_medico: b.dataset.am });
      if (error || (r && r.ok === false)) { toast('No se ha podido atribuir', true); return; }
      $('dlg').close(); toast('Atribuido'); pintarSinAtribuir(); listaPedidos();
    });
  };
  pintar(cand);
  let t;
  $('abusca').oninput = e => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const { data: d2 } = await db.rpc('resolver_cuenta', { p_texto: e.target.value });
      pintar(d2 || []);
    }, 300);
  };
  $('dlg').showModal();
}

/* ---------------- alta de pedido ---------------- */


/* ---------------- productos ---------------- */

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

/* ---------------- analítica ---------------- */





