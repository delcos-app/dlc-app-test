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


