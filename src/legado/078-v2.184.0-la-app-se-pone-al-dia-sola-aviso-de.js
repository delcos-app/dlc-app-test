/* v2.184.0 · La app se pone al día sola (aviso de Eric: con la base ya en nombres neutros, una pestaña abierta desde antes seguía con la app antigua y
   el buscador no encontraba nada hasta Ctrl+F5). Al volver a la pestaña y cada 10 minutos se mira qué versión está publicada (index.html sin caché);
   si es otra, la app se recarga sola cuando no hay nada a medias (ninguna ventana abierta ni un campo con el cursor) o, si lo hay, enseña el aviso
   «Hay una versión nueva» para que se recargue al terminar. */
let VERSION_VISTA = 0;
async function versionPublicada() {
  try {
    const r = await fetch('./index.html?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return null;
    const m = /app\.js\?v=([0-9.]+)/.exec(await r.text());
    return m ? m[1] : null;
  } catch (e) { return null; }
}
function hayAlgoAMedias() {
  if (document.querySelector('dialog[open]')) return true;
  const a = document.activeElement;
  return !!(a && a.matches && a.matches('input:not([type=search]), textarea, select, [contenteditable="true"]'));
}
async function comprobarVersion() {
  if (Date.now() - VERSION_VISTA < 60 * 1000 || !VERSION_APP || document.hidden) return;
  VERSION_VISTA = Date.now();
  const v = await versionPublicada();
  if (!v || v === VERSION_APP) return;
  if (!hayAlgoAMedias()) { try { sessionStorage.setItem('dlc-recarga-version', v); } catch (e) {} location.reload(); return; }
  const aviso = $('nuevaver'); if (aviso) aviso.classList.remove('hide');
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) comprobarVersion(); });
setInterval(comprobarVersion, 10 * 60 * 1000);

/* v2.185.0 · Citas aplazadas sin duplicar y fechas en el móvil (avisos de Eric):
   1. Una cita aplazada o descartada de hoy en adelante tiene en «⋯» (y en su detalle) «Volver a planificarla» (reabrir_cita, SQL 116: vuelve a
      Planificada y quita la cita que se creó al aplazarla). Volver a poner una cita ese día reutiliza la aplazada (aplazar_cita y guardar_cita).
   2. En pantallas táctiles los campos de fecha y hora son `inert`: no pueden tomar el foco, así que iOS ya no abre su rueda (lo hacía cuando la
      ventana enfocaba el campo al abrirse y cuando el calendario de delcos le devolvía el foco al elegir el día). El toque lo recoge el envoltorio. */
menuCita = (orig => function (boton, c) {
  if (CITA_ABIERTA.includes(c.estado) || !['Aplazada', 'Descartada'].includes(c.estado) || c.fecha < hoyISO()) return orig.call(this, boton, c);
  document.querySelectorAll('.tdmenu').forEach(m => m.remove());
  const m = document.createElement('div');
  m.className = 'tdmenu'; m.__t = Date.now();
  m.innerHTML = `<button data-tdop="rehacer"><b>Volver a planificarla</b><span>Vuelve a este día${c.estado === 'Aplazada' ? '; si la pasaste a otro, esa se quita' : ''}</span></button>`;
  document.body.appendChild(m);
  const r = boton.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, r.bottom + 6) + 'px';
  m.style.left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, r.right - m.offsetWidth)) + 'px';
  m.querySelector('[data-tdop]').onclick = () => { m.remove(); accionCita('rehacer', c); };
})(menuCita);
accionCita = (orig => async function (k, c) {
  if (k !== 'rehacer') return orig.call(this, k, c);
  const { data: r, error } = await db.rpc('reabrir_cita', { p_id: c.id });
  if (error || !r || r.ok === false) { toast(r && r.error === 'pasada' ? 'Solo se pueden volver a planificar citas de hoy en adelante' : 'No se ha podido volver a planificar', true); return; }
  toast(r.quitada ? 'Vuelve a estar planificada (se quita la del ' + fechaCorta(r.quitada) + ')' : 'Vuelve a estar planificada');
  agRefrescoQuieto(c.id);
})(accionCita);
verCita = (orig => function (c) {
  const r = orig.call(this, c);
  try {
    const caja = $('dbody') && $('dbody').querySelector('.vcacts');
    if (caja && ['Aplazada', 'Descartada'].includes(c.estado) && c.fecha >= hoyISO()) {
      caja.insertAdjacentHTML('beforeend', '<button type="button" class="btn sec" id="vcrehacer">Volver a planificarla</button>');
      $('vcrehacer').onclick = () => { $('dlg').close(); accionCita('rehacer', c); };
    }
  } catch (e) {}
  return r;
})(verCita);

// Fechas y horas en pantallas táctiles: sin foco, sin selector del sistema
const PANTALLA_TACTIL = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
function sinSelectorDelSistema(raiz) {
  if (!PANTALLA_TACTIL || !raiz || !raiz.querySelectorAll) return;
  const l = [...raiz.querySelectorAll('input')];
  if (raiz.matches && raiz.matches('input')) l.push(raiz);
  l.forEach(i => { if (/^(date|time|month|datetime-local)$/.test(i.type) && !i.closest('.selpop')) i.inert = true; });
}
mejorarCampos = (orig => function (raiz) { const r = orig(raiz); try { sinSelectorDelSistema(raiz || document); } catch (e) {} return r; })(mejorarCampos);
sinSelectorDelSistema(document);

