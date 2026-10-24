/* ============================================================
   DLC OS 2.0 · v2.24.0 · «Tu día»: la agenda del día es la ruta.
   Estados de cita, orden del día, jornada en curso
   ============================================================ */

/* ---------------- estados de cita ---------------- */

const CITA_ABIERTA = ['Planificada', 'Confirmada'];
Object.assign(EST_COL, { Planificada: 'var(--navy)', Confirmada: 'var(--sky)', Visitada: 'var(--ok)',
  'No estaba': 'var(--warn)', Aplazada: 'var(--muted)', Descartada: 'var(--muted)' });
const pillCita = e => `<span class="pill cest" style="background:color-mix(in srgb, ${EST_COL[e] || 'var(--muted)'} 12%, transparent);color:${EST_COL[e] || 'var(--muted)'}">${esc(e)}</span>`;

// La ruta en curso de versiones anteriores se sustituye por la jornada
try { Object.keys(localStorage).filter(k => k.startsWith('dlc-ruta-')).forEach(k => localStorage.removeItem(k)); } catch (e) {}

/* ---------------- jornada ---------------- */

const JKEY = () => 'dlc-jornada-' + (PERFIL ? PERFIL.id : '');
function jornadaActiva() {
  let j = null;
  try { j = JSON.parse(localStorage.getItem(JKEY()) || 'null'); } catch (e) {}
  if (j && j.fecha !== hoyISO()) { localStorage.removeItem(JKEY()); return null; }   // una jornada solo dura su día
  return j;
}

async function citasDelDia(fecha) {
  const r = await rpcCache('agenda_rango', { p_desde: fecha, p_hasta: fecha, p_usuario: PERFIL.id }, 'agenda-' + fecha);
  return r.data || [];
}

async function empezarJornada() {
  const citas = await citasDelDia(hoyISO());
  if (!citas.some(c => CITA_ABIERTA.includes(c.estado))) { toast('No tienes citas abiertas hoy. Añade citas o planifica una ruta.', true); return; }
  localStorage.setItem(JKEY(), JSON.stringify({ fecha: hoyISO(), inicio: Date.now() }));
  pintarRutaBarra();
  toast('Jornada iniciada');
  AG_MODO = 'dia'; AG_FECHA = hoyISO();
  if (TAB === 'agenda') cargarAgenda(); else ir('agenda');
}


async function pintarRutaBarra() {
  const j = jornadaActiva(), el = $('rutabar');
  if (!j) { el.classList.add('hide'); document.body.classList.remove('conruta'); return; }
  el.classList.remove('hide'); document.body.classList.add('conruta');
  const citas = await citasDelDia(hoyISO());
  const hechas = citas.filter(c => c.estado === 'Visitada' || c.estado === 'No estaba').length;
  const total = citas.filter(c => !['Descartada', 'Aplazada'].includes(c.estado)).length;
  el.innerHTML = `<span class="rbtx">● <b class="rblargo">Jornada en curso · </b><span class="rt">${durTxt(Date.now() - j.inicio)}</span> · ${hechas}<span class="rblargo"> de </span><span class="rbcorto">/</span>${total}<span class="rblargo"> hechas</span></span>
    <span class="acts" style="margin:0"><button class="btn sec chico" id="rbver">Mi día</button><button class="btn dang chico" id="rbfin">Terminar</button></span>`;
  // El contenido de la página empieza justo debajo del banner, mida lo que mida
  requestAnimationFrame(() => document.documentElement.style.setProperty('--rbh', el.offsetHeight + 'px'));
  $('rbver').onclick = () => { AG_MODO = 'dia'; AG_FECHA = hoyISO(); ir('agenda'); };
  $('rbfin').onclick = terminarJornada;
}

/* ---------------- orden y horas estimadas ---------------- */

const minHora = h => h ? (+String(h).slice(0, 2) * 60 + +String(h).slice(3, 5)) : null;
const xyCita = c => c.lat != null && c.lon != null ? [+c.lat, +c.lon] : null;
const salidaUsuario = () => prefsActivas().salida || { nombre: `la ${TT('visita', 's', 'primer', 'l', 'l')}`, lat: null, lon: null, falta: true };

/** Calcula la hora estimada de cada cita abierta siguiendo el orden actual. */

/** Orden por cercanía: las citas con hora fija marcan el esqueleto; las demás se insertan donde menos desvío suman. */

