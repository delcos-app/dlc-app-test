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

function pintarCerca() {
  const l = CERCA.lista, tam = tamPagina(), pag = CERCA.pagina || 0;
  const vista = l.slice(pag * tam, pag * tam + tam);
  $('thead').innerHTML = '';
  $('cuenta').innerHTML = `<b>${num(l.length)}</b> ${TT('medico', l.length === 1 ? 's' : 'p', '', 'l', 'l')} a menos de 10 km de ti
    <button class="kcfg" id="cercacerrar" style="margin-left:10px">Volver a la búsqueda</button>`;
  $('lista').innerHTML = vista.length ? vista.map(m => `<button class="trow" data-id="${m.id}" style="padding:10px 14px;gap:12px">
      <span class="tcell cercakm"><b style="color:var(--navy)">${String(m.km).replace('.', ',')} km</b></span>
      <span class="tcell" style="flex:1;width:auto">
        <span class="nm">${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</span>
        <span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro_nombre || '')} ${esc(m.municipio || '')}</span></span>
      <span class="tcell cercaest"><span class="pill p-est">${esc(m.estado_comercial)}</span></span>
    </button>`).join('') : `<div class="vacio">No hay ${TT('medico', 'p', '', 'l', 'l')} con ubicación a menos de 10 km.</div>`;
  $('dirpag').classList.remove('hide');
  paginador($('dirpag'), l.length, pag, p => { CERCA.pagina = p; pintarCerca(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    () => { CERCA.pagina = 0; pintarCerca(); });
  $('cercacerrar').onclick = () => { CERCA = null; buscar(true); };
}


