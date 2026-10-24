/* ============================================================
   DLC OS 2.0 · v2.37.0 · Experiencia móvil ordenada y fluida,
   navegación sin rebotes (solo vale la última petición), configuración
   unificada, buscador del manual, alertas legibles, compartir por
   WhatsApp con el menú del sistema y unidades por periodo en la ficha
   ============================================================ */

const ES_MOVIL = () => matchMedia('(max-width: 760px)').matches;

/* ---------------- navegación: cada cambio de módulo descarta lo pendiente ---------------- */

let NAV_CTRL = new AbortController(), NAV_GEN = 0;
// Las consultas de lectura de un módulo que ya no está en pantalla se descartan: nunca pintan ni devuelven la vista
const TURNOS = {};
const pedirTurno = k => (TURNOS[k] = (TURNOS[k] || 0) + 1);
const esMiTurno = (k, t) => TURNOS[k] === t;
const SOLO_ULTIMA = new Set(['pedidos_pagina', 'facturas_lista', 'llamadas_lista', 'clientes_lista', 'analitica_tabla', 'compras_lista', 'stock_resumen']);
const RPC_V2361 = db.rpc;
db.rpc = function (fn, params, opts) {
  const b = RPC_V2361.call(db, fn, params, opts);
  // En los listados, si se vuelve a pedir antes de terminar, solo vale la última petición
  if (SOLO_ULTIMA.has(fn)) {
    const t = pedirTurno(fn), gen0 = NAV_GEN;
    return conCatch(new Promise(res => Promise.resolve(b).then(r => { if (esMiTurno(fn, t) && gen0 === NAV_GEN) res(r); }, () => {})));
  }
  if (!(fn in RPC_TTL)) return b;
  const gen = NAV_GEN, señal = NAV_CTRL.signal;
  try { if (b && typeof b.abortSignal === 'function') b.abortSignal(señal); } catch (e) {}
  return conCatch(new Promise(res => Promise.resolve(b).then(r => { if (gen === NAV_GEN) res(r); }, () => {})));
};
// Y ninguna pantalla puede aparecer si no es la del módulo actual
new MutationObserver(ms => {
  for (const m of ms) {
    const s = m.target;
    if (s.parentElement && s.parentElement.tagName === 'MAIN' && s.id !== 'v-' + TAB && !s.classList.contains('hide')) s.classList.add('hide');
  }
}).observe(document.querySelector('main'), { attributes: true, attributeFilter: ['class'], subtree: true });


/* ---------------- selectores de fecha y hora en su propia capa (nunca se cortan) ---------------- */

(function () {
  if (!$('seldlg')) document.body.insertAdjacentHTML('beforeend', '<dialog id="seldlg" class="seldlg"></dialog>');
  const d = $('seldlg');
  // v2.87.0: en móvil, el «clic fantasma» que sigue al toque (~300 ms) no debe cerrar el calendario ni elegir un día:
  // durante el primer medio segundo tras abrirse se ignora cualquier toque
  d.addEventListener('click', e => { if (d.__abierto && Date.now() - d.__abierto < 500) { e.stopPropagation(); e.preventDefault(); } }, true);
  d.addEventListener('click', e => { if (e.target === d) cerrarSelector(); });
  d.addEventListener('cancel', e => { e.preventDefault(); cerrarSelector(); });
})();
function cerrarSelector() {
  if (SELPOP) { SELPOP.remove(); SELPOP = null; }
  const d = $('seldlg'); if (d && d.open) d.close();
};
function colocarPop(pop, ref) {
  const d = $('seldlg');
  if (!d.open) d.showModal();
  if (ES_MOVIL()) { d.classList.add('hoja'); d.style.top = ''; d.style.left = ''; return; }
  d.classList.remove('hoja');
  const r = ref.getBoundingClientRect(), alto = d.offsetHeight, ancho = d.offsetWidth;
  const abajo = window.innerHeight - r.bottom > alto + 12 || r.top < alto + 12;
  d.style.top = Math.max(8, abajo ? r.bottom + 6 : r.top - alto - 6) + 'px';
  d.style.left = Math.max(8, Math.min(window.innerWidth - ancho - 8, r.left)) + 'px';
};

