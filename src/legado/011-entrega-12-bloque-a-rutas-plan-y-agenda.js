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