/* v2.186.0 · Editar una cita no rehace la Agenda (aviso de Eric: al editar una cita se movía todo el panel). Antes, cerrar cualquier ventana en la
   Agenda (detalle de la cita, notas, tareas) y cada cambio de la cita (hora, confirmar, aplazar, descartar…) volvían a cargar la pantalla entera:
   métricas, semana, mes, sugerencias y «Tu día». Ahora:
   - Solo se repinta «Tu día» con lo que ya hay (o con los datos nuevos de ese día) y cada cita que cambia de sitio se desliza hasta él (FLIP),
     quedando resaltada; la página no salta ni cambia de tamaño mientras se repinta.
   - Al cambiar la hora, la cita se coloca por su hora entre las demás y ese orden se guarda.
   - Las métricas, la semana y el mes solo cambian sus cifras (sin animación ni recarga) cuando cambia el estado o el día de una cita.
   - Cerrar una ventana solo refresca si dentro se ha guardado algo con la base (p. ej. registrar la visita). */
let AGQ_T = null, AGQ_ID = null, DLG_EPOCA = 0;
new MutationObserver(() => { if ($('dlg').open) DLG_EPOCA = RC_EPOCA; }).observe($('dlg'), { attributes: true, attributeFilter: ['open'] });
function agCambiosEnVentana() { return RC_EPOCA !== DLG_EPOCA; }
function agOlvidarAgenda() { for (const k of [...RC.keys()]) if (k.startsWith('agenda_')) { RC.delete(k); RC_VUELO.delete(k); } }

// Repinta «Tu día» sin saltos: las citas que cambian de sitio se deslizan y la tocada queda resaltada un momento
async function repintarDiaSuave(id, data) {
  // v2.246.0: el deslizamiento de las tarjetas lo pone la envoltura de la v2.244.0 (aquí animaba las filas ocultas)
  agOlvidarAgenda();
  if (data) { TD_PRESET = { fecha: AG_FECHA, data }; TD_ULTIMO = { fecha: AG_FECHA, data }; }
  const cuerpo = $('agcuerpo'), alto = cuerpo ? cuerpo.offsetHeight : 0, y = window.scrollY;
  if (cuerpo) cuerpo.style.minHeight = alto + 'px';           // mientras se repinta, la caja no encoge
  try { await pintarTuDia(); } finally { if ($('agcuerpo')) $('agcuerpo').style.minHeight = ''; }
  window.scrollTo({ top: y });
}
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

// Cambiar la hora: la cita se coloca por su hora entre las demás (y se guarda ese orden)
cambiarHoraCita = async function (id, hora) {
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
};

/* v2.187.0 · Avisos de la esquina (petición de Eric): entran deslizándose también cuando uno sustituye a otro que sigue a la vista (antes el
   nuevo solo cambiaba el texto) y se van desvaneciéndose (.sale, 260 ms) en vez de desaparecer de golpe. */
toast = (orig => function (msg, err) {
  const r = orig.call(this, msg, err), v = $('toast');
  if (!v) return r;
  const t = v.cloneNode(true); t.classList.remove('sale'); v.replaceWith(t);   // un nodo nuevo vuelve a hacer la entrada aunque el anterior siga a la vista
  clearTimeout(tToast);
  tToast = setTimeout(() => { t.classList.add('sale'); tToast = setTimeout(() => { t.classList.add('hide'); t.classList.remove('sale'); }, 260); }, 3200);
  return r;
})(toast);

/* v2.189.0 · La consulta privada tiene su propia ficha (aviso de Eric: al elegir «Consulta privada (sin centro)» no se podía poner ni la dirección:
   esos datos de la consulta solo los rellenaba un centro). Ahora una consulta sin centro cuyo nombre empieza por «Consulta privada» se ve como tal
   (no como «Sin enlazar») y tiene «Editar la consulta» / «Añadir la dirección»: dirección, código postal, población, provincia y su punto en el mapa
   (buscando la dirección o con «Estoy aquí»). Planta, sala, indicaciones, teléfono y horario siguen debajo, como en cualquier consulta.
   Se guarda con la ficha (en la consulta del profesional; no crea un centro compartido). */
const esConsultaPrivada = c => { if (c && c.id) return false; const n = String((c && c.nombre) || '').trim().toLowerCase();   // v2.347.0: con cualquier palabra del vocabulario
  return /^(consulta|ubicaci[oó]n) privad[ao]/.test(n) || n.startsWith(consultaPrivada('l').toLowerCase()); };
