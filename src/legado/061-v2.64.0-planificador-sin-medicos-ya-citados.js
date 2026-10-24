/* ============================================================
   v2.64.0 · Planificador: sin médicos ya citados y dentro de tu
   hora de vuelta · Agenda: «Empezar ruta» y «Ruta completa»
   ============================================================ */

// Mis citas pendientes (planificadas o confirmadas) desde hoy: médico → primera fecha
async function citasPlanificadasMias() {
  try {
    const { data } = await db.from('agenda').select('cuenta_id,fecha').eq('usuario_id', PERFIL.id)
      .in('estado', ['Planificada', 'Confirmada']).gte('fecha', hoyISO()).order('fecha').limit(2000);
    const r = {}; (data || []).forEach(c => { if (!r[c.cuenta_id]) r[c.cuenta_id] = c.fecha; }); return r;
  } catch (e) { return {}; }
}
// El plan muestra aparte a los médicos que ya tienen cita
pintarPlan = (orig => function (...a) {
  const r = orig.apply(this, a);
  const box = $('rplan');
  if (box && PLAN && PLAN.citados && PLAN.citados.length && !box.querySelector('.plancitados')) {
    box.insertAdjacentHTML('beforeend', `<div class="plancitados"><h3>Ya citados · ${PLAN.citados.length}</h3>
      <p class="sm">No se proponen en este plan porque ya tienen una cita planificada en tu agenda.</p>
      <div class="lista">${PLAN.citados.map(x => `<div class="item" style="cursor:default"><span class="ic">📅</span><span class="txt"><b>${esc(x.m.nombre)}</b>
        <span class="sm">Cita el ${esc(fechaLarga(new Date(x.fecha + 'T12:00:00')))}${x.m.municipio ? ' · ' + esc(x.m.municipio) : ''}</span></span></div>`).join('')}</div></div>`);
  }
  return r;
})(pintarPlan);

// Agenda del día: paradas abiertas en orden (se preparan al pintar para abrir la navegación al pulsar)
let TD_PARADAS = [];
async function prepararParadas(fecha) {
  // «Tu día» ya tiene sus citas (de la persona y en el orden de la ruta): se usan tal cual
  TD_PARADAS = (typeof TD_CITAS !== 'undefined' && Array.isArray(TD_CITAS) ? TD_CITAS : []).filter(c => CITA_ABIERTA.includes(c.estado) && xyCita(c));
  pintarBotonesRuta(fecha);
}
function rutaCompleta() {
  const sal = salidaUsuario(), casa = sal && sal.lat != null ? [sal.lat, sal.lon] : null;
  const xy = TD_PARADAS.map(xyCita);
  if (!xy.length) return;
  // Todas las paradas en orden y la vuelta a casa como destino (Google Maps admite hasta 9 paradas intermedias)
  return casa ? navegarA(casa, xy.slice(0, 9)) : navegarA(xy[xy.length - 1], xy.slice(0, -1).slice(0, 9));
}
function pintarBotonesRuta(fecha) {
  const cont = document.querySelector('#agcuerpo .tdhead > .acts');
  if (!cont) return;
  const emp = $('tdempezar');
  if (emp && !emp.dataset.v264) {
    emp.dataset.v264 = '1'; emp.textContent = '▶ Empezar ruta';
    emp.title = 'Inicia la jornada y abre la navegación hacia la primera parada';
    emp.onclick = async () => {
      const primera = TD_PARADAS[0];
      await empezarJornada();
      if (primera) navegarA(xyCita(primera));
    };
  }
  let rc = $('tdrutacompleta');
  const pasado = fecha < hoyISO();
  if (!pasado && TD_PARADAS.length && agUid() === PERFIL.id) {
    if (!rc) { cont.insertAdjacentHTML('afterbegin', `<button class="btn sec chico" id="tdrutacompleta" type="button" title="Abre todas las paradas del día en el navegador, en orden">${svgIco(ICON_NOM.map)} Ruta completa</button>`); rc = $('tdrutacompleta'); }
    rc.onclick = () => rutaCompleta();
  } else if (rc) rc.remove();
}


