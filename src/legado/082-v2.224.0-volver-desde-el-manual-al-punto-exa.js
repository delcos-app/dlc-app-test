


// La ventanita ya llevaba «Ver más en el manual de uso» (resumirAyuda), que abría el buscador del manual: ahora abre el apartado de esa pantalla
function resumirAyudaBase2(pop) {
  resumirAyudaBase.call(this, pop);
  const l = pop.querySelector('.aiman'); if (!l) return;
  const b = pop.__de, ancla = b ? anclaAyuda(b) : (MANUAL_ANCLA[TAB] || '');
  l.innerHTML = 'Ver en el manual de uso <span aria-hidden="true">›</span>';
  l.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); pop.remove(); abrirManual(ancla); };
}

window.addEventListener('click', e => {
  const b = e.target.closest('[data-ag="equipo"]'); if (!b || AG_MODO !== 'equipo') return;
  e.stopImmediatePropagation(); e.preventDefault();
  AG_MODO = 'dia'; AG_VISTA = null; if ($('agvista')) $('agvista').value = '';
  cargarAgenda();
}, true);


async function pintarSinAtribuir() { const c = $('cardsinatr'); if (c) c.remove(); }

try { Object.assign(HT_ORDEN, JSON.parse(localStorage.getItem('delcos-orden') || '{}')); } catch (e) {}
// Pulsar una cabecera: asc → desc → sin orden
document.addEventListener('click', e => {
  const c = e.target.closest('.dgrid > .dh > *'); if (!c || e.target.closest('input, button, select, .res')) return;
  const g = c.closest('.dgrid'), tipo = htTipo(g), i = [...c.parentElement.children].indexOf(c), n = c.textContent.trim();
  const srv = ORD_SRV[tipo]; const k = srv ? srv(i, n) : null;
  if (srv ? !k : htCeldaNoOrdenable(n)) return;
  const o = HT_ORDEN[tipo];
  if (!o || o.i !== i) HT_ORDEN[tipo] = { i, dir: 1, k }; else if (o.dir === 1) o.dir = -1; else delete HT_ORDEN[tipo];
  htGuardarOrden();
  if (srv) {
    if (tipo === 'peds2' && typeof listaPedidos === 'function') { PEDPAG = 0; listaPedidos(); }
    if (tipo === 'pacs' && typeof listaPacientes === 'function') { PAC.pagina = 0; listaPacientes(); }
    htMarcarCabecera(g); return;
  }
  if (HT_ORDEN[tipo]) htOrdenarFilas(g); else { htQuitarOrden(g); htMarcarCabecera(g); }
});
// El orden de las tablas de la base viaja con la consulta
db.rpc = (orig => function (fn, args, ...r) {
  const o = fn === 'pedidos_pagina' ? HT_ORDEN.peds2 : fn === 'clientes_lista' ? HT_ORDEN.pacs : null;
  if (o && o.k && args && !('p_orden' in args) && (fn !== 'clientes_lista' || args.lim > 5)) args = Object.assign({}, args, { p_orden: o.k + (o.dir === -1 ? ':desc' : ':asc') });
  return orig.call(this, fn, args, ...r);
})(db.rpc);
// Profesionales: su cabecera es propia y el orden va en F.orden (buscar_cuentas)
document.addEventListener('click', e => {
  const th = e.target.closest('#thead .th[data-ordk]'); if (!th || e.target.closest('.res')) return;
  const k = ORD_DIR[th.dataset.ordk], [ak, ad] = String(F.orden || '').split(':');
  F.orden = ak === k && ad === 'asc' ? k + ':desc' : ak === k && ad === 'desc' ? 'nombre' : k + ':asc';
  if ($('forden') && [...$('forden').options].some(x => x.value === F.orden)) $('forden').value = F.orden;
  buscar(true); cabeceraTabla();
});


const MOS_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], MOS_DS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Sugerencias dentro de tu día y bandejas

document.addEventListener('change', e => { if (e.target && e.target.id === 'popf') pkMarcar(); });

var AN_REP = '';   // v2.329.0: Analítica → Resumen, «Reporte»

