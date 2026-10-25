/* ============================================================
   DLC OS 2.0 · Entrega 4: agenda, rutas, plan del día y cola sin conexión
   ============================================================ */

/* ---------------- cola sin conexión ---------------- */


function pintarConexionBase() {
  const n = colaLeer().length;
  const el = $('conex');
  if (!navigator.onLine) { el.className = 'conex off'; el.textContent = n ? `Sin conexión · ${n} ${n === 1 ? 'cambio' : 'cambios'} en espera` : 'Sin conexión'; }
  else if (n) { el.className = 'conex esp'; el.textContent = `Enviando ${n} ${n === 1 ? 'cambio' : 'cambios'}…`; }
  else { el.className = 'conex hide'; el.textContent = ''; }
}



window.addEventListener('online', () => { pintarConexion(); vaciarCola(); });
window.addEventListener('offline', () => pintarConexion());
setInterval(() => vaciarCola(), 60000);

/* ---------------- agenda ---------------- */

let AG_MODO = 'dia', AG_FECHA = null;


/* Agenda: pinta la vista base (día, semana o mes) y le añade, en orden, lo que antes eran 8 capas separadas. */

/* Vista base de la agenda (día, semana o mes); cargarAgenda le añade el resto */

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-ag="nueva"]');
  if (b) { nuevaCita(null, AG_FECHA); return; }
  const c = e.target.closest('[data-cita]');
  if (!c) return;
  const [acc, id, extra] = c.dataset.cita.split('|');
  if (acc === 'hora') return window.delcos.screens.agenda.changeTime(id, extra);
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



