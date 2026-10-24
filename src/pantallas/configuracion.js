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

/* pintarPrefs: la parte base y, en orden, cada paso que se le añade (antes eran 2 capas separadas). */
async function pintarPrefs() {
  pintarPrefsBase();
  pintarPrefsPaso1();
  await pintarPrefsPaso2();
}

function pintarPrefsPaso1() {
  const acts = $('pfguardar') && $('pfguardar').closest('.acts');
  if (!acts || $('pfaviso')) return;
  const a = avisoRevisita();
  acts.insertAdjacentHTML('beforebegin', `<div class="blk" id="pfaviso"><h3>Avisos</h3>
    <label class="opt"><input type="checkbox" id="pfrev" ${a.on ? 'checked' : ''}>
      <span><b>Avisarme si ${TT('medico', 's', 'un', 'l', 'l')} ya se ha visitado hace poco</b><br><span class="sm">Al añadir una cita, al planificar una ruta o la semana. Cuenta ${TT('visita', 'p', '', 'l', 'l')} y citas de cualquier persona.</span></span></label>
    <div class="g2"><div><label for="pfrevd">Cuántos días cuentan como «hace poco»</label><input id="pfrevd" type="number" min="1" max="60" value="${a.dias}"></div></div></div>`);
  const guardar = () => guardarAvisoRevisita({ on: $('pfrev').checked, dias: Math.max(1, +$('pfrevd').value || 7) }).then(ok => ok && toast('Aviso guardado'));
  $('pfrev').onchange = guardar; $('pfrevd').onchange = guardar;
}

async function pintarPrefsPaso2() {
  if (!$('cfgcuerpo') || $('miperfil')) return;
  const mods = Object.keys(MODULO_AREA).filter(puedeModulo);
  const nombres = { inicio: 'Inicio', agenda: 'Agenda', rutas: 'Rutas', directorio: 'Directorio', pacientes: 'Clientes', productos: 'Productos', seguimiento: 'Calidad del dato',
    ventas: 'Pedidos', analitica: 'Analítica', facturacion: 'Facturación' };
  $('cfgcuerpo').insertAdjacentHTML('afterbegin', `<div class="card miperfil" id="miperfil">
    <div class="mpcab"><span class="mpav">${esc(iniciales(PERFIL.nombre))}</span>
      <div><h2 style="padding:0 0 4px;margin:0">${esc(PERFIL.nombre)}</h2><div class="sm">${esc(PERFIL.email || '')}</div>
        <div class="mpchips"><span class="pill p-est">${esc(PERFIL.rol)}</span></div></div></div>
    <div class="mpgrid">
      <div><b>Tus módulos</b><div class="mpmods">${mods.map(m => `<span>${ICO_MOD[m] || '•'} ${esc(nombres[m] || m)}</span>`).join('')}</div></div>
      <div id="mpextra"><b>Tu actividad</b><div class="sm">Cargando…</div></div>
    </div>
    <p class="sm" style="margin:10px 0 0">Tus permisos los gestiona administración. Debajo, las preferencias que puedes cambiar tú.</p></div>`);
  const seguro = x => Promise.resolve(x).then(r => r || {}, () => ({}));
  const [{ data: k }, { data: h }, { data: yo }] = await Promise.all([seguro(RPC_ORIG('panel_inicio', {})),
    seguro(RPC_ORIG('historial_esquemas', { p_usuario: PERFIL.id })), seguro(db.from('perfiles').select('zonas').eq('id', PERFIL.id).single())]);
  if (!$('mpextra')) return;
  const kk = (k && (k.kpis || k)) || {}, esq = (h || []).find(x => !x.hasta);
  $('mpextra').innerHTML = `<b>Tu actividad</b><ul class="mplist">
    ${kk.medicos != null ? `<li>🩺 <b>${num(kk.medicos)}</b> ${TT('medico', 'p', '', 'l', 'l')} en tu cartera</li>` : ''}
    ${kk.visitas_mes != null ? `<li>📝 <b>${num(kk.visitas_mes)}</b> ${TT('visita', 'p', '', 'l', 'l')} este mes</li>` : ''}
    ${yo && yo.zonas && yo.zonas.length ? `<li>📍 Zona: ${esc(yo.zonas.map(z => z.charAt(0) + z.slice(1).toLowerCase()).join(', '))}</li>` : ''}
    ${esq ? `<li>€ Comisión: ${esc(esq.esquema)}</li>` : ''}</ul>`;
}

