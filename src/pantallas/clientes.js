// pantallas/clientes.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Ficha · Comercial asignado (administración) y pacientes que vienen de este prescriptor

// v2.113.0 · Ficha · Cuántos clientes tiene (vinculados o que han comprado con ella). Solo números: también lo ve el comercial






const PAC = { q: '', medico: null, medicoNombre: '', pagina: 0 };



/* ============================================================
   v2.311.0 · Dar de baja y eliminar fichas (decisión de Eric; SQL 159). Al pie de la ficha de un profesional o de un centro:
   «Dar de baja» (siempre; se deshace desde Cuentas → «⋯» → «Fichas dadas de baja») y «Eliminar la ficha» (administración o
   nivel completo en fichas; solo si no tiene visitas, ventas, muestras, eventos… — si tiene, lo dice y ofrece la baja).
   ============================================================ */
const BAJA_QUE = { visitas: 'visitas', ventas: 'ventas', muestras: 'muestras entregadas', eventos: 'eventos', cirugias: 'intervenciones', concursos: 'concursos', equipos: 'equipos', portal: 'acceso al portal' };

function editorContactoBase(c, alGuardar, op) {
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


/* v2.225.0 · Clientes sin duplicados (aviso de Eric: no se puede dar de alta otra vez a un cliente con el mismo NIF/CIF, correo o móvil).
   - La base no lo deja (disparador contactos_sin_duplicados, SQL 134); aquí se avisa mientras se escribe: clientes_coincidencias con lo que
     hay en NIF, correo, móvil y teléfono (sin contar el propio cliente al editarlo).
   - Aviso #kodup encima de los botones: «Este cliente ya existe · mismo móvil», con su nombre y datos y un botón:
     «Usar este cliente» si se viene de un pedido o de una nueva venta (carga sus datos de un clic), «Ver su ficha» en el resto.
     Si lo lleva otra persona y no se puede ver, solo se dice que existe. Mientras haya coincidencia, Crear queda desactivado. */
function editorContacto(c, alGuardar, op) {
  const r = editorContactoBase.apply(this, arguments);
  c = c || {};
  if (!$('konif') || !$('kook')) return r;
  const acts = $('kook').closest('.acts');
  if (acts && !$('kodup')) acts.insertAdjacentHTML('beforebegin', '<div id="kodup" class="kodup hide" role="alert" aria-live="polite"></div>');
  const ids = ['konif', 'komail', 'komov', 'kotel'];
  const leer = () => ({ nif: $('konif').value, email: $('komail').value, movil: $('komov').value, telefono: $('kotel').value, excluir: c.id || null });
  const hayDato = d => d.nif.replace(/[^A-Za-z0-9]/g, '').length >= 8 || /.@.+\../.test(d.email) || [d.movil, d.telefono].some(x => x.replace(/\D/g, '').length >= 9);
  const usar = !c.id && !!alGuardar && TAB !== 'pacientes';
  let t = null, turno = 0;
  const pintar = x => {
    const k = $('kodup'); if (!k) return;
    ids.forEach(id => $(id) && $(id).classList.remove('campodup'));
    [$('kook'), $('kopedido')].filter(Boolean).forEach(b => { b.disabled = !!x; });
    if (!x) { k.classList.add('hide'); k.innerHTML = ''; return; }
    const marca = { NIF: ['konif'], correo: ['komail'] }[x.campo] || ['komov', 'kotel'].filter(id => $(id).value.replace(/\D/g, '').length >= 9);
    marca.forEach(id => $(id) && $(id).classList.add('campodup'));
    k.innerHTML = x.visible
      ? `<div class="kodupt"><b>${TT('paciente', 's', 'este', 'C', 'l')} ya existe</b><span>mismo ${esc(x.campo)}</span></div>
         <div class="kodupc"><b>${esc(x.nombre || '')}</b><span class="sm">${esc([x.nif, x.movil || x.telefono, x.email, x.municipio].filter(Boolean).join(' · '))}</span></div>
         <button type="button" class="btn" id="kodupusar">${usar ? `Usar ${TT('paciente', 's', 'este', 'l', 'l')}` : 'Ver su ficha'}</button>`
      : `<div class="kodupt"><b>Ya existe ${TT('paciente', 's', 'un', 'l', 'l')} con ese ${esc(x.campo)}</b></div>
         <div class="sm">Lo lleva otra persona del equipo: pide que te lo asignen en lugar de crearlo de nuevo.</div>`;
    k.classList.remove('hide');
    if ($('kodupusar')) $('kodupusar').onclick = () => {
      $('dlg2').close();
      const res = Object.assign({}, x, x.cuenta_id ? { medico: x.cuenta, medico_codigo: x.cuenta_codigo } : {});
      if (usar) alGuardar(res); else fichaPaciente(x.id);
    };
  };
  const comprobar = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const d = leer(), mio = ++turno;
      if (!hayDato(d)) { pintar(null); return; }
      const { data } = await db.rpc('clientes_coincidencias', { p: d });
      if (mio !== turno || !$('kodup')) return;
      pintar(Array.isArray(data) && data.length ? data[0] : null);
    }, 350);
  };
  ids.forEach(id => $(id) && $(id).addEventListener('input', comprobar));
  if (!c.id && hayDato(leer())) comprobar();
  return r;
}

// Clientes está en src/app/screens/customers (v2.411.0). Estos nombres se quedan: el menú, la barra de la lista, los filtros de
// campos, Pedidos, Oportunidades, legado 137, «‹ Volver» y las pruebas los usan.
function cargarPacientes() { return window.delcos.screens.customers.loadCustomers(); }
function listaPacientes() { return window.delcos.screens.customers.listCustomers(); }
function fichaPaciente(id) { return window.delcos.screens.customers.showCustomer(id); }
function selectorPaciente(el, o) { return window.delcos.screens.customers.pickCustomer(el, o || {}); }
function bajaCliente(id, baja) { return window.delcos.screens.customers.setCustomerOff(id, baja); }
function buscarClientes(q) { return window.delcos.screens.customers.searchCustomers(q); }
