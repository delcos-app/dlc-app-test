// componentes/filtros.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.



function htLateralAbierto() { const d = $('tools'); return d.classList.contains('abierto') && String(HERR_CTX || '').startsWith('ht-'); }

function htDevolver() {
  const d = $('tools'), lat = d.querySelector('.htpropios.lat'); if (!lat) return;
  const sec = $('v-' + String(HERR_CTX || '').replace('ht-', '')), hold = sec && sec.querySelector('.htpanel .htpropios');
  if (hold) [...lat.children].forEach(ch => hold.appendChild(chicoEn(ch, true)));
}

// El botón va a la derecha de la cabecera y abre el panel lateral
function htColocarBoton(sec) {
  const b = sec.querySelector('.htbtn'); if (!b || b.dataset.v254) return;
  b.dataset.v254 = '1';
  const acts = b.parentElement; acts.appendChild(b); acts.classList.add('htacts');
  b.onclick = () => htAbrirLateral(sec);
  sec.querySelectorAll('.htpanel').forEach(p => p.classList.add('hide'));
  // Los selectores del panel lateral actualizan el contador
  $('tools').addEventListener('change', () => htContador(sec));
}










const HT = ['15:00-19:00', '16:00-19:00', '16:00-20:00', '17:00-20:00'];

let HERR_CTX = null;

// Pantallas con filtros propios que pasan al panel (la búsqueda por texto sigue a la vista)
const HT_FILTROS = { pacientes: '#v-pacientes .filtros', facturacion: '#v-facturacion .filtros', analitica: '#anper' };

const HT_ESTADO = {};   // por tabla: { texto, facetas: {col: valor} }

let HT_PEND = false;

let HT2_PEND = false;

/* v2.227.0 · Ordenar cualquier tabla por su columna y filtros por columna según su tipo (lista de Eric del 9/10/2026).
   - Pulsar el nombre de una columna ordena (▲), volver a pulsar invierte (▼) y una tercera vez quita el orden. Se recuerda por tabla.
   - Las tablas que se cargan por páginas se ordenan en la base para que valga para todas las páginas (SQL 135): Profesionales
     (buscar_cuentas: orden), Pedidos (pedidos_pagina: p_orden) y Clientes (clientes_lista: p_orden). El resto, en la pantalla.
   - «Filtros y columnas»: cada columna con el filtro de su tipo: texto («contiene»), número (desde/hasta) o fecha (desde/hasta, y nada si la
     pantalla ya tiene su «Periodo»). Fuera los desplegables inventados con lo que se ve: las listas de valores fijos son las de Clasificadores
     (su apartado propio). Tampoco se repiten columnas que la pantalla ya filtra con lo suyo (Estado, Canal…). */

const HT_ORDEN = {};   // por tabla: { i, dir: 1 | -1, k }

const htGuardarOrden = () => { try { localStorage.setItem('delcos-orden', JSON.stringify(HT_ORDEN)); } catch (e) {} };



// Los indicadores se piden aparte (RPC_ORIG): las listas «solo la última» descartarían las consultas paralelas
// Clics de la barra, los indicadores y el menú «⋯»


function htContadorBase(sec) {
  const b = sec.querySelector('.htbtn'); if (!b) return;
  // Solo se toca si cambia el número (cualquier cambio en la pantalla vuelve a avisar al observador)
  const n = htActivos(sec), txt = n ? String(n) : '', el = b.querySelector('.htn');
  if (el.textContent !== txt) el.textContent = txt;
  if (b.classList.contains('conf') !== n > 0) b.classList.toggle('conf', n > 0);
}

function htAbrirLateralBase(sec) {
  const d = $('tools'), id = sec.id.replace('v-', '');
  if (htLateralAbierto() && HERR_CTX === 'ht-' + id) { d.classList.remove('abierto'); return; }
  htDevolver();
  HERR_CTX = 'ht-' + id;
  d.innerHTML = `<div class="tbox"><div class="fh"><h2>Filtros y columnas</h2><button class="x" id="tclose" aria-label="Cerrar">✕</button></div>
    <div class="htpropios lat"></div><div class="htauto"></div></div>`;
  const hold = sec.querySelector('.htpanel .htpropios');
  if (hold) [...hold.children].forEach(ch => d.querySelector('.htpropios.lat').appendChild(chicoEn(ch, false)));
  $('tclose').onclick = () => d.classList.remove('abierto');
  d.classList.add('abierto');
  htPintarPanel(sec);
}

