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
// La «i» del aviso abre su explicación (antes pulsaba la de la fila oculta)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tdavi]'); if (!b) return;
  e.stopPropagation();
  const inf = TD_INFO[b.dataset.tdavi]; if (!inf) return;
  appVentana({ titulo: 'Por qué sale este aviso', msg: explicarAviso(inf), ok: 'Entendido', cancel: false });
}, true);
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
moverCitaLocal = (orig => async function (orden, id, acc) {
  const antes = tdPosiciones();
  const r = await orig.call(this, orden, id, acc);
  tdAnimar(antes, id, 260);
  const b = document.querySelector(`#agcuerpo .tdu [data-td="${acc}|${id}"]:not([disabled])`) || document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
  if (b) b.focus({ preventScroll: true });
  return r;
})(moverCitaLocal);
repintarDiaSuave = (orig => async function (id, data) {
  const antes = tdPosiciones();
  const r = await orig.call(this, id, data);
  tdAnimar(antes, id, 320);
  return r;
})(repintarDiaSuave);



