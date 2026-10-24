/* ============================================================
   v2.335.0 · Última conexión (petición de Eric, 20/10/2026; SQL 174): en la tarjeta de cada usuario, en su detalle, en los invitados
   y en «Acceso a la plataforma» de la ficha. Es lo más reciente entre el último inicio de sesión y la última renovación de su
   sesión (la app la renueva sola mientras está abierta). Sin el SQL 174, el último inicio de sesión. Solo la ve la administración.
   ============================================================ */
var USR_ACC = null;
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
async function facccon(uid) {
  if (!puede('administrar')) return;   // la información de sesión, solo para la administración (Eric)
  const { data } = await RPC_ORIG('ultimas_conexiones', { p_ids: [uid] });
  const el = document.querySelector(`[data-facccon="${uid}"]`); if (!el) return;
  const a = (data || []).find(x => x.id === uid);
  el.textContent = a ? conexionTxt(a, true) : '';
}