tarjetaCentro = (orig => function (c, enlazado) {
  if (enlazado || !esConsultaPrivada(c)) return orig.call(this, c, enlazado);
  const dir = [c.direccion, [c.cp, c.municipio].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
  return `<div class="cpcard cppriv"><div class="cpcab"><b>${consultaPrivada()}</b><span class="pill p-est">Sin centro</span></div>
    <span class="sm">${esc(dir || 'Sin dirección todavía')}</span>
    ${c.lat ? '' : `<span class="sm" style="color:var(--warn)">${dir ? 'Sin ubicación: no saldrá en rutas ni en el mapa' : 'Añade la dirección para que salga en rutas y en el mapa'}</span>`}
    <div class="acts" style="margin:8px 0 0;flex-wrap:wrap">
      ${c.lat ? `<button type="button" class="btn sec" data-nav="${navAttr([+c.lat, +c.lon])}">Cómo llegar</button>` : ''}
      <button type="button" class="btn ${dir ? 'sec' : ''}" data-cpeditar>${dir ? 'Editar ' + TT('consulta', 's', 'el', 'l', 'l') : 'Añadir la dirección'}</button>
      <button type="button" class="btn sec" data-cpcambiar>Cambiar</button></div></div>`;
})(tarjetaCentro);
formCentro = (orig => function (box, i, c, aviso) {
  if (c && (c.privada || esConsultaPrivada(c))) return formPrivada(box, i);
  return orig.call(this, box, i, c, aviso);
})(formCentro);

function formPrivada(box, i) {
  const cont = box.querySelector(`[data-cp="${i}"]`); if (!cont) return;
  const v = f => ((cpCampo(box, i, f) || {}).value || '').trim(), k = 'pv' + i + '_';
  let lat = v('lat') ? +v('lat') : null, lon = v('lon') ? +v('lon') : null;
  const dirAntes = [v('direccion'), v('cp'), v('municipio')].join('|');
  let situada = false;                                         // se ha situado en el mapa desde que se abrió el formulario
  cont.innerHTML = `<div class="cpform cppriv">
    <div class="cpformcab"><b>${consultaPrivada()}</b><span class="sm">Dónde atiende (en su casa, un despacho…). Se guarda con la ficha.</span></div>
    <div class="g2"><div><label for="${k}d">Dirección</label><input id="${k}d" value="${esc(v('direccion'))}" placeholder="Calle, número, piso"></div>
      <div><label for="${k}c">Código postal</label><input id="${k}c" value="${esc(v('cp'))}" inputmode="numeric"></div></div>
    <div class="g2"><div><label for="${k}m">Población</label><input id="${k}m" value="${esc(v('municipio'))}"></div>
      <div><label for="${k}p">Provincia</label><input id="${k}p" value="${esc(v('provincia'))}"></div></div>
    <div class="cpubi sm">${lat ? '<b style="color:var(--ok)">✓ Ubicada</b>' : 'Sin ubicación todavía'}
      <button type="button" class="lnk" data-pvgeo>🔎 Buscar la dirección en el mapa</button> <button type="button" class="lnk" data-pvaqui>📍 Estoy aquí</button></div>
    <div class="acts" style="justify-content:flex-end;margin:10px 0 0"><button type="button" class="btn sec" data-pvcancel>Cancelar</button><button type="button" class="btn" data-pvok>Guardar</button></div></div>`;
  const val = x => $(k + x).value.trim();
  const ubicada = t => { const u = cont.querySelector('.cpubi'); u.firstChild.replaceWith(Object.assign(document.createElement('b'), { style: 'color:var(--ok)', textContent: '✓ Ubicada ' + (t || '') })); };
  const rellenar = a => {
    if (!a) return;
    if (!val('d') && a.road) $(k + 'd').value = [a.road, a.house_number].filter(Boolean).join(', ');
    if (!val('c') && a.postcode) $(k + 'c').value = a.postcode;
    if (!val('m')) $(k + 'm').value = (a.city || a.town || a.village || a.municipality || '').toUpperCase();
    if (!val('p')) $(k + 'p').value = (a.province || a.state_district || a.county || a.state || '').toUpperCase();
  };
  const buscar = async (silencio) => {
    if (!val('d') && !val('m')) { if (!silencio) toast('Escribe la dirección o la población', true); return false; }
    const q = [val('d'), val('c'), val('m'), val('p'), 'España'].filter(Boolean).join(', ');
    const r = await geocodificar(q, { direccion: val('d'), municipio: val('m'), cp: val('c') }).catch(() => null);
    if (!r) { if (!silencio) toast('No se ha encontrado esa dirección. Prueba con calle, número y población.', true); return false; }
    if (r.fuera) { toast(`Esa dirección sale en ${r.fuera}, no en ${val('m')}: revísala (no se ha guardado el punto)`, true); return false; }
    lat = +r.lat; lon = +r.lon; situada = true; rellenar(r.address); ubicada(); return true;
  };
  cont.querySelector('[data-pvgeo]').onclick = async e => { const t = e.target.textContent; e.target.textContent = 'Buscando…'; await buscar(); e.target.textContent = t; };
  cont.querySelector('[data-pvaqui]').onclick = async e => {
    if (!navigator.geolocation) { toast('Este dispositivo no da la ubicación', true); return; }
    const t = e.target.textContent; e.target.textContent = 'Localizando…';
    try {
      const pos = await new Promise((ok, ko) => navigator.geolocation.getCurrentPosition(ok, ko, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }));
      lat = +pos.coords.latitude.toFixed(6); lon = +pos.coords.longitude.toFixed(6); situada = true;
      const inv = await geoInversa(lat, lon); rellenar(inv && inv.address); ubicada('con tu ubicación: revisa la dirección');
    } catch (err) { toast('No se ha podido obtener tu ubicación: revisa el permiso de ubicación del navegador', true); }
    finally { e.target.textContent = t; }
  };
  cont.querySelector('[data-pvcancel]').onclick = () => pintarCentroSel(box, i);
  cont.querySelector('[data-pvok]').onclick = async ev => {
    if (!val('d') && !val('m')) { toast('Escribe al menos la población', true); $(k + 'm').focus(); return; }
    // Si la dirección ha cambiado y no se ha vuelto a situar, se busca en el mapa (si no se encuentra, se guarda sin punto)
    if ([val('d'), val('c'), val('m')].join('|') !== dirAntes && !situada) {
      ev.target.disabled = true; const ok = await buscar(true); ev.target.disabled = false;
      if (!ok) { lat = null; lon = null; }
    }
    cpPoner(box, i, { nombre: 'CONSULTA PRIVADA', direccion: val('d'), cp: val('c'), municipio: val('m').toUpperCase(), provincia: val('p').toUpperCase(), lat, lon });
    pintarCentroSel(box, i);
    toast(lat != null ? `${consultaPrivada()} lista: se guarda con la ficha` : 'Dirección puesta, sin punto en el mapa: se guarda con la ficha');
  };
  $(k + (v('direccion') ? 'd' : 'm')).focus();
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

/* v2.191.0 · Visita a distancia y fotos de la visita (primera tanda del estudio por sectores, SQL 118).
   - Al registrar una visita se elige cómo fue: Presencial (por defecto), Por teléfono o Por videollamada (actividades.modo). En el historial
     de la ficha, las que no son presenciales lo dicen.
   - Fotos de la visita (lineal, exposición, material colocado…): se reducen a 1600 px en JPEG como los justificantes y se guardan en
     actividad_fotos al registrar la visita. Sin conexión la visita se guarda igual y las fotos se añaden después desde su historial
     («📷 Fotos»), donde también se ven y se borran. */
const MODOS_VISITA = [['presencial', 'Presencial'], ['telefono', 'Teléfono'], ['video', 'Videollamada']];
const FOTOS_VISITA_MAX = 6;
let VISITA_ACTUAL = null;   // { id, modo, fotos } de la ventana «Registrar visita» abierta

async function leerFotoVisita(f) {
  if (!/^image\//.test(f.type)) { toast('Elige una foto', true); return null; }
  return leerJustificante(f);
}
function pintarFotosVisita(caja, fotos, quitar) {
  caja.innerHTML = fotos.map((f, i) => `<span class="vfoto"><img alt="Foto ${i + 1}" src="data:${f.tipo};base64,${f.datos}">
    ${quitar ? `<button type="button" class="vfquitar" data-vfq="${i}" aria-label="Quitar la foto">✕</button>` : ''}</span>`).join('');
  if (quitar) caja.querySelectorAll('[data-vfq]').forEach(b => b.onclick = () => quitar(+b.dataset.vfq));
}

abrirVisitaBase = (orig => async function (id, ...r) {
  const res = await orig.call(this, id, ...r);
  const d = $('dbody'), g = d && $('vguardar') && d.querySelector('.g2');
  if (!g || $('vmodo')) return res;
  VISITA_ACTUAL = { id, modo: 'presencial', fotos: [] };
  g.insertAdjacentHTML('afterend', `<label>Cómo fue</label>
    <div class="segs" id="vmodo" role="group" aria-label="Cómo fue">${MODOS_VISITA.map(([k, t]) => `<button type="button" data-vmodo="${k}" class="${k === 'presencial' ? 'on' : ''}" aria-pressed="${k === 'presencial'}">${t}</button>`).join('')}</div>`);
  d.querySelectorAll('[data-vmodo]').forEach(b => b.onclick = () => {
    if (!VISITA_ACTUAL) return;
    VISITA_ACTUAL.modo = b.dataset.vmodo;
    d.querySelectorAll('[data-vmodo]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  });
  const nota = $('vn');
  if (nota) nota.insertAdjacentHTML('afterend', `<div class="vfotosw"><label class="btn sec" id="vfotobtn" style="display:inline-flex">${svgIco(ICON_NOM.camera)} Añadir foto<input type="file" id="vfotof" accept="image/*" data-fp="1" hidden multiple></label>
    <span class="sm">Lineal, exposición, material colocado… (hasta ${FOTOS_VISITA_MAX})</span><div class="vfotos" id="vfotos"></div></div>`);
  const pintar = () => pintarFotosVisita($('vfotos'), VISITA_ACTUAL ? VISITA_ACTUAL.fotos : [], i => { VISITA_ACTUAL.fotos.splice(i, 1); pintar(); });
  if ($('vfotof')) $('vfotof').onchange = async e => {
    for (const f of [...e.target.files]) {
      if (!VISITA_ACTUAL) break;
      if (VISITA_ACTUAL.fotos.length >= FOTOS_VISITA_MAX) { toast(`Como mucho ${FOTOS_VISITA_MAX} fotos por ${TT('visita', 's', '', 'l', 'l')}`, true); break; }
      const j = await leerFotoVisita(f); if (j) VISITA_ACTUAL.fotos.push(j);
    }
    e.target.value = ''; pintar();
  };
  return res;
})(abrirVisitaBase);
$('dlg').addEventListener('close', () => { setTimeout(() => { if (!$('dlg').open) VISITA_ACTUAL = null; }, 0); });

async function subirFotosVisita(actividad, fotos) {
  for (const f of fotos) {
    const { error } = await db.from('actividad_fotos').insert({ actividad_id: actividad, nombre: f.nombre, tipo: f.tipo, tamano: f.tamano, datos: f.datos });
    if (error) { toast(`${TT('visita', 's', '', 'l', 'C', 'guardado')}, pero no se ha podido subir una foto: añádela desde su historial`, true); return false; }
  }
  return true;
}
escribirRpc = (orig => async function (fn, payload, ...a) {
  const va = VISITA_ACTUAL;
  if (fn !== 'registrar_actividad' || !va || !payload || !payload.p || payload.p.cuenta_id !== va.id) return orig.call(this, fn, payload, ...a);
  payload.p.modo = va.modo;
  VISITA_ACTUAL = null;
  const r = await orig.call(this, fn, payload, ...a);
  if (va.fotos.length && r && !r.error) {
    if (r.data && r.data.id) subirFotosVisita(r.data.id, va.fotos);
    else fotosGuardarPendientes(payload.p.op_id, va.fotos);   // v2.259.0: se suben con la visita
  }
  return r;
})(escribirRpc);

// Historial de la ficha: cuántas fotos tiene cada visita y la ventana para verlas, añadir o borrar
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    const filas = [...document.querySelectorAll('#fbody [data-vrow]')];
    if (filas.length) {
      const { data } = await db.from('actividad_fotos').select('actividad_id').in('actividad_id', filas.map(f => f.dataset.vrow));
      const n = {}; (data || []).forEach(x => { n[x.actividad_id] = (n[x.actividad_id] || 0) + 1; });
      filas.forEach(f => {
        if (f.querySelector('[data-vfotos]')) return;
        const k = n[f.dataset.vrow] || 0, sitio = f.querySelector('span');
        if (sitio && (k || f.querySelector('[data-editv]'))) sitio.insertAdjacentHTML('beforeend', `<div><button type="button" class="lnk vfotoslnk" data-vfotos="${f.dataset.vrow}">${svgIco(ICON_NOM.camera)} ${k ? (k === 1 ? '1 foto' : k + ' fotos') : 'Añadir fotos'}</button></div>`);
      });
      document.querySelectorAll('#fbody [data-vfotos]').forEach(b => b.onclick = () => verFotosVisita(b.dataset.vfotos, id));
    }
  } catch (e) {}
  return r;
})(abrirFicha);

async function verFotosVisita(actividad, cuenta) {
  const { data, error } = await db.from('actividad_fotos').select('id,nombre,tipo,datos,creado_por').eq('actividad_id', actividad).order('creado_en');
  if (error) { toast('No se han podido abrir las fotos', true); return; }
  const l = data || [];
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Fotos de ${TT('visita', 's', 'el', 'l', 'l')}</h2><div class="sm">${l.length ? (l.length === 1 ? '1 foto' : l.length + ' fotos') : 'Todavía no hay fotos'}</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <div class="vfotos grande">${l.map(f => `<span class="vfoto"><img alt="${esc(f.nombre || 'Foto')}" src="data:${esc(f.tipo)};base64,${f.datos}">
      ${f.creado_por === PERFIL.id || puede('administrar') ? `<button type="button" class="vfquitar" data-vfdel="${f.id}" aria-label="Borrar la foto">✕</button>` : ''}</span>`).join('')}</div>
    <div class="acts" style="justify-content:flex-end"><label class="btn sec" style="display:inline-flex">${svgIco(ICON_NOM.camera)} Añadir foto<input type="file" id="vfmas" accept="image/*" data-fp="1" hidden multiple></label>
      <button type="button" class="btn" data-cerrar2>Hecho</button></div>`;
  $('dlg2body').querySelectorAll('[data-vfdel]').forEach(b => b.onclick = async () => {
    if (!await preguntar('La foto desaparece de ' + TT('visita', 's', 'este', 'l', 'l') + '.', { titulo: '¿Borrar la foto?', ok: 'Borrar', peligro: true })) return;
    const { error: e2 } = await db.from('actividad_fotos').delete().eq('id', b.dataset.vfdel);
    if (e2) { toast('No se ha podido borrar', true); return; }
    toast('Foto borrada'); verFotosVisita(actividad, cuenta); if (FICHA_ID === cuenta) abrirFicha(cuenta);
  });
  $('vfmas').onchange = async e => {
    const nuevas = [];
    for (const f of [...e.target.files].slice(0, Math.max(0, FOTOS_VISITA_MAX - l.length))) { const j = await leerFotoVisita(f); if (j) nuevas.push(j); }
    if (e.target.files.length > FOTOS_VISITA_MAX - l.length) toast(`Como mucho ${FOTOS_VISITA_MAX} fotos por ${TT('visita', 's', '', 'l', 'l')}`, true);
    if (!nuevas.length) return;
    if (await subirFotosVisita(actividad, nuevas)) { toast(nuevas.length === 1 ? 'Foto añadida' : 'Fotos añadidas'); verFotosVisita(actividad, cuenta); if (FICHA_ID === cuenta) abrirFicha(cuenta); }
  };
  if (!$('dlg2').open) $('dlg2').showModal();
}

/* v2.192.0 · Muestras con control legal (primera tanda del estudio por sectores, SQL 119; RD 1416/1994, art. 16).
   - Producto: «Muestra con control legal» con fecha de autorización (se pueden dar los 2 años siguientes) y máximo por profesional y año.
   - Registrar visita: si la empresa tiene productos regulados, bloque «Muestras de medicamento» con lo que queda este año para ese
     profesional; si se entrega alguna, pide la firma (con el dedo o el ratón) y el nombre de quien firma. Se comprueba antes de guardar
     la visita; después, registrar_muestras guarda todo o nada (también desde la cola sin conexión, enlazada por el op_id de la visita).
   - Ficha: «Muestras este año» con lo entregado y lo que queda de cada producto regulado. */
const MUESTRA_ERR = { firma: 'Falta la firma de quien recibe las muestras', profesional: 'Las muestras solo se entregan a profesionales, no a un centro',
  plazo: 'Ese producto ya no se puede dar como muestra (han pasado 2 años desde su autorización)', limite: 'Se pasa del máximo de muestras de este año',
  permiso: 'No puedes registrar muestras de esta ficha', producto: 'Producto no encontrado', no_existe: 'Ficha no encontrada' };
const muestraError = r => (MUESTRA_ERR[r && r.error] || 'No se han podido guardar las muestras') +
  (r && r.error === 'limite' ? ` (${r.producto}: quedan ${r.quedan} de ${r.max})` : r && r.error === 'plazo' ? ` (${r.producto})` : '');

// Producto: datos de la muestra regulada (solo administración; se guardan al cambiarlos)
editorProducto = (orig => function (p, ...r) {
  const x = orig.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !$('dbody') || !$('prok') || $('prmuestra')) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    if (!p || !p.id) { ref.insertAdjacentHTML('beforebegin', '<div class="blk" id="prmuestra"><h3>Muestras con control legal</h3><p class="sm">Guarda el producto y vuelve a abrirlo para marcarlo como muestra con control legal.</p></div>'); return; }
    const { data: m } = await db.from('productos').select('muestra_regulada,muestra_desde,muestra_max').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prmuestra')) return;
    const d = m || {};
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prmuestra"><h3>Muestras con control legal</h3>
      <label class="opt"><input type="checkbox" id="prmreg" ${d.muestra_regulada ? 'checked' : ''}> Es un medicamento: sus muestras llevan firma y límite</label>
      <div class="g2 ${d.muestra_regulada ? '' : 'hide'}" id="prmdat">
        <div><label for="prmdesde">Autorizado el</label><input id="prmdesde" type="date" value="${esc(d.muestra_desde || '')}"></div>
        <div><label for="prmmax">Máximo por profesional y año</label><input id="prmmax" type="number" min="1" max="10" step="1" value="${d.muestra_max || 10}"></div></div>
      <p class="sm">La ley permite como mucho 10 muestras por medicamento, profesional y año, durante los 2 años siguientes a su autorización, y con la solicitud firmada.</p></div>`);
    const guardar = async () => {
      const reg = $('prmreg').checked, max = Math.min(10, Math.max(1, +$('prmmax').value || 10));
      $('prmdat').classList.toggle('hide', !reg);
      const { error } = await db.from('productos').update({ muestra_regulada: reg, muestra_desde: $('prmdesde').value || null, muestra_max: max }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : 'Muestras: guardado', !!error);
    };
    ['prmreg', 'prmdesde', 'prmmax'].forEach(k => $(k).addEventListener('change', guardar));
  }, 120);
  return x;
})(editorProducto);

