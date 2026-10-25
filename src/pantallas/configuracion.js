// pantallas/configuracion.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarRoles() {
  const [{ data, error }, { data: est, error: e2 }, voc] = await Promise.all([
    db.from('roles').select('nombre,orden,color,plantilla,por_defecto,roles_capacidades(capacidad)').order('orden').order('nombre'),
    db.rpc('catalogo_papel', { p_papel: 'estado_comercial' }),
    db.from('ajustes').select('valor').eq('clave', 'terminos').maybeSingle()]);
  // Vocabulario: si cambia respecto al guardado, se recarga una vez para que todos los textos lo usen
  if (voc && !voc.error) {
    const nuevo = JSON.stringify((voc.data && voc.data.valor) || {}), antes = JSON.stringify(TERMINOS || {});
    if (nuevo !== antes) {
      try { localStorage.setItem(TERMKEY, nuevo); } catch (e) {}
      let ya = false; try { ya = sessionStorage.getItem('dlc-terminos-recarga') === nuevo; sessionStorage.setItem('dlc-terminos-recarga', nuevo); } catch (e) {}
      if (!ya) { location.reload(); return false; }
    }
  }
  if (!e2 && Array.isArray(est)) {
    ESTADOS_DEF = est.map(x => ({ valor: x.valor, papel: x.papel || '' }));
    try { localStorage.setItem(ESTKEY, JSON.stringify(ESTADOS_DEF)); } catch (e) {}
  }
  if (error || !data) return false;
  ROLES_DEF = data.map(r => ({ nombre: r.nombre, orden: r.orden, color: r.color, plantilla: r.plantilla || {}, por_defecto: !!r.por_defecto,
    capacidades: (r.roles_capacidades || []).map(x => x.capacidad) }));
  try { localStorage.setItem(ROLKEY, JSON.stringify(ROLES_DEF)); } catch (e) {}
  return !e2;
}

function pintarPlanBase() {
  if (!PLAN) { $('rplan').innerHTML = ''; return; }
  const total = PLAN.paradas.reduce((n, p) => n + p.medicos.length, 0);
  const ultima = PLAN.paradas[PLAN.paradas.length - 1];
  // Ruta completa: todas las paradas y la vuelta a la salida (o termina en la última parada si no hay salida con ubicación)
  const conCasa = PLAN.salida.lat != null;
  const rutaDest = conCasa ? [PLAN.salida.lat, PLAN.salida.lon] : ultima.xy;
  const rutaParadas = conCasa ? PLAN.paradas.map(p => p.xy) : PLAN.paradas.slice(0, -1).map(p => p.xy);

  $('rplan').innerHTML = `<div class="card">
    <h2>${PLAN.fecha && PLAN.fecha !== hoyISO() ? 'Plan para el ' + fechaLarga(new Date(PLAN.fecha + 'T00:00:00')) : 'Plan de hoy'}<span class="n">${total} ${TT('medico', total === 1 ? 's' : 'p', '', 'l', 'l')}</span></h2>
    <p class="sm">Salida de ${esc(PLAN.salida.nombre)} a las ${PLAN.inicio != null ? hm(PLAN.inicio) : PLANCFG().salida} · ${PLAN.paradas.length} ${PLAN.paradas.length === 1 ? 'parada' : 'paradas'} ·
      vuelta sobre las ${hm(PLAN.fin)} · <button class="kcfg" id="planhora">⚙ Cambiar horario</button></p>
    <div class="lista">${PLAN.paradas.map((p, i) => `<div class="item" style="cursor:default">
      <span class="ic">${i + 1}</span>
      <span class="tx"><b>${esc(p.centro)}</b>
        <span class="sm">${hm(p.llegada)}–${hm(p.fin)} · ${esc([p.dir, p.municipio].filter(Boolean).join(', '))} · ${p.medicos.length} ${TT('medico', p.medicos.length === 1 ? 's' : 'p', '', 'l', 'l')}</span>
        <span class="sm">${p.medicos.map(m => esc(m.nombre)).join(' · ')}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" type="button" data-nav="${navAttr(p.xy)}">Ir</button></span>
    </div>`).join('')}</div>
    <div id="planmapa" style="height:0;margin:0 16px;border-radius:12px;overflow:hidden"></div>
    <div class="acts" style="padding:12px 16px 16px">
      <button class="btn sec" id="planver">Ver la ruta en el mapa</button>
      <button class="btn" type="button" data-nav="${navAttr(rutaDest, rutaParadas)}">Abrir la ruta en el navegador</button>
      <button class="btn sec" id="planag">Guardar en mi agenda</button>
      ${!PLAN.fecha || PLAN.fecha === hoyISO() ? '<button class="btn" id="planempezar">▶ Empezar ruta</button>' : ''}
      <button class="btn sec" id="plancerrar">Cerrar</button>
    </div></div>`;

  $('plancerrar').onclick = () => { PLAN = null; pintarPlan(); };
  $('planver').onclick = e => { mapaDelPlan(); e.target.classList.add('hide'); };
  if ($('planhora')) $('planhora').onclick = abrirHorarioPlan;
  if ($('planempezar')) $('planempezar').onclick = () => empezarRuta();
  $('planag').onclick = async ev => {
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    let n = 0;
    for (const p of PLAN.paradas) {
      for (const m of p.medicos) {
        await escribir('guardar_cita', { p: {
          cuenta_id: m.id, fecha: PLAN.fecha || hoyISO(), hora: hm(p.llegada), centro_nombre: p.centro,
          estado: 'Planificada', origen: 'Plan del día',
          op_id: 'c-' + m.id + '-' + (PLAN.fecha || hoyISO())
        }});
        n++;
      }
    }
    ev.target.disabled = false; ev.target.textContent = 'Guardar en mi agenda';
    toast(`${n} citas guardadas en tu agenda`);
    cargarInicio();
  };
}





/* Editar usuario: la ventana base y, en orden, cada bloque que se le añade (antes eran 5 capas separadas). */
async function editarUsuario(id, ...r) {
  await asegurarUsuario(id);            // funciona aunque la lista de usuarios aún no esté cargada
  const d = $('dlg'); d.classList.add('cargando');
  const limite = setTimeout(() => d.classList.remove('cargando'), 8000);
  try {
    await pintarUsuarioBase(id, ...r);
    await usuarioComisionYZona(id);
    await usuarioFichaMedico(id);
    await usuarioComisionInfo(id);
  } finally { clearTimeout(limite); requestAnimationFrame(() => d.classList.remove('cargando')); }
}

