// pantallas/agenda.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// La precarga de datos de la Agenda está en src/app/screens/agenda/preload.ts (v2.393.0)
const datosAgenda = window.delcos.screens.agenda.data;

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
  if (resto.some((c, k) => c !== ab[k])) { await window.delcos.screens.agenda.saveOrder(resto); if (typeof RC !== 'undefined' && RC.delete) RC.delete('agenda-' + fecha); }
}

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

function agUid() { return AG_VISTA ? AG_VISTA.id : PERFIL.id; }

function agUsuarioFiltro() {
  if (TAB === 'agenda' && AG_VISTA) return AG_VISTA.id;
  return puede('administrar') ? null : PERFIL.id;
}

async function verAgendaDe(id) {
  if (!id || id === PERFIL.id) { AG_VISTA = null; cargarAgenda(); return; }
  const { data } = await RPC_ORIG('preferencias_de', { p_usuario: id });
  if (!data) { toast('No se ha podido abrir su agenda', true); return; }
  AG_VISTA = { id: data.id, nombre: data.nombre, rol: data.rol, preferencias: data.preferencias || {} };
  cargarAgenda();
}

async function menuDiaSemana(boton, fecha, bloqueado) {
  document.querySelectorAll('.tdmenu').forEach(m => m.remove());
  const m = document.createElement('div');
  m.className = 'tdmenu'; m.__t = Date.now();
  m.innerHTML = [
    fecha >= hoyISO() ? ['nueva', 'Nueva cita', `Añadir ${TT('medico', 's', 'un', 'l', 'l')} a este día`] : null,
    ['ver', 'Ver el día', 'Abrirlo en «Tu día»'],
    fecha >= hoyISO() ? (bloqueado ? ['desbloquear', 'Desbloquear el día', 'Vuelve a estar disponible para planificar']
      : ['bloquear', 'Bloquear el día', 'Vacaciones, formación, congreso… El planificador no lo usará']) : null
  ].filter(Boolean).map(([k, t, s]) => `<button data-dmo="${k}"><b>${esc(t)}</b><span>${esc(s)}</span></button>`).join('');
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, r.bottom + 6) + 'px';
  m.style.left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, r.right - m.offsetWidth)) + 'px';
  m.querySelectorAll('[data-dmo]').forEach(b => b.onclick = async () => {
    m.remove();
    const k = b.dataset.dmo;
    if (k === 'nueva') return nuevaCita(null, fecha);
    if (k === 'ver') { AG_FECHA = fecha; AG_MODO = 'dia'; return cargarAgenda(); }
    let motivo = null;
    if (k === 'bloquear') {
      motivo = await pedirTexto('Motivo (opcional)', '', { titulo: 'Bloquear el ' + fechaCorta(fecha), ok: 'Bloquear' });
      if (motivo === null) return;
    }
    const { data: r2, error } = await RPC_ORIG('bloquear_dia', { p_fecha: fecha, p_motivo: motivo, p_usuario: agUid(), p_bloquear: k === 'bloquear' });
    if (error || (r2 && r2.ok === false)) { toast('No se ha podido cambiar', true); return; }
    toast(k === 'bloquear' ? 'Día bloqueado' : 'Día desbloqueado'); cargarAgenda();
  });
}


// Mis citas pendientes (planificadas o confirmadas) desde hoy: médico → primera fecha
async function citasPlanificadasMias() {
  try {
    const { data } = await db.from('agenda').select('cuenta_id,fecha').eq('usuario_id', PERFIL.id)
      .in('estado', ['Planificada', 'Confirmada']).gte('fecha', hoyISO()).order('fecha').limit(2000);
    const r = {}; (data || []).forEach(c => { if (!r[c.cuenta_id]) r[c.cuenta_id] = c.fecha; }); return r;
  } catch (e) { return {}; }
}

async function rpAgenda(i, btn) {
  const p = rpPlanDe(i); if (!p) return;
  btn.disabled = true;
  try {
    PLAN = null;
    await construirPlan(p.sel, 'prop' + (i + 1), btn, { manana: RPROP.manana, horario: null });
    if (!PLAN) return;
    const r = await planAAgenda(PLAN);
    if (!r) return;
    toast(`${r.n} citas en tu agenda ${rpNombreDia(r.fecha) === 'hoy' ? 'de hoy' : 'del ' + fechaCorta(r.fecha)}`);
    PLAN = null; AG_MODO = 'dia'; AG_FECHA = r.fecha; ir('agenda');
  } finally { btn.disabled = false; }
}

