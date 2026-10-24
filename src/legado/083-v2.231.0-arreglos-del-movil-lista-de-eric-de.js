/* v2.231.0 · Arreglos del móvil (lista de Eric del 10/10/2026):
   - El logotipo de la empresa (arriba a la izquierda) lleva al inicio.
   - Configuración en el móvil: «‹ Volver» como botón (antes «‹ Configuración», que repetía el título).
   - Agenda: el «⋯» del día sale en la cabecera de «Tu día» (en táctil ya no aparece sobre el día de la cinta); «Tu día» con márgenes
     iguales (bandejas, aviso y tarjetas); las citas cerradas no llevan «⋯» y al abrirlas dicen cómo se cerraron y qué se puede cambiar.
   - Inicio: la cuadrícula de «Sin contactar» marca en color lo que falta por contactar (antes, cuadros vacíos).
   - iPhone: si una lectura no contesta en 4,5 s (la conexión se queda colgada al volver del segundo plano), se lanza otra igual y vale la
     primera que llegue; antes se esperaban 20 s. Las que pasan de 4 s quedan en el registro de errores («Lento: …») para medirlas. */

// Logotipo → inicio
document.addEventListener('click', e => {
  const l = e.target.closest && e.target.closest('header .top .logo, nav.main .mlmarca');
  if (!l || !PERFIL) return;
  const b = document.querySelector('nav.main [data-t="inicio"]') || document.querySelector('nav.main [data-t]');
  if (b) { e.preventDefault(); b.click(); }
});

// Configuración: botón de volver
cargarConfig = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const b = $('cfuvolver');
  if (b && !b.classList.contains('manvuelta')) { b.classList.add('manvuelta'); b.innerHTML = '<b aria-hidden="true">‹</b> Volver'; b.setAttribute('aria-label', 'Volver a Configuración'); }
  return r;
})(cargarConfig);

// Agenda · las citas cerradas no tienen menú (salvo «Volver a planificarla» de hoy en adelante)
// (sin escribir estados: se pregunta al propio menú si tiene algo que ofrecer)
function citaConMenu(c) {
  if (CITA_ABIERTA.includes(c.estado)) return true;
  const t0 = toast; let hay = false; toast = () => {};
  try { menuCita(document.body, c); hay = !!document.querySelector('.tdmenu'); } catch (e) { hay = true; }
  finally { toast = t0; document.querySelectorAll('.tdmenu').forEach(m => m.remove()); }
  return hay;
}
const citaHecha = e => EST_COL[e] === 'var(--ok)';

verCita = (orig => function (c, ...r) {
  const x = orig.call(this, c, ...r);
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
})(verCita);

// iPhone: lecturas que se quedan colgadas
const LECT_DUP = new Set(['buscar_cuentas', 'buscar_global', 'panel_inicio', 'inicio_areas', 'inicio_graficas',
  'agenda_rango', 'agenda_metricas', 'mis_notificaciones', 'ficha_cuenta', 'operativa_pendiente', 'catalogos_todos', 'opciones_filtros']);
db.rpc = (orig => function (fn, params, opts) {
  if (!LECT_DUP.has(fn)) return orig.call(db, fn, params, opts);
  const t0 = performance.now();
  return new Promise(res => {
    let fin = false, otra = null, espera = null;
    const acabar = x => { if (fin) return; fin = true; clearTimeout(tm); clearTimeout(espera); res(x); };
    // La segunda va directa (sin la caché ni «una sola en vuelo», que devolvería la misma petición colgada)
    const tm = setTimeout(() => {
      if (fin) return;
      [...RC_VUELO.keys()].forEach(k => { if (k.startsWith(fn + '|')) RC_VUELO.delete(k); });
      otra = Promise.resolve(RPC_ORIG(fn, params, opts));
      otra.then(acabar, e => acabar({ data: null, error: e }));
    }, 4500);
    Promise.resolve(orig.call(db, fn, params, opts)).then(x => {
      if (otra && x && x.error) { espera = setTimeout(() => acabar(x), 8000); return; }
      acabar(x);
    }, e => { if (otra) espera = setTimeout(() => acabar({ data: null, error: e }), 8000); else acabar({ data: null, error: e }); });
  }).then(x => {
    const ms = Math.round(performance.now() - t0);
    if (ms > 4000 && navigator.onLine) registrarError('api', `Lento: ${fn}`, { funcion: fn, ms, pantalla: TAB, segundo_intento: ms > 4500 });
    return x;
  });
})(db.rpc);

/* v2.232.0 · Notificaciones que no vuelven (aviso de Eric; SQL 137).
   - Borrar ya no quita la fila: la marca como borrada (borrar_notificaciones). Antes, los avisos del día no encontraban su marca y la volvían a crear.
   - El panel enseña las de los últimos 7 días en dos bloques: «Nuevas» (sin leer) y «Anteriores» (leídas, más apagadas).
   - Cada notificación se puede borrar con su papelera; abajo, «Marcar todas como leídas», «Borrar las leídas» y «Borrar todas». */
if (!ICON_NOM['trash-2']) ICON_NOM['trash-2'] = '<path d="M3 6h18" /> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /> <line x1="10" x2="10" y1="11" y2="17" /> <line x1="14" x2="14" y1="11" y2="17" />';
const notifIco = t => (TIPOS_NOTIF.find(x => x[0] === t) || [])[1] || '🔔';
async function notifBorrar(ids, leidas) {
  const { data, error } = await db.rpc('borrar_notificaciones', { p_ids: ids || null, p_leidas: !!leidas });
  if (error || !data || !data.ok) { toast('No se han podido borrar', true); return false; }
  return true;
}
notifPintar = function () {
  const l = NOTIF_LISTA;
  const areas = NOTIF_AREAS.filter(a => l.some(x => notifArea(x.tipo) === a[0]));
  if (NOTIF_FILTRO && !areas.some(a => a[0] === NOTIF_FILTRO)) NOTIF_FILTRO = '';
  const vis = l.filter(x => !NOTIF_FILTRO || notifArea(x.tipo) === NOTIF_FILTRO);
  const nuevas = vis.filter(x => !x.leida_en), viejas = vis.filter(x => x.leida_en);
  const fila = x => {
    const acc = notifAcciones(x), cuando = new Date(x.visible_desde || x.creado_en), g = notifDia(x.visible_desde || x.creado_en);
    return `<div class="notit2 ${x.leida_en ? '' : 'nuevo'}" data-nidx="${l.indexOf(x)}">
      <span class="ic" aria-hidden="true">${notifIco(x.tipo)}</span>
      <div class="tx"><b>${esc(x.titulo)}</b>${x.cuerpo ? `<span class="sm">${esc(x.cuerpo)}</span>` : ''}
        <span class="sm notcuando">${g === 'Hoy' ? cuando.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : g === 'Ayer' ? 'Ayer' : cuando.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}${x.resumen ? ' · del resumen del día' : ''}</span>
        <div class="notacts">${acc.map(([t, , p], j) => `<button type="button" class="btn chico ${p ? '' : 'sec'}" data-nacc="${j}">${esc(t)}</button>`).join('')}
          ${x.leida_en ? '' : '<button type="button" class="btn sec chico" data-npos>Posponer a mañana</button>'}
          <button type="button" class="notbor" data-nbor aria-label="Borrar esta notificación" title="Borrar">${svgIco(ICON_NOM['trash-2'])}</button></div></div></div>`;
  };
  $('dbody').innerHTML = `<div class="fh"><div><h2>Notificaciones</h2><div class="sm">${NOTIF_N ? `${NOTIF_N} sin leer` : 'Estás al día'} · últimos 7 días</div></div>
      <span class="acts" style="margin:0"><button type="button" class="icobtn notcfgb" id="notcfg" title="Elegir qué recibo y cuándo" aria-label="Elegir qué recibo y cuándo">${svgIco(ICON_NOM.settings)}</button>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></span></div>
    ${areas.length > 1 ? `<div class="segs notfil" role="group" aria-label="Filtrar">${[['', 'Todas']].concat(areas.map(a => [a[0], a[1]])).map(([k, t]) =>
      `<button type="button" data-nfil="${k}" class="${NOTIF_FILTRO === k ? 'on' : ''}" aria-pressed="${NOTIF_FILTRO === k}">${esc(t)}</button>`).join('')}</div>` : ''}
    <div class="notlista2">
      ${nuevas.length ? `<h3 class="notdia">Nuevas · ${nuevas.length}</h3>${nuevas.map(fila).join('')}` : ''}
      ${viejas.length ? `<h3 class="notdia">Anteriores</h3>${viejas.map(fila).join('')}` : ''}
      ${vis.length ? '' : `<div class="vacio">${NOTIF_FILTRO ? 'No hay avisos de esta área.' : 'No tienes notificaciones de los últimos 7 días.'}</div>`}</div>
    <p class="sm notpie">Se guardan las de los últimos 7 días. Las que borras no vuelven a salir.</p>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">
      ${NOTIF_N ? '<button class="btn sec" id="notleer">Marcar todas como leídas</button>' : ''}
      ${l.some(x => x.leida_en) ? '<button class="btn sec" id="notlimpiar">Borrar las leídas</button>' : ''}
      ${l.length ? '<button class="btn sec dang" id="notvaciar">Borrar todas</button>' : ''}</div>`;
  const cerrarYRefrescar = () => { $('dlg').close(); refrescarCampana(); };
  const quitar = xs => { NOTIF_LISTA = NOTIF_LISTA.filter(y => !xs.includes(y)); NOTIF_N = Math.max(0, NOTIF_N - xs.filter(y => !y.leida_en).length); notifPintar(); refrescarCampana(); };
  $('dbody').querySelectorAll('[data-nfil]').forEach(b => b.onclick = () => { NOTIF_FILTRO = b.dataset.nfil; notifPintar(); });
  $('dbody').querySelectorAll('.notit2').forEach(el => {
    const x = l[+el.dataset.nidx], acc = notifAcciones(x);
    el.querySelectorAll('[data-nacc]').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      await db.rpc('leer_notificacion', { p_id: x.id });
      cerrarYRefrescar(); acc[+b.dataset.nacc][1]();
    });
    const pos = el.querySelector('[data-npos]');
    if (pos) pos.onclick = async e => {
      e.stopPropagation();
      const { data } = await db.rpc('posponer_notificacion', { p_id: x.id });
      if (!data || !data.ok) { toast('No se ha podido posponer', true); return; }
      toast('Te lo volvemos a enseñar mañana'); quitar([x]);
    };
    el.querySelector('[data-nbor]').onclick = async e => {
      e.stopPropagation();
      if (!await notifBorrar([x.id])) return;
      el.classList.add('notsale'); setTimeout(() => quitar([x]), 220);
    };
    el.onclick = async () => {
      await db.rpc('leer_notificacion', { p_id: x.id });
      if (acc.length) { cerrarYRefrescar(); (acc.find(a => a[2]) || acc[0])[1](); }
      else if (!x.leida_en) { x.leida_en = new Date().toISOString(); NOTIF_N = Math.max(0, NOTIF_N - 1); notifPintar(); refrescarCampana(); }
    };
  });
  if ($('notleer')) $('notleer').onclick = async () => {
    await db.rpc('leer_notificaciones'); const ahora = new Date().toISOString();
    NOTIF_LISTA.forEach(x => { if (!x.leida_en) x.leida_en = ahora; }); NOTIF_N = 0; notifPintar(); refrescarCampana();
  };
  if ($('notlimpiar')) $('notlimpiar').onclick = async () => { if (await notifBorrar(null, true)) { toast('Notificaciones leídas borradas'); quitar(NOTIF_LISTA.filter(x => x.leida_en)); } };
  if ($('notvaciar')) $('notvaciar').onclick = async () => {
    const op = await elegirOpcion('Borrar todas las notificaciones', 'Se borran todas, también las que no has leído, y no vuelven a salir.', [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'si', t: 'Borrar todas' }]);
    if (op === 'si' && await notifBorrar(null, false)) { toast('Notificaciones borradas'); cerrarYRefrescar(); }
  };
  $('notcfg').onclick = () => { $('dlg').close(); CFG_SEC = 'notif'; window.__CFG_DIRECTO = true; ir('config'); };
};

/* v2.233.0 · Tu día en el mapa, en Rutas (decisión de Eric: servicio de rutas TomTom, mapa en Rutas; SQL 138 y función «rutas»).
   - Arriba de Rutas, «Tu día en el mapa»: las citas de hoy numeradas en un mapa plano (MapLibre + OpenFreeMap, colores de delcos),
     la ruta por las calles y la jornada en una pista con la hora; «Ver el día» mueve el marcador por las calles y la cámara lo sigue.
   - La ruta y los tiempos los da la función «rutas» (TomTom, con tráfico). Antes de cada petición la base comprueba el tope
     (2.000 al día entre todas las empresas y 30 por usuario y día); si no cabe, o no está activada, la ruta va en línea recta con
     los tiempos aproximados de siempre y se dice. No se guarda nada de TomTom: solo se recuerda en memoria 10 minutos.
   - Pulsar una parada abre la cita (verCita). */