// v2.298: coloca la cita de esa ficha con esa hora entre las abiertas del día (mismo criterio que «Cambiar la hora»)
async function colocarPorHora(fecha, uid, cuentaId, h) {
  const { data } = await RPC_ORIG('agenda_rango', { p_desde: fecha, p_hasta: fecha, p_usuario: uid });
  const hh = c => c.hora ? String(c.hora).slice(0, 5) : null;
  const ab = (data || []).filter(c => c.usuario_id === uid && CITA_ABIERTA.includes(c.estado));
  const yo = ab.filter(c => c.cuenta_id === cuentaId && hh(c) === h).pop(); if (!yo) return;
  const resto = ab.filter(c => c !== yo);
  let i = resto.findIndex(c => hh(c) && hh(c) > h);
  if (i < 0) { i = 0; resto.forEach((c, k) => { if (hh(c) && hh(c) <= h) i = k + 1; }); }
  resto.splice(i, 0, yo);
  if (resto.some((c, k) => c !== ab[k])) { await guardarOrden(resto); if (typeof RC !== 'undefined' && RC.delete) RC.delete('agenda-' + fecha); }
}
async function guardarOrden(citas) {
  const { data: r, error } = await db.rpc('ordenar_citas', { p_ids: citas.map(c => c.id) });
  if (error || (r && r.ok === false)) { toast('No se ha podido guardar el orden', true); return false; }
  return true;
}

function proximoDiaConsulta(dias, desde) {
  const letras = 'DLMXJVS', claves = Object.keys(dias || {}).filter(k => (dias || {})[k]);
  const d = new Date((desde || hoyISO()) + 'T12:00:00');
  for (let i = 1; i <= 21; i++) {
    d.setDate(d.getDate() + 1);
    const l = letras[d.getDay()];
    if (l === 'D' || l === 'S') continue;
    if (!claves.length || claves.includes(l)) return fechaLocal(d);
  }
  return isoMas(desde || hoyISO(), 1);
}

/* ---------------- «Tu día» en la agenda ---------------- */

let TD_CITAS = [];


// (v2.183.0: aquí iba la primera versión de menuCita; se redefine entera más abajo)
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('.tdmenu, .tdmas')) document.querySelectorAll('.tdmenu').forEach(m => m.remove());
}, true);
// Se cierra al desplazarse, salvo en el primer instante (el propio toque puede mover un poco la página)
document.addEventListener('scroll', () => document.querySelectorAll('.tdmenu').forEach(m => { if (Date.now() - (m.__t || 0) > 400) m.remove(); }), true);

async function accionCita(k, c) {
  const refrescar = () => agRefrescoQuieto(c.id);
  if (k === 'ficha') return abrirFicha(c.cuenta_id);
  if (k === 'llegar') return navegarA(xyCita(c));
  if (k === 'hora') return cambiarHoraCita(c.id, c.hora || '');
  if (k === 'confirmar' || k === 'desconfirmar' || k === 'descartar') {
    const estado = k === 'confirmar' ? 'Confirmada' : k === 'desconfirmar' ? 'Planificada' : 'Descartada';
    const r = await escribir('estado_cita', { p_id: c.id, p_estado: estado });
    if (r && r.error) { toast('No se ha podido cambiar', true); return; }
    toast(estado === 'Confirmada' ? 'Cita confirmada' : estado === 'Descartada' ? 'Cita descartada' : 'Confirmación quitada'); refrescar(); return;
  }
  if (k === 'borrar') {
    if (!await preguntar('La cita desaparece de la agenda sin dejar rastro.', { titulo: '¿Eliminar la cita?', ok: 'Eliminar', peligro: true })) return;
    const { data: r } = await db.rpc('borrar_cita', { p_id: c.id });
    if (r && r.ok === false) { toast(r.error === 'pasada' ? 'Solo se pueden eliminar citas de hoy en adelante' : 'No se ha podido eliminar', true); return; }
    toast('Cita eliminada'); refrescar(); return;
  }
  if (k === 'aplazar') {
    const f = await pedirFecha('¿A qué día la pasas?', proximoDiaConsulta(c.dias, c.fecha),
      { titulo: 'Aplazar la cita', ok: 'Aplazar' });
    if (!f) return;
    const { data: r, error } = await db.rpc('aplazar_cita', { p_id: c.id, p_fecha: f, p_hora: null, p_origen: 'Aplazada' });
    if (error || (r && r.ok === false)) { toast('No se ha podido aplazar', true); return; }
    toast(r && r.ya ? 'Ya tenía una cita ese día' : r && r.mismo_dia ? 'Sigue en el mismo día' : r && r.reabierta ? 'Vuelve a su cita del ' + fechaCorta(f) : 'Aplazada al ' + fechaCorta(f)); refrescar(); return;
  }
  if (k === 'noestaba') {
    const neg = (CAT.resultado_visita || []).filter(x => x.extra === 'neg');
    if (!neg.length) { toast('Falta un resultado negativo en Configuración → Clasificadores', true); return; }
    let res = neg[0].valor;
    if (neg.length > 1) {
      const op = await elegirOpcion('¿Qué ha pasado?', c.nombre, [{ k: 'no', t: 'Cancelar', cls: 'sec' }].concat(neg.map((x, i) => ({ k: 'n' + i, t: x.valor, cls: 'sec' }))));
      if (!op) return;
      res = neg[+op.slice(1)].valor;
    }
    const { error } = await escribirRpc('registrar_actividad', { p: { cuenta_id: c.cuenta_id, fecha: c.fecha, resultados: [res],
      op_id: 'v-' + c.cuenta_id + '-' + Date.now() } });
    if (error) { toast('No se ha podido guardar: ' + error.message, true); return; }
    toast('Anotado: ' + res);
    refrescar();
    return nuevaFechaTrasNoEstaba(c);
  }
  if (k === 'nueva') return nuevaFechaTrasNoEstaba(c);
}

