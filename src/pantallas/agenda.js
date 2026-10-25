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
  if (resto.some((c, k) => c !== ab[k])) { await guardarOrden(resto); if (typeof RC !== 'undefined' && RC.delete) RC.delete('agenda-' + fecha); }
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

async function pintarSemanaAgenda() {
  const desde = lunesDe(AG_FECHA), hasta = isoMas(desde, 6);
  const filtro = agUsuarioFiltro(), uid = agUid();
  const [r, bloq] = await Promise.all([
    rpcCache('agenda_rango', { p_desde: desde, p_hasta: hasta, p_usuario: filtro }, 'agenda-' + desde),
    bloqueadosSemana(desde, hasta)
  ]);
  if (AG_MODO !== 'semana') return;
  const porDia = {};
  (r.data || []).forEach(c => (porDia[c.fecha] = porDia[c.fecha] || []).push(c));
  const dias = Array.from({ length: 7 }, (_, i) => isoMas(desde, i));
  const borr = SEM_BORRADOR && SEM_BORRADOR.semana === desde && SEM_BORRADOR.uid === uid ? SEM_BORRADOR : null;
  const hayFuturo = dias.some(f => f >= hoyISO());
  const cfg = PLANCFG();

  $('agcuerpo').innerHTML = `
    <div class="semhead"><h2 style="padding:0">Semana del ${fechaCorta(desde)} al ${fechaCorta(hasta)}${AG_VISTA ? ` · ${esc(AG_VISTA.nombre)}` : ''}</h2>
      ${hayFuturo && !borr ? '<button class="btn" id="semplan">Planificar la semana</button>' : ''}</div>
    ${borr ? `<div class="semborr">
      <span><b>Propuesta sin guardar</b> · ${num(borr.total)} ${TT('visita', 'p', '', 'l', 'l', 'nuevo')} en ${Object.keys(borr.dias).filter(f => borr.dias[f].length).length} días${borr.sinDia.length ? ` · ${borr.sinDia.length} sin día` : ''}</span>
      <span class="acts" style="margin:0"><button class="btn sec" id="semdescartar">Descartar</button><button class="btn" id="semguardar">Guardar en la agenda</button></span></div>` : ''}
    <div class="semwrap"><div class="mes sem">
      ${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span class="mesdow">${d}</span>`).join('')}
      ${dias.map(f => {
        const todas = (porDia[f] || []).filter(c => !['Descartada', 'Aplazada'].includes(c.estado));
        const mias = todas.filter(c => c.usuario_id === uid);
        const nuevas = borr ? (borr.dias[f] || []) : [];
        const hechas = todas.filter(c => c.estado === 'Visitada').length;
        const d = new Date(f + 'T12:00:00');
        const abiertas = mias.filter(c => CITA_ABIERTA.includes(c.estado));
        let carga = '';
        if ((abiertas.length || nuevas.length) && f >= hoyISO()) {
          const { fin, tope } = estimarDia(mias.concat(nuevas.map(n => Object.assign({ estado: 'Planificada' }, (SEM_BORRADOR && SEM_BORRADOR.horario) || {}, n.cita))), f);
          carga = `<span class="semcarga ${fin > tope ? 'pasa' : ''}" title="Hora de fin estimada${fin > tope ? ': pasa de la hora de vuelta ' + hm(tope) : ''}">~${hm(fin)}</span>`;
        }
        return `<div class="mesdia semdia ${f === hoyISO() ? 'hoy' : ''} ${d.getDay() === 0 || d.getDay() === 6 ? 'finde' : ''} ${bloq[f] ? 'bloq' : ''}" data-semdia="${f}" role="button" tabindex="0">
          <div class="semcab"><b>${d.getDate()}</b>${todas.length ? `<span class="mespunto">${hechas}/${todas.length}</span>` : ''}${carga}
            <button class="semmas" data-semmenu="${f}" aria-label="Opciones del ${fechaCorta(f)}" title="Opciones del día">⋯</button></div>
          ${bloq[f] ? `<span class="sembloq">🚫 ${esc(bloq[f])}</span>` : ''}
          <div class="semcitas">${todas.slice(0, 9).map(c => {
            const mover = c.usuario_id === uid && CITA_ABIERTA.includes(c.estado) && c.fecha >= hoyISO();
            return `<span class="semcita" data-semficha="${c.cuenta_id}" ${mover ? `draggable="true" data-semcid="${c.id}"` : ''}
              title="${esc(c.nombre)} · ${esc(c.estado)}${mover ? ' · arrástrala a otro día para moverla' : ''}" style="border-left-color:${EST_COL[c.estado] || 'var(--muted)'}">
              ${c.hora ? `<i>${esc(String(c.hora).slice(0, 5))}</i>` : ''}${esc(String(c.nombre).split(',')[0])}${c.usuario_id !== uid && c.usuario ? ` <em>${esc(iniciales(c.usuario))}</em>` : ''}</span>`;
          }).join('')}
            ${nuevas.map(n => `<span class="semcita nueva" title="Propuesta: ${esc(n.m.nombre)}${n.ini != null ? ' · ~' + hm(n.ini) : ''}"><i>~${n.ini != null ? hm(n.ini) : ''}</i>${esc(String(n.m.nombre).split(',')[0])}</span>`).join('')}
            ${todas.length > 9 ? `<span class="sm">y ${todas.length - 9} más</span>` : ''}</div>
        </div>`;
      }).join('')}
    </div></div>
    ${borr && borr.sinDia.length ? `<div class="planfuera" style="margin:0 16px 16px"><h3>Se quedan sin día · ${borr.sinDia.length}</h3>
      <div class="lista">${borr.sinDia.slice(0, 25).map(x => `<div class="item" style="cursor:default"><span class="ic w">!</span>
        <span class="tx"><b>${esc(x.m.nombre)}</b><span class="sm">${esc(x.motivo)}${x.m.municipio ? ' · ' + esc(x.m.municipio) : ''}</span></span></div>`).join('')}
        ${borr.sinDia.length > 25 ? `<div class="sm" style="padding:6px 12px">y ${borr.sinDia.length - 25} más</div>` : ''}</div></div>` : ''}`;

  if ($('semplan')) $('semplan').onclick = () => planificarSemana(desde, dias, bloq, porDia);
  if ($('semdescartar')) $('semdescartar').onclick = () => { SEM_BORRADOR = null; cargarAgenda(); };
  if ($('semguardar')) $('semguardar').onclick = e => guardarBorradorSemana(e.target);

  $('agcuerpo').querySelectorAll('[data-semdia]').forEach(el => {
    const abrir = e => {
      const mm = e.target.closest('[data-semmenu]');
      if (mm) { menuDiaSemana(mm, mm.dataset.semmenu, !!bloq[mm.dataset.semmenu]); return; }
      if (e.target.closest('.semcita.nueva')) return;
      if (e.target.closest('[data-semficha]')) { abrirFicha(e.target.closest('[data-semficha]').dataset.semficha); return; }
      AG_FECHA = el.dataset.semdia; AG_MODO = 'dia'; cargarAgenda();
    };
    el.onclick = abrir; el.onkeydown = e => { if (e.key === 'Enter') abrir(e); };
    // Soltar una cita arrastrada
    el.ondragover = e => { if (e.dataTransfer.types.includes('text/cita')) { e.preventDefault(); el.classList.add('sobre'); } };
    el.ondragleave = () => el.classList.remove('sobre');
    el.ondrop = async e => {
      e.preventDefault(); el.classList.remove('sobre');
      const id = e.dataTransfer.getData('text/cita'), destino = el.dataset.semdia;
      const c = (r.data || []).find(x => x.id === id);
      if (!c || c.fecha === destino) return;
      if (destino < hoyISO()) { toast('No se puede mover a un día pasado', true); return; }
      const avisos = [];
      if (bloq[destino]) avisos.push(`ese día está bloqueado (${bloq[destino]})`);
      const v = ventanasDe(c.dias, destino);
      if (v && !v.length) avisos.push('ese día no atiende');
      if (avisos.length && !await preguntar(`${c.nombre}: ${avisos.join(' y ')}.`, { titulo: '¿Moverla igualmente?', ok: 'Mover' })) return;
      const { data: rr, error } = await db.rpc('estado_cita', { p_id: id, p_estado: c.estado, p_fecha: destino });
      if (error || (rr && rr.ok === false)) { toast('No se ha podido mover', true); return; }
      toast('Movida al ' + fechaCorta(destino)); cargarAgenda();
    };
  });
  $('agcuerpo').querySelectorAll('[data-semcid]').forEach(ch => {
    ch.ondragstart = e => { e.dataTransfer.setData('text/cita', ch.dataset.semcid); e.dataTransfer.effectAllowed = 'move'; ch.classList.add('arrastrando'); };
    ch.ondragend = () => ch.classList.remove('arrastrando');
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
function agDiaVacio() {
  const c = $('agcuerpo'); if (!c || TAB !== 'agenda') return;
  const v = c.querySelector(':scope > .vacio'), st = c.querySelector('.tdhead .tdstats');
  const sinCitas = !!v && !c.querySelector('.tdesc');
  if (st) st.classList.toggle('hide', sinCitas);
  if (!v) return;
  v.classList.add('vlinea');
  if (AG_FECHA < hoyISO()) v.textContent = 'No tuviste citas este día.';
}

async function tareasDelDia(f) {
  if (AG_VISTA && AG_VISTA.id !== PERFIL.id) return null;   // las tareas son de cada uno: en la agenda de otra persona no se ven
  if (TAREAS_DIA && TAREAS_DIA.f === f) return TAREAS_DIA.l;
  const { data, error } = await db.from('tareas').select('*').eq('fecha', f).order('orden', { ascending: true, nullsFirst: false }).order('hora', { ascending: true, nullsFirst: false }).order('creado_en');
  if (error) return null;
  TAREAS_DIA = { f, l: data || [] };
  return TAREAS_DIA.l;
}

function agCambiosEnVentana() { return RC_EPOCA !== DLG_EPOCA; }

function agOlvidarAgenda() { for (const k of [...RC.keys()]) if (k.startsWith('agenda_')) { RC.delete(k); RC_VUELO.delete(k); } }

// Lo que antes era «cargar la agenda entera» tras un cambio: en la vista del día, solo lo que cambia
function agRefrescoQuieto(id, o = {}) {
  if (TAB !== 'agenda' || !agUnida() || !$('agcuerpo')) { cargarAgenda(); cargarInicio(); pintarRutaBarra(); return; }
  DLG_EPOCA = RC_EPOCA;                                       // lo guardado ya se refleja aquí: cerrar la ventana no vuelve a refrescar
  if (id) AGQ_ID = id;
  clearTimeout(AGQ_T);
  AGQ_T = setTimeout(async () => {
    const i = AGQ_ID; AGQ_ID = null;
    await repintarDiaSuave(i);
    if (o.cifras !== false) agCifrasQuietas();
    pintarRutaBarra();
  }, 40);
}

/* v2.190.0 · Tareas en el orden de cada uno (petición de Eric): flechas ↑ ↓ en cada tarea (con más de una) que la suben o la bajan al momento,
   deslizándose a su sitio como las citas, y guardan el orden por detrás (ordenar_tareas, SQL 117; tareasDelDia ordena por orden, hora y alta).
   Sin hora, la tarea ya no enseña el puntito «·» junto a la casilla. */
async function moverTarea(id, dir) {
  const l = TAREAS_DIA && TAREAS_DIA.f === AG_FECHA ? TAREAS_DIA.l : null; if (!l) return;
  const i = l.findIndex(t => t.id === id), j = i + dir; if (i < 0 || j < 0 || j >= l.length) return;
  const nuevo = l.slice(); [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
  nuevo.forEach((t, k) => { t.orden = k + 1; });
  TAREAS_DIA = { f: AG_FECHA, l: nuevo };
  const antes = new Map();
  document.querySelectorAll('#tdtareas .tdtarea').forEach(d => antes.set(d.dataset.tarea, d.getBoundingClientRect().top));
  await repintarDiaSuave(null, TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA ? TD_ULTIMO.data : undefined);
  const quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('#tdtareas .tdtarea').forEach(d => {
    if (d.dataset.tarea === id) { d.classList.remove('tdmovida'); void d.offsetWidth; d.classList.add('tdmovida'); setTimeout(() => d.classList.remove('tdmovida'), 1300); }
    const y0 = antes.get(d.dataset.tarea); if (quieto || y0 == null || !d.animate) return;
    const dy = y0 - d.getBoundingClientRect().top;
    if (Math.abs(dy) > 1) d.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
  });
  const b = document.querySelector(`#tdtareas [data-tamov="${dir}|${id}"]:not([disabled])`) || document.querySelector(`#tdtareas [data-tamov$="|${id}"]:not([disabled])`);
  if (b) b.focus({ preventScroll: true });
  const { data: r, error } = await db.rpc('ordenar_tareas', { p_ids: nuevo.map(t => t.id) });
  if (error || (r && r.ok === false)) { toast('No se ha podido guardar el orden', true); TAREAS_DIA = null; agRefrescoQuieto(null, { cifras: false }); }
}

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


