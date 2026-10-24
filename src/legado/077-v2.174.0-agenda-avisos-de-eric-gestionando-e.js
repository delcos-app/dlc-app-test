/* v2.174.0 · Agenda (avisos de Eric, gestionando el lunes desde el domingo):
   - «Añadir a mi agenda» de la ficha propone el día que se está viendo en la Agenda (antes, siempre hoy) y la cita aparece al momento (antes solo
     se refrescaba Inicio y había que pulsar F5).
   - El aviso naranja de «Tu día» explica por qué sale: el horario de atención de la ficha, la hora a la que llegarías y cómo quitarlo (al pasar el
     ratón y con la «i»). Si una parada queda a más de 4 h de la anterior, el aviso dice que revises su ubicación (una dirección mal situada lo
     descuadra todo), y un fin estimado pasada la medianoche ya no sale como «06:27». */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-agendar]');
  if (!b) return;
  e.stopImmediatePropagation(); e.preventDefault();
  const dia = TAB === 'agenda' && AG_FECHA && AG_FECHA >= hoyISO() ? AG_FECHA : hoyISO();
  const f = await pedirFecha('¿Qué día quieres visitarle?', dia, { titulo: 'Añadir a mi agenda', ok: 'Añadir' });
  if (!f) return;
  const r = await escribir('guardar_cita', { p: {
    cuenta_id: b.dataset.agendar, fecha: f, estado: 'Planificada', origen: 'Ficha',
    op_id: 'c-' + b.dataset.agendar + '-' + f
  }});
  if (r.error) { toast('No se ha podido: ' + r.error.message, true); return; }
  toast('Añadido a tu agenda el ' + fechaDiaMes(f));
  if (TAB === 'agenda') agRefrescoQuieto(); else cargarInicio();
}, true);

let EST_ULT = null;
function estimarDiaBaseBase2(citas, fecha) {
  const r = estimarDiaBaseBase.call(this, citas, fecha);
  try {
    const sal = salidaUsuario();
    let pos = sal && sal.lat != null ? [+sal.lat, +sal.lon] : null;
    (citas || []).forEach(c => {
      const xy = xyCita(c), inf = TD_INFO[c.id];
      if (inf) { inf.llegada = r.est[c.id]; inf.fecha = fecha; }
      if (xy && pos && inf && CITA_ABIERTA.includes(c.estado) && minutosEntre(pos, xy) > 240)
        inf.lejos = Math.round(km(pos, xy));
      if (xy) pos = xy;
    });
  } catch (e) {}
  EST_ULT = r;
  return r;
}
function explicarAvisoBase(inf) {
  const quien = TT('medico', 's', 'el', 'l', 'l');
  if (inf.lejos) return `Esta parada queda a unos ${num(inf.lejos)} km de la anterior (o de tu punto de salida), así que la hora estimada se va muy tarde. Suele ser una dirección mal situada: revisa la ubicación en su ficha o tu punto de salida en Mi perfil.`;
  const v = inf.ventanas && inf.ventanas.length ? txtVentanas(inf.ventanas) : '';
  const dia = inf.fecha ? DIA_NOMBRE(inf.fecha) : 'ese día';
  if (inf.ventanas && !inf.ventanas.length) return `Según su ficha, ${quien} no atiende los ${dia}. Si sí atiende, añade ese día en «Horario de atención» de su ficha.`;
  return `Según su ficha, ${quien} atiende los ${dia} de ${v}${inf.llegada != null ? `, y siguiendo el orden de tu día llegarías hacia las ${hm(inf.llegada)}` : ''}. Para quitar el aviso: pon una hora a la cita, cámbiala de orden o corrige el horario en su ficha. Es solo un aviso: la cita se guarda igual.`;
}

/* v2.175.0 · Con pago anual, la tarjeta de la cuota enseña lo que se cobra (repaso de Web delcos): «2950 € · Al año, sin IVA · 3569,50 € con IVA»,
   igual que el aviso del recibo (antes, el equivalente mensual). */
