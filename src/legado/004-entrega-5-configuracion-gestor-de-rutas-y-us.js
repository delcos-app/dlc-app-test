/* ============================================================
   DLC OS 2.0 · Entrega 5: configuración, gestor de rutas y usuarios
   ============================================================ */

let CFG_SEC = 'prefs', ADM_SEC = 'usuarios', USUARIOS = [], CATS = [];
const AREAS = [['H', 'Inicio'], ['G', 'Agenda'], ['R', 'Rutas'], ['M', `${TT('medico', 'p', '', 'l', 'C')}`], ['C', 'Centros'], ['S', `${TT('visita', 'p', '', 'l', 'C')}`], ['V', `Ventas y ${TT('paciente', 'p', '', 'l', 'l')}`], ['K', 'Configuración']];
const NIVELES = ['Sin acceso', 'Ver', 'Editar', 'Completo'];
// v2.109.0: los clasificadores son un permiso del rol (antes, administrar o nivel 2 en Configuración)
const puedeCatalogos = () => PERFIL && puede('gestionar_clasificadores');

/* ---------------- configuración ---------------- */


document.addEventListener('click', e => {
  const b = e.target.closest('[data-cs]');
  if (b) { CFG_SEC = b.dataset.cs; cargarConfig(); }
  const a = e.target.closest('[data-as]');
  if (a) { ADM_SEC = a.dataset.as; cargarAdmin(); }
});

const punto = k => (PERFIL.preferencias || {})[k] || null;

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

/* ---------------- gestor de rutas ---------------- */

/* ---------------- clasificadores ---------------- */


/* ---------------- administración de usuarios ---------------- */

