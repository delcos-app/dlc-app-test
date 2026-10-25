// componentes/lista.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function paginarListas() {
  document.querySelectorAll('.pag[data-auto]').forEach(p => { if (!p.__lista || !p.__lista.isConnected) p.remove(); });
  const grupos = new Map();
  document.querySelectorAll('main .item, main .trow, dialog[open] .item, dialog[open] .trow').forEach(r => {
    const p = r.parentElement;
    if (!p || r.hasAttribute('data-fijo') || p.closest(PAG_EXCLUIR)) return;
    if (!grupos.has(p)) grupos.set(p, []);
    grupos.get(p).push(r);
  });
  grupos.forEach((filas, p) => {
    const tam = tamPagina();
    if (filas.length <= TAMANOS[0]) {
      if (p.__pagEl) { p.__pagEl.remove(); p.__pagEl = null; filas.forEach(f => f.style.display = ''); }
      return;
    }
    if (p.id && PAG_MEM[p.id] != null && p.__pagina == null) p.__pagina = PAG_MEM[p.id];   // listas que conservan la página
    else if (p.__pagFilas !== filas.length || p.__pagPrimera !== filas[0]) {
      if (!(p.id && PAG_MEM[p.id] != null)) p.__pagina = 0;
    }
    p.__pagFilas = filas.length; p.__pagPrimera = filas[0];
    const paginas = Math.ceil(filas.length / tam);
    if (p.__pagina >= paginas) p.__pagina = paginas - 1;
    if (p.id) PAG_MEM[p.id] = p.__pagina;
    const estado = [filas.length, p.__pagina, tam].join('|');
    if (p.__pagEl && p.__pagEl.isConnected && p.__pagEstado === estado) return;   // nada que cambiar
    p.__pagEstado = estado;
    filas.forEach((f, i) => { f.style.display = Math.floor(i / tam) === p.__pagina ? '' : 'none'; });
    if (!p.__pagEl || !p.__pagEl.isConnected) {
      p.__pagEl = document.createElement('div');
      p.__pagEl.setAttribute('data-auto', '');
      p.__pagEl.className = 'pag';
      p.__pagEl.__lista = p;
      p.insertAdjacentElement('afterend', p.__pagEl);
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = pagHTML(filas.length, p.__pagina, tam);
    p.__pagEl.innerHTML = tmp.firstElementChild.innerHTML;
    p.__pagEl.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => {
      p.__pagina = +b.dataset.pg; p.__pagEstado = null; paginarListas();
      const r = p.getBoundingClientRect();
      if (r.top < 0) p.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    p.__pagEl.querySelector('[data-pgtam]').onchange = e => {
      fijarTam(+e.target.value);
      document.querySelectorAll('.pag[data-auto]').forEach(x => { if (x.__lista) x.__lista.__pagEstado = null; });
      paginarListas();
    };
  });
}

function paginarRejilla(cont, filas, pagKey, pintaFila, cabecera, clase) {
  const tam = tamPagina(), pag = Math.min(window[pagKey] || 0, Math.max(0, Math.ceil(filas.length / tam) - 1));
  window[pagKey] = pag;
  cont.innerHTML = `<div class="dgrid-wrap"><div class="dgrid ${clase}">${cabecera}${filas.slice(pag * tam, pag * tam + tam).map(pintaFila).join('')}</div></div><div class="pagz"></div>`;
  paginador(cont.querySelector('.pagz'), filas.length, pag, p => { window[pagKey] = p; paginarRejilla(cont, filas, pagKey, pintaFila, cabecera, clase); }, () => { window[pagKey] = 0; paginarRejilla(cont, filas, pagKey, pintaFila, cabecera, clase); });
}

// Esqueleto de la tabla: mismas filas y alturas que la tabla cargada
function plEsqueleto(tab, conCab) {
  const anchos = tab === 'directorio' ? colsConfig().filter(c => c.on).map(c => c.w) : [200, 90, 110, 110, 170, 130, 130, 110, 70, 60, 100];
  const barra = (w, r, i) => `<span class="plskc" style="width:${w}px;min-width:${w}px"><i class="plsk" style="width:${[70, 55, 80, 60, 45, 65, 50][(i + r) % 7]}%"></i></span>`;
  const fila = r => `<div class="plskr">${anchos.map((w, i) => barra(w, r, i)).join('')}<span class="plcard"><i class="plsk" style="width:62%"></i><i class="plsk" style="width:44%"></i></span></div>`;
  return `<div class="plsktab">${conCab ? `<div class="plskh">${anchos.map(w => `<span class="plskc" style="width:${w}px;min-width:${w}px"><i class="plsk" style="width:46%"></i></span>`).join('')}</div>` : ''}${Array.from({ length: 8 }, (_, r) => fila(r)).join('')}</div>`;
}

function plObservar(tab) {
  const sec = $('v-' + tab); if (!sec || PL_OBS[tab]) return;
  let pend = false;
  let n = 0, t0 = 0;
  const mo = new MutationObserver(() => {
    if (pend) return;
    // Freno: más de 30 ajustes en 100 ms es que otra parte de la pantalla responde a cada cambio; se espera al siguiente fotograma
    const ya = performance.now(); if (ya - t0 > 100) { t0 = ya; n = 0; }
    if (++n > 30) { if (n === 31) requestAnimationFrame(() => { n = 0; t0 = performance.now(); plSync(tab); }); return; }
    pend = true;
    queueMicrotask(() => { pend = false; window.PL_N = (window.PL_N || 0) + 1; mo.disconnect(); try { plSync(tab); } finally { mo.takeRecords(); mo.observe(sec, { childList: true, subtree: true, characterData: true }); } });
  });
  PL_OBS[tab] = mo; mo.observe(sec, { childList: true, subtree: true, characterData: true });
}

function plCerrarPop() { document.querySelectorAll('.plpop').forEach(p => p.remove()); }

function plPop(btn, items) {
  plCerrarPop();
  const r = btn.getBoundingClientRect();
  const p = document.createElement('div'); p.className = 'plpop'; p.setAttribute('role', 'menu');
  p.innerHTML = (items.length > 12 ? '<input type="search" class="plpopq" placeholder="Buscar…" aria-label="Buscar">' : '') +
    `<div class="plpopl">${items.map((x, i) => `<button type="button" role="menuitemradio" aria-checked="${!!x.on}" class="${x.on ? 'on' : ''}" data-ppi="${i}">${esc(x.t)}</button>`).join('')}</div>`;
  document.body.appendChild(p);
  if (ES_MOVIL()) p.classList.add('plhoja');
  else { const izq = Math.min(Math.max(8, r.left), innerWidth - p.offsetWidth - 8); Object.assign(p.style, { left: izq + 'px', top: (r.bottom + 6 + scrollY) + 'px' }); }
  p.querySelectorAll('[data-ppi]').forEach(b => b.onclick = () => { plCerrarPop(); items[+b.dataset.ppi].fn(); });
  const q = p.querySelector('.plpopq');
  if (q) { q.oninput = () => { const v = normalizar(q.value); p.querySelectorAll('[data-ppi]').forEach(b => b.classList.toggle('hide', !!v && !normalizar(b.textContent).includes(v))); }; if (!PANTALLA_TACTIL) q.focus(); }
}

// La configuración de una pantalla en este momento (las de varias secciones, según la abierta)
function plCfg(tab) {
  const x = PL[tab]; if (!x) return null;
  if (PL_SECC[tab]) { const k = PL_SECC[tab](); return k ? x[k] || null : null; }
  return x;
}

function plVigilar(tab) {
  const sec = $('v-' + tab); if (!sec || PL_OBSEL[tab] === sec) return;
  if (PL_OBS[tab]) { PL_OBS[tab].disconnect(); delete PL_OBS[tab]; }
  PL_OBSEL[tab] = sec; plObservar(tab);
}

function plAjenos(sec, clave) {
  const pan = sec.querySelector(':scope > .htpanel'), prop = pan && pan.querySelector('.htpropios'); if (!prop) return;
  let fuera = pan.querySelector(':scope > .plajenos');
  if (!fuera) { fuera = document.createElement('div'); fuera.className = 'plajenos hide'; pan.appendChild(fuera); }
  const ajenos = new Set(PL_AJENOS[clave] || []);
  [...prop.children, ...fuera.children].forEach(d => {
    const s = d.querySelector('select'), id = d.id || (s && s.id) || '', ajeno = ajenos.has(id);
    if (ajeno && d.parentElement !== fuera) fuera.appendChild(d);
    else if (!ajeno && d.parentElement === fuera) prop.appendChild(d);
  });
}

function ordMemValor(x, c) { const v = typeof c === 'function' ? c(x) : x[c]; return v == null || v === '' ? null : v; }

function ordMemComparar(a, b) {
  if (a == null || b == null) return (a == null) - (b == null);   // vacíos al final
  if (typeof a === 'number' || (typeof a === 'string' && /^-?\d+(\.\d+)?$/.test(a) && /^-?\d+(\.\d+)?$/.test(String(b)))) return (+a) - (+b);
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

function ordMemOrdenar(tipo, l) {
  const o = HT_ORDEN[tipo], cfg = ORD_MEM[tipo]; if (!o || !cfg || !Array.isArray(l)) return l;
  const c = cfg.campos[o.i]; if (c == null) return l;
  const vacio = v => v == null;
  return l.map((x, k) => [x, k]).sort((p, q) => {
    const a = ordMemValor(p[0], c), b = ordMemValor(q[0], c);
    if (vacio(a) || vacio(b)) return (vacio(a) - vacio(b)) || (p[1] - q[1]);   // los vacíos siempre al final
    return o.dir * ordMemComparar(a, b) || (p[1] - q[1]);
  }).map(p => p[0]);
}

function tamPagina() { const n = +localStorage.getItem(TAMKEY()); return TAMANOS.includes(n) ? n : 20; }

function fijarTam(n) { localStorage.setItem(TAMKEY(), String(n)); }

function pagHTML(total, pagina, tam) {
  const paginas = Math.max(1, Math.ceil(total / tam));
  const nums = [];
  for (let i = 0; i < paginas; i++) {
    if (i === 0 || i === paginas - 1 || Math.abs(i - pagina) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const desde = total ? pagina * tam + 1 : 0, hasta = Math.min(total, (pagina + 1) * tam);
  return `<div class="pag">
    <span>${num(desde)}–${num(hasta)} de ${num(total)}</span>
    <span class="pbtns">
      <button data-pg="${pagina - 1}" ${pagina <= 0 ? 'disabled' : ''} aria-label="Página anterior">‹</button>
      ${nums.map(n => n === '…' ? '<span class="sm">…</span>'
        : `<button data-pg="${n}" aria-current="${n === pagina}">${n + 1}</button>`).join('')}
      <button data-pg="${pagina + 1}" ${pagina >= paginas - 1 ? 'disabled' : ''} aria-label="Página siguiente">›</button>
    </span>
    <span class="ptam">Mostrar <select class="chico" data-pgtam>${TAMANOS.map(n =>
      `<option value="${n}" ${n === tam ? 'selected' : ''}>${n}</option>`).join('')}</select></span></div>`;
}

function anchosGuardados(tipo) { try { return JSON.parse(localStorage.getItem(claveAnchos(tipo))) || null; } catch (e) { return null; } }

// Pasa los bloques de tarjetas de la pantalla a una tabla (cada vez que la pantalla los vuelve a pintar)
function blqConvertir(tab) {
  const o = BLQ[tab], sec = $('v-' + tab), caja = sec && sec.querySelector('#cfgcuerpo'); if (!o || !caja) return;
  const items = [...caja.querySelectorAll('.lista > .item[data-' + o.attr + ']')];
  const yaTabla = caja.querySelector('.dgrid.blq-' + tab);
  if (!items.length && (yaTabla || !caja.querySelector('.cirpag, .evpag'))) return;
  // Acciones: la principal a la cabecera; las demás, al «⋯» (también en la cabecera, ocultas)
  const sal = sec.querySelector(':scope > .saludo');
  let acts = sal && sal.querySelector(':scope > .acts');
  if (sal && !acts) { sal.insertAdjacentHTML('beforeend', '<div class="acts"></div>'); acts = sal.querySelector(':scope > .acts'); }
  const cab = caja.querySelector('.evcab');
  // las de la vez anterior (también el «+» del móvil, que va al final de la sección) se quitan: si no, se repetirían sus id
  if (cab && acts) { sec.querySelectorAll('[data-plmov]').forEach(b => b.remove()); [...cab.querySelectorAll('button')].forEach(b => { b.dataset.plmov = '1'; acts.appendChild(b); }); cab.remove(); }
  // Filas: una por registro, con los bloques en que sale
  const filas = new Map(), grupos = [];
  caja.querySelectorAll('section.card, .card').forEach(card => {
    const h = card.querySelector('h2'), g = h ? plTxt(h).replace(/\s*·\s*[\d.]+$/, '') : o.def;
    const its = [...card.querySelectorAll('.lista > .item[data-' + o.attr + ']')]; if (!its.length) return;
    if (!grupos.includes(g)) grupos.push(g);
    its.forEach(b => { const k = b.dataset[o.attr]; if (filas.has(k)) { filas.get(k).g.add(g); b.remove(); } else filas.set(k, { b, g: new Set([g]) }); });
  });
  const vacio = caja.querySelector('.vacio');
  const nota = [...caja.querySelectorAll('.cirpag > p.sm, .evpag > p.sm')];
  const wrap = document.createElement('div'); wrap.className = 'dgrid-wrap';
  wrap.innerHTML = `<div class="dgrid blq-${tab}"><div class="dh">${o.cols.map(([t, k]) => `<span class="${k}">${esc(t)}</span>`).join('')}</div></div>`;
  const g = wrap.firstElementChild;
  filas.forEach(({ b, g: gs }) => {
    const cel = o.celdas(b), click = b.onclick;
    b.className = 'dr'; b.innerHTML = cel.map((x, i) => `<span class="${o.cols[i][1]}">${x || '<span class="vac">—</span>'}</span>`).join('');
    b.dataset.grupos = [...gs].join('|'); b.onclick = click; g.appendChild(b);
  });
  if (!filas.size) wrap.innerHTML = `<div class="vacio">${esc(vacio ? plTxt(vacio) : 'Todavía no hay nada aquí.')}</div>`;
  caja.innerHTML = ''; nota.forEach(p => caja.appendChild(p)); caja.appendChild(wrap);
  // Bloque elegido (filtro rápido y banda de indicadores)
  if (PLG[tab] && !grupos.includes(PLG[tab])) PLG[tab] = '';
  let sel = $('plg-' + tab);
  if (!sel) { sec.insertAdjacentHTML('beforeend', `<div class="plgsel hide"><label for="plg-${tab}">${esc(o.grupo)}</label><select id="plg-${tab}"></select></div>`); sel = $('plg-' + tab); sel.onchange = () => { PLG[tab] = sel.value; blqFiltrar(tab); }; }
  sel.innerHTML = '<option value="">Todos</option>' + (grupos.length > 1 ? grupos.map(x => `<option ${PLG[tab] === x ? 'selected' : ''}>${esc(x)}</option>`).join('') : '');
  let band = $('plgb-' + tab);
  if (!band) { band = document.createElement('div'); band.id = 'plgb-' + tab; band.className = 'plgband'; sec.appendChild(band); }
  const cuenta = x => [...filas.values()].filter(f => f.g.has(x)).length;
  band.innerHTML = grupos.length > 1 ? grupos.map(x => `<button type="button" class="plk ${PLG[tab] === x ? 'on' : ''}" data-plg="${esc(x)}"><span class="plkt">${esc(x)}</span><b>${num(cuenta(x))}</b><small>${cuenta(x) === 1 ? '1 ' + esc(o.que.replace(/s$/, '')) : esc(o.que)}</small></button>`).join('') : '';
  band.classList.toggle('hide', grupos.length < 2);
  blqFiltrar(tab);
}

function blqFiltrar(tab) {
  const v = PLG[tab] || '', sec = $('v-' + tab); if (!sec) return;
  sec.querySelectorAll('.dgrid.blq-' + tab + ' > .dr').forEach(r => r.classList.toggle('plgfuera', !!v && !(r.dataset.grupos || '').split('|').includes(v)));
  sec.querySelectorAll('[data-plg]').forEach(b => b.classList.toggle('on', b.dataset.plg === v));
  const s = $('plg-' + tab); if (s && s.value !== v) s.value = v;
  const cnt = sec.querySelector('.plcnt'); if (cnt) { cnt.dataset.h = ''; }
}

const itemHTML = (id, ico, clase, titulo, sub) =>
  `<button class="item" data-id="${id}"><span class="ic ${clase || ''}">${ico}</span>
   <span class="tx"><b>${esc(titulo)}</b><span class="sm">${sub}</span></span></button>`;


const colKey = () => 'dlc-cols-' + (PERFIL ? PERFIL.id : '');

// Las columnas de Cuentas están en src/app/screens/accounts/list (v2.406.0); estos nombres los usan los campos personalizados y la lista
const colsGuardar = c => window.delcos.screens.accounts.saveColumns(c);
function colsConfig() { return window.delcos.screens.accounts.columnSettings(); }
function abrirColumnas() { window.delcos.screens.accounts.openColumnsPanel(() => buscar(true)); }

const TAMKEY = () => 'dlc-tam-' + (PERFIL ? PERFIL.id : '');

const TAMANOS = [20, 50, 100];

/* Paginación automática de cualquier otra lista o tabla con más de 20 filas. */
const PAG_MEM = {};

const PAG_EXCLUIR = '.carsel, .picker, #lista, #slista, #kpis, .gsug, .umenu, .dl-menu, #tools, .opciones, .chips, .pag, #c-agenda, #c-acciones, #c-urgentes, #c-ultimas, #c-recom, #c-pend';

// Tablas que se ordenan en la base: qué clave usa cada columna (por su posición o su nombre)
const ORD_SRV = {
  peds2: (i, n) => i === 2 ? 'profesional' : ({ Fecha: 'fecha', Cliente: 'cliente', Comercial: 'comercial', 'Uds.': 'unidades', Base: 'base', Total: 'total', Estado: 'estado' })[n] || null,
  pacs: (i, n) => i === 6 ? 'profesional' : ({ Cliente: 'nombre', Tipo: 'tipo', 'DNI / CIF': 'nif', Email: 'email', 'Población': 'municipio', Comercial: 'comercial', Pedidos: 'pedidos', 'Uds.': 'unidades', 'Último pedido': 'ultimo' })[n] || null
};

const ORD_DIR = { nombre: 'nombre', especialidad: 'especialidad', centro_nombre: 'lugar', municipio: 'municipio', ultima_visita: 'reciente', estado_comercial: 'estado' };

/* ============================================================
   v2.236.0 · Modelo de página «Lista» (variante A elegida por Eric): cabecera con la acción principal y «⋯»,
   indicadores que filtran, barra con buscador, filtros rápidos, «Filtros», «Columnas» y el recuento, tabla con su pie
   y tarjetas en el móvil. Al llegar no se tapa la pantalla: se ve el esqueleto con la misma forma. Primero en
   Contactos (directorio) y Clientes; se monta encima de lo que ya pintan sus funciones, sin cambiar su lógica.
   ============================================================ */
const plIco = (...n) => svgIco(n.map(k => ICON_NOM[k] || ICON_EMOJI[k]).find(Boolean) || '');

const PL_KPI = {};   // indicadores por pantalla: {t, epoca, datos}

const PL = {
  directorio: {
    que: () => TT('medico', 'p', '', 'l', 'l'),
    nuevo: () => $('nuevoBtn'),
    textoNuevo: () => 'Añadir ' + TT('medico', 's', '', 'l', 'l'),
    cuerpo: () => $('lista'), tabla: () => $('tabla'), pie: () => $('dirpag'), cuenta: () => $('cuenta'),
    conDatos: el => !!el.querySelector('.trow, .vacio'),
    rapidos: [['ftipo', 'Tipo'], ['fest', 'Estado'], ['fcom', ''], ['fprov', 'Provincia'], ['fmuni', 'Municipio'], ['fesp', 'Especialidad']],
    q: () => F.q || '',
    buscarQ: v => { F.q = v; buscar(true); },
    buscaTxt: () => 'Buscar cuentas',
    nKpis: 5,   // v2.304.0: el esqueleto con los mismos cinco huecos
    // v2.296: un campo personalizado vaciado se quedaba como clave y contaba como filtro sin verse en el panel
    activos: () => ['tipo', 'prov', 'muni', 'esp', 'est', 'rep', 'com'].filter(k => F[k]).length + ['urg', 'mios', 'sin'].filter(k => F[k]).length + Object.values(F.campos || {}).filter(filtroConValor).length,
    quitar: () => {
      Object.assign(F, { q: '', tipo: '', prov: '', muni: '', esp: '', est: '', urg: false, mios: false, sin: false, com: '', rep: '', campos: {} });
      ['ftipo', 'fest', 'fprov', 'fmuni', 'fesp', 'fcom', 'frep', 'q'].forEach(id => { if ($(id)) $(id).value = ''; });
      const t = $('tools'); if (t && t.classList.contains('abierto') && HERR_CTX === 'directorio') t.classList.remove('abierto');
      cargarFiltros(); buscar(true);
    },
    filtros: () => { const b = $('dirtools'); if (b) b.click(); },
    columnas: () => abrirColumnas(),
    mapa: () => $('mapaBtn'),
    mas: () => [['dircalidad', 'Calidad del dato'], ['cercaBtn', 'Cerca de mí']],
    kpis: async () => {
      const t = x => RPC_ORIG('buscar_cuentas', { q: null, lim: 1, desplaz: 0, ...x }).then(r => (r.data && r.data.total) || 0, () => 0);
      // v2.304.0: profesionales y centros por separado (antes una sola cifra con el nombre de los profesionales que contaba también los centros)
      const [pro, cen, urg, sin, mios] = await Promise.all([t({ f_tipo: 'Persona' }), t({ f_tipo: 'Centro' }), t({ f_urgentes: true }), t({ f_sin_visitar: true }), t({ f_mios: true })]);
      return [{ k: 'Persona', t: TT('medico', 'p', '', 'l', 'C'), n: pro, s: 'en total' }, { k: 'Centro', t: 'Centros', n: cen, s: 'en total' }, { k: 'urg', t: 'Urgentes', n: urg, s: 'marcados como urgentes' },
        { k: 'sin', t: 'Sin visitar nunca', n: sin, s: 'todavía sin ' + TT('visita', 'p', '', 'l', 'l') }, { k: 'mios', t: 'De mi cartera', n: mios, s: 'asignados a ti' }];
    },
    kpiOn: k => k === 'Persona' || k === 'Centro' ? F.tipo === k : !!F[k],
    kpiPulsar: k => { if (k === 'Persona' || k === 'Centro') { F.tipo = F.tipo === k ? '' : k; if ($('ftipo')) $('ftipo').value = F.tipo; } else F[k] = !F[k]; buscar(true); },
    card: null   // las tarjetas del directorio las pone rowHtml (src/app/screens/accounts/list/table.ts), con los datos de la ficha
  },
  pacientes: {
    que: () => 'clientes',
    nuevo: () => $('pacnuevo'),
    cuerpo: () => $('paclista'), tabla: () => $('paclista'), pie: () => $('pacpag'), cuenta: () => $('paccuenta'),
    conDatos: el => !!el.querySelector('.dgrid, .vacio'),
    rapidos: [['pactipo', 'Tipo'], ['pacped', 'Pedidos'], ['pacmun', 'Población']],
    q: () => PAC.q || '',
    buscarQ: v => { const i = $('pacq'); if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } else { PAC.q = v; PAC.pagina = 0; listaPacientes(); } },
    activos: () => (PAC.tipo ? 1 : 0) + (PAC.pedidos ? 1 : 0) + (PAC.municipio ? 1 : 0) + (PAC.medico ? 1 : 0) + Object.keys(PAC.campos || {}).length,
    filtros: () => { const b = document.querySelector('#v-pacientes .htbtn'); if (b) b.click(); },
    columnas: () => { const b = document.querySelector('#v-pacientes .htbtn'); if (!b) return; b.click(); setTimeout(() => { const c = $('tools') && $('tools').querySelector('.t2abrir'); if (c) c.click(); }, 80); },
    mapa: () => null,
    mas: () => [],
    kpis: async () => {
      const t = x => RPC_ORIG('clientes_lista', { q: null, p_medico: null, lim: 1, desplaz: 0, p_tipo: null, p_pedidos: null, p_municipio: null, ...x }).then(r => (r.data && r.data.total) || 0, () => 0);
      const [tot, con, sin, emp] = await Promise.all([t({}), t({ p_pedidos: 'con' }), t({ p_pedidos: 'sin' }), t({ p_tipo: 'Empresa' })]);
      return [{ k: 'tot', t: 'Clientes', n: tot, s: 'en total' }, { k: 'con', t: 'Con pedidos', n: con, s: 'han comprado alguna vez' },
        { k: 'sin', t: 'Sin pedidos', n: sin, s: 'todavía sin compras' }, { k: 'emp', t: 'Empresas', n: emp, s: 'centros, tiendas y otras' }];
    },
    kpiOn: k => k === 'tot' ? !PAC.tipo && !PAC.pedidos : k === 'emp' ? PAC.tipo === 'Empresa' : PAC.pedidos === k,
    kpiPulsar: k => {
      if (k === 'tot') { PAC.tipo = ''; PAC.pedidos = ''; }
      else if (k === 'emp') PAC.tipo = PAC.tipo === 'Empresa' ? '' : 'Empresa';
      else PAC.pedidos = PAC.pedidos === k ? '' : k;
      if ($('pactipo')) $('pactipo').value = PAC.tipo || ''; if ($('pacped')) $('pacped').value = PAC.pedidos || '';
      PAC.pagina = 0; listaPacientes();
    },
    // Tarjeta del móvil a partir de la fila de la tabla: nombre, población y teléfono, y el tipo a la derecha
    card: dr => { const c = dr.children, tx = i => c[i] ? c[i].textContent.trim() : '';
      return { a: tx(0), b: [tx(5), tx(3)].filter(x => x && x !== '—').join(' · '), c: c[1] ? c[1].innerHTML : '' }; }
  }
};

// Sin nombre propio, el filtro rápido usa la etiqueta de su campo (así no se escribe aquí el nombre de un rol)
const plEtiqueta = id => { const l = document.querySelector(`label[for="${id}"]`); return l ? l.textContent.trim() : ''; };

// Un observador por pantalla: cada vez que la pantalla se repinta, la plantilla se ajusta antes de que se vea
const PL_OBS = {};

// Buscador de la barra
let PL_TQ;

/* ============================================================
   v2.237.0 · Inicio y Agenda aparecen de una vez (aviso de Eric): al abrir la app la primera pantalla se enseñaba
   sin esperar (salían los indicadores antiguos y luego el mosaico) y la Agenda se daba por lista antes de tener la
   cinta y «Tu semana». Inicio enseña desde el principio el esqueleto del mosaico; la Agenda sigue con el cargador hasta tener
   la cinta y «Tu semana» (como mucho 10 s).
   ============================================================ */
// Tope de espera por pantalla: en el móvil con mala cobertura la Agenda encadena varias consultas
const LISTA_ESPERA = { agenda: 10000 };

const LISTA_PARA = {
  // Inicio: el mosaico ya pintado (si la persona no tiene mosaico, basta con que no queden esqueletos)
  inicio: s => !!s.querySelector('#inimos > *') || (!s.classList.contains('conmos') && !s.querySelector('.ksk, .skel') && performance.now() - (s.__t0 || 0) > 1500),
  // Agenda en vista de día: la cinta y «Tu semana» con sus días (o, si no llega, un respiro de 0,8 s tras la cinta)
  // v2.248.0: la vista del día avisa cuando está pintada entera (dataset.listo)
  agenda: s => (typeof AG_MODO !== 'undefined' && AG_MODO !== 'dia') || s.dataset.listo === '1'
};

/* ============================================================
   v2.238.0 · Modelo «Lista» en Ventas: Pedidos, Oportunidades, Compras, Proveedores, Facturas, Productos, Servicios y Stock.
   La plantilla pasa a ser genérica: cada pantalla dice sus filtros rápidos (selectores), su buscador si lo tiene, dónde está su
   lista y su paginador. Los indicadores que filtran (Operativa de Pedidos) van en la banda; los totales (.kpis.vtot) pasan a una
   franja de resumen compacta encima de la tabla. Sin buscador propio, el de la barra filtra la tabla («Contiene»).
   ============================================================ */
// Pantallas con varias secciones: la configuración depende de la sección abierta (null = sin plantilla, p. ej. Configuración de Facturación)
const PL_SECC = {
  ventas: () => typeof PEDSEC === 'undefined' ? null : ({ ventas: 'pedidos', llamadas: 'oport', compras: 'compras', proveedores: 'prov' })[PEDSEC] || null,
  facturacion: () => typeof FSEC !== 'undefined' && FSEC === 'facturas' ? 'facturas' : null,
  productos: () => typeof PSEC === 'undefined' ? null : ({ catalogo: 'prods', servicios: 'servs', stock: 'stock' })[PSEC] || 'prods'
};

// Base común de las listas en rejilla (.dgrid) con «Filtros y columnas»
const plRejilla = o => Object.assign({
  rejilla: true,
  nuevo: () => document.querySelector(`#v-${o.tab} > .saludo .acts > .btn:not(.sec):not(.htbtn):not(.fab)`) || document.querySelector(`#v-${o.tab} .fab`),
  cuerpo: () => o.lista ? $(o.lista) : null,
  tabla: () => { const w = document.querySelector(`#v-${o.tab} .dgrid-wrap`); return (o.lista && $(o.lista)) || w; },
  pie: () => o.pag ? $(o.pag) : null,
  cuenta: () => null,
  conDatos: el => !!el.querySelector('.dgrid, .vacio'),
  rapidos: [],
  q: () => { const i = o.buscador && $(o.buscador); if (i) return i.value || ''; const g = document.querySelector(`#v-${o.tab} .dgrid`); return g ? ((HT_ESTADO[htTipo(g)] || {}).texto || '') : ''; },
  buscarQ: v => {
    const i = o.buscador && $(o.buscador);
    if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); return; }
    const g = document.querySelector(`#v-${o.tab} .dgrid`); if (!g) return;
    const t = htTipo(g); HT_ESTADO[t] = HT_ESTADO[t] || { texto: '', facetas: {} }; HT_ESTADO[t].texto = v; htAplicarFiltros(g);
    const sec = $('v-' + o.tab); if (sec) { htContador(sec); }
  },
  activos: () => { const sec = $('v-' + o.tab); const n = sec ? sec.querySelectorAll('.htchips .htchip').length : 0; return n; },
  filtros: () => { const b = document.querySelector(`#v-${o.tab} .htbtn`); if (b) b.click(); },
  columnas: () => { const b = document.querySelector(`#v-${o.tab} .htbtn`); if (!b) return; b.click(); setTimeout(() => { const c = $('tools') && $('tools').querySelector('.t2abrir'); if (c) c.click(); }, 80); },
  mapa: () => null,
  // «⋯»: los botones secundarios de la cabecera (menos «Filtros y columnas»)
  mas: () => [...document.querySelectorAll(`#v-${o.tab} > .saludo .acts > button.sec:not(.htbtn):not(.plmas)`)].filter(b => !b.classList.contains('hide') && !(o.extra || []).some(([id]) => id === b.id))
    .map(b => { if (!b.id) b.id = 'plb' + Math.random().toString(36).slice(2, 8); return [b.id, (b.textContent.trim() || b.title || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ')]; })
    .concat((o.extra || []).filter(([id]) => $(id))),
  kpis: null, kpiOn: () => false, kpiPulsar: () => {},
  // Tarjeta del móvil: la primera celda, las dos siguientes con texto y la pastilla de estado (si la hay) a la derecha
  card: dr => {
    const c = [...dr.children].filter(x => !x.classList.contains('plcard')), tx = x => x ? x.textContent.trim().replace(/\s+/g, ' ') : '';
    const est = c.find(x => x.querySelector('.pill, .est, .cirest, [class*="estado"]'));
    const resto = c.slice(1).filter(x => x !== est).map(tx).filter(x => x && x !== '—').slice(0, 2);
    return { a: tx(c[0]), b: resto.join(' · '), c: est ? est.innerHTML : '' };
  }
}, o);

const plSel = id => id && /^[#.]/.test(id) ? document.querySelector(id) : $(id);

const plEtiq = id => { const s = plSel(id); if (!s) return ''; const l = (s.id && document.querySelector(`label[for="${s.id}"]`)) || (s.closest('div') && s.closest('div').querySelector(':scope > label')); return l ? l.textContent.trim() : ''; };

/* ============================================================
   v2.239.0 · Modelo «Lista» en Eventos, Intervenciones, Concursos y Parque instalado: los bloques de tarjetas pasan a una tabla con
   las mismas filas (cada fila conserva su botón y lo que abre). Los bloques (Próximos, Pasados, Reposiciones…) pasan a ser
   indicadores que filtran y un filtro rápido; si una fila estaba en dos bloques, sale una vez y cuenta en los dos.
   La acción principal sube a la cabecera; las demás, al «⋯».
   ============================================================ */
const PLG = {};   // bloque elegido por pantalla

const plTxt = el => el ? el.textContent.trim().replace(/\s+/g, ' ') : '';

const plSm = el => { const s = el && el.querySelector('.tx .sm, .sm'); return plTxt(s); };

const BLQ = {
  eventos: { attr: 'ev', que: 'eventos', grupo: 'Cuándo', def: 'Eventos',
    cols: [['Evento', ''], ['Fecha', ''], ['Tipo', ''], ['Lugar', ''], ['Asistentes', 'num'], ['Gasto', 'num']],
    celdas: b => {
      const p = plSm(b).split(' · '), hora = p.find(x => /^\d{1,2}:\d{2}$/.test(x)), tipo = p.find(x => EV_TIPOS.includes(x));
      const asis = p.find(x => /asistente/.test(x)) || '', lugar = p.filter((x, i) => i > 0 && x !== hora && x !== tipo && x !== asis).join(' · ');
      return [`<b>${esc(plTxt(b.querySelector('.tx b')))}</b>`, esc(p[0] + (hora ? ' · ' + hora : '')), esc(tipo || '—'), esc(lugar || '—'), esc((asis.match(/\d+/) || ['0'])[0]), esc(plTxt(b.querySelector('.evtot')) || '—')];
    } },
  cirugias: { attr: 'cir', que: 'intervenciones', grupo: 'Bloque', def: 'Intervenciones',
    cols: [['Fecha', ''], ['Intervención', ''], ['Equipo y lugar', ''], ['Estado', '']],
    celdas: b => [esc(plTxt(b.querySelector('.cirf b')) + (plTxt(b.querySelector('.cirf .sm')) ? ' · ' + plTxt(b.querySelector('.cirf .sm')) : '')),
      `<b>${esc(plTxt(b.querySelector('.tx b')))}</b>`, esc(plSm(b.querySelector('.tx'))), (b.querySelector('.cirest') || {}).innerHTML || ''] },
  concursos: { attr: 'con', que: 'concursos', grupo: 'Bloque', def: 'Concursos',
    cols: [['Concurso', ''], ['Cliente, organismo y lotes', ''], ['Estado y plazos', '']],
    celdas: b => [`<b>${esc(plTxt(b.querySelector('.tx b')))}</b>`, esc(plSm(b.querySelector('.tx'))), (b.querySelector('.cirest') || {}).innerHTML || ''] },
  parque: { attr: 'eq', que: 'equipos', grupo: 'Bloque', def: 'Todos los equipos',
    cols: [['Equipo', ''], ['Serie, centro y contrato', ''], ['Revisión y vencimientos', '']],
    celdas: b => [`<b>${esc(plTxt(b.querySelector('.tx b')))}</b>`, esc(plSm(b.querySelector('.tx'))), (b.querySelector('.cirest') || {}).innerHTML || ''] }
};

// Las páginas (Eventos, Intervenciones…) crean su sección al entrar: el observador se engancha entonces (y otra vez si se vuelve a crear)
const PL_OBSEL = {};

/* ============================================================
   v2.240.0 · Paneles sin saltos. Grabados con la red lenta, Inicio, Analítica, Agenda, Rutas y Calidad del dato ya llegan
   de una vez; quedaban tres detalles:
   - Las cifras que cuentan (mosaico de Inicio, indicadores de Inicio, Pedidos y Analítica) volvían a contar desde cero cada vez
     que se volvía a la pantalla, y parecía que saltaban: ahora solo cuentan si la cifra ha cambiado desde la última vez.
   - En el móvil, las cifras grandes de Analítica se partían en dos líneas.
   - Oportunidades enseñaba los filtros de Pedidos («Mes actual» dos veces): los de la otra sección se apartan del panel.
   ============================================================ */
const CONTADO = {};   // última cifra que se ha enseñado contando, por pantalla y grupo

const plYaContado = (clave, valores) => { const k = TAB + ':' + clave, f = valores.join('|'); if (CONTADO[k] === f) return true; CONTADO[k] = f; return false; };

// Pedidos y Oportunidades comparten el panel de filtros: los de la otra sección se apartan (no salen en el panel ni como filtro activo)
const PL_AJENOS = { pedidos: ['llper', 'llfres'], oport: ['pper', 'pcanal', 'pestado', 'popf', 'porigf', 'prepf'], compras: ['llper', 'llfres', 'pper', 'pcanal', 'pestado', 'popf', 'porigf', 'prepf'], prov: ['llper', 'llfres', 'pper', 'pcanal', 'pestado', 'popf', 'porigf', 'prepf'] };

/* ============================================================
   v2.262.0 · Facturas y Oportunidades ordenadas de verdad (punto 3 del plan del 11/10/2026). Las dos listas traen ya todo el periodo
   elegido (la base filtra por fechas, búsqueda y estado) y se paginaban en la pantalla, pero al pulsar una columna solo se ordenaban
   las filas de la página que se veía. Ahora el orden se aplica a toda la lista del periodo antes de paginar y se vuelve a la primera
   página: es lo más eficiente (los datos ya están en el móvil; no hace falta otra consulta ni cambiar la base). Si algún día una
   empresa tiene miles de facturas en un mismo periodo, se pasaría la paginación a la base.
   ============================================================ */
const ORD_MEM = {
  facts: { fn: 'facturas_lista', campos: ['numero', 'fecha', 'cliente', 'nif', 'base', 'cuota_iva', 'total', 'vencimiento', 'estado_cobro'] },
  llam: { fn: 'llamadas_lista', campos: ['fecha', x => x.cliente || x.nombre, 'importe_estimado', x => x.medico || x.cuenta_texto, x => x.resultado || (x.pedido_id ? 'Pedido hecho' : ''), 'proxima_fecha', 'usuario'] }
};


// Directorio: cada fila lleva su tarjeta (oculta en el ordenador) con el nombre, centro · municipio y el estado

function plKpisHtmlBase(tab) {
  const c = PL[tab], k = PL_KPI[tab];
  if (!k || !k.datos) return Array(c.nKpis || 4).fill('').map(() => `<div class="plk plcarga"><span class="plkt"><i class="plsk" style="width:46%"></i></span><b><i class="plsk plskv"></i></b><small><i class="plsk" style="width:70%"></i></small></div>`).join('');
  return k.datos.map(d => `<button type="button" class="plk ${c.kpiOn(d.k) ? 'on' : ''}" data-plk="${d.k}"><span class="plkt">${esc(d.t)}</span><b data-pln="${d.n}">${num(d.n)}</b><small>${esc(d.s)}</small></button>`).join('');
}

function plKpisHtml(tab) { return plCfg(tab) && plCfg(tab).kpis ? plKpisHtmlBase(tab) : ''; }

// Recuento: el de la pantalla; si no tiene, el paginador («1–20 de N») o las filas que se ven
function plRecuentoBase(sec, c) {
  const cu = c.cuenta && c.cuenta(); if (cu && /\d/.test(cu.textContent)) return cu.innerHTML.replace(/<span class="sm">[\s\S]*?<\/span>/, '').trim();
  const pag = sec.querySelector('.pltab .pag > span, .pag > span'); const m = pag && pag.textContent.match(/de\s+([\d.]+)/);
  const g = sec.querySelector('.dgrid'); if (!m && !g) return sec.querySelector('.pltab .vacio, .panel .vacio') ? `<b>0</b> ${esc(c.que())}` : '';
  const n = m ? m[1] : num(g.querySelectorAll(':scope > .dr:not(.hide):not(.htfuera)').length);
  return `<b>${n}</b> ${esc(c.que())}`;
}

// El recuento de estas tablas cuenta solo las filas que se ven (bloque y búsqueda)
function plRecuentoBase2(sec, c) {
  if (!c.bloques) return plRecuentoBase(sec, c);
  const g = sec.querySelector('.dgrid'); if (!g) return sec.querySelector('#cfgcuerpo .vacio') ? `<b>0</b> ${esc(c.que())}` : '';
  return `<b>${num(g.querySelectorAll(':scope > .dr:not(.htfuera):not(.plgfuera)').length)}</b> ${esc(c.que())}`;
}

// ---- «Cerca de mí»: el recuento de la barra lleva «Volver a la búsqueda» de verdad
function plRecuento(sec, c) {
  const r = plRecuentoBase2.call(this, sec, c);
  return typeof r === 'string' ? r.replace(/\sid="cercacerrar"/g, ' data-cercavolver') : r;
}

function plSyncBase(tab) {
  const sec = $('v-' + tab), c = plCfg(tab); if (!sec) return;
  if (!c) {   // sección sin plantilla: fuera lo que se hubiera puesto
    if (sec.classList.contains('plantilla')) { sec.classList.remove('plantilla'); sec.querySelectorAll(':scope > .plkpis, :scope > .pltool, .plmas').forEach(x => x.remove()); }
    return;
  }
  const clave = PL_SECC[tab] ? PL_SECC[tab]() : tab;
  sec.classList.add('plantilla'); sec.dataset.plsec = clave;
  const sal = sec.querySelector(':scope > .saludo');
  const acts = sal && sal.querySelector('.acts');
  if (acts && !acts.querySelector('.plmas')) acts.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec chico plmas" aria-label="Más acciones" title="Más acciones">${plIco('ellipsis', '⋯')}</button>`);
  const mas = acts && acts.querySelector('.plmas'); if (mas) { const no = !c.mas().length; if (mas.classList.contains('plno') !== no) mas.classList.toggle('plno', no); }
  const nb = c.nuevo && c.nuevo();
  if (nb && c.textoNuevo && !ES_MOVIL() && !nb.classList.contains('fab') && nb.textContent.trim() !== c.textoNuevo()) nb.innerHTML = plIco('plus') + ' ' + esc(c.textoNuevo());
  if (nb && c.textoNuevo && ES_MOVIL() && !nb.dataset.plfab) { nb.dataset.plfab = '1'; nb.classList.add('fab'); nb.dataset.txt = c.textoNuevo(); nb.setAttribute('aria-label', c.textoNuevo()); nb.innerHTML = plIco('plus'); sec.appendChild(nb); }
  // Móvil: un solo «+», el de la sección abierta (al cambiar de sección quedaba el de la anterior)
  if (c.rejilla && ES_MOVIL()) {
    const prim = [...sec.querySelectorAll(':scope > .saludo .acts > .btn:not(.sec):not(.htbtn), :scope > .fab')].find(b => /^\s*\+/.test(b.dataset.txt ? '+' : b.textContent) && (b.classList.contains('fab') ? b.dataset.plsec === clave || !b.dataset.plsec : true));
    if (prim && !prim.classList.contains('fab')) { prim.dataset.txt = prim.textContent.replace('+', '').trim(); prim.classList.add('fab'); prim.setAttribute('aria-label', prim.dataset.txt); prim.innerHTML = plIco('plus'); sec.appendChild(prim); }
    if (prim) { prim.dataset.plsec = clave; sec.querySelectorAll(':scope > .fab').forEach(f => { const fuera = f !== prim; if (f.classList.contains('plfuera') !== fuera) f.classList.toggle('plfuera', fuera); }); }
  }
  // Debajo de la cabecera (y de las pestañas, si las hay): la banda de indicadores y la barra
  const ancla = sec.querySelector(':scope > .subnav') || sal;
  let kp = sec.querySelector(':scope > .plkpis');
  if (c.kpis || c.banda) {
    if (!kp) { kp = document.createElement('div'); kp.className = 'plkpis' + (c.banda ? ' plbanda' : ''); if (c.kpis) kp.innerHTML = plKpisHtml(tab); }
    if (!kp.isConnected) { if (ancla) ancla.after(kp); else sec.prepend(kp); }
    if (c.kpis) { plCargarKpis(tab); kp.querySelectorAll('[data-plk]').forEach(b => { const on = c.kpiOn(b.dataset.plk); if (b.classList.contains('on') !== on) b.classList.toggle('on', on); }); }
    if (c.banda) { const b = $(c.banda); if (b && b.parentElement !== kp) kp.appendChild(b); }
  } else if (kp) kp.remove();
  let tl = sec.querySelector(':scope > .pltool');
  if (tl && tl.dataset.plsec !== clave) { tl.remove(); tl = null; }
  if (!tl) { tl = document.createElement('div'); tl.className = 'pltool'; tl.dataset.plsec = clave; tl.innerHTML = plToolHtml(tab); }
  if (!tl.isConnected) { const ref = sec.querySelector(':scope > .plkpis') || ancla; if (ref) ref.after(tl); else sec.prepend(tl); }
  const qi = tl.querySelector('.plqi'); if (qi && document.activeElement !== qi && qi.value !== c.q()) qi.value = c.q();
  tl.querySelectorAll('[data-plr]').forEach(b => {
    const s = plSel(b.dataset.plr), w = s && s.closest('#fcomwrap');
    const ver = !!s && !(w && w.classList.contains('hide')) && s.options.length > 1;
    if (b.classList.contains('hide') === ver) b.classList.toggle('hide', !ver); if (!ver) return;
    if (!b.dataset.plt) b.dataset.plt = plEtiq(b.dataset.plr);
    const on = s.selectedIndex > 0 && !(b.dataset.plt === 'Periodo');
    const txt = s.selectedIndex > 0 || b.dataset.plt === 'Periodo' ? `${b.dataset.plt}: ${s.options[s.selectedIndex].text.replace(/\s*\(\d[\d.]*\)\s*$/, '')}` : b.dataset.plt;
    if (b.textContent !== txt) b.textContent = txt; if (b.classList.contains('on') !== on) b.classList.toggle('on', on);
  });
  const n = c.activos(), pn = tl.querySelector('.pln');
  if (pn) { const v = String(n || ''); if (pn.textContent !== v) pn.textContent = v; if (pn.classList.contains('hide') !== !n) pn.classList.toggle('hide', !n); }
  const pq = tl.querySelector('.plquitar'); if (pq && pq.classList.contains('hide') !== !n) pq.classList.toggle('hide', !n);
  const cnt = tl.querySelector('.plcnt'), h = plRecuento(sec, c);
  if (cnt && h && cnt.dataset.h !== h) { cnt.dataset.h = h; cnt.innerHTML = h; }
  // Tabla y pie en una tarjeta; los totales, en la franja de resumen encima
  const tb = c.tabla(), pie = c.pie();
  if (tb && tb.parentElement && !tb.parentElement.classList.contains('pltab')) { const w = document.createElement('div'); w.className = 'pltab'; tb.before(w); w.appendChild(tb); if (pie) w.appendChild(pie); }
  else if (tb && pie && pie.parentElement !== tb.parentElement) tb.parentElement.appendChild(pie);
  const tab2 = tb && tb.closest('.pltab');
  if (c.rejilla && tab2) {
    sec.querySelectorAll('.kpis.vtot:not(.plres)').forEach(k => { if (k.closest('#v-' + tab) && !k.closest('.plkpis')) k.classList.add('plres'); });
    if (c.despues) { const d = $(c.despues); if (d && tab2.nextElementSibling !== d) tab2.after(d); }
  }
  const cuerpo = c.cuerpo();
  if (cuerpo) {
    if (cuerpo.querySelector(':scope > .cargador')) {
      if (cuerpo.__plUlt) { cuerpo.innerHTML = cuerpo.__plUlt; cuerpo.classList.add('platenua'); }
      else if (tab === 'directorio') { cuerpo.innerHTML = plEsqueleto(tab, false); if (!$('thead').children.length) $('thead').innerHTML = plEsqueleto(tab, true).match(/<div class="plskh">[\s\S]*?<\/div>/)[0]; }
      else cuerpo.innerHTML = plEsqueleto(tab, true);
    } else if (c.conDatos(cuerpo)) { cuerpo.classList.remove('platenua'); cuerpo.__plUlt = cuerpo.innerHTML; }
  }
  const vc = tab === 'pacientes' && $('vcuerpo');
  if (vc && !vc.children.length) vc.innerHTML = `<div class="panel plskpanel"><div class="pltab">${plEsqueleto(tab, true)}</div></div>`;
  // Primera llegada de una pantalla en rejilla: mientras no hay tabla, su esqueleto debajo de la barra
  if (c.rejilla && !sec.querySelector('.dgrid, .pltab, .vacio') && !sec.querySelector(':scope > .plskpanel')) tl.insertAdjacentHTML('afterend', `<div class="panel plskpanel"><div class="pltab">${plEsqueleto(tab, true)}</div></div>`);
  if (sec.querySelector('.dgrid, .vacio')) sec.querySelectorAll(':scope > .plskpanel').forEach(x => x.remove());
  if (c.card) sec.querySelectorAll('.dgrid > .dr:not([data-plc])').forEach(dr => {
    dr.dataset.plc = '1'; const x = c.card(dr);
    dr.insertAdjacentHTML('beforeend', `<span class="plcard"><b>${esc(x.a)}</b><span class="plc2">${esc(x.b)}</span><span class="plc3">${x.c}</span>${x.d ? `<span class="plc4">${esc(x.d)}</span>` : ''}</span>`);   // v2.316.0: tercera línea
  });
}

// La barra y los clics usan la configuración de la sección abierta
function plToolHtml(tab) {
  const c = plCfg(tab);
  return `<label class="plq">${plIco('search', '🔍')}<input type="search" class="plqi" placeholder="${esc(c.buscaTxt ? c.buscaTxt() : 'Buscar en ' + c.que())}" aria-label="${esc(c.buscaTxt ? c.buscaTxt() : 'Buscar en ' + c.que())}"></label>
    <div class="plrap">${c.rapidos.map(([id, t]) => { t = t || plEtiq(id); return `<button type="button" class="plchip" data-plr="${esc(id)}" data-plt="${esc(t)}">${esc(t)}</button>`; }).join('')}</div>
    <button type="button" class="plbtn chico plfil">${plIco('sliders-horizontal')}<span>Filtros</span><span class="pln hide"></span></button>
    ${c.quitar ? `<button type="button" class="btn sec chico dang plquitar hide">${svgIco(ICON_NOM.x)} Eliminar filtros</button>` : ''}
    <button type="button" class="plbtn chico plcol">${plIco('columns-3', 'table', 'list')}<span>Columnas</span></button>
    ${c.mapa() ? `<button type="button" class="plbtn chico plic plmapa" title="Ver en el mapa" aria-label="Ver en el mapa">${plIco('map')}</button>` : ''}
    <span class="plcnt"><i class="plsk" style="width:90px"></i></span>`;
}

// Antes de ajustar la plantilla, los bloques se convierten en tabla
function plSyncBase2(tab) { if (BLQ[tab] && plCfg(tab)) blqConvertir(tab); return plSyncBase(tab); }

// Las pestañas de las páginas (.pagtabs) van justo debajo de la cabecera: la banda y la barra, después de ellas
function plSyncBase3(tab) {
  const r = plSyncBase2(tab), sec = $('v-' + tab); if (!sec || !sec.classList.contains('plantilla')) return r;
  const tabs = sec.querySelector(':scope > .pagtabs, :scope > .subnav'), kp = sec.querySelector(':scope > .plkpis'), tl = sec.querySelector(':scope > .pltool');
  if (tabs && tl && (tabs.compareDocumentPosition(tl) & 2)) { const ref = kp || tl; ref.before(tabs); }
  return r;
}

function plSyncBase4(tab) {
  if (tab === 'ventas') { const sec = $('v-ventas'), k = PL_SECC.ventas(); if (sec && k) plAjenos(sec, k); }
  return plSyncBase3(tab);
}

// ---- La barra tiene sus filtros rápidos desde el primer momento: mientras su desplegable no existe (Clientes lo crea al llegar
// los datos), el filtro se ve con su nombre y en espera, en vez de aparecer después empujando el buscador
function plSyncBase5(tab, ...x) {
  const r = plSyncBase4.call(this, tab, ...x);
  const sec = $('v-' + tab), c = plCfg(tab); if (!sec || !c || !c.rapidos) return r;
  sec.querySelectorAll(':scope > .pltool [data-plr]').forEach(b => {
    if (plSel(b.dataset.plr)) { if (b.classList.contains('plespera')) b.classList.remove('plespera'); return; }
    const nom = (c.rapidos.find(x => x[0] === b.dataset.plr) || [])[1]; if (!nom) return;
    if (b.classList.contains('hide')) b.classList.remove('hide');
    if (!b.classList.contains('plespera')) b.classList.add('plespera');
    if (b.textContent !== nom) b.textContent = nom;
  });
  return r;
}

// El filtro de bloques no desaparece: con un solo bloque se queda desactivado
function plSyncBase6(tab, ...x) {
  const r = plSyncBase5.call(this, tab, ...x);
  if (!BLQ[tab]) return r;
  const b = document.querySelector(`#v-${tab} > .pltool [data-plr="#plg-${tab}"]`), s = $('plg-' + tab);
  if (b && s) {
    const nada = s.options.length < 2;
    if (nada && b.classList.contains('hide')) b.classList.remove('hide');
    if (b.classList.contains('plnada') !== nada) b.classList.toggle('plnada', nada);
    if (nada && b.textContent !== BLQ[tab].grupo) b.textContent = BLQ[tab].grupo;
  }
  return r;
}

/* ============================================================
   v2.257.0 · Filtro por profesional en Clientes y uso de TomTom en el Panel delcos (pendientes repasados con Eric, 11/10/2026).
   - Clientes: el filtro por profesional (al llegar desde su ficha) se aplicaba pero no se veía en la pantalla: ahora es un filtro
     rápido marcado en la barra, con su «✕» para quitarlo. «Columnas» abría y cerraba el panel según estuviera: ahora siempre lo abre.
   - Panel delcos → Estado de la plataforma: cuántas consultas de rutas (TomTom) se han hecho hoy frente al tope de todas las empresas,
     en el mes, y por empresa frente a su cupo (rutas_uso_resumen, SQL 138).
   ============================================================ */
function plSyncBase7(tab, ...x) {
  const r = plSyncBase6.call(this, tab, ...x);
  if (tab !== 'pacientes') return r;
  const rap = document.querySelector('#v-pacientes > .pltool .plrap'); if (!rap) return r;
  let b = rap.querySelector('[data-plmed]');
  if (!PAC.medico) { if (b) b.remove(); return r; }
  const txt = `${TT('medico', 's', '', 'l', 'C')}: ${PAC.medicoNombre || '—'}`;
  if (!b) { rap.insertAdjacentHTML('afterbegin', '<button type="button" class="plchip on plmed" data-plmed title="Quitar este filtro"><span></span><i aria-hidden="true">✕</i></button>'); b = rap.querySelector('[data-plmed]'); }
  const s = b.querySelector('span'); if (s.textContent !== txt) s.textContent = txt;
  return r;
}

// ---- Filtros rápidos que no desaparecen (aviso intermitente de la batería: en Contactos, en el móvil, un filtro aparecía tarde
// cuando sus opciones llegaban después de entrar). Un filtro rápido cuyo desplegable aún no tiene opciones se ve desactivado en su
// sitio, en vez de esconderse y aparecer luego empujando el buscador.
function plSync(tab, ...x) {
  const r = plSyncBase7.call(this, tab, ...x);
  const sec = $('v-' + tab); if (!sec || !sec.classList.contains('plantilla')) return r;
  sec.querySelectorAll(':scope > .pltool [data-plr]').forEach(b => {
    const s = plSel(b.dataset.plr); if (!s || !s.options) return;
    const w = s.closest('#fcomwrap'); if (w && w.classList.contains('hide')) return;
    const nada = s.options.length <= 1;
    if (nada) {
      if (b.classList.contains('hide')) b.classList.remove('hide');
      if (!b.classList.contains('plnada')) b.classList.add('plnada');
      const t = b.dataset.plt || plEtiq(b.dataset.plr); if (t && b.textContent !== t) b.textContent = t;
    } else if (b.classList.contains('plnada') && !(BLQ[tab] && b.dataset.plr === '#plg-' + tab)) b.classList.remove('plnada');
  });
  return r;
}

function plCargarKpis(tab) {
  if (tab !== TAB) return;
  const c = plCfg(tab); if (!c || !c.kpis) return;
  const ep = typeof RC_EPOCA !== 'undefined' ? RC_EPOCA : 0, f = c.kpiFirma ? c.kpiFirma() : '';
  let k = PL_KPI[tab];
  if (k && k.pend) { if (f !== k.firma) k.otra = true; return; }
  if (k && k.datos && k.epoca === ep && k.firma === f && Date.now() - k.t < 60000) return;
  PL_KPI[tab] = k = Object.assign(k || {}, { pend: true, firma: f, otra: false });
  c.kpis().then(datos => {
    const nuevo = !k.datos;
    Object.assign(k, { datos, t: Date.now(), epoca: ep, pend: false });
    const box = document.querySelector(`#v-${tab} .plkpis`);
    if (box) {
      box.innerHTML = plKpisHtml(tab);
      if (nuevo && !matchMedia('(prefers-reduced-motion: reduce)').matches) box.querySelectorAll('b[data-pln]').forEach(b => {
        const n = +b.dataset.pln, t0 = performance.now(); if (!n) return;
        const paso = () => { const p = Math.min(1, (performance.now() - t0) / 700); b.textContent = num(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(paso); };
        paso();
      });
    }
    if (k.otra) { k.otra = false; plCargarKpis(tab); }
  }, () => { k.pend = false; });
}
