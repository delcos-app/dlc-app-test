/* ============================================================
   DLC OS 2.0 · Entrega 5: configuración, gestor de rutas y usuarios
   ============================================================ */

let CFG_SEC = 'prefs', ADM_SEC = 'usuarios', USUARIOS = [], CATS = [];
const AREAS = [['H', 'Inicio'], ['G', 'Agenda'], ['R', 'Rutas'], ['M', `${TT('medico', 'p', '', 'l', 'C')}`], ['C', 'Centros'], ['S', `${TT('visita', 'p', '', 'l', 'C')}`], ['V', `Ventas y ${TT('paciente', 'p', '', 'l', 'l')}`], ['K', 'Configuración']];

/* ---------------- configuración ---------------- */


document.addEventListener('click', e => {
  const b = e.target.closest('[data-cs]');
  if (b) { CFG_SEC = b.dataset.cs; cargarConfig(); }
  const a = e.target.closest('[data-as]');
  if (a) { ADM_SEC = a.dataset.as; cargarAdmin(); }
});

const punto = k => (PERFIL.preferencias || {})[k] || null;





/* ---------------- gestor de rutas ---------------- */

/* ---------------- clasificadores ---------------- */


/* ---------------- administración de usuarios ---------------- */

async function cargarAdminBase() {
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













