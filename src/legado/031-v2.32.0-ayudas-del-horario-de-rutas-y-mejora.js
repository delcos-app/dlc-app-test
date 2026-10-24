/* ============================================================
   DLC OS 2.0 · v2.32.0 · Ayudas del horario de rutas y mejoras en móvil
   (mapa con botón de cerrar, «Cerca de mí» paginado, panel lateral
   por encima del mapa y ventanas mejor ajustadas)
   ============================================================ */

/* ---------------- horario de rutas con explicaciones ---------------- */


/* ---------------- mapa del directorio: botón de cerrar siempre visible ---------------- */

(function () {
  const w = $('mapawrap');
  if (w && !$('mapacerrar')) {
    w.style.position = 'relative';
    w.insertAdjacentHTML('afterbegin', '<button class="mapacerrar" id="mapacerrar" aria-label="Cerrar el mapa">✕ Cerrar mapa</button>');
    $('mapacerrar').onclick = () => { if (MODO_MAPA) $('mapaBtn').click(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  }
})();

/* ---------------- «Cerca de mí» con paginación ---------------- */



