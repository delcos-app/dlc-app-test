// pantallas/clientes.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Ficha · Comercial asignado (administración) y pacientes que vienen de este prescriptor
async function fichaComercialYPacientes(id) {
  if (FICHA_ID !== id || !$('fbody').querySelector('.fh')) return;
  const esAdmin = puede('administrar');
  if (esAdmin) {
    $('fbody').insertAdjacentHTML('beforeend', `<div class="blk" id="fcomblk"><h3>Comercial asignado</h3>
      <div style="display:flex;gap:8px"><select id="fcomsel" style="flex:1"><option>Cargando…</option></select>
        <button class="btn sec" id="fcomok">Guardar</button></div>
      <div class="sm" style="margin-top:6px">Las ventas nuevas se atribuyen al comercial asignado en ese momento. Las anteriores no cambian.</div></div>`);
    const [{ data: us }, { data: act }] = await Promise.all([db.rpc('usuarios_lista'), RPC_ORIG('responsable_de_cuenta', { p_medico: id })]);
    if (FICHA_ID !== id || !$('fcomsel')) return;
    $('fcomsel').innerHTML = '<option value="">Sin comercial</option>' + (us || []).filter(u => u.activo && (rolPuede(u.rol, 'cartera') || (act && act.id === u.id)))
      .map(u => `<option value="${u.id}" ${act && act.id === u.id ? 'selected' : ''}>${esc(u.nombre)} · ${esc(u.rol)}</option>`).join('');
    $('fcomok').onclick = async ev => {
      ev.target.disabled = true;
      const { data: r, error } = await db.rpc('asignar_responsable_cuenta', { p_medico: id, p_usuario: $('fcomsel').value || null });
      ev.target.disabled = false;
      if (error || (r && r.ok === false)) { toast('No se ha podido asignar', true); return; }
      toast('Comercial asignado'); abrirFicha(id);
    };
  }
  if (esAdmin || ((PERFIL.areas || {}).V || 0) >= 1) {
    const { data } = await db.rpc('clientes_lista', { q: null, p_medico: id, lim: 5, desplaz: 0 });
    if (FICHA_ID !== id || !data || !data.total) return;
    ($('fventasc') || $('fbody')).insertAdjacentHTML('beforeend', `<div class="blk"><h3>${TT('paciente', 'p', '', 'l', 'C')}<span class="n" style="margin-left:6px">${num(data.total)}</span></h3>
      ${data.filas.map(x => `<button class="item" data-fmpac="${x.id}"><span class="tx"><b>${esc(x.nombre)}</b>
        <span class="sm">${num(x.unidades)} uds. · ${num(x.pedidos)} pedidos${x.ultimo_pedido ? ' · último ' + fechaCorta(x.ultimo_pedido) : ''}</span></span></button>`).join('')}
      ${data.total > 5 ? `<button class="verlo" id="fmpactodos" style="border-radius:8px;margin-top:6px">Ver los ${num(data.total)} ${TT('paciente', 'p', '', 'l', 'l')}</button>` : ''}</div>`);
    $('fbody').querySelectorAll('[data-fmpac]').forEach(b => b.onclick = () => fichaPaciente(b.dataset.fmpac));
    const nombre = ($('fbody').querySelector('.fh h2') || {}).textContent || '';
    if ($('fmpactodos')) $('fmpactodos').onclick = () => {
      $('ficha').close(); Object.assign(PAC, { q: '', medico: id, medicoNombre: nombre.replace(/^Urgente\s*/, ''), pagina: 0 }); ir('pacientes');
    };
  }
}

// v2.113.0 · Ficha · Cuántos clientes tiene (vinculados o que han comprado con ella). Solo números: también lo ve el comercial
async function fichaClientes(id) {
  if (FICHA_ID !== id || !$('fventasc') || $('fclientes')) return;
  const { data: c } = await RPC_ORIG('clientes_de_cuenta', { p_cuenta: id });
  if (!c || !c.ok || FICHA_ID !== id || !$('fventasc') || $('fclientes')) return;
  const bloque = `<div class="blk" id="fclientes"><h3>${TT('paciente', 'p', '', 'l', 'C')} asociados</h3>
    <div class="uper">${[['Asociados', c.total], ['Con pedidos', c.con_pedido], ['Sin pedidos', c.sin_pedido]].map(([t, v]) => `<div><b>${num(v)}</b><span>${t}</span></div>`).join('')}</div>
    ${c.total ? '' : `<div class="sm">Todavía no tiene ${TT('paciente', 'p', '', 'l', 'l')} asociados.</div>`}</div>`;
  const u = $('fundades');
  if (u) u.insertAdjacentHTML('afterend', bloque); else $('fventasc').insertAdjacentHTML('afterbegin', bloque);
}

