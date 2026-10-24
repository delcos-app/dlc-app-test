/* ============================================================
   v2.45.1 · Recuperar contraseña en una pantalla limpia: la
   plataforma no se abre con la sesión del enlace; al guardar se
   cierra la sesión y se vuelve al acceso
   ============================================================ */

let RECUPERANDO = RECUPERACION_URL;
function pantallaRecuperacion() {
  RECUPERANDO = true;
  document.documentElement.classList.add('recuperando');
  ['dlg', 'dlg2', 'ficha', 'mini'].forEach(id => { const d = $(id); if (d && d.open) try { d.close(); } catch (e) {} });
  if ($('recupera')) return;
  document.body.insertAdjacentHTML('beforeend', `<section id="recupera"><form class="lbox" id="rform" autocomplete="off">
      <img src="${esc(MARCA.logo || 'logo-app.png')}" alt="">
      ${INVITACION_URL ? `<h1>Te damos la bienvenida</h1><p class="sm">Tu empresa ya está en delcos. Crea tu contraseña (al menos 8 caracteres) para entrar.</p>`
        : `<h1>Nueva contraseña</h1><p class="sm">Elige una contraseña de al menos 8 caracteres.</p>`}
      <label for="rp1">Contraseña nueva</label><input id="rp1" type="password" autocomplete="new-password" required>
      <label for="rp2">Repítela</label><input id="rp2" type="password" autocomplete="new-password" required>
      <p class="sm" id="rmsg" style="min-height:18px;margin:8px 0 0"></p>
      <button class="btn" id="rok" type="submit" style="width:100%;margin-top:10px">Guardar contraseña</button>
      ${INVITACION_URL ? '' : '<button class="btn sec" id="rcancel" type="button" style="width:100%;margin-top:8px">Cancelar</button>'}</form></section>`);
  const salir = async (params) => {
    try { await db.auth.signOut(); } catch (e) {}
    try { limpiarDatosLocales(); localStorage.removeItem('dlc-os-sesion'); } catch (e) {}
    location.replace(location.origin + location.pathname + (params || ''));
  };
  $('rform').onsubmit = async e => {
    e.preventDefault();
    const p1 = $('rp1').value, p2 = $('rp2').value, msg = $('rmsg');
    msg.style.color = 'var(--dang)';
    if (p1.length < 8) { msg.textContent = 'Debe tener al menos 8 caracteres.'; return; }
    if (p1 !== p2) { msg.textContent = 'Las dos contraseñas no coinciden.'; return; }
    $('rok').disabled = true; $('rok').textContent = 'Guardando…';
    const { error } = await db.auth.updateUser({ password: p1 });
    if (error) {
      $('rok').disabled = false; $('rok').textContent = 'Guardar contraseña';
      msg.textContent = /same|different/i.test(error.message) ? 'Tiene que ser distinta de la anterior.' : /session|expired|invalid/i.test(error.message)
        ? 'El enlace ha caducado. Pide otro con «He olvidado la contraseña».' : 'No se ha podido cambiar: ' + error.message;
      return;
    }
    // v2.168.0: en la bienvenida se entra directamente (la sesión del enlace ya es suya)
    if (INVITACION_URL) { location.replace(location.origin + location.pathname + '?bienvenida=1'); return; }
    await salir('?clave=cambiada');
  };
  if ($('rcancel')) $('rcancel').onclick = () => salir('');
}
// Con el enlace de recuperación la plataforma no arranca ni se pinta
arrancar = (orig => async function (...a) { if (RECUPERANDO) { pantallaRecuperacion(); return; } return orig.apply(this, a); })(arrancar);
// Avisos en la pantalla de acceso: contraseña cambiada o enlace caducado
(function () {
  const q = new URLSearchParams(location.search);
  const avisar = (t, ok) => { const m = $('lmsg'); if (m) { m.style.color = ok ? 'var(--ok)' : 'var(--dang)'; m.textContent = t; } };
  if (q.get('clave') === 'cambiada') { setTimeout(() => avisar('Contraseña cambiada. Entra con tu contraseña nueva.', true), 300); history.replaceState(null, '', location.pathname); }
  if (ENLACE_CADUCADO) { setTimeout(() => avisar('El enlace ha caducado o ya se ha usado. Pide otro con «He olvidado la contraseña».', false), 300); history.replaceState(null, '', location.pathname); }
})();
if (RECUPERANDO) pantallaRecuperacion();


