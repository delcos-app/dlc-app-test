/* ============================================================
   DLC OS 2.0 · Entrega 4: agenda, rutas, plan del día y cola sin conexión
   ============================================================ */

/* ---------------- cola sin conexión ---------------- */

const COLA = 'dlc-cola';
const colaLeer = () => { try { return JSON.parse(localStorage.getItem(COLA) || '[]'); } catch (e) { return []; } };
const colaGuardar = c => localStorage.setItem(COLA, JSON.stringify(c));

function pintarConexion() {
  const n = colaLeer().length;
  const el = $('conex');
  if (!navigator.onLine) { el.className = 'conex off'; el.textContent = n ? `Sin conexión · ${n} ${n === 1 ? 'cambio' : 'cambios'} en espera` : 'Sin conexión'; }
  else if (n) { el.className = 'conex esp'; el.textContent = `Enviando ${n} ${n === 1 ? 'cambio' : 'cambios'}…`; }
  else { el.className = 'conex hide'; el.textContent = ''; }
}


async function vaciarCola() {
  if (!navigator.onLine) return;
  let c = colaLeer();
  if (!c.length) return;
  const habia = c.length;
  pintarConexion();
  while (c.length) {
    const op = c[0];
    const { error } = await db.rpc(op.fn, op.payload);
    if (error && String(error.message || '').match(/fetch|network|Failed/i)) break;
    c = c.slice(1);
    colaGuardar(c);
  }
  pintarConexion();
  if (colaLeer().length < habia) { invalidarCache(); cargarInicio(); if (TAB === 'agenda') cargarAgenda(); }
}

window.addEventListener('online', () => { pintarConexion(); vaciarCola(); });
window.addEventListener('offline', () => pintarConexion());
setInterval(() => vaciarCola(), 60000);

/* ---------------- agenda ---------------- */

let AG_MODO = 'dia', AG_FECHA = null;

const isoMas = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoLocal(d); };
const lunesDe = iso => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoLocal(d); };
const EST_COL = { Planificada: 'var(--navy)', Visitada: 'var(--ok)', Pendiente: 'var(--warn)', Reprogramada: 'var(--sky)', Descartada: 'var(--muted)' };

/* Agenda: pinta la vista base (día, semana o mes) y le añade, en orden, lo que antes eran 8 capas separadas. */

/* Vista base de la agenda (día, semana o mes); cargarAgenda le añade el resto */

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-ag="nueva"]');
  if (b) { nuevaCita(null, AG_FECHA); return; }
  const c = e.target.closest('[data-cita]');
  if (!c) return;
  const [acc, id, extra] = c.dataset.cita.split('|');
  if (acc === 'hora') return cambiarHoraCita(id, extra);
  if (acc === 'ficha') return abrirFicha(id);
  if (acc === 'visita') return abrirVisita(id);
  if (acc === 'desc') {
    const r = await escribir('estado_cita', { p_id: id, p_estado: 'Descartada' });
    if (r && r.error) { toast('No se ha podido descartar: ' + r.error.message, true); return; }
    toast('Cita descartada'); cargarAgenda(); cargarInicio(); return;
  }
  if (acc === 'borrar') {
    if (!await preguntar('La cita desaparece de la agenda sin dejar rastro.', { titulo: '¿Eliminar la cita?', ok: 'Eliminar', peligro: true })) return;
    const { data: r } = await db.rpc('borrar_cita', { p_id: id });
    if (r && r.ok === false) {
      toast(r.error === 'visitada' ? `No se puede borrar ${TT('visita', 's', 'un', 'l', 'l')} ya realizada`
        : r.error === 'pasada' ? 'Solo se pueden borrar citas futuras' : 'No se ha podido borrar', true);
      return;
    }
    toast('Cita borrada'); cargarAgenda(); cargarInicio(); return;
  }
  if (acc === 'hoy') {
    await escribir('estado_cita', { p_id: id, p_estado: 'Planificada', p_fecha: hoyISO() });
    toast('Movida a hoy'); cargarAgenda(); cargarInicio(); return;
  }
  if (acc === 'repro') {
    const f = await pedirFecha('¿A qué día la mueves?', isoMas(hoyISO(), 1), { titulo: 'Reprogramar cita', ok: 'Mover' });
    if (!f) return;
    await escribir('estado_cita', { p_id: id, p_estado: 'Reprogramada', p_fecha: f });
    toast('Cita movida al ' + fechaCorta(f)); cargarAgenda(); return;
  }
});

/* ---------------- rutas y plan del día ---------------- */

let RUTAS = [], PLAN = null;

document.addEventListener('click', e => {
  const b = e.target.closest('[data-ruta]');
  if (b && !b.onclick) planificar(b.dataset.ruta, b);   // v2.203.0: los que tienen su propio clic no se lanzan dos veces
});

/* distancia aproximada en km entre dos puntos */
function km(a, b) {
  if (!a || !b || a[0] == null || b[0] == null) return 0;   // sin punto de salida no hay desplazamiento que contar
  const R = 6371, r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
// v2.175.0 (decisión de Eric: autopista a 120 km/h): los primeros 30 km en línea recta a 40 km/h (ciudad) y lo que pase de 30 km a 100 km/h en línea
// recta (la carretera es ~1,2 veces más larga: unos 120 km/h por autopista); antes, todo a 40
const minutosEntre = (a, b) => { if (!a || !b || a[0] == null || b[0] == null) return 0; const d = km(a, b);
  return Math.max(6, Math.round(Math.min(d, 30) / 40 * 60 + Math.max(d - 30, 0) / 100 * 60) + 5); };
const hm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(Math.round(m) % 60).padStart(2, '0');

async function planificar(rutaId, btn) {
  const orig = btn.textContent; btn.disabled = true; btn.textContent = 'Calculando…';
  const { data, error } = await db.rpc('cuentas_de_ruta', { p_id: rutaId });
  btn.disabled = false; btn.textContent = orig;
  if (error) { toast('No se ha podido planificar: ' + error.message, true); return; }
  const conXY = (data || []).filter(m => m.lat && m.lon);
  if (!conXY.length) { toast(`Esta ruta no tiene ${TT('medico', 'p', '', 'l', 'l')} con ubicación`, true); return; }
  construirPlan(conXY, rutaId, btn);
}

/* pintarPlan: la parte base y, en orden, cada paso que se le añade (antes eran 6 capas separadas). */
function pintarPlan() {
  pintarPlanBase();
  planBotonesAgenda();
  planHorasYFueraDePlan();
  planMapaYDescartar();
  planVisitadosRecientes();
  planAvisoSinSalida();
  planFichasYNotas();
}








/* ---------------- añadir cita desde la ficha ---------------- */

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-agendar]');
  if (!b) return;
  const f = await pedirFecha('¿Qué día quieres visitarle?', hoyISO(), { titulo: 'Añadir a mi agenda', ok: 'Añadir' });
  if (!f) return;
  const r = await escribir('guardar_cita', { p: {
    cuenta_id: b.dataset.agendar, fecha: f, estado: 'Planificada', origen: 'Ficha',
    op_id: 'c-' + b.dataset.agendar + '-' + f
  }});
  if (r.error) { toast('No se ha podido: ' + r.error.message, true); return; }
  toast('Añadido a tu agenda el ' + fechaCorta(f));
  cargarInicio();
});