function selectorPaciente(el, o) {
  let valor = o.valor || null;
  const pinta = () => {
    if (valor) {
      el.innerHTML = tarjetaPaciente(valor);
      el.querySelector('.sx').onclick = () => { valor = null; pinta(); o.alElegir && o.alElegir(null); };
      return;
    }
    el.innerHTML = `<div style="display:flex;gap:8px"><div class="picker" style="flex:1">
        <input type="search" autocomplete="off" placeholder="Nombre, teléfono o DNI"><div class="gsug hide"></div></div>
      <button type="button" class="btn sec" data-pnuevo>+ Nuevo</button></div>`;
    const caja = el.querySelector('.picker'), inp = caja.querySelector('input'), sug = caja.querySelector('.gsug');
    let t, pide = 0;
    inp.oninput = () => {
      const q = inp.value.trim();
      clearTimeout(t);
      if (q.length < 2) { sug.classList.add('hide'); caja.classList.remove('buscando'); return; }
      caja.classList.add('buscando');
      sug.innerHTML = `<div class="gload"><span class="spin"></span>Buscando ${TT('paciente', 'p', '', 'l', 'l')}…</div>`; sug.classList.remove('hide');
      const n = ++pide;
      t = setTimeout(async () => {
        const { data } = await db.rpc('contactos_lista', { q, lim: 8 });
        if (n !== pide) return;
        caja.classList.remove('buscando');
        const l = data || [];
        sug.innerHTML = `<div class="gsh">${TT('paciente', 'p', '', 'l', 'C')}</div>` + (l.map((x, i) => `<button type="button" data-pc="${i}"><span class="gic">🧑</span>
          <span><b>${esc(x.nombre)}</b><span class="sm">${esc([x.telefono || x.movil, x.nif, x.municipio, x.medico].filter(Boolean).join(' · '))}</span></span></button>`).join('')
          || `<div class="gload">Sin coincidencias. Créalo con «+ Nuevo».</div>`);
        sug.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { valor = l[+b.dataset.pc]; pinta(); o.alElegir && o.alElegir(valor); });
      }, 250);
    };
    el.querySelector('[data-pnuevo]').onclick = () => editorContacto({ nombre: inp.value.trim() }, c => {
      valor = Object.assign({}, c); pinta(); o.alElegir && o.alElegir(valor);
    });
  };
  pinta();
}

async function cargarPacientes() {
  vaciarModulos('v-pacientes');
  $('v-pacientes').innerHTML = `
    <div class="saludo"><div><h1>Clientes</h1><div class="fecha">${TT('paciente', 'p', '', 'l', 'C')} y empresas que compran: con qué ${TT('medico', 's', '', 'l', 'l')} y su historial</div></div>
      <div class="acts" style="margin:0">${puedeVentas() ? '<button class="btn" id="pacnuevo">+ Nuevo cliente</button>' : ''}</div></div>
    <div id="vcuerpo"></div>`;
  if ($('pacnuevo')) $('pacnuevo').onclick = () => editorContacto({}, c => fichaPaciente(c.id));
  pintarPacientes();
}