// Agenda · las citas cerradas no tienen menú (salvo «Volver a planificarla» de hoy en adelante)
// (sin escribir estados: se pregunta al propio menú si tiene algo que ofrecer)
function citaConMenu(c) {
  if (CITA_ABIERTA.includes(c.estado)) return true;
  let hay = false; AVISOS_MUDOS = true;   // sin avisos mientras se pregunta al menú
  try { menuCita(document.body, c); hay = !!document.querySelector('.tdmenu'); } catch (e) { hay = true; }
  finally { AVISOS_MUDOS = false; document.querySelectorAll('.tdmenu').forEach(m => m.remove()); }
  return hay;
}

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

function tdDiasDesde(f) { return Math.max(0, Math.round((new Date(hoyISO() + 'T12:00:00') - new Date(String(f).slice(0, 10) + 'T12:00:00')) / 864e5)); }

async function tdPintar() {
  const fecha = AG_FECHA, hoy = hoyISO(), esHoy = fecha === hoy, pasado = fecha < hoy;
  const r = await rpcCache('agenda_rango', { p_desde: fecha, p_hasta: fecha, p_usuario: agUsuarioFiltro() }, 'agenda-' + fecha);
  if (AG_FECHA !== fecha || AG_MODO !== 'dia' || !$('agcuerpo')) return;
  const todas = r.data || [];
  const mias = todas.filter(c => c.usuario_id === agUid()), otras = todas.filter(c => c.usuario_id !== agUid());
  TD_CITAS = mias;
  const { est, fin, tope } = estimarDia(mias, fecha);
  const j = jornadaActiva();
  const abiertasL = mias.filter(c => CITA_ABIERTA.includes(c.estado)), abiertas = abiertasL.length;
  const activas = mias.filter(c => !citaAnulada(c.estado)).length;
  const hechas = mias.filter(c => citaHecha(c.estado)).length, ausentes = mias.filter(c => citaAusente(c.estado)).length;
  const pasaTope = abiertas && fin > tope;
  const conSitio = abiertasL.filter(c => xyCita(c)).length;
  const propia = !AG_VISTA || AG_VISTA.id === PERFIL.id;
  const vis = TT('visita', 's', '', 'l', 'l');
  // «No cabe»: si con este orden el día acaba después de la jornada (o hay 3 avisos o más), un solo aviso arriba
  const limite = isFinite(tope) ? tope : 21 * 60;
  const conAviso = Object.values(TD_INFO).filter(i => i.aviso && !i.lejos).length;
  const noCabe = !pasado && abiertas && fin > limite, bandaNoCabe = !pasado && abiertas && (noCabe || conAviso >= 3);
  const fuera = Object.values(TD_INFO).filter(i => i.llegada != null && i.llegada >= limite).length;
  const finTxt = fin >= 24 * 60 ? `pasada la medianoche (hacia las ${hm(fin)} del día siguiente)` : `hacia las ${hm(fin)}`;
  // Siguiente cita (hoy): la primera abierta que no haya pasado hace más de 15 minutos
  const ahora = (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();
  const minDe = c => c.hora ? (+String(c.hora).slice(0, 2) * 60 + +String(c.hora).slice(3, 5)) : (est[c.id] != null ? est[c.id] : null);
  const sig = esHoy ? (abiertasL.find(c => { const m = minDe(c); return m == null || m + 15 >= ahora; }) || null) : null;
  const escala = ESTADOS_DEF.filter(x => x.papel !== 'negativo');

  const tarjeta = (c, i) => {
    const ab = CITA_ABIERTA.includes(c.estado), info = TD_INFO[c.id] || {}, ant = c.anterior || null;
    const idxAb = abiertasL.indexOf(c);
    let h = c.hora ? tdHm(c.hora) : (ab && est[c.id] != null && !pasado ? '~' + hm(est[c.id]) : '·');
    if (bandaNoCabe && !c.hora && ab && info.llegada != null && info.llegada >= limite) h = '—';
    const m = minDe(c), falta = m != null ? m - ahora : null;
    const cuando = !ab ? '' : c === sig && falta != null && falta > 0 ? `en ${falta >= 60 ? Math.floor(falta / 60) + ' h ' : ''}${falta % 60} min` : /^~/.test(h) ? 'Hora estimada' : '';
    const nivel = escala.findIndex(x => x.valor === c.estado_comercial), obj = nivel >= 0 ? escala[nivel + 1] : null;
    // El aviso: el de ubicación lejana siempre; los demás, solo si no hay el aviso general de «no cabe»
    let aviso = ab && info.aviso ? (info.lejos ? `Ubicación a ${num(info.lejos)} km de la parada anterior: revisa la dirección` : info.aviso) : '';
    if (aviso && bandaNoCabe && !info.lejos) aviso = '';
    const vent = ab && !aviso && info.ventanas && info.ventanas.length ? `Atiende ${txtVentanas(info.ventanas)}${info.espera ? ` · esperas ${info.espera} min` : ''}` : '';
    const lineas = [
      ant && ant.proxima_accion ? ['toca', 'toca', `Toca: ${esc(ant.proxima_accion)}`] : null,
      c.anterior !== undefined ? ['reloj', '', ant ? `Última ${vis} hace ${tdDiasDesde(ant.fecha)} ${tdDiasDesde(ant.fecha) === 1 ? 'día' : 'días'}` : `Primera ${vis}`] : null,
      vent ? ['puerta', '', esc(vent)] : null,
      aviso ? ['aviso', 'tdav tdaviso', esc(aviso) + ` <button type="button" class="tdavi" data-tdavi="${c.id}" aria-label="Por qué sale este aviso">i</button>`, explicarAviso(info)] : null,
      ab && !xyCita(c) ? ['aviso', 'tdav', 'Sin ubicación'] : null,
      c.nota ? ['nota', '', esc(c.nota)] : null
    ].filter(Boolean);
    const sube = ab && !pasado, reg = ab && puedeRegistrarEnDia(c.fecha), nueva = citaAusente(c.estado) && !pasado;
    const mini = !ab && !citaHecha(c.estado) && !citaAusente(c.estado);   // v2.273.0: movida o descartada, en una línea
    const st = ab ? 'abierta' : citaHecha(c.estado) ? 'hecha' : citaAusente(c.estado) ? 'ausente' : 'cerrada';   // v2.273.0: color suave según cómo está
    return `<article class="tdu ${c === sig ? 'sig' : ''} ${ab ? '' : 'hecha'} ${mini ? 'tdmini' : ''} tdst-${st}" data-tdu="${c.id}" data-tdf="${c.cuenta_id}" tabindex="0" aria-label="${esc(c.nombre)}">
      <div class="tdu-cab">
        <div class="tdu-av" aria-hidden="true">${esc(iniciales(c.nombre))}<span class="n">${i + 1}</span></div>
        <div class="tdu-tit">${c === sig ? '<span class="tdu-sig"><i></i>Siguiente</span>' : ''}
          <div class="tdu-nom"><b class="tdu-nb" title="Ver la cita">${esc(c.nombre)}</b>${c.clase ? `<span class="tdu-k ${esc(c.clase)}" title="Clase ${esc(c.clase)}">${esc(c.clase)}</span>` : ''}${c.urgente ? '<span class="pill p-urg">Urgente</span>' : ''}</div>
          <span class="tdu-sub">${esc([c.centro_nombre, c.municipio].filter(Boolean).join(' · ') || 'Sin centro')}</span></div>
        <div class="tdu-hora"><span class="h" title="${c.hora ? 'Hora fijada' : 'Hora estimada según el orden'}">${h}</span>${cuando ? `<span class="tdu-cu">${cuando}</span>` : ''}</div>
      </div>
      ${escala.length && nivel >= 0 ? `<div class="tdu-niv"><div class="tdu-barra" title="${esc(escala.map(x => x.valor).join(' → '))}">${escala.map((x, k) => `<i class="${k <= nivel ? 'on' : k === nivel + 1 ? 'obj' : ''}"></i>`).join('')}</div>
        <span class="tdu-nt"><b>${esc(c.estado_comercial)}</b>${obj ? ` → ${esc(obj.valor)}` : ' · mantener'}</span></div>` : ''}
      ${lineas.length ? `<ul class="tdu-dat">${lineas.map(([ic, cl, t, tit]) => `<li class="${cl}"${tit ? ` title="${esc(tit)}"` : ''}>${SVA(ICU[ic])}<span>${t}</span></li>`).join('')}</ul>` : ''}
      <div class="tdu-pie"><span class="tdu-est">${pillCita(c.estado)}<span class="sm">${textoOrigenCita(c)}</span></span>
        <span class="tdu-ops">${sube ? `<button class="kmv" type="button" data-td="sube|${c.id}" aria-label="Subir en el orden" title="Subir en el orden" ${idxAb <= 0 ? 'disabled' : ''}>${ICO.arriba}</button><button class="kmv" type="button" data-td="baja|${c.id}" aria-label="Bajar en el orden" title="Bajar en el orden" ${idxAb >= abiertas - 1 ? 'disabled' : ''}>${ICO.abajo}</button>` : ''}${citaConMenu(c) ? `<button class="btn sec tdmas" type="button" data-td="mas|${c.id}" aria-label="Más acciones">⋯</button>` : ''}</span>
        ${nueva ? `<button class="btn sec tdu-reg" type="button" data-td="nueva|${c.id}">Nueva cita</button>` : ''}
        ${reg ? `<button class="btn ${c === sig ? '' : 'sec'} tdu-reg" type="button" data-td="visita|${c.id}">Registrar ${vis}</button>` : ''}</div>
    </article>`;
  };

  $('agcuerpo').innerHTML = `
    <div class="tdhead">
      <div class="${fecha >= hoy ? 'tdtitw' : ''}"><h2 style="padding:0">${esHoy ? 'Tu día' : pasado ? 'Lo que pasó este día' : 'Tu agenda de este día'}</h2>${mias.length > 1 ? `<button type="button" class="btn sec chico plic" id="tdcompactar" aria-pressed="${tdCompacto()}" title="${tdCompacto() ? 'Ver el detalle de las citas' : 'Compactar las citas: una línea cada una'}" aria-label="${tdCompacto() ? 'Ver el detalle de las citas' : 'Compactar las citas'}">${plIco(tdCompacto() ? 'file-text' : 'list')}</button>` : ''}${fecha >= hoy ? `<button type="button" class="kmv tddiamas" id="tddiamas" aria-label="Opciones del día" title="Opciones del día: nueva cita, bloquear el día…">${SVA(ICU.mas)}</button>` : ''}
        <div class="tdstats">
          <span><b>${num(activas)}</b> citas</span>
          <span><b style="color:var(--ok)">${num(hechas)}</b> visitadas</span>
          ${ausentes ? `<span><b style="color:var(--warn)">${num(ausentes)}</b> no estaban</span>` : ''}
          <span><b>${abiertas}</b> por hacer</span>
          ${abiertas && !pasado ? `<span>Fin estimado <b style="color:${pasaTope ? 'var(--warn)' : 'var(--navy)'}">${hm(fin)}</b>${pasaTope ? ' · pasa de la hora de vuelta' : ''}${fin >= 24 * 60 ? ' <span class="sm">(día siguiente: revisa los avisos)</span>' : ''}</span>` : ''}
        </div></div>
      <div class="acts">
        ${propia ? '<button type="button" class="btn sec chico" id="tdtarea">+ Tarea</button>' : ''}
        ${!pasado && conSitio > 1 ? '<button class="btn sec chico" id="tdordenar" title="Ordena las citas abiertas para recorrer menos kilómetros. Las que tienen hora fija se respetan.">Ordenar por cercanía</button>' : ''}
        ${esHoy && !j && abiertas && agUid() === PERFIL.id ? '<button class="btn chico" id="tdempezar">▶ Empezar jornada</button>' : ''}
        ${esHoy && j && agUid() === PERFIL.id ? '<button class="btn dang chico" id="tdterminar">Terminar jornada</button>' : ''}
        ${pasado && abiertas ? '<button class="btn chico" id="tdrepro">Reprogramar pendientes</button>' : ''}
      </div>
    </div>
    ${esHoy && j ? `<div class="tdjornada">● Jornada en curso desde hace ${durTxt(Date.now() - j.inicio)}. Registra cada ${vis} al terminarla.</div>` : ''}
    ${bandaNoCabe ? `<div class="banda-aviso" id="tdnocabe">${noCabe ? `<b>Este día no cabe en una jornada.</b> Con este orden acabarías ${finTxt}${fuera ? ` y ${fuera === 1 ? 'una cita queda' : fuera + ' citas quedan'} fuera de tu horario` : ''}.` : `<b>Varias citas no encajan con sus horarios.</b>`}
      Antes de mirar cada cita: ${!pasado && conSitio > 1 ? '<button type="button" class="btn sec chico" id="tdnocord">Ordenar por cercanía</button> o ' : ''}pasa a otro día las citas de la zona más lejana (⋯ → Aplazar).</div>` : ''}
    ${mias.length ? `<div class="tdesc" aria-label="Citas del día">${mias.map(tarjeta).join('')}</div>`
      : `<div class="vacio">${esHoy ? 'No tienes citas hoy. Planifica una ruta en Rutas o cita a alguien de las sugerencias.' : 'Sin citas este día.'}</div>`}
    ${otras.length ? `<h3 class="tdotros">Citas de otras personas · ${otras.length}</h3>
      <div class="lista">${otras.map(c => `<div class="item" style="cursor:default"><span class="ic">${c.hora ? tdHm(c.hora) : '·'}</span>
        <span class="tx"><b>${esc(c.nombre)}</b><span class="sm">${esc(c.usuario || '')} · ${pillCita(c.estado)}</span></span></div>`).join('')}</div>` : ''}`;

  const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
  on('tdempezar', empezarJornada); on('tdterminar', terminarJornada);
  on('tdrepro', () => reprogramarCitas(abiertasL, 'Pendientes del ' + fechaCorta(fecha), 'Sin visitar ese día'));
  on('tdordenar', async () => {
    const nuevo = ordenarPorCercania(mias), nf = ordenarPorCercania.fuera || 0;
    if (await guardarOrden(nuevo)) { toast(nf ? `Ordenadas · ${nf} no caben en su horario o en el tuyo y quedan al final` : 'Citas ordenadas por cercanía'); repintarDiaSuave(); }
  });
  on('tdnocord', () => $('tdordenar') && $('tdordenar').click());
  on('tdtarea', () => editarTarea(null, AG_FECHA));
  on('tddiamas', e => { e.stopPropagation(); const d = document.querySelector(`#agcinta [data-cf="${AG_FECHA}"]`); menuDiaSemana($('tddiamas'), AG_FECHA, !!(d && d.classList.contains('bloq'))); });
  window.delcos.screens.agenda.refreshMetrics();
  // Botones de la ruta del día (Empezar ruta / Ruta completa): también al cambiar de día (antes solo al cargar la Agenda)
  try { if (typeof prepararParadas === 'function') prepararParadas(fecha); } catch (e) { }
  // Tareas propias del día (después de pintar: no retrasan las citas)
  if (!propia) return;
  const l = await tareasDelDia(fecha);
  if (AG_FECHA !== fecha || !$('agcuerpo')) return;
  const vieja = $('tdtareas'); if (vieja) vieja.remove();
  if (!l || !l.length) return;
  const sitio = $('tdnocabe') || $('agcuerpo').querySelector('.tdesc, .vacio');
  const html = `<div class="tdtareas" id="tdtareas"><div class="tdtcab">Tareas y notas · ${l.length}</div>${l.map(t => `
    <div class="tdtarea ${t.hecha ? 'hecha' : ''}" data-tarea="${t.id}">
      <label class="tdtchk"><input type="checkbox" data-tacheck="${t.id}" ${t.hecha ? 'checked' : ''} aria-label="Hecha"></label>
      <span class="tdth">${t.hora ? tdHm(t.hora) : ''}</span>
      <span class="tdttx"><b>${esc(t.titulo)}</b>${t.nota ? `<span class="sm">${esc(t.nota)}</span>` : ''}</span>
      ${l.length > 1 ? `<span class="tdtmov"><button type="button" class="kmv" data-tamov="-1|${t.id}" aria-label="Subir la tarea" ${l[0] === t ? 'disabled' : ''}>↑</button><button type="button" class="kmv" data-tamov="1|${t.id}" aria-label="Bajar la tarea" ${l[l.length - 1] === t ? 'disabled' : ''}>↓</button></span>` : ''}
    </div>`).join('')}</div>`;
  if (sitio) sitio.insertAdjacentHTML('beforebegin', html); else $('agcuerpo').insertAdjacentHTML('beforeend', html);
  $('tdtareas').querySelectorAll('[data-tacheck]').forEach(c => c.onchange = async ev => {
    ev.stopPropagation();
    const { error } = await db.from('tareas').update({ hecha: c.checked, modificado_en: new Date().toISOString() }).eq('id', c.dataset.tacheck);
    if (error) { toast('No se ha podido guardar', true); c.checked = !c.checked; return; }
    c.closest('.tdtarea').classList.toggle('hecha', c.checked); TAREAS_DIA = null;
  });
  $('tdtareas').querySelectorAll('.tdtarea').forEach(d => d.onclick = ev => { if (ev.target.closest('.tdtchk, .tdtmov')) return; editarTarea(l.find(x => x.id === d.dataset.tarea)); });
  $('tdtareas').querySelectorAll('[data-tamov]').forEach(b => b.onclick = ev => { ev.stopPropagation(); const [dir, id] = b.dataset.tamov.split('|'); moverTarea(id, +dir); });
}

// Las citas que cambian de sitio se deslizan y la tocada se resalta (antes se animaban las filas ocultas)
function tdPosiciones() { const m = new Map(); document.querySelectorAll('#agcuerpo .tdu[data-tdu]').forEach(t => m.set(t.dataset.tdu, t.getBoundingClientRect().top)); return m; }

function tdAnimar(antes, id, dur = 300) {
  const quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('#agcuerpo .tdu[data-tdu]').forEach(t => {
    const k = t.dataset.tdu;
    if (id && String(k) === String(id)) { t.classList.remove('tdmovida'); void t.offsetWidth; t.classList.add('tdmovida'); setTimeout(() => t.classList.remove('tdmovida'), 1300); }
    const y0 = antes.get(k); if (quieto || y0 == null || !t.animate) return;
    const dy = y0 - t.getBoundingClientRect().top;
    if (Math.abs(dy) > 1) t.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: dur, easing: 'cubic-bezier(.2,.7,.2,1)' });
  });
}

