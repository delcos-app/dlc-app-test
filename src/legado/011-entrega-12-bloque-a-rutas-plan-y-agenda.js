/* ============================================================
   DLC OS 2.0 · Entrega 12 · Bloque A: rutas, plan y agenda
   ============================================================ */

let RSEC = 'mis', PROPUESTAS = null;

/* ---------------- navegador de mapas ---------------- */




document.addEventListener('click', e => {
  const b = e.target.closest('[data-nav]'); if (!b) return;
  e.preventDefault();
  try { const v = JSON.parse(b.dataset.nav); navegarA(v.d, v.p); } catch (x) { /* dato de navegación no válido */ }
});

/* ---------------- pantalla de rutas ---------------- */

/* cargarRutas: la parte base y, en orden, cada paso que se le añade (antes eran 2 capas separadas). */
async function cargarRutas() {
  await cargarRutasBase();
  await cargarRutasPaso1();
  await cargarRutasPaso2();
}


async function cargarRutasPaso2() {
  const acts = $('v-rutas').querySelector('.saludo .acts');
  if (acts && !$('rhorario')) {
    acts.insertAdjacentHTML('afterbegin', `<button class="btn sec" id="rhorario" title="Minutos por ${TT('visita', 's', '', 'l', 'l')} y por parada">⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')}</button>`);
    $('rhorario').onclick = abrirHorarioPlan;
  }
  const c = PLANCFG();
  const sub = $('v-rutas').querySelector('.saludo .fecha');
  if (sub) sub.textContent = `Crea, edita y planifica tus rutas · ${c.visita} min por ${TT('medico', 's', '', 'l', 'l')}`;
}

// (v2.183.0: aquí iba la primera versión de cargarRutasBase; se redefine entera más abajo)

// v2.242.0: aquí iba listaRutas (nadie la usaba)



/* ---------------- propuestas automáticas ---------------- */

// v2.242.0: aquí iba listaPropuestas (nadie la usaba)

/* ---------------- editor de ruta ---------------- */


/* ---------------- plan del día con horario configurable ---------------- */



function abrirHorarioPlan() {
  const c = PLANCFG();
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Tiempos de ${TT('visita', 's', '', 'l', 'l')}</h2><div class="sm">Se guardan en tus preferencias. La hora de salida y la de vuelta se ponen en cada ruta.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="hvis">Minutos por ${TT('medico', 's', '', 'l', 'l')}</label><input id="hvis" type="number" min="5" max="60" value="${c.visita}"></div>
      <div><label for="hpar">Minutos fijos por parada</label><input id="hpar" type="number" min="0" max="40" value="${c.parada}"></div>
    </div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="hok">Guardar</button></div>`;
  $('hok').onclick = async ev => {
    ev.target.disabled = true;
    const plan = { visita: +$('hvis').value || 15, parada: $('hpar').value === '' ? 10 : +$('hpar').value };
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { plan });
    const { data } = await db.rpc('guardar_preferencias', { p: prefs });
    PERFIL.preferencias = data || prefs;
    $('dlg').close(); toast('Horario guardado');
    if (ULTIMO_PLAN) construirPlan(ULTIMO_PLAN.conXY, ULTIMO_PLAN.rutaId, null, ULTIMO_PLAN.opts);
    else if (PLAN && PLAN.rutaId) {
      if (typeof PLAN.rutaId === 'string' && PROPUESTAS && PROPUESTAS[PLAN.rutaId]) planDesdeLista(PROPUESTAS[PLAN.rutaId], PLAN.rutaId);
      else planificar(PLAN.rutaId, $('rnueva') || document.createElement('button'));
    }
  };
  $('dlg').showModal();
}



