// pantallas/panel_delcos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function salirPanel() {
  if (!PANEL_ACTIVO) return;
  if (PANEL_ACTIVO.tipo === 'dbody') { const p = document.querySelector('#cfgcuerpo [data-panel]#dbody'); if (p) p.id = ''; const r = $('dbody-modal'); if (r) r.id = 'dbody'; }
  if (PANEL_ACTIVO.tipo === 'admin') { const p = document.querySelector('#cfgcuerpo [data-panel]#v-admin'); if (p) p.id = ''; const r = $('v-admin-real'); if (r) r.id = 'v-admin'; }
  PANEL_ACTIVO = null;
}

// (v2.183.0: aquí iba la primera versión de reportarProblema; se redefine entera más abajo)
// Configuración → Seguridad y registro → Errores (administración)
async function pintarErrores() {
  const f = window.__ERRF || { tipo: '', estado: 'Nuevo' };
  const { data } = await RPC_ORIG('errores_lista', { p_tipo: f.tipo || null, p_estado: f.estado || null });
  const l = data || [];
  const nom = { error: 'Error de programa', api: 'Error de base de datos', reporte: 'Reporte de usuario' };
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Errores y reportes</h2>
    <p class="sm">Errores que se producen al usar la plataforma y problemas que reportan las personas. Descarga el archivo para enviárselo a quien da soporte técnico.</p>
    <div class="usrbar"><select id="erft"><option value="">Todos los tipos</option>${Object.entries(nom).map(([k, t]) => `<option value="${k}" ${f.tipo === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <select id="erfe">${['', 'Nuevo', 'Revisado', 'Resuelto'].map(e => `<option value="${e}" ${f.estado === e ? 'selected' : ''}>${e || 'Todos los estados'}</option>`).join('')}</select>
      <button class="btn sec" id="erdesc">${svgIco(ICON_NOM.download)} Descargar</button></div>
    <div class="errlista">${l.map(x => `<div class="errfila e-${x.tipo}"><div><b>${esc(nom[x.tipo] || x.tipo)}</b> <span class="sm">${new Date(x.creado_en).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} · ${esc(x.usuario || '—')} · ${esc(x.pantalla || '—')} · v${esc(x.version || '')}</span>
        <div class="errmsg">${esc(x.mensaje)}</div></div>
      <select data-errst="${x.id}">${['Nuevo', 'Revisado', 'Resuelto'].map(e => `<option ${x.estado === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div>`).join('') || '<div class="vacio">Sin errores con estos filtros.</div>'}</div></div>`;
  $('erft').onchange = $('erfe').onchange = () => { window.__ERRF = { tipo: $('erft').value, estado: $('erfe').value }; pintarErrores(); };
  $('cfgcuerpo').querySelectorAll('[data-errst]').forEach(s => s.onchange = async () => { await RPC_ORIG('marcar_error', { p_id: +s.dataset.errst, p_estado: s.value }); toast('Estado actualizado'); });
  $('erdesc').onclick = () => { const b = new Blob([JSON.stringify(l, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `errores_${hoyISO()}.json`; a.click(); };
}

/* ============================================================
   v2.86.0 · Organizaciones de la plataforma (fase 4): alta de empresas nuevas
   Solo quien tiene la capacidad «gestionar_plataforma» (el Administrador de la
   organización principal). Cada organización nace con sus roles, catálogos,
   series y ajustes, y su administrador queda invitado.
   ============================================================ */
async function pintarOrganizaciones() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = '<div class="card"><div class="sm">Cargando…</div></div>';
  const { data, error } = await db.rpc('organizaciones_lista');
  const l = Array.isArray(data) ? data : [];
  c.innerHTML = `<div class="card"><div class="fh"><div><h2>Organizaciones</h2>
      <div class="sm">Cada empresa trabaja aislada, con sus datos, sus usuarios, su numeración y su configuración.</div></div>
      <button class="btn" id="orgnueva">+ Nueva organización</button></div>
    ${error ? `<div class="vacio">No se han podido cargar: ${esc(error.message)}</div>` : `<div class="lista">${l.map(o => `<div class="item" style="cursor:default">
      <span class="tx"><b>${esc(o.nombre)}</b>${orgEstado(o)}<span class="sm">${esc(o.nif || 'Sin NIF')} · ${esc(orgPlanTxt(o))}${((o.plan_datos || {}).extras || []).length ? ' + ' + o.plan_datos.extras.map(extraNombre).join(', ') : ''} · ${num(o.usuarios)} usuarios · ${num(o.cuentas)} cuentas${o.pendiente ? ' · pendiente de registro: ' + esc(o.pendiente) : ''}</span>
        <span class="sm">${(o.dominios || []).length ? 'Dominios: ' + o.dominios.map(esc).join(', ') : 'Sin dominio propio: su pantalla de acceso muestra la marca de delcos'}</span></span>
      <span class="acts" style="margin:0"><span class="sm">${o.creado_en ? fechaCorta(String(o.creado_en).slice(0, 10)) : ''}</span>
        <button class="btn sec chico" type="button" data-orgdom="${o.id}">Dominios</button>
        <button class="btn sec chico" type="button" data-orgext="${o.id}">Extras</button>
        <button class="btn chico ${o.id === (VISTA_ORG || {}).id ? 'sec' : ''}" type="button" data-orgver="${o.id}">${o.id === (VISTA_ORG || {}).id ? 'Estás dentro' : 'Entrar'}</button>
        <button class="btn sec chico" type="button" data-orgplan="${o.id}">Plan</button>
        <button class="btn sec chico" type="button" data-orgexp="${o.id}">Descargar datos</button>
        ${!o.principal && (((o.plan_datos || {}).estado === 'prueba') || !o.activa) ? `<button class="btn sec" type="button" data-orgdel="${o.id}">Borrar empresa</button>` : ''}</span></div>`).join('')}</div>`}</div>`;
  orgAcciones(c, l); orgExtras(c, l);
  // v2.131.0: entrar en la organización para verla tal cual
  c.querySelectorAll('[data-orgver]').forEach(b => b.onclick = () => { const o = l.find(x => x.id === b.dataset.orgver); if (o && o.id !== (VISTA_ORG || {}).id) entrarEnOrganizacion(o); });
  // v2.103.0: los dominios de cada organización deciden la marca de su pantalla de acceso
  c.querySelectorAll('[data-orgdom]').forEach(b => b.onclick = async () => {
    const o = l.find(x => x.id === b.dataset.orgdom); if (!o) return;
    const txt = await pedirTexto(`Dominios desde los que se entra a ${o.nombre}, separados por comas (p. ej. app.empresa.com). Su pantalla de acceso mostrará su nombre y su logo. Déjalo vacío para quitar todos.`,
      (o.dominios || []).join(', '), { titulo: 'Dominios de la organización', ok: 'Guardar' });
    if (txt === null) return;
    const { data: r, error: e } = await db.rpc('guardar_dominios_organizacion', { p_id: o.id, p_dominios: txt.split(/[,;\s]+/).filter(Boolean) });
    if (e || !r || !r.ok) {
      toast((r && { permiso: 'No tienes permiso', dominio: `«${r.dominio}» no es un dominio válido`, en_uso: `Ese dominio ya es de ${r.organizacion}`, no_existe: 'La organización ya no existe' }[r.error]) || 'No se han podido guardar los dominios' + (e ? ': ' + e.message : ''), true);
      return;
    }
    toast(r.dominios.length ? 'Dominios guardados' : 'Dominios quitados'); pintarOrganizaciones();
  });
  $('orgnueva').onclick = () => {
    $('dbody').innerHTML = `<div class="fh"><div><h2>Nueva organización</h2><div class="sm">Nace con los roles, catálogos, series y ajustes de partida de la plataforma</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="g2"><div><label for="onom">Nombre de la empresa</label><input id="onom"></div>
        <div><label for="onif">NIF</label><input id="onif"></div>
        <div><label for="oplan">Plan</label><select id="oplan">${PLANES.map(p => `<option value="${p.id}" ${p.id === 'empresa' ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
        <div><label for="ousu">Usuarios contratados</label><input id="ousu" type="number" min="3" value="3"></div>
        <div><label for="opago">Pago</label><select id="opago"><option value="mensual">Mensual</option><option value="anual">Anual</option></select></div>
        <div><label class="chk"><input type="checkbox" id="oprueba" checked> Empresa de prueba (30 días)</label></div></div>
      <h3 style="margin-top:14px">Su administrador</h3>
      <div class="g2"><div><label for="oanom">Nombre</label><input id="oanom"></div>
        <div><label for="oamail">Correo</label><input id="oamail" type="email"></div>
        <div><label for="oapass">Contraseña temporal</label><input id="oapass" value="Tmp-${Math.random().toString(36).slice(2, 8)}"></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="ocrear">Crear organización</button></div>
      <div id="omsg" class="sm" style="margin-top:10px"></div>`;
    $('ocrear').onclick = async ev => {
      const nombre = $('onom').value.trim(), email = $('oamail').value.trim(), pass = $('oapass').value, anom = $('oanom').value.trim();
      if (!nombre || !email || !anom || pass.length < 6) { toast('Completa el nombre, el administrador, su correo y la contraseña', true); return; }
      ev.target.disabled = true; ev.target.textContent = 'Creando…';
      const { data: r, error: e1 } = await db.rpc('crear_organizacion', { p: { nombre, nif: $('onif').value.trim(), plan: $('oplan').value, usuarios: +$('ousu').value || 3, pago: $('opago').value,
        prueba_dias: $('oprueba').checked ? 30 : 0, email_admin: email } });
      if (e1 || !r || !r.ok) {
        ev.target.disabled = false; ev.target.textContent = 'Crear organización';
        const txt = { permiso: 'No tienes permiso', nombre: 'Falta el nombre', email: 'El correo no es válido', email_existe: 'Ese correo ya tiene usuario' }[(r && r.error) || ''] || (e1 && e1.message) || '';
        $('omsg').innerHTML = `<span style="color:var(--dang)">No se ha podido crear: ${esc(txt)}</span>`; return;
      }
      // Su administrador se registra: la invitación le coloca en la organización nueva
      const tmp = window.supabase.createClient(CFG.url, CFG.anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error: e2 } = await tmp.auth.signUp({ email, password: pass, options: { data: { nombre: anom, usuario: email.split('@')[0] } } });
      ev.target.disabled = false; ev.target.textContent = 'Crear organización';
      $('omsg').innerHTML = e2 ? `<span style="color:var(--dang)">Organización creada, pero no su usuario: ${esc(e2.message)}. Queda invitado: puede registrarse con ese correo.</span>`
        : `<b style="color:var(--ok)">Organización creada.</b> Usuario de ${esc(email)} con contraseña temporal <b>${esc(pass)}</b>. Pásasela y que la cambie al entrar.`;
      pintarOrganizaciones();
    };
    $('dlg').showModal();
  };
}

// v2.117.0 · Organizaciones: plan de cada empresa, estado (prueba, terminada, desactivada), descargar sus datos y borrar las de prueba
function orgPlanTxt(o) {
  const pd = o.plan_datos || {}, p = planDe(pd.plan || o.plan);
  return `plan ${p.nombre}${pd.plan === 'medida' || pd.usuarios == null ? '' : ` · ${num(pd.usuarios)} contratados`}${pd.pago === 'anual' ? ' · anual' : pd.plan === 'medida' ? '' : ' · mensual'}`;
}

// Menú de usuario: una sola entrada «Organización» en lugar de Empresa y Plan
function menuOrganizacion() {
  const plan = document.querySelector('[data-u="plan"]'), emp = document.querySelector('[data-u="empresa"]');
  if (!document.querySelector('[data-u="organizacion"]') && (emp || plan))
    (emp || plan).insertAdjacentHTML('beforebegin', `<button data-u="organizacion" class="hide">${svgIco(ICON_NOM.building)} Organización</button>`);
  [plan, emp].forEach(b => b && b.classList.add('hide'));
  const o = document.querySelector('[data-u="organizacion"]'); if (o) o.classList.toggle('hide', !puedeOrganizacion());
}

// Organizaciones: los extras de cada empresa (los activa la plataforma)
function orgExtras(c, l) {
  c.querySelectorAll('[data-orgext]').forEach(b => b.onclick = () => {
    const o = l.find(x => x.id === b.dataset.orgext); if (!o) return;
    const act = (o.plan_datos || {}).extras || [];
    $('dbody').innerHTML = `<div class="fh"><div><h2>Extras de ${esc(o.nombre)}</h2><div class="sm">Lo que tiene contratado aparte de su plan</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <label class="chk"><input type="checkbox" id="oxopor" ${act.includes('oportunidades') ? 'checked' : ''}> <span><b>Oportunidades</b>
        <span class="sm">Registro de cada venta, se cierre con pedido o no: día y hora, qué producto y cuántas unidades quería, su ${TT('medico', 's', '', 'l', 'l')} de referencia y cómo llegó, con sus métricas.</span></span></label>
      <label class="chk"><input type="checkbox" id="oxport" ${act.includes('portal') ? 'checked' : ''}> <span><b>Portal ${TT('medico', 's', 'del', 'l', 'l')}</b>
        <span class="sm">En su portal, cifras agregadas de ${TT('pauta', 'p', '', 'l', 'l')} (sin datos de personas), pedir material y escribir dudas a su comercial.</span></span></label>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="oxok">Guardar</button></div>`;
    $('dlg').showModal();
    $('oxok').onclick = async () => {
      const { data: r, error } = await db.rpc('guardar_extras_organizacion', { p_org: o.id, p_extras: [$('oxopor').checked && 'oportunidades', $('oxport').checked && 'portal'].filter(Boolean) });
      if (error || !r || !r.ok) { toast('No se han podido guardar los extras' + (error ? ': ' + error.message : ''), true); return; }
      $('dlg').close(); toast('Extras guardados');
      const { data: u } = await RPC_ORIG('plan_uso', {}); if (u && u.plan) PLAN_ACTUAL = u.plan;   // por si es la propia
      pintarOrganizaciones();
    };
  });
}

async function franjaVista() {
  if (!PERFIL || !puede('gestionar_plataforma')) { quitarFranja(); return; }
  const { data } = await RPC_ORIG('vista_organizacion', {});
  VISTA_ORG = data || null;
  if (!VISTA_ORG) { quitarFranja(); return; }
  let f = $('orgvista');
  if (!f) { document.body.insertAdjacentHTML('afterbegin', '<div id="orgvista" class="orgvista" role="status"></div>'); f = $('orgvista'); }
  f.innerHTML = `<span>Estás viendo <b>${esc(VISTA_ORG.nombre)}</b>${VISTA_ORG.bloqueada ? ` <span class="pill p-warn">${VISTA_ORG.bloqueada === 'desactivada' ? 'desactivada' : 'prueba terminada'}</span>` : ''} tal cual la ve esa empresa. Lo que hagas queda en su registro.</span>
    <button type="button" class="btn sec" id="orgvistasal">Salir</button>`;
  document.body.classList.add('con-vista');
  document.documentElement.style.setProperty('--alto-franja', f.offsetHeight + 'px');
  $('orgvistasal').onclick = async ev => {
    ev.target.disabled = true;
    const { data: r } = await db.rpc('salir_organizacion', {});
    if (!r || !r.ok) { ev.target.disabled = false; toast('No se ha podido salir', true); return; }
    location.reload();
  };
}

function quitarFranja() {
  const f = $('orgvista'); if (f) f.remove();
  document.body.classList.remove('con-vista'); document.documentElement.style.setProperty('--alto-franja', '0px');
}

async function pintarErroresDelcos() {
  const c = $('cfgcuerpo'); if (!c) return;
  const f = window.__ERRG || { estado: 'abiertos', dias: 15 };
  c.innerHTML = `<div class="card cfgpanel"><div class="skel" style="width:40%"></div><div class="skel"></div></div>`;
  const { data, error } = await RPC_ORIG('errores_resumen', { p_dias: f.dias });
  if (!$('cfgcuerpo')) return;
  const todos = error ? [] : (data || []);
  const l = todos.filter(x => f.estado === 'todos' || (f.estado === 'abiertos' ? x.estado !== 'Resuelto' : x.estado === 'Resuelto'));
  const nom = { error: 'Error de programa', api: 'Error de base de datos' };
  const fecha = v => new Date(v).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  c.innerHTML = `<div class="card cfgpanel errgrupos"><h2 style="padding:0 0 4px">Errores de la plataforma</h2>
    <p class="sm">Los errores iguales van juntos. Al marcar un grupo como resuelto queda apuntada la versión; si vuelve a salir en esa versión o en una
      posterior, se reabre solo. «Descargar» guarda el archivo para quien da soporte técnico.</p>
    ${error ? `<div class="banda-peligro">No se ha podido leer el registro: ${esc(error.message)}</div>` : ''}
    <div class="usrbar"><select id="egest"><option value="abiertos" ${f.estado === 'abiertos' ? 'selected' : ''}>Sin resolver</option>
        <option value="resueltos" ${f.estado === 'resueltos' ? 'selected' : ''}>Resueltos</option><option value="todos" ${f.estado === 'todos' ? 'selected' : ''}>Todos</option></select>
      <select id="egdias">${[7, 15, 30, 90].map(n => `<option value="${n}" ${f.dias === n ? 'selected' : ''}>Últimos ${n} días</option>`).join('')}</select>
      <button class="btn sec" id="egdesc">${svgIco(ICON_NOM.download)} Descargar</button></div>
    <div class="errlista">${l.map((x, i) => `<div class="errfila e-${x.tipo}">
        <div><b>${esc(nom[x.tipo] || x.tipo)}</b> <span class="sm">· ${esc(x.pantalla || '—')} · ${num(x.veces)} ${x.veces === 1 ? 'vez' : 'veces'} · ${num(x.personas)} ${x.personas === 1 ? 'persona' : 'personas'}
          · última ${fecha(x.ultima)}${x.resuelto_en_version ? (x.resuelto_auto ? ' · resuelto solo en ' : ' · resuelto en ') + esc(x.resuelto_en_version) : ''}</span>
          <div class="errmsg">${esc(x.mensaje)}</div>
          <details class="errdet"><summary class="sm">Versiones y detalle técnico</summary><div class="sm">Versiones: ${esc(x.versiones || '—')} · primera ${fecha(x.primera)}</div>
            <pre>${esc(JSON.stringify(x.detalle || {}, null, 1))}</pre></details></div>
        <select class="chico" data-egh="${i}" aria-label="Estado del grupo">${['Nuevo', 'Revisado', 'Resuelto'].map(e => `<option ${x.estado === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div>`).join('')
      || `<div class="vacio">${f.estado === 'abiertos' ? 'No hay errores sin resolver en este periodo.' : 'Sin errores con estos filtros.'}</div>`}</div></div>`;
  $('egest').onchange = $('egdias').onchange = () => { window.__ERRG = { estado: $('egest').value, dias: +$('egdias').value }; pintarErroresDelcos(); };
  c.querySelectorAll('[data-egh]').forEach(s => s.onchange = async () => {
    const x = l[+s.dataset.egh];
    const { data: r } = await RPC_ORIG('marcar_errores_huella', { p_huella: x.huella, p_estado: s.value });
    toast(r && r.ok ? (s.value === 'Resuelto' ? 'Grupo resuelto: si vuelve a salir, se reabre solo' : 'Estado actualizado') : 'No se ha podido cambiar', !(r && r.ok));
    if (r && r.ok) pintarErroresDelcos();
  });
  $('egdesc').onclick = () => {
    const b = new Blob([JSON.stringify({ generado: new Date().toISOString(), version: VERSION_APP, errores: todos }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `errores_${hoyISO()}.json`; a.click();
  };
}

async function pintarPlantillaDelcos(sub) {
  const c = $('cfgcuerpo'); if (!c) return;
  if (!sub) {
    c.innerHTML = `<div class="card cfgpanel"><h2>Plantilla de las empresas nuevas</h2>
      <p class="sm">Lo que recibe cada empresa al darse de alta (desde la web o desde Clientes). Cambiarlo aquí no toca a las empresas que ya existen.</p>
      <div class="acts" style="justify-content:flex-start"><button type="button" class="btn sec" data-plsub="roles">Roles y permisos</button>
        <button type="button" class="btn sec" data-plsub="cat">Catálogos y estados</button></div></div>`;
    c.querySelectorAll('[data-plsub]').forEach(b => b.onclick = () => pintarPlantillaDelcos(b.dataset.plsub));
    return;
  }
  // Los editores de siempre, sobre la organización de plataforma (que es la plantilla)
  if (sub === 'roles') await pintarRoles(); else { c.innerHTML = ''; await pintarCatalogos(); }
  const c2 = $('cfgcuerpo'); if (!c2 || $('plaviso')) return;
  c2.insertAdjacentHTML('afterbegin', `<div class="banda-info" id="plaviso">Estás cambiando la <b>plantilla de las empresas nuevas</b>.
    <button type="button" class="btn sec" id="plvolver">Volver a la plantilla</button></div>`);
  $('plvolver').onclick = () => pintarPlantillaDelcos();
}

async function pintarCobrosDelcos() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = pdEsqueleto();
  const { data, error } = await RPC_ORIG('organizaciones_lista', {});
  if (!$('cfgcuerpo') || PAG_TAB.delcos !== 'cobros') return;
  const l = error ? [] : (data || []);
  const est = l.map(o => ({ o, p: o.plan_datos || {}, e: pdCobroEstado(o) }));
  const cuenta = n => est.filter(x => x.e[0] === n).length;
  const mrr = est.filter(x => x.e[0] === 'Al día').reduce((t, x) => t + pdMensual(x.p), 0);
  const stripe = id => `https://dashboard.stripe.com/${EN_PRUEBAS ? 'test/' : ''}customers/${encodeURIComponent(id)}`;
  let filtro = 'todas';
  const pinta = () => {
    const f = est.filter(x => filtro === 'todas' || (filtro === 'atencion' ? ['Impago', 'Bloqueada'].includes(x.e[0]) || x.p.baja_al_final || x.p.cambio_previsto : x.e[0] === filtro));
    $('pdcobl').innerHTML = f.length ? `<div class="tablawrap"><table class="pdtabla"><thead><tr><th>Empresa</th><th>Plan</th><th>Estado</th><th>Al mes</th><th>Pendiente</th><th></th></tr></thead><tbody>
      ${f.map(({ o, p, e }) => { const avisos = [p.baja_al_final ? 'Se da de baja al final del periodo' : '', p.cambio_previsto ? 'Cambio previsto a ' + planDe(p.cambio_previsto.plan || p.plan).nombre + (p.cambio_previsto.usuarios ? ' · ' + p.cambio_previsto.usuarios + ' usuarios' : '') + (p.cambio_previsto.desde ? ' el ' + pdFecha(p.cambio_previsto.desde) : '') : '', p.compromiso_hasta ? 'Compromiso hasta el ' + pdFecha(p.compromiso_hasta) : ''].filter(Boolean);
        return `<tr><td><b>${esc(o.nombre)}</b><div class="sm">${o.usuarios} usuarios activos${p.origen === 'web' ? ' · alta desde la web' : ''}</div></td>
          <td>${esc(planDe(p.plan).nombre)}<div class="sm">${p.plan === 'medida' ? '' : (p.usuarios ? p.usuarios + ' contratados · ' : '') + (p.pago === 'anual' ? 'anual' : 'mensual')}</div></td>
          <td><span class="pill ${e[1]}">${e[0]}</span><div class="sm">${esc(e[2])}</div></td>
          <td class="num">${pdMensual(p) ? eur(pdMensual(p)) : '—'}</td>
          <td>${avisos.map(a => `<div class="sm">${esc(a)}</div>`).join('') || '<span class="sm">—</span>'}</td>
          <td>${p.stripe_cliente ? `<a class="btn sec" href="${stripe(p.stripe_cliente)}" target="_blank" rel="noopener">Ver en Stripe</a>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`
      : '<div class="vacio">No hay empresas en este grupo.</div>';
  };
  c.innerHTML = `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">No se han podido leer: ${esc(error.message)}</div>` : ''}
    ${pdKpis([[cuenta('Al día'), 'al día'], [cuenta('En prueba'), 'en prueba'], [cuenta('Impago'), 'con impago', cuenta('Impago') ? 'mal' : ''],
      [est.filter(x => x.p.baja_al_final).length, 'se dan de baja'], [eur(mrr), 'cobro mensual estimado (sin IVA)']])}
    <div class="segs" id="pdcobf">${[['todas', 'Todas'], ['atencion', 'Requieren atención'], ['Al día', 'Al día'], ['En prueba', 'En prueba'], ['Impago', 'Impago']]
      .map(([k, n]) => `<button type="button" data-pdf="${esc(k)}" class="${k === filtro ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div id="pdcobl"></div>
    <p class="sm">El estado llega solo desde Stripe con cada cobro. Las devoluciones y los datos de la tarjeta se miran en Stripe.</p></div>`;
  c.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => { filtro = b.dataset.pdf; c.querySelectorAll('[data-pdf]').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
  pinta();
}

// ---- Altas desde la web: completadas (con su empresa y si ya ha entrado) y a medias (empezaron el pago y no lo terminaron)
async function pintarAltasDelcos() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = pdEsqueleto();
  const { data, error } = await RPC_ORIG('altas_lista', {});
  if (!$('cfgcuerpo') || PAG_TAB.delcos !== 'altas') return;
  const l = error ? [] : (data || []);
  const hechas = l.filter(a => a.estado === 'completada'), medias = l.filter(a => a.estado !== 'completada');
  const sem = l.filter(a => Date.now() - new Date(a.creado_en) < 7 * 864e5);
  const fila = a => { const d = a.datos || {};
    const est = a.estado !== 'completada' ? ['A medias', 'p-warn', 'No terminó el pago · ' + pdHace(a.creado_en)]
      : a.entro ? ['Dentro', 'p-est', 'Ya ha entrado en delcos'] : ['Invitada', 'p-per', a.invitado_en ? 'Invitación enviada ' + pdHace(a.invitado_en) : 'Falta la invitación'];
    return `<div class="pdalta"><div class="pdaltacab"><b>${esc(a.organizacion || d.empresa || 'Sin nombre')}</b> <span class="pill ${est[1]}">${est[0]}</span>
        <span class="pill p-per">${esc(planDe(d.plan).nombre)} · ${d.usuarios || 3} usuarios · ${d.pago === 'anual' ? 'anual' : 'mensual'}</span></div>
      <div class="sm">${esc(d.nombre || '')}${d.email ? ` · <a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : ''}${d.telefono ? ` · <a href="tel:${esc(d.telefono)}">${esc(d.telefono)}</a>` : ''}${d.nif ? ' · ' + esc(d.nif) : ''}</div>
      <div class="sm">${esc(est[2])} · empezó el ${pdFecha(a.creado_en)}</div></div>`; };
  c.innerHTML = `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">No se han podido leer: ${esc(error.message)}</div>` : ''}
    ${pdKpis([[hechas.length, 'completadas (90 días)'], [hechas.filter(a => a.entro).length, 'ya han entrado'], [medias.length, 'a medias (7 días)', medias.length ? 'aviso' : ''], [sem.length, 'esta semana']])}
    ${medias.length ? `<h3 class="pdh3">A medias</h3><p class="sm">Rellenaron el formulario pero no terminaron de poner la tarjeta. Puede valer la pena escribirles. Se borran solas a los 7 días.</p>${medias.map(fila).join('')}` : ''}
    <h3 class="pdh3">Completadas</h3>${hechas.map(fila).join('') || '<div class="vacio">Todavía no hay altas completadas desde la web.</div>'}</div>`;
}

/* v2.125.0 · Nueva venta y Oportunidades. Un solo recorrido para vender (antes «Registrar llamada» y «+ Nuevo pedido» por separado):
   1 cliente (buscar o ficha nueva, con lo que ya sabemos de él), 2 qué quiere (productos y unidades, médico de referencia, cómo llegó),
   3 cómo termina (pedido o motivo de no compra y cuándo volver a llamar). Con el extra «Oportunidades» de la organización, cada venta
   queda registrada con su día y hora, lo que quería y cuánto, se cierre con pedido o no; sin él, el recorrido lleva al pedido. */
// v2.242.0: aquí iba la primera versión de hayOportunidades (se redefine entera más abajo)
function extraNombre(k) { return { oportunidades: 'Oportunidades', portal: 'Portal' }[k] || k; }

// Panel delcos → Solicitudes
async function pintarSolicitudesPlan() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = `<div class="card cfgpanel"><div class="skel" style="width:40%"></div><div class="skel"></div></div>`;
  const { data, error } = await RPC_ORIG('solicitudes_plan_lista', {});
  if (!$('cfgcuerpo')) return;
  const l = error ? [] : (data || []);
  const f = v => new Date(v).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  const cont = { correo: 'Por correo', llamada: 'Por teléfono', video: 'Videollamada' };
  c.innerHTML = `<div class="card cfgpanel"><h2>Solicitudes de las empresas</h2>
    <p class="sm">Presupuestos A medida y conversaciones sobre el contrato. Llegan también como aviso. Cambia el estado cuando las atiendas: la empresa lo ve en su Plan.</p>
    ${error ? `<div class="banda-peligro">No se han podido leer: ${esc(error.message)}</div>` : ''}
    <div class="presulista">${l.map((s, i) => { const d = s.datos || {};
      return `<div class="presufila${s.estado === 'Cerrada' ? ' cerrada' : ''}">
        <div class="presucab"><b>${esc(s.organizacion)}</b> <span class="pill p-est">${esc(planDe(s.plan).nombre)}</span>
          <span class="pill ${s.estado === 'Nueva' ? 'p-warn' : s.estado === 'En curso' ? 'p-est' : 'p-anu'}">${esc(s.estado)}</span>
          <span class="sm">${s.tipo === 'contrato' ? 'Contrato A medida' : 'Presupuesto A medida'} · ${f(s.creado_en)}</span></div>
        ${(d.necesita_txt || []).length ? `<div class="chips">${d.necesita_txt.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
        ${d.programa ? `<div class="sm">Programa: <b>${esc(d.programa)}</b></div>` : ''}
        ${d.mensaje ? `<p class="presumsg">${esc(d.mensaje)}</p>` : ''}
        <div class="sm">${d.usuarios ? num(d.usuarios) + ' usuarios' : ''}${d.portal ? ' · ' + num(d.portal) + ' con portal' : ''}${d.cuando ? ' · ' + esc(d.cuando) : ''}</div>
        <div class="sm">${esc(d.nombre || s.persona || '')}${d.correo ? ` · <a href="mailto:${esc(d.correo)}">${esc(d.correo)}</a>` : ''}${d.telefono ? ` · <a href="tel:${esc(d.telefono)}">${esc(d.telefono)}</a>` : ''}
          · ${esc(cont[d.contacto] || '')}${d.horario ? ' (' + esc(d.horario) + ')' : ''}</div>
        <div class="presuges"><select data-psest="${i}" aria-label="Estado">${['Nueva', 'En curso', 'Cerrada'].map(e => `<option ${s.estado === e ? 'selected' : ''}>${e}</option>`).join('')}</select>
          <input data-psnota="${i}" placeholder="Nota interna (qué se ha hablado, próximos pasos…)" value="${esc(s.nota || '')}">
          <button type="button" class="btn sec" data-psok="${i}">Guardar</button></div></div>`; }).join('')
      || '<div class="vacio">Todavía no ha llegado ninguna solicitud.</div>'}</div></div>`;
  c.querySelectorAll('[data-psok]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.psok, s = l[i];
    const { data: r } = await RPC_ORIG('marcar_solicitud_plan', { p_id: s.id, p_estado: c.querySelector(`[data-psest="${i}"]`).value, p_nota: c.querySelector(`[data-psnota="${i}"]`).value });
    toast(r && r.ok ? 'Solicitud actualizada' : 'No se ha podido guardar', !(r && r.ok));
    if (r && r.ok) pintarSolicitudesPlan();
  });
}

// Empresa y Plan (y los apartados de Configuración que se han movido) llevan a su pestaña de Organización
const ORG_DESDE = { marca: 'marca', correo: 'correo', copias: 'copias', __empresa: 'marca', empresa: 'marca', plan: 'plan', fact: 'fiscal', fiscal: 'fiscal',
  series: 'series', vf: 'vf', pdf: 'pdf', orgs: 'orgs' };

// Franja «Estás viendo X · Salir» cuando el Administrador de delcos está dentro de otra organización
let VISTA_ORG = null;

/* v2.171.0 · Panel delcos fuera de las empresas (decisión de Eric, 4/10/2026). El equipo de delcos entra con su propio usuario, que vive en
   la organización de plataforma (SQL 107); allí la app enseña SOLO el Panel delcos, con su menú: Clientes, Solicitudes, Errores, Accesos,
   Auditoría, Equipo delcos y Plantilla (roles y catálogos que reciben las empresas nuevas). Para ayudar a una empresa, «Entrar» desde
   Clientes (la app normal de esa empresa, con la franja «Estás viendo…») y «Salir» vuelve al panel. plan_uso dice si es la de plataforma. */
let MODO_PLATAFORMA = false;

const PANEL_SECCIONES = [['pd-orgs', 'orgs', 'Clientes', 'building-2'], ['pd-solicitudes', 'solicitudes', 'Solicitudes', 'mail'],
  ['pd-errores', 'errores', 'Errores', 'bug'], ['pd-accesos', 'accesos', 'Accesos', 'lock-keyhole'], ['pd-auditoria', 'auditoria', 'Auditoría', 'history'],
  ['pd-equipo', 'equipo', 'Equipo delcos', 'users'], ['pd-plantilla', 'plantilla', 'Plantilla', 'clipboard-list']];

const PANEL_DESC = { orgs: 'Las empresas que usan delcos: plan, dominios, extras y entrar a ayudarlas', cobros: 'Quién paga, quién está en prueba y qué recibos vienen',
  altas: 'Empresas que se han dado de alta desde www.delcos.app', solicitudes: 'Presupuestos A medida y conversaciones sobre el contrato',
  errores: 'Errores de la plataforma agrupados, de todas las empresas', estado: 'Versiones en uso, SQL aplicado y cifras generales',
  accesos: 'Entradas y salidas de la plataforma', auditoria: 'Cambios hechos en el panel', equipo: 'Las personas de delcos con acceso al panel',
  plantilla: 'Roles y catálogos que recibe cada empresa nueva' };

function orgEstadoBase(o) {
  const pd = o.plan_datos || {};
  if (o.bloqueada === 'desactivada') return '<span class="pill p-anu">Desactivada</span> ';
  if (o.bloqueada === 'prueba_terminada') return `<span class="pill p-warn">Prueba terminada el ${fechaCorta(pd.prueba_hasta)}</span> `;
  if (pd.estado === 'prueba') return `<span class="pill p-est">Prueba hasta el ${fechaCorta(pd.prueba_hasta)}</span> `;
  return '';
}

// Organizaciones (panel delcos): impago y cancelada a la vista
function orgEstado(o) {
  const pd = o.plan_datos || {};
  if (o.bloqueada === 'cancelada') return '<span class="pill p-anu">Cancelada</span> ';
  if (pd.estado === 'impago') return `<span class="pill p-urg">Impago desde el ${fechaCorta(pd.impago_desde)}</span> `;
  return orgEstadoBase(o) + (pd.stripe_suscripcion ? '<span class="pill p-est">Stripe</span> ' : '');
}

// ---- Estado de la plataforma: SQL aplicado, versión publicada y versiones que usa cada empresa
async function pintarEstadoDelcosBase() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = pdEsqueleto();
  const { data, error } = await RPC_ORIG('estado_plataforma', {});
  if (!$('cfgcuerpo') || PAG_TAB.delcos !== 'estado') return;
  const e = (!error && data) || {}, emp = e.empresas || {}, sql = e.sql || [], ver = e.versiones || [];
  const ult = sql[0] || {};
  const porVer = {}; ver.forEach(v => { (porVer[v.version] = porVer[v.version] || []).push(v); });
  const versiones = Object.keys(porVer).sort((a, b) => b.localeCompare(a, 'es', { numeric: true }));
  c.innerHTML = `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">No se ha podido leer: ${esc(error.message)}</div>` : ''}
    ${pdKpis([[esc('v' + VERSION_APP), 'versión de esta app'], [ult.numero ? 'SQL ' + ult.numero : '—', ult.version_app ? 'base en ' + ult.version_app : 'base'],
      [num(emp.activas || 0) + ' / ' + num(emp.total || 0), 'empresas activas'], [num(e.usuarios || 0), 'usuarios activos' + (e.portal ? ' · ' + num(e.portal) + ' del portal' : '')],
      [num(e.errores || 0), 'errores sin resolver (15 días)', e.errores ? 'aviso' : '']])}
    <h3 class="pdh3">Versiones en uso (30 días)</h3>
    ${versiones.length ? versiones.map(v => `<div class="pdver"><div class="pdvercab"><b>v${esc(v.replace(/^v/, ''))}</b>${v.replace(/^v/, '') === VERSION_APP ? ' <span class="pill p-est">la actual</span>' : ' <span class="pill p-warn">anterior</span>'}
        <span class="sm">${porVer[v].length} ${porVer[v].length === 1 ? 'empresa' : 'empresas'}</span></div>
      <div class="sm">${porVer[v].map(x => `${esc(x.organizacion)} (${pdHace(x.ultima_vez)})`).join(' · ')}</div></div>`).join('')
      : '<div class="vacio">Ninguna empresa ha abierto la app en los últimos 30 días.</div>'}
    <h3 class="pdh3">Últimos SQL aplicados en esta base</h3>
    <div class="tablawrap"><table class="pdtabla"><thead><tr><th>SQL</th><th>Versión</th><th>Qué cambia</th><th>Aplicado</th></tr></thead><tbody>
      ${sql.map(s => `<tr><td class="num">${s.numero}</td><td>${esc(s.version_app || '')}</td><td class="sm">${esc(s.descripcion || '')}</td><td class="sm">${pdFecha(s.aplicado_en)}</td></tr>`).join('')}</tbody></table></div>
    <p class="sm">Esto es la base de ${EN_PRUEBAS ? '<b>pruebas</b>' : '<b>producción</b>'}. La de ${EN_PRUEBAS ? 'producción' : 'pruebas'} se mira desde su propio panel.</p></div>`;
}

// ---- Uso del servicio de rutas en Estado de la plataforma
async function pintarEstadoDelcos(...a) {
  const p = Promise.resolve(RPC_ORIG('rutas_uso_resumen', {})).catch(() => ({}));
  await pintarEstadoDelcosBase.apply(this, a);
  const { data: u } = (await p) || {};
  const c = $('cfgcuerpo'); if (!c || PAG_TAB.delcos !== 'estado' || !u || !u.ok) return;
  const card = c.querySelector('.card.cfgpanel'), pie = card && [...card.querySelectorAll(':scope > p.sm')].pop(); if (!card) return;
  const cfg = u.config || {}, glob = +cfg.global || 2000, emp = u.empresas || [];
  const html = `<h3 class="pdh3">Servicio de rutas (TomTom)</h3>
    ${pdKpis([[num(u.hoy || 0) + ' / ' + num(glob), 'peticiones hoy, entre todas las empresas', (u.hoy || 0) >= glob * 0.8 ? 'aviso' : ''],
      [num(u.mes || 0), 'peticiones este mes'], [cfg.activo === false ? 'Apagado' : 'Activo', 'servicio', cfg.activo === false ? 'aviso' : ''],
      [num(+cfg.por_usuario || 30), 'por usuario activo y día']])}
    ${emp.length ? `<div class="tablawrap"><table class="pdtabla"><thead><tr><th>Empresa</th><th class="num">Hoy</th><th class="num">Cupo diario</th><th class="num">Este mes</th></tr></thead><tbody>
      ${emp.map(x => `<tr><td>${esc(x.nombre)}</td><td class="num" style="${x.hoy >= x.cupo ? 'color:var(--warn);font-weight:700' : ''}">${num(x.hoy)}</td><td class="num">${num(x.cupo)}</td><td class="num">${num(x.mes)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="vacio">Ninguna empresa ha usado el servicio de rutas este mes.</div>'}`;
  if (pie) pie.insertAdjacentHTML('beforebegin', html); else card.insertAdjacentHTML('beforeend', html);
}

function orgAccionesBase(c, l) {
  const de = id => l.find(x => x.id === id);
  // Plan: el de pago o una prueba (con su fecha de fin)
  c.querySelectorAll('[data-orgplan]').forEach(b => b.onclick = () => {
    const o = de(b.dataset.orgplan); if (!o) return;
    const pd = o.plan_datos || {}, fin = pd.prueba_hasta || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    $('dbody').innerHTML = `<div class="fh"><div><h2>Plan de ${esc(o.nombre)}</h2><div class="sm">Solo la plataforma cambia el plan de una empresa</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="g2"><div><label for="opplan">Plan</label><select id="opplan">${PLANES.map(p => `<option value="${p.id}" ${p.id === (pd.plan || o.plan) ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
        <div><label for="opusu">Usuarios contratados</label><input id="opusu" type="number" min="3" value="${esc(pd.usuarios == null ? '' : pd.usuarios)}" placeholder="Sin límite"></div>
        <div><label for="oppago">Pago</label><select id="oppago"><option value="mensual">Mensual</option><option value="anual" ${pd.pago === 'anual' ? 'selected' : ''}>Anual</option></select></div>
        <div><label for="opest">Estado</label><select id="opest"><option value="activo">De pago</option><option value="prueba" ${pd.estado === 'prueba' ? 'selected' : ''}>Prueba</option></select></div>
        <div id="opfinw" class="${pd.estado === 'prueba' ? '' : 'hide'}"><label for="opfin">Prueba hasta</label><input id="opfin" type="date" value="${esc(fin)}"></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="opok">Guardar plan</button></div>`;
    $('opest').onchange = () => $('opfinw').classList.toggle('hide', $('opest').value !== 'prueba');
    $('opok').onclick = async ev => {
      ev.target.disabled = true;
      const { data: r, error } = await db.rpc('guardar_plan_organizacion', { p_org: o.id, p: { plan: $('opplan').value, usuarios: $('opusu').value === '' ? null : +$('opusu').value,
        pago: $('oppago').value, estado: $('opest').value, prueba_hasta: $('opest').value === 'prueba' ? $('opfin').value : null } });
      ev.target.disabled = false;
      if (error || !r || !r.ok) {
        toast(({ permiso: 'No tienes permiso', minimo: 'Mínimo 3 usuarios (salvo A medida)', prueba_hasta: 'Falta la fecha de fin de la prueba', plan: 'Plan no válido' })[(r && r.error) || ''] || 'No se ha podido guardar', true);
        return;
      }
      $('dlg').close(); toast('Plan guardado'); pintarOrganizaciones();
    };
    $('dlg').showModal();
  });
  // Descargar todos sus datos (para entregárselos si deja la prueba)
  c.querySelectorAll('[data-orgexp]').forEach(b => b.onclick = async () => {
    const o = de(b.dataset.orgexp); if (!o) return;
    b.disabled = true; const t = b.textContent; b.textContent = 'Preparando…';
    const { data, error } = await RPC_ORIG('exportar_organizacion', { p_org: o.id });
    b.disabled = false; b.textContent = t;
    if (error || !data) { toast('No se han podido descargar sus datos', true); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    a.download = `datos_${o.nombre.replace(/[^\p{L}\p{N}]+/gu, '_')}_${hoyISO()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    toast('Datos descargados');
  });
  // Borrar una empresa de prueba o desactivada (nunca con facturas): hay que escribir su nombre
  c.querySelectorAll('[data-orgdel]').forEach(b => b.onclick = async () => {
    const o = de(b.dataset.orgdel); if (!o) return;
    if (o.facturas) { toast(`${o.nombre} tiene facturas emitidas: no se puede borrar (VeriFactu). Desactívala en su lugar.`, true); return; }
    const txt = await pedirTexto(`Se borrarán ${o.nombre} y todos sus datos (${num(o.usuarios)} usuarios, ${num(o.cuentas)} cuentas, pedidos, agenda…). No se puede deshacer: descarga antes sus datos si hay que entregárselos. Escribe su nombre para confirmarlo.`,
      '', { titulo: 'Borrar empresa', ok: 'Borrar' });
    if (txt === null) return;
    if (txt.trim() !== o.nombre) { toast('El nombre no coincide: no se ha borrado nada', true); return; }
    const { data: r, error } = await db.rpc('borrar_organizacion', { p_org: o.id });
    if (error || !r || !r.ok) {
      toast(({ permiso: 'No tienes permiso', principal: 'La organización principal no se puede borrar', activa: 'Solo se borran empresas de prueba o desactivadas',
        facturas: 'Tiene facturas emitidas: no se puede borrar' })[(r && r.error) || ''] || ('No se ha podido borrar' + (error ? ': ' + error.message : '')), true);
      return;
    }
    toast(`${o.nombre} borrada` + (String(r.acceso || '').startsWith('no_borrado') ? '. Borra sus usuarios en Supabase → Authentication.' : ''));
    pintarOrganizaciones();
  });
}

// Panel delcos → Organizaciones → Plan: fecha de compromiso (A medida), lo que pierde al bajar y aviso si paga con Stripe
function orgAccionesBase2(c, l) {
  const r = orgAccionesBase.apply(this, arguments);
  c.querySelectorAll('[data-orgplan]').forEach(b => {
    const f = b.onclick; if (!f || b.__p2165) return; b.__p2165 = true;
    b.onclick = (...x) => {
      f.apply(b, x);
      const o = l.find(y => y.id === b.dataset.orgplan); if (!o || !$('opplan')) return;
      const pd = o.plan_datos || {}, de = pd.plan || o.plan;
      $('opest').closest('.g2').insertAdjacentHTML('beforeend', `<div id="opcompw"><label for="opcomp">Compromiso hasta (A medida)</label>
        <input id="opcomp" type="date" value="${esc(pd.compromiso_hasta || '')}"><span class="sm">Antes de esa fecha no se puede bajar de A medida.</span></div>`);
      $('opest').closest('.g2').insertAdjacentHTML('afterend', `${pd.stripe_suscripcion ? '<div class="banda-aviso" id="opstripe">Esta empresa paga con Stripe: este cambio no se pasa a Stripe. Para que cuadre el cobro, cámbialo también allí.</div>' : ''}<div id="opperd"></div>`);
      const pinta = () => {
        $('opcompw').classList.toggle('hide', $('opplan').value !== 'medida');
        const p = perdidasPlan(de, $('opplan').value, { extras: pd.extras || [], facturas: +o.facturas > 0 });
        const bloq = de === 'medida' && $('opplan').value !== 'medida' && pd.compromiso_hasta && pd.compromiso_hasta > hoyISO();
        $('opperd').innerHTML = bloq ? `<div class="banda-peligro">Tiene compromiso A medida hasta el ${fechaCorta(pd.compromiso_hasta)}: no se puede bajar antes.</div>`
          : rangoPlan($('opplan').value) < rangoPlan(de) && p.length ? `<div class="banda-aviso">Al pasar a ${esc(planDe($('opplan').value).nombre)} dejará de tener:<ul>${p.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
      };
      $('opplan').addEventListener('change', pinta); pinta();
      $('opok').onclick = async ev => {
        ev.target.disabled = true;
        const p = { plan: $('opplan').value, usuarios: $('opusu').value === '' ? null : +$('opusu').value, pago: $('oppago').value, estado: $('opest').value,
          prueba_hasta: $('opest').value === 'prueba' ? $('opfin').value : null };
        if (p.plan === 'medida') p.compromiso_hasta = $('opcomp').value || null;
        const { data: res, error } = await db.rpc('guardar_plan_organizacion', { p_org: o.id, p });
        ev.target.disabled = false;
        if (error || !res || !res.ok) {
          toast(({ permiso: 'No tienes permiso', minimo: 'Mínimo 3 usuarios (salvo A medida)', prueba_hasta: 'Falta la fecha de fin de la prueba', plan: 'Plan no válido',
            compromiso: `Tiene compromiso A medida hasta el ${fechaCorta(res && res.hasta)}` })[(res && res.error) || ''] || 'No se ha podido guardar', true);
          return;
        }
        $('dlg').close(); toast('Plan guardado'); pintarOrganizaciones();
      };
    };
  });
  return r;
}

// Panel delcos → Organizaciones: desactivar o volver a activar
function orgAcciones(c, l) {
  const r = orgAccionesBase2.apply(this, arguments);
  c.querySelectorAll('[data-orgdom]').forEach(b => {
    const o = l.find(x => x.id === b.dataset.orgdom); if (!o || o.principal || b.parentNode.querySelector('[data-orgact]')) return;   // la propia (principal), nunca
    const del = b.parentNode.querySelector('[data-orgdel]');
    const html = `<button class="btn sec" type="button" data-orgact="${o.id}">${o.activa === false ? 'Volver a activar' : 'Desactivar'}</button>`;
    if (del) del.insertAdjacentHTML('beforebegin', html); else b.parentNode.insertAdjacentHTML('beforeend', html);
  });
  c.querySelectorAll('[data-orgact]').forEach(b => b.onclick = async () => {
    const o = l.find(x => x.id === b.dataset.orgact); if (!o) return;
    const activar = o.activa === false;
    if (!await preguntar(activar ? `Sus ${num(o.usuarios)} usuarios podrán volver a entrar.`
      : `Sus ${num(o.usuarios)} usuarios no podrán entrar hasta que la vuelvas a activar. Sus datos no se tocan.`,
      { titulo: activar ? `¿Volver a activar ${o.nombre}?` : `¿Desactivar ${o.nombre}?`, ok: activar ? 'Volver a activar' : 'Desactivar', peligro: !activar })) return;
    b.disabled = true;
    const { data: x, error } = await db.rpc('activar_organizacion', { p_org: o.id, p_activa: activar });
    if (error || !x || !x.ok) {
      b.disabled = false;
      toast(({ permiso: 'No tienes permiso', principal: 'La organización principal no se puede desactivar', organizacion: 'No se encuentra esa empresa' })[(x && x.error) || ''] || ('No se ha podido cambiar' + (error ? ': ' + error.message : '')), true);
      return;
    }
    toast(activar ? `${o.nombre} vuelve a estar activa` : `${o.nombre} desactivada`);
    pintarOrganizaciones();
  });
  return r;
}

async function entrarEnOrganizacion(o) {
  if (!await preguntar(`Vas a ver la plataforma como ${o.nombre}: sus datos, su configuración y su plan. Lo que cambies se guarda en su empresa y queda registrado. Para volver, «Salir» en la franja de arriba.`, { titulo: 'Entrar en ' + o.nombre, ok: 'Entrar' })) return;
  const { data: r } = await db.rpc('entrar_organizacion', { p_org: o.id });
  if (!r || !r.ok) { toast(r && r.motivo === 'permiso' ? 'Solo el Administrador de delcos puede entrar' : 'No se ha podido entrar', true); return; }
  prepararCambioOrg(o.nombre);
  location.reload();
}