pintarProximoRecibo = (orig => function (...a) {
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {};
  if (c && pl.pago === 'anual' && pl.plan !== 'medida') c.querySelectorAll('#planact .kpi').forEach(k => {
    const sp = k.querySelector(':scope > span'), b = k.querySelector(':scope > b');
    if (!sp || !b || sp.textContent.trim() !== 'Al mes, sin IVA') return;
    const p = planDe(pl.plan), base = Math.max(+pl.usuarios || 0, p.minimo || 3) * p.precio * 10;
    b.textContent = eurW(base); sp.textContent = 'Al año, sin IVA';
    const iv = k.querySelector('.kpiiva'); if (iv) iv.remove();
    k.insertAdjacentHTML('beforeend', `<span class="sm kpiiva">${eurW(base + ivaDe(base))} con IVA</span>`);
  });
  return orig.apply(this, a);
})(pintarProximoRecibo);

/* v2.175.0 · Avisos de «Tu día» que ayudan (aviso de Eric: «Llegarías hacia las 06:26 y la cita es a las 10:30» preparando el lunes). Si con el orden
   actual el día no cabe en la jornada (acaba después de la hora de vuelta o, sin ella, de las 21:00), un solo aviso arriba dice qué hacer («Ordenar
   por cercanía» o pasar citas a otro día) y se quitan los avisos sueltos de hora y horario, que en ese caso no dicen nada útil; las horas estimadas
   que caen fuera de la jornada salen como «—». Los de ubicación lejana se quedan. Y en el móvil, volver a pulsar «⋯» cierra su menú. */
// Cita con hora fija que el orden deja tarde: el aviso dice qué hacer, y la «i» habla del orden (no del horario de atención)
function estimarDiaBaseBase3(citas, fecha) {
  const r = estimarDiaBaseBase2.call(this, citas, fecha);
  Object.values(TD_INFO).forEach(i => { if (i.aviso && /^Llegarías hacia/.test(i.aviso) && !/súbela/.test(i.aviso)) { i.orden = true; i.aviso += ': súbela en la lista u ordena por cercanía'; } });
  return r;
}
function explicarAvisoBase2(inf) {
  if (inf.orden && !inf.lejos) return 'La cita tiene hora fija, pero está colocada después de otras sin hora: siguiendo el orden de la lista no llegarías a tiempo. Súbela con las flechas hasta su sitio o pulsa «Ordenar por cercanía», que respeta las horas fijas. Es solo un aviso: la cita se guarda igual.';
  return explicarAvisoBase.call(this, inf);
}
document.addEventListener('click', e => {
  const b = e.target.closest('button'), m = document.querySelector('.tdmenu');
  if (b && m && m.__de === b) { m.remove(); e.stopImmediatePropagation(); e.preventDefault(); return; }
  TDM_BOTON = b;
}, true);
new MutationObserver(ms => ms.forEach(x => x.addedNodes.forEach(n => { if (n.classList && n.classList.contains('tdmenu')) n.__de = TDM_BOTON; })))
  .observe(document.body, { childList: true });
// Hora y fecha en el móvil (aviso de Eric: «se abre el propio y el nativo»): en pantallas táctiles el toque lo recoge el envoltorio (.selw), que abre el
// selector de delcos, y el campo no toma el foco (iOS abría su rueda al enfocarlo, también al abrirse una ventana con el campo dentro)
document.addEventListener('focusin', e => {
  if (e.target && e.target.matches && e.target.matches('.selw input') && window.matchMedia && matchMedia('(pointer: coarse)').matches) e.target.blur();
}, true);

