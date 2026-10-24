/* ============================================================
   v2.353.0 · Portal del profesional: la actividad del periodo, de un vistazo (Eric, 22/10/2026). Al entrar el periodo es «Esta semana».
   Con alguna solicitud completada: «Esta semana se han activado 2 …», escueto. Sin ninguna: lo dice y ofrece «Material y dudas».
   Solo cuenta lo completado (SQL 177): nunca se enseña nada que no lo esté.
   ============================================================ */
const PM_PER_TXT = { hoy: 'Hoy', ayer: 'Ayer', semana: 'Esta semana', '7d': 'En los últimos 7 días', mes: 'Este mes', mesant: 'El mes pasado',
  tri: 'Este trimestre', triant: 'El trimestre pasado', anio: 'Este año', anioant: 'El año pasado', todo: 'En total', pers: 'En estas fechas' };
function pmActividad(d) {
  const sel = document.querySelector('#mdper [data-per]'), cuando = PM_PER_TXT[sel ? sel.value : 'semana'] || 'En este periodo';
  const n = +d.pautas || 0, t = terminoDe('pauta');
  if (n > 0) return `<div class="banda-ok pmact" id="pmact"><b>${cuando} se ${n === 1 ? 'ha' : 'han'} activado ${num(n)} ${esc(n === 1 ? t.s : t.p)}</b></div>`;
  return `<div class="banda-info pmact" id="pmact"><b>${cuando} no se ha activado ${t.g === 'f' ? 'ninguna' : 'ningún'} ${esc(t.s)}.</b>
    ¿Necesitas material, información o resolver alguna duda? Escríbenos y te ayudamos.
    <button type="button" class="btn sec chico" data-pmir="mat">Material y dudas</button></div>`;
}

