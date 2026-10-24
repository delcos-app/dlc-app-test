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

async function editorReglasCartera() {
  await cargarAjustes();
  const excl = !AJUSTES.cartera || AJUSTES.cartera.exclusiva !== false;
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Reglas de cartera</h2><div class="sm">Cómo se reparten ${TT('medico', 'p', 'el', 'l', 'l')} entre el equipo</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="rcexcl" ${excl ? 'checked' : ''}>
      <span><b>Cartera exclusiva</b><br><span class="sm">${TT('medico', 's', 'un', 'C', 'l')} solo puede estar en la cartera de una persona. Al asignarlo a alguien, sale de la cartera de quien lo tuviera.</span></span></label>
    <p class="sm">Si la desactivas, ${TT('medico', 's', 'un', 'l', 'l')} podrá estar en varias carteras y administración verá una alerta «${TT('medico', 'p', '', 'l', 'C')} en más de una cartera» en Inicio.</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="rcok">Guardar</button></div>`;
  $('dlg').showModal();
  $('rcok').onclick = async () => {
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'cartera', p_valor: { exclusiva: $('rcexcl').checked } });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    AJUSTES.cartera = { exclusiva: $('rcexcl').checked }; $('dlg').close(); toast('Reglas guardadas');
  };
}

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
async function pintarCopias() {
  const { data: au } = await db.from('auditoria').select('creado_en').eq('accion', 'Copia de seguridad').order('creado_en', { ascending: false }).limit(1);
  const ultima = au && au[0] ? new Date(au[0].creado_en) : null, dias = ultima ? Math.floor((Date.now() - ultima) / 864e5) : null;
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Copias de seguridad</h2>
    <p class="sm">Descarga en un único archivo todos los datos de la empresa: ${TT('medico', 'p', '', 'l', 'l')}, ${TT('visita', 'p', '', 'l', 'l')}, agenda, clientes, pedidos, facturas, stock y configuración. Las contraseñas no se incluyen.</p>
    <div class="copiaest ${dias == null || dias > 7 ? 'mal' : 'bien'}"><b>${ultima ? 'Última copia: ' + ultima.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }) : 'Todavía no se ha hecho ninguna copia'}</b>
      <span>${dias == null ? 'Haz la primera ahora.' : dias > 7 ? `Hace ${dias} días: conviene hacer una nueva.` : 'Al día.'}</span></div>
    <div class="acts" style="margin:12px 0 0"><button class="btn" id="copok">⬇ Descargar copia completa</button></div>
    <h3 class="mansub">Consejos</h3><ul class="manlist">
      <li><span>📅</span><span>Haz una copia cada semana y guárdala fuera del ordenador (unidad externa o nube de la empresa).</span></li>
      <li><span>🔐</span><span>El archivo contiene datos personales: guárdalo en un sitio con acceso restringido.</span></li>
      <li><span>🤖</span><span>Si quieres que se haga sola cada día, hay una copia automática gratuita con GitHub (pídela a quien te da soporte técnico).</span></li></ul></div>`;
  $('copok').onclick = async ev => {
    ev.target.disabled = true; ev.target.textContent = 'Preparando la copia…';
    const { data, error } = await RPC_ORIG('exportar_datos', {});
    ev.target.disabled = false; ev.target.textContent = '⬇ Descargar copia completa';
    if (error || !data) { toast('No se ha podido hacer la copia', true); return; }
    const b = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `copia_${nombreApp().replace(/[^\p{L}\p{N}]+/gu, '_')}_${hoyISO()}.json`; a.click();
    const n = Object.values(data.tablas || {}).reduce((s, t) => s + t.length, 0);
    toast(`Copia descargada · ${num(n)} registros`); setTimeout(pintarCopias, 800);
  };
}

async function deshacerUno(id, despues) {
  const { data: s } = await db.rpc('deshacer_cambio', { p_id: id, p_simular: true });
  if (!s || !s.ok) { toast(MOTIVO_DESHACER[(s && s.motivo) || ''] || (s && s.motivo) || 'No se puede deshacer', true); return; }
  if (!(s.campos || []).length) { toast('No hay nada que deshacer: esos datos se han vuelto a cambiar después', true); return; }
  if (!await preguntar(`Volverán a su valor de antes: ${s.campos.map(campoTxt).join(', ')}. Lo que se haya cambiado después no se toca.`, { titulo: 'Deshacer el cambio', ok: 'Deshacer' })) return;
  const { data: r, error } = await db.rpc('deshacer_cambio', { p_id: id, p_simular: false });
  if (error || !r || !r.ok) { toast('No se ha podido deshacer: ' + ((r && (MOTIVO_DESHACER[r.motivo] || r.motivo)) || (error && error.message) || ''), true); return; }
  toast('Cambio deshecho'); if (despues) despues();
}