/* v2.176.0 · Agenda y móvil (lista de Eric del 5/10/2026):
   1. Deslizar hacia abajo arriba del todo recarga la pantalla (en pantallas táctiles), con el cargador de delcos.
   2. El mes de la Agenda se puede mover a otros meses y años (‹ ›, «Hoy» y el título abre meses y años).
   3. Una sola ventana de cita (también desde «Añadir a mi agenda» de la ficha): profesional, día, hora, centro (si tiene varios) y notas.
   4. Al pulsar una cita de «Tu día» se abre su detalle (cuándo, dónde, horario, estado y notas que se pueden cambiar) con las acciones.
   5. El horario de atención mira todos sus centros (SQL 110, otros_dias): si el de la cita no atiende ese día pero otro sí, se usa ese.
   6. En el móvil, en «Esta semana», toda la celda del día abre ese día (antes cada nombre llevaba a su ficha).
   7. En el móvil, «Mover a otro día» y las demás fechas ya no abren el calendario del teléfono antes que el de delcos. */

function estimarDiaBase(citas, fecha) {
  const otro = {};
  const cs = (citas || []).map(c => { const o = centroConConsulta(c, fecha); if (!o) return c; otro[c.id] = o; return Object.assign({}, c, { dias: o.dias }); });
  const r = estimarDiaBaseBase3.call(this, cs, fecha);
  Object.keys(otro).forEach(id => { if (TD_INFO[id]) TD_INFO[id].otroCentro = otro[id].lugar; });
  return r;
}
function explicarAviso(inf) {
  const t = explicarAvisoBase2.call(this, inf);
  return inf.otroCentro ? t.replace('Según su ficha,', `Ese día atiende en ${inf.otroCentro} (no en el centro de la cita). Según su ficha,`) : t;
}

// ---- 3. Una sola ventana de cita, con centro y notas
nuevaCita = async function (medicoId, fecha, op = {}) {
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
};
// «Añadir a mi agenda» de la ficha abre la misma ventana (antes solo pedía el día). Va en la fase de captura de window, antes que la de la v2.174.0.
window.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-agendar]');
  if (!b) return;
  e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault();
  nuevaCita(b.dataset.agendar, null, { origen: 'Ficha' });
}, true);


document.addEventListener('pointerdown', e => { if (!e.target.closest('.agmpop, #agmtit')) document.querySelectorAll('.agmpop').forEach(x => x.remove()); }, true);

// ---- 6. «Esta semana»: toda la celda abre el día (en el móvil, también al tocar un nombre)

// ---- 7. Fechas y horas en el móvil: el campo se prepara antes de abrir la ventana (así el teléfono no abre su calendario)
(() => {
  const d = $('mini'); if (!d || !d.showModal) return;
  const orig = d.showModal.bind(d);
  d.showModal = function () { try { mejorarCampos(d); } catch (e) {} return orig(); };
})();
document.addEventListener('focusin', e => {
  const i = e.target;
  if (!i || !i.matches || !i.matches('input[type=date], input[type=time]') || i.closest('.selpop')) return;
  if (!(window.matchMedia && matchMedia('(pointer: coarse)').matches)) return;
  if (!i.closest('.selw')) { try { mejorarCampos(i.parentNode); } catch (err) {} }
  i.blur();
}, true);