/* v2.147.0 · Agenda: «Tu día» sin citas (petición de Eric). Sin contadores a cero; en un día pasado, «No tuviste citas este día.» (no se
   puede añadir nada); el mensaje, compacto: icono y frase en una línea, centrado. */

async function tareasDelDia(f) {
  if (AG_VISTA && AG_VISTA.id !== PERFIL.id) return null;   // las tareas son de cada uno: en la agenda de otra persona no se ven
  if (TAREAS_DIA && TAREAS_DIA.f === f) return TAREAS_DIA.l;
  const { data, error } = await db.from('tareas').select('*').eq('fecha', f).order('orden', { ascending: true, nullsFirst: false }).order('hora', { ascending: true, nullsFirst: false }).order('creado_en');
  if (error) return null;
  TAREAS_DIA = { f, l: data || [] };
  return TAREAS_DIA.l;
}

function agCambiosEnVentana() { return RC_EPOCA !== DLG_EPOCA; }


// Lo que antes era «cargar la agenda entera» tras un cambio: en la vista del día, solo lo que cambia

/* v2.190.0 · Tareas en el orden de cada uno (petición de Eric): flechas ↑ ↓ en cada tarea (con más de una) que la suben o la bajan al momento,
   deslizándose a su sitio como las citas, y guardan el orden por detrás (ordenar_tareas, SQL 117; tareasDelDia ordena por orden, hora y alta).
   Sin hora, la tarea ya no enseña el puntito «·» junto a la casilla. */

/* v2.213.0 · Citas aplazadas: adónde fueron y de dónde vienen (petición de Eric; SQL 129).
   - La cita que queda «Aplazada» dice adónde se movió (siguiendo la cadena si se volvió a aplazar) y cómo está allí si ya se cerró.
   - La nueva hereda la anterior: de qué día viene y cómo se citó la primera vez (Ruta, Ficha…), en lugar de «Aplazada».
   - Si vuelve a un día en que estaba aplazada, la base la reactiva y se ve como las demás (aplazar_cita y reabrir_cita).
   - En la ventana de la cita, botones para ir al día al que se movió o del que viene. */
