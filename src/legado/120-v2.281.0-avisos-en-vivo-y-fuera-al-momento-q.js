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
// Se engancha en cuanto hay perfil (al arrancar llega un momento después)
(function engancharVivo() { if (PERFIL && PERFIL.id) { avisosEnVivo(); comprobarAcceso(true); } else setTimeout(engancharVivo, 1000); })();