async function nuevaFechaTrasNoEstaba(c) {
  const prop = proximoDiaConsulta(c.dias, c.fecha);
  const op = await elegirOpcion('¿Le buscamos otro día?', `${c.nombre}\n\nEl próximo día que atiende es el ${fechaLarga(new Date(prop + 'T00:00:00'))}.`,
    [{ k: 'no', t: 'Ahora no', cls: 'sec' }, { k: 'otra', t: 'Elegir otra fecha', cls: 'sec' }, { k: 'prop', t: 'Cita el ' + fechaCorta(prop) }]);
  if (!op) return;
  let f = prop;
  if (op === 'otra') { f = await pedirFecha('¿Qué día?', prop, { titulo: 'Nueva cita', ok: 'Crear cita' }); if (!f) return; }
  const { data: r, error } = await db.rpc('guardar_cita', { p: { cuenta_id: c.cuenta_id, fecha: f, centro_nombre: c.centro_nombre,
    estado: 'Planificada', origen: 'No estaba el ' + fechaCorta(c.fecha), op_id: 'ne-' + c.id + '-' + f } });
  if (error || (r && r.ok === false)) { toast('No se ha podido crear la cita', true); return; }
  toast('Nueva cita el ' + fechaCorta(f)); agRefrescoQuieto();
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-td]');
  if (!b) return;
  e.stopPropagation();
  const [acc, id] = b.dataset.td.split('|');
  const c = TD_CITAS.find(x => x.id === id);
  if (!c) return;
  if (acc === 'mas') return menuCita(b, c);
  if (acc === 'visita') { if (!puedeRegistrarEnDia(c.fecha)) return; VISITA_FECHA = c.fecha; return abrirVisita(c.cuenta_id); }
  if (acc === 'nueva') return nuevaFechaTrasNoEstaba(c);
  if (acc === 'sube' || acc === 'baja') {
    const ab = TD_CITAS.filter(x => CITA_ABIERTA.includes(x.estado)), i = ab.indexOf(c), j = acc === 'sube' ? i - 1 : i + 1;
    if (j < 0 || j >= ab.length) return;
    [ab[i], ab[j]] = [ab[j], ab[i]];
    const orden = TD_CITAS.filter(x => !CITA_ABIERTA.includes(x.estado)).concat(ab);
    moverCitaLocal(orden, c.id, acc);
  }
});

// La vista de día de la agenda es «Tu día»

// Al cerrar una visita o una cita, se refresca el día
$('dlg').addEventListener('close', () => { if (TAB === 'agenda' && agCambiosEnVentana()) setTimeout(() => agRefrescoQuieto(), 350); });

// En la semana, «Mover» ahora aplaza (antes dejaba la cita en un estado que ya no existía)
document.addEventListener('click', async e => {
  const c = e.target.closest('[data-cita^="repro|"]');
  if (!c) return;
  e.stopImmediatePropagation(); e.preventDefault();
  const id = c.dataset.cita.split('|')[1];
  const f = await pedirFecha('¿A qué día la pasas?', isoMas(hoyISO(), 1), { titulo: 'Aplazar la cita', ok: 'Aplazar' });
  if (!f) return;
  const { data: r, error } = await db.rpc('aplazar_cita', { p_id: id, p_fecha: f, p_hora: null, p_origen: 'Aplazada' });
  if (error || (r && r.ok === false)) { toast('No se ha podido aplazar', true); return; }
  toast('Aplazada al ' + fechaCorta(f)); cargarAgenda();
}, true);

/* ---------------- rutas: el plan se convierte en la agenda del día ---------------- */

