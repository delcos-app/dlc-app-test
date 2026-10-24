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

/** Ejecuta una escritura; si no hay conexión, la guarda y la reenvía después. */
async function escribir(fn, payload, etiqueta) {
  if (!navigator.onLine) {
    colaGuardar(colaLeer().concat([{ fn, payload: marcarSinConexion(fn, payload), etiqueta, t: Date.now() }]));
    pintarConexion();
    toast('Sin conexión: se enviará al recuperarla');
    return { offline: true };
  }
  const { data, error } = await db.rpc(fn, payload);
  if (error) {
    if (String(error.message || '').match(/fetch|network|Failed/i)) {
      colaGuardar(colaLeer().concat([{ fn, payload: marcarSinConexion(fn, payload), etiqueta, t: Date.now() }]));
      pintarConexion();
      toast('Guardado en este dispositivo: se enviará luego');
      return { offline: true };
    }
    return { error };
  }
  return { data };
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

function planBotonesAgenda() {
  if ($('planag')) $('planag').onclick = async ev => {
    ev.target.disabled = true;
    const r = await planAAgenda(PLAN);
    ev.target.disabled = false;
    if (!r) return;
    toast(`${r.n} citas en tu agenda del ${fechaCorta(r.fecha)}`);
    AG_MODO = 'dia'; AG_FECHA = r.fecha; PLAN = null; ir('agenda');
  };
  if ($('planempezar')) { $('planempezar').textContent = '▶ Pasar a mi agenda y empezar'; $('planempezar').onclick = empezarRuta; }
  if ($('planag')) $('planag').textContent = 'Guardar en mi agenda';
}

function planHorasYFueraDePlan() {
  if (!PLAN || !$('rplan')) return;
  // Hora de cada médico y su franja de consulta
  $('rplan').querySelectorAll('.lista > .item').forEach((el, i) => {
    const p = PLAN.paradas[i]; if (!p) return;
    const linea = el.querySelectorAll('.tx .sm')[1];
    if (linea) linea.innerHTML = p.medicos.map(m => `<span class="pmed"><b>${m.horaPlan != null ? hm(m.horaPlan) : ''}</b> ${esc(m.nombre)}${
      m.ventanas && m.ventanas.length ? ` <span class="pvent">atiende ${txtVentanas(m.ventanas)}</span>` : ''}</span>`).join('');
  });
  const fuera = PLAN.fuera || [];
  if (fuera.length) {
    $('rplan').querySelector('.card .lista').insertAdjacentHTML('afterend', `<div class="planfuera">
      <h3>Se quedan fuera · ${fuera.length}</h3>
      <div class="lista">${fuera.map((f, i) => `<div class="item ${i >= 30 ? 'extra' : ''}" style="cursor:default">
        <span class="ic w">!</span><span class="tx"><b>${esc(f.m.nombre)}</b>
          <span class="sm">${esc(f.motivo)}${f.m.municipio ? ' · ' + esc(f.m.municipio) : ''}</span></span></div>`).join('')}
        ${fuera.length > 30 ? `<button class="vermas" type="button" data-vermas>Ver los ${fuera.length - 30} restantes</button>` : ''}</div></div>`);
  }
}

function planMapaYDescartar() {
  if (!PLAN || !$('rplan')) return;
  const fuera = $('rplan').querySelector('.planfuera'), mapa = $('planmapa');
  if (fuera && mapa) mapa.insertAdjacentElement('afterend', fuera);
  if ($('plancerrar')) { $('plancerrar').textContent = '✕ Descartar plan'; $('plancerrar').title = 'Descarta este plan (la ruta guardada no cambia)'; }
  if ($('planver')) $('planver').onclick = () => {
    const m = $('planmapa');
    if (m.dataset.on && m.style.height !== '0px') {
      m.style.height = '0px'; m.style.marginTop = '0'; $('planver').textContent = 'Ver la ruta en el mapa';
    } else {
      mapaDelPlan(); m.style.height = 'min(55vh,460px)'; m.style.marginTop = '12px'; $('planver').textContent = 'Ocultar el mapa';
    }
  };
}

function planVisitadosRecientes() {
  if (!PLAN || !$('rplan') || PLAN.__recientes === undefined && !PLAN.__pedido) {
    if (PLAN && !PLAN.__pedido) {
      PLAN.__pedido = true;
      const ids = PLAN.paradas.flatMap(p => p.medicos.map(m => m.id));
      recientesDe(ids, PLAN.fecha || hoyISO()).then(por => { if (!PLAN) return; PLAN.__recientes = por; pintarPlan(); });
    }
    return;
  }
  const por = PLAN.__recientes || {};
  const ids = Object.keys(por);
  if (!ids.length) return;
  $('rplan').querySelectorAll('.pmed').forEach(el => {
    const m = PLAN.paradas.flatMap(p => p.medicos).find(x => el.textContent.includes(x.nombre));
    if (m && por[m.id] && !el.querySelector('.prec')) el.insertAdjacentHTML('beforeend', ` <span class="prec">⚠ ${esc(txtReciente(por[m.id].slice(0, 2)))}</span>`);
  });
  const card = $('rplan').querySelector('.card');
  if (card && !$('planrec')) {
    card.querySelector('h2').insertAdjacentHTML('afterend', `<div class="avisoh" id="planrec"><span>⚠ ${ids.length} ${ids.length === 1 ? `${TT('medico', 's', '', 'l', 'l')} del plan ya se ha` : `${TT('medico', 'p', '', 'l', 'l')} del plan ya se han`} visitado o tienen cita en los últimos ${avisoRevisita().dias} días.</span>
      <button class="btn sec" id="planquitar">Quitarlos del plan</button></div>`);
    $('planquitar').onclick = () => {
      const u = ULTIMO_PLAN; if (!u) return;
      construirPlan(u.conXY.filter(m => !ids.includes(m.id)), u.rutaId, null, u.opts);
    };
  }
}

function planAvisoSinSalida() {
 if (PLAN && $('rplan')) avisoSinSalida($('rplan').querySelector('.card'));
}

function planFichasYNotas() {
  if (!PLAN || !$('rplan')) return;
  const items = $('rplan').querySelectorAll('.lista > .item');
  PLAN.paradas.forEach((p, i) => {
    const it = items[i]; if (!it || it.dataset.ext) return;
    it.dataset.ext = '1';
    const tx = it.querySelector('.tx'), meds = tx.querySelectorAll('.sm')[1];
    if (meds) meds.innerHTML = p.medicos.map(m => `<button type="button" class="lnkmed" data-pfm="${m.id}" title="Abrir la ficha">${esc(m.nombre)}</button>`).join('');
    if (p.nota) tx.insertAdjacentHTML('beforeend', `<span class="sm notapar">📝 ${esc(p.nota)}</span>`);
    const acts = it.querySelector('.acts');
    acts.insertAdjacentHTML('afterbegin', `${p.medicos.length === 1 ? `<button class="btn sec" data-pfm="${p.medicos[0].id}">Ficha</button>` : ''}<button class="btn sec" data-pnota="${i}">${p.nota ? 'Editar nota' : 'Nota'}</button>`);
  });
  $('rplan').querySelectorAll('[data-pfm]').forEach(b => b.onclick = () => abrirFicha(b.dataset.pfm));
  $('rplan').querySelectorAll('[data-pnota]').forEach(b => b.onclick = async () => {
    const p = PLAN.paradas[+b.dataset.pnota];
    const t = await pedirTexto(`Se guardará en la cita de cada ${TT('medico', 's', '', 'l', 'l')} de esta parada al pasar el plan a tu agenda.`, p.nota || '', { titulo: 'Nota para ' + p.centro, ok: 'Guardar nota', tipo: 'area' });
    if (t === null) return; p.nota = t.trim(); pintarPlan();
  });
}

function pintarPlanBase() {
  if (!PLAN) { $('rplan').innerHTML = ''; return; }
  const total = PLAN.paradas.reduce((n, p) => n + p.medicos.length, 0);
  const ultima = PLAN.paradas[PLAN.paradas.length - 1];
  // Ruta completa: todas las paradas y la vuelta a la salida (o termina en la última parada si no hay salida con ubicación)
  const conCasa = PLAN.salida.lat != null;
  const rutaDest = conCasa ? [PLAN.salida.lat, PLAN.salida.lon] : ultima.xy;
  const rutaParadas = conCasa ? PLAN.paradas.map(p => p.xy) : PLAN.paradas.slice(0, -1).map(p => p.xy);

  $('rplan').innerHTML = `<div class="card">
    <h2>${PLAN.fecha && PLAN.fecha !== hoyISO() ? 'Plan para el ' + fechaLarga(new Date(PLAN.fecha + 'T00:00:00')) : 'Plan de hoy'}<span class="n">${total} ${TT('medico', total === 1 ? 's' : 'p', '', 'l', 'l')}</span></h2>
    <p class="sm">Salida de ${esc(PLAN.salida.nombre)} a las ${PLAN.inicio != null ? hm(PLAN.inicio) : PLANCFG().salida} · ${PLAN.paradas.length} ${PLAN.paradas.length === 1 ? 'parada' : 'paradas'} ·
      vuelta sobre las ${hm(PLAN.fin)} · <button class="kcfg" id="planhora">⚙ Cambiar horario</button></p>
    <div class="lista">${PLAN.paradas.map((p, i) => `<div class="item" style="cursor:default">
      <span class="ic">${i + 1}</span>
      <span class="tx"><b>${esc(p.centro)}</b>
        <span class="sm">${hm(p.llegada)}–${hm(p.fin)} · ${esc([p.dir, p.municipio].filter(Boolean).join(', '))} · ${p.medicos.length} ${TT('medico', p.medicos.length === 1 ? 's' : 'p', '', 'l', 'l')}</span>
        <span class="sm">${p.medicos.map(m => esc(m.nombre)).join(' · ')}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" type="button" data-nav="${navAttr(p.xy)}">Ir</button></span>
    </div>`).join('')}</div>
    <div id="planmapa" style="height:0;margin:0 16px;border-radius:12px;overflow:hidden"></div>
    <div class="acts" style="padding:12px 16px 16px">
      <button class="btn sec" id="planver">Ver la ruta en el mapa</button>
      <button class="btn" type="button" data-nav="${navAttr(rutaDest, rutaParadas)}">Abrir la ruta en el navegador</button>
      <button class="btn sec" id="planag">Guardar en mi agenda</button>
      ${!PLAN.fecha || PLAN.fecha === hoyISO() ? '<button class="btn" id="planempezar">▶ Empezar ruta</button>' : ''}
      <button class="btn sec" id="plancerrar">Cerrar</button>
    </div></div>`;

  $('plancerrar').onclick = () => { PLAN = null; pintarPlan(); };
  $('planver').onclick = e => { mapaDelPlan(); e.target.classList.add('hide'); };
  if ($('planhora')) $('planhora').onclick = abrirHorarioPlan;
  if ($('planempezar')) $('planempezar').onclick = () => empezarRuta();
  $('planag').onclick = async ev => {
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    let n = 0;
    for (const p of PLAN.paradas) {
      for (const m of p.medicos) {
        await escribir('guardar_cita', { p: {
          cuenta_id: m.id, fecha: PLAN.fecha || hoyISO(), hora: hm(p.llegada), centro_nombre: p.centro,
          estado: 'Planificada', origen: 'Plan del día',
          op_id: 'c-' + m.id + '-' + (PLAN.fecha || hoyISO())
        }});
        n++;
      }
    }
    ev.target.disabled = false; ev.target.textContent = 'Guardar en mi agenda';
    toast(`${n} citas guardadas en tu agenda`);
    cargarInicio();
  };
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