// ---- Pastillas: las cifras de agenda_metricas
// ---- La Agenda: vista del día (con la semana o el mes abiertos si se piden) o Equipo
async function cargarAgenda() {
  if (TAB !== 'agenda' || !$('v-agenda')) return;
  if (AG_MODO === 'equipo') return agCargarEquipo();
  const mes = AG_MODO === 'mes', plan = ABRIR_PLAN_SEMANA;
  if (AG_MODO === 'semana') AG_SEM_ABIERTA = true;
  AG_MODO = 'dia'; ABRIR_PLAN_SEMANA = false;
  await agCargarDia();
  if (mes) void window.delcos.screens.agenda.toggleMonth();
  if (plan) agRepartirSemana();
}

async function agCargarEquipo() {
  const v = $('v-agenda');
  if (VE_TODO() && !COMS.length) { try { await cargarComerciales(); } catch (e) { } }
  if (TAB !== 'agenda' || AG_MODO !== 'equipo') return;
  v.classList.remove('agunida', 'agcinta', 'agb', 'agn');
  v.innerHTML = `<div class="saludo"><div><h1>Agenda</h1><div class="fecha" id="agtit">Cumplimiento del equipo</div></div><div class="acts" style="margin:0"></div></div>
    <div class="card" id="agcuerpo"></div>`;
  asegurarEquipo();
  await pintarEquipo();
  v.dataset.listo = '1';
}

