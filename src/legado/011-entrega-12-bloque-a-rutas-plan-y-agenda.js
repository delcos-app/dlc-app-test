/* ============================================================
   DLC OS 2.0 · Entrega 12 · Bloque A: rutas, plan y agenda
   ============================================================ */

let RSEC = 'mis', PROPUESTAS = null;
/* v2.76.0 · La salida y la vuelta son de cada ruta (o del día planificado), no un ajuste general.
   HOR = horario del plan en curso; sin él se estima desde las 9:00 (o desde ahora) y no hay hora de vuelta. */
let HOR = null;
const TIEMPOS = () => { const p = prefsActivas().plan || {}; return { visita: +p.visita || 15, parada: p.parada != null && p.parada !== '' ? +p.parada : 10 }; };
const PLANCFG = () => Object.assign({}, TIEMPOS(), { salida: (HOR && HOR.salida) || '09:00', tope: (HOR && HOR.vuelta) || '23:59',
  conSalida: !!(HOR && HOR.salida), conTope: !!(HOR && HOR.vuelta) });
function conHor(h, fn) { const prev = HOR; HOR = h && (h.salida || h.vuelta) ? h : null; try { return fn(); } finally { HOR = prev; } }
const horDeCitas = l => { const c = (l || []).find(x => x && (x.salida || x.vuelta)); return c ? { salida: c.salida || null, vuelta: c.vuelta || null } : null; };
const horDeRuta = id => { const r = (RUTAS || []).find(x => x.id === id); return r && (r.salida || r.vuelta) ? { salida: r.salida || null, vuelta: r.vuelta || null } : null; };

/* ---------------- navegador de mapas ---------------- */

const NAVEGADORES = [['google', 'Google Maps'], ['apple', 'Apple Maps'], ['waze', 'Waze']];
const navActual = () => (PERFIL.preferencias || {}).navegador || 'google';


async function cambiarNavegador(n) {
  const prefs = Object.assign({}, PERFIL.preferencias || {}, { navegador: n });
  const { data } = await db.rpc('guardar_preferencias', { p: prefs });
  PERFIL.preferencias = data || prefs;
  toast('Navegación con ' + (NAVEGADORES.find(x => x[0] === n) || [])[1]);
  if (PLAN) pintarPlan();
}

// Cada navegación pregunta con qué app abrirla (Google Maps admite la ruta con todas sus paradas)
const navAttr = (d, p) => esc(JSON.stringify({ d, p: p && p.length ? p : null }));
document.addEventListener('click', e => {
  const b = e.target.closest('[data-nav]'); if (!b) return;
  e.preventDefault();
  try { const v = JSON.parse(b.dataset.nav); navegarA(v.d, v.p); } catch (x) { /* dato de navegación no válido */ }
});
const selectorNav = () => `<select id="navsel" title="Navegador de mapas" style="max-width:160px">${
  NAVEGADORES.map(([v, t]) => `<option value="${v}" ${navActual() === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;

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