// Firma con el dedo o el ratón
function padFirma(canvas) {
  const ctx = canvas.getContext('2d'); let dib = false, hay = false, ult = null;
  const ajustar = () => { const r = canvas.getBoundingClientRect(), k = window.devicePixelRatio || 1; canvas.width = r.width * k; canvas.height = r.height * k; ctx.scale(k, k); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0B2540'; hay = false; };
  const pt = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); dib = true; ult = pt(e); });
  canvas.addEventListener('pointermove', e => { if (!dib) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(ult.x, ult.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ult = p; hay = true; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => canvas.addEventListener(t, () => { dib = false; }));
  requestAnimationFrame(ajustar);
  return { borrar: ajustar, vacia: () => !hay, imagen: () => (hay ? canvas.toDataURL('image/png').split(',')[1] : null), marcar: () => { hay = true; } };
}

abrirVisitaBase = (orig => async function (id, ...r) {
  const res = await orig.call(this, id, ...r);
  const d = $('dbody'), nota = $('vn');
  if (!d || !nota || !$('vguardar') || $('vmuestras') || !VISITA_ACTUAL || VISITA_ACTUAL.id !== id) return res;
  if (!navigator.onLine) return res;   // v2.259.0: sin red no hay muestras (y db.from tardaba más de 10 s en rendirse)
  try { const { data: ct } = await db.from('cuentas').select('tipo').eq('id', id).maybeSingle(); if (ct && ct.tipo === 'Centro') return res; } catch (e) {}   // v2.203.0
  const { data: l } = await db.rpc('muestras_de_cuenta', { p_cuenta: id });
  if (!Array.isArray(l) || !l.length || !$('vn') || $('vmuestras')) return res;
  const nombre = (d.querySelector('.fh .sm') || {}).textContent || '';
  const lab = nota.previousElementSibling && nota.previousElementSibling.tagName === 'LABEL' ? nota.previousElementSibling : nota;
  lab.insertAdjacentHTML('beforebegin', `<div class="vmuestras" id="vmuestras"><label>Muestras de medicamento</label>
    ${l.map(x => `<div class="vmrow ${x.en_plazo && x.quedan ? '' : 'agotada'}"><span><b>${esc(x.nombre)}</b><span class="sm">${!x.en_plazo ? 'Ya no se puede dar: el plazo acabó el ' + fechaCorta(x.hasta)
      : `Quedan ${x.quedan} de ${x.max} este año${x.hasta ? ' · hasta el ' + fechaCorta(x.hasta) : ''}`}</span></span>
      <input type="number" min="0" max="${x.en_plazo ? x.quedan : 0}" step="1" value="0" data-vmprod="${x.producto_id}" aria-label="Muestras de ${esc(x.nombre)}" ${x.en_plazo && x.quedan ? '' : 'disabled'}></div>`).join('')}
    <div class="vmfirma hide" id="vmfirma"><label>Firma de quien las recibe <span class="sm">· solicitud de muestras con fecha de hoy</span></label>
      <canvas id="vmcanvas" aria-label="Espacio para firmar"></canvas>
      <div class="vmfpie"><input id="vmfirmante" value="${esc(nombre)}" aria-label="Nombre de quien firma" placeholder="Nombre de quien firma"><button type="button" class="lnk" id="vmborrar">Borrar la firma</button></div></div></div>`);
  let pad = null;
  const items = () => [...d.querySelectorAll('[data-vmprod]')].map(i => ({ producto_id: i.dataset.vmprod, unidades: Math.max(0, Math.floor(+i.value || 0)), max: +i.max })).filter(x => x.unidades > 0);
  const ver = () => { const hay = items().length > 0; $('vmfirma').classList.toggle('hide', !hay); if (hay && !pad) pad = padFirma($('vmcanvas')); };
  d.querySelectorAll('[data-vmprod]').forEach(i => i.addEventListener('input', ver));
  $('vmborrar').onclick = () => pad && pad.borrar();
  VISITA_ACTUAL.muestras = {
    items, firmante: () => $('vmfirmante') ? $('vmfirmante').value.trim() : '', firma: () => (pad ? pad.imagen() : null),
    validar: () => {
      const it = items();
      if (!it.length) return null;
      const pasa = it.find(x => x.unidades > x.max);
      if (pasa) return 'Se pasa del máximo de muestras de este año';
      if (!pad || pad.vacia()) return 'Falta la firma de quien recibe las muestras';
      return null;
    }
  };
  return res;
})(abrirVisitaBase);
// Antes de guardar la visita se comprueban las muestras (si algo falla, no se guarda nada)
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#vguardar');
  if (!b || !VISITA_ACTUAL || !VISITA_ACTUAL.muestras) return;
  const msg = VISITA_ACTUAL.muestras.validar();
  if (msg) { e.stopImmediatePropagation(); e.preventDefault(); toast(msg, true); }
}, true);
escribirRpc = (orig => async function (fn, payload, ...a) {
  const va = VISITA_ACTUAL;
  if (fn !== 'registrar_actividad' || !va || !va.muestras || !payload || !payload.p || payload.p.cuenta_id !== va.id) return orig.call(this, fn, payload, ...a);
  const items = va.muestras.items().map(x => ({ producto_id: x.producto_id, unidades: x.unidades }));
  const firma = va.muestras.firma(), firmante = va.muestras.firmante();
  const r = await orig.call(this, fn, payload, ...a);
  if (items.length && r && !r.error) {
    const pm = { cuenta_id: payload.p.cuenta_id, fecha: payload.p.fecha, items, firma, firmante, op_id: 'm-' + payload.p.op_id,
      ...(r.data && r.data.id ? { actividad_id: r.data.id } : { actividad_op: payload.p.op_id }) };
    const rm = await orig.call(this, 'registrar_muestras', { p: pm });
    if (rm && !rm.error && rm.data && rm.data.ok === false) setTimeout(() => toast(`${TT('visita', 's', '', 'l', 'C', 'guardado')}, pero las muestras no: ${muestraError(rm.data)}`, true), 2600);
    else if (rm && rm.error) setTimeout(() => toast(`${TT('visita', 's', '', 'l', 'C', 'guardado')}, pero las muestras no se han podido guardar`, true), 2600);
  }
  return r;
})(escribirRpc);