// ---- 1. Deslizar para recargar (pantallas táctiles)
(() => {
  if (!('ontouchstart' in window)) return;
  let y0 = null, d = 0, cargando = false;
  const ind = () => { let x = $('ptr'); if (!x) { document.body.insertAdjacentHTML('beforeend', '<div id="ptr" aria-hidden="true"><span class="ptrc"></span></div>'); x = $('ptr'); } return x; };
  const bloqueado = t => {
    if (window.scrollY > 0 || document.querySelector('dialog[open]') || document.body.classList.contains('sin-sesion') || cargando) return true;
    if (t.closest('.leaflet-container, .tdmenu, .agpop, .agmpop, .selpop, #mlpanel')) return true;
    for (let n = t; n && n !== document.body; n = n.parentElement) if (n.scrollTop > 0) return true;
    return false;
  };
  const mostrar = v => { const x = ind(); x.style.transform = `translate(-50%, ${Math.min(v, 90) - 50}px)`; x.style.opacity = Math.min(1, v / 70); x.classList.toggle('listo', v > 80); };
  const quitar = () => { const x = $('ptr'); if (x) { x.style.transform = 'translate(-50%, -60px)'; x.style.opacity = 0; x.classList.remove('listo', 'gira'); } };
  addEventListener('touchstart', e => { y0 = e.touches.length === 1 && !bloqueado(e.target) ? e.touches[0].clientY : null; d = 0; }, { passive: true });
  addEventListener('touchmove', e => { if (y0 == null) return; d = e.touches[0].clientY - y0; if (d <= 0 || window.scrollY > 0) { quitar(); return; } mostrar(d * 0.6); }, { passive: true });
  addEventListener('touchend', async () => {
    if (y0 == null) return; y0 = null;
    if (d * 0.6 <= 80) { quitar(); return; }
    cargando = true; const x = ind(); x.classList.add('gira'); mostrar(80);
    const t0 = Date.now();
    try { if (TAB === 'agenda') await cargarAgenda(); else await ir(TAB); } catch (e) {}
    await new Promise(r => setTimeout(r, Math.max(0, 600 - (Date.now() - t0))));
    cargando = false; quitar();
  });
})();

// Buscador de arriba: un centro dado de alta abre su ficha
window.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-gcid]');
  if (!b) return;
  e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault();
  $('gsug').classList.add('hide'); if ($('q')) $('q').value = '';
  fichaCentro(b.dataset.gcid);
}, true);

/* v2.178.0 · Agenda ágil (lista de Eric del 5/10/2026):
   1. «Esta semana» se mueve a otras semanas con ‹ › y, en el móvil, deslizando el dedo (con animación). Al ir a un día de otra semana, la franja
      pasa a esa semana.
   2. En la cabecera del día: ‹ día anterior, elegir fecha (el calendario de delcos) y día siguiente ›, sin entrar en «Planificar la semana».
   3. Tareas propias (SQL 112, tabla tareas): «+ Tarea» apunta en el día una tarea o nota con hora, sin cliente; se marcan como hechas, se editan
      y se borran. Solo las ve quien las apunta.
   4. Borrar y descartar (decisión de Eric: las dos): en el detalle de la cita, «Descartar» (no se hará; queda en el historial) y «Borrar»
      (fue un error: desaparece; solo de hoy en adelante y si no se ha hecho). */





(() => {
  const caja = $('dbody'); if (!caja || !window.MutationObserver) return;
  new MutationObserver(() => { if (caja.querySelector('[data-vdest]:not([data-vend])')) { caja.querySelectorAll('[data-vdest]').forEach(s => s.dataset.vend = '1'); decorarResultados(); } })
    .observe(caja, { childList: true, subtree: true });
})();

geocodificar = async function (q, o = {}) {
  const base = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=es&';
  const pide = async qs => { try { const r = await fetch(base + qs); return r.ok ? await r.json() : []; } catch (e) { return []; } };
  const muni = normGeo(o.municipio);
  const lugar = x => { const a = (x && x.address) || {}; return a.city || a.town || a.village || a.municipality || a.suburb || a.county || ''; };
  const cuadra = x => {
    if (!muni) return true;
    const a = (x && x.address) || {};
    return [a.city, a.town, a.village, a.municipality, a.city_district, a.county].some(c => { const n = normGeo(c); return n && (n === muni || n.includes(muni) || muni.includes(n)); });
  };
  let l = await pide('q=' + encodeURIComponent(q));
  let r = l.find(cuadra);
  if (!r && muni && o.direccion) {
    const l2 = await pide(`street=${encodeURIComponent(o.direccion)}&city=${encodeURIComponent(o.municipio)}${o.cp ? '&postalcode=' + encodeURIComponent(o.cp) : ''}`);
    r = l2.find(cuadra); if (!l.length) l = l2;
  }
  if (r) return r;
  if (muni && l.length) return Object.assign({}, l[0], { fuera: lugar(l[0]) || 'otro sitio' });
  return l[0] || null;
};