function cajaDeshacerPersona(caja, usuario, desde, nombre, despues) {
  if (!caja) return;
  if (!usuario || !desde) { caja.innerHTML = ''; return; }
  caja.innerHTML = `<div class="card" id="audpersona" style="margin:0 16px 10px"><h3>Deshacer los cambios de ${esc(nombre.trim())}</h3>
    <p class="sm">Todo lo que cambió o borró en fichas, ${TT('consulta', 'p', '', 'l', 'l')}, clientes, productos y rutas desde el ${fechaCorta(desde)}. Lo que otra persona haya cambiado después no se toca.</p>
    <div class="acts" style="margin:6px 0 0"><button type="button" class="btn sec" id="audsim">Ver qué se desharía</button></div><div id="audres" class="sm"></div></div>`;
  $('audsim').onclick = async ev => {
    ev.target.disabled = true;
    const { data: s } = await db.rpc('deshacer_persona', { p_usuario: usuario, p_desde: desde + 'T00:00:00', p_simular: true });
    ev.target.disabled = false;
    if (!s || !s.ok) { toast('No se ha podido calcular', true); return; }
    const nom = { cuentas: 'fichas', ubicaciones: TT('consulta', 'p', '', 'l', 'l'), contactos: 'clientes', productos: 'productos', rutas: 'rutas' };
    if (!s.cambios) { $('audres').textContent = 'No hay nada que deshacer en ese periodo (o ya se ha vuelto a cambiar).'; return; }
    $('audres').innerHTML = `Se desharían <b>${num(s.cambios)}</b> cambios (${num(s.campos)} datos): ${Object.entries(s.por_entidad || {}).map(([k, n]) => `${num(n)} en ${nom[k] || k}`).join(', ')}.
      ${s.sin_deshacer ? ` ${num(s.sin_deshacer)} no se pueden deshacer porque se han vuelto a cambiar después.` : ''}
      <div class="acts" style="margin:8px 0 0"><button type="button" class="btn" id="audok">Deshacer ${num(s.cambios)} cambios</button></div>`;
    $('audok').onclick = async ev2 => {
      if (!await preguntar(`Se desharán ${num(s.cambios)} cambios de ${nombre.trim()} desde el ${fechaCorta(desde)}. Queda registrado y cada uno se puede volver a cambiar a mano.`, { titulo: 'Deshacer sus cambios', ok: 'Deshacer' })) return;
      ev2.target.disabled = true;
      const { data: r } = await db.rpc('deshacer_persona', { p_usuario: usuario, p_desde: desde + 'T00:00:00', p_simular: false });
      if (!r || !r.ok) { ev2.target.disabled = false; toast('No se ha podido deshacer', true); return; }
      toast(`Deshechos ${num(r.cambios)} cambios`); if (despues) despues();
    };
  };
}

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

// Configuración → el catálogo de resultados: en qué estados aparece cada uno
function enEstadosTxt(l) { return l && l.length ? 'Solo en: ' + l.join(', ') : 'En todos los estados'; }

