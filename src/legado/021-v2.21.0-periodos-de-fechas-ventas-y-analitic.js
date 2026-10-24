/* ============================================================
   DLC OS 2.0 · v2.21.0 · Periodos de fechas, ventas y analítica
   con totales, indicadores en tarjetas, ruta en curso reordenable
   ============================================================ */

const ICO = {
  gear: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  ojo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  ojoNo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  nav: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
  arriba: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>',
  abajo: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>'
};

/* ---------------- periodos de fechas ---------------- */

const fechaLocal = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const PERIODOS = [['todo', 'Todo'], ['hoy', 'Hoy'], ['ayer', 'Ayer'], ['semana', 'Esta semana'], ['7d', 'Últimos 7 días'],
  ['mes', 'Mes actual'], ['mesant', 'Mes anterior'], ['tri', 'Trimestre actual'], ['triant', 'Trimestre anterior'],
  ['anio', 'Año actual'], ['anioant', 'Año anterior'], ['pers', 'Personalizado']];


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
function pedsecVista() { return PEDSEC_CARGA || PEDSEC; }






/* ---------------- analítica con totales y filtros ---------------- */

let AN_MED = null;
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

function abrirKpis() {
  let D = kpiConfig().slice();
  KPI_CAT.forEach(k => { if (!D.some(x => x.id === k.id)) D.push({ id: k.id, on: false, t: '' }); });
  const esAdmin = puede('administrar');
  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Indicadores de Inicio</h2>
        <div class="sm">Pulsa el ojo para mostrar u ocultar. Ordénalos con las flechas y cambia el nombre si quieres.</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="kcards">${D.map((x, i) => {
        const k = KPI_CAT.find(y => y.id === x.id);
        if (!k && !x.filtro) return '';
        if (k && !kpiPermitido(k)) return '';
        const desc = x.filtro ? 'Filtro guardado del Directorio: ' + textoFiltro(x.filtro) + '.' : (AYUDA_KPI[x.id] || '');
        return `<div class="kcard ${x.on ? 'on' : ''}">
          <button type="button" class="kojo" data-kon="${i}" aria-pressed="${x.on}" title="${x.on ? 'Visible: pulsa para ocultar' : 'Oculto: pulsa para mostrar'}">${x.on ? ICO.ojo : ICO.ojoNo}</button>
          <div class="ktx"><input class="chico" data-kt="${i}" value="${esc(x.t)}" placeholder="${esc(k ? k.t.charAt(0).toUpperCase() + k.t.slice(1) : textoFiltro(x.filtro))}" aria-label="Nombre del indicador">
            <span class="sm">${esc(desc)}</span></div>
          <div class="kord">
            <button type="button" class="kmv" data-kmv="${i}|-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICO.arriba}</button>
            <button type="button" class="kmv" data-kmv="${i}|1" aria-label="Bajar" ${i === D.length - 1 ? 'disabled' : ''}>${ICO.abajo}</button>
            ${x.filtro ? `<button type="button" class="kmv" data-kdel="${i}" aria-label="Eliminar" title="Eliminar">✕</button>` : ''}</div>
        </div>`;
      }).join('')}</div>
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" id="kres">Restaurar</button>
        <button class="btn" id="kok">Guardar</button></div>`;
    const leer = () => $('dbody').querySelectorAll('[data-kt]').forEach(i => D[+i.dataset.kt].t = i.value.trim());
    $('dbody').querySelectorAll('[data-kon]').forEach(b => b.onclick = () => { leer(); D[+b.dataset.kon].on = !D[+b.dataset.kon].on; $('dlg').dataset.sucio = '1'; pinta(); });
    $('dbody').querySelectorAll('[data-kmv]').forEach(b => b.onclick = () => {
      leer(); const [i, dir] = b.dataset.kmv.split('|').map(Number), j = i + dir;
      if (j < 0 || j >= D.length) return; [D[i], D[j]] = [D[j], D[i]]; $('dlg').dataset.sucio = '1'; pinta();
    });
    $('dbody').querySelectorAll('[data-kdel]').forEach(b => b.onclick = () => { leer(); D.splice(+b.dataset.kdel, 1); $('dlg').dataset.sucio = '1'; pinta(); });
    $('kres').onclick = () => { D = KPI_CAT.map(k => ({ id: k.id, on: KPI_DEF.includes(k.id), t: '' })); $('dlg').dataset.sucio = '1'; pinta(); };
    $('kok').onclick = async ev => {
      leer(); ev.target.disabled = true; ev.target.textContent = 'Guardando…';
      const ok = await guardarKpis(D.map(x => ({ id: x.id, on: x.on, t: x.t, ...(x.filtro ? { filtro: x.filtro } : {}) })));
      ev.target.disabled = false; ev.target.textContent = 'Guardar';
      if (!ok) return;
      $('dlg').close(); toast('Indicadores guardados'); cargarInicio();
    };
  };
  pinta();
  $('dlg').showModal();
}

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


