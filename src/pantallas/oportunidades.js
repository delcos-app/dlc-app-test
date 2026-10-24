// pantallas/oportunidades.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function catLlamadas() {
  for (const k of ['motivo_llamada', 'resultado_llamada']) {
    if (!(CAT[k] || []).length) { const { data } = await db.rpc('catalogo_papel', { p_papel: k }); CAT[k] = data || []; }
  }
}

/* v2.119.0 · Registro de llamada dentro del alta de cliente. El cliente nuevo de una llamada se da de alta siempre con la ficha
   completa; su desplegable «Registro de llamada» guarda la llamada con el cliente o, si no compra, solo la llamada (sin cliente) con
   lo apuntado de él en llamadas.datos (población, provincia, email…), para las métricas. */
function llamadaAltaHTML(est) {
  est = est || {};
  return `<details class="blk kollam" id="kollam" ${est.motivo !== undefined ? 'open' : ''}><summary>Registro de llamada</summary>
    <div class="sm">Si llama y no compra, guarda solo la llamada: no se crea el cliente, pero quedan sus datos para las métricas.</div>
    <label>Motivo</label><div class="chipsw" id="kolmot"></div>
    <label>Resultado</label><div class="chipsw" id="kolres"></div>
    <div id="kolseg" class="${!est.resultado || est.resultado === 'Pedido hecho' ? 'hide' : ''}">
      <div class="sm" style="margin:8px 0 4px">¿Cuándo volver a llamar?</div>
      <div class="chipsw">${[['Mañana', 1], ['En 3 días', 3], ['En una semana', 7], ['En un mes', 30]].map(([t, d]) => `<button type="button" class="chipsel" data-kold="${d}">${t}</button>`).join('')}</div>
      <div class="g2" style="margin-top:6px"><div><input id="kolpf" type="date" value="${esc(est.proxima_fecha || '')}" aria-label="Volver a llamar el"></div>
        <div><input id="kolpa" value="${esc(est.proxima_accion || '')}" placeholder="p. ej. Enviarle el precio por WhatsApp" aria-label="Qué hacer"></div></div></div>
    <div class="g2"><div><label for="kold">Tipo</label><select id="kold"><option ${est.direccion !== 'Saliente' ? 'selected' : ''}>Entrante</option><option ${est.direccion === 'Saliente' ? 'selected' : ''}>Saliente</option></select></div>
      <div><label for="kolno">Nota de la llamada</label><input id="kolno" value="${esc(est.nota || '')}"></div></div>
    <div class="acts" style="margin-top:8px"><button type="button" class="btn sec" id="kosolo">No compra: guardar solo la llamada</button></div>
  </details>`;
}

function llamadaAltaActivar(getMedico, est) {
  est = est || {};
  LL_ALTA = { motivo: est.motivo || '', resultado: est.resultado || '' };
  catLlamadas().then(() => {
    if (!$('kolmot')) return;
    const chips = (cat, v, attr) => (CAT[cat] || []).map(x => `<button type="button" class="chipsel ${x.valor === v ? 'on' : ''} ${x.extra === 'neg' ? 'neg' : x.extra === 'pos' ? 'pos' : ''}" ${attr}="${esc(x.valor)}">${esc(x.valor)}</button>`).join('');
    $('kolmot').innerHTML = chips('motivo_llamada', LL_ALTA.motivo, 'data-kom');
    $('kolres').innerHTML = chips('resultado_llamada', LL_ALTA.resultado, 'data-kor');
  });
  $('kollam').onclick = e => {
    const m = e.target.closest('[data-kom]'), r = e.target.closest('[data-kor]'), d = e.target.closest('[data-kold]');
    if (m) { LL_ALTA.motivo = LL_ALTA.motivo === m.dataset.kom ? '' : m.dataset.kom; $('kolmot').querySelectorAll('[data-kom]').forEach(x => x.classList.toggle('on', x.dataset.kom === LL_ALTA.motivo)); }
    if (r) {
      LL_ALTA.resultado = LL_ALTA.resultado === r.dataset.kor ? '' : r.dataset.kor;
      $('kolres').querySelectorAll('[data-kor]').forEach(x => x.classList.toggle('on', x.dataset.kor === LL_ALTA.resultado));
      $('kolseg').classList.toggle('hide', !LL_ALTA.resultado || LL_ALTA.resultado === 'Pedido hecho');
    }
    if (d) { const f = new Date(); f.setDate(f.getDate() + +d.dataset.kold); $('kolpf').value = fechaLocal(f); $('kollam').querySelectorAll('[data-kold]').forEach(x => x.classList.toggle('on', x === d)); }
  };
}