async function agCargarDia() {
  const v = $('v-agenda'); if (!v) return;
  if (!AG_FECHA || (AG_FECHA === AG_HOY_VISTO && AG_HOY_VISTO !== hoyISO())) AG_FECHA = hoyISO();   // v2.273.0: al cambiar de día, hoy
  if (AG_FECHA === hoyISO()) AG_HOY_VISTO = AG_FECHA;
  const f = AG_FECHA;
  TAREAS_DIA = null;
  CINTA_INI = lunesCinta(f);   // v2.273.0: la semana del día a la izquierda y la siguiente a la derecha
  v.dataset.listo = '';
  const y = scrollY, mismo = v.classList.contains('agn') && $('agcuerpo');
  if (mismo) $('agcuerpo').classList.add('agcargando');
  let s = null, met = null;
  await datosAgenda.withData([...datosAgenda.dayLoads(f), datosAgenda.loadSuggestions(f).then(x => { s = x; }),
    Promise.resolve(RPC_ORIG('agenda_metricas', { p_usuario: AG_VISTA ? AG_VISTA.id : null })).then(r => { met = r && r.data; }),
    ...datosAgenda.stripLoads(), ...datosAgenda.weekLoads(f), VE_TODO() && !COMS.length ? cargarComerciales() : null], async () => {
    if (AG_FECHA !== f || TAB !== 'agenda' || AG_MODO !== 'dia') return;
    if (met) AG_MET = met;
    datosAgenda.applySuggestions(f, s);
    v.classList.add('agunida', 'agcinta', 'agb', 'agn');
    v.innerHTML = `
      <div class="saludo"><div><h1>Agenda</h1><div class="fecha" id="agtit">${esc('Hoy · ' + fechaLarga(new Date(hoyISO() + 'T00:00:00')) + (AG_VISTA ? ' · agenda de ' + AG_VISTA.nombre : ''))}</div></div>
        <div class="aghud" id="aghud" aria-label="Tus números">${window.delcos.screens.agenda.metricsHtml()}</div>
        <div class="acts" style="margin:0"><button class="btn" data-ag="nueva">+ Nueva cita</button></div></div>
      <div class="card" id="agcuerpo"></div>
      <div class="card" id="agsemlat"></div>`;
    asegurarEquipo();
    await Promise.all([pintarTuDia(), window.delcos.screens.agenda.paintStrip(), window.delcos.screens.agenda.paintWeekSidebar()]);
    agMarcarDia(); agDiaVacio();
    if (!AG_VISTA) avisoSinSalida($('agcuerpo'));
    if (mismo) window.scrollTo(0, y);
    v.dataset.listo = '1';
    // Si una bandeja estaba abierta (p. ej. tras «Mover a hoy»), se repinta con lo nuevo
    window.delcos.screens.agenda.refreshOpenTray();
  });
}