function diaCita(f) {
  const d = new Date(f + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long' }) + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
}

function textoOrigenCita(c) {
  const p = [];
  if (c.estado === 'Aplazada' && c.aplazada_a_fecha) {
    const fin = c.aplazada_a_estado && !CITA_ABIERTA.includes(c.aplazada_a_estado) && c.aplazada_a_estado !== 'Aplazada' ? ' (' + c.aplazada_a_estado.toLowerCase() + ')' : '';
    p.push('movida al ' + diaCita(c.aplazada_a_fecha) + fin);
  }
  if (c.aplazada_de_fecha) {
    p.push('viene del ' + diaCita(c.aplazada_de_fecha));
    if (c.origen_inicial && !['Aplazada', 'Reprogramada'].includes(c.origen_inicial)) p.push(c.origen_inicial);
  } else if (c.origen && !(c.estado === 'Aplazada' && c.aplazada_a_fecha && c.origen === 'Aplazada')) p.push(c.origen);
  return p.length ? ' · ' + esc(p.join(' · ')) : '';
}

function puedeRegistrarEnDia(f) {
  const h = hoyISO();
  return !f || f === h || (f < h && puede('visita_fecha_pasada'));
}

async function agBloqueos(desde, n) { try { return await bloqueadosSemana(desde, isoMas(desde, n - 1)); } catch (e) { return {}; } }



async function rnPasarAgenda(item, btn) {
  const { r } = item, ms = (item.ms || []).filter(m => m.lat != null);
  if (!ms.length) { toast(`Esta ruta no tiene ${TT('medico', 'p', '', 'l', 'l')} con ubicación`, true); return; }
  let rep = r.repeticion || null, fechas;
  if (!rep) {
    const f = await pedirCampo('¿Qué día la haces?', 'date', siguienteLaborable(), 'Día');
    if (!f) return; fechas = [f];
  } else fechas = rnFechas(rep, rep.desde && rep.desde > hoyISO() ? rep.desde : hoyISO(), rnHorizonte(rep));
  if (!fechas.length) { toast('No hay ningún día próximo para esta ruta', true); return; }
  if (fechas.length > 1 && !await preguntar(`Se añaden ${ms.length} ${ms.length === 1 ? "cita" : "citas"} cada día, en ${fechas.length} días: ${fechas.map(f => fechaCorta(f)).join(', ')}. Los días bloqueados se saltan y no se repite a nadie que ya tenga cita ese día.`,
    { titulo: 'Pasar la ruta a tu agenda', ok: 'Añadir' })) return;
  if (btn) btn.disabled = true;
  try {
    const res = await rnCitasEn(r, ms, fechas);
    if (res.error) return;
    if (rep && rep.tipo !== 'fecha') await db.rpc('guardar_ruta', { p: { id: r.id, repeticion: Object.assign({}, rep, { hasta: fechas[fechas.length - 1] }) } });
    toast(`${res.n} ${res.n === 1 ? 'cita añadida' : 'citas añadidas'}${res.saltados.length ? ` · ${res.saltados.length} ${res.saltados.length === 1 ? 'día bloqueado' : 'días bloqueados'} sin tocar` : ''}`);
    AG_MODO = 'dia'; AG_FECHA = fechas.find(f => !res.saltados.includes(f)) || fechas[0]; ir('agenda');
  } finally { if (btn) btn.disabled = false; }
}



// Las citas que cambian de sitio se deslizan y la tocada se resalta (antes se animaban las filas ocultas)


// ---- Pastillas: las cifras de agenda_metricas
// ---- La Agenda: vista del día (con la semana o el mes abiertos si se piden) o Equipo





// ---- Pastillas, cifras y bandejas
// Tras un cambio (mover, registrar, notas…): cifras, cinta, «Tu semana», bandejas y el mes si está abierto, de una vez


// Con tiempos reales del día, cada tramo conocido usa su tiempo con tráfico; el resto, la estimación de siempre (minutosEntre es
// una constante: estimarDiaBase llama a tdMinutos, cambiado en su sitio)
function tdMinutos(a, b) {
  if (tdRealVigente()) { const m = TD_REAL.mapa.get(tdClaveXY(a, b)); if (m != null) return m; }
  return minutosEntre(a, b);
}

// La ruta de hoy con los mismos puntos y salida que «Tu día en el mapa»
function tdRutaDia(citas, fecha) {
  if (fecha !== hoyISO() || !Array.isArray(citas)) return null;
  if (citas.filter(c => CITA_ABIERTA.includes(c.estado) && xyCita(c)).length < 2) return null;
  let P0; TD_CALC = true; try { P0 = rmPlan(citas, fecha); } finally { TD_CALC = false; }
  if (P0.puntos.length < 2 || P0.puntos.length > 30) return null;
  const salida = P0.segs.length ? `${fecha}T${hm(Math.max(0, P0.segs[0].a))}:00` : null;
  return { puntos: P0.puntos, salida, k: JSON.stringify([P0.puntos, salida]) };
}

function tdPonerReal(ruta, res) {
  if (!ruta || !res || !res.ok || !res.tramos || res.tramos.length !== ruta.puntos.length - 1) return false;
  const mapa = new Map(); res.tramos.forEach((tr, i) => mapa.set(tdClaveXY(ruta.puntos[i], ruta.puntos[i + 1]), Math.round(+tr.min || 0)));
  TD_REAL = { k: ruta.k, mapa, t: Date.now() };
  return true;
}

// Pedir los tiempos con tráfico (una consulta) y volver a pintar «Tu día»
async function tdTrafico(mudo) {
  const ruta = tdRutaDia(TD_CITAS, AG_FECHA); if (!ruta) return;
  const b = $('tdtrafico'); if (b) { b.disabled = true; b.textContent = 'Calculando…'; }
  const res = await rmRuta(ruta.puntos, ruta.salida);
  if (tdPonerReal(ruta, res)) { if (agN()) window.delcos.screens.agenda.repaintSmoothly(); }
  else {
    if (!mudo) toast((RM_MOTIVO[res && res.motivo] || RM_MOTIVO.servicio) + ': las horas siguen siendo aproximadas', true);
    const b2 = $('tdtrafico'); if (b2) { b2.disabled = false; b2.textContent = 'Calcular con tráfico'; }
  }
}

// En la cabecera de «Tu día» (hoy): si las horas van con tráfico real o el botón para calcularlas
function tdMarcaTrafico() {
  const st = document.querySelector('#agcuerpo .tdhead .tdstats'); if (!st) return;
  st.querySelectorAll('.tdtraf').forEach(x => x.remove());
  const ruta = tdRutaDia(TD_CITAS, AG_FECHA); if (!ruta || AG_VISTA) return;
  const real = tdRealVigente() && TD_REAL.k === ruta.k;
  st.insertAdjacentHTML('beforeend', real
    ? '<span class="tdtraf tdtrafok" title="Horas calculadas por las calles y con el tráfico de ahora (TomTom)">Con tráfico real</span>'
    : '<span class="tdtraf"><button type="button" class="kcfg" id="tdtrafico" title="Una petición al servicio de rutas: horas por las calles y con el tráfico de ahora">Calcular con tráfico</button></span>');
  const b = $('tdtrafico'); if (b) b.onclick = () => tdTrafico(false);
}



/* ============================================================
   v2.299.0 · Tu día compacto (petición de Eric): un botón deja cada cita en una línea con el nombre, la hora y el estado.
   Se recuerda en este dispositivo. Pulsar la cita sigue abriendo su detalle (desde ahí se registra la visita).
   ============================================================ */



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

// El mes está en src/app/screens/agenda (v2.390.0); este nombre se queda porque lo llaman el escuchador de Escape y las pruebas
function cerrarMesCinta() { window.delcos.screens.agenda.closeMonth(); }


const horDeCitas = l => { const c = (l || []).find(x => x && (x.salida || x.vuelta)); return c ? { salida: c.salida || null, vuelta: c.vuelta || null } : null; };

const CITA_ABIERTA = ['Planificada', 'Confirmada'];

const pillCita = e => `<span class="pill cest" style="background:color-mix(in srgb, ${EST_COL[e] || 'var(--muted)'} 12%, transparent);color:${EST_COL[e] || 'var(--muted)'}">${esc(e)}</span>`;

const JKEY = () => 'dlc-jornada-' + (PERFIL ? PERFIL.id : '');

const xyCita = c => c.lat != null && c.lon != null ? [+c.lat, +c.lon] : null;

let TD_CITAS = [];

let TD_INFO = {};

let AG_VISTA = null;   // { id, nombre, rol, preferencias } cuando administración mira la agenda de otra persona

// Agenda del día: paradas abiertas en orden (se preparan al pintar para abrir la navegación al pulsar)
let TD_PARADAS = [];

/* v2.143.0 · Agenda en una sola pantalla (decisión de Eric, 3/10/2026): sin flechas ni Día/Semana/Mes. Arriba, una línea fina con
   cuatro métricas; luego Hoy («Tu día») con las sugerencias al lado; debajo, la semana en curso en 7 columnas y el mes con puntos.
   Al pulsar un día se ven sus citas ahí mismo (sin cambiar de pantalla). La semana detallada (arrastrar, planificar, bloquear días)
   sigue a un clic con «Planificar la semana», y vuelve con «Agenda de hoy». */
const agUnida = () => TAB === 'agenda' && AG_MODO === 'dia';   // v2.146.0: también con otro día elegido (antes solo hoy)

const RP_JORNADA = 300;   // minutos de una jornada de propuestas (5 h) si la ruta no dice otra cosa

// «⋯»: pulsar el mismo botón con su menú abierto lo cierra (antes lo volvía a abrir)
let TDM_BOTON = null;

// ---- 2. El mes de la Agenda, en cualquier mes y año

// ---- 1. La franja de la semana, en cualquier semana
let AG_SEMANA = null;

// ---- 2 y 3. Cabecera del día: moverse de día y apuntar tareas
// Se guardan las del día en memoria: mover una cita repinta el día sin volver a pedirlas (solo se piden al cambiar de día, recargar o editarlas)
let TAREAS_DIA = null;

/* v2.220.0: la pastilla «Pendientes» y las líneas de aviso usaban la clase .av, que es la del avatar redondo de la app (salía un círculo
   cortado en lugar de la pastilla): ahora .agp-pend y .tdav.
   v2.219.0 · Agenda con tarjetas y cinta de 14 días (decisión de Eric, prototipo «versión D»).
   - Las cifras pasan a pastillas junto al título (#aghud, leídas de #agmet, que queda oculto).
   - La semana y el mes se sustituyen por una cinta de 14 días (.cinta): un punto por cita (hecha, por hacer, sin cerrar),
     ‹ › de semana en semana, «Hoy» para volver, el mes completo al pulsar su nombre (#agmes flotando) y «Planificar la semana».
   - Tu día a todo el ancho: cada cita es una tarjeta (.tdu) con el nivel de la ficha y adónde llevarla, la clase, la anterior
     y lo que se apuntó para esta (SQL 131: estado_comercial, clase y anterior en agenda_rango), el horario y los avisos.
     Las tarjetas se construyen desde la lista de siempre (.tdlista, que queda oculta): heredan su hora estimada, sus avisos
     y sus botones (los mismos data-td, que atiende el mismo listener).
   - En el móvil: cifras en 2 × 2, la cinta semana a semana (deslizando), «Registrar» a todo el ancho. */
const citaAnulada = e => EST_COL[e] === 'var(--muted)';

const agConCinta = () => TAB === 'agenda' && AG_MODO === 'dia' && !!$('v-agenda');

let CINTA_INI = null;

/* v2.229.0 · Agenda en una sola pantalla (decisión de Eric, 10/10/2026: variante B de https://claude.ai/artifact/7iht52N5whHBhAueRH7pso).
   - Cinta: cada día lleva su «⋯» (nueva cita, ver el día, bloquear o desbloquear: festivo, vacaciones, formación…) y los bloqueados se ven
     rayados con su motivo. «Planificar la semana» pasa a «Ver la semana»: despliega la semana debajo de la cinta, en la misma pantalla, con la
     rejilla de siempre (pintarSemanaAgenda pintada en #agsemexp: citas, arrastrar, «⋯» por día) y un solo botón, «Repartir la semana» (el
     planificador; su propuesta se guarda o descarta allí mismo).
   - Las sugerencias van dentro de «Tu día»: cada cita lleva «En este centro también» con los profesionales del mismo centro (un toque, su
     «+ Cita» de siempre). «Les toca visita» y «Pendientes de días anteriores» pasan a dos bandejas con su número bajo «Tu día», que abren el
     panel lateral con su lista.
   - La columna derecha es «Tu semana» (#agsemlat): día a día con sus citas, su «⋯» y «Repartir la semana». */
let AG_SEM_ABIERTA = false;

const citaHecha = e => EST_COL[e] === 'var(--ok)';

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


const agN = () => agConCinta() && $('v-agenda').classList.contains('agn');

// Quién ya tiene cita ese día (no se le propone)


// Subir o bajar una cita no recarga la Agenda aunque otra pantalla (Inicio pide las citas de hoy) haya pedido otro día entretanto:
// se guarda lo último de cada día y se usa el del día que se ve
const AG_DIAS_DATOS = {};


const tdClaveXY = (a, b) => a && b && a[0] != null && b[0] != null ? `${(+a[0]).toFixed(5)},${(+a[1]).toFixed(5)}>${(+b[0]).toFixed(5)},${(+b[1]).toFixed(5)}` : '';

const tdRealVigente = () => TD_REAL && Date.now() - TD_REAL.t < 600000;

// Tareas del día plegables: un clic en su título las oculta todas y se ven solo las citas (se recuerda en este dispositivo)

async function empezarJornadaBase() {
  const citas = await citasDelDia(hoyISO());
  if (!citas.some(c => CITA_ABIERTA.includes(c.estado))) { toast('No tienes citas abiertas hoy. Añade citas o planifica una ruta.', true); return; }
  localStorage.setItem(JKEY(), JSON.stringify({ fecha: hoyISO(), inicio: Date.now() }));
  pintarRutaBarra();
  toast('Jornada iniciada');
  AG_MODO = 'dia'; AG_FECHA = hoyISO();
  if (TAB === 'agenda') cargarAgenda(); else ir('agenda');
}

async function bloqueadosSemanaBase(desde, hasta) {
  const { data } = await RPC_ORIG('dias_bloqueados_rango', { p_desde: desde, p_hasta: hasta, p_usuario: agUid() });
  const b = {}; (data || []).forEach(x => b[x.fecha] = x.motivo || 'Día bloqueado');
  return b;
}

async function citaRepetidaBase(medicoId, fecha) {
  const uid = TAB === 'agenda' && AG_VISTA ? AG_VISTA.id : PERFIL.id;
  const { data } = await RPC_ORIG('agenda_rango', { p_desde: fecha, p_hasta: fecha, p_usuario: uid });
  const ya = (data || []).find(c => c.cuenta_id === medicoId && CITA_ABIERTA.includes(c.estado));
  if (!ya) return 'nueva';
  const op = await elegirOpcion('Ya tiene una cita ese día',
    `${ya.nombre}\n${fechaLarga(new Date(fecha + 'T00:00:00'))}${ya.hora ? ' a las ' + String(ya.hora).slice(0, 5) : ''} · ${ya.estado}${ya.origen ? ' · ' + ya.origen : ''}\n\n¿Qué quieres hacer?`,
    [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'dos', t: 'Mantener las dos', cls: 'sec' }, { k: 'sust', t: 'Quedarme solo con la nueva' }]);
  if (!op) return null;
  if (op === 'sust') {
    const { data: r } = await db.rpc('borrar_cita', { p_id: ya.id });
    if (r && r.ok === false) { toast('No se ha podido quitar la cita anterior', true); return null; }
  }
  return op;
}