// Editar usuario · Ficha de médico vinculada (usuarios con rol Medico)
async function usuarioFichaMedico(id) {
  const u = (USUARIOS || []).find(x => x.id === id);
  if (!u || !rolPuede(u.rol, 'portal_prescriptor') || !$('dlg').open || $('umedw')) return;
  const { data: pf } = await db.from('perfiles').select('cuenta_id').eq('id', id).single();
  let medico = null;
  if (pf && pf.cuenta_id) { const { data: fm } = await db.rpc('ficha_cuenta', { p_id: pf.cuenta_id }); if (fm && fm.medico) medico = { id: fm.medico.id, nombre: fm.medico.nombre }; }
  const ref = $('dbody').querySelector('.acts:last-of-type');
  ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="umedw"><h3>Ficha de ${TT('medico', 's', '', 'l', 'l')} vinculada</h3>
    <p class="sm">Este usuario verá solo el informe de ${TT('medico', 's', 'este', 'l', 'l')} y recibirá un aviso con cada ${TT('pauta', 's', '', 'l', 'l')} registrada. Sin importes ni datos de ${TT('paciente', 'p', '', 'l', 'l')}.</p>
    <div id="umedsel"></div><div class="acts" style="margin-top:8px"><button class="btn sec" id="umedok">Guardar vínculo</button>
    ${medico ? `<button class="btn sec" id="umedver">Ver su informe</button>` : ''}</div></div>`);
  selectorMedico($('umedsel'), { valor: medico, placeholder: 'Busca su ficha', alElegir: m => { medico = m; } });
  $('umedok').onclick = async () => {
    const { data: r, error } = await db.rpc('vincular_cuenta', { p_usuario: id, p_medico: medico ? medico.id : null });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    toast(medico ? 'Vinculado con ' + medico.nombre : 'Vínculo quitado');
  };
  if ($('umedver')) $('umedver').onclick = async () => {
    const { data: d } = await RPC_ORIG('informe_cuenta', { p_medico: medico.id });
    toast(`${medico.nombre}: ${num(d.unidades)} unidades, ${num(d.pautas)} ${TT('pauta', 'p', '', 'l', 'l')} este año${d.posicion ? ' · Nº ' + d.posicion : ''}`);
  };
}

/* Ventana base de editar usuario; editarUsuario le añade el resto de bloques */
function pintarUsuarioBase(id) {
  const u = USUARIOS.find(x => x.id === id); if (!u) return;
  const areas = u.areas || {};
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${esc(u.nombre)}</h2><div class="sm">${esc(u.email || '')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="un">Nombre</label><input id="un" value="${esc(u.nombre)}"></div>
      <div><label for="uu">Usuario</label><input id="uu" value="${esc(u.usuario)}"></div>
    </div>
    <div class="g2">
      <div><label for="ur">Rol</label><select id="ur">${rolesNombres().map(r => `<option ${r === u.rol ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
      <div><label for="ua">Estado</label><select id="ua">
        <option value="1" ${u.activo ? 'selected' : ''}>Activo</option>
        <option value="0" ${u.activo ? '' : 'selected'}>Desactivado</option></select></div>
    </div>
    <label>Permisos por área</label>
    ${AREAS.map(([k, t]) => `<div class="dprow" style="grid-template-columns:130px minmax(0,1fr)"><b>${t}</b>
      <select data-area="${k}">${NIVELES.map((n, i) => `<option value="${i}" ${(+areas[k] || 0) === i ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`).join('')}
    <div id="ucomzona"></div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="uguardar">Guardar</button>
    </div>`;

  $('ur').onchange = () => {
    const preset = Object.assign({}, (rolDef($('ur').value) || {}).plantilla || {}, (AJUSTES.roles || {})[$('ur').value] || {});
    AREAS.forEach(([k]) => { const s = $('dbody').querySelector(`[data-area="${k}"]`); if (s) s.value = String(preset[k] || 0); });
  };

  panelComisionUsuario(u).then(html => { const z = $('ucomzona'); if (z) z.innerHTML = html; });

  $('uguardar').onclick = async ev => {
    const areasN = {};
    AREAS.forEach(([k]) => areasN[k] = +$('dbody').querySelector(`[data-area="${k}"]`).value);
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const { data: r, error } = await db.rpc('guardar_perfil', { p: {
      id, nombre: $('un').value.trim(), usuario: $('uu').value.trim(),
      rol: $('ur').value, activo: $('ua').value === '1', areas: areasN
    }});
    ev.target.disabled = false; ev.target.textContent = 'Guardar';
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    if ($('ucom')) {
      // Solo se toca el esquema si cambia o si se elige otra fecha de efecto
      const modo = $('ucdm') ? $('ucdm').value : 'hoy';
      if ($('ucom').value !== ($('ucom').dataset.orig || '') || modo !== 'hoy') {
        const desde = modo === 'todo' ? '2000-01-01' : modo === 'fecha' ? ($('ucdf').value || hoyISO()) : hoyISO();
        await db.rpc('asignar_esquema', { p_usuario: id, p_esquema: $('ucom').value || null, p_quitar: !$('ucom').value, p_desde: desde });
      }
      const { error: ever } = await db.from('perfiles').update({ comision_ver: $('uverc').value }).eq('id', id);   // v2.276.0: si falla, se dice
      if (ever) { toast('Usuario guardado, pero no se ha podido guardar qué ve de su comisión: ' + ever.message, true); return; }
    }
    // v2.109.0: la zona marcada se guarda también con «Guardar» (antes solo con su propio botón y se perdía)
    let extra = '';
    if ($('uzonas') && !$('uzonas').classList.contains('hide') && zonasMarcadas().join('|') !== ($('uzonas').dataset.orig || '')) {
      const { data: z, error: ez } = await db.rpc('asignar_zona', { p_usuario: id, p_zonas: zonasMarcadas() });
      if (ez || (z && z.ok === false)) { toast('Usuario guardado, pero no se ha podido guardar la zona', true); return; }
      extra = ` · zona guardada, ${num(z.asignados)} ${TT('medico', 'p', '', 'l', 'l', 'nuevo')} en su cartera`;
    }
    $('dlg').close(); toast('Usuario guardado' + extra); cargarAdmin();
  };
  $('dlg').showModal();
}

/* Nuevo usuario: la ventana base, el límite del plan y el alta de médicos, y el resumen al crear (antes eran 3 capas). */
function nuevoUsuario(pre) {
  const act = planDe(PLAN_ACTUAL.plan), maxU = usuariosContratados();
  const activos = (USUARIOS || []).filter(u => u.activo && !rolPuede(u.rol, 'portal_prescriptor')).length;
  nuevoUsuarioBase();
  nuevoUsuarioPlanYMedico(pre, act, maxU, activos);
  nuevoUsuarioResumen(pre);
}

// Nuevo usuario · Límite de usuarios del plan y alta de médicos eligiendo su ficha
function nuevoUsuarioPlanYMedico(pre, act, maxU, activos) {
  $('ne').placeholder = 'nombre@empresa.com';
  $('np').value = 'Tmp-' + Math.random().toString(36).slice(2, 8);
  // Rol «Medico»: se elige un médico del directorio, no se crea uno nuevo
  $('nr').insertAdjacentHTML('afterend', '');
  $('nr').closest('.g2').insertAdjacentHTML('afterend', `<div id="nmedw" class="hide"><label>${TT('medico', 's', '', 'l', 'C')} del directorio</label><div id="nmed"></div>
    <div class="sm" style="margin-top:4px">Tendrá acceso solo a su informe y a sus avisos. No cuenta como usuario del plan.</div></div>`);
  let medico = pre && pre.medico ? pre.medico : null;
  selectorMedico($('nmed'), { valor: medico, placeholder: `Busca ${TT('medico', 's', 'al', 'l', 'l')}`, alElegir: async m => {
    medico = m;
    const { data: f } = await db.rpc('ficha_cuenta', { p_id: m.id });
    if (f && f.medico) { if (!$('nn').value) $('nn').value = f.medico.nombre; if (!$('ne').value && f.medico.email) $('ne').value = f.medico.email; }
  } });
  const ver = () => $('nmedw').classList.toggle('hide', !rolPuede($('nr').value, 'portal_prescriptor'));
  $('nr').addEventListener('change', ver);
  if (pre && pre.medico) { $('nr').value = (pre.centro && rolCon('portal_centro')) || rolesNombres().find(r => rolPuede(r, 'portal_prescriptor') && !rolPuede(r, 'portal_centro')) || rolCon('portal_prescriptor'); $('nn').value = pre.nombre || ''; $('ne').value = pre.email || ''; ver(); }
  const crear = $('ncrear').onclick;
  $('ncrear').onclick = async ev => {
    if (!rolPuede($('nr').value, 'portal_prescriptor') && activos >= maxU) { toast(`Tu plan ${act.nombre} permite ${maxU} usuarios. Añade usuarios en «Plan y suscripción» (menú de tu nombre).`, true); return; }
    if (rolPuede($('nr').value, 'portal_prescriptor') && !medico) { toast(`Elige ${TT('medico', 's', 'el', 'l', 'l')} del directorio`, true); return; }
    await crear(ev);
    if (rolPuede($('nr').value, 'portal_prescriptor') && medico && /Usuario creado/.test($('nmsg').textContent)) {
      // v2.291: el perfil puede tardar en existir tras crear el usuario y el vínculo puede fallar: se reintenta y, si no se consigue, se dice
      // (antes decía «Vinculado» siempre y el profesional se quedaba sin ficha: su portal no cargaba)
      let ok = false;
      for (let i = 0; i < 6 && !ok; i++) {
        if (i) await new Promise(r => setTimeout(r, 700));
        const { data: u } = await db.from('perfiles').select('id').eq('email', $('ne').value.trim()).maybeSingle();
        if (!u) continue;
        const { data: r, error } = await db.rpc('vincular_cuenta', { p_usuario: u.id, p_medico: medico.id });
        ok = !error && !(r && r.ok === false);
      }
      $('nmsg').insertAdjacentHTML('beforeend', ok ? ` Vinculado a <b>${esc(medico.nombre)}</b>.`
        : ` <span class="campoerr"><b>No se ha podido vincular a ${esc(medico.nombre)}.</b> Hazlo en Configuración → Usuarios → su ficha → «Ficha de ${esc(TT('medico', 's', '', 'l', 'l'))} vinculada»; sin vínculo su portal no muestra nada.</span>`);
    }
    if (TAB === 'config' && CFG_SEC === 'usuarios') pintarUsuarios2();
  };
}

// Nuevo usuario · Al crear, resumen con los datos para pasárselos a la persona
function nuevoUsuarioResumen(pre) {
  const crear = $('ncrear').onclick;
  $('ncrear').onclick = async ev => {
    const datos = { nombre: $('nn').value.trim(), email: $('ne').value.trim(), pass: $('np').value, rol: $('nr').value };
    await crear(ev);
    const ok = /Usuario creado/.test($('nmsg') ? $('nmsg').textContent : '');
    if (!ok) return;
    Promise.resolve(RPC_ORIG('guardar_acceso_temporal', { p_email: datos.email, p_pass: datos.pass })).then(() => {}, () => {});   // v2.279.0: para volver a verlos
    const vinc = ($('nmsg').textContent.match(/Vinculado a (.+)\./) || [])[1];
    delete $('dlg').dataset.sucio;
    const url = location.origin + location.pathname;
    const texto = `Hola ${nombrePila(datos.nombre)}, ya tienes acceso a ${nombreApp()}.\nEntra en ${url}\nUsuario: ${datos.email}\nContraseña temporal: ${datos.pass}\nCámbiala al entrar (menú de tu nombre → Mi perfil).`;
    $('dbody').innerHTML = `<div class="fh"><div><h2>✓ Usuario creado</h2><div class="sm">Pásale estos datos para que entre</div></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="usrok"><div><span>Nombre</span><b>${esc(datos.nombre)}</b></div><div><span>Rol</span><b>${esc(datos.rol)}</b></div>
        <div><span>Usuario</span><b>${esc(datos.email)}</b></div><div><span>Contraseña temporal</span><b class="mono">${esc(datos.pass)}</b></div>
        ${vinc ? `<div><span>${TT('medico', 's', '', 'l', 'C', 'vinculado')}</span><b>${esc(vinc)}</b></div>` : ''}<div><span>Dirección</span><b>${esc(url)}</b></div></div>
      <p class="sm">Si la confirmación por correo está activada, primero deberá confirmar su email.</p>
      <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" id="usrcop">Copiar los datos</button><button class="btn" data-cerrar>Hecho</button></div>`;
    delete $('dlg').dataset.sucio;
    $('usrcop').onclick = async () => { try { await navigator.clipboard.writeText(texto); toast('Copiado: pégalo en un mensaje'); } catch (e) { toast('No se ha podido copiar', true); } };
  };
}

/* Parte base; nuevoUsuario le añade el resto */
function nuevoUsuarioBase() {
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Nuevo usuario</h2><div class="sm">Se crea con una contraseña temporal que deberá cambiar</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="nn">Nombre</label><input id="nn" placeholder="Nombre y apellidos"></div>
      <div><label for="ne">Correo</label><input id="ne" type="email" placeholder="nombre@empresa.com"></div>
    </div>
    <div class="g2">
      <div><label for="nr">Rol</label><select id="nr">${rolesNombres().map(r => `<option ${r === rolPorDefecto() ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
      <div><label for="np">Contraseña temporal</label><input id="np" value="Tmp-${Math.random().toString(36).slice(2, 8)}"></div>
    </div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="ncrear">Crear usuario</button></div>
    <div id="nmsg" class="sm" style="margin-top:10px"></div>`;

  $('ncrear').onclick = async ev => {
    const email = $('ne').value.trim(), pass = $('np').value, nombre = $('nn').value.trim();
    if (!email || !nombre || pass.length < 6) { toast('Completa nombre, correo y contraseña', true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Creando…';
    // v2.86.0: la invitación coloca a la persona en tu organización y con su rol al registrarse
    const { data: inv, error: einv } = await db.rpc('crear_invitacion', { p_email: email, p_rol: $('nr').value });
    if (einv || !inv || !inv.ok) {
      ev.target.disabled = false; ev.target.textContent = 'Crear usuario';
      $('nmsg').innerHTML = `<span style="color:var(--dang)">No se ha podido invitar: ${esc((einv && einv.message) || (inv && inv.error) || '')}</span>`; return;
    }
    // Cliente aparte para no tocar tu sesión actual
    const tmp = window.supabase.createClient(CFG.url, CFG.anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await tmp.auth.signUp({
      email, password: pass,
      options: { data: { nombre, usuario: email.split('@')[0] } }
    });
    ev.target.disabled = false; ev.target.textContent = 'Crear usuario';
    if (error) { $('nmsg').innerHTML = `<span style="color:var(--dang)">No se ha podido crear: ${esc(error.message)}</span>`; return; }
    if (data && data.user) {
      await db.rpc('guardar_perfil', { p: { id: data.user.id, nombre, usuario: email.split('@')[0], rol: $('nr').value } });
    }
    $('nmsg').innerHTML = `<b style="color:var(--ok)">Usuario creado.</b> Contraseña temporal: <b>${esc(pass)}</b>.
      Pásasela y que la cambie al entrar. Si Supabase tiene activada la confirmación por correo, deberá confirmarlo primero.`;
    cargarAdmin();
  };
  $('dlg').showModal();
}

async function guardarKpis(lista) {
  const prefs = Object.assign({}, PERFIL.preferencias || {}, { kpis: lista });
  const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
  if (error) { toast('No se ha podido guardar: ' + error.message, true); return false; }
  PERFIL.preferencias = data || prefs;
  return true;
}





async function pintarUsuarios2() {
  const [{ data }, rAcc] = await Promise.all([RPC_ORIG('usuarios_resumen', {}), RPC_ORIG('invitados_accesos', {})]);   // v2.270.0: cuándo entró cada uno
  const ACC = {}; ((rAcc && rAcc.data) || []).forEach(x => ACC[x.id] = x);
  USR_ACC = ACC;   // v2.335.0: última conexión de cada uno
  const todos = data || []; USUARIOS = todos.map(u => Object.assign({ medicos: u.cartera, visitas: u.visitas_mes }, u));
  const act = planDe(PLAN_ACTUAL.plan), maxU = usuariosContratados();
  const activos = todos.filter(u => u.activo && !rolPuede(u.rol, 'portal_prescriptor'));
  const hace30 = Date.now() - 30 * 864e5;
  const inactivos = activos.filter(u => !u.ultima_actividad || new Date(u.ultima_actividad).getTime() < hace30).length;
  const porRol = {}; activos.forEach(u => porRol[u.rol] = (porRol[u.rol] || 0) + 1);
  const pinta = () => {
    const q = USR_F.q.toLowerCase();
    const l0 = todos.filter(u => (!q || (u.nombre + ' ' + (u.email || '') + ' ' + (u.medico || u.cuenta || '')).toLowerCase().includes(q)) && (!USR_F.rol || u.rol === USR_F.rol)
      && (USR_F.est === 'todos' || (USR_F.est === 'activos' ? u.activo : !u.activo)));
    const l = l0.filter(u => !esInvitado(u));   // v2.270.0: los invitados, en su grupo
    pintarInvitados(l0.filter(esInvitado), ACC);
    $('usrl').innerHTML = l.map(u => {
      const mods = Object.keys(MODULO_AREA).filter(m => rolPuede(u.rol, 'administrar') || +((u.areas || {})[MODULO_AREA[m]] || 0) >= 1);
      const reciente = u.ultima_actividad ? new Date(u.ultima_actividad) : null;
      return `<button class="usrcard ${u.activo ? '' : 'off'}" data-usr="${u.id}">
        <span class="usrav" style="background:${esc((rolDef(u.rol) || {}).color || '#17457A')}">${esc(iniciales(u.nombre))}</span>
        <span class="usrtx"><b>${esc(u.nombre)}</b><span class="sm">${esc(u.email || '')}</span>
          <span class="usrchips"><span class="pill p-est">${esc(u.rol)}</span>${u.activo ? '' : '<span class="pill p-anu">Desactivado</span>'}
            ${rolPuede(u.rol, 'portal_prescriptor') ? `<span class="pill p-per">${esc(u.medico || 'Sin ficha')}</span>` : `<span class="sm">${mods.length} módulos</span>`}</span></span>
        <span class="usrdat">${!rolPuede(u.rol, 'portal_prescriptor') ? `<span><b>${num(u.cartera)}</b> en cartera</span><span><b>${num(u.visitas_mes)}</b> ${TT('visita', 'p', '', 'l', 'l')} mes</span>` : ''}
          <span class="sm usrcon" title="${reciente ? 'Última actividad registrada: ' + fechaCorta(isoLocal(reciente)) : 'Sin actividad registrada'}">${esc(conexionTxt(ACC[u.id]))}</span></span></button>`;
    }).join('') || '<div class="vacio">Nadie con estos filtros.</div>';
    $('usrl').querySelectorAll('[data-usr]').forEach(b => b.onclick = () => detalleUsuario(todos.find(u => u.id === b.dataset.usr)));
  };
  $('cfgcuerpo').innerHTML = `<div class="cfgpanel">
    <div class="kpis vtot">
      <div class="kpi"><b>${num(activos.length)} / ${num(maxU)}</b><span>usuarios del plan ${esc(act.nombre)}</span></div>
      ${Object.entries(porRol).map(([r, n]) => `<div class="kpi"><b>${num(n)}</b><span>${esc(r)}</span></div>`).join('')}
      <div class="kpi ${inactivos ? 'warn' : 'ok'}"><b>${num(inactivos)}</b><span>sin actividad en 30 días</span></div>
      <div class="kpi" data-usrinvk><b>${num(todos.filter(u => (rolPuede(u.rol, 'portal_prescriptor') || rolPuede(u.rol, 'portal_centro')) && u.activo).length)}</b><span>Cuentas con acceso</span></div></div>
    <div class="card" style="padding-top:14px;padding-bottom:14px">
      <div class="usrbar"><input id="usrq" type="search" placeholder="Buscar por nombre o email" value="${esc(USR_F.q)}">
        <select id="usrrol"><option value="">Todos los roles</option>${rolesNombres().map(r => `<option ${USR_F.rol === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
        <select id="usrest"><option value="activos" ${USR_F.est === 'activos' ? 'selected' : ''}>Activos</option><option value="inactivos" ${USR_F.est === 'inactivos' ? 'selected' : ''}>Desactivados</option><option value="todos" ${USR_F.est === 'todos' ? 'selected' : ''}>Todos</option></select>
        <button class="btn" id="usrnuevo">+ Nuevo usuario</button></div>
      <div id="usrl" class="usrlista"></div></div>
    <div class="card usrinvw" style="padding-top:14px;padding-bottom:14px"><h3>Invitados <span id="usrinvn" class="sm"></span></h3>
      <p class="sm">${TT('medico', 'p', '', 'l', 'C')} y centros a los que has dado acceso a su portal. No cuentan como usuarios del plan. Con «Impersonalizar» abres una sesión con su usuario y ves su portal tal como lo verá.</p>
      <div id="usrinv" class="usrinvl"></div></div></div>`;
  $('usrq').oninput = () => { USR_F.q = $('usrq').value; pinta(); };
  $('usrrol').onchange = () => { USR_F.rol = $('usrrol').value; pinta(); };
  $('usrest').onchange = () => { USR_F.est = $('usrest').value; pinta(); };
  $('usrnuevo').onclick = () => nuevoUsuario();
  pinta();
}

function pintarPerfilPaso1() {
  const g = $('pfi') && $('pfi').closest('.g2'); if (!g) return;
  const vacio = g.children[1];
  vacio.innerHTML = `<label for="pfl">Idioma</label><select id="pfl" data-notr>${IDIOMAS.map(([k, n]) => `<option value="${k}" ${IDIOMA === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  $('pfl').onchange = async () => {
    const id = $('pfl').value;
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { idioma: id });
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    if (error) { toast('No se ha podido guardar', true); return; }
    PERFIL.preferencias = data || prefs;
    try { localStorage.setItem('app-idioma', id); } catch (e) {}
    // Al volver al castellano se recarga para recuperar los textos originales
    if (id === 'es') { location.reload(); return; }
    aplicarIdioma(id); toast('✓');
  };
}

function pintarPerfilPaso2() {
  const ok = $('pfok');
  if (ok) {
    // Siempre con las preferencias actuales: antes, guardar «Mis datos» podía borrar el idioma elegido
    ok.onclick = async () => {
      const nombre = $('pfn').value.trim(); if (!nombre) { toast('El nombre no puede quedar vacío', true); return; }
      const prefs = Object.assign({}, PERFIL.preferencias || {}, { telefono: $('pft').value.trim(), inicio: $('pfi').value });
      const [a, b] = await Promise.all([db.rpc('guardar_preferencias', { p: prefs }), db.from('perfiles').update({ nombre }).eq('id', PERFIL.id)]);
      if (a.error) { toast('No se ha podido guardar', true); return; }
      PERFIL.preferencias = a.data || prefs;
      if (!b.error) { PERFIL.nombre = nombre; $('uname').textContent = nombrePila(nombre); $('av').textContent = iniciales(nombre); }
      toast('Datos guardados');
    };
  }
  const sel = $('pfl');
  if (sel) sel.onchange = async () => {
    const id = sel.value;
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { idioma: id });
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    if (error) { toast('No se ha podido guardar', true); return; }
    PERFIL.preferencias = data || prefs;
    try { localStorage.setItem('app-idioma', id); sessionStorage.removeItem('app-idioma-recarga'); } catch (e) {}
    pantallaCarga(IDIOMAS.find(x => x[0] === id)[1] + '…');
    location.reload();
  };
}

function pintarPerfilPaso3() {
 medidorClave($('pfp1'), $('pfp2'), $('pfpok'));
}

function pintarPerfilPaso4() {
 const c = $('pfp1') && $('pfp1').closest('.card'); if (c) c.remove();
}

function pintarPerfilBase() {
  const pr = PERFIL.preferencias || {};
  const inicios = [['inicio', 'Inicio'], ['agenda', 'Agenda'], ['rutas', 'Rutas'], ['directorio', 'Directorio'], ['ventas', 'Pedidos']].filter(([k]) => puedeModulo(k));
  $('cfgcuerpo').innerHTML = `<div id="perfilcab"></div>
    <div class="card cfgpanel"><h2>Mis datos</h2>
      <div class="g2"><div><label for="pfn">Nombre visible</label><input id="pfn" value="${esc(PERFIL.nombre)}"></div>
        <div><label for="pft">Teléfono</label><input id="pft" inputmode="tel" value="${esc(pr.telefono || '')}" placeholder="Para que el equipo pueda llamarte"></div></div>
      <div class="g2"><div><label for="pfi">Al entrar, abrir</label><select id="pfi">${inicios.map(([k, t]) => `<option value="${k}" ${(pr.inicio || 'inicio') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn" id="pfok">Guardar</button></div></div>
    <div class="card cfgpanel"><h2>Contraseña</h2>
      <div class="g2"><div><label for="pfp1">Nueva contraseña</label><input id="pfp1" type="password" autocomplete="new-password"></div>
        <div><label for="pfp2">Repítela</label><input id="pfp2" type="password" autocomplete="new-password"></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" id="pfpok">Cambiar contraseña</button></div></div>`;
  // Tarjeta de contexto (datos, accesos y actividad)
  const tmp = $('cfgcuerpo'); const guard = tmp.innerHTML;
  $('pfok').onclick = async () => {
    const nombre = $('pfn').value.trim(); if (!nombre) { toast('El nombre no puede quedar vacío', true); return; }
    const prefs = Object.assign({}, pr, { telefono: $('pft').value.trim(), inicio: $('pfi').value });
    const [a, b] = await Promise.all([db.rpc('guardar_preferencias', { p: prefs }), db.from('perfiles').update({ nombre }).eq('id', PERFIL.id)]);
    if (a.error) { toast('No se ha podido guardar', true); return; }
    PERFIL.preferencias = a.data || prefs; if (!b.error) { PERFIL.nombre = nombre; $('uname').textContent = nombrePila(nombre); $('av').textContent = iniciales(nombre); }
    toast('Datos guardados');
  };
  $('pfpok').onclick = async () => {
    const p1 = $('pfp1').value, p2 = $('pfp2').value;
    if (p1.length < 8) { toast('Mínimo 8 caracteres', true); return; } if (p1 !== p2) { toast('No coinciden', true); return; }
    const { error } = await db.auth.updateUser({ password: p1 });
    if (error) { toast('No se ha podido cambiar: ' + error.message, true); return; }
    $('pfp1').value = $('pfp2').value = ''; toast('Contraseña cambiada');
  };
  // Se reutiliza la tarjeta de perfil con accesos y actividad
  const caja = document.createElement('div'); caja.id = 'cfgcuerpo-tmp';
  pintarPrefsPerfil();
}

async function pintarPrefsParte(parte) {
  await pintarPrefs();
  const c = $('cfgcuerpo'); if (!c) return;
  if ($('miperfil')) $('miperfil').remove();
  if (parte === 'rutas') {
    c.querySelectorAll(':scope > p.sm').forEach(p => p.remove());
    c.insertAdjacentHTML('afterbegin', '<div class="card cfgpanel"><h2>Rutas y desplazamientos</h2><p class="sm">Desde dónde sales y dónde terminas. Al pulsar «Cómo llegar» eliges con qué app navegar (Google Maps, Waze o Apple Maps). El horario de las rutas está en su propio apartado.</p></div>');
  }
}

async function pintarCorreo() {
  const [{ data: c }] = await Promise.all([RPC_ORIG('correo_config', {}), cargarAjustes()]);
  const cfg = Object.assign({ proveedor: '', host: '', puerto: 465, seguridad: 'ssl', usuario: '', remitente_nombre: '', remitente_email: '', color: '#15528F', firma: {} }, c || {});
  const f = Object.assign({ nombre: PERFIL.nombre, cargo: '', empresa: (AJUSTES.empresa || {}).razon_social || nombreApp(), telefono: (AJUSTES.empresa || {}).telefono || '',
    telefono2: '', web: (AJUSTES.empresa || {}).web || '', direccion: [(AJUSTES.empresa || {}).direccion, (AJUSTES.empresa || {}).municipio].filter(Boolean).join(', '), aviso: '', logo: 'si' }, cfg.firma || {});
  const campo = (id, et, v, extra = '') => `<div><label for="${id}">${et}</label><input id="${id}" value="${esc(v || '')}" ${extra}></div>`;
  $('cfgcuerpo').innerHTML = `
    <div class="card cfgpanel"><h2>Correo de la empresa</h2>
      <p class="sm">Desde esta cuenta salen las facturas, los datos de pago y los resúmenes. Cada empresa usa su propio correo: los clientes ven vuestro remitente y vuestra firma.</p>
      <div class="g2"><div><label for="coprov">Proveedor</label><select id="coprov"><option value="">Elige tu proveedor…</option>${Object.entries(PROVEEDORES_CORREO).map(([k, p]) => `<option value="${k}" ${cfg.proveedor === k ? 'selected' : ''}>${p.n}</option>`).join('')}</select></div><div></div></div>
      <div class="avisoh ${cfg.proveedor ? '' : 'hide'}" id="coayuda"><span>${esc((PROVEEDORES_CORREO[cfg.proveedor] || {}).ayuda || '')}</span></div>
      <div class="g2">${campo('cohost', 'Servidor de salida (SMTP)', cfg.host, 'placeholder="smtp.tuproveedor.com"')}
        <div class="g2 copuerg"><div><label for="copuer">Puerto</label><input id="copuer" type="number" value="${esc(cfg.puerto)}"></div>
          <div><label for="coseg">Seguridad</label><select id="coseg"><option value="ssl" ${cfg.seguridad === 'ssl' ? 'selected' : ''}>SSL</option><option value="starttls" ${cfg.seguridad === 'starttls' ? 'selected' : ''}>STARTTLS</option></select></div></div></div>
      <div class="g2">${campo('cousu', 'Identificador de acceso', cfg.usuario, 'autocomplete="off"')}
        <div><label for="copass">Clave de acceso</label><input id="copass" type="password" autocomplete="new-password" placeholder="${cfg.hay_clave ? '•••••••• guardada · escribe solo para cambiarla' : ''}"></div></div>
      <div class="g2">${campo('conom', 'Nombre del remitente', cfg.remitente_nombre, `placeholder="${esc(nombreApp())}"`)}${campo('coemail', 'Email del remitente', cfg.remitente_email || (AJUSTES.empresa || {}).email || PERFIL.email || '', 'type="email" placeholder="nombre@tuempresa.com"')}</div>
      <p class="sm">🔒 La clave de acceso se guarda aparte y nadie puede verla desde la plataforma, ni siquiera administración.</p></div>
    <div class="card cfgpanel"><h2>Firma</h2>
      <p class="sm">Se añade al final de cada email, con el logo de la empresa si lo tienes en Marca y logo.</p>
      <div class="firmaed"><div>
        <div class="g2">${campo('fnom', 'Nombre', f.nombre)}${campo('fcar', 'Cargo', f.cargo, 'placeholder="p. ej. Atención al cliente"')}</div>
        <div class="g2">${campo('femp', 'Empresa', f.empresa)}${campo('fweb', 'Web', f.web, 'placeholder="www.tuempresa.com"')}</div>
        <div class="g2">${campo('ftel', 'Teléfono', f.telefono)}${campo('ftel2', 'Otro teléfono', f.telefono2)}</div>
        ${campo('fdir', 'Dirección', f.direccion)}
        <label for="faviso">Aviso legal o de confidencialidad</label><textarea id="faviso" rows="3" placeholder="Texto que aparece en pequeño al final del correo">${esc(f.aviso || '')}</textarea>
        <div class="g2"><div><label for="fcolor">Color</label><input id="fcolor" type="color" value="${esc(cfg.color || '#15528F')}" style="height:44px"></div>
          <div><label class="vfswitch"><input type="checkbox" id="flogo" ${f.logo !== 'no' ? 'checked' : ''}><span class="sw"></span><span>Incluir el logo</span></label></div></div>
      </div><div><div class="sm" style="margin-bottom:6px">Vista previa</div><div class="firmaprev" id="fprev"></div></div></div></div>
    <div class="card cfgpanel"><div class="acts" style="justify-content:flex-end;flex-wrap:wrap;margin:0">
      <button class="btn sec" id="coprueba">Enviarme un correo de prueba</button><button class="btn" id="cook">Guardar</button></div>
      <p class="sm" id="comsg"></p></div>`;
  const prev = () => {
    const v = id => $(id).value.trim(), color = $('fcolor').value, logo = $('flogo').checked && MARCA.logo;
    $('fprev').innerHTML = `<div style="height:4px;background:${color};border-radius:4px;margin-bottom:12px"></div><p style="margin:0 0 12px">Hola:<br><br>Te adjuntamos la factura de tu pedido.<br><br>Un saludo,</p>
      <div class="fprevfirma">${logo ? `<img src="${esc(MARCA.logo)}" alt="">` : ''}<div>${v('fnom') ? `<b style="color:${color}">${esc(v('fnom'))}</b><br>` : ''}${v('fcar') ? esc(v('fcar')) + '<br>' : ''}${v('femp') ? `<b>${esc(v('femp'))}</b><br>` : ''}
        ${[v('ftel'), v('ftel2')].filter(Boolean).map(esc).join(' · ')}${v('ftel') || v('ftel2') ? '<br>' : ''}${v('fweb') ? `<span style="color:${color}">${esc(v('fweb'))}</span><br>` : ''}${v('fdir') ? esc(v('fdir')) : ''}</div></div>
      ${v('faviso') ? `<p class="fprevaviso">${esc(v('faviso'))}</p>` : ''}`;
  };
  ['fnom', 'fcar', 'femp', 'fweb', 'ftel', 'ftel2', 'fdir', 'faviso', 'fcolor', 'flogo'].forEach(id => $(id).addEventListener('input', prev)); $('flogo').onchange = prev; prev();
  // Qué pide cada proveedor como identificador y como clave
  const PISTAS = { google: ['Dirección de correo de la cuenta', 'Contraseña de aplicación'], microsoft: ['Dirección de correo de la cuenta', 'Contraseña de la cuenta'],
    mailjet: ['API Key', 'Secret Key'], ionos: ['Dirección de correo completa', 'Contraseña del buzón'], ovh: ['Dirección de correo completa', 'Contraseña del buzón'], otro: ['Lo indica tu proveedor', 'Lo indica tu proveedor'] };
  const pistas = () => { const k = PISTAS[$('coprov').value] || ['', '']; $('cousu').placeholder = k[0]; if (!cfg.hay_clave) $('copass').placeholder = k[1]; };
  pistas();
  $('coprov').onchange = () => {
    pistas();
    const p = PROVEEDORES_CORREO[$('coprov').value]; if (!p) return;
    if (p.host) $('cohost').value = p.host; $('copuer').value = p.puerto; $('coseg').value = p.seg;
    $('coayuda').classList.remove('hide'); $('coayuda').querySelector('span').textContent = p.ayuda;
  };
  const guardar = async () => {
    const v = id => $(id).value.trim();
    const p = { proveedor: $('coprov').value, host: v('cohost'), puerto: +$('copuer').value || 465, seguridad: $('coseg').value, usuario: v('cousu'),
      remitente_nombre: v('conom'), remitente_email: v('coemail') || (/@/.test(v('cousu')) ? v('cousu') : ''), color: $('fcolor').value,
      firma: { nombre: v('fnom'), cargo: v('fcar'), empresa: v('femp'), web: v('fweb'), telefono: v('ftel'), telefono2: v('ftel2'), direccion: v('fdir'), aviso: $('faviso').value.trim(), logo: $('flogo').checked ? 'si' : 'no' } };
    // Cada dato que falta se marca en su campo
    document.querySelectorAll('#cfgcuerpo .campoerr').forEach(x => x.remove());
    document.querySelectorAll('#cfgcuerpo .conerr').forEach(x => x.classList.remove('conerr'));
    const falta = (id, t) => { const el = $(id); el.classList.add('conerr'); (el.closest('.selw, .numw') || el).insertAdjacentHTML('afterend', `<span class="campoerr">${t}</span>`); };
    const errores = [];
    if (!p.host) errores.push(['cohost', 'Indica el servidor de salida']);
    if (!p.usuario) errores.push(['cousu', 'Indica el identificador de acceso']);
    if (!cfg.hay_clave && !$('copass').value) errores.push(['copass', 'Escribe la clave de acceso']);
    if (!p.remitente_email) errores.push(['coemail', 'Indica el email del remitente']);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.remitente_email)) errores.push(['coemail', 'Ese email no es válido']);
    if (errores.length) {
      errores.forEach(([id, t]) => falta(id, t));
      $('comsg').innerHTML = `<b style="color:var(--dang)">${errores.length === 1 ? 'Falta un dato' : 'Faltan ' + errores.length + ' datos'}:</b> revisa los campos marcados en rojo.`;
      $(errores[0][0]).focus(); return false;
    }
    const { data: r, error } = await db.rpc('guardar_correo', { p, p_clave: $('copass').value || null });
    if (error || (r && r.ok === false)) {
      const motivo = error ? (error.message || error.code || '') : r.error;
      const txt = /Could not find the function|PGRST202/i.test(motivo) ? 'La base de datos no encuentra la función del correo (SQL 48).'
        : motivo === 'permiso' ? 'Solo el propietario de la empresa puede configurar el correo.' : 'No se ha podido guardar: ' + motivo;
      $('comsg').innerHTML = `<b style="color:var(--dang)">${esc(txt)}</b>${motivo && txt.indexOf(motivo) < 0 ? `<span class="errtec">Detalle técnico: ${esc(motivo)}</span>` : ''}`; toast(txt, true); return false;
    }
    if ($('copass').value) cfg.hay_clave = true;
    $('comsg').innerHTML = '<b style="color:var(--ok)">✓ Guardado.</b>';
    $('copass').value = ''; $('copass').placeholder = '•••••••• guardada · escribe solo para cambiarla'; toast('Correo guardado'); return true;
  };
  $('cook').onclick = () => conCarga($('cook'), 'Guardando…', guardar);
  $('coprueba').onclick = ev => conCarga($('coprueba'), 'Enviando…', async () => {
    if (!await guardar()) return;
    $('comsg').textContent = 'Enviando el correo de prueba…';
    let { data, error } = await db.functions.invoke('enviar_email', { body: { prueba: true } });
    if (error && error.context && typeof error.context.json === 'function') { try { data = await error.context.json(); } catch (x) {} }
    const e = data && data.error;
    $('comsg').innerHTML = data && data.ok ? '<b style="color:var(--ok)">✓ Enviado.</b> Revisa tu bandeja de entrada (y la de correo no deseado).'
      : e === 'credenciales' ? '<b style="color:var(--dang)">El servidor ha rechazado el identificador o la clave de acceso.</b> Revisa los datos que te da tu proveedor.'
      : e === 'conexion' ? '<b style="color:var(--dang)">No se ha podido conectar con el servidor.</b> Revisa el servidor, el puerto y la seguridad.'
      : e === 'sin_smtp' ? '<b style="color:var(--dang)">Falta el servidor, el usuario o la contraseña.</b>'
      // v2.280.0: el motivo en palabras (antes salía «permiso» suelto)
      : e === 'permiso' ? '<b style="color:var(--dang)">No tienes permiso para enviar el correo de prueba.</b> Lo envía quien administra la empresa.'
      : e === 'sesion' ? '<b style="color:var(--dang)">Tu sesión ha caducado.</b> Vuelve a entrar y prueba otra vez.'
      : `<b style="color:var(--dang)">No se ha podido enviar.</b> ${error && !data ? 'La función de envío no está instalada en el servidor.' : esc(String(e || ''))}`;
  });
  validarEmailEnVivo($('coemail'));
}

function cfgMovil() {
  const hub = document.querySelector('.cfghub'); if (!hub) return;
  hub.classList.toggle('movil', ES_MOVIL());
  if (!ES_MOVIL()) { hub.classList.remove('detalle'); return; }
  const cont = $('cfgcuerpo-hub');
  if (cont && !cont.querySelector(':scope > .cfgvolver')) cont.insertAdjacentHTML('afterbegin', '<button class="cfgvolver" type="button">‹ Configuración</button>');
}
function detalleUsuario(u) {
  const nombres = { inicio: 'Inicio', agenda: 'Agenda', rutas: 'Rutas', directorio: etiquetaContactos(), ventas: 'Pedidos', pacientes: 'Clientes', productos: 'Productos', facturacion: 'Facturación', analitica: 'Analítica', seguimiento: 'Calidad del dato' };
  const orden = ['inicio', 'agenda', 'rutas', 'directorio', 'ventas', 'pacientes', 'productos', 'facturacion', 'analitica', 'seguimiento'];
  const nivel = m => rolPuede(u.rol, 'administrar') ? 3 : +((u.areas || {})[MODULO_AREA[m]] || 0);
  const importes = rolPuede(u.rol, 'administrar') || +((u.areas || {}).E || 0) >= 1;
  $('dbody').innerHTML = `<div class="fh"><div class="usrcab"><span class="usrav grande">${esc(iniciales(u.nombre))}</span>
      <div><h2>${esc(u.nombre)}</h2><div class="sm">${esc(u.email || '')}</div>
        <div class="usrchips"><span class="pill p-est">${esc(u.rol)}</span>${u.activo ? '' : '<span class="pill p-anu">Desactivado</span>'}</div></div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="blk"><h3>Qué puede ver y hacer</h3>
      <div class="permtabla">${orden.filter(m => m in MODULO_AREA).map(m => { const n = nivel(m); return `<div class="permfila ${n ? '' : 'no'}">
        <span class="permmod">${svgIco(ICON_NOM[n ? 'check' : 'minus'])}${esc(nombres[m])}</span><span class="permniv nv${n}">${esc(NIVEL_TXT[n])}</span></div>`; }).join('')}</div>
      <div class="sm" style="margin-top:8px">${importes ? 'Ve los importes de las ventas.' : 'En ventas solo ve unidades, no importes.'}</div></div>
    <div class="blk"><h3>Actividad</h3>${rolPuede(u.rol, 'portal_prescriptor') ? `<p class="sm">Vinculado a <b>${esc(u.medico || 'ninguna ficha')}</b>.</p>` : `
      <div class="uper" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div><b>${num(u.cartera)}</b><span>en cartera</span></div><div><b>${num(u.visitas_mes)}</b><span>${TT('visita', 'p', '', 'l', 'l')} este mes</span></div></div>
      ${u.zonas && u.zonas.length ? `<div class="sm">Zona: ${esc(u.zonas.map(z => z.charAt(0) + z.slice(1).toLowerCase()).join(', '))}</div>` : ''}`}
      <div class="sm" style="margin-top:6px">${puede('administrar') ? esc(conexionTxt((USR_ACC || {})[u.id], true)) + '<br>' : ''}Última actividad: ${u.ultima_actividad ? new Date(u.ultima_actividad).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'ninguna registrada'}</div></div>
    <div class="usracc">
      <button class="btn" data-uacc="editar">✏️ Editar rol, permisos y zona</button>
      ${!rolPuede(u.rol, 'portal_prescriptor') ? '<button class="btn sec" data-uacc="cartera">🗂️ Asignar cartera</button>' : ''}
      ${puede('administrar') && u.id !== PERFIL.id ? '<button class="btn sec" data-uacc="acceso">Datos de acceso</button>' : ''}
      <button class="btn sec" data-uacc="pass">🔑 Enviar cambio de contraseña</button>
      <button class="btn sec" data-uacc="activar">📧 Reenviar el correo de activación</button>
      ${typeof puedeVerComo === 'function' && puedeVerComo(u) ? (esInvitado(u) ? '<button class="btn" data-uacc="como">👤 Impersonalizar</button>' : '<button class="btn sec" data-uacc="como">👤 Impersonalizar</button>') : ''}
      ${puede('administrar') && u.id !== PERFIL.id ? '<button class="btn sec dang" data-uacc="borrar">🗑 Borrar usuario</button>' : ''}</div>`;
  $('dlg').showModal();
  $('dbody').querySelectorAll('[data-uacc]').forEach(b => b.onclick = () => {
    const a = b.dataset.uacc;
    if (a === 'editar') editarUsuario(u.id);
    if (a === 'cartera') { $('dlg').close(); asignarCartera(u.id); }
    if (a === 'pass') { $('dlg').close(); restablecerPassword(u); }
    if (a === 'activar') reenviarActivacion(u.email);
    if (a === 'acceso') verAccesoTemporal(u);   // v2.279.0
    if (a === 'como') { $('dlg').close(); entrarComo(u.id); }
    if (a === 'borrar') { $('dlg').close(); borrarUsuario(u); }
  });
}
/* v2.87.0 · Borrar un usuario por completo (administración). Pedidos, facturas, cobros y auditoría se conservan siempre. */
function borrarUsuario(u) {
  $('dbody').innerHTML = `<div class="fh"><div><h2>Borrar a ${esc(u.nombre || u.email || '')}</h2><div class="sm">${esc(u.email || '')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <p>Se borran su usuario y su acceso, sus notificaciones y avisos, y sus citas pendientes. Su cartera queda libre para asignarla a otra persona.</p>
    <label class="chk" style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input type="checkbox" id="bucon" style="margin-top:3px">
      <span>Borrar también su actividad: ${TT('visita', 'p', '', 'l', 'l')}, llamadas, citas pasadas y rutas propias.<br><span class="sm">Pensado para usuarios de prueba. Si era alguien del equipo, déjalo sin marcar para conservar el historial.</span></span></label>
    <p class="sm">Nunca se borran pedidos, facturas, cobros, comisiones liquidadas ni el registro de cambios. No se puede deshacer.</p>
    <label for="buconf">Escribe BORRAR para confirmar</label><input id="buconf" autocomplete="off">
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn dang" id="buok">Borrar usuario</button></div>`;
  $('dlg').showModal();
  $('buok').onclick = async ev => {
    const buerr = t => { let m = $('buerr'); if (!m) { $('buok').closest('.acts').insertAdjacentHTML('beforebegin', '<p class="buerr" id="buerr" role="alert"></p>'); m = $('buerr'); } m.textContent = t; };   // v2.272.0: el motivo, dentro de la ventana
    if ($('buconf').value.trim().toUpperCase() !== 'BORRAR') { buerr('Escribe BORRAR en el recuadro para confirmar.'); toast('Escribe BORRAR para confirmar', true); return; }
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('borrar_usuario_seguro', { p_id: u.id, p_con_actividad: $('bucon').checked });   // v2.272.0: borrar_usuario_seguro (SQL 147)
    ev.target.disabled = false;
    if (error || !r || !r.ok) {
      const txt = { permiso: 'Solo administración puede borrar usuarios', uno_mismo: 'No puedes borrarte a ti', ultimo_admin: 'Es el último administrador: da antes ese rol a otra persona', no_existe: 'Ese usuario ya no existe', referencias: 'hay datos que dependen de esta persona (' + ((r && r.detalle) || '') + ')' }[(r && r.error) || ''] || (error && error.message) || 'sin respuesta';
      buerr('No se ha podido borrar: ' + txt); toast('No se ha podido borrar: ' + txt, true);
      if (!r || !['permiso', 'uno_mismo', 'ultimo_admin'].includes(r.error)) registrarError('api', 'Borrar usuario: ' + ((r && r.error) || (error && error.message) || 'sin respuesta'), { detalle: r && r.detalle });
      return;
    }
    $('dlg').close();
    toast(String(r.acceso || '').startsWith('no_borrado') ? 'Usuario borrado (su acceso queda sin perfil: ya no puede usar la plataforma)' : 'Usuario borrado');
    if (typeof cargarAdmin === 'function') cargarAdmin();
    if (TAB === 'config' && typeof CFG_KEY !== 'undefined' && CFG_KEY === 'usuarios') pintarUsuarios2();   // v2.272.0: la lista, sin esa persona
  };
}

// Editar usuario y asignar cartera funcionan aunque la lista de usuarios aún no esté cargada (por ejemplo, desde una notificación)
async function asegurarUsuario(id) {
  if ((USUARIOS || []).some(x => x.id === id)) return;
  const { data } = await RPC_ORIG('usuarios_resumen', {});
  USUARIOS = (data || []).map(u => Object.assign({ medicos: u.cartera, visitas: u.visitas_mes }, u));
}

function marcarCache(t) { CACHE_MOD[t] = { clave: ESTADO_MOD[t](), t: Date.now(), esc: ESCRITURAS }; }

// Todo texto que diga «Directorio» (ayudas, manual, avisos…) usa el nombre que ha elegido la empresa
function nombreEnTextos(raiz) {
  const et = etiquetaContactos(); if (!raiz || et === 'Directorio') return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && !n.parentElement.closest('script,style,textarea,input,[data-notr]') && /directorio/i.test(n.nodeValue) ? 1 : 2 });
  const ns = []; while (w.nextNode()) ns.push(w.currentNode);
  ns.forEach(n => { n.nodeValue = n.nodeValue.replace(/\bDirectorio\b/g, et).replace(/\bdirectorio\b/g, et.toLowerCase()); });
}









// v2.135.0 · Menú lateral: «Configuración» (pie del menú) se marca como sección activa cuando se está en Configuración
function menuMarcarPie() { const b = $('mlcfg'); if (b) b.classList.toggle('activo', TAB === 'config'); }



// v2.138.0 · Pastilla «Pruebas» en el menú lateral: junto a la marca (desplegado) o como punto sobre el logo (plegado); sin menú
// lateral vuelve a la cabecera, detrás del logo
function colocarIndPruebas() {
  const p = $('indpruebas'); if (!p) return;
  const marca = document.body.classList.contains('menulat') && document.querySelector('nav.main .mlmarca');
  const casa = marca || document.querySelector('.top .logo');
  if (!casa) return;
  if (marca) { if (p.parentNode !== marca) marca.appendChild(p); }
  else if (p.previousElementSibling !== casa) casa.insertAdjacentElement('afterend', p);
}

function marcarPedsec() {
  if (TAB !== 'ventas') return;
  const alias = Object.keys(ALIAS_PEDIDOS).find(k => ALIAS_PEDIDOS[k] === pedsecVista()) || 'ventas';
  document.querySelectorAll('nav.main [data-t], #bnav [data-t]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.t === alias)));
}

async function guardarPrefsAvisos(avisos) {
  const prefs = Object.assign({}, (PERFIL && PERFIL.preferencias) || {}, { avisos_pedidos: avisos });
  const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
  if (error) { toast('No se ha podido guardar', true); return false; }
  PERFIL.preferencias = data || prefs; return true;
}

function rpPlanDe(i) {
  const p = RPROP.lista[i]; if (!p) return null;
  PROPUESTAS = PROPUESTAS || {};
  PROPUESTAS['prop' + (i + 1)] = p.sel;   // así «Tiempos de visita» puede recalcular el plan
  return p;
}

// Acciones de cada aviso: [texto, función, principal]
function notifAcciones(x) {
  const d = x.datos || {}, [t, id] = String(x.enlace || '').split(':'), out = [];
  if (x.tipo === 'reponer') {
    if (d.telefono) out.push(['Llamar', () => { location.href = 'tel:' + String(d.telefono).replace(/\s+/g, ''); }, true]);
    out.push(['Nueva venta', () => nuevaVenta({ contacto_id: d.contacto_id || id, cliente: d.nombre, telefono: d.telefono }), !d.telefono]);
  } else if (x.tipo === 'caida_ventas') {
    out.push(['Ver ficha', () => abrirFicha(d.cuenta_id || id), true], ['Citar', () => nuevaCita(d.cuenta_id || id)]);
  } else if (x.tipo === 'visita_sin_registrar') {
    out.push([`Registrar ${TT('visita', 's', '', 'l', 'l')}`, () => abrirVisita(d.cuenta_id), true], ['Ver ficha', () => abrirFicha(d.cuenta_id)]);
  } else if (t === 'pedido' && id) out.push(['Ver pedido', () => verPedido(id), true]);
  else if (t === 'ficha' && id) out.push(['Ver ficha', () => abrirFicha(id), true]);
  else if (x.enlace) out.push(['Abrir', () => irEnlace(x.enlace), true]);
  return out;
}

function notifDia(f) {
  const d = new Date(f), hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dif = Math.round((hoy - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  return dif <= 0 ? 'Hoy' : dif === 1 ? 'Ayer' : dif < 7 ? 'Esta semana' : 'Antes';
}

// Ajustes: tabla compacta (al momento / en el resumen del día) y silencio
async function notifGuardarPrefs(cambio, ok) {
  const prefs = Object.assign({}, PERFIL.preferencias || {}, cambio);
  const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
  if (error) { toast('No se ha podido guardar', true); return false; }
  PERFIL.preferencias = data || prefs; if (ok) toast(ok); return true;
}

function notifModo(k) {
  const v = ((PERFIL.preferencias || {}).notif || {})[k], diario = NOTIF_DIARIOS.includes(k);
  if (v === false) return 'no';
  if (v && typeof v === 'object') { if (v.m === false && v.r) return 'r'; if (v.m === false) return 'no'; }
  return diario ? 'r' : 'm';
}

function marcarFacPlan() {
  document.body.classList.toggle('facsolo', facSinPlan());
  try { aplicarPermisosMenu(); } catch (e) {}
}

function pedirPresupuesto(tipo) {
  tipo = tipo === 'contrato' ? 'contrato' : 'presupuesto';
  const est = { contacto: 'correo' }, usados = +((PAGO_ESTADO || {}).usuarios || 0), med = +((PAGO_ESTADO || {}).medicos || 0);
  const tit = tipo === 'contrato' ? 'Hablar de tu contrato A medida' : 'Pide tu plan A medida';
  $('dbody').innerHTML = `<div class="fh"><div><h2>${tit}</h2>
      <div class="sm">Cuéntanos qué necesitáis y te respondemos en un día laborable. No te comprometes a nada.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="presu">
      <section><h3>Qué buscáis <span class="sm">(marca lo que encaje; no hace falta acertar)</span></h3>
        <div class="presuops">${PRESU_NECESITA.map(([k, t]) => `<label class="presuop"><input type="checkbox" value="${k}"><span>${esc(t)}</span></label>`).join('')}</div>
        <div id="presuprogw" class="hide"><label for="presuprog">¿Con qué programa?</label><input id="presuprog" placeholder="Por ejemplo: Holded, Sage, A3, Salesforce…"></div>
        <label for="presumsg">Cuéntanos con tus palabras</label>
        <textarea id="presumsg" rows="4" placeholder="Qué queréis conseguir, cómo trabajáis hoy, qué os falta… Todo nos ayuda a proponeros lo mejor."></textarea></section>
      <section><h3>Vuestro equipo</h3>
        <div class="g2"><div><label for="presuusu">Usuarios aproximados</label><input id="presuusu" type="number" min="1" class="numw" value="${Math.max(50, usados)}">
            <span class="sm">Ahora sois ${num(usados)}.</span></div>
          <div><label for="presumed">${TT('medico', 'p', '', 'l', 'C')} o centros con portal</label><input id="presumed" type="number" min="0" class="numw" value="${med || ''}" placeholder="Opcional"></div>
          <div><label for="presucuando">¿Cuándo os gustaría empezar?</label><select id="presucuando">${PRESU_CUANDO.map(x => `<option>${esc(x)}</option>`).join('')}</select></div></div></section>
      <section><h3>Cómo te contactamos</h3>
        <div class="g2"><div><label for="presunom">Nombre</label><input id="presunom" value="${esc(PERFIL.nombre || '')}"></div>
          <div><label for="presumail">Correo</label><input id="presumail" type="email" value="${esc(PERFIL.email || '')}"></div>
          <div><label for="presutel">Teléfono</label><input id="presutel" type="tel" placeholder="Opcional" value="${esc(PERFIL.telefono || '')}"></div>
          <div><label for="presuhora">Mejor momento</label><input id="presuhora" placeholder="Por ejemplo: mañanas de 9 a 13"></div></div>
        <label>Prefieres</label><div class="segs" role="group" id="presucont">${[['correo', 'Correo'], ['llamada', 'Llamada'], ['video', 'Videollamada']]
          .map(([k, t]) => `<button type="button" data-pc="${k}" class="${k === 'correo' ? 'on' : ''}" aria-pressed="${k === 'correo'}">${t}</button>`).join('')}</div></section>
    </div>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="presuok">Enviar solicitud</button></div>`;
  const ops = () => [...$('dbody').querySelectorAll('.presuop input:checked')].map(x => x.value);
  $('dbody').querySelectorAll('.presuop input').forEach(x => x.onchange = () => {
    x.closest('.presuop').classList.toggle('on', x.checked);
    $('presuprogw').classList.toggle('hide', !ops().includes('conexion'));
  });
  $('dbody').querySelectorAll('[data-pc]').forEach(b => b.onclick = () => {
    est.contacto = b.dataset.pc; $('dbody').querySelectorAll('[data-pc]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  });
  $('presuok').onclick = async ev => {
    const necesita = ops(), mensaje = $('presumsg').value.trim();
    if (!necesita.length && !mensaje) { toast('Marca qué buscáis o cuéntanoslo con tus palabras', true); $('presumsg').focus(); return; }
    if (!$('presumail').value.trim() && !$('presutel').value.trim()) { toast('Déjanos un correo o un teléfono para contestarte', true); return; }
    const datos = { necesita, necesita_txt: necesita.map(k => (PRESU_NECESITA.find(x => x[0] === k) || [k, k])[1]), programa: $('presuprog').value.trim() || null,
      mensaje, usuarios: +$('presuusu').value || null, portal: +$('presumed').value || null, cuando: $('presucuando').value,
      nombre: $('presunom').value.trim(), correo: $('presumail').value.trim(), telefono: $('presutel').value.trim() || null,
      horario: $('presuhora').value.trim() || null, contacto: est.contacto, plan_actual: (PLAN_ACTUAL || {}).plan || null };
    ev.target.disabled = true;
    const { data: r, error } = await RPC_ORIG('pedir_presupuesto', { p: { tipo, datos } });
    ev.target.disabled = false;
    if (error || !r || !r.ok) {
      toast(({ demasiadas: 'Ya nos has enviado varias hoy: te contestamos enseguida', vacia: 'Cuéntanos qué buscáis', permiso: 'No puedes enviar solicitudes' })[(r && r.error) || ''] || 'No se ha podido enviar', true);
      return;
    }
    $('dbody').innerHTML = `<div class="fh"><div><h2>Solicitud enviada</h2></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="presuok"><div class="presuokic">${svgIco(ICON_NOM.check)}</div>
        <p><b>Gracias, ${esc(nombrePila(datos.nombre || PERFIL.nombre || ''))}.</b> Ya la tenemos: te ${est.contacto === 'correo' ? 'escribimos' : est.contacto === 'llamada' ? 'llamamos' : 'proponemos una videollamada'}
          en un día laborable${datos.correo ? ` (${esc(datos.correo)})` : ''}.</p>
        <p class="sm">Puedes ver en qué punto está en Plan y suscripción.</p></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn" data-cerrar>Entendido</button></div>`;
    $('dlg').addEventListener('close', () => { if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); }, { once: true });
  };
  $('dlg').showModal();
}

function marcarPanel() {
  const tab = PAG_TAB.delcos || 'orgs';
  document.querySelectorAll('nav.main [data-t]').forEach(b => { if (b.classList.contains('pdsec') || b.dataset.t === 'delcos') b.setAttribute('aria-selected', String(b.dataset.t === 'pd-' + tab)); });
}

function claveCfgVieja(sec, sub) {
  if (!sec || sec === '__cfg') return '';
  if (sec === 'equipo') return sub === 'roles' ? 'roles' : 'usuarios';
  if (sub) return sec + '.' + sub;
  return CFG_VIEJO[sec] || sec;
}

// El índice cabe siempre en la pantalla: su alto llega justo al borde de abajo, así la rueda lo recorre entero sin tener que mover la página
function cfuAjustarIndice() {
  const n = document.querySelector('#v-config .cfuidx'); if (!n || TAB !== 'config' || ES_MOVIL()) return;
  const top = Math.max(0, n.getBoundingClientRect().top);
  n.style.setProperty('--cfuidxh', Math.max(240, innerHeight - top - 12) + 'px');
}

async function notifBorrar(ids, leidas) {
  const { data, error } = await db.rpc('borrar_notificaciones', { p_ids: ids || null, p_leidas: !!leidas });
  if (error || !data || !data.ok) { toast('No se han podido borrar', true); return false; }
  return true;
}

// ---------- nombres del menú ----------
function txTexto(b) {
  const l = b.querySelector('.mllab, b, em, small, .lb'); if (l && !l.querySelector('svg')) return { get: () => l.textContent.trim(), set: v => { l.textContent = v; if (b.dataset.tip) b.dataset.tip = v; } };
  const tn = [...b.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim());
  return tn ? { get: () => tn.nodeValue.trim(), set: v => { tn.nodeValue = tn.nodeValue.replace(tn.nodeValue.trim(), v); if (b.dataset.tip) b.dataset.tip = v; } } : null;
}

async function pintarTextos() {
  await cargarAjustes();
  const mn = menuNombres(), etqDef = TT('medico', 'p', '', 'l', 'C');
  const vistos = new Set();
  const filas = [...document.querySelectorAll('nav.main [data-t]')].filter(b => {
    const t = b.dataset.t; if (vistos.has(t) || MENU_FUERA.includes(t) || ['config', 'delcos', 'manual'].includes(t) || b.classList.contains('hide')) return false;
    vistos.add(t); return true;
  }).map(b => {
    const t = b.dataset.t, x = txTexto(b), def = t === 'directorio' ? etqDef : (b.dataset.txdef || (x && x.get()) || t);
    const val = t === 'directorio' ? (((AJUSTES.marca || {}).etiqueta || '') !== etqDef ? ((AJUSTES.marca || {}).etiqueta || '') : '') : (mn[t] || '');
    return { t, def, val };
  });
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel txmenu"><h2>Menús ${pmAyu('Menús', 'Cómo se llama cada módulo en el menú y en el título de su pantalla. Escribe el nombre que usa tu empresa; en blanco, se usa el de siempre.')}</h2>
    <div class="txmtab" role="table"><div class="txmf txmcab" role="row"><span></span><span role="columnheader">Módulo</span><span role="columnheader">Nombre en tu empresa</span></div>
    ${filas.map(f => `<div class="txmf" role="row"><span class="txmico" role="cell">${ICO_MOD[f.t] || '•'}</span><span role="cell" class="txmdef">${esc(f.def)}</span>
      <span role="cell"><input data-txm="${f.t}" value="${esc(f.val)}" placeholder="${esc(f.def)}" maxlength="30" aria-label="Nombre de ${esc(f.def)} en tu empresa"></span></div>`).join('')}</div>
    <div class="acts"><button type="button" class="btn" id="txmok">Guardar</button></div></div>`;
  $('txmok').onclick = () => conCarga($('txmok'), 'Guardando…', async () => {
    const nuevo = {}; let dir = null;
    $('cfgcuerpo').querySelectorAll('[data-txm]').forEach(i => { const v = i.value.trim(); if (i.dataset.txm === 'directorio') dir = v; else if (v) nuevo[i.dataset.txm] = v; });
    const { data, error } = await db.rpc('guardar_ajuste', { p_clave: 'menu_nombres', p_valor: nuevo });
    if (error || (data && data.ok === false)) { toast('No se han podido guardar los nombres', true); return; }
    AJUSTES.menu_nombres = nuevo;
    if (dir !== null && dir !== (((AJUSTES.marca || {}).etiqueta || '') === etqDef ? '' : (AJUSTES.marca || {}).etiqueta || '')) {
      const v = Object.assign({}, AJUSTES.marca || {}, { etiqueta: dir || etqDef });
      const r2 = await db.rpc('guardar_ajuste', { p_clave: 'marca', p_valor: v });
      if (!r2.error && !(r2.data && r2.data.ok === false)) { AJUSTES.marca = v; aplicarEtiqueta(); }
    }
    aplicarNombresMenu(); MENU_FIRMA = ''; try { montarMenuLateral(); pintarBnav(); } catch (e) {}
    toast('Nombres guardados');
  });
}

function txPintar() {
  const c = $('cfgcuerpo'); if (!c || !TX) return;
  const q = impNorm(TX.q || ''), F = TX.filtro;
  const ver = f => (!F || (F === 'cambios' ? (txPersonal(f) || txCambiada(f)) : f.g === F)) && (!q || impNorm([f.donde, f.siempre, f.v, f.s, f.p].join(' ')).includes(q));
  const nCamb = TX.filas.filter(f => txPersonal(f) || txCambiada(f)).length, pend = TX.filas.filter(txCambiada).length;
  const fila = (f, i) => {
    const marca = txCambiada(f) ? '<span class="txtag txpend">Sin guardar</span>' : txPersonal(f) ? '<span class="txtag">Cambiado</span>' : '';
    const vuelve = f.g === 'voc' ? (f.s || f.p) : f.v;
    return `<div class="txrow ${txPersonal(f) || txCambiada(f) ? 'cambio' : ''}" data-txi="${i}"><span class="donde">${esc(f.donde)}</span>
      <span class="siempre">${esc(f.siempre)}${marca}</span>
      ${f.g === 'voc' ? `<span class="dos"><input class="chico" data-txs value="${esc(f.s)}" placeholder="${esc(f.ds)}" aria-label="Singular"><input class="chico" data-txp value="${esc(f.p)}" placeholder="${esc(f.dp)}" aria-label="Plural"></span>`
        : `<input class="chico" data-txv value="${esc(f.v)}" placeholder="${esc(f.ahora ? 'Nuevo nombre' : f.siempre)}" aria-label="Nuevo nombre de ${esc(f.siempre)}">`}
      ${vuelve ? `<button type="button" class="rv" data-txrv="${i}" title="${f.ahora ? 'Dejarlo como está' : 'Volver al de siempre'}" aria-label="${f.ahora ? 'Dejarlo como está' : 'Volver al de siempre'}">${txSV(TX_IC.rv)}</button>` : '<span></span>'}</div>`;
  };
  c.innerHTML = `<div class="txp">
    <div class="txbar"><div class="txq">${txSV(TX_IC.lupa)}<input id="txq" placeholder="Busca un texto: estado, menú, rol…" value="${esc(TX.q || '')}" autocomplete="off"></div>
      <div class="txchips" role="group" aria-label="Filtrar">${[['', 'Todos'], ['cambios', 'Cambiados', nCamb]].concat(TX_G.filter(([g]) => TX.filas.some(f => f.g === g)).map(([g, t]) => [g, t]))
        .map(([k, t, n]) => `<button type="button" data-txf="${k}" class="${F === k ? 'on' : ''}" aria-pressed="${F === k}">${esc(t)}${n ? `<b>${n}</b>` : ''}</button>`).join('')}</div></div>
    ${TX_G.map(([g, t, s]) => { const fs = TX.filas.map((f, i) => [f, i]).filter(([f]) => f.g === g && ver(f)); if (!fs.length) return '';
      return `<section class="txg"><h3>${esc(t)}<span class="sm">${esc(s)}</span></h3>
        <div class="txhead"><span>Dónde sale</span><span>${g === 'voc' || g === 'menu' ? 'El de siempre' : 'Ahora se llama'}</span><span>${g === 'voc' || g === 'menu' ? 'Vuestro texto' : 'Nuevo nombre'}</span><span></span></div>
        ${fs.map(([f, i]) => fila(f, i)).join('')}</section>`; }).join('') || '<div class="vacio">Ningún texto coincide.</div>'}
    <div class="txpie"><span class="sm">${pend ? `${pend} ${pend === 1 ? 'cambio' : 'cambios'} sin guardar` : 'Todo guardado'}</span>
      <span class="acts" style="margin:0"><button type="button" class="btn sec" id="txdes" ${pend ? '' : 'disabled'}>Deshacer</button><button type="button" class="btn" id="txok" ${pend ? '' : 'disabled'}>Guardar</button></span></div></div>`;
  const q2 = $('txq'); let tq = null;
  q2.oninput = () => { TX.q = q2.value; clearTimeout(tq); tq = setTimeout(() => { const pos = q2.selectionStart; txPintar(); const n = $('txq'); n.focus(); n.setSelectionRange(pos, pos); }, 200); };
  c.querySelectorAll('[data-txf]').forEach(b => b.onclick = () => { TX.filtro = b.dataset.txf; txPintar(); });
  c.querySelectorAll('.txrow').forEach(r => {
    const f = TX.filas[+r.dataset.txi];
    const upd = () => { const ant = txCambiada(f); r.classList.toggle('cambio', txPersonal(f) || txCambiada(f)); if (ant !== txCambiada(f) || true) txPie(); };
    r.querySelectorAll('[data-txv]').forEach(i => i.oninput = () => { f.v = i.value; upd(); });
    r.querySelectorAll('[data-txs]').forEach(i => i.oninput = () => { f.s = i.value; upd(); });
    r.querySelectorAll('[data-txp]').forEach(i => i.oninput = () => { f.p = i.value; upd(); });
  });
  c.querySelectorAll('[data-txrv]').forEach(b => b.onclick = () => { const f = TX.filas[+b.dataset.txrv]; if (f.g === 'voc') { f.s = ''; f.p = ''; } else f.v = ''; txPintar(); });
  $('txdes').onclick = () => { TX.filas.forEach(f => { if (f.g === 'voc') { f.s = f.s0; f.p = f.p0; } else f.v = f.v0; }); txPintar(); };
  $('txok').onclick = txGuardar;
}

function txPie() {
  const pend = TX.filas.filter(txCambiada).length, p = document.querySelector('.txpie .sm');
  if (p) p.textContent = pend ? `${pend} ${pend === 1 ? 'cambio' : 'cambios'} sin guardar` : 'Todo guardado';
  if ($('txok')) $('txok').disabled = !pend; if ($('txdes')) $('txdes').disabled = !pend;
}

async function txGuardar() {
  const camb = TX.filas.filter(txCambiada); if (!camb.length) return;
  const b = $('txok'); b.disabled = true;
  const err = [];
  let recargar = false;
  // Vocabulario
  if (camb.some(f => f.g === 'voc')) {
    const voc = {};
    TX.filas.filter(f => f.g === 'voc').forEach(f => { const o = {}; if (f.s.trim()) o.s = f.s.trim(); if (f.p.trim()) o.p = f.p.trim(); const g0 = ((TERMINOS || {})[f.k] || {}).g; if (g0 && Object.keys(o).length) o.g = g0; if (Object.keys(o).length) voc[f.k] = o; });
    const { data, error } = await db.rpc('guardar_ajuste', { p_clave: 'terminos', p_valor: voc });
    if (error || (data && data.ok === false)) err.push('el vocabulario'); else { try { localStorage.setItem(TERMKEY, JSON.stringify(voc)); } catch (e) {} recargar = true; }
  }
  // Menú (el de las fichas es la etiqueta de la marca)
  if (camb.some(f => f.g === 'menu')) {
    const mn = {}; TX.filas.filter(f => f.g === 'menu' && f.t !== 'directorio' && f.v.trim()).forEach(f => { mn[f.t] = f.v.trim(); });
    const { data, error } = await db.rpc('guardar_ajuste', { p_clave: 'menu_nombres', p_valor: mn });
    if (error || (data && data.ok === false)) err.push('los nombres del menú'); else { AJUSTES.menu_nombres = mn; recargar = true; }
    const dir = TX.filas.find(f => f.g === 'menu' && f.t === 'directorio');
    if (dir && txCambiada(dir)) {
      const v = Object.assign({}, AJUSTES.marca || {}, { etiqueta: dir.v.trim() || TT('medico', 'p', '', 'l', 'C') });
      const r2 = await db.rpc('guardar_ajuste', { p_clave: 'marca', p_valor: v });
      if (r2.error || (r2.data && r2.data.ok === false)) err.push(`el nombre de ${TT('medico', 'p', '', 'l', 'l')}`); else { AJUSTES.marca = v; aplicarEtiqueta(); }
    }
  }
  // Estados, resultados, roles y campos: uno a uno, en la base (también en las fichas y visitas que los tienen)
  for (const f of camb.filter(x => ['est', 'rol', 'campo'].includes(x.g) && x.v.trim())) {
    const p = f.g === 'rol' ? { tipo: 'rol', antes: f.antes, nuevo: f.v.trim() } : { tipo: f.g === 'campo' ? 'campo' : 'valor', id: f.id, nuevo: f.v.trim() };
    const { data, error } = await db.rpc('renombrar_texto', { p });
    if (error || !data || !data.ok) err.push(`«${f.siempre}»${data && data.error === 'existe' ? ' (ya hay otro con ese nombre)' : ''}`);
    else recargar = true;
  }
  invalidarCache();
  if (err.length) { toast('No se ha podido cambiar ' + err.join(', '), true); b.disabled = false; return; }
  toast('Textos guardados: se recarga la plataforma');
  setTimeout(() => location.reload(), 900);
}

/* ============================================================
   v2.279.0 · Datos de acceso a mano, «Mi ficha» con lo necesario y ver la contraseña (peticiones de Eric, 12/10/2026; SQL 148).
   - Al dar de alta a alguien se guardan su usuario y su contraseña temporal; en su ventana de Usuarios, «Datos de acceso» los vuelve a
     enseñar para copiarlos. Cuando esa persona ya ha entrado, la contraseña ya no sirve: se borra y se ofrece enviarle el cambio.
   - Mi ficha del profesional: arriba, lo necesario para quitar el aviso de «faltan datos» (teléfono, al menos un día con horario y
     cómo prefiere las visitas), marcado según lo va rellenando; esos campos llevan «Necesario». Un centro sin nombre se puede escribir.
   - Cualquier campo de contraseña (también el de entrar) tiene un botón para ver lo que se escribe.
   ============================================================ */
async function verAccesoTemporal(u) {
  const { data: r } = await RPC_ORIG('ver_acceso_temporal', { p_usuario: u.id });
  const url = location.origin + location.pathname;
  const cab = t => `<div class="fh"><div><h2>${esc(t)}</h2><div class="sm">${esc(u.nombre || '')} · ${esc(u.email || '')}</div></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>`;
  if (!r || !r.ok) {
    const txt = !r ? 'No se han podido leer sus datos de acceso.'
      : r.error === 'ya_entro' ? 'Ya ha entrado en la plataforma, así que su contraseña temporal ya no sirve. Si no la recuerda, envíale el cambio de contraseña.'
      : r.error === 'sin_datos' ? 'No hay datos de acceso guardados: se dio de alta antes de que se guardaran o con otro método. Envíale el cambio de contraseña para que ponga una.'
      : 'No tienes permiso para ver sus datos de acceso.';
    $('dbody').innerHTML = `${cab('Datos de acceso')}<p>${esc(txt)}</p>
      <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">${r && r.error !== 'permiso' ? '<button class="btn sec" id="accpass">Enviar cambio de contraseña</button>' : ''}<button class="btn" data-cerrar>Cerrar</button></div>`;
    if ($('accpass')) $('accpass').onclick = () => { $('dlg').close(); restablecerPassword(u); };
    return;
  }
  const texto = `Hola ${nombrePila(r.nombre)}, ya tienes acceso a ${nombreApp()}.\nEntra en ${url}\nUsuario: ${r.email}\nContraseña temporal: ${r.pass}\nCámbiala al entrar (menú de tu nombre → Mi perfil).`;
  $('dbody').innerHTML = `${cab('Datos de acceso')}
    <div class="usrok"><div><span>Nombre</span><b>${esc(r.nombre)}</b></div><div><span>Rol</span><b>${esc(r.rol || '')}</b></div>
      <div><span>Usuario</span><b>${esc(r.email)}</b></div><div><span>Contraseña temporal</span><b class="mono">${esc(r.pass)}</b></div>
      ${r.cuenta ? `<div><span>${TT('medico', 's', '', 'l', 'C', 'vinculado')}</span><b>${esc(r.cuenta)}</b></div>` : ''}<div><span>Dirección</span><b>${esc(url)}</b></div></div>
    <p class="sm">Aún no ha entrado. Cuando entre por primera vez y cambie la contraseña, estos datos dejan de estar aquí.</p>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" id="acccop">Copiar los datos</button><button class="btn" data-cerrar>Hecho</button></div>`;
  $('acccop').onclick = async () => { try { await navigator.clipboard.writeText(texto); toast('Copiado: pégalo en un mensaje'); } catch (e) { toast('No se ha podido copiar', true); } };
}

function varsCorreo(o) {
  const e = AJUSTES.empresa || {}, emp = e.razon_social || nombreApp(), doc = o.documento || 'pedido';
  return { nombre: o.nombre || '', nombre_pila: o.nombre ? nombrePila(o.nombre) : '', empresa: emp, documento: doc, Documento: doc.charAt(0).toUpperCase() + doc.slice(1),
    numero: o.numero || '', importe: eurI(o.importe || 0), beneficiario: emp, iban: e.iban || '' };
}

function plantillaCorreo(k, campo, v) {
  const l = plantillasCorreo(k), p = l.find(x => x.id === PLANT_ELEGIDA[k]) || l.find(x => x.defecto) || l[0] || {};
  const t = (p[campo] || '').trim() || PLANT_CORREO[k][campo];
  return t.replace(/\[(\w+)\]/g, (m, n) => n in v ? v[n] : m).replace(/ {2,}/g, ' ').trim();
}

// Configuración → Correo y firma: «Textos de los correos»
// Configuración → Correo y firma → «Plantillas de correo»
function pintarPlantillasCorreo() {
  const c = $('cfgcuerpo'); if (!c || $('plcorreo') || !$('cook')) return;
  const fin = $('cook').closest('.card'); if (!fin) return;
  fin.insertAdjacentHTML('beforebegin', `<div class="card cfgpanel" id="plcorreo"><div class="fh"><h2 class="plch">Plantillas de correo ${pmAyu('Plantillas de correo', 'Los correos que reciben tus clientes. Crea las que quieras, con el nombre que quieras; para cada uso, una es la de por defecto y, si hay más, se elige al enviar. Los huecos entre corchetes ([nombre], [iban]…) se rellenan al enviar. La despedida y los teléfonos ya van en la firma.')}</h2>
    <button type="button" class="btn sec chico" id="plcnueva">+ Nueva plantilla</button></div><div id="plclista" class="plclista"></div></div>`);
  const pinta = () => {
    const l = listaCorreos();
    $('plclista').innerHTML = Object.keys(USOS_CORREO).map(u => {
      const g = l.filter(x => x.uso === u);
      return `<div class="plcuso"><div class="sm plcusot">${esc(USOS_CORREO[u])}</div>${g.map(x => `<div class="plcfila"><span class="plcn"><b>${esc(x.nombre)}</b>${x.defecto ? ' <span class="pill p-ok">Por defecto</span>' : ''}<span class="sm">${esc(x.asunto)}</span></span>
        <span class="plcb"><button type="button" class="btn sec chico" data-plce="${x.id}">Editar</button><button type="button" class="btn sec chico" data-plcd="${x.id}">Duplicar</button>
          ${g.length > 1 ? `<button type="button" class="btn sec chico dang" data-plcx="${x.id}">Eliminar</button>` : ''}</span></div>`).join('') || '<div class="sm">Sin plantillas.</div>'}</div>`;
    }).join('');
  };
  pinta();
  $('plcorreo').onclick = async e => {
    const ed = e.target.closest('[data-plce]'), du = e.target.closest('[data-plcd]'), x = e.target.closest('[data-plcx]');
    const l = listaCorreos().map(p => Object.assign({}, p));
    if (e.target.closest('#plcnueva')) { editarPlantillaCorreo({ id: idPlant(), nombre: '', uso: 'pago', asunto: PLANT_CORREO.pago.asunto, texto: PLANT_CORREO.pago.texto, defecto: false }, true, pinta); return; }
    if (ed) { editarPlantillaCorreo(l.find(p => p.id === ed.dataset.plce), false, pinta); return; }
    if (du) { const o = l.find(p => p.id === du.dataset.plcd); editarPlantillaCorreo(Object.assign({}, o, { id: idPlant(), nombre: o.nombre + ' (copia)', defecto: false }), true, pinta); return; }
    if (x) {
      const o = l.find(p => p.id === x.dataset.plcx); if (!o) return;
      if (!await preguntar(`Se elimina la plantilla «${o.nombre}».`, { titulo: '¿Eliminar la plantilla?', ok: 'Eliminar' })) return;
      let n = l.filter(p => p !== o);
      if (o.defecto) { const otra = n.find(p => p.uso === o.uso); if (otra) otra.defecto = true; }
      if (await guardarCorreos(n)) { toast('Plantilla eliminada'); pinta(); }
    }
  };
}

function listaCorreos() {
  const a = AJUSTES.plantillas_correo || {};
  if (Array.isArray(a.lista) && a.lista.length) return a.lista;
  return Object.keys(USOS_CORREO).map(u => ({ id: u, nombre: PLANT_CORREO[u].titulo, uso: u, asunto: (a[u] || {}).asunto || PLANT_CORREO[u].asunto, texto: (a[u] || {}).texto || PLANT_CORREO[u].texto, defecto: true }));
}

// (R-12: plantillaCorreo se definía aquí otra vez; ahora está en su sitio, más arriba)
async function guardarCorreos(lista) {
  const v = Object.assign({}, AJUSTES.plantillas_correo || {}, { lista });
  const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'plantillas_correo', p_valor: v });
  if (error || (r && r.ok === false)) { toast('No se han podido guardar las plantillas', true); return false; }
  AJUSTES.plantillas_correo = v; return true;
}

// Elegir plantilla al enviar (solo si hay más de una para ese uso). Devuelve false si se cancela.
async function elegirPlantillaCorreo(uso) {
  const l = plantillasCorreo(uso); PLANT_ELEGIDA[uso] = null;
  if (l.length < 2) return true;
  const def = l.find(x => x.defecto) || l[0];
  const k = await elegirOpcion('¿Con qué plantilla?', `Hay ${l.length} plantillas para «${USOS_CORREO[uso]}». La de por defecto es «${def.nombre}».`,
    [{ k: '', t: 'Cancelar', cls: 'sec' }, ...[def, ...l.filter(x => x !== def)].map((x, i) => ({ k: x.id, t: x.nombre, cls: i ? 'sec' : '' }))]);
  if (!k) return false;
  PLANT_ELEGIDA[uso] = k; return true;
}

// (R-12: pintarPlantillasCorreo se definía aquí otra vez; ahora está en su sitio, más arriba)
function editarPlantillaCorreo(p, nueva, alGuardar) {
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>${nueva ? 'Nueva plantilla de correo' : 'Editar la plantilla'}</h2></div><button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <div class="g2"><div><label for="pcen">Nombre</label><input id="pcen" value="${esc(p.nombre)}" maxlength="60" placeholder="Por ejemplo: Datos de pago · clínicas"></div>
      <div><label for="pceu">Se usa para</label><select id="pceu">${Object.entries(USOS_CORREO).map(([k, t]) => `<option value="${k}" ${p.uso === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div></div>
    <label for="pcea">Asunto</label><input id="pcea" value="${esc(p.asunto)}">
    <label for="pcet">Texto</label><textarea id="pcet" rows="12">${esc(p.texto)}</textarea>
    <div class="sm plchue">Huecos (pulsa para añadirlo donde está el cursor):</div>
    <div class="plcvars">${VARS_CORREO.map(([n, t]) => `<button type="button" class="btn sec chico" data-plv="${n}" title="${esc(t)}">[${n}]</button>`).join('')}</div>
    <label class="chk"><input type="checkbox" id="pced" ${p.defecto ? 'checked' : ''}> <span>Usarla por defecto para este uso</span></label>
    <div class="acts"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="pceok">Guardar</button></div>`;
  $('dlg2').showModal();
  let ult = $('pcet'); ['pcea', 'pcet'].forEach(id => $(id).addEventListener('focus', () => { ult = $(id); }));
  $('dlg2body').querySelectorAll('[data-plv]').forEach(b => b.onclick = () => {
    const t = ult, v = '[' + b.dataset.plv + ']', i = t.selectionStart == null ? t.value.length : t.selectionStart, j = t.selectionEnd == null ? i : t.selectionEnd;
    t.value = t.value.slice(0, i) + v + t.value.slice(j); t.focus(); t.selectionStart = t.selectionEnd = i + v.length;
  });
  $('pceok').onclick = () => conCarga($('pceok'), 'Guardando…', async () => {
    const nombre = $('pcen').value.trim(); if (!nombre) { toast('Pon un nombre a la plantilla', true); return; }
    const n = Object.assign({}, p, { nombre, uso: $('pceu').value, asunto: $('pcea').value.trim(), texto: $('pcet').value.replace(/\s+$/, ''), defecto: $('pced').checked });
    let l = listaCorreos().map(x => Object.assign({}, x)).filter(x => x.id !== n.id);
    if (n.defecto) l.forEach(x => { if (x.uso === n.uso) x.defecto = false; });
    l.push(n);
    Object.keys(USOS_CORREO).forEach(u => { const g = l.filter(x => x.uso === u); if (g.length && !g.some(x => x.defecto)) g[0].defecto = true; });
    if (await guardarCorreos(l)) { $('dlg2').close(); toast('Plantilla guardada'); alGuardar && alGuardar(); }
  });
}

function cfgSecDormir(sec) {
  sec.querySelectorAll(IDS_SEC.map(i => '#' + i).join(',')).forEach(e => { e.dataset.idd = e.id; e.removeAttribute('id'); });
  const c = sec.querySelector(':scope > .cfgsecc'); if (c && c.id === 'cfgcuerpo') c.removeAttribute('id');
}

function cfgSecDespertar(sec) {
  if (!sec || CFG_SEC_ACT === sec) return;
  document.querySelectorAll('#cfgcuerpo-hub .cfgsec').forEach(o => { if (o !== sec) cfgSecDormir(o); });
  const viejo = $('cfgcuerpo'); if (viejo && !sec.contains(viejo)) viejo.removeAttribute('id');
  sec.querySelector(':scope > .cfgsecc').id = 'cfgcuerpo';
  sec.querySelectorAll('[data-idd]').forEach(e => { e.id = e.dataset.idd; delete e.dataset.idd; });
  // La ventana de siempre (#dbody) solo se aparta si la sección tiene su panel
  if (sec.__panel) { const m = document.querySelector('dialog #dbody'); if (m) m.id = 'dbody-modal'; PANEL_ACTIVO = sec.__panel; }
  else { const m = $('dbody-modal'); if (m && !document.querySelector('#dbody')) m.id = 'dbody'; PANEL_ACTIVO = null; }
  CFG_SEC_ACT = sec; CFG_KEY = sec.dataset.cfgsec;
}

async function cfgApilar(it, foco) {
  const hub = $('cfgcuerpo-hub'); if (!hub) return;
  CFG_SEC_ACT = null;
  // Se preparan escondidas y la página aparece entera de una vez (sin fantasmas)
  hub.innerHTML = '<div class="cfgsecs" hidden>' + it.hijos.map(h => `<section class="cfgsec" data-cfgsec="${h.k}"><h3 class="cfgsectit">${esc(h.t)}</h3><div class="cfgsecc"></div></section>`).join('') + '</div><div class="cfgcarga cargandolocal"><span class="giro"></span> Cargando…</div>';
  hub.dataset.apilado = '1';
  for (const sec of hub.querySelectorAll('.cfgsec')) {
    if (!hub.isConnected) return;
    const h = it.hijos.find(x => x.k === sec.dataset.cfgsec);
    sec.__panel = null; PANEL_ACTIVO = null;
    const m = $('dbody-modal'); if (m && !document.querySelector('#dbody')) m.id = 'dbody';
    cfgSecDespertar(sec);
    try { await h.r(); } catch (e) {}
    await cfgEstable(sec, 4000);
    if (PANEL_ACTIVO && sec.querySelector('[data-panel]')) sec.__panel = PANEL_ACTIVO;
    try { if (typeof pulirCfg === 'function') pulirCfg(); } catch (e) {}
    // Sin título repetido: si la parte ya empieza con su título, fuera el de la sección
    if ([...sec.querySelectorAll('.cfgsecc h2')].some(x => x.offsetParent)) sec.querySelector('.cfgsectit').hidden = true;   // la parte ya trae su título
    CFG_SEC_ACT = null;
  }
  const caja = hub.querySelector('.cfgsecs'); if (caja) caja.hidden = false; const cg = hub.querySelector(':scope > .cfgcarga'); if (cg) cg.remove();
  const primera = (foco && hub.querySelector(`.cfgsec[data-cfgsec="${foco.k}"]`)) || hub.querySelector('.cfgsec');
  cfgSecDespertar(primera);
  if (foco && foco !== it.hijos[0] && primera) primera.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

// v2.344.0: los estilos de Configuración hablan de #cfgcuerpo (el contenedor activo); se copian para las demás secciones de la página
function cfgClonarEstilos() {
  const re = /#cfgcuerpo(?![-\w])/g;
  const nuevo = sel => sel.split(',').filter(p => re.test(p) && !(re.lastIndex = 0)).map(p => p.replace(re, '#cfgcuerpo-hub .cfgsecc')).join(',');
  const recorrer = (lista, dentro) => {
    for (const r of [...lista]) {
      if (r.cssRules && (r.media || (typeof CSSLayerBlockRule !== 'undefined' && r instanceof CSSLayerBlockRule))) { recorrer(r.cssRules, r); continue; }   // v2.356.0: también dentro de las capas
      if (!r.selectorText || !r.selectorText.includes('#cfgcuerpo')) continue;
      re.lastIndex = 0; const sel = nuevo(r.selectorText); if (!sel) continue;
      // v2.361.0: la copia va justo detrás de su original (al final del bloque, la de escritorio quedaba detrás de la del @media y le ganaba)
      const caja = dentro || r.parentStyleSheet;
      try { caja.insertRule(`${sel}{${r.style.cssText}}`, [...caja.cssRules].indexOf(r) + 1); } catch (e) {}
    }
  };
  for (const h of document.styleSheets) { try { if (!h.href) recorrer(h.cssRules, null); } catch (e) {} }
}

function pagMarcarSucio() { const n = PAG_SUCIO.size; ['cfuguardar', 'cfudescartar'].forEach(id => { const b = $(id); if (b) b.disabled = !n; }); }


async function bloqueZonas(u) {
  if (!PROV_CCAA) {
    const [{ data: pc }, { data: rz }] = await Promise.all([db.from('provincias_ccaa').select('provincia,comunidad'), db.rpc('zonas_resumen')]);
    const cuenta = {}; (rz || []).forEach(x => cuenta[x.provincia] = x.medicos);
    PROV_CCAA = {};
    (pc || []).forEach(x => (PROV_CCAA[x.comunidad] = PROV_CCAA[x.comunidad] || []).push({ p: x.provincia, n: cuenta[x.provincia] || 0 }));
  }
  const { data: yo } = await db.from('perfiles').select('zonas').eq('id', u.id).single();
  const sel = new Set((yo && yo.zonas) || []);
  const bonito = p => p.charAt(0) + p.slice(1).toLowerCase();
  return `<div class="blk" id="uzonas"><h3>Zona de trabajo</h3>
    <p class="sm">Marca las provincias de su zona. Al guardar, ${TT('medico', 'p', 'el', 'l', 'l')} de esas provincias que no tengan comercial entran en su cartera, y los que se den de alta después entran solos. Solo verá ${TT('medico', 'p', 'el', 'l', 'l')} de su cartera.</p>
    <div class="zonas">${Object.keys(PROV_CCAA).sort().map(cc => {
      const ps = PROV_CCAA[cc].filter((x, i, a) => a.findIndex(y => y.n === x.n && bonito(y.p).slice(0, 4) === bonito(x.p).slice(0, 4)) === i || x.n || sel.has(x.p));
      return `<details ${ps.some(x => sel.has(x.p)) ? 'open' : ''}><summary><label onclick="event.stopPropagation()"><input type="checkbox" data-zcc="${esc(cc)}" ${ps.every(x => sel.has(x.p)) ? 'checked' : ''}> ${esc(cc)}</label>
        <span class="sm">${num(ps.reduce((n, x) => n + x.n, 0))} ${TT('medico', 'p', '', 'l', 'l')}</span></summary>
        <div class="zprov">${ps.map(x => `<label><input type="checkbox" data-zp="${esc(x.p)}" data-zpc="${esc(cc)}" ${sel.has(x.p) ? 'checked' : ''}> ${esc(bonito(x.p))} <span class="sm">${num(x.n)}</span></label>`).join('')}</div></details>`;
    }).join('')}</div>
    <div class="acts" style="margin-top:8px"><button class="btn sec" id="uzok">Guardar zona y asignar sus ${TT('medico', 'p', '', 'l', 'l')}</button></div></div>`;
}

// En la factura solo va el logo si la empresa ha subido el suyo
async function logoData() { if (MARCA.logo && (AJUSTES.marca || {}).logo_factura !== false) { LOGO_DATA = MARCA.logo; LOGO_CIRC = true; return MARCA.logo; } return null; }



// Lo que se deja de tener al pasar de un plan a otro (para avisar antes)
function perdidasPlan(de, a, datos) {
  const pd = planDe(de), pa = planDe(a), extras = (datos && datos.extras) || [], l = [];
  if (de === a) return l;
  const nombreMod = m => (MOD_PLAN.find(x => x[0] === m) || [m, m])[1];
  pd.modulos.filter(m => !pa.modulos.includes(m) && m in MODULO_AREA).forEach(m => l.push(m === 'facturacion'
    ? `Facturación: ${datos && datos.facturas ? 'tus facturas quedan en solo lectura (verlas, descargarlas y cobrarlas, no emitir nuevas)' : 'no podrás emitir facturas'}` : nombreMod(m)));
  Object.keys(PLAN_SECCIONES).forEach(s => { if (PLAN_SECCIONES[s].includes(de) && !PLAN_SECCIONES[s].includes(a)) l.push(TITULO_PEDSEC[s] ? TITULO_PEDSEC[s][0] : s); });
  Object.keys(PLAN_EXTRAS).forEach(x => {
    if (!PLAN_EXTRAS[x].includes(de) || PLAN_EXTRAS[x].includes(a) || extras.includes(x)) return;
    if (x === 'oportunidades') l.push('Oportunidades');
    if (x === 'portal') l.push(`Portal ${TT('medico', 's', 'del', 'l', 'l')} y del centro${datos && +datos.medicos ? ` (${num(datos.medicos)} con acceso lo perderán)` : ''}`);
  });
  if (de === 'medida' && a === 'empresa' && datos && +datos.medicos > 50) l.push(`Portal: el plan Empresa admite hasta 50 accesos y ahora hay ${num(datos.medicos)}`);
  if (de === 'medida') l.push('Ver la plataforma como cada persona de tu equipo', 'Soporte prioritario');
  return l;
}

function reciboCalculado(pl) {
  const p = planDe(pl.plan), u = Math.max(+pl.usuarios || 0, p.minimo || 3), anual = pl.pago === 'anual';
  const cuota = u * p.precio * (anual ? 10 : 1);
  const puesta = pl.en_prueba && !anual ? PUESTA_EN_MARCHA : 0;
  return { primero: cuota + puesta + ivaDe(cuota + puesta), despues: cuota + ivaDe(cuota), puesta, anual };
}



async function pendientesCfg() {
  if (Date.now() - CFG_PEND.t < 60000) return CFG_PEND.l;
  const l = {};
  try { if (!prefsActivas().salida && puedeModulo('agenda')) l['rutas.salida'] = 'Sin punto de salida: las horas del día salen sin el primer trayecto'; } catch (e) {}
  if (puedeOrganizacion()) {
    try { const { data: c } = await RPC_ORIG('correo_config', {}); if (!c || !c.host) l['o.correo'] = 'Sin configurar: los correos de la empresa no salen'; } catch (e) {}
    try {
      const { data: au } = await db.from('auditoria').select('creado_en').eq('accion', 'Copia de seguridad').order('creado_en', { ascending: false }).limit(1);
      const d = au && au[0] ? Math.floor((Date.now() - new Date(au[0].creado_en)) / 864e5) : null;
      if (d == null) l['o.copias'] = 'Todavía no hay ninguna copia'; else if (d > 7) l['o.copias'] = `La última copia es de hace ${d} días`;
    } catch (e) {}
  }
  CFG_PEND = { t: Date.now(), l };
  return l;
}


// Grupo «Invitados» de Usuarios
function pintarInvitados(lista, acc) {
  const box = $('usrinv'); if (!box) return;
  const hace = t => { if (!t) return null; const d = new Date(t); return isNaN(d) ? null : d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }); };
  $('usrinvn').textContent = lista.length ? '· ' + num(lista.length) : '';
  box.innerHTML = lista.map(u => {
    const a = acc[u.id] || {}, ult = hace(a.ultima_conexion || a.ultimo_acceso);
    return `<div class="usrinv ${u.activo ? '' : 'off'}">
      <span class="usrav" style="background:${esc((rolDef(u.rol) || {}).color || '#17457A')}">${esc(iniciales(u.nombre))}</span>
      <span class="usrtx"><b>${esc(u.nombre)}</b><span class="sm">${esc(u.email || '')}</span>
        <span class="usrchips">${u.cuenta_id ? `<button class="pill p-per" data-uinvf="${u.cuenta_id}" title="Abrir su ficha">${esc(u.medico || u.cuenta || 'Su ficha')}</button>` : '<span class="pill p-anu">Sin ficha</span>'}
          ${u.activo ? '' : '<span class="pill p-anu">Desactivado</span>'}
          <span class="sm usrinvult">${ult ? esc(conexionTxt(a)) : 'Aún no ha entrado'}</span></span>
        <span class="sm usrinvve">${esc(queVeInvitado(u))}</span></span>
      <span class="usrinvacts">${puedeVerComo(u) ? `<button class="btn" data-ucomo="${u.id}">👤 Impersonalizar</button>` : ''}
        <button class="btn sec" data-uinvd="${u.id}">Detalles</button></span></div>`;
  }).join('') || `<div class="vacio">${Object.keys(acc).length || (USUARIOS || []).some(esInvitado) ? 'Nadie con estos filtros.' : `Todavía no has dado acceso a nadie. Se da desde su ficha: «Acceso a la plataforma» → «Dar acceso».`}</div>`;
  box.querySelectorAll('[data-uinvf]').forEach(b => b.onclick = () => abrirFicha(b.dataset.uinvf));
  box.querySelectorAll('[data-uinvd]').forEach(b => b.onclick = () => detalleUsuario((USUARIOS || []).find(x => x.id === b.dataset.uinvd)));
}







/* v2.69.0 · Permisos por capacidad. El código pregunta qué puede hacer una persona (puede('administrar')),
   nunca cómo se llama su rol: los roles y sus capacidades son datos de cada cliente (tablas roles y roles_capacidades). */
const ROLKEY = 'dlc-roles';

let ROLES_DEF = [];

const rolDef = r => ROLES_DEF.find(x => x.nombre === r) || null;

const rolPuede = (r, c) => { const d = rolDef(r); return !!(d && (d.capacidades || []).includes(c)); };

const rolesNombres = () => ROLES_DEF.map(x => x.nombre);

const rolCon = c => (ROLES_DEF.find(x => (x.capacidades || []).includes(c)) || {}).nombre || '';

const rolPorDefecto = () => (ROLES_DEF.find(x => x.por_defecto) || ROLES_DEF.find(x => !(x.capacidades || []).includes('administrar')) || {}).nombre || '';


const marca = paso => console.info(`[App] ${paso} · ${Math.round(performance.now() - T0)} ms`);

let AJUSTES = {};

const salidaUsuario = () => prefsActivas().salida || { nombre: `la ${TT('visita', 's', 'primer', 'l', 'l')}`, lat: null, lon: null, falta: true };

let ABRIR_PLAN_SEMANA = false;

const zonasMarcadas = () => [...$('dbody').querySelectorAll('#uzonas [data-zp]:checked')].map(x => x.dataset.zp).sort();

let LOGO_DATA = null;

let PANEL_ACTIVO = null;

const CFG_DE_MODULO = { agenda: 'horario', rutas: 'horario', admin: 'usuarios', facturacion: 'fiscal', inicio: 'kpis', config: 'prefs', directorio: 'cat', ventas: 'cat', permisos: 'usuarios', medico: 'usuarios', roles: 'usuarios' };

let USR_F = { q: '', rol: '', est: 'activos' };

const plantillaRol = r => Object.assign({}, (rolDef(r) || {}).plantilla || {}, (AJUSTES.roles || {})[r] || {});

const CFG_ADMIN = { usuarios: 'usuarios', comisiones: 'comis', accesos: 'accesos', auditoria: 'auditoria' };

let NOTIF_N = 0;

const LOGO_NEUTRO = 'logo-app.png';

let CFG_SUB = null;

// Nombres anteriores de cada apartado → dónde está ahora
const CFG_ANTES = { prefs: ['perfil'], horario: ['rutas', 'horario'], kpis: ['inicio', 'kpis'], usuarios: ['equipo', 'usuarios'],
  roles: ['equipo', 'roles'], reglas: ['cartera', 'reglas'], frec: ['cartera', 'frec'], accesos: ['seguridad', 'accesos'], auditoria: ['seguridad', 'auditoria'],
  alm: ['stock', 'alm'], mues: ['stock', 'mues'], fiscal: ['fact', 'fiscal'], series: ['fact', 'series'], vf: ['fact', 'vf'] };

// Registro de facturación: el detalle de cada evento en texto legible
const NOMBRES_DETALLE = { importe: 'Importe', forma: 'Forma de pago', motivo: 'Motivo', para: 'Para', asunto: 'Asunto', clave: 'Ajuste', total: 'Total', serie: 'Serie', numero: 'Número' };

/* ============================================================
   v2.72.0 · Motor de campos personalizados (fase 2 de la auditoría)
   Cada cliente define sus campos (tipo, obligatorio, dónde se ven) en
   Configuración → Catálogos, y la plataforma genera los formularios,
   las columnas y los filtros. Los valores se guardan con guardar_campos().
   ============================================================ */
const CAMPOS = { medico: [], cliente: [], producto: [], pedido: [] };

// Campos de la pantalla: primero los marcados como «Filtro», después el resto (en su orden)
const clasCampos = amb => [...(CAMPOS[amb] || [])].sort((a, b) => (b.en_filtro ? 1 : 0) - (a.en_filtro ? 1 : 0));

const PUESTA_EN_MARCHA = 490;

const precioPlan = p => p.presupuesto ? 'presupuesto a medida' : `${eurI(p.precio)} por usuario al mes, ${eurI(p.anual)} con pago anual`;

// Usuarios contratados (A medida o sin dato: sin límite)
const usuariosContratados = () => PLAN_ACTUAL.plan === 'medida' || PLAN_ACTUAL.usuarios == null ? Infinity : +PLAN_ACTUAL.usuarios;

/* v2.123.0 · Historial de cambios y deshacer (administración). La base guarda cada cambio con su valor de antes; aquí se ve por
   ficha y se deshace: un cambio, o todo lo que una persona cambió desde una fecha. Solo fichas, consultas, clientes, productos y
   rutas (pedidos, facturas, usuarios y cartera tienen efectos en stock, facturación, comisiones o permisos). */
const DESHACIBLES = ['cuentas', 'ubicaciones', 'contactos', 'productos', 'rutas'];

const deshacible = a => DESHACIBLES.includes(a.entidad) && ['Edición', 'Baja'].includes(a.accion);


/* v2.133.0 · Entorno de pruebas: «Traer los datos de producción». Junto a «Volver a los datos de partida» (y para quien puede
   usarlo), pide a la función «refrescar-pruebas» de Supabase que lance el proceso de GitHub que copia los datos actuales de
   producción (solo los lee) y los deja como nuevos datos de partida. La franja enseña en qué punto está y recarga al terminar. */
const MOTIVO_REFRESCO = { permiso: 'Solo la administración puede traer los datos de producción', responsable: 'Solo la persona responsable del entorno de pruebas puede hacerlo',
  en_marcha: 'Ya se están copiando los datos de producción', github: 'No se ha podido lanzar la copia en GitHub', no_es_pruebas: 'Esto solo funciona en el entorno de pruebas' };


const NOTIF_AREAS = [
  ['ventas', 'Ventas', ['reponer', 'caida_ventas', 'pedido_portal', 'venta_cartera', 'pauta', 'pedido_validado', 'pago_recibido', 'borrador_nuevo', 'cliente_nuevo']],
  ['cartera', 'Cartera y agenda', ['citas_hoy', 'visita_sin_registrar', 'seguimientos_hoy', 'sin_visitar', 'cartera', 'cruce', 'duplicado', 'portal']],
  ['cobros', 'Cobros y stock', ['pagos_pendientes', 'facturas_vencidas', 'stock_minimo', 'lotes_caducan', 'compra_recibida', 'rectificativa']],
  ['equipo', 'Equipo', ['usuario_nuevo', 'esquema']]
];

// Los que se preparan al empezar el día: solo tienen «en el resumen»
const NOTIF_DIARIOS = ['citas_hoy', 'seguimientos_hoy', 'pagos_pendientes', 'facturas_vencidas', 'lotes_caducan', 'sin_visitar', 'reponer', 'caida_ventas', 'visita_sin_registrar'];

const notifArea = t => (NOTIF_AREAS.find(a => a[2].includes(t)) || ['otros'])[0];

/* v2.167.0 · «Pedir presupuesto» dentro de delcos (petición de Eric: nada de abrir el correo ni llevar al cliente fuera). Un formulario con
   la imagen de la plataforma: el contacto ya relleno, qué buscan (opciones que se marcan, sin cerrar nada: siempre hay «Cuéntanos con tus
   palabras»), tamaño, cuándo y cómo prefieren que les contactemos. Se guarda (pedir_presupuesto, SQL 104), delcos recibe un aviso al
   momento y la empresa ve en «Plan y suscripción» en qué punto está. Con A medida, el mismo formulario sirve para hablar del contrato.
   En el panel de delcos, pestaña «Solicitudes» con su estado y una nota. */
const PRESU_NECESITA = [
  ['usuarios', 'Más de 50 usuarios'], ['migracion', 'Migrar nuestros datos'], ['conexion', 'Conectar con nuestro programa (ERP, CRM, contabilidad…)'],
  ['portal', 'Portal para muchos profesionales o centros'], ['desarrollo', 'Algo hecho a nuestra medida'], ['formacion', 'Formación del equipo'],
  ['soporte', 'Soporte prioritario'], ['otro', 'Otra cosa']];

const PRESU_CUANDO = ['Lo antes posible', 'Este trimestre', 'Más adelante', 'Solo me estoy informando'];

const PRESU_ESTADO = { 'Nueva': 'Recibida', 'En curso': 'En curso', 'Cerrada': 'Atendida' };

const CFG_VIEJO = { prefs: 'rutas.salida', perfil: 'datos', datos: 'datos', notif: 'notif', horario: 'rutas.horario', kpis: 'inicio.kpis', usuarios: 'usuarios',
  roles: 'roles', equipo: 'usuarios', reglas: 'cartera.reglas', frec: 'cartera.frec', accesos: 'seguridad.accesos', auditoria: 'seguridad.auditoria',
  alm: 'stock.alm', mues: 'stock.mues', marca: 'o.marca', __empresa: 'o.marca', empresa: 'o.marca', correo: 'o.correo', copias: 'o.copias', plan: 'o.plan',
  fact: 'o.fiscal', fiscal: 'o.fiscal', series: 'o.series', vf: 'o.vf', pdf: 'o.pdf', orgs: 'o.orgs' };

const CFG_CLAVES = { datos: 'nombre teléfono idioma perfil contraseña sesión cerrar', notif: 'avisos campana silencio resumen',
  'rutas.salida': 'salida llegada casa oficina navegar google maps waze', 'rutas.horario': 'tiempos minutos duración parada',
  'inicio.kpis': 'indicadores kpi inicio', usuarios: 'personas equipo alta invitar cartera zona', roles: 'permisos capacidades',
  comis: 'comisiones esquemas tramos', 'o.marca': 'logo nombre vocabulario términos palabras', 'o.correo': 'smtp firma remitente email correo',
  'o.plan': 'suscripción pago tarjeta usuarios precio', 'o.copias': 'copia seguridad descargar exportar', 'o.fiscal': 'nif razón social dirección',
  'o.series': 'numeración factura', 'o.vf': 'verifactu hacienda', 'o.pdf': 'factura diseño logo colores', cat: 'clasificadores listas valores especialidades motivos',
  portal: 'portal material pedir' };

// v2.340.0 (Eric): cada apartado es una sola entrada del índice; sus partes (Rutas: salida y tiempos…) van dentro, en pestañas
const hojasCfg = arbol => arbol.flatMap(([gr, l]) => l.map(it => Object.assign({ gr }, it)));

let CFG_PEND = { t: 0, l: {} };

const LUPA_CFG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

let CFG_DETALLE = false;

let CFU_RAF = 0;

/* v2.216.0 · Tu cuenta y Empresa en filas de ajuste (segunda versión del rediseño de Configuración).
   pulirCfg() se aplica al contenido de cada apartado mientras se pinta (MutationObserver de #cfgcuerpo), sin tocar cómo guarda cada uno:
   - Las tarjetas que solo presentan el apartado desaparecen y su texto pasa a la cabecera; el título repetido de la primera tarjeta se oculta.
   - Tiempos de visita y el aviso de Salida y llegada: filas de ajuste con el número compacto a la derecha.
   - Marca y vocabulario: el vocabulario, en su propia tarjeta como tabla (singular, plural y género por fila), con el nombre del módulo.
   - Correo y firma: arriba, el estado del correo y «Enviar un correo de prueba»; la vista previa de la firma acompaña al desplazarse.
   - Copias de seguridad: el estado y «Descargar copia completa» en la misma fila. */
const CFG_PULIR = ['datos', 'rutas.salida', 'rutas.horario', 'inicio.kpis', 'o.marca', 'o.correo', 'o.plan', 'o.copias'];

const notifIco = t => (TIPOS_NOTIF.find(x => x[0] === t) || [])[1] || '🔔';

/* v2.235.0 · Textos personalizados (Eric eligió la A de https://claude.ai/artifact/6uxwD5zLEbd3krk1QMeoPF; SQL 140).
   - Configuración → Empresa → «Textos personalizados»: una lista con buscador y filtros con todo lo que cada empresa puede llamar a
     su manera: vocabulario (ajuste terminos), nombres del menú (ajuste menu_nombres; el de las fichas es marca.etiqueta), estados
     comerciales y resultados de visita (renombrar_texto: también en las fichas y en las visitas ya registradas), roles y campos.
   - Los nombres del menú se aplican en el menú lateral, la barra del móvil, «Más» y el título de cada pantalla. */
const TX_IC = { rv: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', lupa: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>' };

const txSV = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';

let TX_OBS = 0;

let TX = null;   // {filas, filtro, q}

const TX_G = [['voc', 'Vocabulario', 'Las palabras que salen en todos los textos. En blanco, la de siempre.'],
  ['menu', 'Menú', 'El nombre de cada apartado del menú y de su pantalla. En blanco, el de siempre.'],
  ['est', 'Estados y resultados', 'Al cambiar un nombre, se cambia también en las fichas y en las visitas que ya lo tienen.'],
  ['rol', 'Roles', 'El nombre de cada rol. Sus usuarios y permisos siguen igual.'],
  ['campo', 'Campos de la ficha', 'El nombre de cada campo personalizado.']];

const txCambiada = f => f.g === 'voc' ? (f.s !== f.s0 || f.p !== f.p0) : (f.v || '') !== (f.v0 || '');

const txPersonal = f => f.g === 'voc' ? !!(f.s || f.p) : f.g === 'menu' ? !!f.v : false;

/* ============================================================
   v2.306.0 · Textos de los correos a los clientes (revisión de Eric con un correo real: al cliente le llegó «IBAN: (añade el
   IBAN…)», la despedida repetía lo que ya dice la firma y el concepto no era su nombre). Cada empresa escribe sus textos en
   Configuración → Correo y firma → «Textos de los correos», con huecos como [nombre] o [iban] que se rellenan al enviar.
   Se guardan en el ajuste plantillas_correo. Sin IBAN no se envían los datos de pago. La despedida y los teléfonos van solo en la firma.
   ============================================================ */
const PLANT_CORREO = {
  pago: { titulo: 'Datos de pago por transferencia', asunto: '[Documento] [numero] de [empresa] para [nombre]',
    texto: 'Hola [nombre_pila]:\n\nGracias por tu pedido [numero], por un importe de [importe].\n\nPara completarlo, haz una transferencia bancaria con estos datos:\n\nBeneficiario: [beneficiario]\nIBAN: [iban]\nImporte: [importe]\nConcepto: [nombre]\n\nIndica el concepto tal como aparece arriba: así identificamos el pago enseguida y no se retrasa la preparación del pedido.\n\nEn cuanto recibamos el pago preparamos el envío.' },
  factura: { titulo: 'Envío de la factura', asunto: '[Documento] [numero] de [empresa] para [nombre]',
    texto: 'Hola [nombre_pila]:\n\nTe adjuntamos la [documento] [numero] de tu pedido, por un importe de [importe].\n\nGracias por tu confianza. Si tienes cualquier duda, estaremos encantados de ayudarte.' }
};

const VARS_CORREO = [['nombre', 'Nombre completo del cliente'], ['nombre_pila', 'Solo el nombre de pila'], ['empresa', 'Vuestra razón social'], ['documento', 'pedido o factura'],
  ['Documento', 'Pedido o Factura'], ['numero', 'Número del pedido o la factura'], ['importe', 'Importe total'], ['beneficiario', 'Titular de la cuenta (razón social)'], ['iban', 'IBAN de los datos fiscales']];

/* ============================================================
   v2.342.0 · Plantillas de correo y de PDF (Eric, 20/10/2026: «que el usuario vaya creando las que quiera, con el nombre que quiera»;
   eligió que al enviar salga la de por defecto y se pueda cambiar).
   - Correo: ajuste plantillas_correo.lista = [{ id, nombre, uso: pago|factura, asunto, texto, defecto }]. Sin lista, las dos de
     siempre (y los textos guardados antes). Configuración → Correo y firma → «Plantillas de correo»: crear, editar, duplicar,
     eliminar y elegir la de por defecto de cada uso. Al enviar los datos de pago o la factura, si hay más de una, se elige.
   - PDF: ajuste factura_pdf_plantillas = { lista: [{ id, nombre, cfg }], defecto }. factura_pdf sigue siendo el de por defecto (lo usa
     también la base, en la proforma del portal). En «Diseño del PDF», una barra para elegir la plantilla, crear, renombrar, eliminar
     y hacerla la de por defecto. Al descargar o enviar una factura, si hay más de una, se elige.
   ============================================================ */
const USOS_CORREO = { pago: 'Datos de pago', factura: 'Envío de la factura' };

const idPlant = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

const plantillasCorreo = uso => listaCorreos().filter(x => x.uso === uso);

const cfgDePlantilla = id => { const p = listaPDF().lista.find(x => x.id === id); const c = (p && p.cfg) || {};
  return Object.assign({}, PDF_DEF, c, { cols: Object.assign({}, PDF_DEF.cols, c.cols || {}) }); };

let CFG_SEC_ACT = null;

const cfgEstable = (el, max) => new Promise(ok => {
  let t = 0, fin = 0; const ob = new MutationObserver(() => { clearTimeout(t); t = setTimeout(listo, 150); });
  const listo = () => { if (el.querySelector('.cfgcarga, .giro, .spin')) { t = setTimeout(listo, 150); return; } ob.disconnect(); clearTimeout(fin); ok(); };
  ob.observe(el, { childList: true, subtree: true, attributes: true }); t = setTimeout(listo, 200); fin = setTimeout(() => { ob.disconnect(); clearTimeout(t); ok(); }, max || 5000);
});

/* pintarPlan: la parte base y, en orden, cada paso que se le añade (antes eran 6 capas separadas). */
function pintarPlanBase2() {
  pintarPlanBase();
  planBotonesAgenda();
  planHorasYFueraDePlan();
  planMapaYDescartar();
  planVisitadosRecientes();
  planAvisoSinSalida();
  planFichasYNotas();
}

function abrirHorarioPlanBase() {
  const c = PLANCFG();
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Tiempos de ${TT('visita', 's', '', 'l', 'l')}</h2><div class="sm">Se guardan en tus preferencias. La hora de salida y la de vuelta se ponen en cada ruta.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="hvis">Minutos por ${TT('medico', 's', '', 'l', 'l')}</label><input id="hvis" type="number" min="5" max="60" value="${c.visita}"></div>
      <div><label for="hpar">Minutos fijos por parada</label><input id="hpar" type="number" min="0" max="40" value="${c.parada}"></div>
    </div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="hok">Guardar</button></div>`;
  $('hok').onclick = async ev => {
    ev.target.disabled = true;
    const plan = { visita: +$('hvis').value || 15, parada: $('hpar').value === '' ? 10 : +$('hpar').value };
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { plan });
    const { data } = await db.rpc('guardar_preferencias', { p: prefs });
    PERFIL.preferencias = data || prefs;
    $('dlg').close(); toast('Horario guardado');
    if (ULTIMO_PLAN) construirPlan(ULTIMO_PLAN.conXY, ULTIMO_PLAN.rutaId, null, ULTIMO_PLAN.opts);
    else if (PLAN && PLAN.rutaId) {
      if (typeof PLAN.rutaId === 'string' && PROPUESTAS && PROPUESTAS[PLAN.rutaId]) planDesdeLista(PROPUESTAS[PLAN.rutaId], PLAN.rutaId);
      else planificar(PLAN.rutaId, $('rnueva') || document.createElement('button'));
    }
  };
  $('dlg').showModal();
}





async function pintarPrefsPerfilBase() {
  // v2.340.0: la tarjeta de la persona se pinta directamente en su sitio (antes, en un contenedor escondido esperando a pintarPrefs:
  // llegaba tarde o, si quedaba otra #miperfil en la copia fija, no llegaba y dejaba el hueco)
  document.querySelectorAll('#miperfil, #mpextra').forEach(x => { if (x.closest('.congelada')) x.removeAttribute('id'); else x.remove(); });
  if (!$('perfilcab')) return;
  const p = pintarPrefsPaso2();
  const mp = $('miperfil');
  if (mp && $('perfilcab')) $('perfilcab').replaceWith(mp); else if ($('perfilcab')) $('perfilcab').remove();
  try { await p; } catch (e) {}
}



// pintarPrefsPerfil pone la tarjeta de la persona después: va a su sitio dentro de la tarjeta única
async function pintarPrefsPerfil(...a) {
  const p = pintarPrefsPerfilBase.apply(this, a);
  const mp = $('miperfil'), row = document.querySelector('#cfgcuerpo .perfunorow');
  if (mp && row && mp.parentElement !== row) { mp.classList.remove('card', 'cfgpanel'); mp.classList.add('perfparte'); row.prepend(mp); }
  return p;
}

// v2.242.0: aquí iba envioCfg (nadie la usaba)
async function cargarAjustesBase() {
  const { data } = await db.rpc('ajustes_lista');
  AJUSTES = data || {};
}


/* pintarPerfil: la parte base y, en orden, cada paso que se le añade (antes eran 4 capas separadas). */
function pintarPerfilBase2() {
  pintarPerfilBase();
  pintarPerfilPaso1();
  pintarPerfilPaso2();
  pintarPerfilPaso3();
  pintarPerfilPaso4();
}

function arbolConfigBase() {
  const admin = puede('administrar');
  return [
    ['Tu cuenta', [
      { k: 'perfil', ic: 'user', t: 'Mi perfil', d: 'Tus datos, idioma y qué abrir al entrar', r: pintarPerfil },
      { k: 'notif', ic: 'bell', t: 'Notificaciones', d: 'Qué avisos quieres recibir', r: pintarNotif },
      { k: 'rutas', ic: 'route', t: 'Rutas', d: `Punto de salida y llegada, y tiempos de ${TT('visita', 's', '', 'l', 'l')}`, sub: [['salida', 'Salida y llegada', () => pintarPrefsParte('rutas')], ['horario', `Tiempos de ${TT('visita', 's', '', 'l', 'l')}`, () => panelDeVentana(abrirHorarioPlan)]] },
      { k: 'inicio', ic: 'house', t: 'Inicio', d: 'Indicadores de Inicio', sub: [['kpis', 'Indicadores', () => panelDeVentana(abrirKpis)]] }]],
    ['Equipo', admin ? [
      { k: 'equipo', ic: 'users', t: 'Usuarios y roles', d: 'Personas, permisos y roles', sub: [['usuarios', 'Usuarios', pintarUsuarios2], ['roles', 'Roles y permisos', pintarRoles]] },
      { k: 'cartera', ic: 'compass', t: `Cartera y ${TT('visita', 'p', '', 'l', 'l')}`, d: `Reglas de cartera y frecuencia de ${TT('visita', 's', '', 'l', 'l')}`, sub: [['reglas', 'Reglas de cartera', () => panelDeVentana(editorReglasCartera)], ['frec', `Frecuencia de ${TT('visita', 's', '', 'l', 'l')}`, () => panelDeVentana(editorFrecuencia)], ['ciclo', 'Ciclo A/B/C', () => panelDeVentana(editorCiclo)]] },
      { k: 'comis', ic: 'euro', t: 'Comisiones', d: 'Esquemas y quién cobra con cada uno', mod: 'ventas', r: () => panelDeModulo('comisiones') },
      { k: 'seguridad', ic: 'lock-keyhole', t: 'Seguridad y registro', d: 'Accesos y cambios registrados', sub: [['accesos', 'Accesos', () => panelDeModulo('accesos')], ['auditoria', 'Auditoría', () => panelDeModulo('auditoria')]] }] : []],
    ['Datos', [
      ...(puedeCatalogos() ? [{ k: 'cat', ic: 'tag', t: 'Clasificadores', d: 'Listas de valores: estados, motivos…', r: () => { $('cfgcuerpo').innerHTML = ''; pintarCatalogos(); } }] : []),
      ...(admin || nivelDe2('P') >= 3 ? [{ k: 'stock', ic: 'warehouse', t: 'Stock y material', d: `Almacenes y material de ${TT('visita', 's', '', 'l', 'l')}`, mod: 'productos', sub: [['alm', 'Almacenes', pintarAlmacenes2], ['mues', `Material de ${TT('visita', 's', '', 'l', 'l')}`, pintarMaterial]] }] : [])]],
    ['Facturación', admin ? [
      { k: 'fact', ic: 'receipt', t: 'Facturación', d: 'Datos fiscales, series y VeriFactu', mod: 'facturacion', sub: [['fiscal', 'Datos fiscales', fac(pintarEmpresa)], ['series', 'Series', fac(pintarSeries)], ['vf', 'VeriFactu', fac(pintarVerifactu)], ['pdf', 'Diseño del PDF', () => disenoPDF()]] }] : []],
    ['Empresa', admin ? [
      { k: 'marca', ic: 'palette', t: 'Marca y logo', d: 'Nombre de la plataforma y logo', r: pintarMarca },
      { k: 'correo', ic: 'mail', t: 'Correo y firma', d: 'Cuenta de envío y firma', r: pintarCorreo },
      { k: 'copias', ic: 'save', t: 'Copias de seguridad', d: 'Descarga todos los datos', r: pintarCopias }] : []],
    ['Plataforma', puede('gestionar_plataforma') ? [
      { k: 'orgs', ic: 'building', t: 'Organizaciones', d: 'Empresas de la plataforma y alta de nuevas', r: pintarOrganizaciones }] : []]
  ].filter(g => g[1].length);
}

function arbolConfigBase2() { return arbolConfigBase().filter(g => g[0] !== 'Empresa'); }

// Se amplía el árbol con los apartados ocultos y se envuelve cada pintado para mostrar carga y errores
function arbolConfigBase3() {
  const g = arbolConfigBase2();
  const envolver = f => async () => {
    const c = $('cfgcuerpo'); c.innerHTML = '<div class="cfgcarga"><span class="giro"></span> Cargando…</div>';
    // Si al cabo de 20 segundos sigue cargando, se avisa en lugar de dejarlo en blanco
    setTimeout(() => { if (c.isConnected && c.querySelector(':scope > .cfgcarga')) mostrarError(new Error('El apartado no ha terminado de cargar. Revisa la conexión y vuelve a intentarlo.')); }, 20000);
    const mostrarError = e => {
      c.innerHTML = `<div class="card cfgpanel"><h2>No se ha podido cargar</h2><p class="sm">${esc(e && e.message ? e.message : String(e))}</p>
        <div class="acts"><button class="btn sec" id="cfgreint">${svgIco(ICON_NOM['rotate-cw'])} Reintentar</button></div></div>`;
      $('cfgreint').onclick = () => envolver(f)();
    };
    try { await f(); }
    catch (e) { mostrarError(e); }
  };
  g.forEach(([, l]) => l.forEach(x => { if (x.r) x.r = envolver(x.r); if (x.sub) x.sub.forEach(s => { s[2] = envolver(s[2]); }); }));
  // Apartado oculto «Empresa» (se abre desde el menú de usuario)
  g.push(['__oculto', [{ k: '__empresa', ic: 'building', t: 'Empresa', d: '', sub: [['marca', 'Marca y logo', envolver(pintarMarca)], ['correo', 'Correo y firma', envolver(pintarCorreo)], ['copias', 'Copias de seguridad', envolver(pintarCopias)]] }]]);
  return g;
}


function arbolConfigBase4() {
  const g = arbolConfigBase3();
  g.forEach(([, l]) => l.forEach(x => { if (x.k === 'seguridad' && x.sub && !x.sub.some(s => s[0] === 'errores')) x.sub.push(['errores', 'Errores y reportes', pintarErrores]); }));
  return g;
}

// Configuración ya no repite Mi perfil ni Notificaciones: están en su propia página
function arbolConfigBase5() { return arbolConfigBase4().map(([g, l]) => [g, l.filter(x => !['perfil', 'notif'].includes(x.k))]).filter(g => g[1].length); }


function pintarPerfilBase3() {
  pintarPerfilBase2();
  // El contenedor de la página (no el provisional que se usa mientras se prepara la tarjeta de la persona)
  const c = document.querySelector('#v-perfil .pagcuerpo') || (TAB === 'config' ? document.querySelector('#v-config #cfgcuerpo-real, #v-config #cfgcuerpo') : null); if (!c || c.querySelector('.perfseg')) return;
  c.classList.add('perfil2');
  c.insertAdjacentHTML('beforeend', `<div class="card cfgpanel perfseg"><h2 style="padding:0 0 4px">${svgIco(ICON_NOM.shield)} Seguridad y sesión</h2>
    <p class="sm">Para cambiar la contraseña te enviamos un enlace a tu correo. Así nadie puede cambiarla desde un dispositivo que hayas dejado abierto.</p>
    <div class="perfsegf"><div><span class="sm">Correo de acceso</span><b>${esc(PERFIL.email || '')}</b></div><div><span class="sm">Rol</span><b>${esc(PERFIL.rol)}</b></div></div>
    <div class="acts" style="justify-content:flex-start;flex-wrap:wrap"><button class="btn sec" id="perfclave">${svgIco(ICON_NOM['key-round'])} Enviarme el enlace para cambiar la contraseña</button>
      <button class="btn sec" id="perfsalir">${svgIco(ICON_NOM['log-out'])} Cerrar sesión</button></div></div>`);
  $('perfclave').onclick = () => conCarga($('perfclave'), 'Enviando…', async () => {
    const { error } = await db.auth.resetPasswordForEmail(PERFIL.email, { redirectTo: location.origin + location.pathname });
    toast(error ? 'No se ha podido enviar: ' + error.message : 'Te hemos enviado el enlace a ' + PERFIL.email, !!error);
  });
  $('perfsalir').onclick = () => { const s = document.querySelector('[data-u="salir"]'); if (s) s.click(); };
  // (el nombre configurado del módulo de contactos lo aplica el componente general, antes de pintar)
}

// Configuración ya no repite Facturación (datos fiscales, series y VeriFactu): están en Facturación → Configuración.
// Además, tenerlo en los dos sitios creaba dos contenedores con el mismo identificador.
function arbolConfigBase6() { return arbolConfigBase5().map(([g, l]) => [g, l.filter(x => x.k !== 'fact')]).filter(g => g[1].length); }

// Configuración → Datos → Importar datos (administración)
function arbolConfigBase7() {
  const g = arbolConfigBase6();
  // v2.109.0: con el permiso «Importar datos» del rol (antes, solo administración)
  if (!puede('importar_datos')) return g;
  const datos = g.find(x => x[0] === 'Datos');
  const item = { k: 'importar', ic: 'file-spreadsheet', t: 'Importar datos', d: `Clientes, productos, ${etiquetaContactos().toLowerCase()} y ventas desde Excel o CSV`,
    sub: [['nueva', 'Nueva importación', pintarImportar], ['historial', 'Importaciones', pintarImportaciones]] };
  if (datos) { if (!datos[1].some(x => x.k === 'importar')) datos[1].push(item); } else g.push(['Datos', [item]]);
  return g;
}

// Configuración, sin lo que ahora está en Organización
function arbolConfigBase8() {
  return arbolConfigBase7().map(([g, l]) => [g, l.filter(x => !['fact', 'marca', 'correo', 'copias', 'orgs'].includes(x.k))]).filter(g => g[1].length);
}

function arbolConfigBase9() {
  const g = arbolConfigBase8();
  if (puede('administrar') && hayExtra('portal')) {
    const it = { k: 'portal', ic: 'stethoscope', t: `Portal ${TT('medico', 's', 'del', 'l', 'l')}`, d: 'Material que pueden pedir', r: pintarCfgPortal };
    const datos = g.find(x => x[0] === 'Datos');
    if (datos) datos[1].push(it); else g.push(['Datos', [it]]);
  }
  return g;
}

// Configuración: Inicio primero; Usuarios y roles, y Seguridad y registro, ya no están aquí
function arbolConfig() {
  const g = arbolConfigBase9().map(([n, l]) => [n, l.filter(x => !['equipo', 'seguridad', 'orgs'].includes(x.k))]).filter(x => x[1].length);
  for (const grupo of g) {
    const i = grupo[1].findIndex(x => x.k === 'inicio');
    if (i >= 0) { const [it] = grupo[1].splice(i, 1); g[0][1].unshift(it); break; }
  }
  return g;
}

// Mis datos: una sola tarjeta (la persona, sus datos y la seguridad)
function pintarPerfil(...a) {
  const r = pintarPerfilBase3.apply(this, a);
  if (TAB !== 'config') return r;
  const c = $('cfgcuerpo'); if (!c || c.querySelector('.perfuno')) return r;
  const mp = c.querySelector('#miperfil'), dt = [...c.children].find(x => x.querySelector && x.querySelector('#pfn')), sg = c.querySelector('.perfseg');
  if (!dt) return r;
  const u = document.createElement('div'); u.className = 'card cfgpanel perfuno';
  u.innerHTML = '<div class="perfunorow"></div>';
  const row = u.firstChild;
  [mp, dt].filter(Boolean).forEach(x => { x.classList.remove('card', 'cfgpanel'); x.classList.add('perfparte'); row.appendChild(x); });
  if (sg) { sg.classList.remove('card', 'cfgpanel'); sg.classList.add('perfparte'); u.appendChild(sg); }
  c.prepend(u);
  return r;
}

// Filtros generados (listas y sí/no) para una zona de filtros; al cambiar, actualiza «estado» y llama a «alCambiar»
function camposFiltros() { return ''; }

/* ---------- Cuentas: la sección va en su panel de filtros, con sus columnas ---------- */
// Todos los campos pueden ser columna; de entrada se ven los que tienen «Columna en la tabla»

// v2.242.0: aquí iba la primera versión de notifPintar (se redefine entera más abajo)
function panelNotificaciones(l) {
  NOTIF_LISTA = l || [];
  notifPintar();
  if (!$('dlg').open) $('dlg').showModal();
}

function notifPintar() {
  const l = NOTIF_LISTA;
  const areas = NOTIF_AREAS.filter(a => l.some(x => notifArea(x.tipo) === a[0]));
  if (NOTIF_FILTRO && !areas.some(a => a[0] === NOTIF_FILTRO)) NOTIF_FILTRO = '';
  const vis = l.filter(x => !NOTIF_FILTRO || notifArea(x.tipo) === NOTIF_FILTRO);
  const nuevas = vis.filter(x => !x.leida_en), viejas = vis.filter(x => x.leida_en);
  const fila = x => {
    const acc = notifAcciones(x), cuando = new Date(x.visible_desde || x.creado_en), g = notifDia(x.visible_desde || x.creado_en);
    return `<div class="notit2 ${x.leida_en ? '' : 'nuevo'}" data-nidx="${l.indexOf(x)}">
      <span class="ic" aria-hidden="true">${notifIco(x.tipo)}</span>
      <div class="tx"><b>${esc(x.titulo)}</b>${x.cuerpo ? `<span class="sm">${esc(x.cuerpo)}</span>` : ''}
        <span class="sm notcuando">${g === 'Hoy' ? cuando.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : g === 'Ayer' ? 'Ayer' : cuando.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}${x.resumen ? ' · del resumen del día' : ''}</span>
        <div class="notacts">${acc.map(([t, , p], j) => `<button type="button" class="btn chico ${p ? '' : 'sec'}" data-nacc="${j}">${esc(t)}</button>`).join('')}
          ${x.leida_en ? '' : '<button type="button" class="btn sec chico" data-npos>Posponer a mañana</button>'}
          <button type="button" class="notbor" data-nbor aria-label="Borrar esta notificación" title="Borrar">${svgIco(ICON_NOM['trash-2'])}</button></div></div></div>`;
  };
  $('dbody').innerHTML = `<div class="fh"><div><h2>Notificaciones</h2><div class="sm">${NOTIF_N ? `${NOTIF_N} sin leer` : 'Estás al día'} · últimos 7 días</div></div>
      <span class="acts" style="margin:0"><button type="button" class="icobtn notcfgb" id="notcfg" title="Elegir qué recibo y cuándo" aria-label="Elegir qué recibo y cuándo">${svgIco(ICON_NOM.settings)}</button>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></span></div>
    ${areas.length > 1 ? `<div class="segs notfil" role="group" aria-label="Filtrar">${[['', 'Todas']].concat(areas.map(a => [a[0], a[1]])).map(([k, t]) =>
      `<button type="button" data-nfil="${k}" class="${NOTIF_FILTRO === k ? 'on' : ''}" aria-pressed="${NOTIF_FILTRO === k}">${esc(t)}</button>`).join('')}</div>` : ''}
    <div class="notlista2">
      ${nuevas.length ? `<h3 class="notdia">Nuevas · ${nuevas.length}</h3>${nuevas.map(fila).join('')}` : ''}
      ${viejas.length ? `<h3 class="notdia">Anteriores</h3>${viejas.map(fila).join('')}` : ''}
      ${vis.length ? '' : `<div class="vacio">${NOTIF_FILTRO ? 'No hay avisos de esta área.' : 'No tienes notificaciones de los últimos 7 días.'}</div>`}</div>
    <p class="sm notpie">Se guardan las de los últimos 7 días. Las que borras no vuelven a salir.</p>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">
      ${NOTIF_N ? '<button class="btn sec" id="notleer">Marcar todas como leídas</button>' : ''}
      ${l.some(x => x.leida_en) ? '<button class="btn sec" id="notlimpiar">Borrar las leídas</button>' : ''}
      ${l.length ? '<button class="btn sec dang" id="notvaciar">Borrar todas</button>' : ''}</div>`;
  const cerrarYRefrescar = () => { $('dlg').close(); refrescarCampana(); };
  const quitar = xs => { NOTIF_LISTA = NOTIF_LISTA.filter(y => !xs.includes(y)); NOTIF_N = Math.max(0, NOTIF_N - xs.filter(y => !y.leida_en).length); notifPintar(); refrescarCampana(); };
  $('dbody').querySelectorAll('[data-nfil]').forEach(b => b.onclick = () => { NOTIF_FILTRO = b.dataset.nfil; notifPintar(); });
  $('dbody').querySelectorAll('.notit2').forEach(el => {
    const x = l[+el.dataset.nidx], acc = notifAcciones(x);
    el.querySelectorAll('[data-nacc]').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      await db.rpc('leer_notificacion', { p_id: x.id });
      cerrarYRefrescar(); acc[+b.dataset.nacc][1]();
    });
    const pos = el.querySelector('[data-npos]');
    if (pos) pos.onclick = async e => {
      e.stopPropagation();
      const { data } = await db.rpc('posponer_notificacion', { p_id: x.id });
      if (!data || !data.ok) { toast('No se ha podido posponer', true); return; }
      toast('Te lo volvemos a enseñar mañana'); quitar([x]);
    };
    el.querySelector('[data-nbor]').onclick = async e => {
      e.stopPropagation();
      if (!await notifBorrar([x.id])) return;
      el.classList.add('notsale'); setTimeout(() => quitar([x]), 220);
    };
    el.onclick = async () => {
      await db.rpc('leer_notificacion', { p_id: x.id });
      if (acc.length) { cerrarYRefrescar(); (acc.find(a => a[2]) || acc[0])[1](); }
      else if (!x.leida_en) { x.leida_en = new Date().toISOString(); NOTIF_N = Math.max(0, NOTIF_N - 1); notifPintar(); refrescarCampana(); }
    };
  });
  if ($('notleer')) $('notleer').onclick = async () => {
    await db.rpc('leer_notificaciones'); const ahora = new Date().toISOString();
    NOTIF_LISTA.forEach(x => { if (!x.leida_en) x.leida_en = ahora; }); NOTIF_N = 0; notifPintar(); refrescarCampana();
  };
  if ($('notlimpiar')) $('notlimpiar').onclick = async () => { if (await notifBorrar(null, true)) { toast('Notificaciones leídas borradas'); quitar(NOTIF_LISTA.filter(x => x.leida_en)); } };
  if ($('notvaciar')) $('notvaciar').onclick = async () => {
    const op = await elegirOpcion('Borrar todas las notificaciones', 'Se borran todas, también las que no has leído, y no vuelven a salir.', [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'si', t: 'Borrar todas' }]);
    if (op === 'si' && await notifBorrar(null, false)) { toast('Notificaciones borradas'); cerrarYRefrescar(); }
  };
  $('notcfg').onclick = () => { $('dlg').close(); CFG_SEC = 'notif'; window.__CFG_DIRECTO = true; ir('config'); };
}

async function cargarCatalogosBase() {
  const claves = Object.keys(CAT);
  const res = await Promise.all(claves.map(k => db.rpc('catalogo_papel', { p_papel: k })));
  claves.forEach((k, i) => { CAT[k] = res[i].data || []; });
  cargarCampos().catch(() => {});
}

function aplicarMarcaBase() {
  const n = nombreApp();
  document.title = n;
  document.querySelectorAll('meta[name="apple-mobile-web-app-title"]').forEach(m => m.content = n);
  const logo = MARCA.logo;
  document.querySelectorAll('header .logo, .lbox img, #bootsplash img').forEach(i => { if (logo) i.src = logo; i.alt = n; });
  const h = document.querySelector('.lbox h1'); if (h) h.textContent = n;
  const g = document.querySelector('#girar span:last-child'); if (g) g.textContent = n + ' se usa en vertical.';
}

function aplicarMarca() {
  aplicarMarcaBase();
  if (!MARCA.logo) document.querySelectorAll('header .logo, .lbox img, #bootsplash img').forEach(i => { i.src = LOGO_NEUTRO; });
}

async function cargarAjustesBase2() { await cargarAjustesBase(); aplicarEtiqueta(); }

// Plan y suscripción: tu plan (usuarios contratados, pago, prueba), los cuatro planes y la comparativa por módulos
async function pintarPaginaPlanBase() {
  const { data } = await RPC_ORIG('plan_uso', {});
  const d = data || {}, pl = d.plan || {}; if (pl.plan) PLAN_ACTUAL = pl;
  const act = planDe(pl.plan), contr = usuariosContratados(), usados = +d.usuarios || 0, anual = pl.pago === 'anual';
  const pct = contr === Infinity ? 0 : Math.min(100, Math.round(usados / contr * 100));
  // Con pago anual se pagan 10 meses de 12: la cuota mensual equivalente es precio × 10 / 12
  const cuota = act.presupuesto || contr === Infinity ? null : contr * (anual ? act.precio * 10 / 12 : act.precio);
  const mailto = asunto => 'mailto:?subject=' + encodeURIComponent(asunto + ' · ' + ((AJUSTES.marca || {}).nombre || ''));
  const cont = $('cfgcuerpo'); if (!cont) return;
  // El plan que se destaca es el siguiente al tuyo (con A medida, ninguno)
  const siguiente = PLANES[PLANES.indexOf(act) + 1] || null;
  // v2.120.0: «incluido» y «no incluido» como icono y raya suave, con su texto para lectores de pantalla
  const celda = (p, v) => `<td class="${p.id === act.id ? 'act' : ''}">${v === '✓' ? `<span class="si" role="img" aria-label="Incluido">${svgIco(ICON_NOM.check)}</span>`
    : v === '—' ? '<span class="no" role="img" aria-label="No incluido">—</span>' : v}</td>`;
  cont.innerHTML = `${TAB === 'organizacion' || TAB === 'config' ? '<p class="sm">Precio por usuario y mes, IVA no incluido. Con pago anual pagas 10 meses de 12.</p>' : '<div class="saludo"><div><h1>Plan y suscripción</h1><div class="fecha">Precio por usuario y mes, IVA no incluido. Con pago anual pagas 10 meses de 12.</div></div></div>'}
    <div class="card" id="planact"><h2>Tu plan: ${esc(act.nombre)}</h2>
      ${pl.estado === 'prueba' ? `<div class="banda-aviso">Estás en la prueba gratuita hasta el <b>${fechaCorta(pl.prueba_hasta)}</b>. Sin permanencia: si no sigues, te llevas tus datos.</div>` : ''}
      <div class="kpis">
        <div class="kpi"><b>${contr === Infinity ? 'Sin límite' : num(contr)}</b><span>Usuarios contratados</span></div>
        <div class="kpi"><b>${num(usados)}</b><span>Usuarios en uso</span></div>
        <div class="kpi"><b>${act.presupuesto ? 'A medida' : anual ? 'Anual' : 'Mensual'}</b><span>Pago</span></div>
        ${cuota != null ? `<div class="kpi"><b>${eurI(cuota)}</b><span>Al mes, sin IVA</span></div>` : ''}
        ${act.medicos !== 0 ? `<div class="kpi"><b>${num(d.medicos || 0)}${act.medicos ? ' / ' + act.medicos : ''}</b><span>${TT('medico', 'p', '', 'l', 'C')} con acceso</span></div>` : ''}
      </div>
      ${contr !== Infinity ? `<div class="barrauso" title="${num(usados)} de ${num(contr)}"><i style="width:${pct}%"></i></div>` : ''}
      ${contr !== Infinity && usados > contr ? `<div class="banda-aviso" id="plansobre">Tienes ${usados - contr === 1 ? '1 usuario' : num(usados - contr) + ' usuarios'} más de ${num(contr)} contratados. Añádelos a tu plan o desactiva los que ya no usen la plataforma.</div>` : ''}
      <div class="acts"><a class="btn sec" href="${mailto('Cambiar el número de usuarios')}">Añadir o quitar usuarios</a></div></div>
    <div class="planes">${PLANES.map(p => `<div class="plan ${p.id === act.id ? 'actual' : ''} ${p === siguiente ? 'dest' : ''}" data-plan="${p.id}">
      <h3>${esc(p.nombre)}</h3><div class="sm">${esc(p.para)}</div>
      <div class="precio">${p.presupuesto ? '<b>A medida</b> <span class="sm">Presupuesto · desde 50 usuarios</span>'
        : `<b>${eurI(p.precio)}</b> <span class="sm">por usuario al mes · ${eurI(p.anual)} con pago anual (${eurI(p.precio * 10)} al año)</span>`}</div>
      <ul class="manlist">${p.ventajas.map(v => `<li><span>✓</span><span>${esc(v)}</span></li>`).join('')}</ul>
      ${p.id === act.id ? '<button class="btn sec" disabled>Tu plan actual</button>'
        : `<a class="btn ${p === siguiente ? '' : 'sec'}" href="${mailto(p.presupuesto ? 'Presupuesto del plan A medida' : 'Cambiar al plan ' + p.nombre)}">${p.presupuesto ? 'Pedir presupuesto' : 'Cambiar a ' + esc(p.nombre)}</a>`}</div>`).join('')}</div>
    <div class="card" id="plancond"><h2>Condiciones</h2><ul class="manlist">
      <li><span>✓</span><span>Mínimo 3 usuarios en Campo, Comercial y Empresa. Añades o quitas usuarios cuando quieras.</span></li>
      <li><span>✓</span><span>Puesta en marcha (importar tus Excel, configurar la empresa y formar al equipo): incluida con pago anual; con pago mensual, ${eurI(PUESTA_EN_MARCHA)} una sola vez.</span></li>
      <li><span>✓</span><span>Prueba de 30 días con tus propios datos, sin permanencia. Si no sigues, te llevas tus datos.</span></li>
      <li><span>✓</span><span>Desarrollos y configuraciones a medida: presupuesto según lo que necesites.</span></li></ul></div>
    <div class="card"><h2>Qué incluye cada plan</h2><div class="dgrid-wrap"><table class="planmat"><thead><tr><th>Módulo</th>${PLANES.map(p => `<th class="${p.id === act.id ? 'act' : ''}">${esc(p.nombre)}</th>`).join('')}</tr></thead>
      <tbody>${MOD_PLAN.map(([m, n, desc]) => `<tr><td><b>${esc(n)}</b><span class="sm">${esc(desc)}</span></td>${PLANES.map(p => celda(p, p.modulos.includes(m) ? '✓' : '—')).join('')}</tr>`).join('')}
        <tr><td><b>Espacio ${TT('medico', 's', 'del', 'l', 'l')}</b><span class="sm">Su informe y sus avisos</span></td>${PLANES.map(p => celda(p, p.medicos === 0 ? '—' : p.medicos ? 'Hasta ' + p.medicos : 'Sin límite')).join('')}</tr>
        <tr><td><b>Ver la plataforma como cada persona</b><span class="sm">De tu equipo, para ayudarla</span></td>${PLANES.map(p => celda(p, p.id === 'medida' ? '✓' : '—')).join('')}</tr>
        <tr><td><b>Precio por usuario</b><span class="sm">Al mes, IVA no incluido</span></td>${PLANES.map(p => celda(p, p.presupuesto ? 'A medida' : eurI(p.precio) + ' · ' + eurI(p.anual) + ' anual')).join('')}</tr>
      </tbody></table></div></div>`;
}

// Si la app ya estaba a la vista al cargar este bloque (arranque con el perfil guardado), el menú se ajusta igualmente
async function cargarAjustes(...a) { const r = await cargarAjustesBase2(...a); if (PERFIL) menuOrganizacion(); return r; }

async function pintarPaginaPlanBase2(...a) {
  const r = await pintarPaginaPlanBase.apply(this, a);
  const t = document.querySelector('#cfgcuerpo .planmat'); if (!t) return r;
  const act = planDe((PLAN_ACTUAL || {}).plan);
  const celda = (p, v) => `<td class="${p.id === act.id ? 'act' : ''}">${v === true ? `<span class="si" role="img" aria-label="Incluido">${svgIco(ICON_NOM.check)}</span>`
    : v === false ? '<span class="no" role="img" aria-label="No incluido">—</span>' : v}</td>`;
  const filas = PLAN_FILAS().map(([n, d, pl]) => pl === null || pl === undefined && d === null
    ? `<tr class="plangrupo"><td colspan="${PLANES.length + 1}">${esc(n)}</td></tr>`
    : `<tr><td><b>${esc(n)}</b>${d ? `<span class="sm">${esc(d)}</span>` : ''}</td>${PLANES.map(p => celda(p, pl.includes(p.id))).join('')}</tr>`).join('');
  const extra = [...t.querySelectorAll('tbody tr')].filter(tr => /Espacio|Ver la plataforma|Precio por usuario/.test(tr.textContent)).map(tr => tr.outerHTML).join('');
  t.querySelector('tbody').innerHTML = filas + extra;
  return r;
}

// Comparativa de «Plan y suscripción»: la fila del espacio del profesional pasa a ser la del portal (Oportunidades va en PLAN_FILAS)
async function pintarPaginaPlanBase3(...a) {
  const r = await pintarPaginaPlanBase2.apply(this, a);
  const fp = [...document.querySelectorAll('.planmat tbody tr')].find(tr => /Su informe y sus avisos/.test(tr.textContent));
  if (fp) fp.querySelector('td').innerHTML = `<b>Portal ${TT('medico', 's', 'del', 'l', 'l')} y del centro</b><span class="sm">Informe, constancia, material, mensajes y pedidos del centro</span>`;
  return r;
}

// «Plan y suscripción»: los botones reales en lugar de correos
async function pintarPaginaPlanBase4(...a) {
  const r = await pintarPaginaPlanBase3.apply(this, a);
  const c = $('cfgcuerpo'); if (!c) return r;
  const pl = PLAN_ACTUAL || {}, conSus = !!pl.stripe_suscripcion, puedePagar = puedeOrganizacion();
  c.querySelectorAll('.plan[data-plan]').forEach(card => {
    const k = card.dataset.plan, a2 = card.querySelector('a.btn[href^="mailto"]');
    if (!a2 || !PAGO_PLANES.includes(k)) return;
    if (!puedePagar) { a2.remove(); return; }
    const b = document.createElement('button'); b.type = 'button'; b.className = a2.className; b.dataset.pgplan = k;
    b.textContent = conSus ? 'Cambiar a ' + planDe(k).nombre : 'Contratar ' + planDe(k).nombre;
    a2.replaceWith(b); b.onclick = () => elegirPago(k);
  });
  const acts = c.querySelector('#planact .acts');
  if (acts) {
    const usu = acts.querySelector('a.btn[href^="mailto"]'); if (usu) usu.remove();
    if (puedePagar && pl.plan !== 'medida') acts.insertAdjacentHTML('beforeend', conSus
      ? '<button type="button" class="btn sec" id="pgusu2">Añadir o quitar usuarios</button><button type="button" class="btn sec" id="pgportal">Gestionar el pago</button>'
      : '<button type="button" class="btn" id="pgelegir">Elegir plan y pagar</button>');
    if ($('pgusu2')) $('pgusu2').onclick = () => elegirPago(pl.plan);
    if ($('pgportal')) $('pgportal').onclick = ev => pagoPortal(ev.target);
    if ($('pgelegir')) $('pgelegir').onclick = () => elegirPago();
  }
  const act = c.querySelector('#planact h2');
  if (act && pl.estado === 'impago') act.insertAdjacentHTML('afterend', `<div class="banda-peligro">No hemos podido cobrar el último recibo${pl.impago_desde ? ' (desde el ' + fechaCorta(pl.impago_desde) + ')' : ''}.
    Actualiza el método de pago con «Gestionar el pago»; si en 14 días no se puede cobrar, la cuenta queda en solo lectura.</div>`);
  if (act && pl.estado === 'cancelada') act.insertAdjacentHTML('afterend', `<div class="banda-aviso">Suscripción cancelada: puedes usar la plataforma hasta el
    <b>${fechaCorta(pl.periodo_fin)}</b> y descargar tus datos. Para seguir, vuelve a contratar.</div>`);
  if (act && conSus && pl.periodo_fin && pl.estado === 'activo') act.insertAdjacentHTML('afterend', `<p class="sm">Próximo recibo el ${fechaCorta(pl.periodo_fin)}.</p>`);
  return r;
}

// A medida (como la empresa principal): sin botones de contratar ni de cambiar en línea, salvo que ya pague con Stripe
async function pintarPaginaPlanBase5(...a) {
  const r = await pintarPaginaPlanBase4.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {};
  if (c && pl.plan === 'medida' && !pl.stripe_suscripcion) c.querySelectorAll('[data-pgplan], #pgelegir, #pgusu2').forEach(b => b.remove());
  return r;
}

// «Plan y suscripción»: cambio previsto (con «Anular el cambio»), baja pedida y compromiso de A medida
async function pintarPaginaPlanBase6(...a) {
  const r = await pintarPaginaPlanBase5.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}, h = c && c.querySelector('#planact h2'); if (!h) return r;
  const cp = pl.cambio_previsto;
  if (cp && cp.plan) h.insertAdjacentHTML('afterend', `<div class="banda-info" id="pgprevisto">El <b>${fechaCorta(cp.desde)}</b> pasarás al plan
    <b>${esc(planDe(cp.plan).nombre)}</b> con ${num(cp.usuarios)} usuarios y pago ${cp.pago === 'anual' ? 'anual' : 'mensual'}.
    ${puedeOrganizacion() ? '<button type="button" class="btn sec" id="pganular">Anular el cambio</button>' : ''}</div>`);
  if (pl.baja_al_final && pl.estado === 'activo') h.insertAdjacentHTML('afterend', `<div class="banda-aviso" id="pgbajafin">Has pedido la baja: puedes usar la plataforma
    hasta el <b>${fechaCorta(pl.periodo_fin)}</b>. Si quieres seguir, entra en «Gestionar el pago» y renueva la suscripción.</div>`);
  if (pl.plan === 'medida' && pl.compromiso_hasta) h.insertAdjacentHTML('afterend', `<p class="sm" id="pgcomp">Contrato A medida hasta el ${fechaCorta(pl.compromiso_hasta)}. Para cambiarlo, habla con delcos.</p>`);
  if ($('pganular')) $('pganular').onclick = async ev => {
    const d = await pagoLlamar({ accion: 'anular_cambio' }, ev.target); if (!d) return;
    toast('Cambio anulado: sigues con tu plan'); await pagoCargarEstado(); ir(TAB);
  };
  return r;
}

async function pintarPaginaPlanBase7(...a) {
  const r = await pintarPaginaPlanBase6.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}; if (!c || !puedeOrganizacion() || !pl.stripe_suscripcion) return r;
  const acts = c.querySelector('#planact .acts');
  if (acts && pl.estado === 'activo' && !pl.baja_al_final && !$('pgdarbaja'))
    acts.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" id="pgdarbaja">Darme de baja</button>');
  const bf = $('pgbajafin');
  if (bf) {
    bf.innerHTML = `Has pedido la baja: puedes usar la plataforma hasta el <b>${fechaCorta(pl.periodo_fin)}</b>.
      <button type="button" class="btn sec" id="pgseguir">Seguir con la suscripción</button>`;
  }
  if ($('pgdarbaja')) $('pgdarbaja').onclick = async ev => { const d = await pagoLlamar({ accion: 'baja' }, ev.target); if (d && d.url) location.href = d.url; };
  if ($('pgseguir')) $('pgseguir').onclick = async ev => {
    const d = await pagoLlamar({ accion: 'reanudar' }, ev.target); if (!d) return;
    toast('Seguimos: tu suscripción continúa'); await pagoCargarEstado(); ir(TAB);
  };
  return r;
}

// «Plan y suscripción»: botones al formulario (en lugar de correos) y la última solicitud con su estado
async function pintarPaginaPlanBase8(...a) {
  const r = await pintarPaginaPlanBase7.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || !c.querySelector('#planact')) return r;
  const pl = PLAN_ACTUAL || {};
  c.querySelectorAll('a[href^="mailto"]').forEach(x => {
    const b = document.createElement('button'); b.type = 'button'; b.className = x.className;
    b.textContent = x.closest('.plan[data-plan="medida"]') ? 'Pedir presupuesto' : 'Hablar con delcos';
    b.dataset.presu = x.closest('.plan[data-plan="medida"]') && pl.plan !== 'medida' ? 'presupuesto' : 'contrato';
    x.replaceWith(b);
  });
  const comp = $('pgcomp');
  if (pl.plan === 'medida' && !c.querySelector('[data-presu]') && !puede('gestionar_plataforma')) {
    const acts = c.querySelector('#planact .acts');
    if (acts) acts.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" data-presu="contrato">Hablar con delcos</button>');
  }
  if (comp) comp.textContent = comp.textContent.replace(' Para cambiarlo, habla con delcos.', '');
  c.querySelectorAll('[data-presu]').forEach(b => b.onclick = () => pedirPresupuesto(b.dataset.presu));
  try {
    const { data } = await db.from('solicitudes_plan').select('creado_en,estado,tipo').order('creado_en', { ascending: false }).limit(1);
    const s = (data || [])[0], h = c.querySelector('#planact h2');
    if (s && h && !$('presuest') && (s.estado !== 'Cerrada' || Date.now() - new Date(s.creado_en) < 30 * 864e5))
      h.insertAdjacentHTML('afterend', `<div class="banda-info" id="presuest">Tu solicitud ${s.tipo === 'contrato' ? 'sobre el contrato' : 'de presupuesto'} del
        ${fechaCorta(s.creado_en.slice(0, 10))}: <b>${esc(PRESU_ESTADO[s.estado] || s.estado)}</b>.${s.estado === 'Nueva' ? ' Te contestamos en un día laborable.' : ''}</div>`);
  } catch (e) {}
  return r;
}

// «Plan y suscripción»: periodo de prueba de Stripe
async function pintarPaginaPlanBase9(...a) {
  const r = await pintarPaginaPlanBase8.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}, h = c && c.querySelector('#planact h2');
  if (h && pl.en_prueba && pl.periodo_fin && !$('pgprueba') && !pl.baja_al_final)
    h.insertAdjacentHTML('afterend', `<div class="banda-info" id="pgprueba">Estás en el periodo de prueba hasta el <b>${fechaCorta(pl.periodo_fin)}</b>:
      hasta entonces no se cobra nada. Ese día se pasará el primer recibo, salvo que te des de baja antes.</div>`);
  return r;
}

async function pintarPaginaPlanBase10(...a) {
  const r = await pintarPaginaPlanBase9.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {};
  if (!c || !c.querySelector('#planact') || !pl.stripe_cliente || !puedeOrganizacion() || $('pgdatos')) return r;
  c.querySelector('#planact').insertAdjacentHTML('afterend', `<div class="card cfgpanel" id="pgdatos"><h2 style="padding:0 0 4px">Datos de facturación</h2>
    <p class="sm">Con estos datos se hacen tus recibos y facturas. ${pl.en_prueba ? `Revísalos antes del ${fechaCorta(pl.periodo_fin)}, cuando se pasa el primer recibo.` : ''}</p>
    <div class="pgdlista"><div class="skel"></div></div>
    <div class="acts"><button type="button" class="btn sec" id="pgdcorr">Corregir datos</button></div></div>`);
  $('pgdcorr').onclick = ev => pagoPortal(ev.target);
  // Sin avisos si falla (se ve «Falta» y se puede corregir igual)
  const d = await db.functions.invoke('pagos', { body: { accion: 'datos' } }).then(x => x.data, () => null).catch(() => null);
  const l = c.querySelector('#pgdatos .pgdlista'); if (!l) return r;
  if (!d || !d.ok) { l.innerHTML = '<p class="sm">No se han podido leer ahora. Puedes verlos y cambiarlos con «Corregir datos».</p>'; return r; }
  const x = d.datos || {};
  const filas = [['Razón social', x.nombre], ['NIF o CIF', x.nif], ['Correo para los recibos', x.email], ['Dirección fiscal', x.direccion]];
  const faltan = filas.filter(f => !f[1]).length;
  l.innerHTML = filas.map(([k, v]) => `<div class="pgdfila${v ? '' : ' falta'}"><span>${esc(k)}</span><b>${v ? esc(v) : 'Falta'}</b></div>`).join('')
    + (faltan ? `<div class="banda-aviso" style="margin-top:8px">Faltan datos para poder facturarte: complétalos con «Corregir datos».</div>` : '');
  return r;
}

async function cargarConfigBase() {
  // v2.340.0 (avisos de Eric): se abre siempre en «Mis datos» (no en el último apartado); al cambiar de apartado solo cambia la página
  // de la derecha (el índice se queda, con su desplazamiento: antes se volvía a montar todo y daba un salto); los apartados con partes
  // son una sola entrada y las partes, pestañas dentro de la página.
  if (typeof salirPanel === 'function') salirPanel();
  const arbol = arbolCfgUnico(), hojas = hojasCfg(arbol);
  const pedida = CFG_KEY || 'datos';
  const it = hojas.find(x => x.k === pedida) || hojas.find(x => x.hijos && x.hijos.some(h => h.k === pedida)) || hojas.find(x => pedida.startsWith(x.k + '.'))
    || hojas.find(x => x.k === 'datos') || hojas[0];
  if (!it) return;
  const hijo = it.hijos ? (it.hijos.find(h => h.k === pedida) || it.hijos[0]) : null;
  CFG_KEY = hijo ? hijo.k : it.k;
  const movil = ES_MOVIL(), v = $('v-config');
  const firma = hojas.map(x => x.k + (x.hijos ? '(' + x.hijos.map(h => h.k).join(',') + ')' : '')).join('|') + '|' + movil;
  if (!(v.dataset.cfgfirma === firma && $('cfulista') && v.querySelector('.cfupag'))) {
    const ind = arbol.map(([gr, l]) => `<h4>${esc(gr)}</h4>${l.map(x => `<button type="button" data-ck="${x.k}">${svgIco(ICON_NOM[x.ic] || '')}<span>${esc(x.t)}</span>${x.mod && !planIncluye(x.mod) ? `<span class="pill p-plan">${esc(planMinimo(x.mod) ? planMinimo(x.mod).nombre : 'Plan')}</span>` : ''}</button>`).join('')}`).join('');
    v.innerHTML = `<div class="saludo"><div><h1>Configuración</h1><div class="fecha">Tu cuenta${arbol.length > 1 ? ', tu equipo y tu empresa, en un solo sitio' : ' y tus preferencias'}</div></div></div>
      <div class="cfu">
        <nav class="cfuidx" aria-label="Apartados de configuración"><div class="cfubusca">${LUPA_CFG}<input id="cfubus" type="search" placeholder="Buscar un ajuste" autocomplete="off" aria-label="Buscar un ajuste"></div>
          <div id="cfulista">${ind}</div><div class="cfusin hide" id="cfusin">Ningún ajuste con esas palabras</div></nav>
        <section class="cfupag"><button type="button" class="cfuvolver" id="cfuvolver">‹ Configuración</button>
          <div class="cfucab"></div><div class="cfupend hide" id="cfupend"></div>
          <div id="cfgcuerpo-hub"><div id="cfgcuerpo"></div></div></section></div>`;
    v.dataset.cfgfirma = firma;
    v.querySelectorAll('#cfulista [data-ck]').forEach(b => b.onclick = () => { CFG_KEY = b.dataset.ck; CFG_DETALLE = true; cargarConfig(); if (ES_MOVIL()) scrollTo(0, 0); });
    $('cfuvolver').onclick = () => { CFG_DETALLE = false; v.querySelector('.cfu').classList.remove('det'); scrollTo(0, 0); };
    // Buscador: por nombre, apartado, partes y palabras clave; Intro abre el primero
    const busca = $('cfubus');
    busca.oninput = () => {
      const q = impNorm(busca.value.trim());
      let vis = 0;
      v.querySelectorAll('#cfulista [data-ck]').forEach(b => {
        const h = hojasCfg(arbolCfgUnico()).find(x => x.k === b.dataset.ck) || {};
        const partes = (h.hijos || []).map(x => x.t + ' ' + (CFG_CLAVES[x.k] || '')).join(' ');
        const txt = impNorm([h.t, h.gr, h.d, partes, CFG_CLAVES[h.k] || ''].join(' '));
        const ok = !q || q.split(/\s+/).every(p => txt.includes(p)); b.classList.toggle('hide', !ok); if (ok) vis++;
      });
      v.querySelectorAll('#cfulista h4').forEach(e => {
        let x = e.nextElementSibling, alguno = false;
        while (x && x.tagName !== 'H4') { if (x.matches('[data-ck]:not(.hide)')) alguno = true; x = x.nextElementSibling; }
        e.classList.toggle('hide', !!q && !alguno);
      });
      $('cfusin').classList.toggle('hide', vis > 0);
    };
    busca.onkeydown = e => { if (e.key === 'Enter') { const b = v.querySelector('#cfulista [data-ck]:not(.hide)'); if (b) { e.preventDefault(); b.click(); } } };
    cfuAjustarIndice();
  }
  v.querySelector('.cfu').classList.toggle('det', movil && CFG_DETALLE);
  v.querySelectorAll('#cfulista [data-ck]').forEach(b => b.classList.toggle('on', b.dataset.ck === it.k));
  // Cabecera de la página y, si tiene partes, sus pestañas
  v.querySelector('.cfucab').innerHTML = `<div class="miga">${esc(it.gr)}</div><h2>${esc(it.t)}</h2>${it.d ? `<p>${esc(it.d)}</p>` : ''}`;   // v2.344.0: sin pestañas: las partes, una debajo de otra
  v.querySelectorAll('.cfucab [data-cks]').forEach(b => b.onclick = () => { if (b.dataset.cks === CFG_KEY) return; CFG_KEY = b.dataset.cks; cargarConfig(); });
  $('cfupend').classList.add('hide'); $('cfupend').innerHTML = '';
  $('cfgcuerpo-hub').innerHTML = '<div id="cfgcuerpo"></div>';
  // Lo pendiente: punto en el índice (en el apartado que lo contiene) y aviso en la página
  pendientesCfg().then(l => {
    if (!$('cfulista')) return;
    Object.entries(l).forEach(([k, t]) => { const b = [...v.querySelectorAll('#cfulista [data-ck]')].find(x => k === x.dataset.ck || k.startsWith(x.dataset.ck + '.')); if (b && !b.querySelector('.cfupt')) { b.insertAdjacentHTML('beforeend', '<span class="cfupt"></span>'); b.title = t; } });
    if (l[CFG_KEY] && $('cfupend')) { $('cfupend').innerHTML = `<span class="cfupt"></span>${esc(l[CFG_KEY])}`; $('cfupend').classList.remove('hide'); }
  });
  // El apartado (o, si el plan no lo incluye, qué plan lo trae)
  const r = it.hijos ? () => cfgApilar(it, hijo) : it.r;
  if (it.mod && !planIncluye(it.mod)) {
    const p = planMinimo(it.mod);
    $('cfgcuerpo').innerHTML = `<div class="card cfgpanel planup"><div class="planupico">${svgIco(ICON_NOM.lock)}</div><h2>${esc(it.t)} está en el plan ${esc(p ? p.nombre : 'A medida')}</h2>
      <p class="sm">Tu plan ${esc(planDe(PLAN_ACTUAL.plan).nombre)} no lo incluye.</p>${puedeOrganizacion() ? '<div class="acts"><button class="btn" id="planver">Ver planes</button></div>' : ''}</div>`;
    if ($('planver')) $('planver').onclick = () => { CFG_KEY = 'o.plan'; cargarConfig(); };
  } else Promise.resolve().then(r);
}

// Notificaciones: cada aviso con «Al momento · En el resumen · No»
function pintarNotif() {
  const tipos = tiposDeMiRol(), s = (PERFIL.preferencias || {}).notif_silencio || {};
  const filas = NOTIF_AREAS.map(([, t, ks]) => [t, tipos.filter(x => ks.includes(x[0]))]).filter(([, l]) => l.length);
  const sueltos = tipos.filter(x => !NOTIF_AREAS.some(ar => ar[2].includes(x[0])));
  if (sueltos.length) filas.push(['Otros', sueltos]);
  const modo = k => { const m = notifModo(k); return m === 'm' || m === 'r' ? m : 'n'; };
  const resumen = () => { const c = { m: 0, r: 0, n: 0 }; tipos.forEach(([k]) => c[modo(k)]++);
    return `<span><b>${c.m}</b> al momento</span><span><b>${c.r}</b> en el resumen de la mañana</span><span><b>${c.n}</b> desactivados</span>`; };
  $('cfgcuerpo').innerHTML = tipos.length ? `<div class="card cfgpanel ntf">
    <div class="ntfres" id="ntfres">${resumen()}</div>
    <div class="ajfila ntfsil"><div><div class="ntfsilt"><label class="vfswitch mini" title="Activar las horas de silencio"><input type="checkbox" id="nsil" ${s.activo ? 'checked' : ''} aria-label="Activar las horas de silencio"><span class="sw"></span></label><b>Horas de silencio</b></div><span class="sm">Lo que llegue en ese tiempo lo verás al terminar el silencio.</span></div>
      <div class="ajctl">
        <input type="time" id="nsild" value="${esc(s.desde || '20:00')}" aria-label="Desde"> a <input type="time" id="nsilh" value="${esc(s.hasta || '08:00')}" aria-label="Hasta">
        <label class="ntffin"><input type="checkbox" id="nsilf" ${s.finde !== false ? 'checked' : ''}> Fines de semana</label></div></div>
    ${filas.map(([t, l]) => `<h3 class="ntfarea">${esc(t)}</h3>${l.map(([k, ic, tt, d]) => {
      const m = modo(k), diario = NOTIF_DIARIOS.includes(k);
      return `<div class="ntfrow"><span class="ntfic">${ic}</span><div><b>${esc(tt)}</b><span class="sm">${esc(d)}</span></div>
        <div class="segs ntfseg" role="group" aria-label="${esc(tt)}" data-nk="${k}">${diario ? '' : `<button type="button" data-v="m" class="${m === 'm' ? 'on' : ''}" aria-pressed="${m === 'm'}">Al momento</button>`}<button type="button" data-v="r" class="${m === 'r' ? 'on' : ''}" aria-pressed="${m === 'r'}">En el resumen</button><button type="button" data-v="n" class="${m === 'n' ? 'on' : ''}" aria-pressed="${m === 'n'}">No</button></div></div>`; }).join('')}`).join('')}
  </div>` : '<div class="card cfgpanel"><div class="vacio">Tu perfil no tiene notificaciones disponibles todavía.</div></div>';
  $('cfgcuerpo').querySelectorAll('.ntfseg button').forEach(b => b.onclick = async () => {
    const g = b.closest('.ntfseg'), k = g.dataset.nk, v = b.dataset.v;
    if (b.classList.contains('on')) return;
    g.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    const notif = Object.assign({}, (PERFIL.preferencias || {}).notif || {});
    const diario = NOTIF_DIARIOS.includes(k), om = v === 'm', or = v === 'r';
    if (diario ? or : (om && !or)) delete notif[k]; else notif[k] = { m: om, r: or };
    await notifGuardarPrefs({ notif }, v === 'n' ? 'No lo recibirás' : v === 'm' ? 'Te llegará al momento' : 'Irá en el resumen de la mañana');
    if ($('ntfres')) $('ntfres').innerHTML = resumen();
  });
  const guardarSil = () => notifGuardarPrefs({ notif_silencio: { activo: $('nsil').checked, desde: $('nsild').value || '20:00', hasta: $('nsilh').value || '08:00', finde: $('nsilf').checked } },
    $('nsil').checked ? 'Silencio guardado' : 'Sin silencio');
  ['nsil', 'nsild', 'nsilh', 'nsilf'].forEach(id => { if ($(id)) $(id).onchange = guardarSil; });
}

// Configuración: botón de volver
async function cargarConfigBase2(...a) {
  const r = await cargarConfigBase.apply(this, a);
  const b = $('cfuvolver');
  if (b && !b.classList.contains('manvuelta')) { b.classList.add('manvuelta'); b.innerHTML = '<b aria-hidden="true">‹</b> Volver'; b.setAttribute('aria-label', 'Volver a Configuración'); }
  return r;
}

// Catálogos guardados en el móvil (resultado por defecto de la visita, «No estaba»…)
async function cargarCatalogos(...a) {
  const r = await cargarCatalogosBase.apply(this, a);
  try {
    const vacio = Object.values(CAT).every(v => !v || !v.length);
    if (!vacio) localStorage.setItem('dlc-cat', JSON.stringify(CAT));
    else { const g = JSON.parse(localStorage.getItem('dlc-cat') || 'null'); if (g) Object.keys(CAT).forEach(k => { if (g[k] && g[k].length) CAT[k] = g[k]; }); }
  } catch (e) {}
  return r;
}

// Al cambiar de apartado, la ventana de siempre vuelve a su sitio
async function cargarConfig(...a) {
  const hub = $('cfgcuerpo-hub');
  if (hub && hub.dataset.apilado) {
    hub.querySelectorAll('[data-idd]').forEach(e => e.removeAttribute('data-idd'));
    const m = $('dbody-modal'); if (m) { const p = document.querySelector('#dbody[data-panel]'); if (p) p.removeAttribute('id'); m.id = 'dbody'; }
    PANEL_ACTIVO = null; CFG_SEC_ACT = null; delete hub.dataset.apilado;
  }
  return cargarConfigBase2.apply(this, a);
}

// Preferencias, Clasificadores, Auditoría, Registro, campos personalizados y entorno de pruebas están en src/app/screens/settings
// (v2.415.0). Estos nombres se quedan: las secciones de Configuración, Facturación, Pedidos, Productos, Clientes, la ficha, el Panel
// delcos, legado 002, 004, 014, 073 y 148 y las pruebas los usan.
function pintarPrefs() { return window.delcos.screens.settings.paintPreferences(); }
function pintarPrefsPaso2() { return window.delcos.screens.settings.paintProfile(); }
function pintarCatalogos() { return window.delcos.screens.settings.paintClassifiers(); }
function pintarAuditoria() { return window.delcos.screens.settings.paintAudit(); }
function pintarRegistro() { return window.delcos.screens.settings.paintBillingLog(); }
function cargarCampos() { return window.delcos.screens.settings.loadCustomFields(); }
function camposHTML(amb, valores) { return window.delcos.screens.settings.customFieldsHtml(amb, valores); }
function camposLeer(raiz) { return window.delcos.screens.settings.readCustomFields(raiz); }
function camposGuardar(leido, id) { return window.delcos.screens.settings.saveCustomFields(leido, id); }
function camposInsertar(raiz, amb, id, antesDe) { return window.delcos.screens.settings.insertCustomFields(raiz, amb, id, antesDe); }
function camposFiltrosActivar(zona, estado, alCambiar) { return window.delcos.screens.settings.bindCustomFieldFilters(zona, estado, alCambiar); }
function bloqueCampos(tabla, id, cont) { return window.delcos.screens.settings.paintCustomFieldsBlock(tabla, id, cont); }
function estadoRefresco() { return window.delcos.screens.settings.refreshStatus(); }
function pintarCfgPruebas() { return window.delcos.screens.settings.paintTestEnvironment(); }

// Configuración, segunda parte: está en src/app/screens/settings/more (v2.415.0). Estos nombres se quedan: el resto de
// Configuración, las pestañas de las páginas, los puentes, Productos, Eventos y las pruebas los usan.
function editorReglasCartera() { return window.delcos.screens.settingsMore.editPortfolioRules(); }
function pintarCopias() { return window.delcos.screens.settingsMore.paintBackups(); }
function deshacerUno(id, despues) { return window.delcos.screens.settingsMore.undoChange(id, despues); }
function cajaDeshacerPersona(caja, usuario, desde, nombre, despues) { if (caja) window.delcos.screens.settingsMore.paintPersonUndo({ box: caja, user: usuario, from: desde, name: nombre, then: despues }); }
function pintarEstadosPapel() { return window.delcos.screens.settingsMore.paintCommercialStates(); }
function matMejorar() { return window.delcos.screens.settingsMore.improveMaterial(); }
function conexionTxt(a, largo) { return window.delcos.screens.settingsMore.connectionText(a, !!largo); }
function pintarAccesos() { return window.delcos.screens.settingsMore.paintAccesses(); }
function facccon(uid) { return window.delcos.screens.settingsMore.fillConnection(uid); }
function textoValor(v) { return window.delcos.screens.settingsMore.valueText(v); }
function resumenDetalle(d) { return window.delcos.screens.settingsMore.detailSummary(d); }
function abrirClasificador(id) { return window.delcos.screens.settingsMore.openClassifier(id); }
function decorarResultados() { return window.delcos.screens.settingsMore.decorateResults(); }
function pintarRoles() { return window.delcos.screens.settingsMore.paintRoles(); }
function pintarMarca() { return window.delcos.screens.settingsMore.paintBrand(); }