function decorarResultados() {
  const caja = $('dbody'); if (!caja) return;
  caja.querySelectorAll('[data-vdest]').forEach(sel => {
    const item = sel.closest('.item'); if (!item || item.querySelector('[data-ven]')) return;
    const vid = sel.dataset.vdest;
    const v = (CATS || []).flatMap(c => c.valores || []).find(x => x.id === vid); if (!v) return;
    sel.insertAdjacentHTML('afterend', `<button type="button" class="btn sec" data-ven="${vid}" title="En qué estados de la ficha aparece este resultado">${esc(enEstadosTxt(v.en_estados))}</button>`);
    item.querySelector('[data-ven]').onclick = () => {
      const abierta = item.nextElementSibling && item.nextElementSibling.classList.contains('venbox');
      caja.querySelectorAll('.venbox').forEach(x => x.remove());
      if (abierta) return;
      const marcados = new Set(v.en_estados || []);
      item.insertAdjacentHTML('afterend', `<div class="venbox"><span class="sm">«${esc(v.valor)}» aparece al registrar ${TT('visita', 's', 'el', 'l', 'l')} de las fichas en estos estados (sin marcar ninguno, en todos):</span>
        <div class="chips">${estados().map(e => `<button type="button" class="chip ${marcados.has(e) ? 'on' : ''}" data-vene="${esc(e)}" aria-pressed="${marcados.has(e)}">${esc(e)}</button>`).join('')}</div>
        <div class="acts" style="justify-content:flex-end;margin:6px 0 0"><button type="button" class="btn sec" data-vencerrar>Cancelar</button><button type="button" class="btn" data-venok>Guardar</button></div></div>`);
      const box = item.nextElementSibling;
      box.querySelectorAll('[data-vene]').forEach(b => b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      box.querySelector('[data-vencerrar]').onclick = () => box.remove();
      box.querySelector('[data-venok]').onclick = async ev => {
        const l = [...box.querySelectorAll('[data-vene][aria-pressed="true"]')].map(b => b.dataset.vene);
        ev.target.disabled = true;
        const { data: r, error } = await db.rpc('guardar_valor', { p: { id: vid, en_estados: l.length === estados().length ? [] : l } });
        ev.target.disabled = false;
        if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
        v.en_estados = l.length && l.length < estados().length ? l : null;
        item.querySelector('[data-ven]').textContent = enEstadosTxt(v.en_estados);
        box.remove(); toast(v.en_estados ? `«${v.valor}» solo sale en: ${l.join(', ')}` : `«${v.valor}» sale en todos los estados`);
      };
    };
  });
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

async function pintarEstadosPapel() {
  const c = $('cfgcuerpo'); if (!c) return;
  cargando(c, 'Cargando los estados…');
  const { data: ce } = await db.from('clasificadores').select('id').eq('papel', 'estado_comercial').limit(1);
  const { data: est, error } = ce && ce[0] ? await db.from('valores_clasificador').select('id,valor,orden,activo,papel').eq('clasificador_id', ce[0].id).order('orden')
    : { data: [], error: null };
  if (!$('cfgcuerpo') || CFG_KEY !== 'estados') return;
  if (error) { c.innerHTML = `<div class="card"><p class="sm">No se han podido leer los estados: ${esc(error.message)}</p></div>`; return; }
  const l = (est || []).filter(v => v.activo !== false);
  const opc = v => PAPELES_ESTADO.map(([k, t]) => `<option value="${k}" ${v.papel === k ? 'selected' : ''}>${t}</option>`).join('');
  c.innerHTML = `<div class="card estw">
      <p class="sm">Cada estado tiene un papel. Con él, la plataforma sabe qué ficha es nueva, cuál avanza, cuál ya es cliente y cuál se ha perdido:
        de ahí salen los avisos, los indicadores de Inicio y qué resultados se ofrecen al registrar ${esc(TT('visita', 's', 'una', 'l', 'l'))}. El nombre de cada estado se cambia en «Textos personalizados».</p>
      ${l.length ? l.map(v => `<div class="ajfila estfila" data-estid="${v.id}"><div><b>${esc(v.valor)}</b>
          <span class="sm">${esc((PAPELES_ESTADO.find(p => p[0] === v.papel) || [, , 'Sin papel: no cuenta en avisos ni indicadores'])[2])}</span></div>
        <div class="ajctl"><select data-estpapel="${v.id}" aria-label="Papel de ${esc(v.valor)}" ${v.papel === 'inicial' ? 'title="Para cambiarlo, marca otro estado como Inicial"' : ''}>${v.papel ? '' : '<option value="" selected>Sin papel</option>'}${opc(v)}</select></div></div>`).join('')
        : '<p class="vacio">Todavía no hay estados comerciales.</p>'}</div>`;
  c.querySelectorAll('[data-estpapel]').forEach(s => s.onchange = async () => {
    const v = l.find(x => x.id === s.dataset.estpapel), nuevo = s.value;
    if (!v || !nuevo || nuevo === v.papel) return;
    if (v.papel === 'inicial') { s.value = v.papel; toast('Para cambiar el estado inicial, marca otro estado como «Inicial»', true); return; }
    const ant = l.find(x => x.papel === 'inicial' && x.id !== v.id);
    if (nuevo === 'inicial' && ant && !await preguntar(`Las fichas nuevas empezarán en «${v.valor}». «${ant.valor}» pasará a «En avance».`, { titulo: '¿Cambiar el estado inicial?', ok: 'Cambiar' })) { s.value = v.papel || ''; return; }
    s.disabled = true;
    const { data: r, error } = await db.rpc('guardar_papel_estado', { p_id: v.id, p_papel: nuevo });
    if (error || !r || !r.ok) {
      s.disabled = false; s.value = v.papel || '';
      toast(({ permiso: 'No tienes permiso para cambiarlo', sin_inicial: 'Para cambiar el estado inicial, marca otro estado como «Inicial»', papel: 'Ese papel no existe' })[(r && r.error) || ''] || ('No se ha podido cambiar' + (error ? ': ' + error.message : '')), true);
      return;
    }
    toast('Papel cambiado');
    invalidarCache(); try { await cargarCatalogos(); } catch (e) {}
    pintarEstadosPapel();
  });
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

async function matMejorar() {
  const lista = document.querySelector('#cfgcuerpo .matlista'); if (!lista) return;
  const { data: cid } = await db.from('clasificadores').select('id').eq('papel', 'material_visita').maybeSingle();
  if (!cid) return;
  const conPortal = typeof hayExtra === 'function' && hayExtra('portal');
  const [{ data: vals }, rp, ra] = await Promise.all([
    db.from('valores_clasificador').select('id,valor,activo,dato_tipo').eq('clasificador_id', cid.id).order('orden'),
    conPortal ? RPC_ORIG('portal_material_permitido', {}) : Promise.resolve({ data: [] }),
    conPortal ? db.from('ajustes').select('valor').eq('clave', 'portal').maybeSingle() : Promise.resolve({ data: null })]);
  if (!document.querySelector('#cfgcuerpo .matlista')) return;
  const perm = Array.isArray(rp && rp.data) ? rp.data : [], conAjuste = !!(ra && ra.data && ra.data.valor && ra.data.valor.material);
  const de = v => perm.find(p => p.valor === v);
  const vis = TT('visita', 's', 'la', 'l', 'l');
  lista.classList.add('matlista2');
  lista.innerHTML = (vals || []).map(v => { const p = de(v.valor); return `<div class="matfila2 ${v.activo ? '' : 'off'}" data-mv="${v.id}" data-mvv="${esc(v.valor)}" data-mdt0="${v.dato_tipo === 'numero' ? 'numero' : ''}">
      <b class="mtnom">${esc(v.valor)}</b>
      <label class="mtcampo"><span class="sm">Al registrar ${vis}</span><select class="chico" data-mdt>
        <option value="numero" ${v.dato_tipo === 'numero' ? 'selected' : ''}>Anotar cuántas se entregan</option>
        <option value="" ${v.dato_tipo === 'numero' ? '' : 'selected'}>Solo marcar que se entregó</option></select></label>
      ${conPortal ? `<label class="opt mtpor"><input type="checkbox" data-mpp ${p ? 'checked' : ''}> Se puede pedir desde el portal</label>
      <label class="mtcampo mtmax"><span class="sm">Máximo por petición</span><input type="number" step="1" data-mpx value="${p ? p.max : 20}" ${p ? '' : 'disabled'}></label>` : ''}
      <label class="vfswitch mini"><input type="checkbox" data-mact2="${v.id}" ${v.activo ? 'checked' : ''}><span class="sw"></span><span class="sm">${v.activo ? 'Activo' : 'Oculto'}</span></label>
      <span class="mterr sm" hidden></span></div>`; }).join('') || '<div class="sm">Todavía no hay material.</div>';
  if (vals && vals.length) lista.insertAdjacentHTML('afterend', `<div class="acts mtacts" style="justify-content:space-between;align-items:center">
      <span class="sm">${conPortal && !conAjuste ? 'Ahora el portal permite pedir todo el material, hasta 20 de cada uno. Guarda para decidirlo tú.' : ''}</span>
      <button class="btn" id="matguardar">Guardar cambios</button></div>`);
  lista.querySelectorAll('[data-mpp]').forEach(c => c.onchange = () => { const i = c.closest('.matfila2').querySelector('[data-mpx]'); if (i) i.disabled = !c.checked; });
  lista.querySelectorAll('[data-mact2]').forEach(c => c.onchange = async () => {
    await db.rpc('guardar_valor', { p: { id: c.dataset.mact2, activo: c.checked } });
    c.closest('.matfila2').classList.toggle('off', !c.checked); c.parentElement.querySelector('.sm').textContent = c.checked ? 'Activo' : 'Oculto';
    toast(c.checked ? 'Visible al registrar' : 'Oculto al registrar'); cargarCatalogos();
  });
  if ($('matguardar')) $('matguardar').onclick = async ev => {
    const filas = [...lista.querySelectorAll('.matfila2')];
    let mal = false; const material = [];
    filas.forEach(f => {
      const e = f.querySelector('.mterr'); e.hidden = true; e.textContent = '';
      const c = f.querySelector('[data-mpp]'), i = f.querySelector('[data-mpx]');
      if (!c || !c.checked) return;
      const n = Number(i.value);
      if (!i.value || !Number.isInteger(n) || n < 1 || n > 1000) { e.hidden = false; e.textContent = 'El máximo por petición tiene que ser un número entero de 1 a 1.000'; mal = true; return; }
      material.push({ valor: f.dataset.mvv, max: n });
    });
    if (mal) { toast('Revisa los máximos marcados en rojo', true); return; }
    ev.target.disabled = true;
    try {
      for (const f of filas) {
        const s = f.querySelector('[data-mdt]');
        if (s.value !== f.dataset.mdt0) {
          const { error } = await db.rpc('guardar_valor', { p: { id: f.dataset.mv, dato_tipo: s.value, dato_etiqueta: s.value ? 'Unidades' : '' } });
          if (error) { toast('No se ha podido guardar ' + f.dataset.mvv + ': ' + error.message, true); return; }
          f.dataset.mdt0 = s.value;
        }
      }
      if (conPortal) {
        const { error } = await db.rpc('guardar_ajuste', { p_clave: 'portal', p_valor: Object.assign({}, (ra && ra.data && ra.data.valor) || {}, { material }) });
        if (error) { toast('No se ha podido guardar el portal: ' + error.message, true); return; }
      }
      toast('Guardado'); cargarCatalogos();
    } finally { ev.target.disabled = false; }
  };
}

function conexionTxt(a, largo) {
  const t = a && (a.ultima_conexion || a.ultimo_acceso), d = t ? new Date(t) : null;
  if (!d || isNaN(d)) return a ? 'Nunca se ha conectado' : (largo ? 'Última conexión: sin datos' : '');
  const min = Math.round((Date.now() - d) / 60000), hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0); const ayer = new Date(hoy - 864e5);
  let x;
  if (min < 5) x = 'ahora mismo';
  else if (min < 60) x = 'hace ' + min + ' min';
  else if (d >= hoy) x = 'hoy a las ' + hora;
  else if (d >= ayer) x = 'ayer a las ' + hora;
  else x = 'el ' + d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: d.getFullYear() === hoy.getFullYear() ? undefined : 'numeric' }) + (largo ? ' a las ' + hora : '');
  return (largo ? 'Última conexión: ' : 'Conectado ') + x;
}