/* ---------------- rendimiento: los campos se mejoran por lotes ---------------- */

let MEJ_PEND = new Set(), MEJ_RAF = 0;
mejorarCampos = (orig => function (raiz) {
  if (!raiz || raiz === document) return orig(raiz);
  if (raiz.nodeType !== 1 || !raiz.querySelector && raiz.tagName !== 'INPUT') return;
  MEJ_PEND.add(raiz);
  if (MEJ_RAF) return;
  MEJ_RAF = 1; queueMicrotask(() => {
    MEJ_RAF = 0; const l = [...MEJ_PEND]; MEJ_PEND.clear();
    l.forEach(n => { if (n.isConnected && (n.tagName === 'INPUT' ? n.parentNode : n.querySelector('input[type=date],input[type=time],input[type=number]'))) orig(n.tagName === 'INPUT' ? n.parentNode : n); });
  });
})(mejorarCampos);

/* ---------------- barra de herramientas ordenada en el móvil ---------------- */

function ordenarCabeceraMovil(sec) {
  if (!ES_MOVIL() || !sec) return;
  const sal = sec.querySelector(':scope > .saludo'); if (!sal || sal.dataset.movil) return;
  const acts = sal.querySelector('.acts'); if (!acts) return;
  sal.dataset.movil = '1';
  const hijos = [...acts.children];
  // Acción principal «+ …» como botón flotante
  const principal = hijos.find(b => b.tagName === 'BUTTON' && !b.classList.contains('sec') && /^\s*\+/.test(b.textContent));
  if (principal) {
    principal.classList.add('fab'); principal.setAttribute('aria-label', principal.textContent.replace('+', '').trim());
    // v2.95.0: el «+» es el icono de la biblioteca, no un carácter
    principal.dataset.txt = principal.textContent.replace('+', '').trim(); principal.innerHTML = svgIco(ICON_NOM.plus);
    sec.appendChild(principal);
  }
  // El resto, como fila de controles compactos del mismo tamaño
  // Se mantiene la fila aunque quede vacía: otras partes añaden controles después (vista de agenda, equipo…)
  acts.classList.add('chips'); [...acts.children].forEach(b => b.classList.add('chip'));
}
const ORDENAR_EN = { agenda: 'v-agenda', rutas: 'v-rutas', productos: 'v-productos', ventas: 'v-ventas', analitica: 'v-analitica',
  facturacion: 'v-facturacion', config: 'v-config', admin: 'v-admin', pacientes: 'v-pacientes', seguimiento: 'v-seguimiento', duplicados: 'v-duplicados' };
new MutationObserver(() => { if (ORDENAR_EN[TAB]) ordenarCabeceraMovil($(ORDENAR_EN[TAB])); })
  .observe(document.querySelector('main'), { childList: true, subtree: true });
window.addEventListener('resize', () => { if (!ES_MOVIL()) document.querySelectorAll('.fab').forEach(f => { f.textContent = '+ ' + (f.dataset.txt || ''); f.classList.remove('fab'); }); });

/* ---------------- agenda: sin recargar la página en cada acción ---------------- */


/* ---------------- menú «Más» del móvil con el mismo estilo ---------------- */

const ICO_MOD = { inicio: '◉', agenda: '▤', rutas: '➤', directorio: '☰', pacientes: '👥', productos: '📦', seguimiento: '✔︎', ventas: '🛒',
  analitica: '📊', facturacion: '🧾', informe: '◉' };
