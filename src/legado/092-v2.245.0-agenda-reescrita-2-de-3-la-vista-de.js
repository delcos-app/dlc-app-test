/* ============================================================
   v2.245.0 · Agenda reescrita (2 de 3): la vista del día se monta de una vez desde los datos. Hasta ahora cargarAgenda pasaba por
   once capas: pintaba la Agenda de 2021 (flechas, Día/Semana/Mes), las cifras (#agmet), la semana (#agsemana), el mes (#agmes), las
   sugerencias (#agsug) y los pendientes (#agpend), las escondía y otras capas leían ese HTML oculto para pintar las pastillas, las
   bandejas y «En este centro también». Ahora, en la vista de día:
   - agCargarDia() pinta la cabecera (título, pastillas, + Nueva cita y, quien ve el equipo, «Mi agenda/…» y Equipo), la cinta, «Tu día»
     (tdPintar) y «Tu semana»; nada oculto.
   - Pastillas desde agenda_metricas (AG_MET). La cuarta, «Por visitar», ya no lleva a una lista escondida.
   - Bandejas desde los datos: «Les toca visita» = toca_actividad (antes contaba la última lista de las sugerencias, que podía ser
     otra) y «Pendientes de días anteriores» = pendientes_ruta, con sus botones en el panel lateral.
   - «En este centro también» desde sugerencias_centros, por la posición del centro (antes, buscando su nombre en el texto).
   - El mes se pinta al pulsarlo en la cinta; la cinta conserva sus «⋯» y la semana desplegada al repintarse; «Tu semana» se
     actualiza al cambiar de día.
   Semana, Mes y Equipo siguen como estaban.
   ============================================================ */
let AG_MET = null, AG_SUG = null, AG_PEND = null;





document.addEventListener('click', e => {
  const b = e.target.closest('#agcuerpo .agtamb[data-agtc]'); if (!b || e.target.closest('[data-agti]')) return;
  e.stopPropagation(); fichaCentro(b.dataset.agtc);
}, true);
document.addEventListener('keydown', e => { const b = e.target.closest && e.target.closest('#agcuerpo .agtamb[data-agtc]'); if (b && e.target === b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fichaCentro(b.dataset.agtc); } });
document.addEventListener('click', e => {
  const b = e.target.closest('#agcuerpo .agtamb [data-agti]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.agtv) nuevaCita(b.dataset.agti, AG_FECHA); else abrirFicha(b.dataset.agti);
}, true);




rpcCache = (orig => async function (fn, params, clave) {
  const r = await orig.call(this, fn, params, clave);
  if (fn === 'agenda_rango' && params && params.p_desde === params.p_hasta && r && r.data) AG_DIAS_DATOS[params.p_desde] = r.data;
  return r;
})(rpcCache);