async function pintarAccesos() {
  cargando($('admcuerpo'), 'Cargando los accesos…');
  const { data } = await db.rpc('accesos_lista', { p_usuario: null, lim: 200 });
  const l = data || [];
  ($('admcuerpo') || document.createElement('div')).innerHTML = `<h2>Accesos<span class="n">${l.length}</span></h2>
    <p class="sm">Últimas entradas y salidas de la plataforma.</p>
    <div class="lista">${l.map(a => `<div class="item" style="cursor:default">
      <span class="ic ${a.evento === 'Entrada' ? 'o' : ''}">${a.evento === 'Entrada' ? '→' : '←'}</span>
      <span class="tx"><b>${esc(a.usuario)}</b><span class="sm">${esc(a.evento)} ·
        ${new Date(a.creado_en).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        ${a.agente ? ' · ' + esc(String(a.agente).slice(0, 60)) : ''}</span></span></div>`).join('')
      || '<div class="vacio">Todavía no hay accesos registrados.</div>'}</div>`;
}

function editorDato(v, alGuardar) {
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>Dato de «${esc(v.valor)}»</h2>
      <div class="sm">Al marcar este valor en ${TT('visita', 's', 'un', 'l', 'l')}, se pedirá además este dato</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="dtt">Qué dato pide</label>
    <select id="dtt"><option value="">Ninguno (solo se marca)</option>
      <option value="numero" ${v.dato_tipo === 'numero' ? 'selected' : ''}>Un número (p. ej. cantidad)</option>
      <option value="texto" ${v.dato_tipo === 'texto' ? 'selected' : ''}>Un texto libre</option>
      <option value="lista" ${v.dato_tipo === 'lista' ? 'selected' : ''}>Una opción de una lista</option></select>
    <div id="dtcfg">
      <label for="dte">Cómo se llama el dato</label><input id="dte" value="${esc(v.dato_etiqueta || '')}" placeholder="p. ej. Cantidad, A quién, Producto">
      <div id="dtlw"><label for="dtl">Opciones de la lista <span class="sm">· una por línea</span></label>
        <textarea id="dtl" rows="4">${esc((v.dato_opciones || []).join('\n'))}</textarea></div>
    </div>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar2>Cancelar</button><button class="btn" id="dtok">Guardar</button></div>`;
  const vis = () => { $('dtcfg').classList.toggle('hide', !$('dtt').value); $('dtlw').classList.toggle('hide', $('dtt').value !== 'lista'); };
  $('dtt').onchange = vis; vis();
  $('dtok').onclick = async () => {
    const tipo = $('dtt').value;
    const ops = $('dtl').value.split('\n').map(x => x.trim()).filter(Boolean);
    if (tipo === 'lista' && !ops.length) { toast('Escribe al menos una opción', true); return; }
    const { data: r, error } = await db.rpc('guardar_valor', { p: { id: v.id, dato_tipo: tipo, dato_etiqueta: tipo ? $('dte').value.trim() : '',
      dato_opciones: tipo === 'lista' ? ops : [] } });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    $('dlg2').close(); toast('Dato guardado'); alGuardar();
  };
  $('dlg2').showModal();
}

// Auditoría: los cambios se leen como texto (antes salía «[object Object]» con valores complejos)
function textoValor(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  if (Array.isArray(v)) return v.length ? v.slice(0, 3).map(textoValor).join(', ') + (v.length > 3 ? '…' : '') : '—';
  if (typeof v === 'object') {
    if (v.nombre) return String(v.nombre);
    const k = Object.keys(v); return k.length ? k.slice(0, 3).map(x => `${x}: ${textoValor(v[x])}`).join(', ') + (k.length > 3 ? '…' : '') : '—';
  }
  return String(v);
}

function resumenDetalle(d) {
  if (!d) return '';
  if (typeof d !== 'object') return String(d).slice(0, 120);
  if (d.nombre && typeof d.nombre !== 'object') return String(d.nombre);
  const cambios = Object.keys(d).filter(k => Array.isArray(d[k]) && d[k].length === 2).slice(0, 4);
  if (cambios.length) return cambios.map(k => `${k}: ${textoValor(d[k][0]).slice(0, 24)} → ${textoValor(d[k][1]).slice(0, 24)}`).join(' · ');
  return Object.keys(d).slice(0, 4).map(k => `${k}: ${textoValor(d[k]).slice(0, 30)}`).join(' · ');
}
async function facccon(uid) {
  if (!puede('administrar')) return;   // la información de sesión, solo para la administración (Eric)
  const { data } = await RPC_ORIG('ultimas_conexiones', { p_ids: [uid] });
  const el = document.querySelector(`[data-facccon="${uid}"]`); if (!el) return;
  const a = (data || []).find(x => x.id === uid);
  el.textContent = a ? conexionTxt(a, true) : '';
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

let CATS_ABIERTOS = {};

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

const MOTIVO_DESHACER = { permiso: 'No tienes permiso', no_existe: 'Ese cambio ya no está en el registro', no_deshacible: 'Ese tipo de cambio no se puede deshacer',
  ya_no_existe: 'El registro ya no existe', ya_existe: 'Ya estaba recuperado' };

/* v2.133.0 · Entorno de pruebas: «Traer los datos de producción». Junto a «Volver a los datos de partida» (y para quien puede
   usarlo), pide a la función «refrescar-pruebas» de Supabase que lance el proceso de GitHub que copia los datos actuales de
   producción (solo los lee) y los deja como nuevos datos de partida. La franja enseña en qué punto está y recarga al terminar. */
const MOTIVO_REFRESCO = { permiso: 'Solo la administración puede traer los datos de producción', responsable: 'Solo la persona responsable del entorno de pruebas puede hacerlo',
  en_marcha: 'Ya se están copiando los datos de producción', github: 'No se ha podido lanzar la copia en GitHub', no_es_pruebas: 'Esto solo funciona en el entorno de pruebas' };

let REFRESCO_VIGILA = null;

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

function abrirClasificadorBase(id) {
  const c = CATS.find(x => x.id === id); if (!c) return;
  const puedeEditar = puede('administrar') || ((PERFIL.areas || {}).K || 0) >= 2;
  const completo = puede('administrar') || ((PERFIL.areas || {}).K || 0) >= 3;

  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${esc(c.nombre)}</h2>
        <div class="sm">Grupo ${esc(c.grupo || 'General')} · se usa en ${esc(c.ambito === 'pedido' ? 'pedidos' : c.ambito === 'visita' ? 'visitas' : `fichas de ${TT('medico', 's', '', 'l', 'l')}`)}
        ${puedeEditar ? '' : ' · <b>solo lectura</b>'}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      ${cajaCampo(c, completo)}
      <div class="lista ${!c.papel && CAMPO_TABLA[c.ambito] && (c.tipo_campo || 'lista') !== 'lista' ? 'hide' : ''}">${(c.valores || []).map(v => `<div class="item ${v.padre ? 'vsub' : ''}" style="cursor:default">
        <span class="ic">${v.activo ? '●' : '○'}</span>
        <span class="tx"><b style="${v.activo ? '' : 'opacity:.5;text-decoration:line-through'}">${esc(v.valor)}</b>
          ${v.extra ? `<span class="sm">${v.extra === 'neg' ? `sin ${TT('visita', 's', '', 'l', 'l')}` : `${TT('visita', 's', '', 'l', 'l', 'realizado')}`}${v.destino ? ' · pasa a ' + esc(v.destino) : ''}</span>` : ''}</span>
        ${puedeEditar ? `<span class="acts" style="margin:0">
          <button class="btn sec" data-vren="${v.id}|${esc(v.valor)}">Renombrar</button>
          ${c.papel === 'resultado_visita' ? `<select data-vdest="${v.id}" title="Estado al que pasa la ficha con este resultado" style="max-width:170px"><option value="">No cambia el estado</option>${estados().map(x => `<option value="${esc(x)}" ${v.destino === x ? 'selected' : ''}>Pasa a ${esc(x)}</option>`).join('')}</select>` : ''}
          <button class="btn sec" data-vtog="${v.id}|${v.activo ? 0 : 1}">${v.activo ? 'Desactivar' : 'Activar'}</button>
          ${completo ? `<button class="btn sec dang" data-vdel="${v.id}">Eliminar</button>` : ''}</span>` : ''}
      </div>`).join('') || '<div class="vacio">Sin valores todavía.</div>'}</div>
      ${puedeEditar ? `<div class="acts"><input id="cvnew" placeholder="Nuevo valor" style="flex:1;min-width:160px">
        ${c.papel === 'resultado_visita' ? `<select id="cvextra" style="max-width:170px"><option value="pos">${TT('visita', 's', '', 'l', 'C', 'realizado')}</option><option value="neg">Sin ${TT('visita', 's', '', 'l', 'l')}</option></select>
          <select id="cvdest" style="max-width:190px" title="Estado al que pasa la ficha con este resultado"><option value="">No cambia el estado</option>${estados().map(x => `<option value="${esc(x)}">Pasa a ${esc(x)}</option>`).join('')}</select>` : ''}
        ${(c.valores || []).some(v => v.padre) ? `<select id="cvpadre" style="max-width:210px" title="Categoría del valor"><option value="">Sin categoría (es una categoría)</option>${(c.valores || []).filter(v => !v.padre).map(v => `<option value="${esc(v.valor)}">Dentro de ${esc(v.valor)}</option>`).join('')}</select>` : ''}
        <button class="btn" id="cvadd">Añadir</button></div>` : ''}
      ${completo && !c.sistema ? `<div class="acts" style="justify-content:flex-end;border-top:1px solid var(--line);padding-top:12px">
        <button class="btn sec dang" id="cdel">Eliminar clasificador</button></div>` : ''}`;

    if ($('cfcok')) $('cfcok').onclick = async () => {
      const v = { tipo: $('cfctipo').value };
      ['obligatorio', 'solo_lectura', 'en_ficha', 'en_tabla', 'en_filtro'].forEach(k => { v[k] = $('cfc_' + k).checked; });
      const { data: r, error } = await db.rpc('configurar_campo', { p_id: id, p: v });
      if (error || !r || !r.ok) { toast('No se ha podido guardar el campo', true); return; }
      toast('Campo guardado'); recarga(); cargarCampos().catch(() => {});
    };
    const recarga = async () => {
      const { data } = await db.rpc('catalogos_todos');
      CATS = data || [];
      Object.assign(c, CATS.find(x => x.id === id) || c);
      pinta(); cargarCatalogos();
    };

    if ($('cvadd')) $('cvadd').onclick = async () => {
      const v = $('cvnew').value.trim(); if (!v) return;
      const { error } = await db.rpc('guardar_valor', { p: { clasificador_id: id, valor: v,
        extra: $('cvextra') ? $('cvextra').value : null, destino: $('cvdest') ? $('cvdest').value : null,
        ...($('cvpadre') && $('cvpadre').value ? { padre: $('cvpadre').value, valor: v.startsWith($('cvpadre').value + ' · ') ? v : $('cvpadre').value + ' · ' + v } : {}) } });
      if (error) { toast('No se ha podido añadir', true); return; }
      toast('Valor añadido'); recarga();
    };
    $('dbody').querySelectorAll('[data-vtog]').forEach(b => b.onclick = async () => {
      const [vid, activo] = b.dataset.vtog.split('|');
      await db.rpc('guardar_valor', { p: { id: vid, activo: activo === '1' } });
      recarga();
    });
    $('dbody').querySelectorAll('[data-vren]').forEach(b => b.onclick = async () => {
      const [vid, actual] = b.dataset.vren.split('|');
      const nuevo = await pedirTexto('Nuevo nombre', actual, { titulo: 'Renombrar valor', ok: 'Guardar' });
      if (!nuevo) return;
      await db.rpc('guardar_valor', { p: { id: vid, valor: nuevo } });
      toast('Renombrado'); recarga();
    });
    // v2.87.0: el estado al que lleva cada resultado se puede cambiar en cualquier momento
    $('dbody').querySelectorAll('[data-vdest]').forEach(sel => sel.onchange = async () => {
      const { data: r, error } = await db.rpc('guardar_valor', { p: { id: sel.dataset.vdest, destino: sel.value } });
      if (error || (r && r.ok === false)) { toast('No se ha podido cambiar', true); return; }
      toast(sel.value ? `Ahora pasa a ${sel.value}` : 'Ya no cambia el estado');
    });
    $('dbody').querySelectorAll('[data-vdel]').forEach(b => b.onclick = async () => {
      if (!await preguntar(`Las fichas y ${TT('visita', 'p', '', 'l', 'l')} que ya lo usan lo conservan, pero dejará de aparecer.`,
        { titulo: '¿Eliminar el valor?', ok: 'Eliminar', peligro: true })) return;
      const { data: r } = await db.rpc('borrar_valor', { p_id: b.dataset.vdel });
      if (r && r.ok === false) { toast('No tienes permiso', true); return; }
      toast('Eliminado'); recarga();
    });
    if ($('cdel')) $('cdel').onclick = async () => {
      if (!await preguntar(`Se elimina "${c.nombre}" y todos sus valores.`,
        { titulo: '¿Eliminar el clasificador?', ok: 'Eliminar', peligro: true })) return;
      const { data: r } = await db.rpc('borrar_clasificador', { p_id: id });
      if (r && r.ok === false) { toast(r.error === 'sistema' ? 'Los del sistema no se pueden eliminar' : 'Sin permiso', true); return; }
      $('dlg').close(); toast('Clasificador eliminado'); pintarCatalogos(); cargarCatalogos();
    };
  };
  pinta();
  $('dlg').showModal();
}

