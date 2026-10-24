// pantallas/agenda.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

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

async function agPintarMes(mes) {
  const caja = $('agmes'); if (!caja) return;
  const hoy = hoyISO(), actual = hoy.slice(0, 7);
  mes = mes || actual; AG_MES = mes;
  const ini = mes + '-01', d1 = new Date(ini + 'T12:00:00');
  const fin = isoMas(fechaLocal(new Date(d1.getFullYear(), d1.getMonth() + 1, 1)), -1);
  let porDia = {};
  if ((caja.dataset.mes || actual) !== mes) {
    const { data } = await rpcCache('agenda_rango', { p_desde: ini, p_hasta: fin, p_usuario: agUsuarioFiltro() }, 'agenda-mes-' + mes);
    (data || []).filter(x => !['Descartada', 'Aplazada'].includes(x.estado)).forEach(x => { porDia[x.fecha] = (porDia[x.fecha] || 0) + 1; });
    if (AG_MES !== mes || !$('agmes')) return;
    $('agmes').dataset.mes = mes;
    const hueco = (d1.getDay() + 6) % 7, nd = +fin.slice(8);
    const celdas = Array(hueco).fill('').concat(Array.from({ length: nd }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`));
    $('agmes').querySelector('.agmesgrid').innerHTML = AG_DIAS_TXT.map(x => `<span class="agmd">${x}</span>`).join('') + celdas.map(f => {
      if (!f) return '<span></span>';
      const n = porDia[f] || 0;
      return `<button type="button" class="agmc ${f === hoy ? 'hoy' : ''} ${f < hoy ? 'pasado' : ''} ${n ? 'con' : ''}" data-agdia="${f}" aria-label="${fechaCorta(f)}: ${n} citas">
        <span>${+f.slice(8)}</span>${n ? `<i class="agpt">${n > 9 ? '9+' : n}</i>` : ''}</button>`; }).join('');
  }
  const fh = $('agmes').querySelector('.fh');
  fh.classList.add('agmesh');
  fh.innerHTML = `<button type="button" class="kmv agmnav" data-agm="-1" aria-label="Mes anterior">‹</button>
    <button type="button" class="agmtit" id="agmtit" aria-label="Elegir mes y año">${esc(periodoTxt(mes).replace(/^./, c => c.toUpperCase()))}</button>
    <button type="button" class="kmv agmnav" data-agm="1" aria-label="Mes siguiente">›</button>
    ${mes !== actual ? '<button type="button" class="btn sec agmhoy" id="agmhoy">Hoy</button>' : ''}`;
  const mover = n => { const d = new Date(ini + 'T12:00:00'); d.setMonth(d.getMonth() + n); agPintarMes(fechaLocal(d).slice(0, 7)); };
  fh.querySelectorAll('[data-agm]').forEach(b => b.onclick = ev => { ev.stopPropagation(); mover(+b.dataset.agm); });
  if ($('agmhoy')) $('agmhoy').onclick = ev => { ev.stopPropagation(); agPintarMes(actual); };
  $('agmtit').onclick = ev => { ev.stopPropagation(); agElegirMes(mes, ev.currentTarget); };
  $('agmes').querySelectorAll('.agmc[data-agdia]').forEach(b => {
    b.classList.toggle('sel', b.dataset.agdia === AG_FECHA && AG_FECHA !== hoy);
    b.onclick = ev => { ev.stopPropagation(); agVerDia(b.dataset.agdia); };
  });
}

function agElegirMes(mes, ancla) {
  document.querySelectorAll('.agmpop').forEach(x => x.remove());
  let anio = +mes.slice(0, 4);
  const p = document.createElement('div'); p.className = 'agmpop';
  const nombres = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 15).toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''));
  const pinta = () => {
    p.innerHTML = `<div class="agmpoph"><button type="button" class="kmv" data-an="-1" aria-label="Año anterior">‹</button><b>${anio}</b>
      <button type="button" class="kmv" data-an="1" aria-label="Año siguiente">›</button></div>
      <div class="agmpopg">${nombres.map((n, i) => { const k = `${anio}-${String(i + 1).padStart(2, '0')}`;
        return `<button type="button" data-mk="${k}" class="${k === mes ? 'on' : ''}">${n}</button>`; }).join('')}</div>`;
    p.querySelectorAll('[data-an]').forEach(b => b.onclick = ev => { ev.stopPropagation(); anio += +b.dataset.an; pinta(); });
    p.querySelectorAll('[data-mk]').forEach(b => b.onclick = ev => { ev.stopPropagation(); p.remove(); agPintarMes(b.dataset.mk); });
  };
  pinta();
  document.body.appendChild(p);
  const r = ancla.getBoundingClientRect(), w = Math.min(280, innerWidth - 20);
  p.style.width = w + 'px';
  p.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2)) + 'px';
  p.style.top = Math.min(innerHeight - p.offsetHeight - 10, r.bottom + 6) + 'px';
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

async function agMenusCinta() {
  const cin = $('agcinta'); if (!cin) return;
  const ini = cin.dataset.ini; if (!ini) return;
  const bloq = await agBloqueos(ini, 14);
  if ($('agcinta') !== cin) return;
  cin.querySelectorAll('button').forEach(b => {
    const f = b.dataset.cf || b.dataset.agdia || b.dataset.f || b.dataset.fecha; if (!f || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return;
    b.classList.add('cdia'); b.classList.toggle('bloq', !!bloq[f]);
    if (bloq[f]) b.dataset.bloq = bloq[f]; else delete b.dataset.bloq;
    if (f >= hoyISO() && !b.querySelector('.cdmas')) {
      b.insertAdjacentHTML('beforeend', '<span class="cdmas" role="button" tabindex="0" aria-label="Opciones del día" title="Opciones del día">⋯</span>');
      const m = b.querySelector('.cdmas');
      const abrir = ev => { ev.stopPropagation(); ev.preventDefault(); menuDiaSemana(m, f, b.classList.contains('bloq')); };
      m.addEventListener('click', abrir, true); m.addEventListener('keydown', ev => { if (ev.key === 'Enter') abrir(ev); });
    }
  });
}

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
  if (typeof agPastillas === 'function') agPastillas();
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
function agPastillasHtml() {
  const d = AG_MET; if (!d) return '';
  const n1 = x => num(x == null ? 0 : x), dec = x => (x == null ? '0' : String(x).replace('.', ','));
  const h = d.hoy || {}, s = d.semana || {}, c = d.cierres || {}, p = d.pendientes || {};
  let hechas = n1(h.visitadas), total = n1(h.citas);
  // «Hoy», con las mismas citas que Tu día cuando se ve hoy
  if (AG_FECHA === hoyISO() && Array.isArray(TD_CITAS) && TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA) {
    const act = TD_CITAS.filter(x => !citaAnulada(x.estado));
    hechas = num(act.filter(x => !CITA_ABIERTA.includes(x.estado)).length); total = num(act.length);
  }
  const vp = TT('visita', 'p', '', 'l', 'l');
  return [
    ['Hoy', `${hechas}/${total}`, `${hechas} de ${total} citas · media ${dec(d.media_dia)} ${vp}/día`, ''],
    ['Semana', n1(s.visitas), `${n1(s.visitas)} ${vp} · media ${dec(s.media)}/semana`, ''],
    ['Cierres', n1(c.hoy), `${n1(c.hoy)} cierres con éxito hoy · media ${dec(c.media_dia)}/día`, ''],
    ['Por visitar', n1((p.urgentes || 0) + (p.sin_visita || 0)), `${n1(p.urgentes)} urgentes · ${n1(p.sin_visita)} sin ${TT('visita', 's', '', 'l', 'l')} en 60 días`, 'agp-pend']
  ].map(([t, b, tit, cl]) => `<span class="agp ${cl}" title="${esc(tit)}">${esc(t)} <b>${esc(b)}</b></span>`).join('');
}

// «En este centro también»: cada centro de sugerencias_centros va en la primera cita del día que está allí (a menos de 200 m)
function agTamb() {
  const cuerpo = $('agcuerpo'); if (!cuerpo || !AG_SUG || AG_SUG.fecha !== AG_FECHA) return;
  cuerpo.querySelectorAll('.agtamb').forEach(x => x.remove());
  const tarjetas = [...cuerpo.querySelectorAll('.tdu[data-tdu]')]; if (!tarjetas.length) return;
  const cita = id => (TD_CITAS || []).find(c => String(c.id) === String(id));
  const ya = agConCitaHoy(), usadas = new Set();
  AG_SUG.centros.forEach(g => {
    const gente = (g.cuentas || g.medicos || []).filter(m => !ya.has(m.id)); if (!gente.length) return;
    const t = tarjetas.find(x => {
      const c = cita(x.dataset.tdu); if (!c || usadas.has(x)) return false;
      if (g.lat != null && c.lat != null) return km([+g.lat, +g.lon], [+c.lat, +c.lon]) <= 0.2;
      return g.centro_nombre && c.centro_nombre && agImp(g.centro_nombre) === agImp(c.centro_nombre);
    });
    if (!t) return;
    usadas.add(t);
    // v2.303: agrupados por cuándo atienden en ese centro el día de la cita (mañana, tarde, otro día); con más de 6, los primeros
    const chip = m => `<button type="button" data-agti="${m.id}" data-agtv="${m.visitar ? 1 : ''}" title="${esc(m.visitar ? 'Añadir una cita · ' + m.visitar : 'Ver su ficha' + (m.falta && m.falta.length ? ' · falta: ' + m.falta.join(', ') : ''))}">${m.visitar ? '<i>+</i> ' : ''}${esc(m.nombre)}</button>`;
    const grupos = agTambGrupos(gente.slice(0, 6), AG_FECHA);
    const chips = grupos.map(([t2, l]) => `<div class="agtambg"><span class="agtambgt">${esc(t2)}</span><div class="agtambl">${l.map(chip).join('')}</div></div>`).join('')
      + (gente.length > 6 ? `<span class="sm">y ${gente.length - 6} más</span>` : '');
    const pie = t.querySelector('.tdu-pie') || t.lastElementChild;
    pie.insertAdjacentHTML('beforebegin', `<div class="agtamb${g.centro_id ? ' agtambc' : ''}"${g.centro_id ? ` data-agtc="${esc(g.centro_id)}" role="button" tabindex="0" title="Abrir la ficha del centro"` : ''}><div class="agtambh">${svgIco(ICON_NOM['map-pin'])} En este centro también${g.centro_id ? '<span class="agtambver">Ver el centro ›</span>' : ''}</div>${chips}</div>`);
  });
}

// Mañana / tarde / otro día según el horario de su consulta (ubicaciones.dias: {"L": "Mañana 10:00-13:00", "X": "16-19"…})
function agTambGrupos(gente, fecha) {
  const letra = 'DLMXJVS'[new Date(fecha + 'T12:00:00').getDay()], NOM = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes', S: 'sábado', D: 'domingo' };
  const g = { m: [], t: [], o: [], s: [] }, otros = new Set();
  gente.forEach(m => {
    const d = m.dias || {}, hoy = d[letra], ks = Object.keys(d).filter(k => d[k]);
    if (!ks.length) { g.s.push(m); return; }
    if (!hoy) { g.o.push(m); ks.forEach(k => otros.add(k)); return; }
    const h = parseInt((String(hoy).match(/(\d{1,2})(?::\d{2})?/) || [])[1], 10);
    (/tarde/i.test(hoy) || (!/ma[ñn]ana/i.test(hoy) && h >= 14) ? g.t : g.m).push(m);
  });
  const dOtros = 'LMXJVSD'.split('').filter(k => otros.has(k)).map(k => NOM[k]);
  return [['Por la mañana', g.m], ['Por la tarde', g.t], ['Otro día' + (dOtros.length && dOtros.length <= 3 ? ' (' + dOtros.join(', ') + ')' : ''), g.o], ['Sin horario', g.s]].filter(([, l]) => l.length);
}

// Bandejas bajo la cabecera de «Tu día»
function agTocaLista() { const ya = agConCitaHoy(); return AG_SUG && AG_SUG.fecha === AG_FECHA ? AG_SUG.toca.filter(m => !ya.has(m.id || m.cuenta_id)) : []; }

function agCargaRango(d, h, u, clave) {
  const k = agK('agenda_rango', d, h, u); if (AG_PRE.has(k)) return null;
  return rpcCache('agenda_rango', { p_desde: d, p_hasta: h, p_usuario: u }, clave).then(r => { AG_PRE.set(k, r); });
}

function agCargaBloq(d, h) {
  const k = agK('bloq', d, h, agUid()); if (AG_PRE.has(k)) return null;
  return bloqueadosSemana(d, h).catch(() => ({})).then(b => { AG_PRE.set(k, b || {}); });
}

// Lo que necesita cada pieza (con los mismos parámetros con que la pieza los pide)
function agDiaCargas(f) {
  return [TD_PRESET && TD_PRESET.fecha === f ? null : agCargaRango(f, f, agUsuarioFiltro(), 'agenda-' + f), Promise.resolve(tareasDelDia(f)).catch(() => null)];
}

function agCintaCargas() {
  const ini = CINTA_INI || lunesCinta(AG_FECHA || hoyISO());
  return [agCargaRango(ini, diasMas(ini, 13), agUid(), 'agenda-cinta-' + agUid() + '-' + ini), agCargaBloq(ini, isoMas(ini, 13))];
}

function agSemCargas(f) { const d = lunesDe(f || AG_FECHA || hoyISO()); return [agCargaRango(d, isoMas(d, 6), agUsuarioFiltro(), 'agenda-' + d), agCargaBloq(d, isoMas(d, 6))]; }

function agSugDatos(f) {
  const hoy = hoyISO(), uid = agUid(), yo = uid === PERFIL.id, nada = { data: [] };
  const seguro = p => Promise.resolve(p).catch(() => nada);
  return Promise.all([
    seguro(RPC_ORIG('pendientes_ruta', {})),
    f >= hoy ? seguro(db.rpc('toca_actividad', { p_usuario: yo && VE_TODO() ? null : uid, lim: 60 })) : nada,
    f >= hoy ? seguro(RPC_ORIG('sugerencias_centros', { p_fecha: f, p_usuario: yo ? null : uid })) : nada
  ]).then(([rp, rt, rc]) => ({ f, pend: (rp && rp.data) || [], toca: (rt && rt.data) || [], centros: (rc && rc.data) || [] }));
}

function agPonerSug(f, s) { if (!s || s.f !== f) return; AG_PEND = s.pend; AG_SUG = { fecha: f, toca: s.toca, centros: s.centros }; }

// Pide todo lo de «cargas» y después pinta sin esperar a la red (los datos quedan en AG_PRE hasta el final de ese pintado)
async function agConDatos(cargas, pintar) {
  AG_PRE_USO++;
  try {
    await Promise.all((cargas || []).filter(Boolean).map(p => Promise.resolve(p).catch(() => null)));
    return await pintar();
  } finally { setTimeout(() => { if (--AG_PRE_USO <= 0) { AG_PRE_USO = 0; AG_PRE.clear(); } }, 0); }
}

// ---- La Agenda: vista del día (con la semana o el mes abiertos si se piden) o Equipo
async function cargarAgenda() {
  if (TAB !== 'agenda' || !$('v-agenda')) return;
  if (AG_MODO === 'equipo') return agCargarEquipo();
  const mes = AG_MODO === 'mes', plan = ABRIR_PLAN_SEMANA;
  if (AG_MODO === 'semana') AG_SEM_ABIERTA = true;
  AG_MODO = 'dia'; ABRIR_PLAN_SEMANA = false;
  await agCargarDia();
  if (mes) agMesPop();
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
  await agConDatos([...agDiaCargas(f), agSugDatos(f).then(x => { s = x; }),
    Promise.resolve(RPC_ORIG('agenda_metricas', { p_usuario: AG_VISTA ? AG_VISTA.id : null })).then(r => { met = r && r.data; }),
    ...agCintaCargas(), ...agSemCargas(f), VE_TODO() && !COMS.length ? cargarComerciales() : null], async () => {
    if (AG_FECHA !== f || TAB !== 'agenda' || AG_MODO !== 'dia') return;
    if (met) AG_MET = met;
    agPonerSug(f, s);
    v.classList.add('agunida', 'agcinta', 'agb', 'agn');
    v.innerHTML = `
      <div class="saludo"><div><h1>Agenda</h1><div class="fecha" id="agtit">${esc('Hoy · ' + fechaLarga(new Date(hoyISO() + 'T00:00:00')) + (AG_VISTA ? ' · agenda de ' + AG_VISTA.nombre : ''))}</div></div>
        <div class="aghud" id="aghud" aria-label="Tus números">${agPastillasHtml()}</div>
        <div class="acts" style="margin:0"><button class="btn" data-ag="nueva">+ Nueva cita</button></div></div>
      <div class="card" id="agcuerpo"></div>
      <div class="card" id="agsemlat"></div>`;
    asegurarEquipo();
    await Promise.all([pintarTuDia(), agCinta(), agSemanaLateral()]);
    agMarcarDia(); agDiaVacio();
    if (!AG_VISTA) avisoSinSalida($('agcuerpo'));
    if (mismo) window.scrollTo(0, y);
    v.dataset.listo = '1';
    // Si una bandeja estaba abierta (p. ej. tras «Mover a hoy»), se repinta con lo nuevo
    if ($('tools') && $('tools').classList.contains('abierto') && /^agband-/.test(typeof HERR_CTX !== 'undefined' && HERR_CTX || '')) agBandeja(HERR_CTX.slice(7));
  });
}

// «Ver la semana» / «Ocultar la semana»: el botón dice lo que hay pintado (cambia cuando la semana ya está)
function agBotonSemana() {
  const b = $('cplan'); if (!b) return;
  const ab = !!$('agsemexp');
  b.innerHTML = `${svgIco(ICON_NOM['calendar-days'] || ICON_NOM.info)}<span>${ab ? 'Ocultar la semana' : 'Ver la semana'}</span>`;
  b.title = ab ? 'Ocultar la semana' : 'Ver la semana entera, moverla y repartirla';
  b.setAttribute('aria-expanded', String(ab));
  b.onclick = async ev => {
    ev.stopPropagation(); ev.preventDefault();
    if (b.dataset.ocupado) return; b.dataset.ocupado = '1';
    AG_SEM_ABIERTA = !ab;
    try { await agPintarSemanaExp(); } finally { delete b.dataset.ocupado; agBotonSemana(); }
  };
}

async function agRepartirSemana() {
  AG_SEM_ABIERTA = true;
  await agPintarSemanaExp(); agBotonSemana();
  const p = $('semplan'); if (p) { $('agsemexp').scrollIntoView({ behavior: 'smooth', block: 'start' }); p.click(); }
}

// El mes se abre ya pintado
async function agMesPop() {
  let m = $('agmes');
  if (m && m.classList.contains('pop')) { cerrarMesCinta(); return; }
  if (!m) { $('v-agenda').insertAdjacentHTML('beforeend', '<div class="card agmes" id="agmes"><div class="fh"></div><div class="agmesgrid"></div></div>'); m = $('agmes'); }
  m.dataset.mes = '-';
  await agPintarMes(AG_MES || (AG_FECHA || hoyISO()).slice(0, 7));
  const b = $('cmesb'); if (!b || !$('agmes')) return;
  m.classList.add('pop'); b.setAttribute('aria-expanded', 'true');
  const r = b.getBoundingClientRect(), w = Math.min(380, innerWidth - 32);
  Object.assign(m.style, { top: Math.round(r.bottom + 8) + 'px', left: Math.round(Math.max(16, Math.min(r.left, innerWidth - w - 16))) + 'px', bottom: 'auto', right: 'auto' });
}

// ---- Pastillas, cifras y bandejas
function agPastillas() {
  if (!agN()) return;
  const h = $('aghud'); if (!h || !AG_MET) return;
  const html = agPastillasHtml(); if (h.__html !== html) { h.innerHTML = html; h.__html = html; }   // solo si cambia alguna cifra
}

async function agMetricas() {
  if (!agN()) return;
  const { data } = await RPC_ORIG('agenda_metricas', { p_usuario: AG_VISTA ? AG_VISTA.id : null });
  if (!data || !agN()) return;
  AG_MET = data; agPastillas();
}

// Tras un cambio (mover, registrar, notas…): cifras, cinta, «Tu semana», bandejas y el mes si está abierto, de una vez
function agCifrasQuietas() {
  if (!agN()) return;
  const f = AG_FECHA; let s = null;
  agMetricas();
  agConDatos([...agCintaCargas(), ...agSemCargas(f), agSugDatos(f).then(x => { s = x; })], async () => {
    if (AG_FECHA !== f || !agN()) return;
    agPonerSug(f, s);
    await Promise.all([agCinta(), agSemanaLateral()]);
    agTamb(); agBandejas();
  });
  const m = $('agmes'); if (m && m.classList.contains('pop')) { m.dataset.mes = '-'; agPintarMes(AG_MES); }
}

function agBandeja(k) {
  if (!agN()) return;
  const d = $('tools'); if (!d) return;
  const toca = k === 'toca';
  const l = toca ? agTocaLista() : (AG_PEND || []);
  const vis = TT('visita', 's', '', 'l', 'l');
  const tit = toca ? `Les toca ${vis}` : 'Pendientes de días anteriores';
  const txt = toca ? `Según la frecuencia objetivo de cada ${TT('medico', 's', '', 'l', 'l')}. Añádelos a este día o planifica una ruta con ellos.` : 'Los planificaste y no se visitaron. Muévelos a hoy o descártalos.';
  const fila = m => toca
    ? `<div class="item" style="cursor:default"><span class="ic">${svgIco(ICON_NOM.target)}</span>
        <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc([m.estado_comercial, m.dias_sin_visita != null ? m.dias_sin_visita + ` días sin ${vis}` : 'nunca visitado', m.municipio].filter(Boolean).join(' · '))}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" data-agbf="${m.id}">Ficha</button><button class="btn sec" data-agbc="${m.id}">+ Cita</button></span></div>`
    : `<div class="item" style="cursor:default"><span class="ic w">!</span>
        <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${fechaCorta(m.fecha)}${m.centro_nombre ? ' · ' + esc(m.centro_nombre) : ''}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" data-cita="hoy|${m.id}">Mover a hoy</button><button class="btn sec" data-cita="desc|${m.id}">Descartar</button></span></div>`;
  d.innerHTML = `<div class="tbox"><div class="fh"><h2>${esc(tit)}</h2><button class="x" id="tclose" aria-label="Cerrar">✕</button></div><p class="sm">${esc(txt)}</p>
    <div class="acts" style="margin:8px 0">${toca && l.some(m => m.lat) ? '<button class="btn sec" id="agbruta">Planificar ruta</button>' : ''}${!toca && l.length ? '<button class="btn sec" id="agbrepro">Reprogramar todas</button>' : ''}</div>
    <div class="agbdc"><div class="lista">${l.map(fila).join('') || '<div class="vacio">Nada pendiente.</div>'}</div></div></div>`;
  $('tclose').onclick = () => d.classList.remove('abierto');
  d.querySelectorAll('[data-agbf]').forEach(b => b.onclick = () => abrirFicha(b.dataset.agbf));
  d.querySelectorAll('[data-agbc]').forEach(b => b.onclick = () => nuevaCita(b.dataset.agbc, AG_FECHA));
  if ($('agbruta')) $('agbruta').onclick = async e => { const bt = e.currentTarget; d.classList.remove('abierto'); ir('rutas'); await new Promise(r => setTimeout(r, 60)); planDesdeLista(l, 'toca', bt); };
  if ($('agbrepro')) $('agbrepro').onclick = () => reprogramarCitas(l, 'Pendientes de días anteriores', `${l.length} sin visitar`);
  if (typeof HERR_CTX !== 'undefined') HERR_CTX = 'agband-' + k;
  d.classList.add('abierto');
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

function cerrarMesCinta() { const m = $('agmes'); if (m) m.classList.remove('pop'); if ($('cmesb')) $('cmesb').setAttribute('aria-expanded', 'false'); }

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
const AG_DIAS_TXT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const agUnida = () => TAB === 'agenda' && AG_MODO === 'dia';   // v2.146.0: también con otro día elegido (antes solo hoy)

const RP_JORNADA = 300;   // minutos de una jornada de propuestas (5 h) si la ruta no dice otra cosa

// «⋯»: pulsar el mismo botón con su menú abierto lo cierra (antes lo volvía a abrir)
let TDM_BOTON = null;

// ---- 2. El mes de la Agenda, en cualquier mes y año
let AG_MES = null;

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
const agConCitaHoy = () => new Set((TD_CITAS || []).filter(c => !citaAnulada(c.estado)).map(c => c.cuenta_id));

const agImp = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Subir o bajar una cita no recarga la Agenda aunque otra pantalla (Inicio pide las citas de hoy) haya pedido otro día entretanto:
// se guarda lo último de cada día y se usa el del día que se ve
const AG_DIAS_DATOS = {};

const agK = (fn, d, h, u) => [fn, d, h, u || ''].join('|');

const tdClaveXY = (a, b) => a && b && a[0] != null && b[0] != null ? `${(+a[0]).toFixed(5)},${(+a[1]).toFixed(5)}>${(+b[0]).toFixed(5)},${(+b[1]).toFixed(5)}` : '';

const tdRealVigente = () => TD_REAL && Date.now() - TD_REAL.t < 600000;

// Tareas del día plegables: un clic en su título las oculta todas y se ven solo las citas (se recuerda en este dispositivo)
const tdTareasPlegadas = () => { try { return localStorage.getItem('delcos-tareas-plegadas') === '1'; } catch (e) { return false; } };