async function agRepartirSemana() {
  AG_SEM_ABIERTA = true;
  await agPintarSemanaExp(); window.delcos.screens.agenda.bindWeekButton();
  const p = $('semplan'); if (p) { $('agsemexp').scrollIntoView({ behavior: 'smooth', block: 'start' }); p.click(); }
}

// ---- Pastillas, cifras y bandejas
// Tras un cambio (mover, registrar, notas…): cifras, cinta, «Tu semana», bandejas y el mes si está abierto, de una vez
function agCifrasQuietas() {
  if (!agN()) return;
  const f = AG_FECHA; let s = null;
  void window.delcos.screens.agenda.reloadMetrics();
  datosAgenda.withData([...datosAgenda.stripLoads(), ...datosAgenda.weekLoads(f), datosAgenda.loadSuggestions(f).then(x => { s = x; })], async () => {
    if (AG_FECHA !== f || !agN()) return;
    datosAgenda.applySuggestions(f, s);
    await Promise.all([window.delcos.screens.agenda.paintStrip(), window.delcos.screens.agenda.paintWeekSidebar()]);
    window.delcos.screens.agenda.paintSameCentre(); window.delcos.screens.agenda.paintTrayButtons();
  });
  window.delcos.screens.agenda.refreshOpenMonth();
}


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
  if (tdPonerReal(ruta, res)) { if (agN()) repintarDiaSuave(); }
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

// ---- «Tu día»: las citas con la visita guardada en el móvil, marcadas y sin «Registrar»
function tdMarcarPendientes() {
  const pend = colaLeer().filter(o => o.fn === 'registrar_actividad' && o.payload && o.payload.p && o.payload.p.fecha === AG_FECHA);
  document.querySelectorAll('#agcuerpo .tdu[data-tdu]').forEach(t => {
    const c = (TD_CITAS || []).find(x => String(x.id) === t.dataset.tdu); if (!c) return;
    const p = pend.some(o => o.payload.p.cuenta_id === c.cuenta_id);
    if (t.classList.contains('tdpend') !== p) t.classList.toggle('tdpend', p);
    const m = t.querySelector('.tdpendm');
    if (p && !m) { const pie = t.querySelector('.tdu-pie'); if (pie) pie.insertAdjacentHTML('afterbegin', `<span class="tdpendm">Registrada en el móvil · pendiente de enviar</span>`); }
    if (!p && m) m.remove();
    t.querySelectorAll('[data-td^="visita|"]').forEach(b => { if (b.classList.contains('hide') !== p) b.classList.toggle('hide', p); });
  });
}

function tdPlegarTareas() {
  const t = $('tdtareas'), cab = t && t.querySelector('.tdtcab'); if (!t || !cab) return;
  t.classList.toggle('plegadas', tdTareasPlegadas());
  cab.setAttribute('role', 'button'); cab.tabIndex = 0;
  cab.setAttribute('aria-expanded', String(!tdTareasPlegadas())); cab.title = tdTareasPlegadas() ? 'Ver las tareas' : 'Ocultar las tareas';
  if (!cab.__plegar) {
    cab.__plegar = true;
    const alternar = () => { try { localStorage.setItem('delcos-tareas-plegadas', tdTareasPlegadas() ? '0' : '1'); } catch (e) {} tdPlegarTareas(); };
    cab.onclick = alternar; cab.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } };
  }
}

/* ============================================================
   v2.299.0 · Tu día compacto (petición de Eric): un botón deja cada cita en una línea con el nombre, la hora y el estado.
   Se recuerda en este dispositivo. Pulsar la cita sigue abriendo su detalle (desde ahí se registra la visita).
   ============================================================ */
function tdCompacto() { try { return localStorage.getItem('delcos-tdcompacto') === '1'; } catch (e) { return false; } }

function tdAplicarCompacto() { document.body.classList.toggle('tdcompacto', tdCompacto()); }