function abrirMasMovil() {
  const principales = ['inicio', 'agenda', 'rutas', 'directorio'];
  const mods = [...document.querySelectorAll('nav.main [data-t]')]
    .filter(x => !x.classList.contains('hide') && !x.disabled && !principales.includes(x.dataset.t))
    .map(x => [x.dataset.t, x.textContent.replace('Pronto', '').trim()]);
  let s = $('bmas');
  if (!s) { document.body.insertAdjacentHTML('beforeend', '<div id="bmas" class="bmas hide"></div>'); s = $('bmas'); }
  s.innerHTML = `<div class="bmasbox"><div class="bmasasa" aria-hidden="true"></div>
    <div class="bmasgrid">${mods.map(([t, n]) => `<button data-bm="${t}" class="${TAB === t ? 'on' : ''}"><span>${ICO_MOD[t] || '•'}</span>${esc(n)}</button>`).join('')}</div>
    <div class="sm" style="text-align:center;margin-top:8px">Configuración, manual y administración, en tu nombre arriba</div></div>`;
  s.classList.remove('hide');
  requestAnimationFrame(() => s.classList.add('abierto'));
  const cerrar = () => { s.classList.remove('abierto'); setTimeout(() => s.classList.add('hide'), 180); };
  s.onclick = e => { if (e.target === s) cerrar(); };
  s.querySelectorAll('[data-bm]').forEach(x => x.onclick = () => { cerrar(); ir(x.dataset.bm); });
};
pintarBnav = (orig => function () { orig(); const m = $('bmasbtn'); if (m) m.onclick = abrirMasMovil; })(pintarBnav);

/* ---------------- Inicio: tarjeta de bienvenida con lo importante de hoy ---------------- */

async function vistazoHoy() {
  const sal = document.querySelector('#v-inicio .saludo'); if (!sal) return;
  const acts = sal.querySelector('.acts');
  if (acts && !acts.dataset.ico) {
    acts.dataset.ico = '1'; acts.classList.add('icoacts');
  }
  let v = $('vistazo');
  if (!v) { sal.firstElementChild.insertAdjacentHTML('beforeend', '<div id="vistazo" class="vistazo"></div>'); v = $('vistazo'); }
  if (ES_MEDICO()) return;
  const citas = await citasDelDia(hoyISO());
  const abiertas = citas.filter(c => CITA_ABIERTA.includes(c.estado)).sort((a, b) => (a.orden || 0) - (b.orden || 0) || String(a.hora || '').localeCompare(String(b.hora || '')));
  const hechas = citas.filter(c => c.estado === 'Visitada').length, prox = abiertas[0];
  if (!$('vistazo')) return;
  v.innerHTML = citas.length
    ? `<span><b>${num(citas.length)}</b> ${citas.length === 1 ? 'cita' : 'citas'} hoy · <b>${num(hechas)}</b> visitadas</span>
       ${prox ? `<span class="prox">Próxima: <b>${esc(prox.medico || prox.nombre || '')}</b>${prox.hora ? ' · ' + String(prox.hora).slice(0, 5) : ''}</span>` : '<span class="prox">Día completado ✓</span>'}`
    : `<span>Hoy no tienes citas.</span> <button class="lnk" data-irplan>Planifica tu día</button>`;
  const b = v.querySelector('[data-irplan]'); if (b) b.onclick = () => ir('rutas');
}

// Indicadores con icono, explicación breve y, cuando se puede, comparación
const KPI_ICO = { citas: '📅', urgentes: '⚠️', visitas_sem: '📝', visitas_mes: '🗓️', interesados: '✨', sin_contactar: '📇', cartera: '🩺', dups: '🧩',
  sin_visita_60: '⏳', sin_horario: '🕘', uds_mes: '📦', prescriptores: '👥', nuevos_presc: '🌱', activos_90: '🔁', conversion: '📈',
  importe_mes: '€', borradores: '✏️', muestras_mes: '🎁', material_mes: '📚', citas_7d: '📆', visitas_7d: '🧭' };
