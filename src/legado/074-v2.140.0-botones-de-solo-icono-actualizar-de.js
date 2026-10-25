// v2.140.0 · Botones de solo icono (Actualizar de Inicio): al pulsarlos gira el icono y no aparece ningún texto (antes salía
// «Actualizando…» dentro del botón redondo)
async function conCarga(btn, texto, fn) {
  if (!btn || !(btn.id === 'iniact' || btn.classList.contains('icoredondo') || btn.classList.contains('icobtn'))) return conCargaBase(btn, texto, fn);
  if (btn.dataset.cargando) return;
  btn.dataset.cargando = '1'; btn.disabled = true; btn.classList.add('icogira'); btn.setAttribute('aria-busy', 'true');
  try { return await fn(); } finally { btn.disabled = false; btn.classList.remove('icogira'); btn.removeAttribute('aria-busy'); delete btn.dataset.cargando; }
}

/* v2.140.0 · «Personalizar menú» rehecho (petición de Eric: la selección se veía «de 2010»). Cada bloque y cada sección se arrastran
   por su asa para ordenarlos (también con el teclado: asa con el foco y flechas ↑ ↓); cada sección tiene un interruptor como los de
   Notificaciones; el menú de la izquierda cambia en vivo mientras se toca y solo se guarda con «Guardar» (cerrar o Escape lo deja
   como estaba). */
Object.assign(ICON_NOM, {
  'grip-vertical': '<circle cx="9" cy="5" r="1" /> <circle cx="9" cy="12" r="1" /> <circle cx="9" cy="19" r="1" /> <circle cx="15" cy="5" r="1" /> <circle cx="15" cy="12" r="1" /> <circle cx="15" cy="19" r="1" />',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" />'
});





// (v2.183.0: aquí iba la primera versión de agVerDia; se redefine entera más abajo)
document.addEventListener('pointerdown', e => { if (!e.target.closest('.agpop, [data-agdia]')) document.querySelectorAll('.agpop').forEach(x => x.remove()); }, true);

// v2.143.0: en Pedidos y Oportunidades los filtros pasan dentro de «Filtros y columnas» (a la vista queda solo el buscador)
HT_FILTROS.ventas = "#v-ventas .filtros";
new MutationObserver(() => {
  if (ACCION_PAG_PEND) return; ACCION_PAG_PEND = true;
  queueMicrotask(() => { ACCION_PAG_PEND = false; subirAccionPagina(); });
}).observe(document.querySelector('main'), { childList: true, subtree: true });



















let AN_CFG = null, AN_DATOS = {};



document.addEventListener('pointerdown', e => { if (!e.target.closest('.ankpop, [data-ancfg]')) document.querySelectorAll('.ankpop').forEach(x => x.remove()); }, true);




// En «Filtros y columnas» van los del Resumen o los de Explorar según la pestaña
Object.defineProperty(HT_FILTROS, 'analitica', { configurable: true, enumerable: true,
  get: () => ANSEC === 'explorar' ? '#v-analitica .panel > .filtros' : '#anfil' });


