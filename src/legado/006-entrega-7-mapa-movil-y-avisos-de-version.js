/* ============================================================
   DLC OS 2.0 · Entrega 7: mapa, móvil y avisos de versión
   ============================================================ */

let MODO_MAPA = false, CAPA_RUTA = null;

/* ---------------- barra inferior en móvil ---------------- */

$('bnav').addEventListener('click', e => {
  const b = e.target.closest('[data-t]');
  if (b) ir(b.dataset.t);
});


/* ---------------- mapa ---------------- */

$('mapaBtn').addEventListener('click', () => {
  MODO_MAPA = !MODO_MAPA;
  $('mapaBtn').textContent = MODO_MAPA ? 'Ver lista' : 'Ver mapa';
  $('mapawrap').classList.toggle('hide', !MODO_MAPA);
  $('lista').classList.toggle('hide', MODO_MAPA);
  $('dirpag').classList.toggle('hide', MODO_MAPA);
  if (MODO_MAPA) pintarMapa();
});




/* ---------------- el plan del día, dibujado ---------------- */


/* ---------------- aviso de versión nueva ---------------- */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return;
    reg.addEventListener('updatefound', () => {
      const nuevo = reg.installing;
      if (!nuevo) return;
      nuevo.addEventListener('statechange', () => {
        if (nuevo.state === 'installed' && navigator.serviceWorker.controller) $('nuevaver').classList.remove('hide');
      });
    });
    setInterval(() => reg.update().catch(() => {}), 15 * 60 * 1000);
  });
  $('actualizar').onclick = () => location.reload(true);
}



