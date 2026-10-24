/* ============================================================
   v2.248.0 · Agenda sin fantasmas (aviso de Eric: al cambiar de día, abrir la semana o el mes, planificar o volver, las piezas
   aparecían tarde y se movían). Cada pieza pedía sus datos y se pintaba al llegar: la bandeja y «Volver a hoy» empujaban las
   tarjetas, los «⋯» de la cinta salían después, la semana se pintaba dos veces… Ahora cada cambio pide primero todo lo que
   necesita (agConDatos: los datos quedan a mano en AG_PRE mientras se pinta) y lo pinta todo de una vez, sin pasar por la red.
   Además:
   - Fuera las pantallas sueltas de Semana y Mes de antes (flechas, Día/Semana/Mes, varios meses): quien pide la semana llega a la
     vista del día con la semana desplegada en la cinta, y quien pide el mes, con el mes abierto. Equipo tiene su pantalla
     (agCargarEquipo).
   - Las bandejas «Les toca visita» y «Pendientes de días anteriores» vuelven a abrirse (desde la v2.245 no hacían nada).
   - «Ver la semana» cambia su texto cuando la semana ya está pintada; el mes se abre ya pintado.
   ============================================================ */
const AG_PRE = new Map(); let AG_PRE_USO = 0;
const agK = (fn, d, h, u) => [fn, d, h, u || ''].join('|');
rpcCache = (orig => function (fn, params, clave, ...x) {
  if (AG_PRE.size && fn === 'agenda_rango' && params) { const k = agK(fn, params.p_desde, params.p_hasta, params.p_usuario); if (AG_PRE.has(k)) return Promise.resolve(AG_PRE.get(k)); }
  return orig.call(this, fn, params, clave, ...x);
})(rpcCache);
bloqueadosSemana = (orig => function (d, h, ...x) {
  const k = agK('bloq', d, h, agUid()); if (AG_PRE.has(k)) return Promise.resolve(AG_PRE.get(k));
  return orig.call(this, d, h, ...x);
})(bloqueadosSemana);
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

// ---- «Tu día» con sus bandejas y «En este centro también», de una vez
async function pintarTuDia() {
  if (!agConCinta()) return;
  const f = AG_FECHA;
  let s = null;
  await agConDatos([...agDiaCargas(f), !AG_SUG || AG_SUG.fecha !== f ? agSugDatos(f).then(x => { s = x; }) : null], async () => {
    if (AG_FECHA !== f || !agConCinta()) return;
    agPonerSug(f, s);
    await tdPintar();
    if (agN()) { agTamb(); agBandejas(); }
  });
}

// ---- Elegir otro día: todo lo que cambia (Tu día, bandejas, cinta, «Tu semana», la semana abierta) aparece a la vez
agVerDia = async function (f) {
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
    await agConDatos([...agDiaCargas(f), agSugDatos(f).then(x => { s = x; }), ...(fuera ? agCintaCargas() : []), ...agSemCargas(f)], async () => {
      if (AG_FECHA !== f || !agN()) return;
      agPonerSug(f, s);
      const piezas = [pintarTuDia(), agSemanaLateral()];
      if (fuera || (otraSem && AG_SEM_ABIERTA)) piezas.push(agCinta());
      await Promise.all(piezas);
      if (!fuera) document.querySelectorAll('#agcinta .cdia').forEach(x => x.classList.toggle('sel', x.dataset.cf === f));
      agMarcarDia(); agDiaVacio(); agPastillas();
    });
  } finally { const cc = $('agcuerpo'); if (cc) cc.classList.remove('agcargando'); }
  if (AG_FECHA !== f) return;
  const cc = $('agcuerpo'); if (!cc) return;
  const top = cc.getBoundingClientRect().top;
  if (top < 80 || top > innerHeight * 0.6) scrollTo({ top: scrollY + top - 90, behavior: 'smooth' });
};

// ---- Cinta: datos, «⋯» de cada día y semana desplegada, de una vez
agCinta = (orig => async function () {
  if (!agN()) return;
  if (!CINTA_INI) CINTA_INI = lunesCinta(AG_FECHA || hoyISO());
  return agConDatos([...agCintaCargas(), ...(AG_SEM_ABIERTA ? agSemCargas(AG_FECHA) : [])], async () => {
    await orig();
    if (!agN() || !$('agcinta')) return;
    await agMenusCinta();
    if (AG_SEM_ABIERTA) await agPintarSemanaExp();
    agBotonSemana();
    const b = $('cmesb'); if (b) b.onclick = e => { e.stopPropagation(); agMesPop(); };
    const h = $('choy'); if (h) h.onclick = () => { CINTA_INI = null; agVerDia(hoyISO()); };
  });
})(agCinta);
agSemanaLateral = (orig => function (...a) {
  if (!agN()) return orig.apply(this, a);
  return agConDatos(agSemCargas(AG_FECHA), () => orig.apply(this, a));
})(agSemanaLateral);
agPintarSemanaExp = (orig => function (...a) {
  if (!agN()) return orig.apply(this, a);
  return agConDatos(AG_SEM_ABIERTA ? agSemCargas(AG_FECHA) : [], () => orig.apply(this, a));
})(agPintarSemanaExp);
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



