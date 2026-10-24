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
const agN = () => agConCinta() && $('v-agenda').classList.contains('agn');




// Quién ya tiene cita ese día (no se le propone)
const agConCitaHoy = () => new Set((TD_CITAS || []).filter(c => !citaAnulada(c.estado)).map(c => c.cuenta_id));

document.addEventListener('click', e => {
  const b = e.target.closest('#agcuerpo .agtamb[data-agtc]'); if (!b || e.target.closest('[data-agti]')) return;
  e.stopPropagation(); fichaCentro(b.dataset.agtc);
}, true);
document.addEventListener('keydown', e => { const b = e.target.closest && e.target.closest('#agcuerpo .agtamb[data-agtc]'); if (b && e.target === b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fichaCentro(b.dataset.agtc); } });
const agImp = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
document.addEventListener('click', e => {
  const b = e.target.closest('#agcuerpo .agtamb [data-agti]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.agtv) nuevaCita(b.dataset.agti, AG_FECHA); else abrirFicha(b.dataset.agti);
}, true);

function agBandejas() {
  const head = document.querySelector('#agcuerpo .tdhead'); if (!head) return;
  const old = $('agband'); if (old) old.remove();
  const nToca = agTocaLista().length, nPend = (AG_PEND || []).length;
  if (!nToca && !nPend) return;
  head.insertAdjacentHTML('afterend', `<div class="agband" id="agband">${nToca ? `<button type="button" data-agbd="toca">${svgIco(ICON_NOM.target)} Les toca ${TT('visita', 's', '', 'l', 'l')} <b>${nToca}</b></button>` : ''}${nPend ? `<button type="button" class="urg" data-agbd="pend">${svgIco(ICON_NOM['circle-alert'] || ICON_NOM.info)} Pendientes de días anteriores <b>${nPend}</b></button>` : ''}</div>`);
  $('agband').querySelectorAll('[data-agbd]').forEach(b => b.onclick = () => agBandeja(b.dataset.agbd));
}



// El título conserva «· agenda de …» al ver la de otra persona (agMarcarDia lo dejaba en «Hoy · …»)
agMarcarDia = (orig => function (...a) {
  const r = orig.apply(this, a);
  if (agN() && AG_VISTA && $('agtit') && !$('agtit').textContent.includes(AG_VISTA.nombre)) $('agtit').textContent += ' · agenda de ' + AG_VISTA.nombre;
  return r;
})(agMarcarDia);
// Subir o bajar una cita no recarga la Agenda aunque otra pantalla (Inicio pide las citas de hoy) haya pedido otro día entretanto:
// se guarda lo último de cada día y se usa el del día que se ve
const AG_DIAS_DATOS = {};
rpcCache = (orig => async function (fn, params, clave) {
  const r = await orig.call(this, fn, params, clave);
  if (fn === 'agenda_rango' && params && params.p_desde === params.p_hasta && r && r.data) AG_DIAS_DATOS[params.p_desde] = r.data;
  return r;
})(rpcCache);
moverCitaLocal = (orig => async function (...a) {
  if ((!TD_ULTIMO || TD_ULTIMO.fecha !== AG_FECHA) && AG_DIAS_DATOS[AG_FECHA]) TD_ULTIMO = { fecha: AG_FECHA, data: AG_DIAS_DATOS[AG_FECHA] };
  return orig.apply(this, a);
})(moverCitaLocal);
// «Ver la semana» aparece de una vez: se pinta escondida y se enseña ya con sus días (antes salía vacía y se llenaba)
agPintarSemanaExp = (orig => async function (...a) {
  const cin = $('agcinta');
  if (!agN() || !cin || !AG_SEM_ABIERTA || $('agsemexp')) return orig.apply(this, a);
  cin.insertAdjacentHTML('beforeend', '<div id="agsemexp" class="agsemexp" style="display:none"></div>');
  try { return await orig.apply(this, a); } finally { const x = $('agsemexp'); if (x) x.style.display = ''; }
})(agPintarSemanaExp);


