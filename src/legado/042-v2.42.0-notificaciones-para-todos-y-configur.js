/* ============================================================
   v2.42.0 · Notificaciones para todos y configurables, Mi perfil,
   Rutas y Mensajes como apartados propios, Material de visita y
   Almacenes explicados, controles compactos en Configuración,
   navegación de Configuración sin desplazarse y alta con resumen
   ============================================================ */

/* ---------------- notificaciones ---------------- */

const TIPOS_NOTIF = [
  ['pauta', '💊', 'Pautas registradas', 'Cada vez que se registra, se corrige o se anula una pauta'],
  ['venta_cartera', '🛒', 'Pedidos de mi cartera', `Cuando se confirma un pedido de ${TT('medico', 's', 'un', 'l', 'l')} que llevas`],
  ['cartera', '🩺', 'Cambios en mi cartera', `Cuando te asignan ${TT('medico', 'p', '', 'l', 'l', 'nuevo')}`],
  ['cruce', '🔁', `${TT('visita', 'p', '', 'l', 'C')} de otros a mi cartera`, `Cuando otra persona ${TT('visita', 's', '', 'l', 'l')} a ${TT('medico', 's', 'un', 'l', 'l')} que llevas`],
  ['pedido_validado', '📦', 'Pedidos confirmados', 'Cada pedido que se confirma (menos los tuyos)']
];
pintarAvisos = refrescarCampana;
// (v2.183.0: aquí iba la primera versión de panelNotificaciones; se redefine entera más abajo)

// v2.242.0: aquí iba panelNotificacionesPaso1 (nadie la usaba)

// v2.242.0: aquí iba panelNotificacionesPaso2 (nadie la usaba)

// v2.242.0: aquí iba panelNotificacionesBase (nadie la usaba)
setInterval(refrescarCampana, 30000);   // v2.281.0: cada 30 s (además, en vivo con el SQL 150)

function pintarNotif() {
  const pref = (PERFIL.preferencias || {}).notif || {}, tipos = tiposDeMiRol();
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel"><h2>Notificaciones</h2>
    <p class="sm">Te llegan a la campana 🔔 de arriba. Elige cuáles quieres recibir.</p>
    ${tipos.length ? `<div class="notcfg">${tipos.map(([k, ic, t, d]) => `<label class="vfswitch"><input type="checkbox" data-nt="${k}" ${pref[k] === false ? '' : 'checked'}><span class="sw"></span>
      <span><b>${ic} ${esc(t)}</b><br><span class="sm">${esc(d)}</span></span></label>`).join('')}</div>` : '<div class="vacio">Tu perfil no tiene notificaciones disponibles todavía.</div>'}</div>`;
  $('cfgcuerpo').querySelectorAll('[data-nt]').forEach(c => c.onchange = async () => {
    const notif = Object.assign({}, (PERFIL.preferencias || {}).notif || {}, { [c.dataset.nt]: c.checked });
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { notif });
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    if (error) { toast('No se ha podido guardar', true); c.checked = !c.checked; return; }
    PERFIL.preferencias = data || prefs; toast(c.checked ? 'Activada' : 'Desactivada');
  });
}

/* ---------------- Mi perfil ---------------- */






// Al entrar, se abre el módulo elegido

/* ---------------- Rutas y desplazamientos ---------------- */


/* ---------------- Material de visita ---------------- */


/* ---------------- Almacenes ---------------- */


/* ---------------- Configuración: apartados y navegación ---------------- */


/* ---------------- alta de usuario: resumen al terminar ---------------- */