// v2.105.0: los subtítulos que dependen del vocabulario o del nombre de un estado se calculan al pintarlos (get)
const KPI_TXT = { citas: 'Visitadas de las citas de hoy', urgentes: `${TT('medico', 'p', '', 'l', 'C', 'marcado')} urgentes sin ${TT('visita', 's', '', 'l', 'l')}`, visitas_sem: 'Registradas de lunes a hoy',
  visitas_mes: 'Registradas en el mes', get interesados() { return `En estado «${estadoPapel('interes') || 'interés'}»`; }, sin_contactar: `Todavía sin ${TT('visita', 's', 'primer', 'l', 'l')}`, get cartera() { return `Asignad${terminoDe('medico').g === 'f' ? 'a' : 'o'}s a ti`; },
  dups: 'Fichas por revisar', uds_mes: 'Unidades confirmadas en el mes', prescriptores: 'Con algún pedido este mes', nuevos_presc: 'Primer pedido este mes',
  activos_90: 'Con ventas en 90 días', get conversion() { return `Visitad${terminoDe('medico').g === 'f' ? 'a' : 'o'}s ya en «${estadoPapel('positivo') || 'positivo'}»`; }, importe_mes: 'Base sin IVA del mes', borradores: 'Pedidos sin confirmar',
  sin_visita_60: 'Hace más de 60 días', sin_horario: 'Sin días de atención', muestras_mes: 'Entregadas este mes', material_mes: 'Entregado este mes',
  citas_7d: 'Programadas los próximos 7 días', visitas_7d: 'En los últimos 7 días' };
function indicadoresCompletos() {
  // v2.104.0: cada tarjeta lleva su indicador (data-kid). Antes se emparejaban por posición y, al quitar los que
  // la persona no puede ver, las siguientes tomaban el subtítulo y el icono de otra
  const cards = [...document.querySelectorAll('#kpis .kpi')];
  cards.forEach(k => {
    const c = k.dataset.kid ? { id: k.dataset.kid } : null; if (!c || k.dataset.comp) return;
    k.dataset.comp = '1';
    // v2.92.0: los indicadores sin icono propio (por ejemplo, los de una zona) no llevan caja de icono vacía
    if (KPI_ICO[c.id]) k.insertAdjacentHTML('afterbegin', `<span class="kico" aria-hidden="true">${KPI_ICO[c.id]}</span>`);
    if (KPI_TXT[c.id]) k.insertAdjacentHTML('beforeend', `<em class="kdesc">${esc(KPI_TXT[c.id])}</em>`);
  });
}

/* ---------------- alertas: ventana clara, con qué significa y qué hacer ---------------- */