function htChipsBase(sec) {
  const fil = sec.querySelector('.filtros'); if (!fil || fil.classList.contains('hide')) return;
  let c = sec.querySelector('.htchips');
  if (!c) { fil.insertAdjacentHTML('beforeend', '<div class="htchips"></div>'); c = sec.querySelector('.htchips'); fil.classList.add('filbusca'); }
  const chips = [];
  const selects = [...sec.querySelectorAll('.htpanel .htpropios select'), ...(htLateralAbierto() ? [...$('tools').querySelectorAll('.htpropios.lat select')] : [])];
  selects.forEach(s => { if (s.selectedIndex > 0) { const l = s.id && document.querySelector(`label[for="${s.id}"]`); chips.push({ t: (l ? l.textContent.trim() + ': ' : '') + s.options[s.selectedIndex].text, quitar: () => { s.selectedIndex = 0; s.dispatchEvent(new Event('change', { bubbles: true })); } }); } });
  const g = sec.querySelector('.dgrid'), st = g ? HT_ESTADO[htTipo(g)] : null;
  if (st) {
    const cab = [...(g.querySelector(':scope > .dh') || { children: [] }).children].map(x => x.textContent.trim());
    Object.entries(st.facetas || {}).forEach(([i, v]) => { if (v) chips.push({ t: `${cab[i] || 'Columna'}: ${v}`, quitar: () => { st.facetas[i] = ''; htAplicarFiltros(g); } }); });
    if (st.texto) chips.push({ t: `Contiene «${st.texto}»`, quitar: () => { st.texto = ''; htAplicarFiltros(g); } });
  }
  const html = chips.map((x, i) => `<button class="htchip" type="button" data-hchip="${i}">${esc(x.t)} <span aria-hidden="true">✕</span></button>`).join('');
  if (c.innerHTML !== html) {
    c.innerHTML = html;
    c.querySelectorAll('[data-hchip]').forEach(b => b.onclick = () => { chips[+b.dataset.hchip].quitar(); htContador(sec); htChips(sec); });
  }
}

function htContador(sec) { htContadorBase(sec); htChips(sec); }

function htAbrirLateral(sec) {
  htAbrirLateralBase(sec);
  const d = $('tools'), auto = d.querySelector('.htauto');
  if (!clasPantalla(sec) || !htLateralAbierto() || !auto || d.querySelector('.htclas')) return;
  auto.insertAdjacentHTML('beforebegin', '<div class="htclas"></div>');
  clasPintarLateral(sec);
}

// Chips de los filtros de Clasificadores junto al buscador (en su propio contenedor)
function htChips(sec) {
  htChipsBase(sec);
  const P = clasPantalla(sec), c = sec.querySelector('.htchips'); if (!c) return;
  let c2 = sec.querySelector('.htchips2');
  if (!c2) { c.insertAdjacentHTML('afterend', '<div class="htchips htchips2"></div>'); c2 = sec.querySelector('.htchips2'); }
  const est = P ? P.estado() : {}, chips = P ? clasChips(P.amb, est) : [];
  const html = chips.map(x => `<button class="htchip" type="button" data-hcp="${esc(x.k)}">${esc(x.t)} <span aria-hidden="true">✕</span></button>`).join('');
  if (c2.innerHTML === html) return;
  c2.innerHTML = html;
  c2.querySelectorAll('[data-hcp]').forEach(b => b.onclick = () => { delete est[b.dataset.hcp]; P.recargar(); clasPintarLateral(sec); htContador(sec); });
}