async function listaPacientes() {
  cargando($('paclista'), 'Buscando clientes…');
  const { data, error } = await db.rpc('clientes_lista', { q: PAC.q || null, p_medico: PAC.medico,
    lim: tamPagina(), desplaz: PAC.pagina * tamPagina(), p_tipo: PAC.tipo || null, p_pedidos: PAC.pedidos || null,
    p_municipio: PAC.municipio || null, ...(Object.keys(PAC.campos || {}).length ? { f_campos: PAC.campos } : {}) });
  if (error) { $('paccuenta').textContent = 'No se ha podido cargar: ' + error.message; $('paclista').innerHTML = ''; return; }
  $('paccuenta').innerHTML = `<b>${num(data.total)}</b> ${data.total === 1 ? 'cliente' : 'clientes'}`;
  const f = data.filas || [];
  const v = x => x ? esc(x) : '<span class="vac">—</span>';
  const cpCols = clasVisibles('cliente');
  $('paclista').innerHTML = f.length ? `<div class="dgrid-wrap"><div class="dgrid pacs">
    <div class="dh"><span>Cliente</span><span>Tipo</span><span>DNI / CIF</span><span>Teléfono</span><span>Email</span><span>Población</span>
      <span>${TT('medico', 's', '', 'l', 'C')}</span><span>Comercial</span><span class="num">Pedidos</span><span class="num">Uds.</span><span>Último pedido</span>${clasCabeceras(cpCols)}</div>
    ${f.map(x => `<button class="dr" data-pac="${x.id}">
      <span><b>${esc(x.nombre)}</b></span>
      <span><span class="pill ${x.tipo === 'Empresa' ? 'p-emp' : 'p-per'}">${x.tipo === 'Empresa' ? 'Empresa' : `${TT('paciente', 's', '', 'l', 'C')}`}</span></span>
      <span>${v(x.nif)}</span><span>${v(x.telefono || x.movil)}</span><span class="corta">${v(x.email)}</span><span>${v(x.municipio)}</span>
      <span class="corta">${x.medico ? esc(x.medico) : '<span class="vac">Sin asignar</span>'}</span><span>${v(x.comercial)}</span>
      <span class="num">${num(x.pedidos)}</span><span class="num"><b>${num(x.unidades)}</b></span>
      <span>${x.ultimo_pedido ? fechaCorta(x.ultimo_pedido) : '<span class="vac">—</span>'}</span>${cpCols.map(c => `<span>${v(campoTexto(c, (x.clasificadores || {})[c.clave]))}</span>`).join('')}
    </button>`).join('')}</div></div>` : '<div class="vacio">Ningún cliente con estos filtros.</div>';
  // Columnas de campos personalizados: se añaden a la rejilla
  clasRejilla($('paclista').querySelector('.dgrid.pacs'), cpCols.length);
  $('paclista').querySelectorAll('[data-pac]').forEach(b => b.onclick = () => fichaPaciente(b.dataset.pac));
  paginador($('pacpag'), data.total, PAC.pagina, p => { PAC.pagina = p; listaPacientes(); }, () => { PAC.pagina = 0; listaPacientes(); });
}

async function buscarClientes(q) {
  const t = q.trim().replace(/[,()]/g, ' ');
  if (t.length < 2) return [];
  const { data } = await db.from('contactos').select('id,nombre,telefono,movil,email,nif,cuenta_id')
    .or(`nombre.ilike.%${t}%,telefono.ilike.%${t}%,movil.ilike.%${t}%,nif.ilike.%${t}%`).limit(8);
  return data || [];
}

async function bajaCliente(id, baja) {
  const { data: r, error } = await db.rpc('baja_cliente', { p_id: id, p_baja: baja });
  if (error || !r || !r.ok) { toast('No se ha podido: ' + ((error && error.message) || (r && r.error) || ''), true); return false; }
  try { invalidarCache(); DB_PRE.clear(); } catch (e) {}
  toast(baja ? `${TT('paciente', 's', '', 'l', 'C')} dado de baja` : `${TT('paciente', 's', '', 'l', 'C')} dado de alta de nuevo`);
  if (TAB === 'pacientes' && typeof listaPacientes === 'function') listaPacientes();
  return true;
}

const PAC = { q: '', medico: null, medicoNombre: '', pagina: 0 };

const tarjetaPaciente = c => `<div class="selcard"><span class="ic">🧑</span>
  <span class="tx"><b>${esc(c.nombre)}</b>
    ${[c.direccion, [c.cp, c.municipio].filter(Boolean).join(' '), c.provincia].filter(Boolean).length
      ? `<span class="sm">📦 ${esc([c.direccion, [c.cp, c.municipio].filter(Boolean).join(' '), c.provincia].filter(Boolean).join(', '))}</span>`
      : '<span class="sm" style="color:var(--warn)">Sin dirección de entrega</span>'}
    <span class="sm">${esc([c.nif ? (c.tipo === 'Empresa' ? 'CIF ' : 'DNI ') + c.nif : 'Sin DNI', c.email, c.telefono || c.movil].filter(Boolean).join(' · '))}</span>
    ${c.medico ? `<span class="sm">${TT('medico', 's', '', 'l', 'C')}: ${esc(c.medico)}</span>` : ''}</span>
  <button type="button" class="sx" aria-label="Quitar">✕</button></div>`;

