/* ============================================================
   DLC OS 2.0 · v2.32.0 · Ayudas del horario de rutas y mejoras en móvil
   (mapa con botón de cerrar, «Cerca de mí» paginado, panel lateral
   por encima del mapa y ventanas mejor ajustadas)
   ============================================================ */

/* ---------------- horario de rutas con explicaciones ---------------- */

abrirHorarioPlan = (orig => function () {
  orig();
  const ayuda = {
    hsal: `A qué hora sales. La ${TT('visita', 's', 'primer', 'l', 'l')} se calcula desde aquí o desde ahora, si esa hora ya ha pasado.`,
    htop: `Hora de vuelta de la ruta. No se planifican ${TT('visita', 'p', '', 'l', 'l')} que te hagan volver más tarde; si el día se pasa, se marca en naranja.`,
    hvis: `Lo que dura de media cada ${TT('visita', 's', '', 'l', 'l')} con ${TT('medico', 's', 'un', 'l', 'l')}, una vez allí.`,
    hpar: `Tiempo extra cada vez que llegas a un sitio nuevo: aparcar, entrar, esperar en recepción. Si ves a varios ${TT('medico', 'p', '', 'l', 'l')} en el mismo centro, se cuenta una sola vez.`
  };
  Object.entries(ayuda).forEach(([id, t]) => { const i = $(id); if (i && !i.parentElement.querySelector('.ayudah')) i.insertAdjacentHTML('afterend', `<span class="sm ayudah">${esc(t)}</span>`); });
  const fh = $('dbody').querySelector('.fh');
  if (fh && !$('horinfo')) fh.insertAdjacentHTML('afterend', `<p class="sm" id="horinfo">Con estos datos se calculan las horas estimadas de tus rutas, de «Tu día» y del planificador semanal. Los desplazamientos entre ${TT('visita', 'p', '', 'l', 'l')} se estiman por la distancia.</p>`);
})(abrirHorarioPlan);

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



