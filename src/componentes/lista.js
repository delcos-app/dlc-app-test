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
