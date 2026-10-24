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
estimarDiaBase = (orig => function (citas, fecha) {
  const r = orig.call(this, citas, fecha);
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
})(estimarDiaBase);
const DIA_NOMBRE = f => new Date(String(f).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' });
function explicarAviso(inf) {
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
estimarDiaBase = (orig => function (citas, fecha) {
  const r = orig.call(this, citas, fecha);
  Object.values(TD_INFO).forEach(i => { if (i.aviso && /^Llegarías hacia/.test(i.aviso) && !/súbela/.test(i.aviso)) { i.orden = true; i.aviso += ': súbela en la lista u ordena por cercanía'; } });
  return r;
})(estimarDiaBase);
explicarAviso = (orig => function (inf) {
  if (inf.orden && !inf.lejos) return 'La cita tiene hora fija, pero está colocada después de otras sin hora: siguiendo el orden de la lista no llegarías a tiempo. Súbela con las flechas hasta su sitio o pulsa «Ordenar por cercanía», que respeta las horas fijas. Es solo un aviso: la cita se guarda igual.';
  return orig.call(this, inf);
})(explicarAviso);
// «⋯»: pulsar el mismo botón con su menú abierto lo cierra (antes lo volvía a abrir)
let TDM_BOTON = null;
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

estimarDiaBase = (orig => function (citas, fecha) {
  const otro = {};
  const cs = (citas || []).map(c => { const o = centroConConsulta(c, fecha); if (!o) return c; otro[c.id] = o; return Object.assign({}, c, { dias: o.dias }); });
  const r = orig.call(this, cs, fecha);
  Object.keys(otro).forEach(id => { if (TD_INFO[id]) TD_INFO[id].otroCentro = otro[id].lugar; });
  return r;
})(estimarDiaBase);
explicarAviso = (orig => function (inf) {
  const t = orig.call(this, inf);
  return inf.otroCentro ? t.replace('Según su ficha,', `Ese día atiende en ${inf.otroCentro} (no en el centro de la cita). Según su ficha,`) : t;
})(explicarAviso);

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

// ---- 4. Detalle de la cita al pulsarla en «Tu día»
function verCita(c) {
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

// ---- 2. El mes de la Agenda, en cualquier mes y año
let AG_MES = null;
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

/* v2.177.0 · Ficha de centro (decisión de Eric, 5/10/2026): los centros dados de alta salen en el buscador (SQL 111, buscar_global con id) y al
   pulsarlos se abre su ficha: dirección, teléfono, cómo llegar, horario y la lista de profesionales que atienden allí (ficha_centro), con
   «+ Añadir» (centro_anadir_profesional: enlaza o crea su consulta en el centro), y en cada uno Ficha, «+ Cita» en ese centro y «Quitar»
   (centro_quitar_profesional: quita esa consulta de su ficha). «Editar centro» corrige sus datos y su horario (guardar_centro). */
const HOR_TXT = h => DIAS_SEM.filter(([d]) => h && h[d]).map(([d, n]) => `${n} ${h[d]}`).join(' · ');
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

// ---- 1. La franja de la semana, en cualquier semana
let AG_SEMANA = null;

// ---- 2 y 3. Cabecera del día: moverse de día y apuntar tareas
// Se guardan las del día en memoria: mover una cita repinta el día sin volver a pedirlas (solo se piden al cambiar de día, recargar o editarlas)
let TAREAS_DIA = null;
function editarTarea(t, fecha) {
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

// ---- 4. Borrar y descartar en el detalle de la cita
verCita = (orig => function (c) {
  const r = orig.call(this, c);
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
})(verCita);

/* v2.179.0 · Resultados de visita según el estado de la ficha (decisión de Eric, SQL 113): al registrar una visita solo salen los resultados
   que tocan en el estado de esa ficha (clasificadores_actividad con p_cuenta marca «oculto» los demás); «Ver todos» los enseña igualmente.
   En Configuración, cada resultado lleva «En todos los estados» / «Solo en: …» para elegir en qué estados aparece (guardar_valor, en_estados). */
abrirVisitaBase = (orig => async function (id, ...r) {
  if ($('dbody')) $('dbody').classList.remove('vertodos');
  const res = await orig.call(this, id, ...r);
  try {
    const caja = $('dbody'); if (!caja) return res;
    const ocultos = caja.querySelectorAll('.optw[data-oculto]');
    if (ocultos.length && !$('vtodos')) {
      const ult = [...caja.querySelectorAll('.opciones')].filter(o => o.querySelector('[data-res]')).pop();
      if (ult) ult.insertAdjacentHTML('afterend', `<button type="button" class="lnk" id="vtodos">Ver ${ocultos.length === 1 ? 'el resultado' : `los ${ocultos.length} resultados`} de otros estados</button>`);
      $('vtodos').onclick = () => { caja.classList.add('vertodos'); $('vtodos').remove(); };
    }
  } catch (e) {}
  return res;
})(abrirVisitaBase);

(() => {
  const caja = $('dbody'); if (!caja || !window.MutationObserver) return;
  new MutationObserver(() => { if (caja.querySelector('[data-vdest]:not([data-vend])')) { caja.querySelectorAll('[data-vdest]').forEach(s => s.dataset.vend = '1'); decorarResultados(); } })
    .observe(caja, { childList: true, subtree: true });
})();

/* v2.180.0 · Direcciones bien situadas (aviso de Eric: el Dr. Margalet, en Barcelona, salía en Marbella).
   - geocodificar(q, o): busca solo en España y, si se le da el municipio (o.municipio), solo vale un resultado de ese municipio; si el texto libre no
     lo encuentra, prueba con calle, municipio y código postal por separado. Si solo aparece en otro sitio, devuelve ese resultado con `fuera` (el
     municipio donde sale) y quien llama no guarda el punto.
   - «Calidad del dato»: «Direcciones que no cuadran» (SQL 114, ubicaciones_dudosas): consultas a más de 50 km del resto de su municipio, con
     «Volver a situar» (busca de nuevo con el municipio y guarda el punto si cuadra) y «Ficha». */
const normGeo = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
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

cargarSeguimientoPaso1 = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  try { await pintarDireccionesDudosas(); } catch (e) {}
  return r;
})(cargarSeguimientoPaso1);