async function guardarOrden(citas) {
  const { data: r, error } = await db.rpc('ordenar_citas', { p_ids: citas.map(c => c.id) });
  if (error || (r && r.ok === false)) { toast('No se ha podido guardar el orden', true); return false; }
  return true;
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

// El mes está en src/app/screens/agenda (v2.390.0); este nombre se queda porque lo llaman el escuchador de Escape y las pruebas
function cerrarMesCinta() { window.delcos.screens.agenda.closeMonth(); }

function asegurarEquipo() {
  if (TAB !== 'agenda' || !VE_TODO()) return;
  // Solo en la cabecera que se ve: mientras se repinta puede quedar una copia congelada con los mismos id
  const acts = document.querySelector('#v-agenda > .saludo .acts'); if (!acts) return;
  let sel = acts.querySelector('#agvista');
  if (!sel) {
    if (!COMS.length) { cargarComerciales().then(asegurarEquipo); return; }
    acts.insertAdjacentHTML('afterbegin', `<select id="agvista" aria-label="Agenda de" title="Ver la agenda de otra persona">
        <option value="">Mi agenda</option>${COMS.filter(u => u.id !== PERFIL.id).map(u => `<option value="${u.id}" ${AG_VISTA && AG_VISTA.id === u.id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}</select>`);
    sel = acts.querySelector('#agvista');
    sel.onchange = e => verAgendaDe(e.target.value);
  }
  let b = acts.querySelector('[data-ag="equipo"]');
  if (!b) { sel.insertAdjacentHTML('afterend', '<button class="btn sec" data-ag="equipo">Equipo</button>'); b = acts.querySelector('[data-ag="equipo"]'); }
  const eq = AG_MODO === 'equipo';
  b.textContent = eq ? 'Mi agenda' : 'Equipo';
  b.classList.toggle('sec', !eq);
  b.title = eq ? 'Volver a tu agenda' : 'Ver el cumplimiento del equipo';
}

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

const tdHm = h => esc(String(h).slice(0, 5));

const agN = () => agConCinta() && $('v-agenda').classList.contains('agn');

// Quién ya tiene cita ese día (no se le propone)


// Subir o bajar una cita no recarga la Agenda aunque otra pantalla (Inicio pide las citas de hoy) haya pedido otro día entretanto:
// se guarda lo último de cada día y se usa el del día que se ve
const AG_DIAS_DATOS = {};


const tdClaveXY = (a, b) => a && b && a[0] != null && b[0] != null ? `${(+a[0]).toFixed(5)},${(+a[1]).toFixed(5)}>${(+b[0]).toFixed(5)},${(+b[1]).toFixed(5)}` : '';

const tdRealVigente = () => TD_REAL && Date.now() - TD_REAL.t < 600000;

// Tareas del día plegables: un clic en su título las oculta todas y se ven solo las citas (se recuerda en este dispositivo)
const tdTareasPlegadas = () => { try { return localStorage.getItem('delcos-tareas-plegadas') === '1'; } catch (e) { return false; } };

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
function agMarcarDiaBase() {
  const v = $('v-agenda'); if (!v || !v.classList.contains('agunida')) return;
  const hoy = hoyISO(), otro = AG_FECHA !== hoy;
  if ($('agtit')) $('agtit').textContent = 'Hoy · ' + fechaLarga(new Date(hoy + 'T00:00:00'));
  const h = v.querySelector('#agcuerpo .tdhead h2'); if (!h) return;
  const caja = h.parentElement;
  let b = $('agahoy');
  if (!otro) { if (b) b.remove(); return; }
  h.textContent = fechaLarga(new Date(AG_FECHA + 'T00:00:00')).replace(/^./, c => c.toUpperCase());
  if (!b) {
    h.insertAdjacentHTML('afterend', '<button type="button" class="btn sec" id="agahoy">Volver a hoy</button>');
    b = $('agahoy'); b.onclick = () => agVerDia(hoyISO());
  }
  // v2.338.0: en el móvil va delante de «+ Tarea», en la misma fila (Eric)
  const acts = !matchMedia('(min-width: 761px)').matches && v.querySelector('#agcuerpo .tdhead .acts');
  if (acts && acts.firstElementChild !== b) acts.prepend(b);
  caja.classList.add('agtitdia');
}

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

// Columna derecha: tu semana


// El título conserva «· agenda de …» al ver la de otra persona (agMarcarDia lo dejaba en «Hoy · …»)
function agMarcarDia(...a) {
  const r = agMarcarDiaBase.apply(this, a);
  if (agN() && AG_VISTA && $('agtit') && !$('agtit').textContent.includes(AG_VISTA.nombre)) $('agtit').textContent += ' · agenda de ' + AG_VISTA.nombre;
  return r;
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


async function accionCitaBase(k, c) {
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

function accionCitaBase2(k, c, ...r) { if (k === 'ficha') FICHA_CENTRO = c.centro_nombre || null; return accionCitaBase(k, c, ...r); }

async function moverCitaLocalBase(orden, id, acc) {
  const u = TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA ? TD_ULTIMO.data : null;
  if (!u) { if (await guardarOrden(orden)) cargarAgenda(); return; }
  const ids = new Set(orden.map(c => c.id));
  TD_PRESET = { fecha: AG_FECHA, data: [...orden, ...u.filter(c => !ids.has(c.id))] };
  TD_ULTIMO = { fecha: AG_FECHA, data: TD_PRESET.data };
  const y = window.scrollY;
  await pintarTuDia();
  window.scrollTo({ top: y });
  const b = document.querySelector(`#agcuerpo .tdu [data-td="${acc}|${id}"]:not([disabled])`) || document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
  if (b) b.focus({ preventScroll: true });
  if (!(await guardarOrden(orden))) cargarAgenda();
}

// ---- 4. Detalle de la cita al pulsarla en «Tu día»
function verCitaBase(c) {
  const inf = TD_INFO[c.id] || {}, abierta = CITA_ABIERTA.includes(c.estado);
  const hora = c.hora ? String(c.hora).slice(0, 5) : (abierta && inf.llegada != null && inf.llegada < 24 * 60 ? `hacia las ${hm(inf.llegada)} (estimada)` : 'sin hora');
  const donde = [c.centro_nombre, c.direccion, c.municipio].filter(Boolean).join(' · ');
  const v = inf.ventanas || ventanasDe(c.dias, c.fecha);
  const horario = v && v.length ? `${inf.otroCentro ? 'En ' + inf.otroCentro + ': ' : ''}${txtVentanas(v)}` : v && !v.length ? 'Ese día no atiende' : '';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${esc(c.nombre)}</h2>${c.especialidad ? `<div class="sm">${esc(c.especialidad)}</div>` : ''}</div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="vcdatos">
      <div class="vcfila"><span>Cuándo</span><b>${esc(fechaLarga(new Date(c.fecha + 'T12:00:00')).replace(/^./, x => x.toUpperCase()))} · ${esc(hora)}</b></div>
      <div class="vcfila"><span>Dónde</span><b>${esc(donde || 'Sin centro')}</b></div>
      ${horario ? `<div class="vcfila"><span>Horario</span><b>${esc(horario)}</b></div>` : ''}
      <div class="vcfila"><span>Estado</span><b>${pillCita(c.estado)}${textoOrigenCita(c) ? ` <span class="sm">${textoOrigenCita(c)}</span>` : ''}</b></div>
    </div>
    ${abierta && inf.aviso ? `<div class="banda-aviso" style="margin:0 0 12px">${esc(inf.aviso)}</div>` : ''}
    <label for="vcnota">Notas de la cita</label>
    <textarea id="vcnota" rows="3" placeholder="p. ej. quedamos en el bar de enfrente, llevar el reporting…">${esc(c.nota || '')}</textarea>
    <div class="vcacts">
      <button type="button" class="btn sec" id="vcficha">Ver ficha</button>
      ${xyCita(c) ? '<button type="button" class="btn sec" id="vcllegar">Cómo llegar</button>' : ''}
      ${abierta ? '<button type="button" class="btn sec" id="vchora">Cambiar hora</button><button type="button" class="btn sec" id="vcmover">Mover a otro día</button>' : ''}
    </div>
    <div class="acts" style="justify-content:flex-end">
      <button type="button" class="btn sec" id="vcok" disabled>Guardar notas</button>
      ${abierta && puedeRegistrarEnDia(c.fecha) ? `<button type="button" class="btn" id="vcreg">Registrar ${TT('visita', 's', '', 'l', 'l')}</button>` : ''}</div>`;
  const cerrar = () => $('dlg').close();
  const nota = $('vcnota');
  nota.oninput = () => { $('vcok').disabled = nota.value.trim() === (c.nota || '').trim(); };
  $('vcok').onclick = async ev => {
    ev.target.disabled = true;
    const v2 = nota.value.trim();
    const { error } = await db.from('agenda').update({ nota: v2 || null }).eq('id', c.id);
    if (error) { ev.target.disabled = false; toast('No se ha podido guardar: ' + error.message, true); return; }
    c.nota = v2; cerrar(); toast('Notas guardadas'); agRefrescoQuieto(c.id, { cifras: false });
  };
  $('vcficha').onclick = () => { cerrar(); FICHA_CENTRO = c.centro_nombre || null; abrirFicha(c.cuenta_id); };
  if ($('vcllegar')) $('vcllegar').onclick = () => accionCita('llegar', c);
  if ($('vchora')) $('vchora').onclick = () => { cerrar(); accionCita('hora', c); };
  if ($('vcmover')) $('vcmover').onclick = () => { cerrar(); accionCita('aplazar', c); };
  if ($('vcreg')) $('vcreg').onclick = () => { cerrar(); VISITA_FECHA = c.fecha; abrirVisita(c.cuenta_id); };
  $('dlg').classList.add('pequena');
  $('dlg').showModal();
}

// ---- 4. Borrar y descartar en el detalle de la cita
function verCitaBase2(c) {
  const r = verCitaBase.call(this, c);
  try {
    const abierta = CITA_ABIERTA.includes(c.estado), borrable = abierta && c.fecha >= hoyISO();
    const caja = $('dbody') && $('dbody').querySelector('.vcacts');
    if (caja && abierta) {
      caja.insertAdjacentHTML('afterend', `<div class="vcfin">
        <button type="button" class="lnk" id="vcdescartar">Descartar la cita</button><span class="sm">No se hará: queda en el historial.</span>
        ${borrable ? '<button type="button" class="lnk peligro" id="vcborrar">Eliminar la cita</button><span class="sm">Fue un error: desaparece sin dejar rastro.</span>' : ''}</div>`);
      $('vcdescartar').onclick = () => { $('dlg').close(); accionCita('descartar', c); };
      if ($('vcborrar')) $('vcborrar').onclick = () => { $('dlg').close(); accionCita('borrar', c); };
    }
  } catch (e) {}
  return r;
}

async function accionCita(k, c) {
  if (k !== 'rehacer') return accionCitaBase2.call(this, k, c);
  const { data: r, error } = await db.rpc('reabrir_cita', { p_id: c.id });
  if (error || !r || r.ok === false) { toast(r && r.error === 'pasada' ? 'Solo se pueden volver a planificar citas de hoy en adelante' : 'No se ha podido volver a planificar', true); return; }
  toast(r.quitada ? 'Vuelve a estar planificada (se quita la del ' + fechaCorta(r.quitada) + ')' : 'Vuelve a estar planificada');
  agRefrescoQuieto(c.id);
}

function verCitaBase3(c) {
  const r = verCitaBase2.call(this, c);
  try {
    const caja = $('dbody') && $('dbody').querySelector('.vcacts');
    if (caja && ['Aplazada', 'Descartada'].includes(c.estado) && c.fecha >= hoyISO()) {
      caja.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" id="vcrehacer">Volver a planificarla</button>');
      $('vcrehacer').onclick = () => { $('dlg').close(); accionCita('rehacer', c); };
    }
  } catch (e) {}
  return r;
}

function verCitaBase4(c, ...r) {
  const x = verCitaBase3.call(this, c, ...r);
  const acts = $('dbody') && $('dbody').querySelector('.vcacts');
  if (acts && c) {
    const ir = (f, txt, id) => {
      if (!f || f === c.fecha || $(id)) return;
      acts.insertAdjacentHTML('beforeend', `<button type="button" class="btn sec" id="${id}">${esc(txt)}</button>`);
      $(id).onclick = () => { $('dlg').close(); AG_MODO = 'dia'; agVerDia(f); };
    };
    if (c.estado === 'Aplazada') ir(c.aplazada_a_fecha, 'Ir al ' + (c.aplazada_a_fecha ? diaCita(c.aplazada_a_fecha) : ''), 'vcirdest');
    ir(c.aplazada_de_fecha, 'Ver el ' + (c.aplazada_de_fecha ? diaCita(c.aplazada_de_fecha) : ''), 'vcirorig');
  }
  return x;
}

// La semana de siempre, pintada debajo de la cinta (se cambia el id un momento para que pintarSemanaAgenda pinte allí)
async function agPintarSemanaExpBase() {
  const cin = $('agcinta'); if (!cin || !AG_SEM_ABIERTA) { const x = $('agsemexp'); if (x) x.remove(); return; }
  let cont = $('agsemexp'); if (!cont) { cin.insertAdjacentHTML('beforeend', '<div id="agsemexp" class="agsemexp"></div>'); cont = $('agsemexp'); }
  const real = $('agcuerpo'), modo = AG_MODO;
  if (!real) return;
  real.id = 'agcuerpo-dia'; cont.id = 'agcuerpo'; AG_MODO = 'semana';
  try { await pintarSemanaAgenda(); } finally { cont.id = 'agsemexp'; real.id = 'agcuerpo'; AG_MODO = modo; }
  const h = cont.querySelector('.semhead h2'); if (h) h.remove();
  const p = cont.querySelector('#semplan'); if (p) p.textContent = 'Repartir la semana';
  const head = cont.querySelector('.semhead'); if (head) head.insertAdjacentHTML('afterbegin', '<span class="sm">Arrastra una cita a otro día para moverla · «⋯» en un día para bloquearlo o añadir una cita</span>');
}

function verCita(c, ...r) {
  const x = verCitaBase4.call(this, c, ...r);
  if (!c || CITA_ABIERTA.includes(c.estado) || !$('dbody')) return x;
  const datos = $('dbody').querySelector('.vcdatos'); if (!datos || $('vccerrada')) return x;
  const reabrir = citaConMenu(c);
  datos.insertAdjacentHTML('afterend', `<div class="banda-info vccerrada" id="vccerrada"><b>Cita cerrada: ${esc(c.estado)}.</b>
    <span id="vccomo"></span> ${reabrir ? 'Si hace falta, puedes volver a planificarla desde «⋯».' : 'La hora y el día ya no se cambian; las notas sí. Si hace falta volver, crea una cita nueva.'}</div>`);
  if (citaHecha(c.estado) && c.cuenta_id) {
    db.from('actividades').select('resultados, hora').eq('cuenta_id', c.cuenta_id).eq('fecha', c.fecha).limit(1).then(({ data }) => {
      const a = (data || [])[0], s = $('vccomo'); if (!a || !s) return;
      const res = Array.isArray(a.resultados) ? a.resultados.filter(Boolean).join(', ') : (a.resultados || '');
      s.textContent = `Se registró la ${TT('visita', 's', '', 'l', 'l')}${a.hora ? ' a las ' + String(a.hora).slice(0, 5) : ''}${res ? ': ' + res : ''}.`;
    }, () => {});
  }
  return x;
}

async function moverCitaLocalBase2(orden, id, acc) {
  const antes = tdPosiciones();
  const r = await moverCitaLocalBase.call(this, orden, id, acc);
  tdAnimar(antes, id, 260);
  const b = document.querySelector(`#agcuerpo .tdu [data-td="${acc}|${id}"]:not([disabled])`) || document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
  if (b) b.focus({ preventScroll: true });
  return r;
}

async function moverCitaLocal(...a) {
  if ((!TD_ULTIMO || TD_ULTIMO.fecha !== AG_FECHA) && AG_DIAS_DATOS[AG_FECHA]) TD_ULTIMO = { fecha: AG_FECHA, data: AG_DIAS_DATOS[AG_FECHA] };
  return moverCitaLocalBase2.apply(this, a);
}

// «Ver la semana» aparece de una vez: se pinta escondida y se enseña ya con sus días (antes salía vacía y se llenaba)
async function agPintarSemanaExpBase2(...a) {
  const cin = $('agcinta');
  if (!agN() || !cin || !AG_SEM_ABIERTA || $('agsemexp')) return agPintarSemanaExpBase.apply(this, a);
  cin.insertAdjacentHTML('beforeend', '<div id="agsemexp" class="agsemexp" style="display:none"></div>');
  try { return await agPintarSemanaExpBase.apply(this, a); } finally { const x = $('agsemexp'); if (x) x.style.display = ''; }
}

// ---- «Tu día» con sus bandejas y «En este centro también», de una vez
async function pintarTuDiaBase() {
  if (!agConCinta()) return;
  const f = AG_FECHA;
  let s = null;
  await datosAgenda.withData([...datosAgenda.dayLoads(f), !AG_SUG || AG_SUG.fecha !== f ? datosAgenda.loadSuggestions(f).then(x => { s = x; }) : null], async () => {
    if (AG_FECHA !== f || !agConCinta()) return;
    datosAgenda.applySuggestions(f, s);
    await tdPintar();
    if (agN()) { window.delcos.screens.agenda.paintSameCentre(); window.delcos.screens.agenda.paintTrayButtons(); }
  });
}

function agPintarSemanaExp(...a) {
  if (!agN()) return agPintarSemanaExpBase2.apply(this, a);
  return datosAgenda.withData(AG_SEM_ABIERTA ? datosAgenda.weekLoads(AG_FECHA) : [], () => agPintarSemanaExpBase2.apply(this, a));
}

async function pintarTuDiaBase2(...a) {
  const r = await pintarTuDiaBase.apply(this, a);
  if (agConCinta()) tdMarcaTrafico();
  return r;
}

async function pintarTuDiaBase3(...a) {
  const r = await pintarTuDiaBase2.apply(this, a);
  if (agConCinta()) tdMarcarPendientes();
  return r;
}

async function pintarTuDia(...x) { const r = await pintarTuDiaBase3.apply(this, x); tdPlegarTareas(); return r; }

// Menú «⋯» de la cita
function menuCitaBase(boton, c) {
  document.querySelectorAll('.tdmenu').forEach(m => m.remove());
  const abierta = CITA_ABIERTA.includes(c.estado);
  const ops = [
    abierta ? ['hora', c.hora ? 'Cambiar la hora' : 'Fijar una hora', ''] : null,
    abierta ? ['aplazar', 'Aplazar a otro día', 'Queda como aplazada y se crea la cita nueva'] : null,
    abierta && c.estado === 'Planificada' ? ['confirmar', 'Marcar como confirmada', 'Ya has confirmado la cita'] : null,
    abierta && c.estado === 'Confirmada' ? ['desconfirmar', 'Quitar la confirmación', ''] : null,
    abierta ? ['descartar', 'Descartar la cita', 'Ya no hace falta ir'] : null,
    abierta && c.fecha >= hoyISO() ? ['borrar', 'Eliminar la cita', 'Fue un error: desaparece de la agenda'] : null   // v2.273.0
  ].filter(Boolean);
  if (!ops.length) { toast('Esta cita ya está cerrada'); return; }
  const m = document.createElement('div');
  m.className = 'tdmenu'; m.__t = Date.now();
  m.innerHTML = ops.map(([k, t, s]) => `<button data-tdop="${k}" class="${k === 'descartar' || k === 'borrar' ? 'peligro' : ''}"><b>${esc(t)}</b>${s ? `<span>${esc(s)}</span>` : ''}</button>`).join('');
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, r.bottom + 6) + 'px';
  m.style.left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, r.right - m.offsetWidth)) + 'px';
  m.querySelectorAll('[data-tdop]').forEach(b => b.onclick = () => { m.remove(); accionCita(b.dataset.tdop, c); });
}

