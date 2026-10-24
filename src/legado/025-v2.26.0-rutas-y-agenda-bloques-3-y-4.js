/* ============================================================
   DLC OS 2.0 · v2.26.0 · Rutas y Agenda, bloques 3 y 4:
   planificador semanal, días bloqueados, frecuencia objetivo,
   supervisión del equipo y aviso de horario de atención
   ============================================================ */

/* ---------------- qué agenda se está viendo ---------------- */

let AG_VISTA = null;   // { id, nombre, rol, preferencias } cuando administración mira la agenda de otra persona
function prefsActivas() { return (TAB === 'agenda' && AG_VISTA && AG_VISTA.preferencias) || PERFIL.preferencias || {}; }


/* ---------------- días bloqueados ---------------- */

async function bloqueadosSemana(desde, hasta) {
  const { data } = await RPC_ORIG('dias_bloqueados_rango', { p_desde: desde, p_hasta: hasta, p_usuario: agUid() });
  const b = {}; (data || []).forEach(x => b[x.fecha] = x.motivo || 'Día bloqueado');
  return b;
}


/* ---------------- semana: carga, bloqueos, arrastrar y planificador ---------------- */

let SEM_BORRADOR = null;   // propuesta del planificador aún sin guardar


/* Planificador: reparte médicos entre los días de la semana */
async function planificarSemana(desde, dias, bloq, porDia) {
  const libres = dias.filter(f => f >= hoyISO() && !bloq[f] && new Date(f + 'T12:00:00').getDay() % 6 !== 0);
  if (!libres.length) { toast('No quedan días laborables libres esta semana', true); return; }
  const { data: rutas } = await RPC_ORIG('rutas_visibles', {});
  const misRutas = (rutas || []).filter(x => !AG_VISTA || x.usuario_id === agUid() || x.visible_para === '*');
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Planificar la semana${AG_VISTA ? ' de ' + esc(AG_VISTA.nombre) : ''}</h2>
      <div class="sm">Reparte ${TT('medico', 'p', 'el', 'l', 'l')} entre los días, cada uno un día que atienda y agrupados por zona</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="spfuente">¿A quién?</label>
    <select id="spfuente">
      <option value="toca">A quien le toca ${TT('visita', 's', '', 'l', 'l')} (según su frecuencia objetivo)</option>
      <option value="urgentes">Urgentes sin visitar</option>
      <option value="interesados">${TT('medico', 'p', '', 'l', 'C', 'interesado')} sin ${TT('visita', 's', '', 'l', 'l')} en 20 días</option>
      <option value="sin_visitar">Nunca visitados</option>
      ${misRutas.map(x => `<option value="ruta:${x.id}">Ruta: ${esc(x.nombre)}</option>`).join('')}
    </select>
    <label>Días</label>
    <div class="spdias">${dias.slice(0, 5).map(f => {
      const ok = libres.includes(f);
      return `<label class="opt ${ok ? '' : 'off'}" style="margin:0"><input type="checkbox" data-spd="${f}" ${ok ? 'checked' : 'disabled'}>
        ${DIAN[LETRA_DIA(f)].slice(0, 3)} ${new Date(f + 'T12:00:00').getDate()}${bloq[f] ? ' · bloqueado' : f < hoyISO() ? ' · pasado' : ''}</label>`;
    }).join('')}</div>
    <div class="g2">
      <div><label for="spmax">Máximo de ${TT('visita', 'p', '', 'l', 'l', 'nuevo')} por día</label><input id="spmax" type="number" min="1" max="30" placeholder="Hasta la hora de vuelta"></div>
      <div><label for="spsal">Hora de salida</label><input id="spsal" type="time" value="${esc((prefsActivas().plan_semana || {}).salida || '')}"></div>
      <div><label for="spvue">Vuelta como tarde</label><input id="spvue" type="time" value="${esc((prefsActivas().plan_semana || {}).vuelta || '')}"></div>
      <div><label>Tiempos</label><div class="sm" style="padding-top:12px">${TIEMPOS().visita} min por ${TT('medico', 's', '', 'l', 'l')} · sin hora de vuelta, sin límite</div></div>
    </div>
    <p class="sm">Las citas que ya hay en la agenda se respetan y cuentan para el tiempo de cada día. No se proponen ${TT('medico', 'p', '', 'l', 'l')} que ya tienen una cita abierta.</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="spok">Proponer reparto</button></div>`;
  $('dlg').showModal();
  $('spok').onclick = async ev => {
    const fuente = $('spfuente').value;
    const usar = [...$('dbody').querySelectorAll('[data-spd]:checked')].map(x => x.dataset.spd);
    if (!usar.length) { toast('Elige al menos un día', true); return; }
    const max = +$('spmax').value || null;
    ev.target.disabled = true; ev.target.textContent = 'Calculando…';
    let lista = [];
    if (fuente === 'toca') lista = (await db.rpc('toca_actividad', { p_usuario: agUid() === PERFIL.id && VE_TODO() ? null : agUid(), lim: 300 })).data || [];
    else if (fuente.startsWith('ruta:')) lista = (await db.rpc('cuentas_de_ruta', { p_id: fuente.slice(5) })).data || [];
    else lista = ((await db.rpc('propuestas_rutas', { lim: 200 })).data || {})[fuente] || [];
    // Fuera los que ya tienen cita abierta
    const { data: futuras } = await RPC_ORIG('agenda_rango', { p_desde: hoyISO(), p_hasta: isoMas(hoyISO(), 60), p_usuario: agUid() });
    const conCita = new Set((futuras || []).filter(c => CITA_ABIERTA.includes(c.estado)).map(c => c.cuenta_id));
    lista = await conHorarios(lista.filter(m => !conCita.has(m.id)));
    // Aviso de visita reciente: fuera los que se han visto hace poco
    const av = avisoRevisita(); let recientes = [];
    if (av.on && lista.length) {
      const { data: rv } = await db.rpc('actividades_recientes', { p_ids: lista.map(m => m.id), p_desde: isoMas(hoyISO(), -av.dias), p_hasta: hoyISO() });
      const vistos = {}; (rv || []).filter(x => x.tipo === 'visita').forEach(x => { if (!vistos[x.cuenta_id] || x.fecha > vistos[x.cuenta_id].fecha) vistos[x.cuenta_id] = x; });
      recientes = lista.filter(m => vistos[m.id]).map(m => ({ m, motivo: `visitado el ${fechaCorta(vistos[m.id].fecha)}${vistos[m.id].usuario ? ' (' + vistos[m.id].usuario + ')' : ''}` }));
      lista = lista.filter(m => !vistos[m.id]);
    }
    // v2.76.0: el horario es el de esta planificación (se recuerda como el último usado)
    const hs = { salida: ($('spsal') || {}).value || null, vuelta: ($('spvue') || {}).value || null };
    if (JSON.stringify(hs) !== JSON.stringify(prefsActivas().plan_semana || {})) {
      const prefs = Object.assign({}, PERFIL.preferencias || {}, { plan_semana: hs });
      db.rpc('guardar_preferencias', { p: prefs }).then(({ data }) => { PERFIL.preferencias = data || prefs; }, () => {});
    }
    SEM_BORRADOR = conHor(hs, () => repartirSemana(lista, usar, porDia, max, desde));
    SEM_BORRADOR.horario = hs.salida || hs.vuelta ? hs : null;
    SEM_BORRADOR.sinDia = SEM_BORRADOR.sinDia.concat(recientes);
    ev.target.disabled = false; ev.target.textContent = 'Proponer reparto';
    $('dlg').close();
    if (!SEM_BORRADOR.total) toast(`No cabe ${TT('visita', 's', 'ningun', 'l', 'l', 'nuevo')} con estos datos`, true);
    pintarSemanaAgenda();
  };
}

function repartirSemana(lista, usar, porDia, max, desde) {
  const cfg = PLANCFG(), sal = salidaUsuario(), uid = agUid();
  let pend = lista.filter(m => m.lat != null && m.lon != null).map(m => ({ m, xy: [+m.lat, +m.lon] }));
  const sinDia = lista.filter(m => m.lat == null || m.lon == null).map(m => ({ m, motivo: 'sin ubicación' }));
  const out = { semana: desde, uid, dias: {}, sinDia, total: 0 };
  usar.forEach(f => {
    const ahora = new Date(), minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const t0 = f === hoyISO() ? Math.max(minHora(cfg.salida), Math.ceil(minAhora / 5) * 5) : minHora(cfg.salida);
    const disponibles = pend.filter(p => { const v = ventanasDe(p.m.dias, f); return !(v && !v.length); });
    if (!disponibles.length) { out.dias[f] = []; return; }
    // Semilla: el que menos días puede ir (y urgente antes), para no dejarlo sin hueco
    const nDias = p => usar.filter(g => { const v = ventanasDe(p.m.dias, g); return !(v && !v.length); }).length;
    disponibles.sort((a, b) => nDias(a) - nDias(b) || (b.m.urgente ? 1 : 0) - (a.m.urgente ? 1 : 0) || km([sal.lat, sal.lon], a.xy) - km([sal.lat, sal.lon], b.xy));
    const semilla = disponibles[0].xy;
    const cerca = disponibles.slice().sort((a, b) => km(semilla, a.xy) - km(semilla, b.xy)).slice(0, 40);
    const existentes = (porDia[f] || []).filter(c => c.usuario_id === uid && CITA_ABIERTA.includes(c.estado));
    const items = existentes.map(c => ({ id: c.id, ref: { existente: c }, xy: xyCita(c), ventanas: ventanasDe(c.dias, f), fija: minHora(c.hora) }))
      .concat(cerca.map(p => ({ id: p.m.id, ref: { p }, xy: p.xy, ventanas: ventanasDe(p.m.dias, f), fija: null })));
    const { seq } = programarVisitas(items, t0);
    let nuevas = seq.filter(s => s.it.ref.p);
    if (max) nuevas = nuevas.slice(0, max);
    const elegidos = new Set(nuevas.map(s => s.it.ref.p));
    out.dias[f] = seq.filter(s => s.it.ref.existente || elegidos.has(s.it.ref.p)).map(s => s.it.ref.existente
      ? { existente: s.it.ref.existente }
      : { m: s.it.ref.p.m, ini: s.ini, cita: { id: 'nueva-' + s.it.ref.p.m.id, fecha: f, dias: s.it.ref.p.m.dias, lat: s.it.ref.p.xy[0], lon: s.it.ref.p.xy[1] } });
    pend = pend.filter(p => !elegidos.has(p));
  });
  // Solo las nuevas cuentan en la vista; las existentes se guardan para respetar el orden al guardar
  out.orden = {};
  usar.forEach(f => { out.orden[f] = out.dias[f] || []; out.dias[f] = (out.dias[f] || []).filter(x => !x.existente); });
  out.total = usar.reduce((n, f) => n + out.dias[f].length, 0);
  pend.forEach(p => {
    const algun = usar.some(g => { const v = ventanasDe(p.m.dias, g); return !(v && !v.length); });
    sinDia.push({ m: p.m, motivo: algun ? 'no cabe en los días elegidos' : 'no atiende ninguno de los días elegidos' });
  });
  return out;
}

async function guardarBorradorSemana(btn) {
  const b = SEM_BORRADOR; if (!b) return;
  btn.disabled = true; btn.textContent = 'Guardando…';
  let n = 0;
  for (const f of Object.keys(b.orden)) {
    const ids = [];
    for (const x of b.orden[f]) {
      if (x.existente) { ids.push(x.existente.id); continue; }
      const { data: r } = await db.rpc('guardar_cita', { p: { cuenta_id: x.m.id, fecha: f, hora: null,
        centro_nombre: x.m.centro_nombre || null, estado: 'Planificada', origen: 'Planificador semanal',
        usuario_id: b.uid !== PERFIL.id ? b.uid : null, op_id: 'ps-' + x.m.id + '-' + f,
        salida: (b.horario || {}).salida || null, vuelta: (b.horario || {}).vuelta || null } });
      if (r && r.ok) { ids.push(r.id); n++; }
    }
    if (ids.length) await db.rpc('ordenar_citas', { p_ids: ids });
  }
  SEM_BORRADOR = null;
  toast(`${n} citas guardadas en la agenda`);
  cargarAgenda(); cargarInicio();
}

/* ---------------- supervisión del equipo ---------------- */

async function pintarEquipo() {
  $('agcuerpo').innerHTML = `<div class="semhead"><h2 style="padding:0">Equipo y cumplimiento</h2>
      ${puede('administrar') ? '<button class="btn sec" id="eqfrec">⚙ Frecuencia objetivo</button>' : ''}</div>
    <div class="filtros" style="border:0;padding:4px 16px 10px"><div id="eqper"></div></div>
    <div id="eqtabla"></div>`;
  if ($('eqfrec')) $('eqfrec').onclick = editorFrecuencia;
  const pinta = async () => {
    cargando($('eqtabla'), 'Calculando…');
    const r = $('eqper').__rango();
    const { data, error } = await RPC_ORIG('supervision_equipo', { p_desde: r.desde || '2000-01-01', p_hasta: r.hasta || isoMas(hoyISO(), 365) });
    if (error) { $('eqtabla').innerHTML = `<div class="vacio">${esc(error.message)}</div>`; return; }
    const l = data || [];
    const pct = x => { const base = x.visitadas + x.no_estaba + x.aplazadas + x.sin_hacer; return base ? Math.round(x.visitadas / base * 100) : null; };
    $('eqtabla').innerHTML = l.length ? `<div class="dgrid-wrap"><div class="dgrid eq">
      <div class="dh"><span>Persona</span><span class="num">Cartera</span><span class="num">Citas</span><span class="num">Visitadas</span>
        <span class="num">No estaba</span><span class="num">Aplazadas</span><span class="num">Sin hacer</span><span>Cumplimiento</span>
        <span class="num">${TT('visita', 'p', '', 'l', 'C')}</span><span class="num">Les toca</span></div>
      ${l.map(x => { const p = pct(x); return `<button class="dr" data-eqver="${x.id}" title="Ver su agenda">
        <span><b>${esc(x.nombre)}</b><span class="sm">${esc(x.rol)}</span></span>
        <span class="num">${num(x.cartera)}</span><span class="num">${num(x.citas)}</span>
        <span class="num"><b style="color:var(--ok)">${num(x.visitadas)}</b></span><span class="num">${num(x.no_estaba)}</span>
        <span class="num">${num(x.aplazadas)}</span><span class="num" style="${x.sin_hacer ? 'color:var(--warn);font-weight:700' : ''}">${num(x.sin_hacer)}</span>
        <span>${p == null ? '<span class="vac">—</span>' : `<span class="barra"><i style="width:${p}%;${p < 60 ? 'background:var(--warn)' : ''}"></i><em>${p}%</em></span>`}</span>
        <span class="num">${num(x.visitas)}</span>
        <span class="num" style="${x.atrasados ? 'color:var(--warn);font-weight:700' : ''}">${num(x.atrasados)}</span></button>`; }).join('')}
    </div></div>
    <p class="sm" style="padding:10px 16px 14px"><b>Cumplimiento</b> = visitadas sobre las citas de días ya pasados (visitadas, no estaba, aplazadas y sin hacer).
      <b>Les toca</b> = ${TT('medico', 'p', '', 'l', 'l')} de su cartera que llevan más tiempo sin ${TT('visita', 's', '', 'l', 'l')} que su frecuencia objetivo. Pulsa una persona para ver su agenda.</p>`
      : '<div class="vacio">Sin actividad en este periodo.</div>';
    $('eqtabla').querySelectorAll('[data-eqver]').forEach(b => b.onclick = () => { AG_MODO = 'semana'; AG_FECHA = hoyISO(); verAgendaDe(b.dataset.eqver); });
  };
  montarPeriodo($('eqper'), { id: 'equipo', valor: 'semana', alCambiar: pinta });
  pinta();
}

async function editorFrecuencia() {
  await cargarAjustes();
  const REC = { inicial: 60, avance: 30, interes: 15, positivo: 30, negativo: 0 };
  const f = Object.assign(Object.fromEntries(ESTADOS_DEF.map(x => [x.valor, REC[x.papel] || 0])), AJUSTES.frecuencia || {});
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Frecuencia objetivo de ${TT('visita', 's', '', 'l', 'l')}</h2>
      <div class="sm">Cada cuántos días hay que visitar a ${TT('medico', 's', 'un', 'l', 'l')} según su estado. 0 = no se exige.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    ${Object.keys(f).map(k => `<div class="g2" style="align-items:center"><div><b>${esc(k)}</b></div>
      <div><input type="number" min="0" max="365" data-frec="${esc(k)}" value="${+f[k] || 0}" aria-label="Días para ${esc(k)}"></div></div>`).join('')}
    <p class="sm">Se usa en «A quien le toca ${TT('visita', 's', '', 'l', 'l')}» (planificador y sugerencias) y en la columna «Les toca» del equipo.</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="frok">Guardar</button></div>`;
  $('dlg').showModal();
  $('frok').onclick = async () => {
    const v = {}; $('dbody').querySelectorAll('[data-frec]').forEach(i => v[i.dataset.frec] = Math.max(0, +i.value || 0));
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'frecuencia', p_valor: v });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    AJUSTES.frecuencia = v; $('dlg').close(); toast('Frecuencia guardada'); invalidarCache();
    if (AG_MODO === 'equipo') pintarEquipo();
  };
}

