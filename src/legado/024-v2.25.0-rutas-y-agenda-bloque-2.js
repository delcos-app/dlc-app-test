/* ============================================================
   DLC OS 2.0 · v2.25.0 · Rutas y Agenda, bloque 2:
   horario de atención en la planificación, reprogramación de lo
   no visitado y semana en cuadrícula
   ============================================================ */

/* ---------------- horarios de atención ---------------- */

const LETRA_DIA = f => 'DLMXJVS'[new Date(f + 'T12:00:00').getDay()];
const txtMin = m => hm(m);

/**
 * Franjas de consulta de un médico en una fecha, en minutos.
 * null → no sabemos su horario (sin restricción) · [] → ese día no atiende · [[ini, fin], …]
 */
function ventanasDe(dias, fecha) {
  const d = dias || {};
  if (!Object.keys(d).some(k => d[k])) return null;
  const t = d[LETRA_DIA(fecha)];
  if (!t) return [];
  const out = [];
  String(t).split(/[;,/]| y /i).forEach(parte => {
    const r = /(\d{1,2})(?:[:.h](\d{2}))?\s*[-–a]\s*(\d{1,2})(?:[:.h](\d{2}))?/.exec(parte);
    if (r) out.push([+r[1] * 60 + (+r[2] || 0), +r[3] * 60 + (+r[4] || 0)]);
    else if (/mañana/i.test(parte)) out.push([9 * 60, 14 * 60]);
    else if (/tarde/i.test(parte)) out.push([15 * 60, 20 * 60]);
  });
  return out.length ? out.sort((a, b) => a[0] - b[0]) : [[0, 24 * 60]];
}
const txtVentanas = v => v && v.length ? v.map(([a, b]) => `${txtMin(a)}–${txtMin(b)}`).join(' y ') : '';

/** Primer minuto en que se puede empezar la visita llegando a «llegada», o null si no hay hueco. */
function inicioPosible(it, llegada, dura) {
  if (it.fija != null) return llegada <= it.fija + 10 ? Math.max(llegada, it.fija) : null;
  if (!it.ventanas) return llegada;
  for (const [a, b] of it.ventanas) { const s = Math.max(llegada, a); if (s + dura <= b) return s; }
  return null;
}

/**
 * Ordena visitas respetando franjas de consulta y horas fijadas.
 * items: { id, xy, ventanas, fija, ref }. Devuelve { seq: [{it, llegada, ini, fin}], fuera: [{it, motivo}], fin }
 */
function programarVisitas(items, t0) {
  const cfg = PLANCFG(), sal = salidaUsuario(), tope = minHora(cfg.tope), dura = cfg.visita;
  let pos = [sal.lat, sal.lon], t = t0;
  const seq = [], fuera = [];
  let pend = [];
  items.forEach(it => {
    if (it.ventanas && !it.ventanas.length) fuera.push({ it, motivo: 'no atiende este día' });
    else if (!it.xy) fuera.push({ it, motivo: 'sin ubicación' });
    else pend.push(it);
  });
  const llegadaA = (it, desde, tt, primera) => {
    const mismo = !primera && desde[0] === it.xy[0] && desde[1] === it.xy[1];
    return tt + (mismo ? 0 : minutosEntre(desde, it.xy) + cfg.parada);
  };
  while (pend.length) {
    let mejor = null;
    const fijas = pend.filter(x => x.fija != null).sort((a, b) => a.fija - b.fija);
    for (const it of pend) {
      const lleg = llegadaA(it, pos, t, !seq.length);
      const ini = inicioPosible(it, lleg, dura);
      // Tiene que dar tiempo a terminar la visita Y volver a casa antes de «Vuelta como tarde»
      if (ini == null || ini + dura + minutosEntre(it.xy, [sal.lat, sal.lon]) > tope) continue;
      // No elegir algo que haga llegar tarde a la próxima cita con hora fijada
      if (it.fija == null && fijas.length) {
        const f = fijas[0];
        if (llegadaA(f, it.xy, ini + dura, false) > f.fija + 10) continue;
      }
      const coste = ini - t;
      if (!mejor || coste < mejor.coste) mejor = { it, lleg, ini, coste };
    }
    if (!mejor) break;
    seq.push({ it: mejor.it, llegada: mejor.lleg, ini: mejor.ini, fin: mejor.ini + dura });
    t = mejor.ini + dura; pos = mejor.it.xy;
    pend = pend.filter(x => x !== mejor.it);
  }
  pend.forEach(it => {
    const v = it.ventanas;
    fuera.push({ it, motivo: it.fija != null ? 'no llegas a la hora fijada'
      : v && v.every(([, b]) => b <= t) ? `su horario (${txtVentanas(v)}) ya habrá acabado`
      : 'no da tiempo a volver antes de tu hora de vuelta' });
  });
  return { seq, fuera, fin: t + minutosEntre(pos, [sal.lat, sal.lon]) };
}

async function conHorarios(lista) {
  const faltan = lista.filter(m => !('dias' in m)).map(m => m.id);
  if (!faltan.length) return lista;
  const { data } = await db.rpc('horarios_cuentas', { p_ids: faltan });
  const por = {}; (data || []).forEach(h => por[h.id] = h);
  return lista.map(m => por[m.id] ? Object.assign({}, m, { dias: por[m.id].dias || {} }) : m);
}

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