/* v2.185.0 · Citas aplazadas sin duplicar y fechas en el móvil (avisos de Eric):
   1. Una cita aplazada o descartada de hoy en adelante tiene en «⋯» (y en su detalle) «Volver a planificarla» (reabrir_cita, SQL 116: vuelve a
      Planificada y quita la cita que se creó al aplazarla). Volver a poner una cita ese día reutiliza la aplazada (aplazar_cita y guardar_cita).
   2. En pantallas táctiles los campos de fecha y hora son `inert`: no pueden tomar el foco, así que iOS ya no abre su rueda (lo hacía cuando la
      ventana enfocaba el campo al abrirse y cuando el calendario de delcos le devolvía el foco al elegir el día). El toque lo recoge el envoltorio. */
function menuCita(boton, c) {
  if (CITA_ABIERTA.includes(c.estado) || !['Aplazada', 'Descartada'].includes(c.estado) || c.fecha < hoyISO()) return menuCitaBase.call(this, boton, c);
  document.querySelectorAll('.tdmenu').forEach(m => m.remove());
  const m = document.createElement('div');
  m.className = 'tdmenu'; m.__t = Date.now();
  m.innerHTML = `<button data-tdop="rehacer"><b>Volver a planificarla</b><span>Vuelve a este día${c.estado === 'Aplazada' ? '; si la pasaste a otro, esa se quita' : ''}</span></button>`;
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, r.bottom + 6) + 'px';
  m.style.left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, r.right - m.offsetWidth)) + 'px';
  m.querySelector('[data-tdop]').onclick = () => { m.remove(); accionCita('rehacer', c); };
}

