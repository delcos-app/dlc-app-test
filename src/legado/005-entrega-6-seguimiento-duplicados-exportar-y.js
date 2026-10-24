/* ============================================================
   DLC OS 2.0 · Entrega 6: seguimiento, duplicados, exportar y contraseñas
   ============================================================ */

let SEG = { estado: '', prov: '', muni: '', modo: 'todos', pagina: 0 };
let DUPS = null, PARES = null;

/* ---------------- seguimiento ---------------- */

/* cargarSeguimiento: la parte base y, en orden, cada paso que se le añade (antes eran 2 capas separadas). */
async function cargarSeguimiento() {
  await cargarSeguimientoBase();
  await cargarSeguimientoPaso1();
  await cargarSeguimientoPaso2();
}

async function cargarSeguimientoPaso1() {
  const v = $('v-seguimiento');
  v.querySelector('.saludo h1').firstChild.textContent = 'Calidad del dato';
  v.querySelector('.saludo .fecha').textContent = `Fichas completas, datos que faltan y avance de cada ${TT('medico', 's', '', 'l', 'l')}`;
  const { data: q } = await RPC_ORIG('calidad_datos', {});
  if (!q || $('calidad')) return;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const item = (n, t, h) => `<div class="kpi ${n ? 'warn' : 'ok'}"><button class="ai" data-ayuda-txt="${esc(h)}" data-ayuda-tit="${esc(t)}" aria-label="Qué es">i</button><b>${num(n)}</b><span>${esc(t)}</span></div>`;
  v.querySelector('.saludo').insertAdjacentHTML('afterend', `<div class="card" id="calidad" style="padding-bottom:6px">
    <div class="manh" style="padding:14px 16px 0"><h2 style="padding:0">Fichas completas: ${pct(q.completas, q.total)}%</h2><span class="sm">${num(q.completas)} de ${num(q.total)} ${TT('medico', 'p', '', 'l', 'l')}</span></div>
    <div class="barra" style="margin:8px 16px 10px"><i style="width:${pct(q.completas, q.total)}%"></i></div>
    <div class="kpis" style="padding:0 16px 10px">
      ${item(q.sin_ubicacion, 'sin ubicación', `Sin coordenadas en ${TT('consulta', 's', 'ningun', 'l', 'l')}: no entran en rutas ni en el mapa.`)}
      ${item(q.sin_horario, 'sin horario de atención', 'Sin días ni horas de atención: las rutas no pueden ajustarse a su horario.')}
      ${item(q.sin_especialidad, 'sin ' + TT('especialidad', 's', '', 'l', 'l'), `Sin ${TT('especialidad', 's', '', 'l', 'l')} en la ficha: no se pueden filtrar ni analizar por ${TT('especialidad', 's', '', 'l', 'l')}.`)}
      ${item(q.sin_contacto, 'sin teléfono ni email', `No hay forma de contactar con ellos fuera ${TT('visita', 's', 'del', 'l', 'l')}.`)}
      ${item(q.sin_provincia, 'sin provincia', 'Sin provincia no se pueden asignar por zona a un comercial.')}
      ${item(q.sin_comercial, 'sin comercial', `${TT('medico', 'p', '', 'l', 'C')} que no están en ninguna cartera.`)}
      ${item(q.duplicados, 'pendientes de unificar', 'Fichas marcadas como posibles duplicados.')}
    </div>
    <p class="sm" style="padding:0 16px 10px">Una ficha completa tiene ubicación, horario, ${TT('especialidad', 's', '', 'l', 'l')} y teléfono o email. Debajo, el avance de cada ${TT('medico', 's', '', 'l', 'l')}.</p></div>`);
}




/* ---------------- exportar ---------------- */



/* ---------------- duplicados ---------------- */



const CAMPOS_UNI = [['nombre', 'Nombre'], ['especialidad', TT('especialidad', 's', '', 'l', 'C')], ['area', 'Área'],
  ['telefono', 'Teléfono'], ['email', 'Email'], ['contacto', 'Contacto'], ['nota', 'Nota'],
  ['estado_comercial', 'Estado comercial']];


/* ---------------- contraseñas ---------------- */

$('lform').insertAdjacentHTML('beforeend',
  '<button type="button" id="lolv" style="border:0;background:none;color:var(--navy);font-weight:600;cursor:pointer;margin-top:10px;font-size:13.5px">He olvidado la contraseña</button>');

$('lolv').onclick = async () => {
  const email = $('lu').value.trim();
  if (!email) { $('lmsg').textContent = 'Escribe primero tu correo.'; return; }
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  $('lmsg').style.color = error ? 'var(--dang)' : 'var(--ok)';
  $('lmsg').textContent = error ? 'No se ha podido enviar: ' + error.message
    : 'Te hemos enviado un correo para crear una contraseña nueva.';
};

/* Si el usuario llega desde el correo de recuperación, pedimos la contraseña nueva. */
db.auth.onAuthStateChange(async (evento) => {
  if (evento !== 'PASSWORD_RECOVERY') return;
  // Nunca con la plataforma de fondo: pantalla limpia solo con la contraseña nueva
  if (typeof pantallaRecuperacion === 'function') { pantallaRecuperacion(); return; }
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Nueva contraseña</h2><div class="sm">Elige una de al menos 8 caracteres</div></div></div>
    <label for="np1">Contraseña</label><input id="np1" type="password">
    <label for="np2">Repítela</label><input id="np2" type="password">
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="npok">Guardar</button></div>`;
  $('dlg').showModal();
  $('npok').onclick = async ev => {
    if ($('np1').value.length < 8 || $('np1').value !== $('np2').value) { toast('Revisa las contraseñas', true); return; }
    ev.target.disabled = true;
    const { error } = await db.auth.updateUser({ password: $('np1').value });
    ev.target.disabled = false;
    if (error) { toast('No se ha podido cambiar: ' + error.message, true); return; }
    $('dlg').close(); toast('Contraseña actualizada'); arrancar();
  };
});

/* Cambiar la contraseña desde el menú de usuario */
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-u="pass"]')) return;
  const p1 = await pedirTexto('Escribe la contraseña nueva (mínimo 8 caracteres)', '', { titulo: 'Cambiar contraseña', tipo: 'password', ok: 'Guardar' });
  if (!p1) return;
  if (p1.length < 8) { toast('Demasiado corta', true); return; }
  const { error } = await db.auth.updateUser({ password: p1 });
  toast(error ? 'No se ha podido: ' + error.message : 'Contraseña actualizada', !!error);
});



