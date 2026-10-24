// nucleo/notificaciones.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function refrescarCampana() {
  if (!PERFIL || document.body.classList.contains('sin-sesion')) return;
  const { data } = await RPC_ORIG('mis_notificaciones', { lim: 30 });
  const d = data || {}; NOTIF_N = d.sin_leer || 0;
  let b = $('mdavisos');
  if (!b) { const u = $('ubtn'); if (!u) return; u.insertAdjacentHTML('beforebegin', '<button class="mdavisos" id="mdavisos" aria-label="Notificaciones"></button>'); b = $('mdavisos'); }
  b.innerHTML = `🔔${NOTIF_N ? `<span class="nb2">${NOTIF_N > 9 ? '9+' : NOTIF_N}</span>` : ''}`;
  b.onclick = () => panelNotificaciones(d.lista || []);
}
