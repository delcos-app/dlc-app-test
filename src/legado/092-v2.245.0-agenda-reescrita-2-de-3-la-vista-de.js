/* ============================================================
   v2.245.0 · Agenda reescrita (2 de 3): la vista del día se monta de una vez desde los datos. Hasta ahora cargarAgenda pasaba por
   once capas: pintaba la Agenda de 2021 (flechas, Día/Semana/Mes), las cifras (#agmet), la semana (#agsemana), el mes (#agmes), las
   sugerencias (#agsug) y los pendientes (#agpend), las escondía y otras capas leían ese HTML oculto para pintar las pastillas, las
   bandejas y «En este centro también». Ahora, en la vista de día:
   - agCargarDia() pinta la cabecera (título, pastillas, + Nueva cita y, quien ve el equipo, «Mi agenda/…» y Equipo), la cinta, «Tu día»
     (tdPintar) y «Tu semana»; nada oculto.
   - Pastillas desde agenda_metricas (AG_MET). La cuarta, «Por visitar», ya no lleva a una lista escondida.
   - Bandejas desde los datos: «Les toca visita» = toca_actividad (antes contaba la última lista de las sugerencias, que podía ser
     otra) y «Pendientes de días anteriores» = pendientes_ruta, con sus botones en el panel lateral.
   - «En este centro también» desde sugerencias_centros, por la posición del centro (antes, buscando su nombre en el texto).
   - El mes se pinta al pulsarlo en la cinta; la cinta conserva sus «⋯» y la semana desplegada al repintarse; «Tu semana» se
     actualiza al cambiar de día.
   Semana, Mes y Equipo siguen como estaban.
   ============================================================ */
let AG_MET = null, AG_SUG = null, AG_PEND = null;
const agN = () => agConCinta() && $('v-agenda').classList.contains('agn');


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


// Quién ya tiene cita ese día (no se le propone)
const agConCitaHoy = () => new Set((TD_CITAS || []).filter(c => !citaAnulada(c.estado)).map(c => c.cuenta_id));

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
document.addEventListener('click', e => {
  const b = e.target.closest('#agcuerpo .agtamb[data-agtc]'); if (!b || e.target.closest('[data-agti]')) return;
  e.stopPropagation(); fichaCentro(b.dataset.agtc);
}, true);
document.addEventListener('keydown', e => { const b = e.target.closest && e.target.closest('#agcuerpo .agtamb[data-agtc]'); if (b && e.target === b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fichaCentro(b.dataset.agtc); } });
const agImp = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
document.addEventListener('click', e => {
  const b = e.target.closest('#agcuerpo .agtamb [data-agti]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.agtv) nuevaCita(b.dataset.agti, AG_FECHA); else abrirFicha(b.dataset.agti);
}, true);

// Bandejas bajo la cabecera de «Tu día»
function agTocaLista() { const ya = agConCitaHoy(); return AG_SUG && AG_SUG.fecha === AG_FECHA ? AG_SUG.toca.filter(m => !ya.has(m.id || m.cuenta_id)) : []; }
function agBandejas() {
  const head = document.querySelector('#agcuerpo .tdhead'); if (!head) return;
  const old = $('agband'); if (old) old.remove();
  const nToca = agTocaLista().length, nPend = (AG_PEND || []).length;
  if (!nToca && !nPend) return;
  head.insertAdjacentHTML('afterend', `<div class="agband" id="agband">${nToca ? `<button type="button" data-agbd="toca">${svgIco(ICON_NOM.target)} Les toca ${TT('visita', 's', '', 'l', 'l')} <b>${nToca}</b></button>` : ''}${nPend ? `<button type="button" class="urg" data-agbd="pend">${svgIco(ICON_NOM['circle-alert'] || ICON_NOM.info)} Pendientes de días anteriores <b>${nPend}</b></button>` : ''}</div>`);
  $('agband').querySelectorAll('[data-agbd]').forEach(b => b.onclick = () => agBandeja(b.dataset.agbd));
}



// El título conserva «· agenda de …» al ver la de otra persona (agMarcarDia lo dejaba en «Hoy · …»)
agMarcarDia = (orig => function (...a) {
  const r = orig.apply(this, a);
  if (agN() && AG_VISTA && $('agtit') && !$('agtit').textContent.includes(AG_VISTA.nombre)) $('agtit').textContent += ' · agenda de ' + AG_VISTA.nombre;
  return r;
})(agMarcarDia);
// Subir o bajar una cita no recarga la Agenda aunque otra pantalla (Inicio pide las citas de hoy) haya pedido otro día entretanto:
// se guarda lo último de cada día y se usa el del día que se ve
const AG_DIAS_DATOS = {};
rpcCache = (orig => async function (fn, params, clave) {
  const r = await orig.call(this, fn, params, clave);
  if (fn === 'agenda_rango' && params && params.p_desde === params.p_hasta && r && r.data) AG_DIAS_DATOS[params.p_desde] = r.data;
  return r;
})(rpcCache);
moverCitaLocal = (orig => async function (...a) {
  if ((!TD_ULTIMO || TD_ULTIMO.fecha !== AG_FECHA) && AG_DIAS_DATOS[AG_FECHA]) TD_ULTIMO = { fecha: AG_FECHA, data: AG_DIAS_DATOS[AG_FECHA] };
  return orig.apply(this, a);
})(moverCitaLocal);
// «Ver la semana» aparece de una vez: se pinta escondida y se enseña ya con sus días (antes salía vacía y se llenaba)
agPintarSemanaExp = (orig => async function (...a) {
  const cin = $('agcinta');
  if (!agN() || !cin || !AG_SEM_ABIERTA || $('agsemexp')) return orig.apply(this, a);
  cin.insertAdjacentHTML('beforeend', '<div id="agsemexp" class="agsemexp" style="display:none"></div>');
  try { return await orig.apply(this, a); } finally { const x = $('agsemexp'); if (x) x.style.display = ''; }
})(agPintarSemanaExp);


