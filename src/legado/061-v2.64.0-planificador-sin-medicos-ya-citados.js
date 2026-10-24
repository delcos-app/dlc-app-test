/* ============================================================
   v2.64.0 · Planificador: sin médicos ya citados y dentro de tu
   hora de vuelta · Agenda: «Empezar ruta» y «Ruta completa»
   ============================================================ */

// El plan muestra aparte a los médicos que ya tienen cita
pintarPlan = (orig => function (...a) {
  const r = orig.apply(this, a);
  const box = $('rplan');
  if (box && PLAN && PLAN.citados && PLAN.citados.length && !box.querySelector('.plancitados')) {
    box.insertAdjacentHTML('beforeend', `<div class="plancitados"><h3>Ya citados · ${PLAN.citados.length}</h3>
      <p class="sm">No se proponen en este plan porque ya tienen una cita planificada en tu agenda.</p>
      <div class="lista">${PLAN.citados.map(x => `<div class="item" style="cursor:default"><span class="ic">📅</span><span class="txt"><b>${esc(x.m.nombre)}</b>
        <span class="sm">Cita el ${esc(fechaLarga(new Date(x.fecha + 'T12:00:00')))}${x.m.municipio ? ' · ' + esc(x.m.municipio) : ''}</span></span></div>`).join('')}</div></div>`);
  }
  return r;
})(pintarPlan);