// Ficha: lo entregado este año de cada producto regulado
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    const sitio = $('fzcampos'); if (!sitio || $('fmuestras')) return r;
    const { data: l } = await db.rpc('muestras_de_cuenta', { p_cuenta: id });
    if (!Array.isArray(l) || !l.length || !$('fzcampos') || $('fmuestras') || FICHA_ID !== id) return r;
    $('fzcampos').insertAdjacentHTML('beforebegin', `<div class="blk" id="fmuestras"><h3>Muestras este año</h3>
      ${l.map(x => `<div class="fmrow"><span>${esc(x.nombre)}</span><b>${x.entregadas} de ${x.max}</b>${!x.en_plazo ? '<span class="pill p-anu">Fuera de plazo</span>' : !x.quedan ? '<span class="pill p-warn">Sin muestras este año</span>' : ''}</div>`).join('')}</div>`);
  } catch (e) {}
  return r;
})(abrirFicha);

/* v2.193.0 · Pedido a través del distribuidor (primera tanda del estudio por sectores, SQL 120; decisiones de Eric: quién factura se elige
   en cada pedido, el pedido del distribuidor no saca stock de nuestro almacén y le llega por correo).
   - Editor del pedido: «Lo sirve» Nosotros / Un distribuidor; con distribuidor, cuál, el código del cliente en él y «Lo factura el
     distribuidor». La administración añade distribuidores desde ahí mismo («+ Nuevo distribuidor»).
   - Ver pedido: bloque «Distribuidor» con «Preparar correo al distribuidor» (el correo de la persona, con las líneas y el código del
     cliente, como los de factura y pago) que deja apuntado que se ha enviado; si lo factura el distribuidor, no se ofrece «Emitir factura». */
