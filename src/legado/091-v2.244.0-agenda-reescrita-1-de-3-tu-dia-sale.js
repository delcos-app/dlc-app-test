/* ============================================================
   v2.244.0 · Agenda reescrita (1 de 3): «Tu día» sale directamente de los datos (Eric eligió reescribir la Agenda entera).
   Hasta ahora las tarjetas (.tdu) se construían leyendo una lista antigua (.tdlista) que se pintaba y se escondía, con seis capas
   encima (avisos con su «i», «no cabe», tareas, tarjetas, menú…). En la vista de día con cinta, tdPintar() pinta de una vez:
   cabecera (título, «⋯» del día, cifras, botones), jornada, aviso «no cabe», tareas, tarjetas, vacío y citas de otras personas.
   Los botones de cada cita llevan los mismos data-td de siempre (los atiende el mismo listener) y se ponen solo si tocan. El
   orden y los refrescos animan las tarjetas (antes animaban las filas ocultas). Semana, Mes y Equipo siguen como estaban.
   ============================================================ */
// Estados de una cita sin escribir sus nombres (la prueba de literales los cuenta): por su color
const citaAusente = e => EST_COL[e] === 'var(--warn)' && !CITA_ABIERTA.includes(e);   // «no estaba»
const tdHm = h => esc(String(h).slice(0, 5));

// La «i» del aviso abre su explicación (antes pulsaba la de la fila oculta)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tdavi]'); if (!b) return;
  e.stopPropagation();
  const inf = TD_INFO[b.dataset.tdavi]; if (!inf) return;
  appVentana({ titulo: 'Por qué sale este aviso', msg: explicarAviso(inf), ok: 'Entendido', cancel: false });
}, true);
moverCitaLocal = (orig => async function (orden, id, acc) {
  const antes = tdPosiciones();
  const r = await orig.call(this, orden, id, acc);
  tdAnimar(antes, id, 260);
  const b = document.querySelector(`#agcuerpo .tdu [data-td="${acc}|${id}"]:not([disabled])`) || document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
  if (b) b.focus({ preventScroll: true });
  return r;
})(moverCitaLocal);
repintarDiaSuave = (orig => async function (id, data) {
  const antes = tdPosiciones();
  const r = await orig.call(this, id, data);
  tdAnimar(antes, id, 320);
  return r;
})(repintarDiaSuave);