async function planAAgenda(plan) {
  const fecha = plan.fecha || hoyISO();
  const meds = plan.paradas.flatMap(p => p.medicos.map(m => ({ m, centro: p.centro, nota: p.nota || '' })));
  const existentes = await citasDelDia(fecha);
  const ids = [];
  let orden = existentes.length;
  for (const { m, centro, nota } of meds) {
    const ya = existentes.find(c => c.cuenta_id === m.id && CITA_ABIERTA.includes(c.estado));
    if (ya) { ids.push(ya.id); continue; }
    const { data: r, error } = await db.rpc('guardar_cita', { p: { cuenta_id: m.id, fecha, hora: null, centro_nombre: centro,
      estado: 'Planificada', origen: 'Ruta' + (typeof plan.rutaId === 'string' && plan.rutaId.length > 20 ? '' : ''), orden: ++orden, nota: nota || null,
      salida: (plan.horario || {}).salida || null, vuelta: (plan.horario || {}).vuelta || null,
      op_id: 'c-' + m.id + '-' + fecha } });
    if (error || !r || !r.ok) { toast('No se ha podido guardar alguna cita', true); return null; }
    ids.push(r.id);
  }
  // Orden: primero lo que ya había cerrado, después el orden del plan
  const cerradas = existentes.filter(c => !CITA_ABIERTA.includes(c.estado)).map(c => c.id);
  const abiertasPrevias = existentes.filter(c => CITA_ABIERTA.includes(c.estado) && !ids.includes(c.id)).map(c => c.id);
  await db.rpc('ordenar_citas', { p_ids: cerradas.concat(ids, abiertasPrevias) });
  invalidarCache();
  return { fecha, n: meds.length };
}

async function empezarRuta() {
  if (!PLAN) return;
  if (PLAN.fecha && PLAN.fecha !== hoyISO()) { toast('Este plan es para otro día: guárdalo en tu agenda.', true); return; }
  const r = await planAAgenda(PLAN);
  if (!r) return;
  PLAN = null;
  localStorage.setItem(JKEY(), JSON.stringify({ fecha: hoyISO(), inicio: Date.now() }));
  pintarRutaBarra();
  toast('Plan pasado a tu agenda · jornada iniciada');
  AG_MODO = 'dia'; AG_FECHA = hoyISO();
  ir('agenda');
}


// En Rutas, la ruta en curso se ve en «Tu día»
async function pintarRutaEnCurso() {
  if (TAB !== 'rutas') return;
  if (!$('renc')) $('v-rutas').querySelector('.saludo').insertAdjacentHTML('afterend', '<div id="renc"></div>');
  const j = jornadaActiva();
  $('renc').innerHTML = j ? `<div class="card renc"><h2>Jornada en curso</h2>
    <p class="sm">Empezaste hace ${durTxt(Date.now() - j.inicio)}. El orden, las horas y el registro de ${TT('visita', 'p', '', 'l', 'l')} están en tu agenda de hoy.</p>
    <div class="acts" style="padding:0 16px 16px"><button class="btn" id="rencver">Ver mi día</button>
      <button class="btn sec dang" id="rencfin">Terminar jornada</button></div></div>` : '';
  if (j) { $('rencver').onclick = () => { AG_MODO = 'dia'; AG_FECHA = hoyISO(); ir('agenda'); }; $('rencfin').onclick = terminarJornada; }
}

/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  agenda: ['Agenda y «Tu día»', 'Tus citas por día, semana o mes. La vista de día es tu ruta.', [
    'Las citas se ordenan como vas a visitarlas. <b>Ordenar por cercanía</b> calcula el recorrido más corto; las citas con hora fija se respetan. Las flechas cambian el orden a mano.',
    'La hora con «~» es una estimación según el orden, tu horario y los desplazamientos. Una hora sin «~» es una hora fijada.',
    `<b>Empezar jornada</b> activa la barra verde. Registra cada ${TT('visita', 's', '', 'l', 'l')} al terminarla: la cita pasa a <b>Visitada</b>.`,
    'Estados: <b>Planificada</b> y <b>Confirmada</b> (abiertas); <b>Visitada</b>, <b>No estaba</b>, <b>Aplazada</b> y <b>Descartada</b> (cerradas).',
    '<b>No estaba</b> lo anota en su historial y te propone el próximo día que atiende.',
    '<b>Aplazar</b> deja la cita como aplazada y crea la nueva, así se ve el cumplimiento real.',
    'Las citas abiertas de días anteriores aparecen abajo para moverlas a hoy.']],
  rutas: ['Rutas', 'Plantillas para llenar tu agenda.', [
    `<b>Lista fija</b>: tú eliges ${TT('medico', 'p', 'el', 'l', 'l')}. <b>Por criterios</b>: se rellena sola con los filtros.`,
    'Al planificar ves el orden y las horas estimadas. <b>Guardar en mi agenda</b> crea las citas de ese día; <b>Pasar a mi agenda y empezar</b> además inicia la jornada.',
    'Durante la jornada todo se hace desde <b>Agenda → Tu día</b>.',
    `La salida y la vuelta son de cada ruta (y del planificador semanal); <b>⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')}</b> cambia los minutos por ${TT('medico', 's', '', 'l', 'l')} y por parada.`,
    `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación. Completar la dirección y los días de atención mejora mucho las rutas.`]]
});


