// pantallas/agenda.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// La precarga de datos de la Agenda está en src/app/screens/agenda/preload.ts (v2.393.0)
const datosAgenda = window.delcos.screens.agenda.data;


async function citasDelDia(fecha) {
  const r = await rpcCache('agenda_rango', { p_desde: fecha, p_hasta: fecha, p_usuario: PERFIL.id }, 'agenda-' + fecha);
  return r.data || [];
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


function puedeRegistrarEnDia(f) {
  const h = hoyISO();
  return !f || f === h || (f < h && puede('visita_fecha_pasada'));
}

async function agBloqueos(desde, n) { try { return await bloqueadosSemana(desde, isoMas(desde, n - 1)); } catch (e) { return {}; } }






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


async function bloqueadosSemanaBase(desde, hasta) {
  const { data } = await RPC_ORIG('dias_bloqueados_rango', { p_desde: desde, p_hasta: hasta, p_usuario: agUid() });
  const b = {}; (data || []).forEach(x => b[x.fecha] = x.motivo || 'Día bloqueado');
  return b;
}



/* v2.146.0 · Agenda: al pulsar un día de la semana o del mes, «Tu día» pasa a ese día (petición de Eric: antes se abría un desplegable).
   El título de «Tu día» es la fecha elegida y al lado está «Volver a hoy»; el día elegido queda marcado en la semana y en el mes.
   Las cifras de arriba, la semana y el mes siguen siendo los de hoy. */


// La cinta de 14 días





function bloqueadosSemana(d, h) {
  const pre = datosAgenda.peekBlocked(d, h); if (pre) return Promise.resolve(pre);
  return bloqueadosSemanaBase(d, h);
}

// ---- Cinta: datos, «⋯» de cada día y semana desplegada, de una vez
















// «Ver la semana» aparece de una vez: se pinta escondida y se enseña ya con sus días (antes salía vacía y se llenaba)





// «Tu día» está en src/app/screens/agenda/your-day (v2.397.0); el nombre se queda porque lo llaman mucho código antiguo
function pintarTuDia() { return window.delcos.screens.agenda.paintYourDay(); }




// ---- Elegir otro día: todo lo que cambia (Tu día, bandejas, cinta, «Tu semana», la semana abierta) aparece a la vez


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

// La ventana «Nueva cita» está en src/app/screens/agenda/editors/appointment-editor.ts (v2.400.0); el nombre se queda porque
// la abren siete archivos antiguos (ficha, ciclo, configuración, parque…).
function nuevaCita(medicoId, fecha, op = {}) { return window.delcos.screens.agenda.newAppointment(medicoId, fecha, op); }

// La jornada, reprogramar, el menú del día y el origen de la cita están en src/app/screens/agenda (v2.414.0). Estos nombres
// se quedan: Rutas y las pruebas los usan.
function jornadaActiva() { return window.delcos.screens.agenda.activeWorkingDay(); }
function empezarJornada() { return window.delcos.screens.agenda.startWorkingDay(); }
function terminarJornada() { return window.delcos.screens.agenda.endWorkingDay(); }
function textoOrigenCita(c) { return window.delcos.screens.agenda.originText(c); }