function llamadaAltaLeer() {
  if (!$('kollam')) return null;
  return { motivo: LL_ALTA.motivo, resultado: LL_ALTA.resultado, direccion: $('kold').value, nota: $('kolno').value.trim(),
    proxima_fecha: $('kolpf').value, proxima_accion: $('kolpa').value.trim() };
}

async function llamadaAltaGuardar(ll, x, est) {
  est = est || {};
  const seguir = x.resultado && x.resultado !== 'Pedido hecho';
  const { data: r, error } = await db.rpc('guardar_llamada', { p: { id: est.id || null, fecha: est.fecha || null, direccion: ll.direccion,
    nombre: x.nombre || '', telefono: x.telefono || '', contacto_id: x.contacto_id || null, cliente_nuevo: null,
    cuenta_id: x.medico ? x.medico.id : null, cuenta_texto: x.medico ? '' : (est.cuenta_texto || ''), motivo: ll.motivo, resultado: x.resultado || '',
    proxima_accion: seguir ? ll.proxima_accion : '', proxima_fecha: seguir ? ll.proxima_fecha : '', nota: ll.nota,
    pedido_id: null, llamada_origen: est.previa || null, ...(x.datos && Object.keys(x.datos).length ? { datos: x.datos } : {}) } });
  if (error || (r && r.ok === false)) { toast('No se ha podido guardar la llamada' + (error ? ': ' + error.message : ''), true); return null; }
  return r.id;
}

async function catOportunidades() {
  await catLlamadas();
  if (!(CAT.origen_oportunidad || []).length) { const { data } = await db.rpc('catalogo_papel', { p_papel: 'origen_oportunidad' }); CAT.origen_oportunidad = data || []; }
}

