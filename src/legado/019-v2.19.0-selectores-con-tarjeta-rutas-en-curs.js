/* ============================================================
   DLC OS 2.0 · v2.19.0 · Selectores con tarjeta, rutas en curso,
   Pacientes y Productos como módulos, comerciales en el directorio,
   cambios sin guardar y protección de datos
   ============================================================ */


/* ---------------- fechas y horas: todo el campo abre el selector ---------------- */

document.addEventListener('click', e => {
  const i = e.target.closest('input[type=date], input[type=time], input[type=month], input[type=week], input[type=datetime-local]');
  if (i && !i.disabled && !i.readOnly && typeof i.showPicker === 'function') { try { i.showPicker(); } catch (err) {} }
});

/* ---------------- protección de datos: sin descargas ---------------- */

['__dlDir', '__dlSeg', '__dlAn'].forEach(k => { try { delete window[k]; } catch (e) { window[k] = undefined; } });

/* ---------------- buscador superior: se limpia al elegir ---------------- */

document.addEventListener('click', e => {
  if (!e.target.closest('#gsug [data-gm], #gsug [data-gc], #gsug [data-gme]')) return;
  setTimeout(() => {
    $('q').value = '';
    $('q').closest('.gsearch').classList.remove('buscando');
    $('q').blur();
  }, 0);
});

/* ---------------- ventanas con cambios sin guardar ---------------- */

['dlg', 'dlg2'].forEach(id => {
  const d = $(id);
  d.addEventListener('input', e => { if (!e.target.closest('[data-nosucio]')) d.dataset.sucio = '1'; });
  d.addEventListener('change', e => { if (!e.target.closest('[data-nosucio]')) d.dataset.sucio = '1'; });
  d.addEventListener('close', () => { delete d.dataset.sucio; });
  d.addEventListener('cancel', e => { e.preventDefault(); intentarCerrar(d); });
});


/* ---------------- selector de médico (igual que el buscador principal) ---------------- */


document.addEventListener('pointerdown', e => { if (!e.target.closest('.picker')) cerrarPickers(); });


/* ---------------- selector de paciente ---------------- */



/* ---------------- nueva cita con el selector de médico ---------------- */

