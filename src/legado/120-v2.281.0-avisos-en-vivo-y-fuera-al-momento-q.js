/* ============================================================
   v2.281.0 · Avisos en vivo y fuera al momento quien ya no tiene acceso (peticiones de Eric, 12/10/2026; SQL 150).
   - En vivo (Supabase Realtime): una notificación nueva para mí, un mensaje o una petición de material que puedo ver → la campana,
     el portal del profesional («Material y dudas») o la ficha abierta (bloque «Portal») se ponen al día sin recargar. Si el canal no
     funciona, la campana se mira cada 30 s (antes 60) y al volver a la pestaña.
   - Quien ya no tiene acceso (usuario borrado o desactivado) sale al momento a la pantalla de entrar con «Tu acceso a la plataforma
     se ha retirado»: se comprueba su perfil cada 15 s con la pestaña a la vista, al volver a ella y al cambiar de pantalla.
   ============================================================ */
// ——— Fuera al momento ———
let ACCESO_MIRADO = 0, ACCESO_FUERA = false;
async function comprobarAcceso(forzar) {
  if (ACCESO_FUERA || !PERFIL || !PERFIL.id || document.body.classList.contains('sin-sesion') || !navigator.onLine) return;
  if (!forzar && Date.now() - ACCESO_MIRADO < 3000) return;
  ACCESO_MIRADO = Date.now();
  const { data, error } = await db.from('perfiles').select('id, activo').eq('id', PERFIL.id).maybeSingle();
  if (error) return;                       // sin red o fallo puntual: no se echa a nadie
  if (data && data.activo) return;
  ACCESO_FUERA = true;
  try { sessionStorage.setItem('delcos-fuera', '1'); } catch (e) {}
  try { localStorage.removeItem(PKEY); localStorage.removeItem('dlc-os-sesion'); } catch (e) {}
  try { limpiarDatosLocales(); } catch (e) {}
  try { await db.auth.signOut(); } catch (e) {}
  location.reload();
}
setInterval(() => { if (document.visibilityState === 'visible') comprobarAcceso(); }, 15000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { comprobarAcceso(true); refrescarCampana(); } });
addEventListener('focus', () => comprobarAcceso());
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('nav.main [data-t], #bnav [data-t], #bmas [data-bm], .mllab, [data-u]')) comprobarAcceso(); }, true);   // al cambiar de pantalla desde el menú
// En la pantalla de entrar, el motivo
(function avisoFuera() {
  let fuera = null; try { fuera = sessionStorage.getItem('delcos-fuera'); } catch (e) {}
  if (!fuera) return;
  const poner = () => {
    const l = $('login'), m = $('lmsg');
    if (!l || l.classList.contains('hide') || !m) return false;
    m.textContent = 'Tu acceso a la plataforma se ha retirado. Si crees que es un error, habla con quien administra tu empresa.';
    m.classList.add('err'); try { sessionStorage.removeItem('delcos-fuera'); } catch (e) {}
    return true;
  };
  if (!poner()) { let n = 0; const t = setInterval(() => { if (poner() || ++n > 60) clearInterval(t); }, 250); }
})();

// ——— En vivo ———
let VIVO = null;
function avisosEnVivo() {
  if (VIVO || !PERFIL || !PERFIL.id || typeof db.channel !== 'function') return;
  if (['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname)) return;   // la copia local de pruebas no tiene servidor en vivo
  try {
    let espera = null;
    const alDia = (que) => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        refrescarCampana();
        if (ES_MEDICO() && $('v-informe') && TAB === 'informe') { try { if (puede('portal_centro') && typeof centroPintar === 'function') centroPintar(); else portalMedico(); } catch (e) {} }
        if (que !== 'notif' && typeof FICHA_ID !== 'undefined' && FICHA_ID && $('fportal')) { const b = $('fportal'); b.remove(); try { fichaPortal(FICHA_ID); } catch (e) {} }
      }, 400);
    };
    VIVO = db.channel('vivo-' + PERFIL.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: 'usuario_id=eq.' + PERFIL.id }, () => alDia('notif'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes_cuenta' }, () => alDia('msg'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_material' }, () => alDia('mat'))
      .subscribe();
  } catch (e) { VIVO = null; }
}
// Se engancha en cuanto hay perfil (al arrancar llega un momento después)
(function engancharVivo() { if (PERFIL && PERFIL.id) { avisosEnVivo(); comprobarAcceso(true); } else setTimeout(engancharVivo, 1000); })();