const EXPLICA_ALERTA = [
  [/sin comercial/i, `Ventas de ${TT('medico', 'p', '', 'l', 'l')} que no están en la cartera de ningún comercial: nadie cobra comisión por ellas.`, `Asigna un comercial desde la ficha ${TT('medico', 's', 'del', 'l', 'l')}.`],
  [/más de una cartera/i, `El mismo ${TT('medico', 's', '', 'l', 'l')} aparece en la cartera de varias personas.`, 'Deja una sola persona desde Administración → Usuarios → Asignar.'],
  [/otra cartera|otro comercial/i, `Un comercial ha visitado ${TT('medico', 'p', '', 'l', 'l')} que lleva otra persona.`, `Revisa si hay que cambiar la cartera o coordinar ${TT('visita', 'p', 'el', 'l', 'l')}.`],
  [/dos personas|14 días/i, `Dos personas han visitado al mismo ${TT('medico', 's', '', 'l', 'l')} en pocos días.`, `Coordina quién lo lleva para no repetir ${TT('visita', 'p', '', 'l', 'l')}.`],
  [/sin médico|sin atribuir|atribuido/i, `Pedidos confirmados que no tienen ${TT('medico', 's', '', 'l', 'l')}: no se atribuyen a nadie.`, `Ábrelos y asigna su ${TT('medico', 's', '', 'l', 'l')} de referencia.`],
  [/stock|caduc/i, 'Productos con pocas unidades o lotes próximos a caducar.', 'Revisa el stock y prepara un pedido de compra.'],
  [/compra|recepci/i, 'Pedidos de compra pendientes de recibir.', 'Registra la recepción cuando llegue la mercancía.']
];
document.addEventListener('click', e => {
  const s = e.target.closest('#iniextra details.alerta2 > summary'); if (!s) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const det = s.parentElement, items = [...det.querySelectorAll(':scope > div > .item, :scope .lista > .item')];
  const titulo = s.textContent.replace(/\s+/g, ' ').replace(/^\s*\d+\s*/, '').replace(/\bequipo\b\s*$/, '').trim();
  const exp = EXPLICA_ALERTA.find(x => x[0].test(titulo)) || [null, 'Casos que conviene revisar.', 'Pulsa cada uno para abrirlo.'];
  items.forEach(x => { x.dataset.alclave = claveAlerta(titulo, x); });
  $('dbody').innerHTML = `<div class="fh"><div><h2>${esc(titulo)}</h2><div class="sm">${num(items.length)} ${items.length === 1 ? 'caso' : 'casos'}</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="alinfo"><div><b>Qué significa</b><span>${esc(exp[1])}</span></div><div><b>Qué hacer</b><span>${esc(exp[2])}</span></div></div>
    ${items.length > 8 ? '<input id="alq" type="search" placeholder="Buscar en la lista" style="margin:10px 0 4px">' : ''}
    <div class="alcards" id="allista"></div><div id="alpag"></div>`;
  let pag = 0;
  const pinta = () => {
    const q = ($('alq') ? $('alq').value : '').trim().toLowerCase(), f = items.filter(x => !q || x.textContent.toLowerCase().includes(q)), tam = 10;
    $('allista').innerHTML = f.slice(pag * tam, pag * tam + tam).map((x, i) => {
      const tit = (x.querySelector('.tx b') || x.querySelector('b') || x).textContent.trim();
      const sub = [...x.querySelectorAll('.tx .sm, .sm')].map(y => y.textContent.trim()).filter(Boolean)[0] || '';
      const cant = (x.querySelector(':scope > b, .n, .cnt') || {}).textContent || '';
      const acc = x.dataset.inificha ? ['Abrir ficha', 'inificha', x.dataset.inificha] : x.dataset.iniped ? ['Abrir pedido', 'iniped', x.dataset.iniped]
        : x.dataset.inistock ? ['Ver stock', 'inistock', x.dataset.inistock] : x.dataset.inicomp ? ['Abrir compra', 'inicomp', x.dataset.inicomp] : null;
      return `<div class="alcard" data-clave="${esc(claveAlerta(titulo, x))}" data-titulo="${esc(titulo)}"><div class="alc1"><b>${esc(tit)}</b>${cant && cant !== tit ? `<span class="pill p-per">${esc(cant)}</span>` : ''}</div>
        ${sub && sub !== tit ? `<div class="sm">${esc(sub)}</div>` : ''}
        <div class="alacts">${acc ? `<button class="btn sec chico" data-alacc="${acc[1]}" data-id="${acc[2]}">${acc[0]}</button>` : ''}<button class="btn sec chico" data-aloc="menu">Ocultar…</button></div>
        <div class="alocmenu hide"><span class="sm">Ocultar este caso:</span><button class="kcfg" data-aloc="7">7 días</button><button class="kcfg" data-aloc="30">30 días</button><button class="kcfg" data-aloc="siempre">Para siempre</button></div></div>`;
    }).join('') || '<div class="vacio">Sin coincidencias.</div>';
    $('allista').querySelectorAll('[data-alacc]').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      if (b.dataset.alacc === 'inificha') { $('dlg').close(); abrirFicha(id); }
      if (b.dataset.alacc === 'iniped') verPedido(id);
      if (b.dataset.alacc === 'inistock') { $('dlg').close(); PSEC = 'stock'; ir('productos'); }
      if (b.dataset.alacc === 'inicomp') editorCompra(id);
    });
    paginador($('alpag'), f.length, pag, p => { pag = p; pinta(); }, () => { pag = 0; pinta(); });
  };
  if ($('alq')) $('alq').oninput = () => { pag = 0; pinta(); };
  pinta(); $('dlg').showModal();
}, true);

