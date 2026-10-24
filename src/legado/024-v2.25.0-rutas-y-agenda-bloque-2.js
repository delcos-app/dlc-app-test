/* ============================================================
   DLC OS 2.0 · v2.25.0 · Rutas y Agenda, bloque 2:
   horario de atención en la planificación, reprogramación de lo
   no visitado y semana en cuadrícula
   ============================================================ */

/* ---------------- horarios de atención ---------------- */






/* ---------------- plan de ruta con horarios ---------------- */



/* ---------------- Tu día: horas estimadas respetando las consultas ---------------- */


function estimarDiaBase2(citas, fecha) {
  const h = horDeCitas(citas);
  const r = conHor(h, () => estimarDiaBase(citas, fecha));
  if (!h || !h.vuelta) r.tope = Infinity;   // sin hora de vuelta planificada no hay aviso
  return r;
}
function estimarDiaBase(citas, fecha) {
  const cfg = PLANCFG(), sal = salidaUsuario(), dura = cfg.visita;
  const ahora = new Date(), minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  let t = minHora(cfg.salida);
  if (fecha === hoyISO()) t = Math.max(t, Math.ceil(minAhora / 5) * 5);
  let pos = [sal.lat, sal.lon], primera = true;
  const est = {};
  TD_INFO = {};
  citas.forEach(c => {
    const xy = xyCita(c);
    if (!CITA_ABIERTA.includes(c.estado)) { if (xy) pos = xy; return; }
    const it = { xy, ventanas: ventanasDe(c.dias, fecha), fija: minHora(c.hora) };
    let lleg = t;
    if (primera && !cfg.conSalida) {
      // v2.77.1: sin salida planificada no se sabe a qué hora sales de casa: se llega a la primera cita a su hora
      const ya = fecha === hoyISO() ? Math.ceil(minAhora / 5) * 5 : 0;
      lleg = it.fija != null ? Math.max(it.fija, ya) : t;
      if (xy) pos = xy;
    } else if (xy) { const mismo = !primera && pos[0] === xy[0] && pos[1] === xy[1]; lleg = t + (mismo ? 0 : tdMinutos(pos, xy) + cfg.parada); pos = xy; }
    primera = false;
    let ini = inicioPosible(it, lleg, dura);
    const info = { ventanas: it.ventanas };
    if (ini == null) {
      ini = it.fija != null ? Math.max(lleg, it.fija) : lleg;
      // v2.75.0: el aviso dice por qué, con las horas
      info.aviso = it.fija != null ? `Llegarías hacia las ${hm(lleg)} y la cita es a las ${hm(it.fija)}`
        : it.ventanas && !it.ventanas.length ? 'Ese día no atiende'
        : `Fuera de su horario de atención (${txtVentanas(it.ventanas)})`;
    } else if (ini > lleg + 5 && it.ventanas) info.espera = ini - lleg;
    est[c.id] = ini;
    TD_INFO[c.id] = info;
    t = ini + dura;
  });
  return { est, fin: t + tdMinutos(pos, [sal.lat, sal.lon]), tope: minHora(cfg.tope) };
}


/* ---------------- reprogramar lo no visitado ---------------- */



/* ---------------- semana en cuadrícula ---------------- */


/* ---------------- enganches en la agenda ---------------- */


/* ---------------- ayudas ---------------- */

AYUDA.agenda[2].splice(1, 1,
  `La hora con «~» es una estimación según el orden, tu horario, los desplazamientos y el <b>horario de atención</b> de cada ${TT('medico', 's', '', 'l', 'l')}: si llegas antes de que abra, cuenta la espera. Una hora sin «~» es una hora fijada.`,
  `Si una cita queda fuera del horario de atención ${TT('medico', 's', 'del', 'l', 'l')}, se marca en naranja. <b>Ordenar por cercanía</b> tiene en cuenta esos horarios.`);
AYUDA.agenda[2].push(`Al <b>terminar la jornada</b>, lo no visitado se puede mover de golpe al próximo día que cada ${TT('medico', 's', '', 'l', 'l')} atiende. Lo mismo con los pendientes de días anteriores.`,
  `La vista de <b>semana</b> muestra los siete días en cuadrícula: pulsa un día para verlo, ${TT('medico', 's', 'un', 'l', 'l')} para abrir su ficha o «+» para añadir una cita.`);
AYUDA.rutas[2].splice(1, 1,
  `El plan respeta los <b>días y horas de atención</b> de cada ${TT('medico', 's', '', 'l', 'l')} (los de su ficha): no te lo propone un día que no atiende ni fuera de su horario. Los que no caben aparecen en «Se quedan fuera» con el motivo.`);