// l: oportunidad existente o datos de partida ({ contacto, medico, interes, origen… }); previa: la oportunidad a la que se hace seguimiento
async function editorOportunidad(l, previa) {
  if (!PRODUCTOS.length) await cargarProductos();
  const reg = hayOportunidades();
  if (reg) await catOportunidades();
  l = Object.assign({ fecha: new Date().toISOString() }, l || {});
  if (!l.fecha) l.fecha = new Date().toISOString();
  const cerrada = !!l.pedido_id;
  let cliente = l.contacto ? l.contacto : l.contacto_id ? { id: l.contacto_id, nombre: l.cliente || l.nombre, movil: l.tel_cliente || l.telefono } : null;
  let medico = l.medico && typeof l.medico === 'object' ? l.medico : l.cuenta_id ? { id: l.cuenta_id, nombre: l.medico } : null;
  if (!medico && cliente && cliente.cuenta_id) medico = { id: cliente.cuenta_id, nombre: cliente.medico || TT('medico', 's', '', 'l', 'C') };
  let lineas = (l.interes || []).map(x => ({ producto_id: x.producto_id, unidades: x.unidades }));
  if (!lineas.length) lineas = [{ producto_id: productoPorDefecto(), unidades: 1 }];
  let origen = l.origen || (previa ? 'Llamada saliente' : ((CAT.origen_oportunidad || [])[0] || {}).valor || '');
  let motivo = l.motivo || '', resultado = l.resultado || '', noCompra = !!(l.id && l.resultado && l.resultado !== 'Pedido hecho');
  const f = new Date(l.fecha), local = new Date(f.getTime() - f.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const chips = (lista, v, attr) => lista.map(x => `<button type="button" class="chipsel ${x.valor === v ? 'on' : ''} ${x.extra === 'neg' ? 'neg' : x.extra === 'pos' ? 'pos' : ''}" ${attr}="${esc(x.valor)}">${esc(x.valor)}</button>`).join('');
  const titulo = l.id ? (cerrada ? 'Venta cerrada' : 'Oportunidad') : previa ? 'Volver a llamar' : 'Nueva venta';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${titulo}</h2>
      <div class="sm">${previa ? 'Seguimiento de ' + esc(previa.cliente || previa.nombre || '') : reg ? 'Cliente, qué quiere y cómo termina: queda registrado aunque no compre' : 'Busca el cliente o crea su ficha y haz el pedido'}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="llpaso" id="nvp1"><span class="lln">1</span><b>Cliente</b><div id="nvcli"></div><div id="nvctx" class="nvctx"></div></div>
    ${reg ? `<div class="llpaso" id="nvp2"><span class="lln">2</span><b>Qué quiere</b>
      <div id="nvint"></div>
      <label>${TT('medico', 's', '', 'l', 'C')} o centro de referencia</label><div id="nvmed"></div>
      <div class="sm" style="margin-top:4px">Si no está en la base, escribe su nombre: se guarda igualmente para las métricas.</div>
      <label>Cómo llegó</label><div class="chipsw" id="nvori">${chips(CAT.origen_oportunidad || [], origen, 'data-nvo')}</div>
      <label>Motivo</label><div class="chipsw" id="nvmot">${chips(CAT.motivo_llamada || [], motivo, 'data-nvm')}</div>
      <details class="llmas"><summary>Más detalles</summary>
        <div class="g2"><div><label for="nvf">Fecha y hora</label><input id="nvf" type="datetime-local" value="${local}"></div>
          <div><label for="nvno">Nota</label><input id="nvno" value="${esc(l.nota || '')}"></div></div></details></div>` : ''}
    <div class="llpaso" id="nvp3"><span class="lln">${reg ? 3 : 2}</span><b>Cómo termina</b>
      ${cerrada ? `<div class="banda-ok">Cerrada con el pedido ${esc(l.pedido || '')}.</div>`
        : `<div class="acts nvfin" style="margin:6px 0 0;justify-content:flex-start">
          <button type="button" class="btn" id="nvped">🛒 Hacer el pedido</button>
          ${reg ? `<button type="button" class="btn sec ${noCompra ? 'on' : ''}" id="nvno2">No compra</button>` : ''}</div>`}
      ${reg && !cerrada ? `<div id="nvnoz" class="${noCompra ? '' : 'hide'}">
        <label>Por qué no compra</label><div class="chipsw" id="nvres">${chips((CAT.resultado_llamada || []).filter(x => x.extra !== 'pos' && x.valor !== 'Pedido hecho'), resultado, 'data-nvr')}</div>
        <div class="sm" style="margin:8px 0 4px">¿Cuándo volver a llamar?</div>
        <div class="chipsw">${NV_DIAS.map(([t, d]) => `<button type="button" class="chipsel" data-nvd="${d}">${t}</button>`).join('')}</div>
        <div class="g2" style="margin-top:6px"><div><input id="nvpf" type="date" value="${esc(l.proxima_fecha || '')}" aria-label="Volver a llamar el"></div>
          <div><input id="nvpa" value="${esc(l.proxima_accion || '')}" placeholder="p. ej. Enviarle el precio por WhatsApp" aria-label="Qué hacer"></div></div>
        <div id="nvperd" class="sm" style="margin-top:6px"></div>
        <div class="acts" style="margin:8px 0 0;justify-content:flex-start"><button type="button" class="btn" id="nvnook">Guardar sin pedido</button></div></div>` : ''}
    </div>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" data-cerrar>Cerrar</button>
      ${reg && (cerrada || l.id) ? '<button class="btn sec" id="nvguar">Guardar cambios</button>' : ''}</div>`;
  $('dlg').showModal();
  const q = () => ($('nvq') ? $('nvq').value.trim() : '');

  // 1 · Cliente: buscar, crear ficha o lo que ya sabemos de él
  const pintaCli = () => {
    const c = $('nvcli');
    if (cliente) {
      c.innerHTML = `<div class="clisel"><span><b>${esc(cliente.nombre || '')}</b><span class="sm">${esc([cliente.movil || cliente.telefono || cliente.tel, cliente.nif].filter(Boolean).join(' · '))}</span></span>
        ${cerrada ? '' : '<button type="button" class="btn sec" id="nvcamb">Cambiar</button>'}</div>`;
      if ($('nvcamb')) $('nvcamb').onclick = () => { cliente = null; $('nvctx').innerHTML = ''; pintaCli(); };
      contexto();
      return;
    }
    c.innerHTML = `<input id="nvq" type="search" placeholder="Nombre, teléfono o DNI" autocomplete="off" value="${esc(l.id ? (l.nombre || l.telefono || '') : '')}"><div class="lista" id="nvres1"></div>
      <div class="acts" style="margin:6px 0 0;justify-content:flex-start"><button type="button" class="btn sec" id="nvalta">+ Crear ficha nueva</button>
        ${l.id || previa ? '' : '<button type="button" class="lnk" id="nvsin">Pedido sin cliente (venta a centro)</button>'}</div>
      ${reg ? '<div class="sm" style="margin-top:4px">Si no compra y no quiere ficha, basta con escribir aquí su nombre o su teléfono.</div>' : ''}`;
    let tq;
    $('nvq').oninput = () => { clearTimeout(tq); tq = setTimeout(async () => {
      const r = await buscarClientes(q());
      if (!$('nvres1')) return;
      $('nvres1').innerHTML = r.map(x => `<button type="button" class="item" data-nvc="${x.id}"><span class="tx"><b>${esc(x.nombre)}</b><span class="sm">${esc([x.movil || x.telefono, x.nif].filter(Boolean).join(' · '))}</span></span></button>`).join('')
        || (q().length > 1 ? '<div class="sm" style="padding:6px">No está: crea su ficha con «+ Crear ficha nueva».</div>' : '');
      $('nvres1').querySelectorAll('[data-nvc]').forEach(b => b.onclick = () => elegir(r.find(y => y.id === b.dataset.nvc)));
    }, 250); };
    $('nvalta').onclick = () => {
      const t = q(), tel = /^[+\d\s]{6,}$/.test(t);
      editorContacto({ nombre: tel ? '' : t, movil: tel ? t : '', cuenta_id: medico ? medico.id : null, medico: medico ? medico.nombre : '' }, res => elegir(res));
    };
    if ($('nvsin')) $('nvsin').onclick = () => { $('dlg').close(); editorPedido(); };
  };
  const elegir = async x => {
    if (!x) return;
    cliente = x;
    if (x.cuenta_id && !medico) {
      const { data: m } = await db.from('cuentas').select('id,nombre').eq('id', x.cuenta_id).maybeSingle();
      if (m) { medico = m; if ($('nvmed')) pintaMed(); }
    }
    pintaCli();
  };
  // Lo que ya sabemos del cliente: último pedido (para repetirlo), cuántos lleva y si quedamos en llamarle
  const contexto = async () => {
    const id = cliente && cliente.id; if (!id) return;
    const [{ data: peds0 }, segs] = await Promise.all([
      db.from('pedidos').select('id,numero,fecha,estado').eq('contacto_id', id).neq('estado', 'Anulado').order('fecha', { ascending: false }).limit(20),
      reg ? db.from('llamadas').select('id,fecha,resultado,proxima_fecha,proxima_accion,seguimiento_hecho_en,pedido_id').eq('contacto_id', id).order('fecha', { ascending: false }).limit(5) : Promise.resolve({ data: [] })]);
    // Las líneas, aparte (sin depender de la relación entre tablas)
    const { data: lin } = (peds0 || []).length ? await db.from('lineas_pedido').select('pedido_id,producto_id,unidades,importe,iva').in('pedido_id', peds0.map(x => x.id)) : { data: [] };
    const peds = (peds0 || []).map(x => Object.assign({}, x, { lineas_pedido: (lin || []).filter(y => y.pedido_id === x.id) }));
    if (!cliente || cliente.id !== id || !$('nvctx')) return;
    const p = peds || [], u = p[0], pend = ((segs && segs.data) || []).find(s => s.proxima_fecha && !s.seguimiento_hecho_en && !s.pedido_id && s.id !== l.id);
    const tot = x => (x.lineas_pedido || []).reduce((s, y) => s + (+y.importe || 0) * (1 + (+y.iva || 0) / 100), 0);
    const nom = pid => (PRODUCTOS.find(z => z.id === pid) || {}).nombre || 'Producto';
    $('nvctx').innerHTML = !p.length && !pend ? '<span class="sm">Cliente sin pedidos todavía.</span>' : `
      ${u ? `<div class="nvult"><span><b>Último pedido</b> · ${fechaCorta(String(u.fecha).slice(0, 10))} · ${esc((u.lineas_pedido || []).map(y => `${nom(y.producto_id)} × ${num(y.unidades)}`).join(', '))} · ${eurI(tot(u))}</span>
        ${reg && !cerrada ? '<button type="button" class="btn sec" id="nvrep">Repetir</button>' : ''}</div>` : ''}
      ${p.length ? `<span class="sm">${num(p.length)}${p.length === 20 ? ' o más' : ''} pedidos · ${eurI(p.reduce((s, x) => s + tot(x), 0))} en total</span>` : ''}
      ${pend ? `<div class="banda-aviso">Quedaste en llamarle el ${fechaCorta(pend.proxima_fecha)}${pend.proxima_accion ? ': ' + esc(pend.proxima_accion) : ''} (${esc(pend.resultado || '')}).</div>` : ''}`;
    if ($('nvrep')) $('nvrep').onclick = () => { lineas = (u.lineas_pedido || []).map(y => ({ producto_id: y.producto_id, unidades: +y.unidades || 1 })); pintaInt(); toast('Interés con lo del último pedido'); };
  };

  // 2 · Qué quiere
  const pintaInt = () => {
    if (!$('nvint')) return;
    const prods = PRODUCTOS.filter(p => p.tipo !== 'servicio' && p.estado !== 'En pausa' && p.estado !== 'Descatalogado');
    $('nvint').innerHTML = lineas.map((x, i) => `<div class="nvlin" data-nvi="${i}">
        <select data-nvf="producto_id" aria-label="Producto">${prods.map(p => `<option value="${p.id}" ${p.id === x.producto_id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')
          || '<option value="">Sin productos</option>'}</select>
        <input data-nvf="unidades" type="number" min="1" step="1" value="${esc(x.unidades)}" aria-label="Unidades">
        <span class="nvimp">${eurI(nvLinea(x.producto_id, x.unidades))}</span>
        ${lineas.length > 1 ? `<button type="button" class="btn sec" data-nvx="${i}" aria-label="Quitar">✕</button>` : '<span></span>'}</div>`).join('') +
      `<div class="nvtot"><button type="button" class="lnk" id="nvmas">+ Otro producto</button><span>Iría a comprar <b id="nvtotv">${eurI(totalInt())}</b></span></div>`;
    $('nvint').querySelectorAll('[data-nvi]').forEach(row => {
      const i = +row.dataset.nvi;
      row.querySelectorAll('[data-nvf]').forEach(inp => inp.oninput = inp.onchange = () => {
        lineas[i][inp.dataset.nvf] = inp.dataset.nvf === 'unidades' ? Math.max(0, +inp.value || 0) : inp.value;
        row.querySelector('.nvimp').textContent = eurI(nvLinea(lineas[i].producto_id, lineas[i].unidades));
        $('nvtotv').textContent = eurI(totalInt()); perdida();
      });
    });
    $('nvint').querySelectorAll('[data-nvx]').forEach(b => b.onclick = () => { lineas.splice(+b.dataset.nvx, 1); pintaInt(); });
    $('nvmas').onclick = () => { lineas.push({ producto_id: productoPorDefecto(), unidades: 1 }); pintaInt(); };
    perdida();
  };
  const totalInt = () => lineas.reduce((s, x) => s + nvLinea(x.producto_id, x.unidades), 0);
  const perdida = () => { if ($('nvperd')) $('nvperd').innerHTML = totalInt() ? `Sin pedido se quedan sin vender <b>${eurI(totalInt())}</b>.` : ''; };
  const pintaMed = () => {
    $('nvmed').innerHTML = ''; $('nvmed').__texto = medico ? '' : (l.cuenta_texto || '');
    selectorMedico($('nvmed'), { valor: medico, placeholder: 'Nombre, código, centro o municipio', alElegir: m => { medico = m; } });
  };
  pintaCli();
  if (reg) {
    pintaInt(); pintaMed();
    $('nvori').onclick = e => { const b = e.target.closest('[data-nvo]'); if (!b) return; origen = origen === b.dataset.nvo ? '' : b.dataset.nvo; $('nvori').querySelectorAll('[data-nvo]').forEach(x => x.classList.toggle('on', x.dataset.nvo === origen)); };
    $('nvmot').onclick = e => { const b = e.target.closest('[data-nvm]'); if (!b) return; motivo = motivo === b.dataset.nvm ? '' : b.dataset.nvm; $('nvmot').querySelectorAll('[data-nvm]').forEach(x => x.classList.toggle('on', x.dataset.nvm === motivo)); };
  }
  if ($('nvnoz')) $('nvnoz').onclick = e => {
    const d = e.target.closest('[data-nvd]');
    if (d) { const f2 = new Date(); f2.setDate(f2.getDate() + +d.dataset.nvd); $('nvpf').value = fechaLocal(f2); $('nvnoz').querySelectorAll('[data-nvd]').forEach(x => x.classList.toggle('on', x === d)); return; }
    const b = e.target.closest('[data-nvr]'); if (!b) return;
    resultado = resultado === b.dataset.nvr ? '' : b.dataset.nvr;
    $('nvres').querySelectorAll('[data-nvr]').forEach(x => x.classList.toggle('on', x.dataset.nvr === resultado));
  };
  if ($('nvno2')) $('nvno2').onclick = () => { noCompra = !noCompra; $('nvno2').classList.toggle('on', noCompra); $('nvnoz').classList.toggle('hide', !noCompra); };

  // Guarda la oportunidad; resultado vacío = sigue abierta (el pedido la cierra al guardarse)
  const guardar = async res => {
    const t = q(), tel = /^[+\d\s]{6,}$/.test(t);
    const nombre = cliente ? cliente.nombre : (tel ? '' : t) || l.nombre || '', telefono = cliente ? (cliente.movil || cliente.telefono || cliente.tel || '') : (tel ? t : l.telefono || '');
    const conSeg = res && res !== 'Pedido hecho';
    const { data: r, error } = await db.rpc('guardar_llamada', { p: { id: l.id || null, fecha: $('nvf') && $('nvf').value ? new Date($('nvf').value).toISOString() : l.fecha,
      nombre, telefono, contacto_id: cliente ? cliente.id : null, cuenta_id: medico ? medico.id : null,
      cuenta_texto: medico ? '' : (($('nvmed') || {}).__texto || '').trim(), origen, motivo, resultado: res || '',
      proxima_fecha: conSeg && $('nvpf') ? $('nvpf').value : '', proxima_accion: conSeg && $('nvpa') ? $('nvpa').value.trim() : '',
      nota: $('nvno') ? $('nvno').value.trim() : (l.nota || ''), pedido_id: l.pedido_id || null, llamada_origen: previa ? previa.id : (l.llamada_origen || null),
      interes: lineas.filter(x => x.producto_id && +x.unidades > 0).map(x => ({ producto_id: x.producto_id, unidades: +x.unidades })) } });
    if (error || !r || r.ok === false) { toast('No se ha podido guardar' + (error ? ': ' + error.message : r && r.motivo === 'extra' ? ': tu organización no tiene el registro de oportunidades' : ''), true); return null; }
    return r;
  };
  const refrescar = () => { if (TAB === 'ventas' && PEDSEC === 'llamadas') pintarLlamadas(); };
  if ($('nvped')) $('nvped').onclick = async ev => {
    if (!cliente) { toast('Busca el cliente o crea su ficha para hacer el pedido', true); return; }
    ev.target.disabled = true;
    let r = null;
    if (reg) { r = await guardar(''); if (!r) { ev.target.disabled = false; return; } }
    const { data: c } = await db.from('contactos').select('id,nombre,nif,email,telefono,movil,cuenta_id').eq('id', cliente.id).maybeSingle();
    $('dlg').close(); refrescar();
    if (r) LLAMADA_PEND = r.id;
    const ls = reg ? lineas.filter(x => x.producto_id && +x.unidades > 0).map(x => { const p = PRODUCTOS.find(y => y.id === x.producto_id) || {};
      return { producto_id: x.producto_id, unidades: +x.unidades, importe: p.precio != null ? r2(p.precio * x.unidades) : null }; }) : [];
    await editorPedido({ contacto: Object.assign(c || cliente, { medico: medico ? medico.nombre : '' }), medico: medico ? { id: medico.id, nombre: medico.nombre } : null,
      lineas: ls.length ? ls : undefined, origen: /web/i.test(origen) ? 'web' : undefined });
  };
  if ($('nvnook')) $('nvnook').onclick = async ev => {
    if (!resultado) { toast('Marca por qué no compra', true); return; }
    if (!cliente && !q() && !l.nombre && !l.telefono) { toast('Apunta al menos su nombre o su teléfono', true); return; }
    ev.target.disabled = true;
    const r = await guardar(resultado);
    ev.target.disabled = false;
    if (!r) return;
    $('dlg').close(); toast('Oportunidad guardada sin pedido'); refrescar();
  };
  if ($('nvguar')) $('nvguar').onclick = async () => {
    const r = await guardar(cerrada ? (l.resultado || 'Pedido hecho') : noCompra ? resultado : '');
    if (!r) return;
    $('dlg').close(); toast('Oportunidad guardada'); refrescar();
  };
}
