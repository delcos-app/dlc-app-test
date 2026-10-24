/* ============================================================
   DLC OS 2.0 · v2.38.0 · Llamada → cliente → pedido en un solo flujo,
   seguimientos de quien no compra, análisis por comercial, personas
   del esquema de comisión dentro del propio esquema, producto habitual
   en los pedidos nuevos y selector de fecha junto a su campo
   ============================================================ */

Object.assign(RPC_TTL, { llamadas_seguimiento: 20 });

/* ---------------- pedidos: producto habitual y líneas siempre con su producto ---------------- */

// (v2.183.0: aquí iba la primera versión de productoPorDefecto; se redefine entera más abajo)
// (v2.183.0: aquí iba la primera versión de opcionesProducto; se redefine entera más abajo)
// Se recuerda el producto del último pedido guardado para proponerlo en el siguiente
const RPC_V2370 = db.rpc;
db.rpc = function (fn, params, opts) {
  const b = RPC_V2370.call(db, fn, params, opts);
  if (fn !== 'guardar_pedido') return b;
  try { const l = ((params || {}).p || {}).lineas || []; if (l[0] && l[0].producto_id) localStorage.setItem('dlc-prod-habitual', l[0].producto_id); } catch (e) {}
  if (!LLAMADA_PEND) return b;
  // Pedido creado desde una llamada: queda enlazado con ella
  return conCatch(Promise.resolve(b).then(async res => {
    if (!res.error && res.data && res.data.ok && res.data.id && LLAMADA_PEND) {
      await RPC_ORIG('vincular_llamada_pedido', { p_llamada: LLAMADA_PEND, p_pedido: res.data.id });
      LLAMADA_PEND = null; toast('Pedido enlazado con la llamada');
    }
    return res;
  }));
};

/* ---------------- selector de fecha: siempre junto a su campo ---------------- */

colocarPop = (orig => function (pop, ref) {
  const d = $('seldlg');
  // v2.87.0: en móvil es una hoja pegada abajo (su estilo ya la coloca); junto al campo solo en escritorio
  if (ES_MOVIL()) { d.style.right = ''; d.style.bottom = ''; } else { d.style.right = 'auto'; d.style.bottom = 'auto'; }
  if (!d.open) d.__abierto = Date.now();
  orig(pop, ref);
})(colocarPop);

/* ---------------- llamadas: cliente, médico, resultado y pedido en un flujo ---------------- */