async function nuevaCita(medicoId, fecha) {
  let elegido = null;
  if (medicoId) {
    const { data } = await db.rpc('ficha_cuenta', { p_id: medicoId });
    const m = data && data.medico, c = data && (data.consultas || [])[0];
    if (m) elegido = Object.assign({}, m, { centro_nombre: c ? c.centro_nombre : '', municipio: c ? c.municipio : '' });
  }
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Nueva cita</h2><div class="sm">Se añade a tu agenda</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label>${TT('medico', 's', '', 'l', 'C')}</label><div id="ncsel"></div>
    <div class="g2">
      <div><label for="ncf">Día</label><input id="ncf" type="date" value="${esc(fecha || hoyISO())}"></div>
      <div><label for="nch">Hora</label><input id="nch" type="time"></div>
    </div>
    <label for="ncn">Nota</label><input id="ncn" placeholder="p. ej. llevar reporting">
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="ncok">Añadir a la agenda</button></div>`;
  selectorMedico($('ncsel'), { valor: elegido, alElegir: m => { elegido = m; } });
  $('ncok').onclick = async ev => {
    if (!elegido) { toast(`Elige ${TT('medico', 's', 'un', 'l', 'l')}`, true); return; }
    const decision = await citaRepetida(elegido.id, $('ncf').value);
    if (!decision) return;
    ev.target.disabled = true;
    const r = await escribir('guardar_cita', { p: {
      cuenta_id: elegido.id, fecha: $('ncf').value, hora: $('nch').value || null,
      centro_nombre: elegido.centro_nombre || elegido.centro || null, estado: 'Planificada', origen: 'Agenda',
      usuario_id: TAB === 'agenda' && AG_VISTA ? AG_VISTA.id : null,
      nota: $('ncn').value.trim(), op_id: 'c-' + elegido.id + '-' + $('ncf').value + '-' + Date.now()
    }});
    ev.target.disabled = false;
    if (r.error) { toast('No se ha podido: ' + r.error.message, true); return; }
    $('dlg').close(); toast('Cita añadida'); if (TAB === 'agenda') cargarAgenda(); cargarInicio();
  };
  $('dlg').showModal();
}

/* ---------------- documento de identidad ---------------- */


/* ---------------- alta y edición de paciente ---------------- */

function editorContacto(c, alGuardar, op) {
  c = c || {}; op = op || {};
  // v2.119.0: en un cliente nuevo, desplegable «Registro de llamada» (abierto si se viene de registrar una llamada)
  const conLlamada = !c.id && !!op.llamada;   // v2.125.0: solo si se viene de una llamada antigua; el recorrido es «Nueva venta»
  let tipo = c.tipo || 'Persona';
  let medico = c.cuenta_id ? { id: c.cuenta_id, nombre: c.medico || `${TT('medico', 's', '', 'l', 'C', 'asignado')}`, codigo: c.medico_codigo || '' } : null;
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>${c.id ? `Editar ${TT('paciente', 's', '', 'l', 'l')}` : `${TT('paciente', 's', 'nuevo', 'C', 'l')}`}</h2>
      <div class="sm">Datos de entrega y facturación</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <div class="subnav" style="margin:6px 0 4px"><button type="button" data-ktipo="Persona" aria-pressed="${tipo === 'Persona'}">Persona</button>
      <button type="button" data-ktipo="Empresa" aria-pressed="${tipo === 'Empresa'}">Empresa</button></div>
    <div class="g2">
      <div><label for="konom" id="konoml">${tipo === 'Empresa' ? 'Razón social' : 'Nombre y apellidos'}</label><input id="konom" value="${esc(c.nombre || '')}"></div>
      <div><label for="konif" id="konifl">${tipo === 'Empresa' ? 'CIF' : 'DNI o NIE'}</label>
        <input id="konif" value="${esc(c.nif || '')}" placeholder="${tipo === 'Empresa' ? 'B12345678' : '12345678Z'}" autocapitalize="characters">
        <div class="sm" id="konifm" style="margin-top:4px"></div></div>
    </div>
    <label>${TT('medico', 's', '', 'l', 'C')} que lo trata</label><div id="kosel"></div>
    <div class="sm" style="margin-top:4px" id="komsm">Las unidades de sus pedidos se atribuyen a ${TT('medico', 's', 'este', 'l', 'l')} y a su comercial.</div>
    ${puedeMedicoLibre() ? `<label class="opt prepbox"><input type="checkbox" id="komlibre"> ${esc(TT('medico', 's', '', 'l', 'C'))} distinto en cada pedido (no se guarda en la ficha)</label>` : ''}
    <div class="g2">
      <div><label for="kodir">Dirección de entrega</label><input id="kodir" value="${esc(c.direccion || '')}"></div>
      <div><label for="kocp">Código postal</label><input id="kocp" value="${esc(c.cp || '')}" inputmode="numeric"></div>
    </div>
    <div class="g2">
      <div><label for="komun">Población</label><input id="komun" value="${esc(c.municipio || '')}"></div>
      <div><label for="kopro">Provincia</label><input id="kopro" value="${esc(c.provincia || '')}"></div>
    </div>
    <div class="g2">
      <div><label for="kotel">Teléfono</label><input id="kotel" value="${esc(c.telefono || '')}" inputmode="tel"></div>
      <div><label for="komov">Móvil</label><input id="komov" value="${esc(c.movil || '')}" inputmode="tel"></div>
    </div>
    <div class="g2">
      <div><label for="komail">Email</label><input id="komail" type="email" value="${esc(c.email || '')}"></div>
      <div id="koempw" class="${tipo === 'Empresa' ? 'koinv' : ''}"><label for="koemp">Empresa ${pmAyu('Empresa', 'Si la persona factura a nombre de una empresa, escribe aquí su nombre. Con «Empresa» arriba no hace falta.')}</label><input id="koemp" value="${esc(c.empresa || '')}"></div>
    </div>
    <label for="konota">Nota</label><input id="konota" value="${esc(c.nota || '')}">
    ${conLlamada ? llamadaAltaHTML(op.llamada) : ''}
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">
      <button class="btn sec" id="kocancel">Cancelar</button>
      <button class="btn ${conLlamada && op.llamada ? 'sec' : ''}" id="kook">${c.id ? 'Guardar' : `Crear ${TT('paciente', 's', '', 'l', 'l')}`}</button>
      ${conLlamada && op.llamada ? '<button class="btn" id="kopedido">🛒 Crear y hacer pedido</button>' : ''}</div>`;

  selectorMedico($('kosel'), { valor: medico, alElegir: m => { medico = m; } });
  // v2.329.0: clientes como un equipo comercial, con un profesional distinto en cada pedido
  let libreAntes = false;
  const libreVer = () => { const on = !!($('komlibre') && $('komlibre').checked); $('kosel').classList.toggle('hide', on); $('komsm').classList.toggle('hide', on); if ($('kosel').previousElementSibling) $('kosel').previousElementSibling.classList.toggle('hide', on); };
  if ($('komlibre')) {
    $('komlibre').onchange = libreVer;
    if (c.id) db.from('contactos').select('cuenta_por_pedido').eq('id', c.id).maybeSingle().then(({ data }) => { libreAntes = !!(data && data.cuenta_por_pedido); if ($('komlibre')) { $('komlibre').checked = libreAntes; libreVer(); } });
  }
  const revisaDoc = () => {
    const r = validarDoc($('konif').value, tipo);
    $('konifm').innerHTML = r.ok ? '' : `<span style="color:var(--danger)">${esc(r.msg)}</span>`;
    return r;
  };
  $('konif').oninput = revisaDoc;
  $('dlg2body').querySelectorAll('[data-ktipo]').forEach(b => b.onclick = () => {
    tipo = b.dataset.ktipo;
    $('dlg2body').querySelectorAll('[data-ktipo]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('konifl').textContent = tipo === 'Empresa' ? 'CIF' : 'DNI o NIE';
    $('konoml').textContent = tipo === 'Empresa' ? 'Razón social' : 'Nombre y apellidos';
    $('konif').placeholder = tipo === 'Empresa' ? 'B12345678' : '12345678Z';
    $('koempw').classList.toggle('koinv', tipo === 'Empresa');   // v2.341.0: el hueco se queda (antes desaparecía y todo lo de debajo saltaba)
    if ($('konif').value) revisaDoc();
  });
  $('kocancel').onclick = () => $('dlg2').close();
  camposInsertar($('dlg2body'), 'cliente', c.id, $('kook') && $('kook').closest('.acts'));
  if (conLlamada) llamadaAltaActivar(() => medico, op.llamada);
  const crear = async (ev, conPedido) => {
    if (!$('konom').value.trim()) { toast('Escribe el nombre', true); return; }
    const ll = conLlamada ? llamadaAltaLeer() : null;
    const cps = camposLeer($('dlg2'));
    if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
    const doc = revisaDoc();
    if (!doc.ok) { toast(tipo === 'Empresa' ? 'Revisa el CIF' : 'Revisa el DNI o NIE', true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const { data: r, error } = await db.rpc('guardar_contacto', { p: {
      id: c.id || null, nombre: $('konom').value.trim(), nif: doc.v, tipo,
      direccion: $('kodir').value.trim(), cp: $('kocp').value.trim(), municipio: $('komun').value.trim(),
      provincia: $('kopro').value.trim(), telefono: $('kotel').value.trim(), movil: $('komov').value.trim(),
      email: $('komail').value.trim(), empresa: tipo === 'Empresa' ? '' : $('koemp').value.trim(), nota: $('konota').value.trim(),
      cuenta_id: medico && !($('komlibre') && $('komlibre').checked) ? medico.id : null
    }});
    ev.target.disabled = false; ev.target.textContent = c.id ? 'Guardar' : conPedido ? '🛒 Crear y hacer pedido' : `Crear ${TT('paciente', 's', '', 'l', 'l')}`;
    if (error && /cliente_duplicado/.test(error.hint || '')) { toast(error.message, true); if ($('konif')) $('konif').dispatchEvent(new Event('input')); return; }   // v2.225.0
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    if (cps && !(await camposGuardar(cps, (r && r.contacto && r.contacto.id) || c.id))) return;
    const libre = !!($('komlibre') && $('komlibre').checked);
    if ($('komlibre') && libre !== libreAntes) {
      const { data: ml, error: me } = await db.rpc('guardar_cuenta_por_pedido', { p_id: (r && r.contacto && r.contacto.id) || c.id, p_valor: libre });
      if (me || (ml && ml.ok === false)) { toast('No se ha podido guardar la opción del profesional', true); return; }
      if (libre && r && r.contacto) r.contacto.cuenta_id = null;
    }
    if (libre) medico = null;
    $('dlg2').close(); toast(c.id ? `${TT('paciente', 's', '', 'l', 'C', 'guardado')}` : `${TT('paciente', 's', '', 'l', 'C', 'creado')}`);
    const res = Object.assign({}, r.contacto, medico ? { medico: medico.nombre, medico_codigo: medico.codigo } : {});
    // v2.119.0: la llamada queda registrada con el cliente recién creado (si se ha apuntado algo o se viene de una llamada)
    let lid = null;
    if (ll && (conPedido || ll.motivo || ll.resultado || ll.nota || op.llamada)) lid = await llamadaAltaGuardar(ll, { contacto_id: res.id, nombre: res.nombre,
      telefono: res.movil || res.telefono || '', medico, resultado: conPedido ? (ll.resultado || 'Pedido hecho') : ll.resultado }, op.llamada);
    if (conPedido) {
      if (lid) LLAMADA_PEND = lid;
      await editorPedido({ contacto: res, medico: medico ? { id: medico.id, nombre: medico.nombre } : null });
      return;
    }
    if (alGuardar) alGuardar(res);
    if (TAB === 'pacientes') listaPacientes();
    if (lid && TAB === 'ventas' && PEDSEC === 'llamadas') pintarLlamadas();
  };
  $('kook').onclick = ev => crear(ev, false);
  if ($('kopedido')) $('kopedido').onclick = ev => crear(ev, true);
  // «No compra»: solo la llamada, sin crear el cliente, con lo apuntado de él
  if ($('kosolo')) $('kosolo').onclick = async ev => {
    const ll = llamadaAltaLeer();
    const nombre = $('konom').value.trim(), telefono = $('komov').value.trim() || $('kotel').value.trim();
    if (!nombre && !telefono) { toast('Apunta al menos su nombre o su teléfono', true); return; }
    ev.target.disabled = true;
    const datos = { tipo, nif: $('konif').value.trim(), email: $('komail').value.trim(), direccion: $('kodir').value.trim(), cp: $('kocp').value.trim(),
      municipio: $('komun').value.trim(), provincia: $('kopro').value.trim(), empresa: $('koemp').value.trim(), nota: $('konota').value.trim() };
    Object.keys(datos).forEach(k => { if (!datos[k]) delete datos[k]; });
    const lid = await llamadaAltaGuardar(ll, { contacto_id: null, nombre, telefono, medico, resultado: ll.resultado, datos }, op.llamada);
    ev.target.disabled = false;
    if (!lid) return;
    $('dlg2').close(); toast('Llamada registrada (sin crear cliente)');
    if (TAB === 'ventas' && PEDSEC === 'llamadas') pintarLlamadas();
  };
  $('dlg2').showModal();
}

/* ---------------- módulos Pacientes y Productos ---------------- */




// Ventas queda solo con los pedidos

// Visibilidad de los módulos nuevos según permisos

/* ---------------- directorio: comerciales ---------------- */

$('fcom').addEventListener('change', e => { F.com = e.target.value; buscar(true); });

COLS.push({ k: 'comerciales', t: 'Comerciales', w: 190 });
function colsConfig() {
  let g = null;
  try { g = JSON.parse(localStorage.getItem(colKey()) || 'null'); } catch (e) {}
  if (!g || !g.length) g = COLS.map(c => ({ k: c.k, on: COLS_DEF.includes(c.k) || (c.k === 'comerciales' && VE_TODO()), w: c.w }));
  COLS.forEach(c => { if (!g.some(x => x.k === c.k)) g.push({ k: c.k, on: c.k === 'comerciales' && VE_TODO(), w: c.w }); });
  return g.filter(x => x.k !== 'comerciales' || VE_TODO());
}
function celda(m, k) {
  if (k === 'nombre') return `<span class="nm">${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</span>`;
  if (k === 'dias') return `<span class="dias">${['L', 'M', 'X', 'J', 'V'].map(d =>
    `<span class="${(m.dias || {})[d] ? 'on' : ''}" title="${esc((m.dias || {})[d] || '')}">${d}</span>`).join('')}</span>`;
  if (k === 'estado_comercial') return `<span class="pill p-est">${esc(m.estado_comercial)}</span>`;
  if (k === 'ultima_visita') return `<span class="sm">${m.ultima_visita ? fechaCorta(m.ultima_visita) : '—'}</span>`;
  if (k === 'telefono') return `<span class="sm">${esc(m.telefono || m.consulta_telefono || '')}</span>`;
  if (k.startsWith('cp:')) { const cl = k.slice(3); return `<span class="sm">${esc(campoTexto((CAMPOS.medico || []).find(x => x.clave === cl), (m.clasificadores || {})[cl]))}</span>`; }
  if (k === 'comerciales') {
    const c = m.comerciales || [];
    return `<span class="comchips">${c.length ? c.map(x => `<span>${esc(nombrePila(x.nombre))}</span>`).join('') : '<span class="sin">Sin asignar</span>'}</span>`;
  }
  return `<span class="sm">${esc(m[k] || '')}</span>`;
}


/* ---------------- ficha del médico: comercial en «Editar ficha» ---------------- */

abrirEditor = (orig => async function (id, tipo) {
  await orig(id, tipo);
  if (!id || !puede('administrar') || !$('eguardar')) return;
  const acts = $('eguardar').closest('.acts');
  acts.insertAdjacentHTML('beforebegin', `<label for="ecom">Comercial asignado</label>
    <select id="ecom"><option>Cargando…</option></select>
    <div class="sm" style="margin-top:4px">Las ventas nuevas se atribuyen al comercial asignado en ese momento.</div>`);
  if (!COMS.length) await cargarComerciales();
  const { data: act } = await RPC_ORIG('responsable_de_cuenta', { p_medico: id });
  const antes = act ? act.id : '';
  $('ecom').innerHTML = '<option value="">Sin comercial</option>' + COMS.filter(u => rolPuede(u.rol, 'cartera') || u.id === antes).map(u =>
    `<option value="${u.id}" ${u.id === antes ? 'selected' : ''}>${esc(u.nombre)} · ${esc(u.rol)}</option>`).join('');
  $('eguardar').addEventListener('click', async () => {
    const ahora = $('ecom') ? $('ecom').value : antes;
    if (ahora === antes) return;
    const { data: r } = await db.rpc('asignar_responsable_cuenta', { p_medico: id, p_usuario: ahora || null });
    if (r && r.ok === false) toast('No se ha podido cambiar el comercial', true);
  });
})(abrirEditor);

/* ---------------- administración: asignar cartera viendo la lista ---------------- */

async function asignarCartera(id) {
  const u = USUARIOS.find(x => x.id === id); if (!u) return;
  const { data: op } = await db.rpc('opciones_filtros', {});
  const sel = lista => '<option value=""></option>' + ((lista || []).map(o => `<option value="${esc(o.v)}">${esc(o.v)} (${o.n})</option>`).join(''));
  const fuera = new Set();
  let total = 0, pagina = 0;
  $('dbody').innerHTML = `<div data-nosucio>
    <div class="fh"><div><h2>Cartera de ${esc(u.nombre)}</h2>
      <div class="sm">Ahora tiene ${num(u.medicos)} ${TT('medico', 'p', '', 'l', 'l', 'asignado')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <p class="sm">Elige los filtros, revisa la lista y desmarca los que no quieras.</p>
    <div class="g2">
      <div><label for="aprov">Provincia</label><select id="aprov">${sel(op.provincias)}</select></div>
      <div><label for="amuni">Municipio</label><select id="amuni">${sel(op.municipios)}</select></div></div>
    <div class="g2">
      <div><label for="aesp">${TT('especialidad', 's', '', 'l', 'C')}</label><select id="aesp">${sel(op.especialidades)}</select></div>
      <div><label for="aest">Estado</label><select id="aest">${sel(op.estados)}</select></div></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="aurg"> Solo urgentes</label>
    <div id="amsg" class="cuenta" style="padding:10px 0 0"></div>
    <div id="alista"></div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" id="aquitar">Quitar seleccionados</button>
      <button class="btn" id="aasignar">Asignar seleccionados</button></div></div>`;

  const filtros = () => ({ f_provincia: $('aprov').value || null, f_municipio: $('amuni').value || null,
    f_especialidad: $('aesp').value || null, f_estado: $('aest').value || null, f_urgentes: $('aurg').checked });
  const cuenta = () => {
    $('amsg').innerHTML = `<b>${num(total - fuera.size)}</b> seleccionados de ${num(total)} con estos filtros
      ${fuera.size ? ` · <button class="kcfg" id="atodos">volver a marcar todos</button>` : ''}`;
    if ($('atodos')) $('atodos').onclick = () => { fuera.clear(); pinta(); };
  };
  const pinta = async () => {
    cargando($('alista'), `Buscando ${TT('medico', 'p', '', 'l', 'l')}…`);
    const { data } = await db.rpc('buscar_cuentas', Object.assign({ q: null, f_area: null, f_mios: false, f_sin_visitar: false,
      orden: 'nombre', lim: 50, desplaz: pagina * 50 }, filtros()));
    total = data ? data.total : 0;
    const f = (data && data.filas) || [];
    $('alista').innerHTML = `<div class="carsel">${f.map(m => `<label class="item" style="cursor:pointer;margin:0">
        <input type="checkbox" data-am="${m.id}" ${fuera.has(m.id) ? '' : 'checked'}>
        <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc([m.especialidad, m.centro_nombre, m.municipio].filter(Boolean).join(' · '))}</span></span>
        <span class="comchips">${(m.comerciales || []).map(x => `<span>${esc(nombrePila(x.nombre))}</span>`).join('') || '<span class="sin">Sin asignar</span>'}</span>
      </label>`).join('') || `<div class="vacio">${TT('medico', 's', 'ningun', 'C', 'l')} con estos filtros.</div>`}</div><div id="apag"></div>`;
    $('alista').querySelectorAll('[data-am]').forEach(c => c.onchange = () => { if (c.checked) fuera.delete(c.dataset.am); else fuera.add(c.dataset.am); cuenta(); });
    $('apag').innerHTML = total > 50 ? pagHTML(total, pagina, 50).replace(/<span class="ptam">[\s\S]*?<\/span><\/div>$/, '</div>') : '';
    $('apag').querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { pagina = +b.dataset.pg; pinta(); });
    cuenta();
  };
  ['aprov', 'amuni', 'aesp', 'aest', 'aurg'].forEach(k => $(k).onchange = () => { pagina = 0; fuera.clear(); pinta(); });

  const aplicar = async (quitar, ev) => {
    const ids = ((await db.rpc('ids_filtrados', filtros())).data || []).filter(x => !fuera.has(x));
    if (!ids.length) { toast(`No hay ${TT('medico', 's', 'ningun', 'l', 'l', 'seleccionado')}`, true); return; }
    if (!await preguntar(`Se van a ${quitar ? 'quitar' : 'asignar'} ${num(ids.length)} ${TT('medico', 'p', '', 'l', 'l')} ${quitar ? 'de' : 'a'} ${u.nombre}.`,
      { titulo: quitar ? 'Quitar cartera' : 'Asignar cartera', ok: quitar ? 'Quitar' : 'Asignar', peligro: quitar })) return;
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('asignar_cartera', { p: { usuario_id: id, medicos: ids, quitar } });
    ev.target.disabled = false;
    if (error || (r && r.ok === false)) { toast('No se ha podido: ' + ((error && error.message) || 'sin permiso'), true); return; }
    toast(`${num(r.filas)} ${TT('medico', 'p', '', 'l', 'l')} ${quitar ? 'retirados' : 'asignados'}${r.movidos ? ` · ${num(r.movidos)} salieron de otra cartera (cartera exclusiva)` : ''}`);
    $('dlg').close(); cargarAdmin();
  };
  $('aasignar').onclick = ev => aplicar(false, ev);
  $('aquitar').onclick = ev => aplicar(true, ev);
  $('dlg').showModal();
  pinta();
}

/* ---------------- rutas: plan desde ahora, ruta en curso, pausar y reanudar ---------------- */

// v2.242.0: aquí iba rutaPausada (nadie la usaba)









// Tras registrar una visita, se actualizan la barra y la lista de la ruta
$('dlg').addEventListener('close', () => {
  if (!rutaActiva()) return;
  setTimeout(() => { pintarRutaBarra(); pintarRutaEnCurso(); }, 400);
});

/* ---------------- ayudas actualizadas ---------------- */

Object.assign(AYUDA, {
  directorio: ['Directorio', `Todos ${TT('medico', 'p', 'el', 'l', 'l')} que puedes ver.`, [
    'El buscador de arriba filtra por nombre, centro o municipio.',
    `El municipio y la provincia cuentan ${todosLos('consulta').toLowerCase()} ${TT('medico', 's', 'del', 'l', 'l')}, no solo la principal.`,
    `Administración y televenta ven los comerciales de cada ${TT('medico', 's', '', 'l', 'l')} y pueden filtrar por comercial.`,
    '«⋮» abre los filtros y las columnas.',
    '«★ Guardar filtro» convierte los filtros actuales en un indicador de Inicio.',
    '«Cerca de mí» usa la ubicación del dispositivo.']],
  seguimiento: ['Seguimiento', `Cómo avanza cada ${TT('medico', 's', '', 'l', 'l')}.`, [
    'Los indicadores de arriba muestran el embudo por estado comercial y la calidad de los datos.',
    '«Mostrar» filtra por visitados, sin visitar, con próxima acción o atrasados.',
    '«Hecha» cierra la próxima acción; «Aplazar» le pone otra fecha.']],
  analitica: ['Analítica', 'Unidades o importe agrupados como elijas.', [
    `Elige la dimensión: ${TT('medico', 's', '', 'l', 'l')}, comercial, producto, municipio, mes o canal.`,
    'La tabla por meses sirve para ver tendencias.',
    'Los datos no se pueden descargar: se consultan solo dentro de la plataforma.']],
  rutas: ['Rutas', 'Crea rutas y conviértelas en el plan del día.', [
    `<b>Lista fija</b>: tú eliges ${TT('medico', 'p', 'el', 'l', 'l')}. <b>Por criterios</b>: se rellena sola con los filtros.`,
    'El plan ordena las paradas por cercanía y calcula las horas con tu horario. Si ya ha pasado tu hora de salida, empieza a contar desde ahora.',
    `Al pulsar <b>Empezar ruta</b> verás la lista de paradas con el botón <b>Registrar ${TT('visita', 's', '', 'l', 'l')}</b> en cada ${TT('medico', 's', '', 'l', 'l')}. «Cómo llegar» abre el navegador solo cuando tú lo pides.`,
    '<b>Pausar</b> guarda los pendientes para seguir otro día; al reanudar se recalculan orden y horas.',
    `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación. Completar la dirección y los días de atención mejora mucho las rutas.`]],
  pacientes: [`${TT('paciente', 'p', '', 'l', 'C')}`, `Las personas que compran con ${TT('medico', 's', 'un', 'l', 'l')} de referencia.`, [
    `Cada ${TT('paciente', 's', '', 'l', 'l')} tiene un <b>${TT('medico', 's', '', 'l', 'l')} que lo trata</b>: se elige al darlo de alta o se asigna solo con su primer pedido.`,
    'Para una persona se pide el DNI o NIE; para una empresa, el CIF. La app comprueba que la letra o el control sean correctos.',
    `Desde la ficha ves sus pedidos y creas uno nuevo con ${TT('medico', 's', 'el', 'l', 'l')} ya puesto.`]],
  productos: ['Productos', 'El catálogo que se usa en pedidos, muestras y analítica.', [
    'Escribe el precio sin IVA o con IVA: el otro se calcula con el IVA del producto.',
    'Un producto inactivo no aparece al crear pedidos, pero se conserva en el histórico.']],
  ventas: ['Ventas', 'Pedidos y unidades atribuidas.', [
    'Los pedidos se guardan como <b>borrador</b> (editable y se puede eliminar; no cuenta en métricas) o se <b>confirman</b> (cuenta en métricas y comisiones; solo se puede anular).',
    'Importes sin IVA; el IVA de cada producto se suma aparte.',
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y al comercial que lo tenía asignado en ese momento.`,
    'La venta a centro se atribuye a la ficha del centro, si la tiene; si no, a nadie.']]
});
ANCLAS_AYUDA.push(['#v-pacientes .saludo h1', 'pacientes'], ['#v-productos .saludo h1', 'productos'], ['#renc .card > h2', 'rutas']);


