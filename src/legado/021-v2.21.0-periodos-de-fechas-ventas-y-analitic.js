/* ============================================================
   DLC OS 2.0 · v2.21.0 · Periodos de fechas, ventas y analítica
   con totales, indicadores en tarjetas, ruta en curso reordenable
   ============================================================ */


/* ---------------- periodos de fechas ---------------- */



/** Selector de periodo. el.__rango() devuelve { desde, hasta } (null = sin límite). */
function montarPeriodo(el, o) {
  const clave = 'dlc-per-' + (o.id || el.id) + '-' + (PERFIL ? PERFIL.id : '');
  let v = localStorage.getItem(clave) || o.valor || 'mes';
  el.innerHTML = `<label>Periodo</label>
    <select data-per>${PERIODOS.map(([k, t]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <div class="perpers ${v === 'pers' ? '' : 'hide'}"><input type="date" data-pd aria-label="Desde"><span class="sm">a</span><input type="date" data-ph aria-label="Hasta"></div>
    <div class="sm perrango"></div>`;
  const s = el.querySelector('[data-per]'), d = el.querySelector('[data-pd]'), hh = el.querySelector('[data-ph]');
  const texto = () => {
    const r = el.__rango();
    el.querySelector('.perrango').textContent = v === 'pers' || v === 'todo' ? '' :
      (r.desde === r.hasta ? fechaCorta(r.desde) : `${fechaCorta(r.desde)} – ${fechaCorta(r.hasta)}`);
  };
  el.__rango = () => { if (v === 'pers') return { desde: d.value || null, hasta: hh.value || null }; const [a, b] = rangoPeriodo(v); return { desde: a, hasta: b }; };
  s.onchange = () => {
    v = s.value; localStorage.setItem(clave, v);
    el.querySelector('.perpers').classList.toggle('hide', v !== 'pers');
    if (v === 'pers' && !d.value) { const [a, b] = rangoPeriodo('mes'); d.value = a; hh.value = b; }
    texto(); o.alCambiar && o.alCambiar(el.__rango());
  };
  d.onchange = hh.onchange = () => { texto(); o.alCambiar && o.alCambiar(el.__rango()); };
  texto();
  return el.__rango;
}

/* ---------------- ventas: tabla con totales ---------------- */

/* Pedidos: la base y, en orden, las secciones, las llamadas y el botón de registrar llamada (antes eran 4 capas). */
async function cargarVentas() {
  // «Llamadas» solo para quien ve todo el equipo; la base pinta la cabecera como «Compras» y luego se sustituye
  if (PEDSEC === 'llamadas' && !VE_TODO()) PEDSEC = 'ventas';
  const sec = PEDSEC;
  if (sec === 'llamadas') PEDSEC = 'compras';
  PEDSEC_CARGA = sec;   // v2.335.0: mientras se monta sobre «Compras», el menú y las pestañas marcan ya la sección de verdad
  try {
    await cargarVentasBase();
    await pedidosSecciones();
  } finally { PEDSEC_CARGA = null; }
  await pedidosLlamadas(sec);
  await pedidosBotonLlamada();
}
var PEDSEC_CARGA = null;






/* ---------------- analítica con totales y filtros ---------------- */