async function editorLlamada(l, previa) {
  await catLlamadas();
  l = l || { direccion: 'Entrante', fecha: new Date().toISOString() };
  let cliente = l.contacto_id ? { id: l.contacto_id, nombre: l.cliente || l.nombre } : null, nuevo = !cliente && !l.id;
  let medico = l.cuenta_id ? { id: l.cuenta_id, nombre: l.medico } : null;
  const f = new Date(l.fecha), local = new Date(f.getTime() - f.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const chips = (cat, v, attr) => (CAT[cat] || []).map(x => `<button type="button" class="chipsel ${x.valor === v ? 'on' : ''} ${x.extra === 'neg' ? 'neg' : x.extra === 'pos' ? 'pos' : ''}" ${attr}="${esc(x.valor)}">${esc(x.valor)}</button>`).join('');
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${l.id ? 'Llamada' : previa ? 'Seguimiento de la llamada' : 'Registrar llamada'}</h2>
      <div class="sm">${previa ? 'Vuelves a llamar a ' + esc(previa.cliente || previa.nombre || '') : 'Aunque no acabe en pedido: así se ve por qué no compran'}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="llpaso"><span class="lln">1</span><b>Quién llama</b>
      <div class="segm2"><button type="button" data-lmodo="exist" class="${nuevo ? '' : 'on'}">Cliente existente</button><button type="button" data-lmodo="nuevo" class="${nuevo ? 'on' : ''}">Cliente nuevo</button></div>
      <div id="llcli"></div></div>
    <div class="llpaso"><span class="lln">2</span><b>${TT('medico', 's', '', 'l', 'C')} de referencia</b><div id="llmed"></div>
      <div class="sm" style="margin-top:4px">Si no está en la base, escribe su nombre: se guarda igualmente para las métricas.</div></div>
    <div class="llpaso"><span class="lln">3</span><b>Motivo</b><div class="chipsw" id="llmot">${chips('motivo_llamada', l.motivo, 'data-lm')}</div></div>
    <div class="llpaso"><span class="lln">4</span><b>Resultado</b><div class="chipsw" id="llres">${chips('resultado_llamada', l.resultado, 'data-lr')}</div>
      <div id="llseg" class="${!l.resultado || l.resultado === 'Pedido hecho' ? 'hide' : ''}">
        <div class="sm" style="margin:8px 0 4px">¿Cuándo volver a llamar?</div>
        <div class="chipsw">${[['Mañana', 1], ['En 3 días', 3], ['En una semana', 7], ['En un mes', 30]].map(([t, d]) => `<button type="button" class="chipsel" data-ld="${d}">${t}</button>`).join('')}</div>
        <div class="g2" style="margin-top:6px"><div><input id="llpf" type="date" value="${esc(l.proxima_fecha || '')}"></div>
          <div><input id="llpa" value="${esc(l.proxima_accion || '')}" placeholder="p. ej. Enviarle el precio por WhatsApp"></div></div></div></div>
    <details class="llmas"><summary>Más detalles</summary>
      <div class="g2"><div><label for="llf">Fecha y hora</label><input id="llf" type="datetime-local" value="${local}"></div>
        <div><label for="lld">Tipo</label><select id="lld"><option ${l.direccion === 'Entrante' ? 'selected' : ''}>Entrante</option><option ${l.direccion === 'Saliente' || previa ? 'selected' : ''}>Saliente</option></select></div></div>
      <label for="llno">Nota</label><textarea id="llno" rows="2">${esc(l.nota || '')}</textarea></details>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn sec" id="llok">Guardar</button>${l.pedido_id ? '' : '<button class="btn" id="llped">🛒 Guardar y crear pedido</button>'}</div>`;
  $('dlg').showModal();
  let motivo = l.motivo || '', resultado = l.resultado || '';
  const pintaCli = () => {
    const c = $('llcli');
    if (nuevo) {
      // v2.119.0: un cliente nuevo se rellena siempre en su ficha completa (antes, cuatro campos y un cliente a medias)
      c.innerHTML = `<button type="button" class="btn" id="llalta">Rellenar los datos del cliente nuevo</button>
        <div class="sm" style="margin-top:6px">Se abre su ficha completa con esta llamada: si compra, queda dado de alta con todos sus datos; si no, se guarda solo la llamada con lo apuntado.</div>`;
      $('llalta').onclick = () => aAltaCompleta();
    } else if (cliente) {
      c.innerHTML = `<div class="clisel"><span><b>${esc(cliente.nombre)}</b><span class="sm">${esc(cliente.tel || cliente.telefono || '')}</span></span><button type="button" class="btn sec" id="lccambia">Cambiar</button></div>`;
      $('lccambia').onclick = () => { cliente = null; pintaCli(); };
    } else {
      c.innerHTML = `<input id="lcq" type="search" placeholder="Nombre, teléfono o DNI" autocomplete="off"><div class="lista" id="lcres"></div>`;
      let tq;
      $('lcq').oninput = () => { clearTimeout(tq); tq = setTimeout(async () => {
        const r = await buscarClientes($('lcq').value);
        $('lcres').innerHTML = r.map(x => `<button type="button" class="item" data-lcid="${x.id}"><span class="tx"><b>${esc(x.nombre)}</b><span class="sm">${esc([x.movil || x.telefono, x.nif].filter(Boolean).join(' · '))}</span></span></button>`).join('')
          || ($('lcq').value.trim().length > 1 ? '<div class="sm" style="padding:6px">No existe: usa «Cliente nuevo».</div>' : '');
        $('lcres').querySelectorAll('[data-lcid]').forEach(b => b.onclick = async () => {
          const x = r.find(y => y.id === b.dataset.lcid); cliente = { id: x.id, nombre: x.nombre, tel: x.movil || x.telefono };
          if (x.cuenta_id && !medico) { const { data: m } = await db.from('cuentas').select('id,nombre').eq('id', x.cuenta_id).single(); if (m) { medico = m; pintaMed(); } }
          pintaCli();
        });
      }, 250); };
    }
  };
  const pintaMed = () => { $('llmed').innerHTML = ''; $('llmed').__texto = medico ? '' : (l.cuenta_texto || ''); selectorMedico($('llmed'), { valor: medico, placeholder: 'Nombre, código, centro o municipio', alElegir: m => { medico = m; } }); };
  pintaCli(); pintaMed();
  $('dbody').querySelectorAll('[data-lmodo]').forEach(b => b.onclick = () => { nuevo = b.dataset.lmodo === 'nuevo'; if (!nuevo) cliente = null;
    $('dbody').querySelectorAll('[data-lmodo]').forEach(x => x.classList.toggle('on', x === b)); pintaCli(); });
  $('llmot').onclick = e => { const b = e.target.closest('[data-lm]'); if (!b) return; motivo = motivo === b.dataset.lm ? '' : b.dataset.lm;
    $('llmot').querySelectorAll('[data-lm]').forEach(x => x.classList.toggle('on', x.dataset.lm === motivo)); };
  const pasoRes = $('llres').closest('.llpaso');
  pasoRes.onclick = e => {
    const d = e.target.closest('[data-ld]');
    if (d) { const f2 = new Date(); f2.setDate(f2.getDate() + +d.dataset.ld); $('llpf').value = fechaLocal(f2); pasoRes.querySelectorAll('[data-ld]').forEach(x => x.classList.toggle('on', x === d)); return; }
    const b = e.target.closest('[data-lr]'); if (!b) return; resultado = resultado === b.dataset.lr ? '' : b.dataset.lr;
    $('llres').querySelectorAll('[data-lr]').forEach(x => x.classList.toggle('on', x.dataset.lr === resultado));
    $('llseg').classList.toggle('hide', !resultado || resultado === 'Pedido hecho');
  };
  // Pasa a la ficha completa del cliente nuevo con lo ya marcado en la llamada
  const aAltaCompleta = () => {
    const est = { motivo, resultado, nota: $('llno').value.trim(), direccion: $('lld').value, fecha: $('llf').value ? new Date($('llf').value).toISOString() : null,
      proxima_fecha: $('llpf') ? $('llpf').value : '', proxima_accion: $('llpa') ? $('llpa').value.trim() : '', previa: previa ? previa.id : null, id: l.id || null,
      cuenta_texto: medico ? '' : ($('llmed').__texto || '').trim() };
    $('dlg').close();
    editorContacto(medico ? { cuenta_id: medico.id, medico: medico.nombre } : {}, null, { llamada: est });
  };
  const guardar = async conPedido => {
    if (conPedido && nuevo) { aAltaCompleta(); return null; }
    const datosNuevo = nuevo && $('lcn') ? { nombre: $('lcn').value.trim(), telefono: $('lct').value.trim(), email: $('lce').value.trim(), nif: $('lcd').value.trim() } : null;
    if (conPedido && !cliente && !(datosNuevo && datosNuevo.nombre)) { toast('Indica el cliente: búscalo o escribe su nombre', true); return null; }
    const { data: r, error } = await db.rpc('guardar_llamada', { p: { id: l.id || null, fecha: $('llf').value ? new Date($('llf').value).toISOString() : null,
      direccion: $('lld').value, nombre: datosNuevo ? datosNuevo.nombre : (cliente ? cliente.nombre : l.nombre || ''), telefono: datosNuevo ? datosNuevo.telefono : (cliente ? cliente.tel || '' : l.telefono || ''),
      contacto_id: cliente ? cliente.id : null, cliente_nuevo: conPedido ? datosNuevo : null, cuenta_id: medico ? medico.id : null,
      cuenta_texto: medico ? '' : ($('llmed').__texto || '').trim(), motivo, resultado: conPedido ? (resultado || 'Pedido hecho') : resultado,
      proxima_accion: $('llpa') ? $('llpa').value.trim() : '', proxima_fecha: resultado && resultado !== 'Pedido hecho' && !conPedido ? ($('llpf').value || '') : '',
      nota: $('llno').value.trim(), pedido_id: l.pedido_id || null, llamada_origen: previa ? previa.id : null } });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar' + (error ? ': ' + error.message : ''), true); return null; }
    return r;
  };
  $('llok').onclick = async () => { const r = await guardar(false); if (!r) return; $('dlg').close(); toast('Llamada registrada'); if (TAB === 'ventas' && PEDSEC === 'llamadas') pintarLlamadas(); };
  if ($('llped')) $('llped').onclick = async () => {
    const r = await guardar(true); if (!r) return;
    LLAMADA_PEND = r.id;
    let cli = null;
    if (r.contacto_id) { const { data: c } = await db.from('contactos').select('id,nombre,nif,email,telefono,movil,cuenta_id').eq('id', r.contacto_id).single(); cli = c; }
    $('dlg').close();
    await editorPedido({ contacto: cli ? Object.assign(cli, { medico: medico ? medico.nombre : '' }) : null, medico: medico ? { id: medico.id, nombre: medico.nombre } : null });
  };
};

// Pestaña Llamadas: seguimientos pendientes arriba y análisis ampliado
pintarLlamadas = (orig => async function () {
  await orig();
  const { data: seg } = await RPC_ORIG('llamadas_seguimiento', {});
  const l = seg || [], hoy = hoyISO();
  if (!$('lltot')) return;
  if (l.length && !$('llsegs')) {
    $('lltot').insertAdjacentHTML('beforebegin', `<div class="card" id="llsegs"><h2>Llamadas por hacer<span class="n">${l.length}</span></h2>
      <p class="sm" style="padding:0 16px">Clientes que no compraron y a los que quedaste en volver a llamar.</p>
      <div class="lista">${l.slice(0, 20).map(x => `<div class="item" style="cursor:default">
        <span class="ic" style="${x.proxima_fecha < hoy ? 'background:#FDECEC;color:var(--dang)' : x.proxima_fecha === hoy ? 'background:#FFF4E5;color:var(--warn)' : ''}">📞</span>
        <span class="tx"><b>${esc(x.cliente || x.nombre || 'Sin nombre')}</b>
          <span class="sm">${x.proxima_fecha < hoy ? '<b style="color:var(--dang)">Atrasada · </b>' : x.proxima_fecha === hoy ? '<b style="color:var(--warn)">Hoy · </b>' : fechaCorta(x.proxima_fecha) + ' · '}${esc(x.resultado || '')}${x.proxima_accion ? ' · ' + esc(x.proxima_accion) : ''}${x.medico ? ' · de ' + esc(x.medico) : ''}</span></span>
        <span class="acts" style="margin:0;flex-wrap:nowrap">${(x.tel_cliente || x.telefono) ? `<a class="btn sec chico" href="tel:${esc(x.tel_cliente || x.telefono)}">Llamar</a>` : ''}
          <button class="btn chico" data-llseg="${x.id}">Registrar</button><button class="btn sec chico" data-llok="${x.id}" title="Ya no hace falta">✓</button></span></div>`).join('')}</div></div>`);
    $('llsegs').querySelectorAll('[data-llseg]').forEach(b => b.onclick = () => { const x = l.find(y => y.id === b.dataset.llseg);
      editorLlamada({ direccion: 'Saliente', fecha: new Date().toISOString(), contacto_id: x.contacto_id, cliente: x.cliente, nombre: x.nombre, telefono: x.telefono, cuenta_id: x.cuenta_id, medico: x.medico, motivo: 'Seguimiento de televenta' }, x); });
    $('llsegs').querySelectorAll('[data-llok]').forEach(b => b.onclick = async () => { await db.rpc('marcar_seguimiento', { p_id: b.dataset.llok, p_hecho: true }); toast('Seguimiento cerrado'); pintarLlamadas(); });
  }
  // Se espera a que la pestaña termine de pintar su análisis para añadir el resto
  for (let i = 0; i < 40 && $('llres2') && $('llres2').children.length < 2; i++) await new Promise(r => setTimeout(r, 100));
  const r = $('llper').__rango();
  const { data: s } = await RPC_ORIG('llamadas_resumen', { p_desde: r.desde, p_hasta: r.hasta });
  if (!s || !$('llres2') || $('llcom')) return;
  $('llres2').insertAdjacentHTML('beforeend', `
    <div class="card ancard" id="llcom"><h2>Por comercial ${TT('medico', 's', 'del', 'l', 'l')}</h2>${(s.por_comercial || []).length ? `<div class="barrash">${s.por_comercial.map(x => `<div class="bh"><span class="bhn">${esc(x.comercial)}</span>
        <span class="bhb"><i style="width:${Math.max(3, x.n / s.por_comercial[0].n * 100)}%"></i></span><b>${num(x.pedidos)}/${num(x.n)}</b></div>`).join('')}</div>` : vacioGrafico(`Aparecerá cuando haya llamadas con ${TT('medico', 's', '', 'l', 'l')}.`)}
      <p class="leer"><b>Cómo leerlo:</b> pedidos sobre llamadas de ${TT('paciente', 'p', '', 'l', 'l')} que vienen de ${TT('medico', 'p', '', 'l', 'l')} de cada comercial. Mide el volumen que genera el trabajo de cada zona.</p></div>
    <div class="card ancard"><h2>Por qué no compran</h2>${(s.no_compra || []).length ? barrasH(s.no_compra.map(x => ({ n: x.resultado, v: x.n })), num) : vacioGrafico('Sin llamadas sin compra en el periodo.')}
      <p class="leer"><b>Qué hacer:</b> «Precio» pide revisar condiciones o argumentario; «Se lo piensa» y «Pagará más tarde» deben tener seguimiento programado (${num(s.seguimientos || 0)} pendientes).</p></div>`);
})(pintarLlamadas);

// Accesos a «Registrar llamada» desde Pedidos (ventas) y desde la ficha del cliente

// Inicio: llamadas de seguimiento para hoy (televenta y administración)

/* ---------------- comisiones: quién cobra, dentro del propio esquema ---------------- */



// En la ficha de la persona solo se informa: el esquema se gestiona en Comisiones


