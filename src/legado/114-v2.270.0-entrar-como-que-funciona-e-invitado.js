/* ============================================================
   v2.270.0 · «Entrar como» que funciona e invitados en Usuarios (aviso de Eric, 12/10/2026; necesita el SQL 145 y la función de
   Supabase «impersonar» nueva).
   - «Entrar como» fallaba: la función antigua solo dejaba entrar al rol «Administrador». Ahora comprueba la base (suplantar_preparar)
     y, si algo no deja, la app dice por qué (y lo anota en el registro de errores si es un fallo).
   - Invitados: profesionales y centros con acceso a su portal. En Usuarios van en su propio grupo, con su ficha, cuándo entraron por
     última vez y qué ven; «Ver lo que ve» abre la plataforma como esa persona (con cualquier plan: solo ve su portal).
   ============================================================ */
const esInvitado = u => !!u && (rolPuede(u.rol, 'portal_prescriptor') || rolPuede(u.rol, 'portal_centro'));
function puedeVerComo(u) {
  return !!(PERFIL && u && (puede('administrar') || ((PERFIL.areas || {}).U || 0) >= 3) && !suplantando() && u.id !== PERFIL.id && u.activo
    && !rolPuede(u.rol, 'administrar') && (PLAN_ACTUAL.plan === 'medida' || esInvitado(u)));
}
const queVeInvitado = u => rolPuede(u.rol, 'portal_centro')
  ? 'Pide la reposición de los productos que le des de alta, pide material y escribe a su comercial.'
  : `Ve su portal (cifras agregadas de ${TT('pauta', 'p', '', 'l', 'l')}, sin importes ni datos de ${TT('paciente', 'p', '', 'l', 'l')}), pide material y escribe sus dudas.`;
const SUPL_ERR = {
  administrador: 'No se puede impersonalizar a un usuario que administra',
  permiso: 'No tienes permiso para impersonalizar usuarios',
  inactivo: 'Esa persona está desactivada: actívala antes',
  propio: 'Ya estás en tu propia sesión',
  otra: 'Esa persona es de otra empresa',
  no_encontrado: 'No se encuentra a esa persona (o no tiene correo)',
  plan: 'Impersonalizar a usuarios del equipo es del plan A medida (a los invitados, con cualquier plan)',
  sesion: 'Tu sesión ha caducado: vuelve a entrar y prueba otra vez',
};

// (R-12: entrarComo se definía aquí otra vez; ahora está en su sitio, más arriba)

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