// Columnas: se quitan de la rejilla conservando las proporciones del resto
function htAplicarColumnasBase(g) {
  const tipo = htTipo(g), ocultas = htOcultas(tipo);
  if (!g.dataset.colsBase) g.dataset.colsBase = getComputedStyle(g).getPropertyValue('--cols').trim();
  const pistas = []; let prof = 0, act = '';
  for (const ch of g.dataset.colsBase) { if (ch === '(') prof++; if (ch === ')') prof--; if (ch === ' ' && !prof) { if (act) pistas.push(act); act = ''; } else act += ch; }
  if (act) pistas.push(act);
  if (!pistas.length) return;
  g.style.setProperty('--cols', pistas.filter((_, i) => !ocultas.includes(i)).join(' '));
  if (ocultas.length) g.style.minWidth = 'auto';
  g.querySelectorAll(':scope > .dh, :scope > .dr').forEach(f => [...f.children].forEach((c, i) => c.classList.toggle('htno', ocultas.includes(i))));
}

// Filtros automáticos por columna (columnas con pocos valores distintos) y búsqueda dentro de la tabla
// v2.242.0: aquí iba la primera versión de htAplicarFiltros (se redefine entera más abajo)
function htActivosBase(sec) {
  const g = sec.querySelector('.dgrid'); const st = g ? HT_ESTADO[htTipo(g)] || {} : {};
  let n = Object.values(st.facetas || {}).filter(Boolean).length + (st.texto ? 1 : 0);
  sec.querySelectorAll('.htpanel .htpropios select').forEach(s => { if (s.selectedIndex > 0) n++; });
  return n;
}