function pintarPrefsBase() {
  const s = punto('salida') || { nombre: '', dir: '' };
  const l = punto('llegada');
  const caja = (k, x, titulo, sub) => `<div class="card" style="padding-top:16px;padding-bottom:16px">
    <h2 style="padding:0">${titulo}</h2><p class="sm" style="padding:0">${sub}</p>
    <div class="g2" style="margin-top:10px">
      <div><label>Nombre</label><input data-pn="${k}" value="${esc(x ? x.nombre || '' : '')}" placeholder="Casa, Oficina…"></div>
      <div><label>Dirección</label><input data-pd="${k}" value="${esc(x ? x.dir || '' : '')}" placeholder="Calle, número y población"></div>
    </div>
    <div class="sm" style="margin-top:8px" data-pe="${k}">${x && x.lat
      ? `<b style="color:var(--ok)">✓ Ubicado</b> ${esc(x.dir || '')}`
      : '<span style="color:var(--warn)">Sin ubicar: pulsa Buscar dirección</span>'}</div>
    <div class="acts"><button class="btn sec" data-pg="${k}">Buscar dirección</button>
      <button class="btn sec" data-pgps="${k}">Usar mi ubicación</button></div></div>`;

  $('cfgcuerpo').innerHTML = `
    <p class="sm">El punto de salida y el de llegada se usan para calcular el plan del día y los recorridos.</p>
    <div class="cols">
      ${caja('salida', s, 'Punto de salida', 'Dónde empiezas el día')}
      ${caja('llegada', l, 'Punto de llegada', 'Déjalo vacío para volver al punto de salida')}
    </div>
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="pfguardar">Guardar preferencias</button></div>`;
  if ($('navsel')) $('navsel').onchange = e => cambiarNavegador(e.target.value);

  $('cfgcuerpo').querySelectorAll('[data-pg]').forEach(b => b.onclick = async () => {
    const k = b.dataset.pg, dir = $('cfgcuerpo').querySelector(`[data-pd="${k}"]`).value.trim();
    if (!dir) { toast('Escribe la dirección', true); return; }
    b.disabled = true; b.textContent = 'Buscando…';
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=' + encodeURIComponent(dir));
      const j = await r.json();
      b.disabled = false; b.textContent = 'Buscar dirección';
      if (!j.length) { toast('No se ha encontrado esa dirección', true); return; }
      b.dataset.lat = j[0].lat; b.dataset.lon = j[0].lon;
      $('cfgcuerpo').querySelector(`[data-pe="${k}"]`).innerHTML =
        `<b style="color:var(--ok)">✓ Ubicado</b> ${esc(j[0].display_name.split(',').slice(0, 3).join(','))}`;
      toast('Dirección encontrada');
    } catch (err) {
      b.disabled = false; b.textContent = 'Buscar dirección';
      toast('No se ha podido buscar la dirección', true);
    }
  });

  $('cfgcuerpo').querySelectorAll('[data-pgps]').forEach(b => b.onclick = () => {
    const k = b.dataset.pgps;
    if (!navigator.geolocation) { toast('Este dispositivo no tiene ubicación', true); return; }
    b.disabled = true; b.textContent = 'Localizando…';
    navigator.geolocation.getCurrentPosition(p => {
      b.disabled = false; b.textContent = 'Usar mi ubicación';
      const g = $('cfgcuerpo').querySelector(`[data-pg="${k}"]`);
      g.dataset.lat = p.coords.latitude.toFixed(6); g.dataset.lon = p.coords.longitude.toFixed(6);
      $('cfgcuerpo').querySelector(`[data-pd="${k}"]`).value = 'Mi ubicación';
      $('cfgcuerpo').querySelector(`[data-pe="${k}"]`).innerHTML = '<b style="color:var(--ok)">✓ Ubicado</b> desde el GPS';
      toast('Ubicación tomada');
    }, () => { b.disabled = false; b.textContent = 'Usar mi ubicación'; toast('No se ha podido obtener la ubicación', true); },
      { enableHighAccuracy: true, timeout: 15000 });
  });

  $('pfguardar').onclick = async ev => {
    const leer = k => {
      const n = $('cfgcuerpo').querySelector(`[data-pn="${k}"]`).value.trim();
      const d = $('cfgcuerpo').querySelector(`[data-pd="${k}"]`).value.trim();
      const g = $('cfgcuerpo').querySelector(`[data-pg="${k}"]`);
      const ant = punto(k) || (k === 'salida' ? s : null);
      const lat = g.dataset.lat ? +g.dataset.lat : (ant && ant.dir === d ? ant.lat : null);
      const lon = g.dataset.lon ? +g.dataset.lon : (ant && ant.dir === d ? ant.lon : null);
      return d ? { nombre: n || d, dir: d, lat, lon } : null;
    };
    const salida = leer('salida'), llegada = leer('llegada');
    if (!salida || !salida.lat) { toast('Ubica el punto de salida antes de guardar', true); return; }
    if (llegada && !llegada.lat) { toast('Ubica el punto de llegada o déjalo vacío', true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { salida, llegada });
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    ev.target.disabled = false; ev.target.textContent = 'Guardar preferencias';
    if (error) { toast('No se ha podido guardar: ' + error.message, true); return; }
    PERFIL.preferencias = data || prefs;
    toast(`Guardado · sales de ${salida.nombre} y terminas en ${(llegada || salida).nombre}`);
    pintarPrefs();
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

async function pintarCatalogos() {
  cargando($('cfgcuerpo'), 'Cargando los clasificadores…');
  const { data } = await db.rpc('catalogos_todos');
  CATS = data || [];
  const puedeEditar = puede('administrar') || ((PERFIL.areas || {}).K || 0) >= 2;
  const completo = puede('administrar') || ((PERFIL.areas || {}).K || 0) >= 3;

  const grupos = {};
  CATS.forEach(c => (grupos[c.grupo || 'General'] = grupos[c.grupo || 'General'] || []).push(c));

  $('cfgcuerpo').innerHTML = `
    <div class="dayhead2"><p class="sm">Listas que usan todos los usuarios en fichas, ${TT('visita', 'p', '', 'l', 'l')}, pedidos y filtros.
      ${puedeEditar ? '' : '<b>Tienes permiso de solo lectura.</b>'}</p>
      ${completo ? '<button class="btn" id="cnuevo">+ Nuevo clasificador</button>' : ''}</div>
    ${Object.entries(grupos).map(([g, lista]) => `
      <div class="grupo">
        <button class="grupoh" data-grupo="${esc(g)}">
          <span>${CATS_ABIERTOS[g] === false ? '▸' : '▾'} <b>${esc(g)}</b>
            <span class="sm">${lista.length} ${lista.length === 1 ? 'clasificador' : 'clasificadores'}</span></span></button>
        <div class="grupoc ${CATS_ABIERTOS[g] === false ? 'hide' : ''}">
          ${lista.map(c => `<button class="cat-card" data-cat="${c.id}">
            <span class="cat-h"><b>${esc(c.nombre)}</b>
              ${c.sistema ? '<span class="tagsis">del sistema</span>' : ''}
              ${puedeEditar ? '' : '<span class="tagro" title="Solo lectura">🔒</span>'}</span>
            <span class="sm">${c.n_activos} ${c.n_activos === 1 ? 'valor activo' : 'valores activos'}${c.descripcion ? ' · ' + esc(c.descripcion) : ''}</span>
            <span class="cat-v">${(c.valores || []).filter(v => v.activo).slice(0, 5).map(v => `<span class="chip">${esc(v.valor)}</span>`).join('')}
              ${c.n_activos > 5 ? `<span class="sm">+${c.n_activos - 5}</span>` : ''}</span>
          </button>`).join('')}
        </div></div>`).join('')}`;

  $('cfgcuerpo').querySelectorAll('[data-grupo]').forEach(b => b.onclick = () => {
    const g = b.dataset.grupo;
    CATS_ABIERTOS[g] = CATS_ABIERTOS[g] === false;
    pintarCatalogos();
  });
  $('cfgcuerpo').querySelectorAll('[data-cat]').forEach(b => b.onclick = () => abrirClasificador(b.dataset.cat));
  if ($('cnuevo')) $('cnuevo').onclick = () => nuevoClasificador();
}

function nuevoClasificador() {
  let valores = [''];
  const grupos = [...new Set(CATS.map(c => c.grupo || 'General').concat([`${TT('medico', 'p', '', 'l', 'C')}`, `${TT('visita', 'p', '', 'l', 'C')}`, 'Ventas', 'General']))];

  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Nuevo clasificador</h2>
        <div class="sm">Una lista propia que podrás usar en fichas, ${TT('visita', 'p', '', 'l', 'l')} o pedidos</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="g2">
        <div><label for="ncn2">Nombre</label><input id="ncn2" placeholder="p. ej. Tipo de centro"></div>
        <div><label for="ncg">Grupo</label><select id="ncg">${grupos.map(g => `<option>${esc(g)}</option>`).join('')}</select></div>
      </div>
      <div class="g2">
        <div><label for="nca">¿Dónde se usa?</label><select id="nca">
          <option value="medico">En la ficha ${TT('medico', 's', 'del', 'l', 'l')}</option>
          <option value="visita">Al registrar ${TT('visita', 's', 'un', 'l', 'l')}</option>
          <option value="pedido">En los pedidos</option>
          <option value="cliente">En la ficha ${TT('paciente', 's', 'del', 'l', 'l')}</option>
          <option value="producto">En la ficha del producto</option></select></div>
        <div><label for="ncd">Descripción</label><input id="ncd" placeholder="Para qué sirve"></div>
      </div>
      <label>Valores</label>
      <div id="ncv">${valores.map((v, i) => `<div class="g2" style="grid-template-columns:minmax(0,1fr) auto;margin-bottom:6px">
        <input data-ncv="${i}" value="${esc(v)}" placeholder="Valor ${i + 1}">
        ${valores.length > 1 ? `<button type="button" class="btn sec" data-ncx="${i}">✕</button>` : ''}</div>`).join('')}</div>
      <div class="acts"><button type="button" class="btn sec" id="ncmas">+ Añadir valor</button></div>
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn" id="ncok2">Crear clasificador</button></div>`;

    const leer = () => valores = [...$('ncv').querySelectorAll('[data-ncv]')].map(i => i.value);
    $('ncmas').onclick = () => { leer(); valores.push(''); pinta(); };
    $('dbody').querySelectorAll('[data-ncx]').forEach(b => b.onclick = () => { leer(); valores.splice(+b.dataset.ncx, 1); pinta(); });
    $('ncok2').onclick = async ev => {
      leer();
      const nombre = $('ncn2').value.trim();
      if (!nombre) { toast('Ponle un nombre', true); return; }
      ev.target.disabled = true;
      const { data: r } = await db.rpc('crear_clasificador', { p: {
        nombre, grupo: $('ncg').value, ambito: $('nca').value, descripcion: $('ncd').value.trim(),
        valores: valores.map(v => v.trim()).filter(Boolean)
      }});
      ev.target.disabled = false;
      if (r && r.ok === false) { toast('No tienes permiso', true); return; }
      $('dlg').close(); toast('Clasificador creado'); pintarCatalogos(); cargarCatalogos();
    };
  };
  pinta();
  $('dlg').showModal();
}

async function pintarAuditoria() {
  cargando($('admcuerpo'), 'Cargando la auditoría…');
  const nombreEnt = { cuentas: `${TT('medico', 's', '', 'l', 'C')}`, ubicaciones: TT('consulta', 's', '', 'l', 'C'), actividades: `${TT('visita', 's', '', 'l', 'C')}`, atribuciones: 'Cartera', agenda: 'Cita', rutas: 'Ruta',
    pedidos: 'Pedido', perfiles: 'Usuario', productos: 'Producto', contactos: `${TT('paciente', 's', '', 'l', 'C')}` };
  const { data: us } = await db.rpc('usuarios_lista');
  const usuarios = (us || []).slice().sort((x, y) => String(x.nombre).localeCompare(String(y.nombre), 'es'));
  ($('admcuerpo') || document.createElement('div')).innerHTML = `<h2>Auditoría<span class="n" id="audn">…</span></h2>
    <p class="sm">Quién ha cambiado qué y cuándo. Se guarda automáticamente.</p>
    <div class="filtros" style="border:0;padding:10px 16px">
      <div id="audper"></div>
      <div><label for="ausr">Usuario</label><select id="ausr"><option value="">Todos</option>
        ${usuarios.map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select></div>
      <div><label for="aent">Entidad</label><select id="aent"><option value="">Todas</option>
        ${Object.entries(nombreEnt).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div></div>
    <div id="auddes"></div>
    <div class="lista" id="audlista"></div>`;
  const pinta = async () => {
    cargando($('audlista'), 'Filtrando…');
    const r = $('audper').__rango();
    const { data } = await RPC_ORIG('auditoria_lista', { p_entidad: $('aent').value || null, p_usuario: $('ausr').value || null,
      p_desde: r.desde, lim: 500 });
    if (!$('audn') || !$('audlista')) return;   // v2.160.0: se cambió de pestaña mientras cargaba (error del registro de pruebas)
    const l = (data || []).filter(a => !r.hasta || String(a.creado_en).slice(0, 10) <= r.hasta);
    $('audn').textContent = num(l.length) + (l.length === 500 ? '+' : '');
    $('audlista').innerHTML = l.map(a => `<div class="item" style="cursor:default">
      <span class="ic ${a.accion === 'Baja' ? 'w' : a.accion === 'Alta' ? 'o' : ''}">${a.accion === 'Alta' ? '+' : a.accion === 'Baja' ? '−' : '✎'}</span>
      <span class="tx"><b>${esc(a.accion)} · ${esc(nombreEnt[a.entidad] || a.entidad)}</b>
        <span class="sm">${esc(a.usuario)} · ${new Date(a.creado_en).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span class="sm">${esc(resumenDetalle(a.detalle))}</span></span>${deshacible(a) ? `<button type="button" class="btn sec" data-audx="${a.id}">Deshacer</button>` : ''}</div>`).join('')
      || '<div class="vacio">Sin movimientos con estos filtros.</div>';
    // v2.123.0: deshacer un cambio, o todo lo de la persona elegida desde el inicio del periodo
    $('audlista').querySelectorAll('[data-audx]').forEach(b => b.onclick = () => deshacerUno(+b.dataset.audx, pinta));
    cajaDeshacerPersona($('auddes'), $('ausr').value, r.desde, ($('ausr').selectedOptions[0] || {}).textContent || '', pinta);
  };
  montarPeriodo($('audper'), { id: 'auditoria', valor: '7d', alCambiar: pinta });
  ['ausr', 'aent'].forEach(id => $(id).onchange = pinta);
  pinta();
}

async function pintarRegistro() {
  cargando($('fcuerpo'), 'Cargando el registro…');
  const { data } = await RPC_ORIG('eventos_facturacion_lista', { lim: 200 });
  const l = data || [];
  $('fcuerpo').innerHTML = `<div class="panel"><div class="cuenta">Todo lo que ocurre en la facturación queda anotado: emisiones, rectificaciones, cobros y cambios de configuración.</div>
    <div class="dgrid-wrap"><div class="dgrid evs"><div class="dh"><span>Fecha y hora</span><span>Evento</span><span>Factura</span><span>Persona</span><span>Detalle</span></div>
    ${l.map(e => `<div class="dr" style="cursor:default"><span>${new Date(e.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span><span><b>${esc(e.tipo)}</b></span>
      <span>${esc(e.numero || '—')}</span><span>${esc(e.usuario || '—')}</span><span class="sm corta">${esc(detalleEvento(e.detalle))}</span></div>`).join('') || '<div class="vacio">Sin eventos.</div>'}
    </div></div></div>`;
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

async function cargarCampos() {
  const ambs = Object.keys(CAMPOS);
  const r = await Promise.all(ambs.map(a => db.rpc('campos_de', { p_ambito: a })));
  ambs.forEach((a, i) => { if (!r[i].error) CAMPOS[a] = r[i].data || []; });
  camposEnDirectorio();
}

function camposHTML(amb, valores) {
  const l = (CAMPOS[amb] || []).filter(c => c.en_ficha);
  if (!l.length) return '';
  return `<div class="cpersform" data-cpamb="${amb}"><h3>Campos personalizados</h3><div class="g2">${l.map(c =>
    `<div><label>${esc(c.nombre)}${c.obligatorio ? ' <span class="cpob">*</span>' : ''}</label>${campoInput(c, (valores || {})[c.clave])}</div>`).join('')}</div></div>`;
}

// Lee los campos del formulario. Devuelve null si no hay campos; { falta } si falta un obligatorio.
function camposLeer(raiz) {
  const b = raiz && raiz.querySelector('.cpersform'); if (!b) return null;
  const amb = b.dataset.cpamb, v = {}, falta = [];
  b.querySelectorAll('[data-cpk]:not([disabled])').forEach(i => {
    const c = (CAMPOS[amb] || []).find(x => x.clave === i.dataset.cpk); v[i.dataset.cpk] = i.value.trim();
    if (c && c.obligatorio && !i.value.trim()) falta.push(c.nombre);
  });
  return { amb, valores: v, falta };
}

async function camposGuardar(leido, id) {
  if (!leido || !id || !Object.keys(leido.valores).length) return true;
  const { data, error } = await db.rpc('guardar_campos', { p_ambito: leido.amb, p_id: id, p_valores: leido.valores });
  if (!error && data && data.ok) return true;
  const e = (data && data.errores || [])[0];
  const c = e && (CAMPOS[leido.amb] || []).find(x => x.clave === e.campo);
  toast(e ? `Revisa «${c ? c.nombre : e.campo}»: ${{ obligatorio: 'es obligatorio', numero: 'tiene que ser un número', fecha: 'no es una fecha válida', lista: 'no es un valor de la lista', si_no: 'tiene que ser sí o no', solo_lectura: 'no se puede cambiar', desconocido: 'ya no existe' }[e.error] || e.error}`
    : 'No se han podido guardar los campos personalizados', true);
  return false;
}

// Inserta el bloque en un formulario ya pintado, con los valores actuales de la ficha
async function camposInsertar(raiz, amb, id, antesDe) {
  if (!raiz || !(CAMPOS[amb] || []).some(c => c.en_ficha) || raiz.querySelector('.cpersform')) return;
  let v = {};
  if (id) { const { data } = await db.from(CAMPO_TABLA[amb]).select('clasificadores').eq('id', id).maybeSingle(); v = (data && data.clasificadores) || {}; }
  if (raiz.querySelector('.cpersform') || !raiz.isConnected) return;
  const ref = antesDe && antesDe.isConnected ? antesDe : null;
  if (ref) ref.insertAdjacentHTML('beforebegin', camposHTML(amb, v)); else raiz.insertAdjacentHTML('beforeend', camposHTML(amb, v));
}

function camposFiltrosActivar(zona, estado, alCambiar) {
  zona.querySelectorAll('[data-fcp]').forEach(sel => sel.onchange = () => {
    const k = sel.dataset.fcp;
    if (!sel.value) delete estado[k]; else estado[k] = sel.dataset.fcpt === 'si_no' ? sel.value === 'true' : sel.value;
    alCambiar();
  });
}

/* ---------- campos personalizados en las fichas ---------- */
async function bloqueCampos(tabla, id, cont) {
  if (!cont || !id || cont.querySelector('.campospers')) return;
  const { data } = await db.from(tabla).select('clasificadores').eq('id', id).maybeSingle();
  const c = (data && data.clasificadores) || {}; const ks = Object.keys(c).filter(k => c[k] !== '' && c[k] != null);
  const amb = Object.keys(CAMPO_TABLA).find(a => CAMPO_TABLA[a] === tabla), defs = CAMPOS[amb] || [];
  if (defs.length && ks.length) {
    if (cont.querySelector('.campospers')) return;
    const orden = defs.filter(d => ks.includes(d.clave)).concat(ks.filter(k => !defs.some(d => d.clave === k)).map(k => ({ clave: k, nombre: k.replace(/_/g, ' ').toLowerCase().replace(/^./, x => x.toUpperCase()) })));
    cont.insertAdjacentHTML('beforeend', `<div class="campospers"><h3>Campos personalizados</h3><div class="cpgrid">${orden.map(d =>
      `<div><span class="sm">${esc(d.nombre)}</span><b>${esc(campoTexto(d, c[d.clave]))}</b></div>`).join('')}</div></div>`);
    return;
  }
  if (!ks.length || cont.querySelector('.campospers')) return;
  cont.insertAdjacentHTML('beforeend', `<div class="campospers"><h3>Campos personalizados</h3><div class="cpgrid">${ks.map(k => `<div><span class="sm">${esc(k.replace(/_/g, ' ').toLowerCase().replace(/^./, x => x.toUpperCase()))}</span><b>${esc(typeof c[k] === 'object' ? JSON.stringify(c[k]) : c[k])}</b></div>`).join('')}</div></div>`);
}

async function estadoRefresco(recargarAlAcabar) {
  const { data: e } = await RPC_ORIG_FROM('entorno_pruebas').select('*').eq('id', 1).single();
  const el = $('prrefresco'); if (!el || !e) return null;
  const fmt = x => new Date(x).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const enMarcha = ['pedido', 'copiando'].includes(e.refresco_estado);
  el.textContent = enMarcha ? `· Copiando los datos de producción (${e.refresco_estado === 'pedido' ? 'empezando' : 'en marcha'}): tarda unos minutos`
    : e.refresco_estado === 'error' ? '· La última copia de producción falló' + (e.refresco_error ? ': ' + e.refresco_error : '')
    : e.refresco_error ? '· ' + e.refresco_error : '';
  el.classList.toggle('falta', e.refresco_estado === 'error');
  if ($('prtraer')) $('prtraer').disabled = enMarcha;
  if (enMarcha && !REFRESCO_VIGILA) REFRESCO_VIGILA = setInterval(async () => {
    const x = await estadoRefresco(true);
    if (x && !['pedido', 'copiando'].includes(x.refresco_estado)) {
      clearInterval(REFRESCO_VIGILA); REFRESCO_VIGILA = null;
      if (x.refresco_estado === 'ok') { toast('Datos de producción copiados'); limpiarDatosLocales(); setTimeout(() => location.reload(), 800); }
      else toast('La copia de producción ha fallado', true);
    }
  }, 20000);
  return e;
}

// v2.135.0 · Menú lateral: «Configuración» (pie del menú) se marca como sección activa cuando se está en Configuración
function menuMarcarPie() { const b = $('mlcfg'); if (b) b.classList.toggle('activo', TAB === 'config'); }

async function traerProduccion(ev) {
  if (!await preguntar('Se copiarán aquí los datos actuales de producción (producción no se toca) y pasarán a ser los nuevos datos de partida. Todo lo hecho en pruebas se perderá. Tarda unos minutos; puedes seguir usando la app mientras tanto.',
    { titulo: '¿Traer los datos de producción?', ok: 'Sí, traerlos', peligro: true })) return;
  if (ev && ev.target) ev.target.disabled = true;
  const { data: r, error } = await db.functions.invoke('refrescar-pruebas', { body: {} });
  let res = r;
  if (error && error.context && typeof error.context.json === 'function') { try { res = await error.context.json(); } catch (e) {} }
  if (!res || !res.ok) {
    if (ev && ev.target) ev.target.disabled = false;
    toast((res && MOTIVO_REFRESCO[res.motivo]) || 'No se ha podido lanzar la copia' + (error && !res ? ': falta la función «refrescar-pruebas» en Supabase' : ''), true);
    return;
  }
  toast('Copia de producción en marcha: tarda unos minutos');
  estadoRefresco();
}

async function pintarCfgPruebas() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = `<div class="card">${skelCard('Cargando…')}</div>`;
  const [{ data: e }, { data: puedeR, error: eR }] = await Promise.all([
    RPC_ORIG_FROM('entorno_pruebas').select('*').eq('id', 1).maybeSingle(), RPC_ORIG('pruebas_puede_restablecer', {})]);
  if (!$('cfgcuerpo')) return;
  const fmt = x => x ? new Date(x).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const permitido = puede('administrar') && (eR ? true : puedeR === true);
  c.innerHTML = `<div class="card" id="cfpruebas"><div class="fh"><div><h2>Entorno de pruebas</h2>
      <div class="sm">Una copia completa de la plataforma con su propia base de datos: nada de lo que hagas aquí afecta a los datos reales.</div></div></div>
    <div class="minis">
      <div><b>${fmt(e && e.maestro_guardado_en)}</b><span>Datos de partida (copia de producción)</span></div>
      <div><b>${fmt(e && e.ultimo_reset)}</b><span>Última vuelta a los datos de partida</span></div></div>
    <div class="sm" id="prrefresco" style="padding:0 16px"></div>
    ${permitido ? `<div class="acts" style="justify-content:flex-start;flex-wrap:wrap">
        <button type="button" class="btn" id="prtraer">⇣ Traer los datos de producción</button>
        <button type="button" class="btn sec" id="prreset">↺ Volver a los datos de partida</button></div>
      <p class="leer"><b>Traer los datos de producción</b> copia aquí los datos de hoy (producción solo se lee) y pasan a ser los nuevos datos de partida.
        <b>Volver a los datos de partida</b> deshace todo lo hecho en pruebas desde la última copia. En los dos casos se pierde lo hecho en pruebas.</p>`
      : '<p class="sm" style="padding:0 16px">Solo la persona responsable del entorno de pruebas puede traer los datos de producción o volver a los datos de partida.</p>'}</div>`;
  if ($('prtraer')) $('prtraer').onclick = traerProduccion;
  if ($('prreset')) $('prreset').onclick = volverDatosPartida;
  estadoRefresco();
}

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