/* ---------------- asignar comercial: solo perfiles de tipo Comercial ---------------- */

new MutationObserver(() => {
  ['fcomsel', 'ecom'].forEach(id => {
    const s = $(id); if (!s || s.dataset.soloCom || s.options.length < 2) return;
    s.dataset.soloCom = '1';
    [...s.options].forEach(o => { if (o.value && !/· Comercial$/.test(o.textContent) && !o.selected) o.remove(); });
    [...s.options].forEach(o => o.textContent = o.textContent.replace(/ · Comercial$/, ''));
  });
}).observe(document.body, { childList: true, subtree: true });

/* ---------------- ficha del médico: unidades por periodo ---------------- */


/* ---------------- Analítica: la tabla mensual explicada ---------------- */

pintarTablaAnalitica = (orig => async function () {
  await orig();
  const caja = $('atabla2'); if (!caja || !caja.querySelector('.thead')) return;
  const dim = $('adim') ? $('adim').selectedOptions[0].textContent.toLowerCase() : 'concepto';
  const med = $('amedida') && $('amedida').value === 'importe' ? 'importe sin IVA' : 'unidades vendidas';
  caja.insertAdjacentHTML('afterbegin', `<div class="tabinfo"><b>Tabla mensual de ${esc(med)} por ${esc(dim.replace(/^por /, ''))}</b>
    <span>Cada fila es un ${esc(dim.replace(/^por /, ''))} y cada columna un mes del periodo elegido. La última columna suma la fila y la última fila suma cada mes. «·» = sin ventas ese mes. Cuanto más intenso el azul, más alto el valor.</span></div>`);
  caja.querySelectorAll('.thead .tcell.th').forEach(c => { const m = c.textContent.match(/^(\d{2})\/(\d{2})$/); if (m) c.textContent = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][+m[1] - 1] + ' ' + m[2]; });
  const filas = [...caja.querySelectorAll('.trow:not([data-fijo])')], vals = [];
  filas.forEach(f => [...f.children].slice(1, -1).forEach(c => vals.push(parseFloat(c.textContent.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0)));
  const max = Math.max(1, ...vals);
  filas.forEach(f => [...f.children].slice(1, -1).forEach(c => {
    const v = parseFloat(c.textContent.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
    if (v) c.style.background = `rgba(46,134,201,${(0.08 + v / max * 0.42).toFixed(2)})`;
  }));
})(pintarTablaAnalitica);

/* ---------------- Manual: buscador con resultados directos ---------------- */


/* ---------------- Configuración: todo en un único sitio ---------------- */


/* ---------------- Administración en el móvil: cada persona como tarjeta ---------------- */

new MutationObserver(() => {
  if (TAB !== 'admin' || !ES_MOVIL() || ADM_SEC !== 'usuarios') return;
  document.querySelectorAll('#admcuerpo .lista > .item').forEach(it => {
    if (it.dataset.movil) return; it.dataset.movil = '1';
    const acts = it.querySelector('.acts'); if (!acts) return;
    acts.classList.add('hide');
    it.insertAdjacentHTML('beforeend', '<button class="btn sec umas" aria-label="Acciones">Gestionar</button>');
    it.querySelector('.umas').onclick = () => {
      const nombre = it.querySelector('.tx b').textContent;
      $('dbody').innerHTML = `<div class="fh"><div><h2>${esc(nombre)}</h2><div class="sm">${esc(it.querySelector('.tx .sm').textContent)}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
        <div class="accsheet">${[...acts.querySelectorAll('button')].map((b, i) => `<button class="btn sec" data-accn="${i}">${b.innerHTML}</button>`).join('')}</div>`;
      $('dlg').showModal();
      $('dbody').querySelectorAll('[data-accn]').forEach(x => x.onclick = () => { const o = acts.querySelectorAll('button')[+x.dataset.accn]; $('dlg').close(); setTimeout(() => o.click(), 50); });
    };
  });
}).observe(document.querySelector('main'), { childList: true, subtree: true });