const RM_SV = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const RM_COCHE = '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>';
const RM_PAL = { tierra: '#F1F3F4', zona: '#ECEEF0', parque: '#D6EDDA', agua: '#AFD3F2', edif: '#E4E6EA', calle: '#FFFFFF', borde: '#DADCE0', via: '#FFF1C2', viaBorde: '#F2D27A', texto: '#5F6368', ruta: '#3F82C0', rutaBorde: '#1F5A99', hecho: '#A8BCD2' };
let RM_LIB = null, RM_MAPA = null, RM_ANIM = null;
const RM_MEM = new Map();   // ruta pedida → {t, r}: solo en memoria y 10 minutos
function rmLib() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return RM_LIB || (RM_LIB = new Promise((res, rej) => {
    document.head.insertAdjacentHTML('beforeend', '<style>@import url("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css") layer(lib);</style>');   // v2.356.0: en la capa de las librerías
    const s = document.createElement('script'); s.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'; s.crossOrigin = 'anonymous';
    s.onload = () => res(window.maplibregl); s.onerror = () => { RM_LIB = null; rej(new Error('mapa')); }; document.head.appendChild(s);
  }));
}
const rmDur = m => m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}` : `${Math.round(m)} min`;
const rmKm = (a, b) => Math.hypot((b[1] - a[1]) * 111.32 * Math.cos(a[0] * Math.PI / 180), (b[0] - a[0]) * 111.32);

// El día: paradas en su orden, la salida (si hay) y los tramos de viaje y de visita
function rmPlan(citas, fecha, tramos) {
  const vivas = citas.filter(c => xyCita(c) && (CITA_ABIERTA.includes(c.estado) || citaHecha(c.estado)));
  const r = estimarDia(vivas, fecha), dura = PLANCFG().visita || 15, aparcar = +PLANCFG().parada || 0, sal = salidaUsuario();
  const casa = sal && sal.lat != null && sal.lon != null ? [+sal.lat, +sal.lon] : null;
  const paradas = vivas.map((c, i) => ({ c, i, xy: xyCita(c), ini: r.est[c.id] != null ? r.est[c.id] : minHora(c.hora) })).filter(p => p.ini != null);
  const puntos = (casa ? [casa] : []).concat(paradas.map(p => p.xy)).concat(casa && paradas.length ? [casa] : []);
  const segs = []; let pos = casa, t = null, k = 0;
  paradas.forEach((p, j) => {
    const mismo = pos && pos[0] === p.xy[0] && pos[1] === p.xy[1];
    let ini = p.ini;
    if (pos && !mismo) {
      const tr = tramos && tramos[k], v = tr ? tr.min + aparcar : minutosEntre(pos, p.xy);
      const sale = t != null ? t : ini - v;
      if (tramos) ini = Math.max(sale + v, minHora(p.c.hora) || 0);   // con tiempos reales, la hora sale del viaje (las fijas se respetan)
      segs.push({ tipo: 'viaje', a: sale, b: sale + v, de: pos, hasta: p.xy, k, km: tr ? tr.km : null });
    }
    if (pos && (casa || j > 0)) k++;
    p.ini = ini; segs.push({ tipo: 'vis', a: ini, b: ini + dura, p }); pos = p.xy; t = ini + dura;
  });
  if (casa && pos && t != null) { const tr = tramos && tramos[k], v = tr ? tr.min : minutosEntre(pos, casa); segs.push({ tipo: 'viaje', a: t, b: t + v, de: pos, hasta: casa, k, km: tr ? tr.km : null }); t += v; }
  return { paradas, puntos, segs, casa, ini: segs.length ? segs[0].a : 9 * 60, fin: t || 18 * 60, tope: isFinite(r.tope) ? r.tope : null };
}
async function rmRuta(puntos, salida) {
  const k = JSON.stringify([puntos, salida]), m = RM_MEM.get(k);
  if (m && Date.now() - m.t < 600000) return m.r;
  let r = null;
  try {
    const { data, error } = await db.functions.invoke('rutas', { body: { puntos, salida } });
    if (!error) r = data;
    else {
      const st = error.context && error.context.status;
      r = st === 404 ? { ok: false, motivo: 'sin_clave' } : await Promise.resolve(error.context && error.context.json ? error.context.json() : null).then(x => x && x.motivo ? x : { ok: false, motivo: 'servicio' }, () => ({ ok: false, motivo: 'servicio' }));
    }
  }
  catch (e) { r = { ok: false, motivo: 'servicio' }; }
  if (r && r.ok) RM_MEM.set(k, { t: Date.now(), r });
  return r || { ok: false, motivo: 'servicio' };
}
const RM_MOTIVO = {
  empresa: 'Hoy tu empresa ya ha usado su cupo de rutas por calles', global: 'Hoy ya se ha usado el cupo de rutas por calles',
  apagado: 'Las rutas por calles están desactivadas', sin_clave: 'Las rutas por calles aún no están activadas',
  servicio: 'El servicio de rutas no ha contestado', sesion: 'No se ha podido comprobar tu sesión', datos: 'Alguna parada no tiene una ubicación válida'
};

async function rutasMapa() {
  if (TAB !== 'rutas' || !$('v-rutas')) return;
  const ref = $('renc') || $('v-rutas').querySelector('.saludo'); if (!ref) return;
  const fecha = hoyISO(), citas = await citasDelDia(fecha);
  if (TAB !== 'rutas' || !ref.isConnected) return;
  let caja = $('rmapa');
  const P0 = rmPlan(citas, fecha, null);
  if (!P0.paradas.length) { if (caja) caja.remove(); return; }
  if (!caja) { ref.insertAdjacentHTML('afterend', '<section class="card rmapa" id="rmapa" aria-label="Tu día en el mapa"></section>'); caja = $('rmapa'); }
  caja.innerHTML = `<div class="rmcab"><div><h2>Tu día en el mapa</h2><span class="sm" id="rmsub">Buscando la ruta por las calles…</span></div>
      <button type="button" class="btn" id="rmplay">${RM_SV('<path d="M6 4l14 8-14 8z"/>')}<span>Ver el día</span></button></div>
    <div class="rmwrap"><div class="rmc" id="rmc"></div><div class="rmnav" id="rmnav"></div></div>
    <div class="rmjorn"><div class="rmpista" id="rmpista"></div><div class="rmhoras" id="rmhoras"></div>
      <input type="range" class="rmscrub" id="rmscrub" step="5" aria-label="Hora del día"><div class="rmtx sm" id="rmtx"></div></div>`;
  let ml;
  try { ml = await rmLib(); } catch (e) { $('rmc').innerHTML = '<div class="vacio">No se ha podido cargar el mapa. Comprueba la conexión.</div>'; return; }
  if (!$('rmc')) return;
  const salida = P0.segs.length ? `${fecha}T${hm(Math.max(0, P0.segs[0].a))}:00` : null;
  const lineaRecta = P0.puntos.length > 1 && P0.puntos.length <= 30 ? null : 'datos';
  const res = lineaRecta ? { ok: false, motivo: lineaRecta } : await rmRuta(P0.puntos, salida);
  if (!$('rmc')) return;
  const P = res.ok && res.tramos && res.tramos.length === P0.puntos.length - 1 ? rmPlan(citas, fecha, res.tramos) : P0;
  const real = P !== P0;
  $('rmsub').innerHTML = real
    ? `Por las calles, con tráfico · <b>${String(res.km).replace('.', ',')} km</b> · <b>${rmDur(res.min)}</b> al volante${res.retraso_min ? ` (${res.retraso_min} min por el tráfico)` : ''} · fin hacia las <b>${hm(P.fin)}</b> <span class="rmfuente">Ruta: © TomTom</span>`
    : `${esc(RM_MOTIVO[res.motivo] || RM_MOTIVO.servicio)}: tiempos aproximados en línea recta · fin hacia las <b>${hm(P.fin)}</b>`;
  pintarRutasMapa(ml, P, real ? res.tramos : null);
}

function pintarRutasMapa(ml, P, tramos) {
  if (RM_ANIM) { cancelAnimationFrame(RM_ANIM); RM_ANIM = null; }
  if (RM_MAPA) { try { RM_MAPA.remove(); } catch (e) {} RM_MAPA = null; }
  const xs = P.paradas.map(p => p.xy).concat(P.casa ? [P.casa] : []);
  const bb = xs.reduce((b, [la, lo]) => [[Math.min(b[0][0], lo), Math.min(b[0][1], la)], [Math.max(b[1][0], lo), Math.max(b[1][1], la)]], [[180, 90], [-180, -90]]);
  const map = new ml.Map({ container: 'rmc', style: 'https://tiles.openfreemap.org/styles/liberty', maxPitch: 0, dragRotate: false, attributionControl: { compact: true } });
  RM_MAPA = map; map.touchZoomRotate.disableRotation();
  map.fitBounds(bb, { padding: { top: 50, bottom: 90, left: 50, right: 50 }, duration: 0, maxZoom: 15 });
  map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
  // Los tramos de viaje: por las calles si los hay; si no, en recto
  const VIA = P.segs.filter(s => s.tipo === 'viaje');
  const prep = l => { const c = [0]; for (let i = 1; i < l.length; i++) c.push(c[i - 1] + rmKm([l[i - 1][1], l[i - 1][0]], [l[i][1], l[i][0]])); return { l, c, tot: c[c.length - 1] || 0.001 }; };
  const PL = VIA.map(v => prep(tramos && tramos[v.k] && tramos[v.k].linea && tramos[v.k].linea.length > 1
    ? tramos[v.k].linea.map(([la, lo]) => [lo, la]) : [[v.de[1], v.de[0]], [v.hasta[1], v.hasta[0]]]));
  const enLinea = (pl, f) => {
    const d = Math.max(0, Math.min(1, f)) * pl.tot; let i = 1; while (i < pl.c.length - 1 && pl.c[i] < d) i++;
    const a = pl.l[i - 1], b = pl.l[i] || a, g = Math.max(0, Math.min(1, (d - pl.c[i - 1]) / ((pl.c[i] - pl.c[i - 1]) || 1)));
    return { pt: [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g], i, rumbo: (Math.atan2((b[0] - a[0]) * Math.cos(a[1] * Math.PI / 180), b[1] - a[1]) * 180 / Math.PI + 360) % 360 };
  };
  const linea = () => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: PL.flatMap(x => x.l) } });
  map.on('load', () => {
    (map.getStyle().layers || []).forEach(l => {
      const id = l.id, set = (k, v) => { try { map.setPaintProperty(id, k, v); } catch (e) {} }, ocultar = () => { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {} };
      if (l.type === 'fill-extrusion') return ocultar();
      if (l.type === 'background') return set('background-color', RM_PAL.tierra);
      if (l.type === 'symbol') { if (/poi|aeroway|housenumber|transit|rail|ferry|shield/i.test(id)) return ocultar(); set('text-color', RM_PAL.texto); set('text-halo-color', '#FFFFFF'); set('text-halo-width', 1.4); return; }
      if (l.type === 'fill') {
        if (/water/i.test(id)) return set('fill-color', RM_PAL.agua);
        if (/building/i.test(id)) { set('fill-color', RM_PAL.edif); set('fill-outline-color', RM_PAL.borde); return; }
        if (/park|wood|grass|forest|landcover|cemetery|pitch/i.test(id)) { set('fill-color', RM_PAL.parque); set('fill-opacity', 0.8); return; }
        set('fill-color', RM_PAL.zona); set('fill-opacity', 0.6); return;
      }
      if (l.type === 'line') {
        if (/water|river|stream|canal/i.test(id)) return set('line-color', RM_PAL.agua);
        if (/rail|ferry|aeroway|boundary|admin/i.test(id)) return ocultar();
        const grande = /motorway|trunk|primary/i.test(id);
        set('line-color', /casing/i.test(id) ? (grande ? RM_PAL.viaBorde : RM_PAL.borde) : (grande ? RM_PAL.via : RM_PAL.calle));
      }
    });
    const lp = { 'line-cap': 'round', 'line-join': 'round' };
    map.addSource('rm-ruta', { type: 'geojson', data: linea() });
    map.addSource('rm-hecho', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
    map.addLayer({ id: 'rm-ruta-borde', type: 'line', source: 'rm-ruta', paint: { 'line-color': RM_PAL.rutaBorde, 'line-width': 8 }, layout: lp });
    map.addLayer({ id: 'rm-ruta', type: 'line', source: 'rm-ruta', paint: { 'line-color': RM_PAL.ruta, 'line-width': 5, ...(tramos ? {} : { 'line-dasharray': [1.5, 1.5] }) }, layout: lp });
    map.addLayer({ id: 'rm-hecho', type: 'line', source: 'rm-hecho', paint: { 'line-color': RM_PAL.hecho, 'line-width': 6 }, layout: lp });
    mover();
  });
  // Paradas (las del mismo sitio, juntas) y la salida
  if (P.casa) { const e = document.createElement('div'); e.className = 'rmcasa'; e.title = salidaUsuario().nombre || 'Salida'; e.innerHTML = svgIco(ICON_NOM.house || ''); new ml.Marker({ element: e }).setLngLat([P.casa[1], P.casa[0]]).addTo(map); }
  const MK = {}, grupos = {};
  P.paradas.forEach(p => { const k = p.xy.join(','); (grupos[k] = grupos[k] || []).push(p); });
  Object.values(grupos).forEach(g => {
    const e = document.createElement('button'); e.type = 'button'; e.className = 'rmmk' + (g.length > 1 ? ' multi' : '');
    e.style.setProperty('--c', EST_COL[g[0].c.estado] || 'var(--navy)');
    e.innerHTML = `<span>${g.map(p => p.i + 1).join('·')}</span>`; e.setAttribute('aria-label', g.map(p => p.c.nombre).join(', '));
    e.onclick = ev => { ev.stopPropagation(); verCita(g[0].c); };
    new ml.Marker({ element: e, anchor: 'bottom' }).setLngLat([g[0].xy[1], g[0].xy[0]]).addTo(map);
    g.forEach(p => { MK[p.c.id] = e; });
  });
  // El marcador propio con su haz
  const yo = document.createElement('div'); yo.className = 'rmyo';
  yo.innerHTML = `<span class="haz"><svg viewBox="0 0 84 84"><path d="M42 42 L27 2.9 A42 42 0 0 1 57 2.9 Z" fill="#3F82C0" fill-opacity=".38"/></svg></span><span class="pun">${RM_SV(RM_COCHE)}</span>`;
  const myo = new ml.Marker({ element: yo }).setLngLat([xs[0][1], xs[0][0]]).addTo(map);
  // La jornada en una pista
  const lo = Math.floor((Math.min(P.ini, P.tope || P.ini) - 30) / 60) * 60, hi = Math.ceil((Math.max(P.fin, P.tope || 0) + 30) / 60) * 60;
  const x = m => ((m - lo) / ((hi - lo) || 1) * 100).toFixed(2) + '%';
  const ahora = (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();
  $('rmpista').innerHTML = `${P.tope && P.tope < hi ? `<div class="tope" style="left:${x(P.tope)};right:0" title="Después de tu hora de vuelta"></div>` : ''}
    ${P.segs.map(s => s.tipo === 'viaje' ? `<div class="seg viaje" style="left:${x(s.a)};width:calc(${x(s.b)} - ${x(s.a)})"></div>`
      : `<div class="seg vis ${citaHecha(s.p.c.estado) ? 'hecha' : CITA_ABIERTA.includes(s.p.c.estado) ? '' : 'no'}" style="left:${x(s.a)};width:calc(${x(s.b)} - ${x(s.a)})" title="${esc(s.p.c.nombre)}"><span>${s.p.i + 1}</span></div>`).join('')}
    ${ahora > lo && ahora < hi ? `<div class="ahora" style="left:${x(ahora)}"></div>` : ''}`;
  $('rmhoras').innerHTML = Array.from({ length: (hi - lo) / 60 + 1 }, (_, k) => lo + k * 60).map(m => `<span style="left:${x(m)}">${hm(m)}</span>`).join('');
  const s = $('rmscrub'); s.min = lo; s.max = hi; s.value = Math.min(hi, Math.max(lo, ahora));
  let cam = false, cen = null, tAnt = 0;
  const nav = $('rmnav');
  const mover = mm => {
    if (!$('rmscrub')) return;
    const m = mm != null ? mm : +s.value;
    const k = VIA.findIndex(v => m >= v.a && m < v.b), seg = k >= 0 ? VIA[k] : null;
    const vis = P.segs.find(v => v.tipo === 'vis' && m >= v.a && m <= v.b);
    const antes = P.segs.filter(v => v.b <= m).pop();
    let pt, f = 0, rumbo = null;
    if (seg) { f = (m - seg.a) / ((seg.b - seg.a) || 1); const e = enLinea(PL[k], f); pt = e.pt; rumbo = e.rumbo; }
    else if (vis) pt = [vis.p.xy[1], vis.p.xy[0]];
    else if (antes) { const q = antes.tipo === 'vis' ? antes.p.xy : antes.hasta; pt = [q[1], q[0]]; }
    else pt = [xs[0][1], xs[0][0]];
    myo.setLngLat(pt); yo.classList.toggle('parado', !seg);
    if (rumbo != null) yo.querySelector('.haz').style.transform = `rotate(${rumbo}deg)`;
    const hecho = []; PL.forEach((pl, i) => { if (VIA[i].b <= m) hecho.push(...pl.l); else if (i === k) { const e = enLinea(pl, f); hecho.push(...pl.l.slice(0, e.i), e.pt); } });
    const sh = map.getSource && map.getSource('rm-hecho'); sh && sh.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: hecho.length > 1 ? hecho : [] } });
    const dura = PLANCFG().visita || 15, sig = P.paradas.find(p => p.ini + dura > m);
    P.paradas.forEach(p => { const el = MK[p.c.id]; if (!el) return; el.classList.toggle('pasada', p.ini + dura <= m); el.classList.toggle('sig', p === sig); });
    const lugar = xy => { const p = P.paradas.find(q => q.xy[0] === xy[0] && q.xy[1] === xy[1]); return p ? p.c.nombre : (salidaUsuario().nombre || 'la salida'); };
    if (seg) nav.innerHTML = `<span class="ico">${RM_SV(RM_COCHE)}</span><div><b>Hacia ${esc(lugar(seg.hasta))}</b><span>Llegas hacia las ${hm(seg.b)}${seg.km != null ? ` · ${String(Math.round((1 - f) * seg.km * 10) / 10).replace('.', ',')} km` : ''}</span></div>`;
    else if (vis) nav.innerHTML = `<span class="ico">${RM_SV('<path d="M20 6 9 17l-5-5"/>')}</span><div><b>En ${esc(vis.p.c.nombre)}</b><span>Hasta las ${hm(vis.b)}${sig && sig !== vis.p ? ' · después, ' + esc(sig.c.nombre) : ''}</span></div>`;
    else nav.innerHTML = sig ? `<span class="ico">${RM_SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}</span><div><b>Siguiente: ${esc(sig.c.nombre)}</b><span>Hacia las ${hm(sig.ini)}</span></div>`
      : `<span class="ico">${svgIco(ICON_NOM.house || '')}</span><div><b>Jornada terminada</b><span>De vuelta hacia las ${hm(P.fin)}</span></div>`;
    $('rmtx').innerHTML = `A las <b>${hm(m)}</b>`;
    if (cam) {
      const t = performance.now(), g = tAnt ? 1 - Math.exp(-Math.min(500, t - tAnt) / 1000 * 2.2) : 1; tAnt = t;
      cen = cen ? [cen[0] + (pt[0] - cen[0]) * g, cen[1] + (pt[1] - cen[1]) * g] : pt;
      map.jumpTo({ center: cen, zoom: 13.6 });
    }
  };
  s.oninput = () => mover();
  const pb = $('rmplay');
  const parar = () => {
    if (RM_ANIM) cancelAnimationFrame(RM_ANIM); RM_ANIM = null; if (pb) pb.querySelector('span').textContent = 'Ver el día';
    yo.classList.remove('va'); if (cam) { cam = false; cen = null; tAnt = 0; map.fitBounds(bb, { padding: { top: 50, bottom: 90, left: 50, right: 50 }, duration: 900, maxZoom: 15 }); }
  };
  pb.onclick = () => {
    if (RM_ANIM) return parar();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let m = +s.value >= hi - 5 ? lo : +s.value, t0 = null;
    cam = !reduce; pb.querySelector('span').textContent = 'Parar'; yo.classList.add('va');
    const paso = t => {
      if (!$('rmscrub')) return parar();
      if (t0 == null) t0 = t; const dt = Math.min(0.1, (t - t0) / 1000); t0 = t;
      const enViaje = VIA.some(v => m >= v.a && m <= v.b);
      m = Math.min(hi, m + dt * (enViaje ? 6 : 70)); s.value = m; mover(m);
      if (m < hi) RM_ANIM = requestAnimationFrame(paso); else parar();
    };
    RM_ANIM = requestAnimationFrame(paso);
  };
  mover();
}
cargarRutas = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  rutasMapa();
  return r;
})(cargarRutas);

/* v2.234.0 · Rutas paso a paso (Eric eligió la B de https://claude.ai/artifact/1Ggx6ScuLR1Ad1kfmbQ6t1; SQL 139).
   - Fuera las propuestas automáticas. «Mis rutas» en tarjetas: recorrido dibujado, cuándo se hace, próxima fecha, a cuántos ves,
     kilómetros y hora de fin; «Pasar a mi agenda», «Editar» y «Eliminar» a la vista.
   - Crear o editar en tres pasos: 1) a quién vas a ver (buscador, filtros y mapa: tocar un punto lo añade), 2) orden y horario
     (el mejor orden se calcula solo respetando las horas de atención; se puede cambiar a mano y fijar horas), 3) vista previa del día
     (por las calles, con la función «rutas») y cuándo: un día concreto, cada semana, cada 15 días o una vez al mes (1.ª–4.ª o última
     semana). El nombre se propone solo (día y municipios) y se puede cambiar.
   - Pasar a la agenda: las citas de los días que tocan (8 semanas o 3 meses), sin duplicar (op_id por ruta, ficha y día) y saltando
     los días bloqueados. Las rutas que se repiten se rellenan solas hasta 4 semanas vista (repeticion.hasta guarda hasta dónde). */
const RN_DIAS = ['L', 'M', 'X', 'J', 'V'], RN_DIAN = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes' };
const RN_SEM = { 1: 'primer', 2: 'segundo', 3: 'tercer', 4: 'cuarto', 5: 'último' };
let RN = null;          // la ruta que se está creando o editando
let RN_LISTA = null, RN_MAPA_P = null;    // tarjetas de Mis rutas: [{r, ms}]
const rnSV = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const RN_IC = { up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', lupa: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  lapiz: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', papelera: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', varita: '<path d="m15 4 5 5"/><path d="M3 21 15 9"/><path d="M19 3v4M17 5h4M7 3v2M6 4h2"/>', check: '<path d="M20 6 9 17l-5-5"/>' };

// ---------- fechas de una ruta que se repite ----------
const rnDiaSem = d => RN_DIAS.indexOf(d) + 1;   // L = 1 … V = 5 (getDay)
function rnCumple(rep, f) {
  if (!rep) return false;
  const d = new Date(f + 'T12:00:00');
  if (rep.tipo === 'fecha') return rep.fecha === f;
  if (d.getDay() !== rnDiaSem(rep.dia)) return false;
  if (rep.tipo === 'semanal') return !rep.desde || f >= rep.desde;
  if (rep.tipo === 'quincenal') { const base = new Date((rep.desde || f) + 'T12:00:00'); const sem = Math.round((d - base) / 864e5 / 7); return f >= (rep.desde || f) && sem % 2 === 0; }
  if (rep.tipo === 'mensual') {
    const n = Math.ceil(d.getDate() / 7);
    if (+rep.semana === 5) { const sig = new Date(d); sig.setDate(d.getDate() + 7); return sig.getMonth() !== d.getMonth(); }
    return n === +rep.semana;
  }
  return false;
}
function rnFechas(rep, desde, hasta) {
  const out = []; if (!rep) return out;
  if (rep.tipo === 'fecha') return rep.fecha && rep.fecha >= desde && rep.fecha <= hasta ? [rep.fecha] : [];
  for (let f = desde; f <= hasta; f = isoMas(f, 1)) if (rnCumple(rep, f)) out.push(f);
  return out;
}
const rnHorizonte = rep => isoMas(hoyISO(), rep && rep.tipo === 'mensual' ? 92 : 56);
function rnCuando(rep) {
  if (!rep) return 'Sin fecha fija';
  if (rep.tipo === 'fecha') return rep.fecha ? fechaLarga(new Date(rep.fecha + 'T12:00:00')).replace(/^./, c => c.toUpperCase()) : 'Un día concreto';
  if (rep.tipo === 'semanal') return `Cada ${RN_DIAN[rep.dia]}`;
  if (rep.tipo === 'quincenal') return `Cada 15 días, los ${RN_DIAN[rep.dia]}`;
  if (rep.tipo === 'mensual') return `El ${RN_SEM[rep.semana] || 'primer'} ${RN_DIAN[rep.dia]} de cada mes`;
  return '';
}
const rnProxima = rep => rnFechas(rep, hoyISO(), isoMas(hoyISO(), 120))[0] || null;
// El día de referencia para las horas de atención: el de la repetición o el siguiente laborable
function rnFechaRef(rep, nombre) {
  const p = rnProxima(rep); if (p) return p;
  const m = String(nombre || '').toLowerCase().match(/^(lunes|martes|miércoles|jueves|viernes)(?=[\s·]|$)/);
  if (m) { const d = RN_DIAS.find(k => RN_DIAN[k] === m[1]); return rnFechas({ tipo: 'semanal', dia: d }, isoMas(hoyISO(), 1), isoMas(hoyISO(), 8))[0] || siguienteLaborable(); }
  return siguienteLaborable();
}

// ---------- horas ----------
function rnItems(ms, fecha) { return ms.map(m => ({ id: m.id, ref: m, xy: m.lat != null && m.lon != null ? [+m.lat, +m.lon] : null, ventanas: ventanasDe(m.dias, fecha), fija: null })); }
function rnConHor(salida, vuelta, fn) { return conHor({ salida: salida || '09:00', vuelta: vuelta || null }, fn); }
// El mejor orden: el planificador de siempre (cercanía y horas de atención)
function rnOrdenAuto(ms, fecha, salida, vuelta) {
  return rnConHor(salida, vuelta, () => {
    const { seq, fuera } = programarVisitas(rnItems(ms, fecha), minHora(salida || '09:00'));
    return seq.map(s => s.it.ref).concat(fuera.map(f => f.it.ref));
  });
}
// Horas siguiendo el orden que hay (con las fijadas a mano)
function rnHoras(ms, fecha, salida, vuelta, fijas) {
  return rnConHor(salida, vuelta, () => {
    const cfg = PLANCFG(), sal = salidaUsuario(), dura = cfg.visita || 15;
    let pos = sal.lat != null ? [+sal.lat, +sal.lon] : null, t = minHora(salida || '09:00'), km = 0;
    const out = ms.map((m, i) => {
      const xy = m.lat != null ? [+m.lat, +m.lon] : null, ven = ventanasDe(m.dias, fecha);
      const mismo = pos && xy && pos[0] === xy[0] && pos[1] === xy[1];
      const v = pos && xy && !mismo ? minutosEntre(pos, xy) + (cfg.parada || 0) : 0;
      if (pos && xy && !mismo) km += Math.hypot((xy[0] - pos[0]) * 111.32, (xy[1] - pos[1]) * 111.32 * Math.cos(xy[0] * Math.PI / 180)) * 1.3;
      let ini = t + v; const fija = fijas && fijas[m.id] ? minHora(fijas[m.id]) : null;
      if (fija != null) ini = Math.max(ini, fija);
      else if (ven && ven.length) { const w = ven.find(([a, b]) => ini <= b - dura) || null; if (w && ini < w[0]) ini = w[0]; }
      const aviso = !xy ? 'Sin ubicación' : ven && !ven.length ? `Ese día no atiende` : ven && ven.length && !ven.some(([a, b]) => ini >= a && ini + dura <= b) ? `Fuera de su horario (${txtVentanas(ven)})` : '';
      const r = { m, i, ini, fin: ini + dura, viaje: v, ven, aviso, fija: fija != null, mismo }; if (xy) pos = xy; t = ini + dura; return r;
    });
    const tope = minHora(cfg.tope);
    return { filas: out, fin: t, km, pasa: vuelta && t > tope };
  });
}
function rnNombreAuto(ms, rep) {
  const munis = [...new Set(ms.map(m => rpTitulo(m.municipio || '')).filter(Boolean))];
  const dia = rep && rep.dia ? RN_DIAN[rep.dia].replace(/^./, c => c.toUpperCase()) : rep && rep.tipo === 'fecha' && rep.fecha ? fechaCorta(rep.fecha) : '';
  const zona = munis.length ? munis.slice(0, 2).join(' y ') + (munis.length > 2 ? ' y más' : '') : 'Nueva ruta';
  return dia ? `${dia} · ${zona}` : zona;
}

// ---------- Mis rutas ----------
function rnCroquis(ms) {
  const pts = []; ms.forEach(m => { if (m.lat == null) return; if (!pts.some(u => u.lat === +m.lat && u.lon === +m.lon)) pts.push({ lat: +m.lat, lon: +m.lon }); });
  if (!pts.length) return '<div class="rnsin">Sin ubicaciones</div>';
  const W = 400, H = 140, P = 22, PT = 44, la = pts.map(p => p.lat), lo = pts.map(p => p.lon);
  const a0 = Math.min(...la), a1 = Math.max(...la), o0 = Math.min(...lo), o1 = Math.max(...lo), k = Math.cos(a0 * Math.PI / 180);
  const s = Math.min((W - 2 * P) / Math.max(1e-6, (o1 - o0) * k), (H - P - PT) / Math.max(1e-6, a1 - a0));
  const cx = (W - (o1 - o0) * k * s) / 2, cy = (H - PT - P - (a1 - a0) * s) / 2 + P;
  const ps = pts.map(p => [cx + (p.lon - o0) * k * s, H - cy - (p.lat - a0) * s]);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><polyline points="${ps.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#3F82C0" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${ps.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="10.5" fill="#17457A" stroke="#fff" stroke-width="2.5"/><text x="${p[0].toFixed(1)}" y="${(p[1] + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Manrope, sans-serif">${i + 1}</text>`).join('')}</svg>`;
}
async function rnMiembros(r) {
  const { data } = await db.rpc('cuentas_de_ruta', { p_id: r.id });
  const ms = data || [], pos = id => { const i = (r.codigos || []).indexOf(id); return i < 0 ? 1e9 : i; };
  return r.dinamica ? ms : ms.slice().sort((a, b) => pos(a.id) - pos(b.id));
}
cargarRutasBase = async function () {
  const v = $('v-rutas');
  if (RN) return rnPintar();
  const { data: rutas } = await db.rpc('rutas_visibles');
  RUTAS = rutas || [];
  const lista = await Promise.all(RUTAS.map(async r => ({ r, ms: await rnMiembros(r) })));
  RN_LISTA = lista;
  v.innerHTML = `
    <div class="saludo"><div><h1>Rutas</h1><div class="fecha">Tus rutas: créalas paso a paso, revísalas y pásalas a tu agenda</div></div>
      <div class="acts" style="margin:0"><button class="btn" id="rnueva">+ Nueva ruta</button></div></div>
    <div class="rngrid" id="rngrid">${lista.map(({ r, ms }, i) => {
      const rep = r.repeticion || null, f = rnFechaRef(rep, r.nombre), h = rnHoras(ms, f, r.salida, r.vuelta, r.fijas), prox = rnProxima(rep);
      const paradas = new Set(ms.filter(m => m.lat != null).map(m => (+m.lat).toFixed(5) + ',' + (+m.lon).toFixed(5))).size;
      return `<article class="rncard" data-rni="${i}"><div class="rncro">${rnCroquis(ms)}<span class="rndia">${esc(rnCuando(rep))}</span></div>
        <div class="rntx"><b>${esc(r.nombre)}</b>
          <span class="sm">${num(ms.length)} ${ms.length === 1 ? TT('medico', 's', '', 'l', 'l') : TT('medico', 'p', '', 'l', 'l')} · ${paradas} ${paradas === 1 ? 'parada' : 'paradas'}${h.km >= 1 ? ' · ' + Math.round(h.km) + ' km' : ''}</span>
          <span class="sm">${ms.length ? `De ${r.salida ? String(r.salida).slice(0, 5) : '09:00'} a ${hm(h.fin)}` : 'Todavía sin nadie'}${prox ? ` · próxima: ${esc(fechaCorta(prox))}` : ''}${r.mia ? '' : ' · de ' + esc(r.duenyo || '')}</span></div>
        <div class="rnacts"><button class="btn chico" type="button" data-rnag="${i}">Pasar a mi agenda</button>
          ${r.mia || puede('administrar') ? `<button class="btn sec chico" type="button" data-rned="${i}">${rnSV(RN_IC.lapiz)} Editar</button>
          <button class="btn sec chico rnico" type="button" data-rnbor="${i}" aria-label="Eliminar ${esc(r.nombre)}" title="Eliminar">${rnSV(RN_IC.papelera)}</button>` : `<button class="btn sec chico" type="button" data-rnver="${i}">Ver</button>`}</div></article>`; }).join('')}
      <button class="rnnueva" type="button" id="rnnueva2"><span><span class="mas">+</span><b>Nueva ruta</b><span class="sm">${lista.length ? 'Elige a quién vas a ver y en qué orden' : `Tu primera ruta: elige a quién vas a ver, el orden y cuándo. La app calcula las horas.`}</span></span></button></div>
    <div id="rcuerpo" hidden></div><div id="rplan"></div>`;
  $('rnueva').onclick = $('rnnueva2').onclick = () => rnAbrir(null);
  v.querySelectorAll('[data-rned]').forEach(b => b.onclick = () => rnAbrir(lista[+b.dataset.rned], 3));
  v.querySelectorAll('[data-rnver]').forEach(b => b.onclick = () => rnAbrir(lista[+b.dataset.rnver], 3));
  v.querySelectorAll('[data-rnag]').forEach(b => b.onclick = () => rnPasarAgenda(lista[+b.dataset.rnag], b));
  v.querySelectorAll('[data-rnbor]').forEach(b => b.onclick = async () => {
    const { r } = lista[+b.dataset.rnbor];
    if (!await preguntar(`Se elimina «${r.nombre}». Las citas que ya están en tu agenda no se borran.`, { titulo: '¿Eliminar la ruta?', ok: 'Eliminar', peligro: true })) return;
    const { error } = await db.rpc('guardar_ruta', { p: { id: r.id, activa: false } });
    if (error) { toast('No se ha podido eliminar', true); return; }
    toast('Ruta eliminada'); invalidarCache(); cargarRutas();
  });
};

// ---------- pasar a la agenda ----------
async function rnCitasEn(r, ms, fechas) {
  let n = 0, saltados = [];
  const bloq = fechas.length ? await bloqueadosSemana(fechas[0], fechas[fechas.length - 1]) : {};
  for (const f of fechas) {
    if (bloq[f]) { saltados.push(f); continue; }
    const existentes = await citasDelDia(f), ids = [];
    let orden = existentes.length;
    for (const m of ms) {
      const ya = existentes.find(c => c.cuenta_id === m.id && CITA_ABIERTA.includes(c.estado));
      if (ya) { ids.push(ya.id); continue; }
      const { data: x, error } = await db.rpc('guardar_cita', { p: { cuenta_id: m.id, fecha: f, hora: (r.fijas || {})[m.id] || null, centro_nombre: m.centro_nombre || null,
        estado: CITA_ABIERTA[0], origen: 'Ruta', orden: ++orden, salida: r.salida || null, vuelta: r.vuelta || null, op_id: `r-${r.id}-${m.id}-${f}` } });
      if (error || !x || !x.ok) { toast('No se ha podido guardar alguna cita', true); return { n, saltados, error: true }; }
      ids.push(x.id); n++;
    }
    const cerradas = existentes.filter(c => !CITA_ABIERTA.includes(c.estado)).map(c => c.id);
    const otras = existentes.filter(c => CITA_ABIERTA.includes(c.estado) && !ids.includes(c.id)).map(c => c.id);
    await db.rpc('ordenar_citas', { p_ids: cerradas.concat(otras, ids) });
  }
  invalidarCache();
  return { n, saltados };
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
async function pedirCampo(titulo, tipo, valor, etiqueta) {
  return new Promise(res => {
    const d = $('mini');
    d.innerHTML = `<div class="fbox"><div class="fh"><h2>${esc(titulo)}</h2></div><label for="rnpc">${esc(etiqueta)}</label><input id="rnpc" type="${tipo}" value="${esc(valor || '')}" min="${hoyISO()}">
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-op="no">Cancelar</button><button class="btn" data-op="si">Aceptar</button></div></div>`;
    const fin = v => { d.close(); res(v); };
    d.querySelectorAll('[data-op]').forEach(b => b.onclick = () => fin(b.dataset.op === 'si' ? $('rnpc').value : null));
    d.oncancel = e => { e.preventDefault(); fin(null); };
    if (typeof mejorarCampos === 'function') mejorarCampos(d);
    d.showModal();
  });
}
// Las rutas que se repiten se rellenan solas hasta 4 semanas vista (una vez al día, solo las propias)
async function rnRellenar() {
  try {
    const k = 'delcos-rnrell-' + (PERFIL || {}).id; if (localStorage.getItem(k) === hoyISO()) return;
    localStorage.setItem(k, hoyISO());
    const { data } = await RPC_ORIG('rutas_visibles', {});
    for (const r of (data || []).filter(x => x.mia && x.repeticion && x.repeticion.tipo !== 'fecha')) {
      const rep = r.repeticion, desde = rep.hasta && rep.hasta >= hoyISO() ? isoMas(rep.hasta, 1) : (rep.desde && rep.desde > hoyISO() ? rep.desde : hoyISO());
      const fechas = rnFechas(rep, desde, isoMas(hoyISO(), 28)); if (!fechas.length) continue;
      const ms = (await rnMiembros(r)).filter(m => m.lat != null); if (!ms.length) continue;
      const res = await rnCitasEn(r, ms, fechas);
      if (!res.error) await db.rpc('guardar_ruta', { p: { id: r.id, repeticion: Object.assign({}, rep, { hasta: fechas[fechas.length - 1] }) } });
    }
  } catch (e) {}
}
setTimeout(() => { if (typeof PERFIL !== 'undefined' && PERFIL && (typeof verArea !== 'function' || verArea('rutas'))) rnRellenar(); }, 8000);

// ---------- crear o editar ----------
function rnAbrir(item, paso) {
  const r = item && item.r;
  const rep = r ? (r.repeticion || null) : { tipo: 'semanal', dia: RN_DIAS[Math.max(0, new Date(siguienteLaborable() + 'T12:00:00').getDay() - 1)] || 'L', desde: siguienteLaborable() };
  RN = { id: r ? r.id : null, nombre: r ? r.nombre : '', auto: !r, ms: item ? item.ms.slice() : [], rep, salida: r && r.salida ? String(r.salida).slice(0, 5) : '09:00',
    vuelta: r && r.vuelta ? String(r.vuelta).slice(0, 5) : '', fijas: Object.assign({}, (r && r.fijas) || {}), ordenManual: !!r, paso: paso || 1, centros: r ? r.centros || [] : [],
    q: '', fil: { mios: true, urg: false, dia: false, nunca: false }, res: [], mapa: null };
  if (TAB !== 'rutas') ir('rutas'); else rnPintar();
}
function rnCerrar() { RN = null; if (RM_MAPA) { try { RM_MAPA.remove(); } catch (e) {} RM_MAPA = null; } cargarRutas(); }
function rnNombre() { if (RN.auto) RN.nombre = rnNombreAuto(RN.ms, RN.rep); return RN.nombre || 'Nueva ruta'; }
function rnPintar() {
  const v = $('v-rutas'); if (!v || !RN) return;
  const pasos = [['1', 'A quién vas a ver'], ['2', 'Orden y horario'], ['3', 'Vista previa y cuándo']];
  v.innerHTML = `<div class="rnroot">
    <div><button class="rnvol" type="button" id="rnvol">‹ Mis rutas</button>
      <div class="rntit"><input id="rnnom" value="${esc(rnNombre())}" aria-label="Nombre de la ruta" maxlength="80"><span class="rnlap">${rnSV(RN_IC.lapiz)}</span></div>
      <div class="sm rnnomsm">${RN.auto ? 'Nombre propuesto con el día y los municipios: puedes cambiarlo' : 'Nombre de la ruta'}</div></div>
    <div class="rnpasos" role="tablist">${pasos.map(([n, t]) => `<button type="button" role="tab" data-rnp="${n}" class="${+n === RN.paso ? 'on' : +n < RN.paso ? 'ok' : ''}" aria-selected="${+n === RN.paso}" ${+n > 1 && !RN.ms.length ? 'disabled' : ''}><i>${+n < RN.paso ? '✓' : n}</i><span>${t}</span></button>`).join('')}</div>
    <div id="rnpaso"></div></div>`;
  $('rnvol').onclick = rnCerrar;
  $('rnnom').oninput = e => { RN.nombre = e.target.value; RN.auto = !e.target.value.trim(); };
  v.querySelectorAll('[data-rnp]').forEach(b => b.onclick = () => { if (b.disabled) return; RN.paso = +b.dataset.rnp; rnPintar(); });
  if (RN.paso === 1) rnPaso1(); else if (RN.paso === 2) rnPaso2(); else rnPaso3();
}
const rnPie = (izq, der) => `<div class="rnpie"><span>${izq}</span><span class="rnpieb">${der}</span></div>`;

// Paso 1: a quién vas a ver
async function rnBuscar() {
  const f = RN.fil, dia = RN.rep && RN.rep.dia;
  const { data } = await db.rpc('buscar_cuentas', { q: RN.q || null, f_provincia: null, f_municipio: null, f_estado: null, f_especialidad: null, f_area: null,
    f_urgentes: !!f.urg, f_mios: !!f.mios, f_sin_visitar: !!f.nunca, f_comercial: null, f_reporting: null, orden: null, lim: 200, desplaz: 0 });
  let l = ((data || {}).filas || []);
  // Sin cartera propia (p. ej. administración), «Mi cartera» se quita sola la primera vez
  if (f.mios && !l.length && !RN.q && !RN.__sinCartera) { RN.__sinCartera = true; f.mios = false; return rnBuscar(); }
  if (f.dia && dia) l = l.filter(m => m.dias && m.dias[dia]);
  RN.res = l;
}
async function rnPaso1() {
  const caja = $('rnpaso'), dia = RN.rep && RN.rep.dia;
  caja.innerHTML = `<div class="rnb1"><div class="rnsel">
      <div class="rnbus">${rnSV(RN_IC.lupa)}<input id="rnq" placeholder="Busca por nombre, centro o municipio" value="${esc(RN.q)}" autocomplete="off"></div>
      <div class="rnfil" role="group" aria-label="Filtros">
        <button type="button" data-rnf="mios" class="${RN.fil.mios ? 'on' : ''}" id="rnfmios">Mi cartera</button><button type="button" data-rnf="urg" class="${RN.fil.urg ? 'on' : ''}">Urgentes</button>
        ${dia ? `<button type="button" data-rnf="dia" class="${RN.fil.dia ? 'on' : ''}">Atienden el ${RN_DIAN[dia]}</button>` : ''}<button type="button" data-rnf="nunca" class="${RN.fil.nunca ? 'on' : ''}">Nunca visitados</button></div>
      <div class="rnres" id="rnres"><div class="sm" style="padding:10px 4px">Buscando…</div></div></div>
    <div class="rnmini"><div class="mc" id="rnmc"></div><div class="rnley"><span><i style="background:#17457A"></i>En la ruta</span><span><i style="background:#9FB6CE"></i>Para añadir</span><span><i style="background:#E08A00"></i>Urgente</span></div></div></div>
    ${rnPie(`<b id="rnn">${RN.ms.length}</b> elegidos`, `<button class="btn" type="button" id="rnsig1" ${RN.ms.length ? '' : 'disabled'}>Siguiente: orden y horario</button>`)}`;
  let tq = null;
  $('rnq').oninput = e => { RN.q = e.target.value; clearTimeout(tq); tq = setTimeout(async () => { await rnBuscar(); rnLista1(); rnMapa1(); }, 300); };
  caja.querySelectorAll('[data-rnf]').forEach(b => b.onclick = async () => { RN.fil[b.dataset.rnf] = !RN.fil[b.dataset.rnf]; b.classList.toggle('on'); await rnBuscar(); rnLista1(); rnMapa1(); });
  $('rnsig1').onclick = () => { RN.paso = 2; if (!RN.ordenManual) rnAuto(); rnPintar(); };
  await rnBuscar(); if (!$('rnres')) return;
  if ($('rnfmios')) $('rnfmios').classList.toggle('on', !!RN.fil.mios);
  rnLista1(); rnMapa1();
}
function rnToggle(m) {
  const i = RN.ms.findIndex(x => x.id === m.id);
  if (i >= 0) { RN.ms.splice(i, 1); delete RN.fijas[m.id]; } else RN.ms.push(m);
  RN.ordenManual = false;
  if ($('rnn')) $('rnn').textContent = RN.ms.length;
  if ($('rnsig1')) $('rnsig1').disabled = !RN.ms.length;
  if (RN.auto && $('rnnom')) $('rnnom').value = rnNombre();
  document.querySelectorAll('[data-rnp="2"], [data-rnp="3"]').forEach(b => b.disabled = !RN.ms.length);
  rnLista1(); rnMapa1();
}
function rnLista1() {
  const c = $('rnres'); if (!c) return;
  const sel = new Set(RN.ms.map(m => m.id)), dia = RN.rep && RN.rep.dia;
  const l = RN.ms.filter(m => !RN.res.some(x => x.id === m.id)).concat(RN.res);
  c.innerHTML = l.length ? l.slice(0, 120).map(m => `<button type="button" class="rnopt ${sel.has(m.id) ? 'on' : ''}" data-rnm="${m.id}" aria-pressed="${sel.has(m.id)}">
      <span class="ck">${sel.has(m.id) ? rnSV(RN_IC.check) : ''}</span>
      <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc([m.centro_nombre, rpTitulo(m.municipio || '')].filter(Boolean).join(' · '))}${dia && m.dias ? (m.dias[dia] ? ` · atiende ${esc(String(m.dias[dia]))}` : ` · no atiende el ${RN_DIAN[dia]}`) : ''}</span></span>
      <span class="tag ${m.urgente ? 'u' : ''}">${m.urgente ? 'Urgente' : esc(m.estado_comercial || '')}</span></button>`).join('')
    : `<div class="vacio">No hay ${TT('medico', 'p', '', 'l', 'l')} con esos filtros.</div>`;
  c.querySelectorAll('[data-rnm]').forEach(b => b.onclick = () => { const m = l.find(x => x.id === b.dataset.rnm); if (m) rnToggle(m); });
}
async function rnMapaBase(el, ms) {
  const ml = await rmLib();
  if (RM_MAPA) { const viejo = RM_MAPA; RM_MAPA = null; setTimeout(() => { try { viejo.remove(); } catch (e) {} }, 0); }
  const map = new ml.Map({ container: el, style: 'https://tiles.openfreemap.org/styles/liberty', maxPitch: 0, dragRotate: false, attributionControl: { compact: true } });
  RM_MAPA = map; map.touchZoomRotate.disableRotation();
  map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
  map.__mk = [];
  map.on('load', () => { if (!map.style) return; rnRestilo(map); map.__listo = true; });
  return { ml, map };
}
function rnRestilo(map) {
  (map.getStyle().layers || []).forEach(l => {
    const id = l.id, set = (k, v) => { try { map.setPaintProperty(id, k, v); } catch (e) {} }, off = () => { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {} };
    if (/^rn-/.test(id)) return;
    if (l.type === 'fill-extrusion') return off();
    if (l.type === 'background') return set('background-color', RM_PAL.tierra);
    if (l.type === 'symbol') { if (/poi|aeroway|housenumber|transit|rail|ferry|shield/i.test(id)) return off(); set('text-color', RM_PAL.texto); set('text-halo-color', '#FFFFFF'); set('text-halo-width', 1.4); return; }
    if (l.type === 'fill') { if (/water/i.test(id)) return set('fill-color', RM_PAL.agua); if (/building/i.test(id)) return set('fill-color', RM_PAL.edif); if (/park|wood|grass|forest|landcover|cemetery|pitch/i.test(id)) { set('fill-color', RM_PAL.parque); return set('fill-opacity', 0.8); } set('fill-color', RM_PAL.zona); return set('fill-opacity', 0.6); }
    if (l.type === 'line') { if (/water|river|stream|canal/i.test(id)) return set('line-color', RM_PAL.agua); if (/rail|ferry|aeroway|boundary|admin/i.test(id)) return off(); const g = /motorway|trunk|primary/i.test(id); set('line-color', /casing/i.test(id) ? (g ? RM_PAL.viaBorde : RM_PAL.borde) : (g ? RM_PAL.via : RM_PAL.calle)); }
  });
}
const rnFC = l => ({ type: 'FeatureCollection', features: l });
function rnPintarCapas(map, ml, ms, otros, linea, encaje) {
  if (!map || !ml || !map.getContainer().isConnected) return;
  const fijo = () => {
    if (!map.style || !map.getContainer().isConnected) return;
    const src = (id, data) => { const s = map.getSource(id); if (s) s.setData(data); else map.addSource(id, { type: 'geojson', data }); };
    src('rn-otros', rnFC((otros || []).filter(m => m.lat != null).map(m => ({ type: 'Feature', properties: { id: m.id, u: m.urgente ? 1 : 0 }, geometry: { type: 'Point', coordinates: [+m.lon, +m.lat] } }))));
    src('rn-linea', { type: 'Feature', geometry: { type: 'LineString', coordinates: linea || [] } });
    if (!map.getLayer('rn-linea-b')) {
      map.addLayer({ id: 'rn-linea-b', type: 'line', source: 'rn-linea', paint: { 'line-color': RM_PAL.rutaBorde, 'line-width': 7 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      map.addLayer({ id: 'rn-linea', type: 'line', source: 'rn-linea', paint: { 'line-color': RM_PAL.ruta, 'line-width': 4.5 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      map.addLayer({ id: 'rn-otros', type: 'circle', source: 'rn-otros', paint: { 'circle-radius': 7, 'circle-color': ['case', ['==', ['get', 'u'], 1], '#E08A00', '#9FB6CE'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
      map.on('click', 'rn-otros', e => { const id = e.features && e.features[0] && e.features[0].properties.id; const m = (RN && RN.res || []).find(x => x.id === id); if (m) rnToggle(m); });
      map.on('mouseenter', 'rn-otros', () => { map.getCanvas().style.cursor = 'pointer'; }); map.on('mouseleave', 'rn-otros', () => { map.getCanvas().style.cursor = ''; });
    }
  };
  if (map.__listo) fijo(); else map.once('load', () => setTimeout(fijo, 0));
  map.__mk.forEach(m => m.remove()); map.__mk = [];
  const sal = salidaUsuario();
  if (sal.lat != null) { const e = document.createElement('div'); e.className = 'rmcasa'; e.innerHTML = svgIco(ICON_NOM.house || ''); map.__mk.push(new ml.Marker({ element: e }).setLngLat([+sal.lon, +sal.lat]).addTo(map)); }
  const grupos = []; ms.forEach((m, i) => { if (m.lat == null) return; const u = grupos[grupos.length - 1]; if (u && u.lat === +m.lat && u.lon === +m.lon) u.n.push(i + 1); else grupos.push({ lat: +m.lat, lon: +m.lon, n: [i + 1], m }); });
  grupos.forEach(g => { const e = document.createElement('button'); e.type = 'button'; e.className = 'rmmk' + (g.n.length > 1 ? ' multi' : ''); e.style.setProperty('--c', '#17457A');
    e.innerHTML = `<span>${g.n.length > 2 ? g.n[0] + '–' + g.n[g.n.length - 1] : g.n.join('·')}</span>`; e.title = g.m.nombre;
    if (RN && RN.paso === 1) e.onclick = ev => { ev.stopPropagation(); rnToggle(g.m); };
    map.__mk.push(new ml.Marker({ element: e, anchor: 'bottom' }).setLngLat([g.lon, g.lat]).addTo(map)); });
  if (encaje !== false) {
    const xs = ms.concat(otros || []).filter(m => m.lat != null).map(m => [+m.lon, +m.lat]).concat(sal.lat != null && ms.length ? [[+sal.lon, +sal.lat]] : []);
    if (xs.length) { const b = xs.reduce((b, p) => [[Math.min(b[0][0], p[0]), Math.min(b[0][1], p[1])], [Math.max(b[1][0], p[0]), Math.max(b[1][1], p[1])]], [[180, 90], [-180, -90]]);
      map.fitBounds(b, { padding: 50, duration: map.__ya ? 500 : 0, maxZoom: 14 }); map.__ya = true; }
  }
}
async function rnMapa1() {
  const el = $('rnmc'); if (!el || !RN) return;
  if (!RM_MAPA || RM_MAPA.getContainer() !== el) {
    if (!RN_MAPA_P || RN_MAPA_P.el !== el) { RN_MAPA_P = rnMapaBase(el).then(({ ml, map }) => { map.__ml = ml; }); RN_MAPA_P.el = el; }
    await RN_MAPA_P;
  }
  if (!$('rnmc') || !RM_MAPA || !RM_MAPA.__ml || RM_MAPA.getContainer() !== $('rnmc')) return;
  const map = RM_MAPA, sel = new Set(RN.ms.map(m => m.id)), sal = salidaUsuario();
  const linea = (sal.lat != null && RN.ms.length ? [[+sal.lon, +sal.lat]] : []).concat(RN.ms.filter(m => m.lat != null).map(m => [+m.lon, +m.lat]));
  rnPintarCapas(map, map.__ml, RN.ms, RN.res.filter(m => !sel.has(m.id)), linea, !map.__ya);
}

// Paso 2: orden y horario
function rnAuto() { const f = rnFechaRef(RN.rep, RN.nombre); RN.ms = rnOrdenAuto(RN.ms, f, RN.salida, RN.vuelta); RN.ordenManual = false; }
function rnPaso2() {
  const caja = $('rnpaso'), f = rnFechaRef(RN.rep, RN.nombre), h = rnHoras(RN.ms, f, RN.salida, RN.vuelta, RN.fijas);
  const sal = salidaUsuario();
  caja.innerHTML = `<div class="rnb2"><div class="rnord">
      <div class="rnordcab"><div class="rnhor2"><label>Sales a las <input type="time" id="rnsal" value="${esc(RN.salida)}"></label><label>Vuelves como tarde <input type="time" id="rnvue" value="${esc(RN.vuelta)}" placeholder="Sin hora"></label>
        <span class="sm">Desde ${esc(sal.nombre || 'tu punto de salida')} · horas calculadas para el ${esc(fechaLarga(new Date(f + 'T12:00:00')))}</span></div>
        <button class="btn sec" type="button" id="rnauto">${rnSV(RN_IC.varita)} ${RN.ordenManual ? 'Volver al orden automático' : 'Orden automático'}</button></div>
      <p class="sm rnordtx">${RN.ordenManual ? 'Has cambiado el orden a mano.' : 'El mejor orden: el más corto que respeta las horas de atención.'} Usa las flechas para cambiarlo y toca una hora para fijarla.</p>
      <div class="rnlst">${h.filas.map((x, i) => `${i && !x.mismo && x.viaje ? `<div class="rntramo">${Math.round(x.viaje)} min</div>` : ''}<div class="rnpar ${x.aviso ? 'aviso' : ''}">
          <span class="n">${i + 1}</span>
          <div class="tx"><b>${esc(x.m.nombre)}</b><span class="sm">${esc([x.m.centro_nombre, rpTitulo(x.m.municipio || '')].filter(Boolean).join(' · '))}</span>
            <span class="sm ${x.aviso ? 'rnav' : ''}">${esc(x.aviso || (x.ven && x.ven.length ? 'Atiende ' + txtVentanas(x.ven) : ''))}</span></div>
          <div class="der"><button type="button" class="rnh ${x.fija ? 'fija' : ''}" data-rnh="${x.m.id}" title="${x.fija ? 'Hora fijada: toca para cambiarla o quitarla' : 'Hora calculada: toca para fijarla'}">${x.fija ? rnSV(RN_IC.reloj) : '~'}${hm(x.ini)}</button>
            <span class="ops"><button type="button" data-rnmv="-1|${i}" aria-label="Subir" ${i ? '' : 'disabled'}>${rnSV(RN_IC.up)}</button><button type="button" data-rnmv="1|${i}" aria-label="Bajar" ${i < h.filas.length - 1 ? '' : 'disabled'}>${rnSV(RN_IC.down)}</button>
              <button type="button" data-rnx="${i}" aria-label="Quitar">${rnSV(RN_IC.x)}</button></span></div></div>`).join('')}</div></div>
    <div class="rnresum"><div><b>${RN.ms.length}</b>${TT('medico', 'p', '', 'l', 'l')}</div><div><b>${new Set(RN.ms.filter(m => m.lat != null).map(m => m.lat + ',' + m.lon)).size}</b>paradas</div>
      <div><b>${Math.round(h.km)} km</b>aprox.</div><div><b class="${h.pasa ? 'rnmal' : ''}">${hm(h.fin)}</b>terminas${h.pasa ? ' (pasa de tu hora de vuelta)' : ''}</div></div></div>
    ${rnPie('Lo ves en el mapa en el paso siguiente.', '<button class="btn sec" type="button" id="rnant2">‹ Atrás</button><button class="btn" type="button" id="rnsig2">Siguiente: vista previa</button>')}`;
  $('rnsal').onchange = e => { RN.salida = e.target.value || '09:00'; if (!RN.ordenManual) rnAuto(); rnPaso2(); };
  $('rnvue').onchange = e => { RN.vuelta = e.target.value || ''; if (!RN.ordenManual) rnAuto(); rnPaso2(); };
  $('rnauto').onclick = () => { rnAuto(); rnPaso2(); };
  caja.querySelectorAll('[data-rnmv]').forEach(b => b.onclick = () => { const [d, i] = b.dataset.rnmv.split('|').map(Number), j = i + d; [RN.ms[i], RN.ms[j]] = [RN.ms[j], RN.ms[i]]; RN.ordenManual = true; rnPaso2(); });
  caja.querySelectorAll('[data-rnx]').forEach(b => b.onclick = () => { const m = RN.ms.splice(+b.dataset.rnx, 1)[0]; if (m) delete RN.fijas[m.id]; if (!RN.ms.length) { RN.paso = 1; return rnPintar(); } rnPaso2(); });
  caja.querySelectorAll('[data-rnh]').forEach(b => b.onclick = async () => {
    const id = b.dataset.rnh, x = h.filas.find(y => y.m.id === id);
    const op = await elegirOpcion('Hora de la visita', `${x.m.nombre}${x.ven && x.ven.length ? ' · atiende ' + txtVentanas(x.ven) : ''}`,
      [{ k: 'no', t: 'Cancelar', cls: 'sec' }].concat(RN.fijas[id] ? [{ k: 'quitar', t: 'Que la calcule la app', cls: 'sec' }] : []).concat([{ k: 'fijar', t: 'Fijar una hora' }]));
    if (op === 'quitar') { delete RN.fijas[id]; return rnPaso2(); }
    if (op !== 'fijar') return;
    const v = await pedirCampo('Fijar la hora', 'time', RN.fijas[id] || hm(x.ini), 'Hora'); if (!v) return;
    RN.fijas[id] = v; rnPaso2();
  });
  $('rnant2').onclick = () => { RN.paso = 1; rnPintar(); };
  $('rnsig2').onclick = () => { RN.paso = 3; rnPintar(); };
}

// Paso 3: vista previa y cuándo
function rnRepHtml() {
  const rep = RN.rep || null, t = rep ? rep.tipo : 'nada', dia = (rep && rep.dia) || 'L';
  const op = (k, tx) => `<button type="button" data-rnrt="${k}" class="${t === k ? 'on' : ''}" aria-pressed="${t === k}">${tx}</button>`;
  return `<div class="rncuando"><h3>¿Cuándo la haces?</h3>
    <div class="segs rnrt" role="group" aria-label="Cuándo">${op('fecha', 'Un día')}${op('semanal', 'Cada semana')}${op('quincenal', 'Cada 15 días')}${op('mensual', 'Una vez al mes')}${op('nada', 'Sin fecha')}</div>
    ${t === 'fecha' ? `<label for="rnfe">Día</label><input type="date" id="rnfe" value="${esc((rep && rep.fecha) || siguienteLaborable())}" min="${hoyISO()}">` : ''}
    ${['semanal', 'quincenal', 'mensual'].includes(t) ? `<div class="rndias2" role="group" aria-label="Día de la semana">${RN_DIAS.map(d => `<button type="button" data-rnd="${d}" class="${d === dia ? 'on' : ''}">${RN_DIAN[d].charAt(0).toUpperCase() + RN_DIAN[d].slice(1, 3)}</button>`).join('')}</div>` : ''}
    ${t === 'mensual' ? `<label for="rnsem">Qué semana del mes</label><select id="rnsem">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${+((rep && rep.semana) || 1) === n ? 'selected' : ''}>${n === 5 ? 'La última' : `La ${RN_SEM[n].replace(/r$/, 'ra')}`}</option>`).join('')}</select>` : ''}
    ${t === 'quincenal' ? `<label for="rnde">Empezando el</label><input type="date" id="rnde" value="${esc((rep && rep.desde) || siguienteLaborable())}" min="${hoyISO()}">` : ''}
    <p class="sm rnrtx">${t === 'nada' ? 'Se guarda sin fecha: la pasas a tu agenda cuando quieras.' : `${esc(rnCuando(rep))}.${(() => { const f = rnFechas(rep, hoyISO(), rnHorizonte(rep)).slice(0, 4); return f.length ? ` Próximas: ${f.map(x => fechaCorta(x)).join(', ')}.` : ''; })()}`}</p></div>`;
}
async function rnPaso3() {
  const caja = $('rnpaso'), f = rnFechaRef(RN.rep, RN.nombre), h = rnHoras(RN.ms, f, RN.salida, RN.vuelta, RN.fijas), sal = salidaUsuario();
  const repetida = RN.rep && RN.rep.tipo !== 'fecha';
  caja.innerHTML = `<div class="rnb3"><div class="rnmini"><div class="mc" id="rnmc"></div><div class="rnchip" id="rnchip">Calculando la ruta…</div></div>
      <div class="rnlado"><div class="rntl"><h3 id="rntlh">${esc(fechaLarga(new Date(f + 'T12:00:00')).replace(/^./, c => c.toUpperCase()))} · así será tu día</h3><div id="rntl"></div></div>${rnRepHtml()}</div></div>
    ${rnPie(RN.id ? 'Los cambios se guardan en la ruta; las citas que ya están en tu agenda no cambian.' : 'Se guarda en Mis rutas.',
      `<button class="btn sec" type="button" id="rnant3">‹ Atrás</button><button class="btn sec" type="button" id="rnguar">Guardar ruta</button><button class="btn" type="button" id="rnguarag">${RN.rep ? 'Guardar y pasar a mi agenda' : 'Guardar y elegir el día'}</button>`)}`;
  const tl = (hh, tramos) => {
    const filas = hh.filas;
    $('rntl').innerHTML = `<div class="rntli viaje"><span class="h">${hm(minHora(RN.salida || '09:00'))}</span><span class="l"></span><span class="t">Sales de ${esc(sal.nombre || 'tu punto de salida')}</span></div>
      ${filas.map((x, i) => `${i && !x.mismo && x.viaje ? `<div class="rntli viaje"><span class="h"></span><span class="l"></span><span class="t">${Math.round(x.viaje)} min de coche</span></div>` : ''}
        <div class="rntli"><span class="h">${hm(x.ini)}</span><span class="l"><i></i></span><span class="t"><b>${i + 1}. ${esc(x.m.nombre)}</b><span class="sm">${esc(x.m.centro_nombre || rpTitulo(x.m.municipio || ''))}${x.aviso ? ` · <span class="rnav">${esc(x.aviso)}</span>` : ''}</span></span></div>`).join('')}
      <div class="rntli viaje"><span class="h">${hm(hh.fin)}</span><span class="l"></span><span class="t">Terminas la última ${TT('visita', 's', '', 'l', 'l')}</span></div>`;
  };
  tl(h);
  const pon = () => { const c = caja.querySelector('.rncuando'); c.outerHTML = rnRepHtml(); engancharRep(); const f2 = rnFechaRef(RN.rep, RN.nombre); if ($('rntlh')) $('rntlh').textContent = fechaLarga(new Date(f2 + 'T12:00:00')).replace(/^./, c => c.toUpperCase()) + ' · así será tu día'; tl(rnHoras(RN.ms, f2, RN.salida, RN.vuelta, RN.fijas)); if (RN.auto && $('rnnom')) $('rnnom').value = rnNombre(); $('rnguarag').textContent = RN.rep ? 'Guardar y pasar a mi agenda' : 'Guardar y elegir el día'; };
  const engancharRep = () => {
    caja.querySelectorAll('[data-rnrt]').forEach(b => b.onclick = () => { const t = b.dataset.rnrt, dia = (RN.rep && RN.rep.dia) || 'L';
      RN.rep = t === 'nada' ? null : t === 'fecha' ? { tipo: 'fecha', fecha: (RN.rep && RN.rep.fecha) || siguienteLaborable() } : t === 'mensual' ? { tipo: 'mensual', dia, semana: (RN.rep && RN.rep.semana) || 1 }
        : { tipo: t, dia, desde: (RN.rep && RN.rep.desde) || siguienteLaborable() }; pon(); });
    caja.querySelectorAll('[data-rnd]').forEach(b => b.onclick = () => { RN.rep = Object.assign({}, RN.rep, { dia: b.dataset.rnd }); pon(); });
    if ($('rnfe')) $('rnfe').onchange = e => { RN.rep = { tipo: 'fecha', fecha: e.target.value }; pon(); };
    if ($('rnde')) $('rnde').onchange = e => { RN.rep = Object.assign({}, RN.rep, { desde: e.target.value }); pon(); };
    if ($('rnsem')) $('rnsem').onchange = e => { RN.rep = Object.assign({}, RN.rep, { semana: +e.target.value }); pon(); };
    if (typeof mejorarCampos === 'function') mejorarCampos(caja);
  };
  engancharRep();
  $('rnant3').onclick = () => { RN.paso = 2; rnPintar(); };
  $('rnguar').onclick = () => rnGuardar(false);
  $('rnguarag').onclick = () => rnGuardar(true);
  // El mapa: en recto y, si contesta la función, por las calles
  const el = $('rnmc'); const { ml, map } = await rnMapaBase(el); if (!$('rnmc')) return;
  const conXY = RN.ms.filter(m => m.lat != null);
  const pts = (sal.lat != null ? [[+sal.lat, +sal.lon]] : []).concat(conXY.map(m => [+m.lat, +m.lon]));
  const puntos = pts.filter((p, i) => !i || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  rnPintarCapas(map, ml, RN.ms, null, puntos.map(p => [p[1], p[0]]));
  if (puntos.length < 2 || puntos.length > 30) { $('rnchip').textContent = 'Vista previa en línea recta'; return; }
  const res = await rmRuta(puntos, `${f}T${RN.salida || '09:00'}:00`); if (!$('rnchip')) return;
  if (res.ok && res.tramos && res.tramos.length === puntos.length - 1) {
    const linea = res.tramos.flatMap(t => (t.linea || []).map(([la, lo]) => [lo, la]));
    rnPintarCapas(map, ml, RN.ms, null, linea, false);
    $('rnchip').innerHTML = `Por las calles, con tráfico · <b>${String(res.km).replace('.', ',')} km</b> · <b>${rmDur(res.min)}</b> al volante <span class="rmfuente">Ruta: © TomTom</span>`;
  } else $('rnchip').textContent = `${RM_MOTIVO[res.motivo] || RM_MOTIVO.servicio}: vista previa en línea recta`;
}
async function rnGuardar(agenda) {
  const nombre = ($('rnnom') && $('rnnom').value.trim()) || rnNombre();
  const rep = RN.rep ? Object.assign({}, RN.rep) : null;
  if (rep) delete rep.hasta;   // al cambiar la ruta, la agenda se vuelve a mirar desde hoy
  const p = { nombre, codigos: RN.ms.map(m => m.id), reglas: null, salida: RN.salida || null, vuelta: RN.vuelta || null, repeticion: rep,
    fijas: Object.keys(RN.fijas).length ? RN.fijas : null, centros: RN.centros || [] };
  if (RN.id) p.id = RN.id;
  const b1 = $('rnguar'), b2 = $('rnguarag'); [b1, b2].forEach(b => b && (b.disabled = true));
  const { data, error } = await db.rpc('guardar_ruta', { p });
  [b1, b2].forEach(b => b && (b.disabled = false));
  if (error || !data || !data.ok) { toast('No se ha podido guardar la ruta' + (error ? ': ' + error.message : ''), true); return; }
  invalidarCache();
  const ms = RN.ms.slice();
  RN = null;
  toast('Ruta guardada');
  if (agenda) return rnPasarAgenda({ r: Object.assign({}, p, { id: data.id, mia: true }), ms });
  cargarRutas();
}
// Con la ruta abierta, Rutas solo pinta el editor (sin la jornada en curso ni el mapa de hoy); el menú «Rutas» vuelve a Mis rutas
pintarRutaEnCurso = (orig => function (...a) { if (RN) return; return orig.apply(this, a); })(pintarRutaEnCurso);
rutasMapa = (orig => async function (...a) { if (RN) return; const r = await orig.apply(this, a); const m = $('rmapa'), g = $('rngrid'); if (m && g && g.nextElementSibling !== m) { g.after(m); if (RM_MAPA) setTimeout(() => { try { RM_MAPA.resize(); } catch (e) {} }, 50); } return r; })(rutasMapa);
cargarRutasPaso2 = (orig => function (...a) { if (RN) return; return orig.apply(this, a); })(cargarRutasPaso2);
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('nav.main [data-t="rutas"], #bnav [data-t="rutas"], .bmasgrid [data-bm="rutas"]'); if (b && RN) RN = null; }, true);