function htPintarPanelBase(sec) {
  const panel = sec.querySelector('.htpanel'); if (!panel) return;
  const g = sec.querySelector('.dgrid');
  const zona = panel.querySelector('.htauto'); zona.innerHTML = '';
  if (g) {
    const tipo = htTipo(g), st = HT_ESTADO[tipo] = HT_ESTADO[tipo] || { texto: '', facetas: {} };
    const cab = [...(g.querySelector(':scope > .dh') || { children: [] }).children].map(c => c.textContent.trim());
    const filas = [...g.querySelectorAll(':scope > .dr')];
    const facetas = cab.map((nombre, i) => {
      const vals = [...new Set(filas.map(f => (f.children[i] || {}).textContent ? f.children[i].textContent.trim() : '').filter(Boolean))];
      return vals.length > 1 && vals.length <= 15 && nombre ? { i, nombre, vals: vals.sort() } : null;
    }).filter(Boolean);
    const ocultas = htOcultas(tipo);
    zona.innerHTML = `
      <div class="htbloque"><h4>Buscar en la tabla</h4><input type="search" class="httexto" value="${esc(st.texto || '')}" placeholder="Cualquier dato de la tabla"></div>
      ${facetas.length ? `<div class="htbloque"><h4>Filtrar por columna</h4><div class="htfacetas">${facetas.map(f => `<label><span>${esc(f.nombre)}</span><select data-htf="${f.i}"><option value="">Todos</option>${f.vals.map(v => `<option ${st.facetas[f.i] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`).join('')}</div></div>` : ''}
      ${cab.filter(Boolean).length > 2 ? `<div class="htbloque"><h4>Columnas</h4><div class="htcols">${cab.map((n, i) => n ? `<label class="opt"><input type="checkbox" data-htc="${i}" ${ocultas.includes(i) ? '' : 'checked'} ${i === 0 ? 'disabled' : ''}> ${esc(n)}</label>` : '').join('')}</div></div>` : ''}
      <div class="acts" style="margin:0;justify-content:flex-end"><button class="btn sec dang" type="button" data-htlimpiar>${svgIco(ICON_NOM.x)} Eliminar filtros</button></div>`;
    zona.querySelector('.httexto').oninput = e => { st.texto = e.target.value; htAplicarFiltros(g); htContador(sec); };
    zona.querySelectorAll('[data-htf]').forEach(s => s.onchange = () => { st.facetas[s.dataset.htf] = s.value; htAplicarFiltros(g); htContador(sec); });
    zona.querySelectorAll('[data-htc]').forEach(c => c.onchange = () => {
      const o = new Set(htOcultas(tipo)); c.checked ? o.delete(+c.dataset.htc) : o.add(+c.dataset.htc);
      localStorage.setItem('ht-cols-' + tipo, JSON.stringify([...o])); htAplicarColumnas(g);
    });
    zona.querySelector('[data-htlimpiar]').onclick = () => {
      HT_ESTADO[tipo] = { texto: '', facetas: {} };
      panel.querySelectorAll('.htpropios select').forEach(s => { if (s.selectedIndex > 0) { s.selectedIndex = 0; s.dispatchEvent(new Event('change', { bubbles: true })); } });
      htAplicarFiltros(g); htPintarPanel(sec); htContador(sec);
    };
  }
}

function htPrepararBase(sec) {
  const id = sec.id.replace('v-', '');
  if (id === 'directorio') { const f = sec.querySelector('.panel > .filtros'); if (f) f.classList.add('hide'); return; }
  // v2.87.0: en la configuración de facturación no hay tablas que filtrar
  if (id === 'facturacion' && typeof FSEC !== 'undefined' && FSEC !== 'facturas') return;
  const g = sec.querySelector('.dgrid'), propios = HT_FILTROS[id] ? document.querySelector(HT_FILTROS[id]) : null;
  if (!g && !propios) return;
  let panel = sec.querySelector('.htpanel');
  if (!panel) {
    const ref = sec.querySelector('.subnav') || sec.querySelector('.saludo');
    let acts = sec.querySelector('.saludo .acts');
    if (!acts && sec.querySelector('.saludo')) { sec.querySelector('.saludo').insertAdjacentHTML('beforeend', '<div class="acts"></div>'); acts = sec.querySelector('.saludo .acts'); }
    if (!ref || !acts) return;
    ref.insertAdjacentHTML('afterend', '<div class="htpanel hide"><div class="htpropios"></div><div class="htauto"></div></div>');
    panel = sec.querySelector('.htpanel');
    acts.insertAdjacentHTML('afterbegin', `<button class="btn sec chico htbtn" type="button" title="Filtros y columnas" aria-label="Filtros y columnas">${svgIco(ICON_NOM['sliders-horizontal'])}<span class="htl"> Filtros y columnas</span><span class="htn"></span></button>`);
    acts.querySelector('.htbtn').onclick = () => { panel.classList.toggle('hide'); if (!panel.classList.contains('hide')) htPintarPanel(sec); };
  }
  // Los filtros propios de la pantalla pasan al panel; la búsqueda por texto se queda a la vista
  if (propios && !propios.dataset.ht) {
    propios.dataset.ht = '1';
    [...propios.children].forEach(ch => {
      if (ch.matches('input[type=search],input[type=text]') || ch.querySelector('input[type=search],input[type=text]')) return;
      panel.querySelector('.htpropios').appendChild(chicoEn(ch, true));
    });
    if (!propios.children.length) propios.classList.add('hide');
    panel.querySelectorAll('.htpropios select').forEach(s => s.addEventListener('change', () => htContador(sec)));
  }
  // Una tabla nueva (datos recién pintados): se le aplican columnas y filtros, y se actualiza el panel si está abierto
  if (g && !g.dataset.ht) { g.dataset.ht = '1'; htAplicarColumnas(g); htAplicarFiltros(g); if (!panel.classList.contains('hide')) htPintarPanel(sec); }
  htContador(sec);
}

// El contenido automático (buscar, filtrar por columna, columnas) se pinta en el panel lateral
function htPintarPanelBase2(sec) {
  const d = $('tools');
  if (!(htLateralAbierto() && HERR_CTX === 'ht-' + sec.id.replace('v-', ''))) return;
  // Se reutiliza la función anterior pintando sobre un «panel» temporal y se lleva el resultado al lateral
  const tmp = document.createElement('div'); tmp.className = 'htpanel'; tmp.innerHTML = '<div class="htauto"></div>';
  const real = sec.querySelector('.htpanel'); if (real) real.classList.add('htreal');
  sec.appendChild(tmp);
  const antes = sec.querySelector('.htpanel:not(.htreal)');
  if (real) real.classList.remove('htpanel');
  try { htPintarPanelBase(sec); } finally { if (real) real.classList.add('htpanel'); }
  const auto = d.querySelector('.htauto'); auto.replaceWith(tmp.querySelector('.htauto')); tmp.remove();
  if (real) real.classList.remove('htreal');
}

function htActivosBase2(sec) {
  let n = htActivosBase(sec);
  if (htLateralAbierto() && HERR_CTX === 'ht-' + sec.id.replace('v-', '')) $('tools').querySelectorAll('.htpropios.lat select').forEach(s => { if (s.selectedIndex > 0) n++; });
  return n;
}

// Si una tabla tiene más columnas que anchos definidos, se completan (antes la última saltaba de línea)
function htAplicarColumnasBase2(g) {
  if (!g.dataset.colsBase) {
    const base = getComputedStyle(g).getPropertyValue('--cols').trim();
    const n = (g.querySelector(':scope > .dh') || { children: [] }).children.length;
    const pistas = base.split(/\s+(?![^(]*\))/).filter(Boolean);
    g.dataset.colsBase = pistas.length && pistas.length < n ? base + ' minmax(90px,1fr)'.repeat(n - pistas.length) : base;
  }
  return htAplicarColumnasBase(g);
}

// En el panel de «Filtros y columnas», las columnas pasan a un botón que abre el segundo panel
function htPintarPanelBase3(sec) {
  htPintarPanelBase2(sec);
  const auto = $('tools').querySelector('.htauto'); if (!auto || !htLateralAbierto()) return;
  const bloque = [...auto.querySelectorAll('.htbloque')].find(b => b.querySelector('[data-htc]')); if (!bloque) return;
  const g = sec.querySelector('.dgrid'); const tipo = htTipo(g);
  const cols = [...bloque.querySelectorAll('[data-htc]')].map(c => ({ i: +c.dataset.htc, n: c.parentElement.textContent.trim(), on: c.checked, fija: c.disabled }));
  const vis = cols.filter(c => c.on).length;
  bloque.innerHTML = `<h4>Columnas</h4><button class="btn sec t2abrir" type="button">Elegir columnas · ${vis} de ${cols.length} visibles <span>›</span></button>`;
  bloque.querySelector('.t2abrir').onclick = () => panelColumnas('Columnas', cols, (i, on) => {
    const o = new Set(htOcultas(tipo)); on ? o.delete(i) : o.add(i);
    localStorage.setItem('ht-cols-' + tipo, JSON.stringify([...o])); htAplicarColumnas(g);
    const c = cols.find(x => x.i === i); if (c) c.on = on;
    bloque.querySelector('.t2abrir').firstChild.textContent = `Elegir columnas · ${cols.filter(x => x.on).length} de ${cols.length} visibles `;
  });
}

function htAplicarColumnas(g) {
  htAplicarColumnasBase2(g);
  const tipo = htTipo(g), an = anchosGuardados(tipo);
  const dh = g.querySelector(':scope > .dh'); if (!dh) return;
  if (an) {
    const ocultas = htOcultas(tipo), pistas = g.dataset.colsBase.split(/\s+(?![^(]*\))/).filter(Boolean);
    g.style.setProperty('--cols', pistas.map((p, i) => ocultas.includes(i) ? null : (an[i] ? an[i] + 'px' : p)).filter(Boolean).join(' '));
    g.style.minWidth = 'max-content';
  }
  [...dh.children].forEach((c, i) => {
    if (c.querySelector('.colres') || c.classList.contains('htno') || i === dh.children.length - 1) return;
    c.classList.add('conres'); c.insertAdjacentHTML('beforeend', `<i class="colres" data-colres="${i}" title="Arrastra para cambiar el ancho"></i>`);
  });
}

// El contador del botón suma los filtros de Clasificadores
function htActivosBase3(sec) { const P = clasPantalla(sec); return htActivosBase2(sec) + (P ? Object.keys(P.estado()).length : 0); }

// El botón «Filtros y columnas» vive en la barra de la tabla: si la tabla se vuelve a pintar entera
// (Productos al filtrar o guardar), el botón desaparecía con ella. Se vuelve a crear si falta.
function htPrepararBase2(sec) {
  const acts = sec.querySelector('.saludo .acts');
  // v2.96.0: en Clientes, Pedidos y Productos el panel existe aunque la lista salga vacía (un periodo sin datos o
  // un filtro de Clasificadores que no deja nada): sin él no se podría cambiar el filtro que la ha vaciado
  const ref = sec.querySelector('.subnav') || sec.querySelector('.saludo');
  if (!sec.querySelector('.htpanel') && !sec.querySelector('.dgrid') && clasPantalla(sec) && ref && acts) {
    ref.insertAdjacentHTML('afterend', '<div class="htpanel hide"><div class="htpropios"></div><div class="htauto"></div></div>');
  }
  if (sec.querySelector('.htpanel') && !sec.querySelector('.htbtn') && acts) {
    acts.insertAdjacentHTML('afterbegin', `<button class="btn sec chico htbtn" type="button" title="Filtros y columnas" aria-label="Filtros y columnas">${svgIco(ICON_NOM['sliders-horizontal'])}<span class="htl"> Filtros y columnas</span><span class="htn"></span></button>`);
  }
  const r = htPrepararBase(sec);
  if (!sec.querySelector('.dgrid') && clasPantalla(sec)) htContador(sec);
  return r;
}

/* v2.218.0 · Roles y Series (lo que quedaba del rediseño de Configuración).
   - «Filtros y columnas» no se engancha a Configuración (salía suelto en la cabecera al abrir Series).
   - Roles y permisos: la columna del permiso queda fija al desplazarse a los lados y los desplegables son más estrechos (estilo). */
function htPrepararBase3(sec, ...r) {
  if (sec && sec.id === 'v-config') { sec.querySelectorAll('.htbtn, .htpanel').forEach(x => x.remove()); return; }
  return htPrepararBase2.call(this, sec, ...r);
}

function htPintarPanel(sec) {
  htPintarPanelBase3.call(this, sec);
  // El panel se abre al lado (#tools) y allí van también los filtros propios de la pantalla
  const lateral = typeof htLateralAbierto === 'function' && htLateralAbierto(), panel = lateral ? $('tools') : sec.querySelector('.htpanel'), g = sec.querySelector('.dgrid');
  if (!panel || !g || !panel.querySelector('.htauto')) return;
  const tipo = htTipo(g), st = HT_ESTADO[tipo] = HT_ESTADO[tipo] || { texto: '', facetas: {} };
  st.rangos = st.rangos || {};
  const zona = panel.querySelector('.htauto'), bloque = zona.querySelector('.htfacetas') && zona.querySelector('.htfacetas').closest('.htbloque');
  const propias = [...panel.querySelectorAll('.htpropios label, .htpropios h4, .htpropios .lab')].map(x => htNorm(x.textContent));
  const hayPeriodo = propias.some(t => /periodo|fecha/.test(t));
  const cab = [...(g.querySelector(':scope > .dh') || { children: [] }).children].map(c => c.textContent.trim());
  const filas = [...g.querySelectorAll(':scope > .dr')];
  const cols = cab.map((nombre, i) => {
    if (htNoFiltrable(nombre) || propias.includes(htNorm(nombre))) return null;
    const t = htTipoColumna(filas.map(f => (f.children[i] || {}).textContent || ''));
    if (t === 'fecha' && hayPeriodo) return null;
    return { i, nombre, t };
  }).filter(Boolean);
  const html = cols.length ? `<div class="htbloque htcolf"><h4>Filtrar por columna</h4><div class="htfacetas">${cols.map(c => c.t === 'texto'
      ? `<label><span>${esc(c.nombre)}</span><input type="search" class="chico" data-htt="${c.i}" value="${esc(st.facetas[c.i] || '')}" placeholder="Contiene…"></label>`
      : `<div class="htrango"><span>${esc(c.nombre)}</span><div><input type="${c.t === 'fecha' ? 'date' : 'number'}" class="chico" data-htd="${c.i}" data-htk="${c.t}" value="${esc((st.rangos[c.i] || {}).d || '')}" aria-label="${esc(c.nombre)} desde" placeholder="Desde">
          <input type="${c.t === 'fecha' ? 'date' : 'number'}" class="chico" data-hth="${c.i}" data-htk="${c.t}" value="${esc((st.rangos[c.i] || {}).h || '')}" aria-label="${esc(c.nombre)} hasta" placeholder="Hasta"></div></div>`).join('')}</div></div>` : '';
  const antesDe = [...zona.querySelectorAll('.htbloque')].find(b => b.querySelector('[data-htc], .t2abrir')) || zona.querySelector('.acts');
  if (bloque) bloque.outerHTML = html; else if (html) { if (antesDe) antesDe.insertAdjacentHTML('beforebegin', html); else zona.insertAdjacentHTML('beforeend', html); }
  // Los filtros de antes (desplegable con un valor exacto) pasan a «contiene»
  Object.keys(st.facetas).forEach(i => { if (!cols.some(c => c.i === +i && c.t === 'texto')) delete st.facetas[i]; });
  zona.querySelectorAll('[data-htt]').forEach(inp => inp.oninput = () => { st.facetas[inp.dataset.htt] = inp.value; htAplicarFiltros(g); htContador(sec); });
  zona.querySelectorAll('[data-htd], [data-hth]').forEach(inp => inp.oninput = inp.onchange = () => {
    const i = inp.dataset.htd || inp.dataset.hth, r = st.rangos[i] = st.rangos[i] || {};
    r.k = inp.dataset.htk; if (inp.dataset.htd) r.d = inp.value; else r.h = inp.value;
    htAplicarFiltros(g); htContador(sec);
  });
  const limpiar = zona.querySelector('[data-htlimpiar]');
  if (limpiar) { const v = limpiar.onclick; limpiar.onclick = () => { st.rangos = {}; v && v(); }; }
  if (typeof mejorarCampos === 'function') try { mejorarCampos(zona); } catch (e) {}
}

function htActivos(sec) {
  const g = sec.querySelector('.dgrid'), st = g ? HT_ESTADO[htTipo(g)] || {} : {};
  return htActivosBase3.call(this, sec) + Object.values(st.rangos || {}).filter(r => r.d || r.h).length;
}

// Al pintarse una tabla (datos nuevos o «Ver más»), se aplica su orden y se marcan las cabeceras
function htPreparar(sec, ...r) {
  const x = htPrepararBase3.call(this, sec, ...r);
  sec.querySelectorAll('.dgrid').forEach(g => { const n = g.querySelectorAll(':scope > .dr').length; if (g.dataset.htn != n) { g.dataset.htn = n; htOrdenarFilas(g); } });
  return x;
}

// Ordenar y filtrar tablas y la memoria de filtros están en src/app/components/filters (v2.416.0). Estos nombres se quedan: el
// panel «Filtros y columnas», legado 057/082/107/113, Inicio y las pruebas los usan.
function htTipo(g) { return window.delcos.components.filters.tableKind(g); }
function htOcultas(tipo) { return window.delcos.components.filters.hiddenColumns(tipo); }
function htValor(txt) { return window.delcos.components.filters.cellValue(txt); }
function htComparar(a, b) { return window.delcos.components.filters.compareCells(a, b); }
function htMarcarCabecera(g) { window.delcos.components.filters.markHeader(g); }
function htOrdenarFilas(g) { window.delcos.components.filters.sortRows(g); }
function htQuitarOrden(g) { window.delcos.components.filters.clearSort(g); }
function htTipoColumna(vals) { return window.delcos.components.filters.columnKind(vals); }
function htNorm(s) { return window.delcos.components.filters.normalise(s); }
function htCeldaNoOrdenable(n) { return window.delcos.components.filters.notSortable(n); }
function htNoFiltrable(n) { return window.delcos.components.filters.notFilterable(n); }
function filtroConValor(v) { return window.delcos.components.filters.filterHasValue(v); }
function chicoEn(el, si) { return window.delcos.components.filters.compact(el, si); }
function filtroGuardar(e) { window.delcos.components.filters.rememberFilter(e); }
function filtrosRestaurar(root) { window.delcos.components.filters.restoreFilters(root); }
function htAplicarFiltros(g) { window.delcos.components.filters.applyColumnFilters(g); }