// Cambiar la hora: la cita se coloca por su hora entre las demás (y se guarda ese orden)
async function cambiarHoraCita(id, hora) {
  const h = await appVentana({ titulo: 'Hora de la cita', ok: 'Guardar', campo: { valor: hora || '', tipo: 'time' } });
  if (h === null) return;
  const { error } = await db.from('agenda').update({ hora: h || null }).eq('id', id);
  if (error) { toast('No se ha podido: ' + error.message, true); return; }
  toast('Hora actualizada');
  const u = TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA ? TD_ULTIMO.data : null;
  if (TAB !== 'agenda' || !agUnida() || !u || !u.some(c => c.id === id)) { agRefrescoQuieto(id, { cifras: false }); return; }
  const data = u.map(c => c.id === id ? Object.assign({}, c, { hora: h || null }) : c);
  const mia = c => c.usuario_id === agUid(), abierta = c => mia(c) && CITA_ABIERTA.includes(c.estado);
  const ab = data.filter(abierta), yo = ab.find(c => c.id === id);
  let orden = ab;
  if (yo && h) {
    const hh = c => c.hora ? String(c.hora).slice(0, 5) : null;
    const resto = ab.filter(c => c.id !== id);
    let i = resto.findIndex(c => hh(c) && hh(c) > h);
    if (i < 0) { i = 0; resto.forEach((c, k) => { if (hh(c) && hh(c) <= h) i = k + 1; }); }
    resto.splice(i, 0, yo); orden = resto;
  }
  const cambia = orden.some((c, k) => c.id !== ab[k].id);
  const nueva = cambia ? [...data.filter(c => mia(c) && !abierta(c)), ...orden, ...data.filter(c => !mia(c))] : data;
  await repintarDiaSuave(id, nueva);
  if (cambia && !(await guardarOrden(orden))) agRefrescoQuieto(id);
}

// ---- Elegir otro día: todo lo que cambia (Tu día, bandejas, cinta, «Tu semana», la semana abierta) aparece a la vez
async function agVerDia(f) {
  document.querySelectorAll('.agpop').forEach(x => x.remove());
  cerrarMesCinta();
  if (!f) return;
  if (!agN()) { AG_MODO = 'dia'; AG_FECHA = f; return cargarAgenda(); }
  const antes = AG_FECHA || f; AG_FECHA = f;
  const c = $('agcuerpo'); if (c) c.classList.add('agcargando');
  const fuera = !CINTA_INI || f < CINTA_INI || f > diasMas(CINTA_INI, 13); if (fuera) CINTA_INI = lunesCinta(f);
  const otraSem = lunesDe(f) !== lunesDe(antes);
  let s = null;
  try {
    await datosAgenda.withData([...datosAgenda.dayLoads(f), datosAgenda.loadSuggestions(f).then(x => { s = x; }), ...(fuera ? datosAgenda.stripLoads() : []), ...datosAgenda.weekLoads(f)], async () => {
      if (AG_FECHA !== f || !agN()) return;
      datosAgenda.applySuggestions(f, s);
      const piezas = [pintarTuDia(), window.delcos.screens.agenda.paintWeekSidebar()];
      if (fuera || (otraSem && AG_SEM_ABIERTA)) piezas.push(window.delcos.screens.agenda.paintStrip());
      await Promise.all(piezas);
      if (!fuera) document.querySelectorAll('#agcinta .cdia').forEach(x => x.classList.toggle('sel', x.dataset.cf === f));
      agMarcarDia(); agDiaVacio(); window.delcos.screens.agenda.refreshMetrics();
    });
  } finally { const cc = $('agcuerpo'); if (cc) cc.classList.remove('agcargando'); }
  if (AG_FECHA !== f) return;
  const cc = $('agcuerpo'); if (!cc) return;
  const top = cc.getBoundingClientRect().top;
  if (top < 80 || top > innerHeight * 0.6) scrollTo({ top: scrollY + top - 90, behavior: 'smooth' });
}

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