/* v2.235.0 · Textos personalizados (Eric eligió la A de https://claude.ai/artifact/6uxwD5zLEbd3krk1QMeoPF; SQL 140).
   - Configuración → Empresa → «Textos personalizados»: una lista con buscador y filtros con todo lo que cada empresa puede llamar a
     su manera: vocabulario (ajuste terminos), nombres del menú (ajuste menu_nombres; el de las fichas es marca.etiqueta), estados
     comerciales y resultados de visita (renombrar_texto: también en las fichas y en las visitas ya registradas), roles y campos.
   - Los nombres del menú se aplican en el menú lateral, la barra del móvil, «Más» y el título de cada pantalla. */
const TX_IC = { rv: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', lupa: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>' };
const txSV = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const menuNombres = () => (AJUSTES && AJUSTES.menu_nombres) || {};

// ---------- nombres del menú ----------
function txTexto(b) {
  const l = b.querySelector('.mllab, b, em, small, .lb'); if (l && !l.querySelector('svg')) return { get: () => l.textContent.trim(), set: v => { l.textContent = v; if (b.dataset.tip) b.dataset.tip = v; } };
  const tn = [...b.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim());
  return tn ? { get: () => tn.nodeValue.trim(), set: v => { tn.nodeValue = tn.nodeValue.replace(tn.nodeValue.trim(), v); if (b.dataset.tip) b.dataset.tip = v; } } : null;
}
function aplicarNombresMenu() {
  const mn = menuNombres();
  document.querySelectorAll('nav.main [data-t], #bnav [data-t], .bmasgrid [data-bm]').forEach(b => {
    const t = b.dataset.t || b.dataset.bm; if (!t || t === 'directorio' || /^pd-/.test(t)) return;
    const x = txTexto(b); if (!x) return;
    if (!b.dataset.txdef) b.dataset.txdef = x.get();
    const n = mn[t] || b.dataset.txdef;
    if (x.get() !== n) x.set(n);
  });
  // El título de la pantalla abierta
  const t = typeof TAB !== 'undefined' ? TAB : null, b = t && document.querySelector(`nav.main [data-t="${t}"]`);
  if (t && t !== 'directorio' && b && b.dataset.txdef) {
    const h = document.querySelector(`#v-${t} .saludo h1, #v-${t} .pagcab h1`) || (t === 'ventas' && document.querySelector('#v-ventas .saludo h1'));
    const tn = h && [...h.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim());
    const n = mn[t] || b.dataset.txdef;
    if (tn && (tn.nodeValue.trim() === b.dataset.txdef || Object.values(mn).includes(tn.nodeValue.trim())) && tn.nodeValue.trim() !== n) tn.nodeValue = tn.nodeValue.replace(tn.nodeValue.trim(), n);
  }
}
aplicarEtiqueta = (orig => function (...a) { const r = orig.apply(this, a); try { aplicarNombresMenu(); } catch (e) {} return r; })(aplicarEtiqueta);
ir = (orig => function (...a) { const r = orig.apply(this, a); setTimeout(() => { try { aplicarNombresMenu(); } catch (e) {} }, 0); Promise.resolve(r).then(() => { try { aplicarNombresMenu(); } catch (e) {} }); return r; })(ir);
// Cuando el menú se vuelve a montar (al arrancar, al cambiar de tamaño…), se vuelven a poner los nombres
if (typeof montarMenuLateral === 'function') montarMenuLateral = (orig => function (...a) { const r = orig.apply(this, a); try { aplicarNombresMenu(); } catch (e) {} return r; })(montarMenuLateral);
let TX_OBS = 0;
new MutationObserver(() => { if (!Object.keys(menuNombres()).length || TX_OBS) return; TX_OBS = requestAnimationFrame(() => { TX_OBS = 0; try { aplicarNombresMenu(); } catch (e) {} }); })
  .observe(document.body, { childList: true, subtree: true });