// Los mismos parámetros con que listaPacientes pide la lista
const pacParams = () => ({ q: PAC.q || null, p_medico: PAC.medico,
  lim: tamPagina(), desplaz: PAC.pagina * tamPagina(), p_tipo: PAC.tipo || null, p_pedidos: PAC.pedidos || null,
  p_municipio: PAC.municipio || null, ...(Object.keys(PAC.campos || {}).length ? { f_campos: PAC.campos } : {}) });

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

async function pintarPacientesBase() {
  const { data: munis } = await db.rpc('municipios_clientes');
  $('vcuerpo').innerHTML = `
    <div class="panel">
      <div class="filtros">
        <div><label for="pacq">Buscar</label><input id="pacq" type="search" value="${esc(PAC.q)}" placeholder="Nombre, teléfono, email, DNI o CIF"></div>
        <div><label for="pactipo">Tipo</label><select id="pactipo">
          <option value="">Todos</option><option value="Persona" ${PAC.tipo === 'Persona' ? 'selected' : ''}>Personas (${TT('paciente', 'p', '', 'l', 'l')})</option>
          <option value="Empresa" ${PAC.tipo === 'Empresa' ? 'selected' : ''}>Empresas</option></select></div>
        <div><label for="pacped">Pedidos</label><select id="pacped">
          <option value="">Todos</option><option value="con" ${PAC.pedidos === 'con' ? 'selected' : ''}>Con pedidos</option>
          <option value="sin" ${PAC.pedidos === 'sin' ? 'selected' : ''}>Sin pedidos</option></select></div>
        <div><label for="pacmun">Población</label><select id="pacmun"><option value="">Todas</option>
          ${(munis || []).map(x => `<option value="${esc(x.v)}" ${PAC.municipio === x.v ? 'selected' : ''}>${esc(x.v)} (${x.n})</option>`).join('')}</select></div>
        ${camposFiltros('cliente', PAC.campos = PAC.campos || {}, 'pfcp')}
        ${PAC.medico ? `<div><label>${TT('medico', 's', '', 'l', 'C')}</label><div style="min-height:44px;display:flex;align-items:center"><button class="chip" id="pacmedx">${esc(PAC.medicoNombre)} ✕</button></div></div>` : ''}
      </div>
      <div class="cuenta" id="paccuenta">Cargando…</div>
      <div id="paclista"></div>
      <div id="pacpag"></div>
    </div>`;
  let tq;
  $('pacq').oninput = e => { clearTimeout(tq); tq = setTimeout(() => { PAC.q = e.target.value.trim(); PAC.pagina = 0; listaPacientes(); }, 300); };
  $('pactipo').onchange = e => { PAC.tipo = e.target.value; PAC.pagina = 0; listaPacientes(); };
  $('pacped').onchange = e => { PAC.pedidos = e.target.value; PAC.pagina = 0; listaPacientes(); };
  $('pacmun').onchange = e => { PAC.municipio = e.target.value; PAC.pagina = 0; listaPacientes(); };
  camposFiltrosActivar($('vcuerpo'), PAC.campos, () => { PAC.pagina = 0; listaPacientes(); });
  if ($('pacmedx')) $('pacmedx').onclick = () => { PAC.medico = null; PAC.medicoNombre = ''; PAC.pagina = 0; pintarPacientes(); };
  listaPacientes();
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

async function pintarPacientes(...a) {
  const p = pacParams();
  const [m, l] = await Promise.all([db.rpc('municipios_clientes'), db.rpc('clientes_lista', p)]);
  DB_PRE.set('municipios_clientes{}', m); DB_PRE.set('clientes_lista' + JSON.stringify(p), l);
  return pintarPacientesBase.apply(this, a);
}