let DISTRIBUIDORES = null, PED_DIST = null;
async function cargarDistribuidores(forzar) {
  if (DISTRIBUIDORES && !forzar) return DISTRIBUIDORES;
  const { data } = await db.from('distribuidores').select('id,nombre,email,telefono,activo').order('nombre');
  DISTRIBUIDORES = (data || []).filter(d => d.activo);
  return DISTRIBUIDORES;
}
editorPedido = (orig => async function (pedido, ...a) {
  const ped = pedido && pedido.pedido ? pedido.pedido : null;
  PED_DIST = { on: !!(ped && ped.distribuidor_id), id: (ped && ped.distribuidor_id) || '', codigo: (ped && ped.distribuidor_codigo) || '',
    factura: ped && ped.distribuidor_id ? !!ped.factura_distribuidor : true };
  await cargarDistribuidores().catch(() => []);
  return orig.call(this, pedido, ...a);
})(editorPedido);
function pintarBloqueDistribuidor() {
  const o = $('porig'), fila = o && o.closest('.g2');
  if (!fila || $('pdist') || !PED_DIST) return;
  const l = DISTRIBUIDORES || [], admin = puede('administrar');
  if (PED_DIST.on && !PED_DIST.id && l.length) PED_DIST.id = l[0].id;
  fila.insertAdjacentHTML('afterend', `<div class="pdist" id="pdist"><label>Lo sirve</label>
    <div class="segs" id="pdsirve" role="group" aria-label="Lo sirve"><button type="button" data-ds="0" class="${PED_DIST.on ? '' : 'on'}" aria-pressed="${!PED_DIST.on}">Nosotros</button>
      <button type="button" data-ds="1" class="${PED_DIST.on ? 'on' : ''}" aria-pressed="${PED_DIST.on}">Un distribuidor</button></div>
    <div id="pddat" class="${PED_DIST.on ? '' : 'hide'}">
      ${l.length ? `<div class="g2"><div><label for="pdsel">Distribuidor</label><select id="pdsel">${l.map(d => `<option value="${d.id}" ${d.id === PED_DIST.id ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select></div>
        <div><label for="pdcod">Código del cliente en el distribuidor</label><input id="pdcod" value="${esc(PED_DIST.codigo)}" placeholder="Si lo tiene"></div></div>
        <label class="opt"><input type="checkbox" id="pdfac" ${PED_DIST.factura ? 'checked' : ''}> Lo factura el distribuidor <span class="sm">· no se emite factura nuestra</span></label>`
      : `<p class="sm">Todavía no hay distribuidores.${admin ? '' : ' Pide a administración que los añada.'}</p>`}
      ${admin ? '<button type="button" class="lnk" id="pdnuevo">+ Nuevo distribuidor</button>' : ''}
      <p class="sm">Un pedido que sirve el distribuidor no descuenta stock de vuestro almacén.</p></div></div>`);
  $('pdist').querySelectorAll('[data-ds]').forEach(b => b.onclick = () => {
    PED_DIST.on = b.dataset.ds === '1';
    if (PED_DIST.on && !PED_DIST.id && l.length) PED_DIST.id = l[0].id;
    $('pdist').querySelectorAll('[data-ds]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    $('pddat').classList.toggle('hide', !PED_DIST.on);
  });
  if ($('pdsel')) $('pdsel').onchange = e => { PED_DIST.id = e.target.value; };
  if ($('pdcod')) $('pdcod').oninput = e => { PED_DIST.codigo = e.target.value; };
  if ($('pdfac')) $('pdfac').onchange = e => { PED_DIST.factura = e.target.checked; };
  if ($('pdnuevo')) $('pdnuevo').onclick = () => nuevoDistribuidor();
}
new MutationObserver(() => { if ($('porig') && !$('pdist')) pintarBloqueDistribuidor(); }).observe($('dbody'), { childList: true, subtree: true });

async function nuevoDistribuidor() {
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Nuevo distribuidor</h2><div class="sm">Mayorista o depósito que sirve pedidos a vuestros clientes</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="dsn">Nombre</label><input id="dsn" placeholder="p. ej. Cofares">
    <div class="g2"><div><label for="dse">Correo para pedidos</label><input id="dse" type="email"></div><div><label for="dst">Teléfono</label><input id="dst" inputmode="tel"></div></div>
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="dsok">Añadir</button></div>`;
  $('dlg2').showModal();
  $('dsok').onclick = async () => {
    const nombre = $('dsn').value.trim(); if (!nombre) { toast('Escribe el nombre', true); return; }
    const { data, error } = await db.from('distribuidores').insert({ nombre, email: $('dse').value.trim() || null, telefono: $('dst').value.trim() || null }).select('id').single();
    if (error) { toast('No se ha podido añadir: ' + error.message, true); return; }
    $('dlg2').close(); toast('Distribuidor añadido');
    await cargarDistribuidores(true);
    if (PED_DIST) { PED_DIST.on = true; PED_DIST.id = data.id; }
    const b = $('pdist'); if (b) { b.remove(); pintarBloqueDistribuidor(); }
  };
}

// Al guardar el pedido desde su editor, va también quién lo sirve
db.rpc = (orig => function (fn, params, ...a) {
  if (fn === 'guardar_pedido' && params && params.p && $('pdist') && PED_DIST) {
    const on = PED_DIST.on && !!PED_DIST.id;
    Object.assign(params.p, { distribuidor_id: on ? PED_DIST.id : '', distribuidor_codigo: on ? PED_DIST.codigo : '', factura_distribuidor: on && PED_DIST.factura });
  }
  return orig.call(this, fn, params, ...a);
})(db.rpc);

// Ver pedido: distribuidor, correo para él y sin «Emitir factura» si factura él
verPedido = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (!$('dlg').open || $('pddist')) return r;
    const { data } = await RPC_ORIG('pedido_detalle', { p_id: id });
    const p = data && data.pedido; if (!p || !p.distribuidor_id || !$('dlg').open || $('pddist')) return r;
    const d = (await cargarDistribuidores()).find(x => x.id === p.distribuidor_id) || (await cargarDistribuidores(true)).find(x => x.id === p.distribuidor_id) || { nombre: 'Distribuidor' };
    if (p.factura_distribuidor && $('pvemitir')) $('pvemitir').remove();
    const cli = data.contacto || {}, l = data.lineas || [];
    const cuerpo = [`Pedido ${p.numero || ''} de ${nombreApp()}`, '', `Cliente: ${cli.nombre || p.cuenta_texto || ''}${p.distribuidor_codigo ? ' · código ' + p.distribuidor_codigo : ''}`,
      cli.direccion ? `Dirección: ${[cli.direccion, cli.cp, cli.municipio].filter(Boolean).join(', ')}` : '', '',
      ...l.map(x => `- ${x.unidades} × ${x.producto || x.nombre || ''}`), '', p.factura_distribuidor ? 'Lo factura el distribuidor.' : 'Lo factura ' + nombreApp() + '.',
      p.nota ? '\nNota: ' + p.nota : ''].filter(x => x !== null).join('\n');
    const asunto = `Pedido ${p.numero || ''} · ${cli.nombre || p.cuenta_texto || ''}`;
    const sitio = $('pdpago') || $('dbody').querySelector('.acts:last-of-type'); if (!sitio) return r;
    sitio.insertAdjacentHTML('beforebegin', `<div class="blk" id="pddist"><h3>Distribuidor</h3>
      <p>Lo sirve <b>${esc(d.nombre)}</b>${p.distribuidor_codigo ? ` · código del cliente <b>${esc(p.distribuidor_codigo)}</b>` : ''} · ${p.factura_distribuidor ? 'lo factura el distribuidor' : 'lo facturamos nosotros'}</p>
      ${p.estado === 'Confirmado' ? `<div class="acts" style="justify-content:flex-start;margin-top:6px">${d.email ? `<a class="btn sec" id="pdmaild" href="mailto:${esc(d.email)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}">Preparar correo al distribuidor</a>` : '<span class="sm">El distribuidor no tiene correo: añádelo en sus datos.</span>'}
        <span class="sm" id="pdmailest">${p.transfer_enviado_en ? 'Correo preparado el ' + fechaCorta(String(p.transfer_enviado_en).slice(0, 10)) : 'Correo sin preparar'}</span></div>` : '<p class="sm">Al confirmarlo podrás preparar el correo al distribuidor.</p>'}</div>`);
    trfPoner(id, p, d, data);   // v2.265.0
    if ($('pdmaild')) $('pdmaild').addEventListener('click', async () => {
      const { data: m } = await db.rpc('marcar_transfer_enviado', { p_id: id });
      if (m && m.ok && $('pdmailest')) $('pdmailest').textContent = 'Correo preparado el ' + fechaCorta(hoyISO());
    });
  } catch (e) {}
  return r;
})(verPedido);

/* v2.194.0 · Sin «recomendación» en los textos (decisión de Eric, 6/10/2026: puede leerse como una contrapartida con los profesionales).
   El canal del pedido «Recomendación a paciente» pasa a «Venta al paciente» (frente a «Venta a centro»), y «… que lo recomienda» /
   «Quién los recomienda» pasan a «… de referencia», con el vocabulario de cada empresa; «Recomendaciones de rutas» pasa a «Rutas
   sugeridas». Cambiado en su sitio (reemplazos2194). Las demos (sql/demo/generar_demos.py) usan «Activo» y «Visita con pedido». */