/* ---------------- cabecera de la agenda: de quién es y equipo ---------------- */


document.addEventListener('click', e => {
  const b = e.target.closest('[data-ag="equipo"]');
  if (!b) return;
  e.stopImmediatePropagation();
  AG_MODO = 'equipo'; cargarAgenda();
}, true);

// Al salir de la agenda se vuelve a la propia

/* ---------------- aviso: falta el horario de atención ---------------- */




/* ---------------- ayudas ---------------- */

AYUDA.agenda[2].push(
  'En la <b>semana</b>: la hora con «~» junto al día es el fin estimado (en naranja si pasa de la hora de vuelta con la que se planificó). Arrastra una cita a otro día para moverla. El menú «⋯» de cada día permite añadir una cita o <b>bloquear el día</b> (vacaciones, formación…).',
  `<b>Planificar la semana</b> reparte ${TT('medico', 'p', '', 'l', 'l')} entre los días libres: a quien le toca ${TT('visita', 's', '', 'l', 'l')}, urgentes, interesados, nunca visitados o una de tus rutas. Cada uno cae un día que atiende y agrupado por zona. Revisa la propuesta y pulsa <b>Guardar en la agenda</b>.`,
  'Administración y televenta pueden ver la agenda de otra persona con el selector de arriba, planificarle la semana y ver el <b>cumplimiento del equipo</b> con el botón «Equipo».');