function colsConfigBase() {
  let g = null;
  try { g = JSON.parse(localStorage.getItem(colKey()) || 'null'); } catch (e) {}
  if (!g || !g.length) g = COLS.map(c => ({ k: c.k, on: COLS_DEF.includes(c.k) || (c.k === 'comerciales' && VE_TODO()), w: c.w }));
  COLS.forEach(c => { if (!g.some(x => x.k === c.k)) g.push({ k: c.k, on: c.k === 'comerciales' && VE_TODO(), w: c.w }); });
  return g.filter(x => x.k !== 'comerciales' || VE_TODO());
}

function abrirClasificador(id) {
  abrirClasificadorBase(id);
  const c = CATS.find(x => x.id === id);
  const permitido = puede('administrar') || ((PERFIL.areas || {}).K || 0) >= 2;
  if (!c || !permitido || !['visita'].includes(c.ambito) && c.papel !== 'resultado_visita') return;
  // Cada vez que se repinta la ventana, se añaden los botones de dato
  const decorar = () => {
    const items = $('dbody').querySelectorAll('.lista > .item');
    (c.valores || []).forEach((v, i) => {
      const it = items[i]; if (!it || it.querySelector('[data-vdato]')) return;
      const tx = it.querySelector('.tx');
      if (v.dato_tipo) tx.insertAdjacentHTML('beforeend', `<span class="sm">Pide: ${esc(v.dato_etiqueta || v.dato_tipo)}${v.dato_tipo === 'lista' ? ' (' + (v.dato_opciones || []).length + ' opciones)' : ''}</span>`);
      const acts = it.querySelector('.acts');
      if (acts) acts.insertAdjacentHTML('afterbegin', `<button class="btn sec" data-vdato="${v.id}">${v.dato_tipo ? 'Cambiar dato' : '+ Dato'}</button>`);
    });
    $('dbody').querySelectorAll('[data-vdato]').forEach(b => b.onclick = () => {
      const v = (c.valores || []).find(x => x.id === b.dataset.vdato);
      editorDato(v, async () => {
        const { data } = await db.rpc('catalogos_todos'); CATS = data || [];
        cargarCatalogos(); abrirClasificador(id);
      });
    });
    if (!$('dbody').querySelector('.datoinfo')) $('dbody').querySelector('.fh').insertAdjacentHTML('afterend',
      `<p class="sm datoinfo">Con <b>+ Dato</b>, al marcar ese valor en ${TT('visita', 's', 'un', 'l', 'l')} se pedirá también una cantidad, un texto o una opción de una lista.</p>`);
  };
  decorar();
  new MutationObserver((_, obs) => { if (!$('dlg').open) { obs.disconnect(); return; } decorar(); })
    .observe($('dbody'), { childList: true });
}