async function citaRepetida(medicoId, fecha) {
  const r = await citaRepetidaBase(medicoId, fecha);
  if (!r) return r;
  const por = await recientesDe([medicoId], fecha);
  const l = por[medicoId];
  if (!l || !l.length) return r;
  const op = await elegirOpcion('Ya se ha visto hace poco', `${txtReciente(l.slice(0, 3))}.\n\n¿Añades la cita igualmente?`,
    [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'nomas', t: 'Sí, y no volver a avisarme', cls: 'sec' }, { k: 'si', t: 'Añadir igualmente' }]);
  if (!op) return null;
  if (op === 'nomas') { await guardarAvisoRevisita(Object.assign(avisoRevisita(), { on: false })); toast('Aviso desactivado. Puedes activarlo en Configuración → Rutas'); }
  return r;
}

/* v2.146.0 · Agenda: al pulsar un día de la semana o del mes, «Tu día» pasa a ese día (petición de Eric: antes se abría un desplegable).
   El título de «Tu día» es la fecha elegida y al lado está «Volver a hoy»; el día elegido queda marcado en la semana y en el mes.
   Las cifras de arriba, la semana y el mes siguen siendo los de hoy. */

function editarTareaBase(t, fecha) {
  t = t || {};
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${t.id ? 'Tarea' : 'Nueva tarea'}</h2><div class="sm">Una nota o tarea tuya para ese día, sin cliente</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="tat">Qué hay que hacer</label><input id="tat" value="${esc(t.titulo || '')}" placeholder="p. ej. Llamar al almacén, reunión de equipo…" maxlength="160">
    <div class="g2">
      <div><label for="taf">Día</label><input id="taf" type="date" value="${esc(t.fecha || fecha || hoyISO())}"></div>
      <div><label for="tah">Hora <span class="sm">(opcional)</span></label><input id="tah" type="time" value="${esc(t.hora ? String(t.hora).slice(0, 5) : '')}"></div>
    </div>
    <label for="tan">Notas</label><textarea id="tan" rows="3">${esc(t.nota || '')}</textarea>
    <div class="acts" style="justify-content:space-between">
      ${t.id ? '<button type="button" class="btn sec peligro" id="taborrar">Borrar</button>' : '<span></span>'}
      <span style="display:flex;gap:8px"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button type="button" class="btn" id="taok">${t.id ? 'Guardar' : 'Añadir'}</button></span></div>`;
  $('taok').onclick = async ev => {
    const titulo = $('tat').value.trim(); if (!titulo) { toast('Escribe qué hay que hacer', true); $('tat').focus(); return; }
    const fila = { titulo, fecha: $('taf').value || hoyISO(), hora: $('tah').value || null, nota: $('tan').value.trim() || null, modificado_en: new Date().toISOString() };
    ev.target.disabled = true;
    const { error } = t.id ? await db.from('tareas').update(fila).eq('id', t.id) : await db.from('tareas').insert(fila);
    ev.target.disabled = false;
    if (error) { toast('No se ha podido guardar: ' + error.message, true); return; }
    $('dlg').close(); toast(t.id ? 'Tarea guardada' : 'Tarea añadida el ' + fechaDiaMes(fila.fecha)); TAREAS_DIA = null; pintarTuDia();
  };
  if ($('taborrar')) $('taborrar').onclick = async () => {
    if (!await preguntar('La tarea desaparece.', { titulo: '¿Borrar la tarea?', ok: 'Borrar', peligro: true })) return;
    const { error } = await db.from('tareas').delete().eq('id', t.id);
    if (error) { toast('No se ha podido borrar', true); return; }
    $('dlg').close(); toast('Tarea borrada'); TAREAS_DIA = null; pintarTuDia();
  };
  $('dlg').classList.add('pequena');
  $('dlg').showModal();
}

// La cinta de 14 días

function editarTarea(t, fecha) {
  if (!t || !t.id || !t.hecha) return editarTareaBase.apply(this, arguments);
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Tarea hecha</h2><div class="sm">${esc(fechaLarga(new Date(t.fecha + 'T00:00:00')))}${t.hora ? ' · ' + esc(String(t.hora).slice(0, 5)) : ''}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="tarlec"><span class="tarok">Hecha</span><b>${esc(t.titulo || '')}</b>${t.nota ? `<p>${esc(t.nota)}</p>` : ''}</div>
    <div class="acts" style="justify-content:space-between">
      <button type="button" class="btn sec peligro" id="taborrar">Borrar</button>
      <span style="display:flex;gap:8px"><button type="button" class="btn sec" data-cerrar>Cerrar</button><button type="button" class="btn" id="tareabrir">Volver a pendiente</button></span></div>`;
  $('tareabrir').onclick = async ev => {
    ev.target.disabled = true;
    const { error } = await db.from('tareas').update({ hecha: false, modificado_en: new Date().toISOString() }).eq('id', t.id);
    ev.target.disabled = false;
    if (error) { toast('No se ha podido cambiar', true); return; }
    TAREAS_DIA = null; pintarTuDia(); editarTareaBase.call(this, Object.assign({}, t, { hecha: false }), fecha);
  };
  $('taborrar').onclick = async () => {
    if (!await preguntar('La tarea desaparece.', { titulo: '¿Borrar la tarea?', ok: 'Borrar', peligro: true })) return;
    const { error } = await db.from('tareas').delete().eq('id', t.id);
    if (error) { toast('No se ha podido borrar', true); return; }
    $('dlg').close(); toast('Tarea borrada'); TAREAS_DIA = null; pintarTuDia();
  };
  $('dlg').classList.add('pequena');
  $('dlg').showModal();
}