// ---------- la pantalla ----------
arbolCfgUnico = (orig => function (...a) {
  const g = orig.apply(this, a);
  if (!puedeOrganizacion()) return g;
  const emp = g.find(x => x[0] === 'Empresa');
  if (emp && !emp[1].some(x => x.k === 'o.textos')) {
    const i = emp[1].findIndex(x => x.k === 'o.marca');
    emp[1].splice(i + 1, 0, { k: 'o.textos', t: 'Textos personalizados', ic: 'file-text', d: 'Cómo se llama cada módulo en tu empresa', r: () => pintarTextos() });
  }
  return g;
})(arbolCfgUnico);
CFG_CLAVES['o.textos'] = 'textos nombres vocabulario menú menu estados resultados roles campos renombrar palabras';
let TX = null;   // {filas, filtro, q}
async function pintarTextos() {
  await cargarAjustes();
  const mn = menuNombres(), etqDef = TT('medico', 'p', '', 'l', 'C');
  const vistos = new Set();
  const filas = [...document.querySelectorAll('nav.main [data-t]')].filter(b => {
    const t = b.dataset.t; if (vistos.has(t) || MENU_FUERA.includes(t) || ['config', 'delcos', 'manual'].includes(t) || b.classList.contains('hide')) return false;
    vistos.add(t); return true;
  }).map(b => {
    const t = b.dataset.t, x = txTexto(b), def = t === 'directorio' ? etqDef : (b.dataset.txdef || (x && x.get()) || t);
    const val = t === 'directorio' ? (((AJUSTES.marca || {}).etiqueta || '') !== etqDef ? ((AJUSTES.marca || {}).etiqueta || '') : '') : (mn[t] || '');
    return { t, def, val };
  });
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel txmenu"><h2>Menús ${pmAyu('Menús', 'Cómo se llama cada módulo en el menú y en el título de su pantalla. Escribe el nombre que usa tu empresa; en blanco, se usa el de siempre.')}</h2>
    <div class="txmtab" role="table"><div class="txmf txmcab" role="row"><span></span><span role="columnheader">Módulo</span><span role="columnheader">Nombre en tu empresa</span></div>
    ${filas.map(f => `<div class="txmf" role="row"><span class="txmico" role="cell">${ICO_MOD[f.t] || '•'}</span><span role="cell" class="txmdef">${esc(f.def)}</span>
      <span role="cell"><input data-txm="${f.t}" value="${esc(f.val)}" placeholder="${esc(f.def)}" maxlength="30" aria-label="Nombre de ${esc(f.def)} en tu empresa"></span></div>`).join('')}</div>
    <div class="acts"><button type="button" class="btn" id="txmok">Guardar</button></div></div>`;
  $('txmok').onclick = () => conCarga($('txmok'), 'Guardando…', async () => {
    const nuevo = {}; let dir = null;
    $('cfgcuerpo').querySelectorAll('[data-txm]').forEach(i => { const v = i.value.trim(); if (i.dataset.txm === 'directorio') dir = v; else if (v) nuevo[i.dataset.txm] = v; });
    const { data, error } = await db.rpc('guardar_ajuste', { p_clave: 'menu_nombres', p_valor: nuevo });
    if (error || (data && data.ok === false)) { toast('No se han podido guardar los nombres', true); return; }
    AJUSTES.menu_nombres = nuevo;
    if (dir !== null && dir !== (((AJUSTES.marca || {}).etiqueta || '') === etqDef ? '' : (AJUSTES.marca || {}).etiqueta || '')) {
      const v = Object.assign({}, AJUSTES.marca || {}, { etiqueta: dir || etqDef });
      const r2 = await db.rpc('guardar_ajuste', { p_clave: 'marca', p_valor: v });
      if (!r2.error && !(r2.data && r2.data.ok === false)) { AJUSTES.marca = v; aplicarEtiqueta(); }
    }
    aplicarNombresMenu(); MENU_FIRMA = ''; try { montarMenuLateral(); pintarBnav(); } catch (e) {}
    toast('Nombres guardados');
  });
}
const TX_G = [['voc', 'Vocabulario', 'Las palabras que salen en todos los textos. En blanco, la de siempre.'],
  ['menu', 'Menú', 'El nombre de cada apartado del menú y de su pantalla. En blanco, el de siempre.'],
  ['est', 'Estados y resultados', 'Al cambiar un nombre, se cambia también en las fichas y en las visitas que ya lo tienen.'],
  ['rol', 'Roles', 'El nombre de cada rol. Sus usuarios y permisos siguen igual.'],
  ['campo', 'Campos de la ficha', 'El nombre de cada campo personalizado.']];
const txCambiada = f => f.g === 'voc' ? (f.s !== f.s0 || f.p !== f.p0) : (f.v || '') !== (f.v0 || '');
const txPersonal = f => f.g === 'voc' ? !!(f.s || f.p) : f.g === 'menu' ? !!f.v : false;
function txPintar() {
  const c = $('cfgcuerpo'); if (!c || !TX) return;
  const q = impNorm(TX.q || ''), F = TX.filtro;
  const ver = f => (!F || (F === 'cambios' ? (txPersonal(f) || txCambiada(f)) : f.g === F)) && (!q || impNorm([f.donde, f.siempre, f.v, f.s, f.p].join(' ')).includes(q));
  const nCamb = TX.filas.filter(f => txPersonal(f) || txCambiada(f)).length, pend = TX.filas.filter(txCambiada).length;
  const fila = (f, i) => {
    const marca = txCambiada(f) ? '<span class="txtag txpend">Sin guardar</span>' : txPersonal(f) ? '<span class="txtag">Cambiado</span>' : '';
    const vuelve = f.g === 'voc' ? (f.s || f.p) : f.v;
    return `<div class="txrow ${txPersonal(f) || txCambiada(f) ? 'cambio' : ''}" data-txi="${i}"><span class="donde">${esc(f.donde)}</span>
      <span class="siempre">${esc(f.siempre)}${marca}</span>
      ${f.g === 'voc' ? `<span class="dos"><input class="chico" data-txs value="${esc(f.s)}" placeholder="${esc(f.ds)}" aria-label="Singular"><input class="chico" data-txp value="${esc(f.p)}" placeholder="${esc(f.dp)}" aria-label="Plural"></span>`
        : `<input class="chico" data-txv value="${esc(f.v)}" placeholder="${esc(f.ahora ? 'Nuevo nombre' : f.siempre)}" aria-label="Nuevo nombre de ${esc(f.siempre)}">`}
      ${vuelve ? `<button type="button" class="rv" data-txrv="${i}" title="${f.ahora ? 'Dejarlo como está' : 'Volver al de siempre'}" aria-label="${f.ahora ? 'Dejarlo como está' : 'Volver al de siempre'}">${txSV(TX_IC.rv)}</button>` : '<span></span>'}</div>`;
  };
  c.innerHTML = `<div class="txp">
    <div class="txbar"><div class="txq">${txSV(TX_IC.lupa)}<input id="txq" placeholder="Busca un texto: estado, menú, rol…" value="${esc(TX.q || '')}" autocomplete="off"></div>
      <div class="txchips" role="group" aria-label="Filtrar">${[['', 'Todos'], ['cambios', 'Cambiados', nCamb]].concat(TX_G.filter(([g]) => TX.filas.some(f => f.g === g)).map(([g, t]) => [g, t]))
        .map(([k, t, n]) => `<button type="button" data-txf="${k}" class="${F === k ? 'on' : ''}" aria-pressed="${F === k}">${esc(t)}${n ? `<b>${n}</b>` : ''}</button>`).join('')}</div></div>
    ${TX_G.map(([g, t, s]) => { const fs = TX.filas.map((f, i) => [f, i]).filter(([f]) => f.g === g && ver(f)); if (!fs.length) return '';
      return `<section class="txg"><h3>${esc(t)}<span class="sm">${esc(s)}</span></h3>
        <div class="txhead"><span>Dónde sale</span><span>${g === 'voc' || g === 'menu' ? 'El de siempre' : 'Ahora se llama'}</span><span>${g === 'voc' || g === 'menu' ? 'Vuestro texto' : 'Nuevo nombre'}</span><span></span></div>
        ${fs.map(([f, i]) => fila(f, i)).join('')}</section>`; }).join('') || '<div class="vacio">Ningún texto coincide.</div>'}
    <div class="txpie"><span class="sm">${pend ? `${pend} ${pend === 1 ? 'cambio' : 'cambios'} sin guardar` : 'Todo guardado'}</span>
      <span class="acts" style="margin:0"><button type="button" class="btn sec" id="txdes" ${pend ? '' : 'disabled'}>Deshacer</button><button type="button" class="btn" id="txok" ${pend ? '' : 'disabled'}>Guardar</button></span></div></div>`;
  const q2 = $('txq'); let tq = null;
  q2.oninput = () => { TX.q = q2.value; clearTimeout(tq); tq = setTimeout(() => { const pos = q2.selectionStart; txPintar(); const n = $('txq'); n.focus(); n.setSelectionRange(pos, pos); }, 200); };
  c.querySelectorAll('[data-txf]').forEach(b => b.onclick = () => { TX.filtro = b.dataset.txf; txPintar(); });
  c.querySelectorAll('.txrow').forEach(r => {
    const f = TX.filas[+r.dataset.txi];
    const upd = () => { const ant = txCambiada(f); r.classList.toggle('cambio', txPersonal(f) || txCambiada(f)); if (ant !== txCambiada(f) || true) txPie(); };
    r.querySelectorAll('[data-txv]').forEach(i => i.oninput = () => { f.v = i.value; upd(); });
    r.querySelectorAll('[data-txs]').forEach(i => i.oninput = () => { f.s = i.value; upd(); });
    r.querySelectorAll('[data-txp]').forEach(i => i.oninput = () => { f.p = i.value; upd(); });
  });
  c.querySelectorAll('[data-txrv]').forEach(b => b.onclick = () => { const f = TX.filas[+b.dataset.txrv]; if (f.g === 'voc') { f.s = ''; f.p = ''; } else f.v = ''; txPintar(); });
  $('txdes').onclick = () => { TX.filas.forEach(f => { if (f.g === 'voc') { f.s = f.s0; f.p = f.p0; } else f.v = f.v0; }); txPintar(); };
  $('txok').onclick = txGuardar;
}
function txPie() {
  const pend = TX.filas.filter(txCambiada).length, p = document.querySelector('.txpie .sm');
  if (p) p.textContent = pend ? `${pend} ${pend === 1 ? 'cambio' : 'cambios'} sin guardar` : 'Todo guardado';
  if ($('txok')) $('txok').disabled = !pend; if ($('txdes')) $('txdes').disabled = !pend;
}
async function txGuardar() {
  const camb = TX.filas.filter(txCambiada); if (!camb.length) return;
  const b = $('txok'); b.disabled = true;
  const err = [];
  let recargar = false;
  // Vocabulario
  if (camb.some(f => f.g === 'voc')) {
    const voc = {};
    TX.filas.filter(f => f.g === 'voc').forEach(f => { const o = {}; if (f.s.trim()) o.s = f.s.trim(); if (f.p.trim()) o.p = f.p.trim(); const g0 = ((TERMINOS || {})[f.k] || {}).g; if (g0 && Object.keys(o).length) o.g = g0; if (Object.keys(o).length) voc[f.k] = o; });
    const { data, error } = await db.rpc('guardar_ajuste', { p_clave: 'terminos', p_valor: voc });
    if (error || (data && data.ok === false)) err.push('el vocabulario'); else { try { localStorage.setItem(TERMKEY, JSON.stringify(voc)); } catch (e) {} recargar = true; }
  }
  // Menú (el de las fichas es la etiqueta de la marca)
  if (camb.some(f => f.g === 'menu')) {
    const mn = {}; TX.filas.filter(f => f.g === 'menu' && f.t !== 'directorio' && f.v.trim()).forEach(f => { mn[f.t] = f.v.trim(); });
    const { data, error } = await db.rpc('guardar_ajuste', { p_clave: 'menu_nombres', p_valor: mn });
    if (error || (data && data.ok === false)) err.push('los nombres del menú'); else { AJUSTES.menu_nombres = mn; recargar = true; }
    const dir = TX.filas.find(f => f.g === 'menu' && f.t === 'directorio');
    if (dir && txCambiada(dir)) {
      const v = Object.assign({}, AJUSTES.marca || {}, { etiqueta: dir.v.trim() || TT('medico', 'p', '', 'l', 'C') });
      const r2 = await db.rpc('guardar_ajuste', { p_clave: 'marca', p_valor: v });
      if (r2.error || (r2.data && r2.data.ok === false)) err.push(`el nombre de ${TT('medico', 'p', '', 'l', 'l')}`); else { AJUSTES.marca = v; aplicarEtiqueta(); }
    }
  }
  // Estados, resultados, roles y campos: uno a uno, en la base (también en las fichas y visitas que los tienen)
  for (const f of camb.filter(x => ['est', 'rol', 'campo'].includes(x.g) && x.v.trim())) {
    const p = f.g === 'rol' ? { tipo: 'rol', antes: f.antes, nuevo: f.v.trim() } : { tipo: f.g === 'campo' ? 'campo' : 'valor', id: f.id, nuevo: f.v.trim() };
    const { data, error } = await db.rpc('renombrar_texto', { p });
    if (error || !data || !data.ok) err.push(`«${f.siempre}»${data && data.error === 'existe' ? ' (ya hay otro con ese nombre)' : ''}`);
    else recargar = true;
  }
  invalidarCache();
  if (err.length) { toast('No se ha podido cambiar ' + err.join(', '), true); b.disabled = false; return; }
  toast('Textos guardados: se recarga la plataforma');
  setTimeout(() => location.reload(), 900);
}