function ordenarPorCercania(citas) { return conHor(horDeCitas(citas), () => ordenarPorCercaniaBase(citas)); }
function ordenarPorCercaniaBase(citas) {
  const fecha = (citas[0] && citas[0].fecha) || AG_FECHA;
  const cfg = PLANCFG(), ahora = new Date(), minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  let t0 = minHora(cfg.salida);
  if (fecha === hoyISO()) t0 = Math.max(t0, Math.ceil(minAhora / 5) * 5);
  const cerradas = citas.filter(c => !CITA_ABIERTA.includes(c.estado));
  const abiertas = citas.filter(c => CITA_ABIERTA.includes(c.estado));
  const items = abiertas.map(c => ({ id: c.id, ref: c, xy: xyCita(c), ventanas: ventanasDe(c.dias, fecha), fija: minHora(c.hora) }));
  // Para ordenar no se descarta a nadie por la hora tope: se ordena todo lo posible
  const { seq, fuera } = programarVisitas(items, t0);
  ordenarPorCercania.fuera = fuera.length;
  return cerradas.concat(seq.map(s => s.it.ref), fuera.map(f => f.it.ref));
}

/* ---------------- reprogramar lo no visitado ---------------- */

async function reprogramarCitas(citas, titulo, texto) {
  if (!citas.length) return false;
  const conH = await conHorarios(citas.map(c => Object.assign({ id: c.cuenta_id }, 'dias' in c ? { dias: c.dias } : {})));
  const dias = {}; conH.forEach(h => dias[h.id] = h.dias || {});
  const base = hoyISO();
  const filas = citas.map(c => ({ c, fecha: proximoDiaConsulta(dias[c.cuenta_id], c.fecha > base ? c.fecha : base),
    horario: Object.keys(dias[c.cuenta_id] || {}).filter(k => (dias[c.cuenta_id] || {})[k]).join(' ') }));
  return new Promise(res => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${esc(titulo)}</h2><div class="sm">${esc(texto)}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <p class="sm">Te propongo el próximo día que cada ${TT('medico', 's', '', 'l', 'l')} atiende. Cambia la fecha si quieres o desmarca los que no quieras mover.</p>
      <div class="lista reprog" data-nosucio>${filas.map((f, i) => `<div class="item" style="cursor:default">
        <input type="checkbox" data-rpi="${i}" checked aria-label="Mover">
        <span class="tx"><b>${esc(f.c.nombre)}</b>
          <span class="sm">${esc([f.c.centro_nombre, f.c.municipio].filter(Boolean).join(' · '))}${f.c.fecha < base ? ' · era el ' + fechaCorta(f.c.fecha) : ''}</span>
          <span class="sm">${f.horario ? 'Atiende: ' + esc(f.horario) : 'Sin días de atención conocidos'}</span></span>
        <input type="date" data-rpf="${i}" value="${f.fecha}" min="${base}"></div>`).join('')}</div>
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" id="rpno">Dejarlas como están</button>
        <button class="btn" id="rpok">Mover las marcadas</button></div>`;
    const cerrar = v => { $('dlg').close(); res(v); };
    $('rpno').onclick = () => cerrar(false);
    $('rpok').onclick = async ev => {
      ev.target.disabled = true; ev.target.textContent = 'Moviendo…';
      let n = 0;
      for (let i = 0; i < filas.length; i++) {
        if (!$('dbody').querySelector(`[data-rpi="${i}"]`).checked) continue;
        const f = $('dbody').querySelector(`[data-rpf="${i}"]`).value; if (!f) continue;
        const { data: r } = await db.rpc('aplazar_cita', { p_id: filas[i].c.id, p_fecha: f, p_hora: null, p_origen: 'Reprogramada' });
        if (r && r.ok) n++;
      }
      toast(n ? `${n} ${n === 1 ? 'cita movida' : 'citas movidas'}` : 'No se ha movido ninguna');
      cerrar(n > 0);
      cargarAgenda(); cargarInicio(); pintarRutaBarra();
    };
    $('dlg').showModal();
  });
}

async function terminarJornada() {
  const j = jornadaActiva(); if (!j) return;
  invalidarCache();
  const citas = await citasDelDia(hoyISO());
  const hechas = citas.filter(c => c.estado === 'Visitada').length;
  const abiertas = citas.filter(c => CITA_ABIERTA.includes(c.estado));
  const ok = await preguntar(`Tiempo: ${durTxt(Date.now() - j.inicio)} · Visitadas: ${hechas} de ${citas.filter(c => !['Descartada', 'Aplazada'].includes(c.estado)).length}` +
    (abiertas.length ? `\n\nTe quedan ${abiertas.length} ${abiertas.length === 1 ? 'cita abierta' : 'citas abiertas'}. Al terminar te propongo a qué día moverlas.` : ''),
    { titulo: '¿Terminar la jornada?', ok: 'Terminar jornada' });
  if (!ok) return;
  localStorage.removeItem(JKEY());
  pintarRutaBarra();
  toast(`Jornada terminada · ${hechas} visitadas`);
  if (abiertas.length) await reprogramarCitas(abiertas, 'Lo que ha quedado pendiente hoy', `${abiertas.length} sin visitar`);
  if (TAB === 'agenda') cargarAgenda();
  if (TAB === 'rutas') cargarRutas();
}

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


