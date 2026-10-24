/* ============================================================
   DLC OS 2.0 · v2.25.0 · Rutas y Agenda, bloque 2:
   horario de atención en la planificación, reprogramación de lo
   no visitado y semana en cuadrícula
   ============================================================ */

/* ---------------- horarios de atención ---------------- */

const LETRA_DIA = f => 'DLMXJVS'[new Date(f + 'T12:00:00').getDay()];
const txtMin = m => hm(m);

const txtVentanas = v => v && v.length ? v.map(([a, b]) => `${txtMin(a)}–${txtMin(b)}`).join(' y ') : '';




/* ---------------- plan de ruta con horarios ---------------- */

async function construirPlan(conXY, rutaId, btn, opts) {
  opts = opts || {};
  ULTIMO_PLAN = { conXY, rutaId, opts };
  HOR = opts.horario !== undefined ? opts.horario : horDeRuta(rutaId);
  const cfg = PLANCFG(), sal = salidaUsuario();
  const fecha = opts.manana ? siguienteLaborable() : hoyISO();
  const ahora = new Date(), minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const salidaCfg = minHora(cfg.salida), tope = minHora(cfg.tope);
  const t0 = opts.manana ? salidaCfg : Math.max(salidaCfg, Math.ceil(minAhora / 5) * 5);

  if (t0 >= tope) {
    const esRuta = !!(RUTAS || []).find(x => x.id === rutaId);
    const op = await elegirOpcion('Ya ha pasado la hora de vuelta de esta ruta',
      `Esta ruta sale a las ${cfg.salida} y vuelve como tarde a las ${cfg.tope}, y ahora son las ${hm(minAhora)}.\n\nPuedes planificarla para el ${fechaLarga(new Date(siguienteLaborable() + 'T00:00:00'))}${esRuta ? ' o cambiar el horario de la ruta' : ''}.`,
      [{ k: 'no', t: 'Cancelar', cls: 'sec' }].concat(esRuta ? [{ k: 'horario', t: 'Cambiar el horario de la ruta', cls: 'sec' }] : []).concat([{ k: 'manana', t: 'Planificar para mañana' }]));
    if (op === 'horario') editorRuta(rutaId);
    if (op === 'manana') construirPlan(conXY, rutaId, btn, { manana: true });
    return;
  }

  const todos = await conHorarios(conXY);
  // Médicos con una cita ya planificada (desde hoy): no se proponen; se muestran aparte como «ya citados»
  const citas = await citasPlanificadasMias();
  const citados = todos.filter(m => citas[m.id]).map(m => ({ m, fecha: citas[m.id] }));
  const meds = todos.filter(m => !citas[m.id]);
  const items = meds.map(m => ({ id: m.id, ref: m, xy: m.lat != null && m.lon != null ? [+m.lat, +m.lon] : null,
    ventanas: ventanasDe(m.dias, fecha), fija: null }));
  const { seq, fuera, fin } = programarVisitas(items, t0);

  // Todos los médicos de la ruta ya tienen cita: se dice así y se ofrece ir a la agenda
  if (!meds.length && citados.length) {
    const op = await elegirOpcion('Ya están todos citados',
      `${citados.length === 1 ? `${TT('medico', 's', 'el', 'C', 'l')} de esta ruta ya tiene` : `Los ${citados.length} ${TT('medico', 'p', '', 'l', 'l')} de esta ruta ya tienen`} una cita planificada en tu agenda.`,
      [{ k: 'no', t: 'Cerrar', cls: 'sec' }, { k: 'agenda', t: 'Ver mi agenda' }]);
    if (op === 'agenda') { AG_MODO = 'semana'; AG_FECHA = citados.map(x => x.fecha).sort()[0]; ir('agenda'); }
    return;
  }
  if (!seq.length) {
    const noDia = fuera.filter(f => f.motivo === 'no atiende este día').length;
    const op = await elegirOpcion(`No cabe ${TT('visita', 's', 'ningun', 'l', 'l')}`,
      (noDia === fuera.length ? `Ninguno de estos ${fuera.length} ${TT('medico', 'p', '', 'l', 'l')} atiende el ${fechaLarga(new Date(fecha + 'T00:00:00'))}.`
        : cfg.conTope ? `Con el horario de la ruta (${cfg.salida}–${cfg.tope}) y las horas de atención no da tiempo a ${TT('visita', 's', 'ningun', 'l', 'l')}.`
        : `Con las horas de atención no da tiempo a ${TT('visita', 's', 'ningun', 'l', 'l')}.`)
        + (citados.length ? `\n\nAdemás, ${citados.length} ${citados.length === 1 ? 'ya tiene' : 'ya tienen'} una cita planificada y no se proponen.` : ''),
      [{ k: 'no', t: 'Cancelar', cls: 'sec' }].concat(cfg.conTope && (RUTAS || []).find(x => x.id === rutaId) ? [{ k: 'horario', t: 'Cambiar el horario de la ruta', cls: 'sec' }] : [])
        .concat(opts.manana ? [] : [{ k: 'manana', t: 'Probar para mañana' }]));
    if (op === 'horario') editorRuta(rutaId);
    if (op === 'manana') construirPlan(conXY, rutaId, btn, { manana: true });
    return;
  }

  // Visitas seguidas en el mismo sitio forman una parada
  const paradas = [];
  seq.forEach(s => {
    const m = Object.assign({}, s.it.ref, { horaPlan: s.ini, ventanas: s.it.ventanas });
    const ult = paradas[paradas.length - 1];
    if (ult && ult.xy[0] === s.it.xy[0] && ult.xy[1] === s.it.xy[1]) { ult.medicos.push(m); ult.fin = s.fin; }
    else paradas.push({ centro: m.centro_nombre || consultaPrivada(), municipio: m.municipio, dir: m.direccion,
      xy: s.it.xy, medicos: [m], llegada: s.ini, fin: s.fin });
  });
  PLAN = { rutaId, salida: sal, paradas, fin, fecha, inicio: t0, fuera: fuera.map(f => ({ m: f.it.ref, motivo: f.motivo })), citados, horario: HOR };
  if (TAB !== 'rutas') ir('rutas');
  pintarPlan();
  setTimeout(() => $('rplan') && $('rplan').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}


/* ---------------- Tu día: horas estimadas respetando las consultas ---------------- */

let TD_INFO = {};

function estimarDia(citas, fecha) {
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


