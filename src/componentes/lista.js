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