async function pintarRolesBase() {
  await cargarAjustes();
  const roles = rolesNombres().filter(r => !rolPuede(r, 'portal_prescriptor'));
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Roles y permisos</h2>
    <p class="sm">Cada rol tiene una plantilla de permisos que se aplica al dar de alta a una persona o al cambiarle el rol. Después se puede ajustar persona a persona en Usuarios. ${TT('medico', 'p', 'el', 'C', 'l')} con acceso solo ven su informe.</p>
    <div class="nivleg">${NIVEL_TXT.map((t, i) => `<span class="nv${i}"><b>${esc(t)}</b>${['No ve el módulo ni aparece en el menú', 'Lo ve, pero no cambia nada', 'Crea y edita lo suyo', 'Todo, incluido borrar y configurar'][i]}</span>`).join('')}</div>
    <div class="dgrid-wrap"><table class="rolmat"><thead><tr><th>Permiso</th>${roles.map(r => `<th>${esc(r)}</th>`).join('')}</tr></thead>
      <tbody>${AREAS.map(([k, n]) => `<tr><td><b>${esc(n)}</b><span class="sm">${esc(QUE_ABRE[k] || '')}</span></td>
        ${roles.map(r => `<td><select data-rol="${esc(r)}" data-ar="${k}" class="nvsel chico" ${rolPuede(r, 'administrar') ? 'disabled' : ''}>${NIVEL_TXT.map((t, i) => `<option value="${i}" ${+(plantillaRol(r)[k] || 0) === i ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" id="rolrest">Volver a los valores de partida</button><button class="btn" id="rolok">Guardar plantillas</button></div></div>`;
  const colorea = () => $('cfgcuerpo').querySelectorAll('.nvsel').forEach(s => s.className = 'nvsel chico nv' + s.value);
  $('cfgcuerpo').addEventListener('change', colorea); colorea();
  const leer = () => { const o = {}; $('cfgcuerpo').querySelectorAll('[data-rol]:not([disabled])').forEach(s => { (o[s.dataset.rol] = o[s.dataset.rol] || {})[s.dataset.ar] = +s.value; }); return o; };
  $('rolrest').onclick = async () => { await db.rpc('guardar_ajuste', { p_clave: 'roles', p_valor: {} }); AJUSTES.roles = {}; toast('Valores de partida'); pintarRoles(); };
  $('rolok').onclick = async () => {
    const v = leer(); const { error } = await db.rpc('guardar_ajuste', { p_clave: 'roles', p_valor: v });
    if (error) { toast('No se ha podido guardar', true); return; }
    AJUSTES.roles = v;
    if (await preguntar('Las plantillas se usan en las altas y cambios de rol. ¿Quieres aplicarlas también ahora a todas las personas que ya tienen esos roles? Se sustituirán sus permisos actuales.', { titulo: '¿Aplicar a las personas actuales?', ok: 'Aplicar a todos' })) {
      let n = 0; for (const [r, a] of Object.entries(v)) { const { data: x } = await db.rpc('aplicar_plantilla_rol', { p_rol: r, p_areas: a }); n += (x && x.personas) || 0; }
      toast(`Plantillas guardadas y aplicadas a ${n} personas`);
    } else toast('Plantillas guardadas');
  };
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

function colsConfig() {
  let guardada = null;
  try { guardada = JSON.parse(localStorage.getItem(colKey()) || 'null'); } catch (e) { /* sin almacenamiento */ }
  return colsConfigBase().map(c => c.k.startsWith('cp:') && !(guardada || []).some(x => x.k === c.k)
    ? { ...c, on: !!((CAMPOS.medico || []).find(x => 'cp:' + x.clave === c.k) || {}).en_tabla } : c);
}

/* v2.109.0 · Permisos propios en los roles: importar, clasificadores y dar acceso.
   Configuración → Usuarios y roles → Roles tiene debajo de las plantillas la tabla «Permisos» (las capacidades del grupo
   «Permisos»; el resto de capacidades no se cambian desde aquí). Quien tiene «Dar acceso a fichas de su cartera» da acceso
   al portal desde la ficha, sin pasar por Usuarios: se crea la invitación ligada a la ficha y después el usuario. */
async function pintarRoles(...a) {
  await pintarRolesBase(...a);
  if (!puede('administrar') || !$('cfgcuerpo')) return;
  const { data: caps } = await db.from('capacidades').select('clave,nombre,descripcion,orden').eq('grupo', 'Permisos').order('orden');
  if (!(caps || []).length || !$('cfgcuerpo') || $('rolperm')) return;
  const roles = rolesNombres().filter(r => !rolPuede(r, 'portal_prescriptor'));
  $('cfgcuerpo').insertAdjacentHTML('beforeend', `<div class="card cfgpanel" id="rolperm"><h2>Permisos</h2>
    <p class="sm">Lo que puede hacer cada rol además de sus módulos. Se aplica a todas las personas del rol al guardar.</p>
    <div class="dgrid-wrap"><table class="rolmat"><thead><tr><th>Permiso</th>${roles.map(r => `<th>${esc(r)}</th>`).join('')}</tr></thead>
      <tbody>${caps.map(c => `<tr><td><b>${esc(c.nombre)}</b><span class="sm">${esc(c.descripcion || '')}</span></td>
        ${roles.map(r => `<td><input type="checkbox" data-prol="${esc(r)}" data-pcap="${esc(c.clave)}" aria-label="${esc(c.nombre)} · ${esc(r)}" ${rolPuede(r, c.clave) ? 'checked' : ''}></td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="rolpermok">Guardar permisos</button></div></div>`);
  $('rolpermok').onclick = async ev => {
    ev.target.disabled = true;
    let fallo = false;
    for (const r of roles) {
      const lista = [...$('rolperm').querySelectorAll(`[data-prol="${CSS.escape(r)}"]:checked`)].map(x => x.dataset.pcap);
      const { data: x, error } = await db.rpc('guardar_permisos_rol', { p_rol: r, p_permisos: lista });
      if (error || (x && x.ok === false)) fallo = true;
    }
    ev.target.disabled = false;
    await cargarRoles();
    const { data: yo } = await db.from('perfiles').select('capacidades').eq('id', PERFIL.id).single();
    if (yo && Array.isArray(yo.capacidades)) PERFIL.capacidades = yo.capacidades;
    toast(fallo ? 'No se han podido guardar todos los permisos' : 'Permisos guardados', fallo);
  };
}

// pintarPrefsPerfil pone la tarjeta de la persona después: va a su sitio dentro de la tarjeta única
async function pintarPrefsPerfil(...a) {
  const p = pintarPrefsPerfilBase.apply(this, a);
  const mp = $('miperfil'), row = document.querySelector('#cfgcuerpo .perfunorow');
  if (mp && row && mp.parentElement !== row) { mp.classList.remove('card', 'cfgpanel'); mp.classList.add('perfparte'); row.prepend(mp); }
  return p;
}