async function cargarAnalitica() {
  if (!COMS.length && VE_TODO()) await cargarComerciales();
  await cargarProductos();
  $('v-analitica').innerHTML = `
    <div class="saludo"><div><h1>Analítica</h1><div class="fecha">Unidades e importes por ${TT('medico', 's', '', 'l', 'l')}, comercial, producto o zona</div></div></div>
    <div class="panel">
      <div class="filtros">
        <div id="aper"></div>
        <div><label for="adim">Ver por</label><select id="adim">
          <option value="medico">${TT('medico', 's', '', 'l', 'C')}</option><option value="comercial">Comercial</option>
          <option value="producto">Producto</option><option value="municipio">Municipio</option>
          <option value="mes">Mes</option><option value="canal">Canal</option></select></div>
        <div><label for="amedida">Ordenar por</label><select id="amedida">
          <option value="unidades">Unidades</option><option value="importe">Importe</option></select></div>
        <div><label for="acanal">Canal</label><select id="acanal">
          <option value="">Todos</option><option value="paciente">Venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
          <option value="centro">Venta a centro</option></select></div>
        <div><label for="aprod">Producto</label><select id="aprod"><option value="">Todos</option>
          ${PRODUCTOS.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></div>
        <div><label for="arep">Reporting</label><select id="arep"><option value="">Todos ${TT('medico', 'p', 'el', 'l', 'l')}</option>
          <option value="con">Con reporting</option><option value="sin">Sin reporting</option></select></div>
        ${VE_TODO() ? `<div><label for="areprt">Reporte</label><select id="areprt"><option value="">Todos</option><option value="si">Reportados</option><option value="no">Sin reportar</option></select></div>` : ''}
        ${VE_TODO() ? `<div><label for="acom">Comercial</label><select id="acom"><option value="">Todos</option>
          ${COMS.map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select></div>` : ''}
        <div style="grid-column:span 2"><label>${TT('medico', 's', '', 'l', 'C')}</label><div id="amed"></div></div>
        <input type="hidden" id="adesde"><input type="hidden" id="ahasta">
      </div>
      <div class="kpis vtot" id="atot"></div>
      <div id="aprods"></div>
      <div class="subnav"><button data-avista="rank" aria-pressed="true">Ranking</button>
        <button data-avista="tabla" aria-pressed="false">Tabla por meses</button></div>
      <div id="aserie" style="padding:14px"></div>
      <div id="atabla"></div>
      <div id="atabla2" class="hide"></div>
    </div>`;
  const sinc = () => { const r = $('aper').__rango(); $('adesde').value = r.desde || ''; $('ahasta').value = r.hasta || ''; };
  montarPeriodo($('aper'), { id: 'analitica', valor: 'anio', alCambiar: () => { sinc(); refrescarAnalitica(); } });
  sinc();
  selectorMedico($('amed'), { valor: AN_MED, placeholder: `Todos · busca ${TT('medico', 's', 'un', 'l', 'l')} para ver sus ventas`, alElegir: m => { AN_MED = m; refrescarAnalitica(); } });
  ['adim', 'acanal', 'amedida', 'aprod', 'acom', 'arep', 'areprt'].forEach(id => { if ($(id)) $(id).onchange = refrescarAnalitica; });
  $('v-analitica').querySelectorAll('[data-avista]').forEach(b => b.onclick = () => {
    const tabla = b.dataset.avista === 'tabla';
    $('v-analitica').querySelectorAll('[data-avista]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('atabla').classList.toggle('hide', tabla); $('aserie').classList.toggle('hide', tabla);
    $('atabla2').classList.toggle('hide', !tabla);
    if (tabla) pintarTablaAnalitica();
  });
  pintarAnalitica();
}

function refrescarAnalitica() {
  pintarAnalitica();
  if (!$('atabla2').classList.contains('hide')) pintarTablaAnalitica();
}


/* ---------------- auditoría con periodo ---------------- */


/* ---------------- indicadores: configurador en tarjetas ---------------- */


/* ---------------- ruta en curso: ficha al pulsar, acciones y orden ---------------- */



/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  analitica: ['Analítica', 'Unidades e importes de los pedidos completados.', [
    `Elige el <b>periodo</b> y la dimensión: ${TT('medico', 's', '', 'l', 'l')}, comercial, producto, municipio, mes o canal.`,
    `Filtra por un <b>${TT('medico', 's', '', 'l', 'l')}</b>, un <b>comercial</b> o un <b>producto</b> para ver sus totales y su reparto por producto.`,
    'El importe es sin IVA y con el descuento de cada línea.',
    'Los datos no se pueden descargar: se consultan solo dentro de la plataforma.']]
});
AYUDA.inicio[2].splice(1, 1, 'El icono ⚙ junto al saludo abre los indicadores: el ojo los muestra u oculta y las flechas cambian el orden.');
AYUDA.ventas[2].push('Arriba tienes los totales del periodo (solo pedidos completados: confirmados, cobrados, preparados y facturados) y al final de la tabla, la suma.');


