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

// ---- 5. Horario de atención en todos sus centros
function centroConConsulta(c, fecha) {
  const v = ventanasDe(c.dias, fecha);
  if (!v || v.length) return null;   // sin horario en ese centro (no se sabe) o con consulta ese día: nada que cambiar
  return (c.otros_dias || []).find(o => o && o.lugar !== c.centro_nombre && (w => w && w.length)(ventanasDe(o.dias, fecha))) || null;
}
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
async function fichaCentro(id) {
  const dlg = $('dlg');
  dlg.classList.remove('pequena');
  $('dbody').innerHTML = `<div class="fh"><div><h2>Centro</h2></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="skel" style="width:60%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>`;
  if (!dlg.open) dlg.showModal();
  // v2.310.0: con la ficha se pide su cuenta de tipo Centro (un solo centro), para abrirla desde aquí
  const [{ data, error }, { data: cta }] = await Promise.all([db.rpc('ficha_centro', { p_id: id }), db.from('cuentas').select('id').eq('centro_id', id).maybeSingle().then(r => r, () => ({ data: null }))]);
  if (!dlg.open) return;
  if (error || !data || !data.datos) {
    $('dbody').innerHTML = `<div class="fh"><div><h2>Centro</h2></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="banda-peligro">No se ha podido abrir el centro${error ? ': ' + esc(error.message) : ''}.</div>`;
    return;
  }
  const c = data.datos, l = data.profesionales || [];
  const dir = [c.direccion, [c.cp, c.municipio].filter(Boolean).join(' '), c.provincia].filter(Boolean).join(', ');
  const hor = HOR_TXT(c.horario);
  const quien = TT('medico', 'p', '', 'l', 'C');
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${esc(c.nombre)}</h2><div class="sm">${esc(dir || 'Sin dirección')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="fcacts">
      ${c.telefono ? `<a class="btn sec" href="tel:${esc(c.telefono)}">Llamar · ${esc(c.telefono)}</a>` : ''}
      ${c.lat != null ? '<button type="button" class="btn sec" id="fcllegar">Cómo llegar</button>' : ''}
      ${data.puede_editar ? '<button type="button" class="btn sec" id="fceditar">Editar centro</button>' : ''}
      ${cta && cta.id ? `<button type="button" class="btn sec" id="fccuenta" data-fccta="${cta.id}">Ficha comercial</button>` : ''}
    </div>
    ${hor ? `<div class="vcdatos"><div class="vcfila"><span>Horario</span><b>${esc(hor)}</b></div></div>` : ''}
    <div class="fcprocab"><h3>${esc(quien)} · ${num(l.length)}</h3>${data.puede_fichas ? '<button type="button" class="btn" id="fcanadir">+ Añadir</button>' : ''}</div>
    <div id="fcsel"></div>
    ${l.length ? `<div class="lista fclista">${l.map(m => {
      const donde = [m.planta ? 'Planta ' + m.planta : '', m.sala ? 'Sala ' + m.sala : ''].filter(Boolean).join(' · ');
      const dias = HOR_TXT(m.dias);
      return `<div class="item fcpro">
        <span class="tx"><b>${m.urgente ? '❗ ' : ''}${esc(m.nombre)}</b>
          <span class="sm">${esc([m.especialidad, donde].filter(Boolean).join(' · ') || '—')}</span>
          ${dias ? `<span class="sm">Atiende: ${esc(dias)}</span>` : ''}</span>
        <span class="acts" style="margin:0">
          <button type="button" class="btn sec" data-fcf="${m.id}">Ficha</button>
          <button type="button" class="btn sec" data-fcc="${m.id}">+ Cita</button>
          ${data.puede_fichas ? `<button type="button" class="btn sec fcquitar" data-fcq="${m.id}" aria-label="Quitar a ${esc(m.nombre)} del centro">Quitar</button>` : ''}
        </span></div>`; }).join('')}</div>`
      : `<div class="vacio">Todavía no hay ${esc(quien.toLowerCase())} en este centro.${data.puede_fichas ? ' Añádelos con «+ Añadir».' : ''}</div>`}`;
  if ($('fcllegar')) $('fcllegar').onclick = () => navegarA([+c.lat, +c.lon]);
  if ($('fceditar')) $('fceditar').onclick = () => editarCentroFicha(c);
  if ($('fcanadir')) $('fcanadir').onclick = () => {
    $('fcanadir').disabled = true;
    selectorMedico($('fcsel'), { alElegir: async m => {
      if (!m) return;
      const { data: r, error: e } = await db.rpc('centro_anadir_profesional', { p_centro: c.id, p_cuenta: m.id });
      if (e || !r || !r.ok) { toast(r && r.error === 'permiso' ? `No puedes cambiar la ficha de ${m.nombre}` : 'No se ha podido añadir', true); fichaCentro(c.id); return; }
      toast(r.ya ? `${m.nombre} ya estaba en el centro: queda enlazado` : `${m.nombre} añadido a ${c.nombre}`);
      fichaCentro(c.id);
    } });
    const i = $('fcsel').querySelector('input'); if (i) i.focus();
  };
  $('dbody').querySelectorAll('[data-fcf]').forEach(b => b.onclick = () => { dlg.close(); FICHA_CENTRO = c.nombre; abrirFicha(b.dataset.fcf); });
  $('dbody').querySelectorAll('[data-fcc]').forEach(b => b.onclick = () => { FICHA_CENTRO = c.nombre; nuevaCita(b.dataset.fcc); });
  $('dbody').querySelectorAll('[data-fcq]').forEach(b => b.onclick = async () => {
    const m = l.find(x => x.id === b.dataset.fcq); if (!m) return;
    const unica = +m.consultas <= 1;
    if (!await preguntar(`Se quita a ${m.nombre} de ${c.nombre}: ${TT('consulta', 's', 'este', 'l', 'l')} desaparece de su ficha.${unica ? ` Era su única ${TT('consulta', 's', '', 'l', 'l')}: su ficha se queda sin centro.` : ''}`,
      { titulo: '¿Quitar del centro?', ok: 'Quitar', peligro: true })) return;
    const { data: r, error: e } = await db.rpc('centro_quitar_profesional', { p_centro: c.id, p_cuenta: m.id });
    if (e || !r || !r.ok) { toast(r && r.error === 'permiso' ? `No puedes cambiar la ficha de ${m.nombre}` : 'No se ha podido quitar', true); return; }
    toast(`${m.nombre} ya no está en ${c.nombre}`);
    fichaCentro(c.id);
  });
}
function editarCentroFicha(c) {
  const h = c.horario || {};
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Editar centro</h2><div class="sm">Los cambios se pasan a ${TT('consulta', 'p', 'el', 'l', 'l')} enlazadas a este centro</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2"><div><label for="ecn">Nombre del centro</label><input id="ecn" value="${esc(c.nombre || '')}"></div>
      <div><label for="ect">Teléfono</label><input id="ect" value="${esc(c.telefono || '')}" inputmode="tel"></div></div>
    <div class="g2"><div><label for="ecd">Dirección</label><input id="ecd" value="${esc(c.direccion || '')}"></div>
      <div><label for="ecc">Código postal</label><input id="ecc" value="${esc(c.cp || '')}" inputmode="numeric"></div></div>
    <div class="g2"><div><label for="ecm">Población</label><input id="ecm" value="${esc(c.municipio || '')}"></div>
      <div><label for="ecp">Provincia</label><input id="ecp" value="${esc(c.provincia || '')}"></div></div>
    <label>Horario de apertura</label>
    <div class="cphor">${DIAS_SEM.map(([d, n]) => `<div><span>${n}</span><input data-ech="${d}" value="${esc(h[d] || '')}" placeholder="${d === 'D' ? 'Cerrado' : '8:00-20:00'}"></div>`).join('')}</div>
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="ecvolver">Volver</button><button type="button" class="btn" id="ecok">Guardar cambios</button></div>`;
  $('ecvolver').onclick = () => fichaCentro(c.id);
  $('ecok').onclick = async ev => {
    const v = k => $(k).value.trim();
    if (!v('ecn')) { toast('Escribe el nombre del centro', true); return; }
    const horario = {}; $('dbody').querySelectorAll('[data-ech]').forEach(x => { if (x.value.trim()) horario[x.dataset.ech] = x.value.trim(); });
    const cambioDir = v('ecd') !== (c.direccion || '') || v('ecm') !== (c.municipio || '') || v('ecc') !== (c.cp || '');
    ev.target.disabled = true;
    let lat = c.lat, lon = c.lon;
    if (cambioDir && (v('ecd') || v('ecm'))) {
      const g = await geocodificar([v('ecd'), v('ecc'), v('ecm'), v('ecp'), 'España'].filter(Boolean).join(', '), { direccion: v('ecd'), municipio: v('ecm'), cp: v('ecc') }).catch(() => null);
      if (g && !g.fuera) { lat = +g.lat; lon = +g.lon; } else if (g && g.fuera) toast(`La dirección sale en ${g.fuera}, no en ${v('ecm')}: se guarda sin mover el punto del mapa`, true);
    }
    const { data: r, error } = await RPC_ORIG('guardar_centro', { p: { id: c.id, nombre: v('ecn'), telefono: v('ect'), direccion: v('ecd'), cp: v('ecc'),
      municipio: v('ecm'), provincia: v('ecp'), lat, lon, horario } });
    ev.target.disabled = false;
    if (error || !r || !r.ok) { toast((r && r.error) || 'No se ha podido guardar', true); return; }
    toast('Centro guardado'); fichaCentro(c.id);
  };
}
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
async function tareasDelDia(f) {
  if (AG_VISTA && AG_VISTA.id !== PERFIL.id) return null;   // las tareas son de cada uno: en la agenda de otra persona no se ven
  if (TAREAS_DIA && TAREAS_DIA.f === f) return TAREAS_DIA.l;
  const { data, error } = await db.from('tareas').select('*').eq('fecha', f).order('orden', { ascending: true, nullsFirst: false }).order('hora', { ascending: true, nullsFirst: false }).order('creado_en');
  if (error) return null;
  TAREAS_DIA = { f, l: data || [] };
  return TAREAS_DIA.l;
}
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

// Configuración → el catálogo de resultados: en qué estados aparece cada uno
function enEstadosTxt(l) { return l && l.length ? 'Solo en: ' + l.join(', ') : 'En todos los estados'; }
function decorarResultados() {
  const caja = $('dbody'); if (!caja) return;
  caja.querySelectorAll('[data-vdest]').forEach(sel => {
    const item = sel.closest('.item'); if (!item || item.querySelector('[data-ven]')) return;
    const vid = sel.dataset.vdest;
    const v = (CATS || []).flatMap(c => c.valores || []).find(x => x.id === vid); if (!v) return;
    sel.insertAdjacentHTML('afterend', `<button type="button" class="btn sec" data-ven="${vid}" title="En qué estados de la ficha aparece este resultado">${esc(enEstadosTxt(v.en_estados))}</button>`);
    item.querySelector('[data-ven]').onclick = () => {
      const abierta = item.nextElementSibling && item.nextElementSibling.classList.contains('venbox');
      caja.querySelectorAll('.venbox').forEach(x => x.remove());
      if (abierta) return;
      const marcados = new Set(v.en_estados || []);
      item.insertAdjacentHTML('afterend', `<div class="venbox"><span class="sm">«${esc(v.valor)}» aparece al registrar ${TT('visita', 's', 'el', 'l', 'l')} de las fichas en estos estados (sin marcar ninguno, en todos):</span>
        <div class="chips">${estados().map(e => `<button type="button" class="chip ${marcados.has(e) ? 'on' : ''}" data-vene="${esc(e)}" aria-pressed="${marcados.has(e)}">${esc(e)}</button>`).join('')}</div>
        <div class="acts" style="justify-content:flex-end;margin:6px 0 0"><button type="button" class="btn sec" data-vencerrar>Cancelar</button><button type="button" class="btn" data-venok>Guardar</button></div></div>`);
      const box = item.nextElementSibling;
      box.querySelectorAll('[data-vene]').forEach(b => b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      box.querySelector('[data-vencerrar]').onclick = () => box.remove();
      box.querySelector('[data-venok]').onclick = async ev => {
        const l = [...box.querySelectorAll('[data-vene][aria-pressed="true"]')].map(b => b.dataset.vene);
        ev.target.disabled = true;
        const { data: r, error } = await db.rpc('guardar_valor', { p: { id: vid, en_estados: l.length === estados().length ? [] : l } });
        ev.target.disabled = false;
        if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
        v.en_estados = l.length && l.length < estados().length ? l : null;
        item.querySelector('[data-ven]').textContent = enEstadosTxt(v.en_estados);
        box.remove(); toast(v.en_estados ? `«${v.valor}» solo sale en: ${l.join(', ')}` : `«${v.valor}» sale en todos los estados`);
      };
    };
  });
}
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
async function pintarDireccionesDudosas() {
  const cal = $('calidad'); if (!cal || $('caldirs')) return;
  const { data, error } = await db.rpc('ubicaciones_dudosas', {});
  if (error || !$('calidad') || $('caldirs')) return;
  const l = data || [];
  if (!l.length) return;
  cal.insertAdjacentHTML('afterend', `<div class="card" id="caldirs">
    <div class="fh"><div><h2>Direcciones que no cuadran · ${num(l.length)}</h2>
      <div class="sm">El punto del mapa de ${TT('consulta', 'p', 'este', 'l', 'l')} está lejos de su municipio: «Cómo llegar», las rutas y la agenda las sitúan mal.</div></div></div>
    <div class="lista">${l.map(u => `<div class="item cdir" data-cdir="${u.id}" style="cursor:default">
      <span class="tx"><b>${esc(u.nombre)}</b>
        <span class="sm">${esc([u.centro_nombre, u.direccion, [u.cp, u.municipio].filter(Boolean).join(' ')].filter(Boolean).join(' · ') || 'Sin dirección')}</span>
        <span class="sm cdirkm">${u.km != null ? `El punto está a ${num(u.km)} km de ${esc(u.municipio)}` : 'El punto está fuera de España'}</span></span>
      <span class="acts" style="margin:0">
        <button type="button" class="btn sec" data-cdirf="${u.cuenta_id}">Ficha</button>
        ${u.direccion || u.municipio ? `<button type="button" class="btn" data-cdirg="${u.id}">Volver a situar</button>` : ''}</span></div>`).join('')}</div></div>`);
  const caja = $('caldirs');
  caja.querySelectorAll('[data-cdirf]').forEach(b => b.onclick = () => abrirFicha(b.dataset.cdirf));
  caja.querySelectorAll('[data-cdirg]').forEach(b => b.onclick = async () => {
    const u = l.find(x => x.id === b.dataset.cdirg); if (!u) return;
    const txt = b.textContent; b.disabled = true; b.textContent = 'Buscando…';
    const g = await geocodificar([u.direccion, u.cp, u.municipio, u.provincia, 'España'].filter(Boolean).join(', '), { direccion: u.direccion, municipio: u.municipio, cp: u.cp });
    b.disabled = false; b.textContent = txt;
    if (!g) { toast('No se encuentra esa dirección: corrígela en la ficha', true); return; }
    if (g.fuera) { toast(`Esa dirección sale en ${g.fuera}, no en ${u.municipio}: corrígela en la ficha`, true); return; }
    const { error: e } = await db.from('ubicaciones').update({ lat: +g.lat, lon: +g.lon }).eq('id', u.id);
    if (e) { toast('No se ha podido guardar: ' + e.message, true); return; }
    toast(`${u.nombre}: situado en ${u.municipio}`);
    const fila = caja.querySelector(`[data-cdir="${u.id}"]`); if (fila) fila.remove();
    const h = caja.querySelector('h2'), quedan = caja.querySelectorAll('.cdir').length;
    if (!quedan) caja.remove(); else if (h) h.textContent = `Direcciones que no cuadran · ${num(quedan)}`;
  });
}

