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




// (v2.183.0: aquí iba la primera versión de cargarRutasBase; se redefine entera más abajo)

// v2.242.0: aquí iba listaRutas (nadie la usaba)



/* ---------------- propuestas automáticas ---------------- */

// v2.242.0: aquí iba listaPropuestas (nadie la usaba)

/* ---------------- editor de ruta ---------------- */


/* ---------------- plan del día con horario configurable ---------------- */