function bloqueadosSemana(d, h) {
  const pre = datosAgenda.peekBlocked(d, h); if (pre) return Promise.resolve(pre);
  return bloqueadosSemanaBase(d, h);
}

// ---- Cinta: datos, «⋯» de cada día y semana desplegada, de una vez


async function empezarJornada(...a) {
  const r = await empezarJornadaBase.apply(this, a);
  try { if (AG_FECHA === hoyISO()) tdTrafico(true); } catch (e) {}
  return r;
}














// «Ver la semana» aparece de una vez: se pinta escondida y se enseña ya con sus días (antes salía vacía y se llenaba)





// «Tu día» está en src/app/screens/agenda/your-day (v2.397.0); el nombre se queda porque lo llaman mucho código antiguo
function pintarTuDia() { return window.delcos.screens.agenda.paintYourDay(); }




// ---- Elegir otro día: todo lo que cambia (Tu día, bandejas, cinta, «Tu semana», la semana abierta) aparece a la vez

// ---- 3. Una sola ventana de cita, con centro y notas
async function nuevaCita(medicoId, fecha, op = {}) {
  let elegido = null, consultas = [];
  const traer = async id => { const { data } = await db.rpc('ficha_cuenta', { p_id: id }); consultas = (data && data.consultas) || []; return data; };
  if (medicoId) { const data = await traer(medicoId); if (data && data.medico) elegido = data.medico; }
  const dia = fecha || (TAB === 'agenda' && AG_FECHA && AG_FECHA >= hoyISO() ? AG_FECHA : hoyISO());
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Nueva cita</h2><div class="sm">Se añade a tu agenda</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label>${TT('medico', 's', '', 'l', 'C')}</label><div id="ncsel"></div>
    <div class="g2">
      <div><label for="ncf">Día</label><input id="ncf" type="date" value="${esc(dia)}"></div>
      <div><label for="nch">Hora <span class="sm">(opcional)</span></label><input id="nch" type="time"></div>
    </div>
    <div id="nccw"></div>
    <label for="ncn">Notas</label><textarea id="ncn" rows="3" placeholder="p. ej. quedamos en el bar de enfrente, llevar el reporting…"></textarea>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="ncok">Añadir a la agenda</button></div>`;
  const pintarCentros = () => {
    const w = $('nccw'); if (!w) return;
    const l = consultas.filter(x => x && x.centro_nombre);
    if (l.length < 2) { w.innerHTML = ''; return; }
    const pref = (typeof FICHA_CENTRO !== 'undefined' && FICHA_CENTRO) || (l.find(x => x.principal) || l[0]).centro_nombre;
    w.innerHTML = `<label for="ncc">Centro</label><select id="ncc">${l.map(x => `<option value="${esc(x.centro_nombre)}" ${x.centro_nombre === pref ? 'selected' : ''}>${esc([x.centro_nombre, x.municipio].filter(Boolean).join(' · '))}</option>`).join('')}</select>`;
  };
  pintarCentros();
  selectorMedico($('ncsel'), { valor: elegido, alElegir: async m => { elegido = m; await traer(m.id); pintarCentros(); } });
  $('ncok').onclick = async ev => {
    if (!elegido) { toast(`Elige ${TT('medico', 's', 'un', 'l', 'l')}`, true); return; }
    const f = $('ncf').value;
    const decision = await citaRepetida(elegido.id, f);
    if (!decision) return;
    const c0 = consultas.find(x => x && x.principal) || consultas[0] || {};
    const centro = ($('ncc') && $('ncc').value) || c0.centro_nombre || elegido.centro_nombre || elegido.centro || null;
    ev.target.disabled = true;
    const r = await escribir('guardar_cita', { p: {
      cuenta_id: elegido.id, fecha: f, hora: $('nch').value || null, centro_nombre: centro, estado: 'Planificada',
      origen: op.origen || (TAB === 'agenda' ? 'Agenda' : 'Ficha'), usuario_id: TAB === 'agenda' && AG_VISTA ? AG_VISTA.id : null,
      nota: $('ncn').value.trim(), op_id: 'c-' + elegido.id + '-' + f + '-' + Date.now()
    }});
    ev.target.disabled = false;
    if (r.error) { toast('No se ha podido: ' + r.error.message, true); return; }
    // v2.298: con hora, la cita nueva se coloca entre las del día según su hora (antes quedaba la última)
    if ($('nch').value) await colocarPorHora(f, TAB === 'agenda' && AG_VISTA ? AG_VISTA.id : PERFIL.id, elegido.id, $('nch').value);
    $('dlg').close(); toast('Cita añadida el ' + fechaDiaMes(f)); if (TAB === 'agenda') agRefrescoQuieto(); else cargarInicio();
  };
  $('dlg').classList.add('pequena');
  $('dlg').showModal();
}

// La vista del día y la de equipo están en src/app/screens/agenda (v2.395.0). Estos dos nombres se quedan como adaptadores
// porque los llaman mucho código antiguo y las pruebas.
function cargarAgenda() { return window.delcos.screens.agenda.loadAgenda(); }
function agVerDia(f) { return window.delcos.screens.agenda.showDay(f); }

// La ficha de la cita está en src/app/screens/agenda/appointment-sheet.ts (v2.398.0). El nombre global se queda: «‹ Volver»
// (legado 126) envuelve las ventanas por su nombre, y lo llaman Rutas y las pruebas.
function verCita(c) { return window.delcos.screens.agenda.showAppointment(c); }

// El refresco tras un cambio está en src/app/screens/agenda/your-day/reorder.ts (v2.399.0); el nombre se queda porque
// lo llaman cinco archivos antiguos (navegación, avisos, ventanas…).
function agRefrescoQuieto(id, o = {}) { window.delcos.screens.agenda.refreshQuietly(id, o.cifras !== false); }