async function cargarAdmin() {
  $('v-admin').innerHTML = `
    <div class="saludo"><div><h1>Administración</h1><div class="fecha">Usuarios, permisos, cartera y comisiones</div></div>
      <div class="acts" style="margin:0">${ADM_SEC === 'usuarios' ? '<button class="btn" id="unuevo">+ Nuevo usuario</button>' : ''}</div></div>
    <div class="subnav">
      <button data-as="usuarios" aria-pressed="${ADM_SEC === 'usuarios'}">Usuarios</button>
      <button data-as="comisiones" aria-pressed="${ADM_SEC === 'comisiones'}">Comisiones</button>
      <button data-as="accesos" aria-pressed="${ADM_SEC === 'accesos'}">Accesos</button>
      <button data-as="auditoria" aria-pressed="${ADM_SEC === 'auditoria'}">Auditoría</button></div>
    <div class="card" id="admcuerpo"><div class="skel"></div><div class="skel" style="width:60%"></div></div>`;
  if (ADM_SEC === 'comisiones') { pintarComisiones(); return; }
  if (ADM_SEC === 'accesos') { pintarAccesos(); return; }
  if (ADM_SEC === 'auditoria') { pintarAuditoria(); return; }
  if ($('unuevo')) $('unuevo').onclick = nuevoUsuario;

  const { data, error } = await db.rpc('usuarios_lista');
  if (error) { ($('admcuerpo') || document.createElement('div')).innerHTML = `<div class="vacio">No se ha podido cargar: ${esc(error.message)}</div>`; return; }
  USUARIOS = data || [];
  ($('admcuerpo') || document.createElement('div')).innerHTML = `<h2>Usuarios<span class="n">${USUARIOS.length}</span></h2>
    <div class="lista">${USUARIOS.map(u => `<div class="item" style="cursor:default">
      <span class="ic">${esc(iniciales(u.nombre))}</span>
      <span class="tx"><b>${esc(u.nombre)}${u.activo ? '' : ' <span class="sm">· desactivado</span>'}</b>
        <span class="sm">${esc(u.rol)} · ${esc(u.email || '')} · ${num(u.medicos)} ${TT('medico', 'p', '', 'l', 'l')} · ${num(u.visitas)} ${TT('visita', 'p', '', 'l', 'l')}</span></span>
      <span class="acts" style="margin:0">
        <button class="btn sec" data-uedit="${u.id}">Editar</button>
        <button class="btn sec" data-uver="${u.id}">Ver cartera</button>
        <button class="btn sec" data-ucart="${u.id}">Asignar</button>
        <button class="btn sec" data-upass="${u.id}">Contraseña</button>
        ${puedeVerComo(u) ? `<button class="btn sec" data-ucomo="${u.id}" title="Abrir una sesión con su usuario, sus permisos y sus datos">👤 Impersonalizar</button>` : ''}</span></div>`).join('')}</div>`;

  ($('admcuerpo') || document.createElement('div')).querySelectorAll('[data-uedit]').forEach(b => b.onclick = () => editarUsuario(b.dataset.uedit));
  ($('admcuerpo') || document.createElement('div')).querySelectorAll('[data-ucart]').forEach(b => b.onclick = () => asignarCartera(b.dataset.ucart));
  ($('admcuerpo') || document.createElement('div')).querySelectorAll('[data-uver]').forEach(b => b.onclick = () => verCartera(b.dataset.uver));
  ($('admcuerpo') || document.createElement('div')).querySelectorAll('[data-upass]').forEach(b => b.onclick = () =>
    restablecerPassword(USUARIOS.find(x => x.id === b.dataset.upass) || {}));
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

// Editar usuario · Comisión: desde cuándo se aplica el esquema, y zona de los comerciales
async function usuarioComisionYZona(id) {
  const u = (USUARIOS || []).find(x => x.id === id);
  if (!u || !$('dlg').open) return;
  // Comisión: desde cuándo se aplica el esquema (el selector se pinta un momento después)
  for (let i = 0; i < 30 && !$('ucom') && $('dlg').open; i++) await new Promise(r => setTimeout(r, 100));
  const ucom = $('ucom');
  if (ucom && !$('ucdesde')) {
    ucom.dataset.orig = ucom.value;
    ucom.closest('.g2').insertAdjacentHTML('afterend', `<div class="g2" id="ucdesde">
      <div><label class="sm" for="ucdm">Se aplica</label><select id="ucdm">
        <option value="hoy">A partir de hoy</option><option value="todo">A todo su histórico (hacia atrás)</option><option value="fecha">A partir de una fecha concreta</option></select></div>
      <div><label class="sm" for="ucdf">Fecha</label><input id="ucdf" type="date" value="${hoyISO()}" disabled></div></div>
      <div class="sm" id="uchist"></div>`);
    $('ucdm').onchange = () => { $('ucdf').disabled = $('ucdm').value !== 'fecha'; };
    const { data: h } = await RPC_ORIG('historial_esquemas', { p_usuario: id });
    if ((h || []).length && $('uchist')) $('uchist').innerHTML = 'Historial: ' + h.map(x => `${esc(x.esquema)} desde ${fechaCorta(x.desde)}${x.hasta ? ' hasta ' + fechaCorta(x.hasta) : ''}`).join(' · ');
  }
  // Zona, solo para comerciales. v2.109.0: según el rol elegido en la ventana (si se cambia a uno con cartera, aparece; si no, se oculta)
  if ($('ur') && !$('ur').dataset.zona) {
    $('ur').dataset.zona = '1';
    $('ur').addEventListener('change', () => { const z = $('uzonas'); if (z) z.classList.toggle('hide', !rolPuede($('ur').value, 'cartera')); else usuarioComisionYZona(id); });
  }
  if (rolPuede($('ur') ? $('ur').value : u.rol, 'cartera') && !$('uzonas')) {
    const html = await bloqueZonas(u);
    const ref = $('ucomzona') || $('dbody').querySelector('.acts:last-of-type');
    if (ref && $('dlg').open && !$('uzonas')) ref.insertAdjacentHTML('beforebegin', html);
    if ($('uzonas')) $('uzonas').dataset.orig = zonasMarcadas().join('|');
    $('dbody').querySelectorAll('[data-zcc]').forEach(c => c.onchange = () =>
      $('dbody').querySelectorAll(`[data-zpc="${CSS.escape(c.dataset.zcc)}"]`).forEach(x => x.checked = c.checked));
    if ($('uzok')) $('uzok').onclick = async ev => {
      const zonas = zonasMarcadas();
      ev.target.disabled = true;
      const { data: r, error } = await db.rpc('asignar_zona', { p_usuario: id, p_zonas: zonas });
      ev.target.disabled = false;
      if (error || (r && r.ok === false)) { toast('No se ha podido guardar la zona', true); return; }
      $('uzonas').dataset.orig = zonas.join('|');
      toast(`Zona guardada · ${num(r.asignados)} ${TT('medico', 'p', '', 'l', 'l', 'nuevo')} en su cartera${r.en_otra_cartera ? ` · ${num(r.en_otra_cartera)} de su zona están en otra cartera` : ''}`);
    };
  }
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

// Editar usuario · La comisión se muestra como información: se asigna dentro de cada esquema
async function usuarioComisionInfo(id) {
  for (let i = 0; i < 30 && !$('ucom') && $('dlg').open; i++) await new Promise(r => setTimeout(r, 100));
  const s = $('ucom'); if (!s || $('ucominfo')) return;
  const g = s.closest('.g2') || s.parentElement;
  const txt = s.selectedOptions[0] && s.value ? s.selectedOptions[0].textContent : 'Sin comisión';
  g.classList.add('hide'); if ($('ucdesde')) $('ucdesde').classList.add('hide'); if ($('uchist')) $('uchist').classList.add('hide');
  g.insertAdjacentHTML('afterend', `<div class="avisoh" id="ucominfo"><span>Comisión: <b>${esc(txt)}</b>. Se asigna dentro de cada esquema en Configuración → Equipo → Comisiones.</span></div>`);
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




