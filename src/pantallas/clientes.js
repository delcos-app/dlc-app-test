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
