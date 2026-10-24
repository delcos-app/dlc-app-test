/* ============================================================
   v2.88.0 · «Clasificadores» en «Filtros y columnas»
   Todos los campos personalizados de Cuentas, Clientes, Pedidos y Productos
   se pueden usar como filtro y como columna desde el panel. Listas y textos
   con pocos valores: desplegable; con muchos: buscador. Números y fechas:
   desde / hasta. «Columna en la tabla» decide si la columna se ve de entrada
   y «Filtro» coloca el campo el primero de la sección.
   ============================================================ */
const CLAS_MAX_LISTA = 15;   // hasta este número de valores, desplegable; con más, buscador
const CLAS_VALORES = {};     // por ámbito: valores que ya tienen las fichas en cada campo
const clasNorm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Los mismos criterios que campos_cumplen() en la base (para Productos, que se filtra aquí)
function clasCumple(v, f) {
  v = v || {};
  return Object.entries(f || {}).every(([k, c]) => {
    const x = v[k];
    if (!c || typeof c !== 'object') return x === c;
    if ('contiene' in c && !clasNorm(x).includes(clasNorm(c.contiene))) return false;
    for (const op of ['desde', 'hasta']) {
      if (!(op in c)) continue;
      if (x == null || x === '') return false;
      const a = typeof c[op] === 'number' ? +x : String(x);
      if (typeof a === 'number' && isNaN(a)) return false;
      if (op === 'desde' ? a < c[op] : a > c[op]) return false;
    }
    return true;
  });
}
// Campos de la pantalla: primero los marcados como «Filtro», después el resto (en su orden)
const clasCampos = amb => [...(CAMPOS[amb] || [])].sort((a, b) => (b.en_filtro ? 1 : 0) - (a.en_filtro ? 1 : 0));
function clasColsGuardadas(amb) { try { return JSON.parse(localStorage.getItem('clas-cols-' + amb)) || {}; } catch (e) { return {}; } }
// Columnas visibles: lo que haya elegido la persona o, si no ha elegido, «Columna en la tabla»
function clasVisibles(amb) {
  const g = clasColsGuardadas(amb);
  return (CAMPOS[amb] || []).filter(c => c.clave in g ? g[c.clave] : c.en_tabla);
}
function clasVeColumna(amb, clave) {
  if (amb === 'medico') return !!(colsConfig().find(c => c.k === 'cp:' + clave) || {}).on;
  return clasVisibles(amb).some(c => c.clave === clave);
}
function clasPonerColumna(amb, clave, on) {
  // Cuentas: sus columnas se guardan con las demás de la tabla (Elegir columnas)
  if (amb === 'medico') {
    const D = colsConfig(), x = D.find(c => c.k === 'cp:' + clave);
    if (x) x.on = on; else D.push({ k: 'cp:' + clave, on, w: 150 });
    colsGuardar(D); return;
  }
  const g = clasColsGuardadas(amb); g[clave] = on;
  try { localStorage.setItem('clas-cols-' + amb, JSON.stringify(g)); } catch (e) { /* sin almacenamiento: dura hasta recargar */ }
}
const clasCabeceras = cols => cols.map(c => `<span class="cpcol">${esc(c.nombre)}</span>`).join('');
const clasCeldas = (cols, v) => cols.map(c => { const t = campoTexto(c, (v || {})[c.clave]); return `<span class="sm">${t ? esc(t) : '<span class="vac">—</span>'}</span>`; }).join('');
// Las columnas de los campos se añaden a la rejilla de la tabla
function clasRejilla(g, n) {
  if (!g || !n) return;
  const cs = getComputedStyle(g);
  g.style.setProperty('--cols', cs.getPropertyValue('--cols').trim() + ' 130px'.repeat(n));
  g.style.minWidth = (parseInt(cs.minWidth) || 900) + 140 * n + 'px';
}
// Texto de un filtro activo (para los chips)
function clasTextoFiltro(c, f) {
  if (f && typeof f === 'object') {
    if ('contiene' in f) return `${c.nombre} contiene «${f.contiene}»`;
    const t = x => campoTexto(c, x);
    return 'desde' in f && 'hasta' in f ? `${c.nombre}: de ${t(f.desde)} a ${t(f.hasta)}` : 'desde' in f ? `${c.nombre}: desde ${t(f.desde)}` : `${c.nombre}: hasta ${t(f.hasta)}`;
  }
  return `${c.nombre}: ${campoTexto(c, f)}`;
}
const clasChips = (amb, estado) => Object.keys(estado || {}).map(k => {
  const c = (CAMPOS[amb] || []).find(x => x.clave === k) || { clave: k, nombre: k };
  return { k, t: clasTextoFiltro(c, estado[k]) };
});
async function clasCargarValores(amb) {
  const { data } = await db.rpc('valores_campos', { p_ambito: amb });
  if (data) CLAS_VALORES[amb] = data;
  return CLAS_VALORES[amb] || {};
}
// Control de filtro de un campo según su tipo y cuántos valores tiene
function clasControl(c, act, vals, id) {
  const a = `id="${id}"`;
  if (c.tipo === 'si_no') return `<select ${a} data-clv><option value="">Todos</option>${[['true', 'Sí'], ['false', 'No']].map(([v, t]) =>
    `<option value="${v}" ${act === (v === 'true') ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  if (c.tipo === 'numero' || c.tipo === 'fecha') {
    const r = act && typeof act === 'object' ? act : {}, tipo = c.tipo === 'fecha' ? 'type="date"' : 'type="text" inputmode="decimal"';
    const val = x => x == null ? '' : esc(c.tipo === 'numero' ? String(x).replace('.', ',') : String(x));
    return `<div class="clasrango"><input ${a} ${tipo} data-clr="desde" value="${val(r.desde)}" placeholder="Desde" aria-label="${esc(c.nombre)}: desde">
      <input ${tipo} data-clr="hasta" value="${val(r.hasta)}" placeholder="Hasta" aria-label="${esc(c.nombre)}: hasta"></div>`;
  }
  const lista = c.tipo === 'lista' ? (c.valores || []) : (vals[c.clave] || []);
  if (lista.length <= CLAS_MAX_LISTA) {
    const ops = typeof act === 'string' && act && !lista.includes(act) ? lista.concat([act]) : lista;
    return `<select ${a} data-clv><option value="">Todos</option>${ops.map(v => `<option ${act === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`;
  }
  // Muchos valores: buscador con sugerencias
  const txt = act && typeof act === 'object' ? act.contiene || '' : typeof act === 'string' ? act : '';
  return `<input ${a} type="search" data-clbus list="${id}_l" value="${esc(txt)}" placeholder="Escribe para buscar" autocomplete="off">
    <datalist id="${id}_l">${lista.map(v => `<option value="${esc(v)}">`).join('')}</datalist>`;
}
// Sección «Clasificadores»: un filtro y la casilla «Columna» por cada campo de la pantalla
async function clasPintar(cont, amb, estado, alCambiar, alColumna, titulo) {
  if (!cont) return;
  const campos = clasCampos(amb);
  const cab = titulo === 'h3' ? '<h3 style="margin-top:18px">Clasificadores</h3>' : '<h4>Clasificadores</h4>';
  if (!campos.length) {
    cont.innerHTML = puedeCatalogos() ? `<div class="htbloque clasif">${cab}<p class="sm">Esta pantalla aún no tiene campos propios. Se crean en Configuración → Clasificadores.</p></div>` : '';
    return;
  }
  const vals = campos.some(c => c.tipo === 'texto' || (c.tipo === 'lista' && (c.valores || []).length > CLAS_MAX_LISTA)) ? await clasCargarValores(amb) : {};
  if (!cont.isConnected) return;
  const pref = 'clas_' + amb + '_';
  cont.innerHTML = `<div class="htbloque clasif">${cab}${campos.map((c, i) => `<div class="clascampo" data-clk="${esc(c.clave)}">
      <div class="clascab"><label for="${pref}${i}">${esc(c.nombre)}</label>
        <label class="clascol" title="Ver «${esc(c.nombre)}» como columna de la tabla"><input type="checkbox" data-clcol ${clasVeColumna(amb, c.clave) ? 'checked' : ''}> Columna</label></div>
      ${clasControl(c, estado[c.clave], vals, pref + i)}</div>`).join('')}</div>`;
  cont.querySelectorAll('[data-clk]').forEach(b => {
    const k = b.dataset.clk, c = campos.find(x => x.clave === k);
    const sel = b.querySelector('select[data-clv]');
    if (sel) sel.onchange = () => { if (!sel.value) delete estado[k]; else estado[k] = c.tipo === 'si_no' ? sel.value === 'true' : sel.value; alCambiar(); };
    const bus = b.querySelector('input[data-clbus]');
    if (bus) { let t; bus.oninput = () => { clearTimeout(t); t = setTimeout(() => { const x = bus.value.trim(); if (x) estado[k] = { contiene: x }; else delete estado[k]; alCambiar(); }, 400); }; }
    const rs = [...b.querySelectorAll('input[data-clr]')];
    rs.forEach(r => r.onchange = () => {
      const o = {};
      for (const z of rs) {
        const v = z.value.trim(); if (!v) continue;
        const n = c.tipo === 'numero' ? +v.replace(',', '.') : v;
        if (c.tipo === 'numero' && isNaN(n)) { toast(`«${c.nombre}» tiene que ser un número`, true); return; }
        o[z.dataset.clr] = n;
      }
      if (Object.keys(o).length) estado[k] = o; else delete estado[k];
      alCambiar();
    });
    const col = b.querySelector('[data-clcol]');
    if (col) col.onchange = () => { clasPonerColumna(amb, k, col.checked); alColumna(); };
  });
}

/* ---------- Clientes, Pedidos y Productos: la sección va en el panel lateral ---------- */
const CLAS_PANT = {
  pacientes: { amb: 'cliente', estado: () => (PAC.campos = PAC.campos || {}), recargar: () => { PAC.pagina = 0; listaPacientes(); } },
  ventas: { amb: 'pedido', estado: () => PEDF, recargar: () => { PEDPAG = 0; listaPedidos(); }, activo: () => !!$('pedlista') },
  productos: { amb: 'producto', estado: () => PRODF, recargar: () => pintarProductos(), activo: () => PSEC === 'productos' }
};
const clasPantalla = sec => { const P = sec && CLAS_PANT[sec.id.replace('v-', '')]; return P && (!P.activo || P.activo()) ? P : null; };
function clasPintarLateral(sec) {
  const P = clasPantalla(sec), cont = $('tools').querySelector('.htclas');
  if (P && cont && htLateralAbierto() && HERR_CTX === 'ht-' + sec.id.replace('v-', '')) clasPintar(cont, P.amb, P.estado(), P.recargar, P.recargar);
}
htAbrirLateral = (orig => function (sec) {
  orig(sec);
  const d = $('tools'), auto = d.querySelector('.htauto');
  if (!clasPantalla(sec) || !htLateralAbierto() || !auto || d.querySelector('.htclas')) return;
  auto.insertAdjacentHTML('beforebegin', '<div class="htclas"></div>');
  clasPintarLateral(sec);
})(htAbrirLateral);
// El contador del botón suma los filtros de Clasificadores
htActivos = (orig => function (sec) { const P = clasPantalla(sec); return orig(sec) + (P ? Object.keys(P.estado()).length : 0); })(htActivos);
// Chips de los filtros de Clasificadores junto al buscador (en su propio contenedor)
htChips = (orig => function (sec) {
  orig(sec);
  const P = clasPantalla(sec), c = sec.querySelector('.htchips'); if (!c) return;
  let c2 = sec.querySelector('.htchips2');
  if (!c2) { c.insertAdjacentHTML('afterend', '<div class="htchips htchips2"></div>'); c2 = sec.querySelector('.htchips2'); }
  const est = P ? P.estado() : {}, chips = P ? clasChips(P.amb, est) : [];
  const html = chips.map(x => `<button class="htchip" type="button" data-hcp="${esc(x.k)}">${esc(x.t)} <span aria-hidden="true">✕</span></button>`).join('');
  if (c2.innerHTML === html) return;
  c2.innerHTML = html;
  c2.querySelectorAll('[data-hcp]').forEach(b => b.onclick = () => { delete est[b.dataset.hcp]; P.recargar(); clasPintarLateral(sec); htContador(sec); });
})(htChips);
// El botón «Filtros y columnas» vive en la barra de la tabla: si la tabla se vuelve a pintar entera
// (Productos al filtrar o guardar), el botón desaparecía con ella. Se vuelve a crear si falta.
htPreparar = (orig => function (sec) {
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
  const r = orig(sec);
  if (!sec.querySelector('.dgrid') && clasPantalla(sec)) htContador(sec);
  return r;
})(htPreparar);
// «Elegir columnas» no repite las columnas de los campos: se eligen en Clasificadores
panelColumnas = (orig => function (titulo, cols, alCambiar) {
  const g = $('v-' + TAB) && $('v-' + TAB).querySelector('.dgrid'), cab = g ? [...(g.querySelector(':scope > .dh') || { children: [] }).children] : [];
  return orig(titulo, cols.filter(c => !(cab[c.i] && cab[c.i].classList.contains('cpcol'))), alCambiar);
})(panelColumnas);

/* ---------- Cuentas: la sección va en su panel de filtros, con sus columnas ---------- */
// Todos los campos pueden ser columna; de entrada se ven los que tienen «Columna en la tabla»
camposEnDirectorio = function () {
  (CAMPOS.medico || []).forEach(c => { if (!COLS.some(x => x.k === 'cp:' + c.clave)) COLS.push({ k: 'cp:' + c.clave, t: c.nombre, w: 150 }); });
};
colsConfig = (orig => function () {
  let guardada = null;
  try { guardada = JSON.parse(localStorage.getItem(colKey()) || 'null'); } catch (e) { /* sin almacenamiento */ }
  return orig().map(c => c.k.startsWith('cp:') && !(guardada || []).some(x => x.k === c.k)
    ? { ...c, on: !!((CAMPOS.medico || []).find(x => 'cp:' + x.clave === c.k) || {}).en_tabla } : c);
})(colsConfig);
abrirHerramientas = (orig => function (ctx, ...r) {
  const x = orig(ctx, ...r);
  const d = $('tools'), z = d.querySelector('.tfcampos');
  if (ctx === 'directorio' && z && d.classList.contains('abierto')) {
    // Después de los filtros y antes de las columnas
    const hcol = [...d.querySelectorAll('h3')].find(h => h.textContent.trim() === 'Columnas');
    if (hcol) hcol.before(z);
    clasPintar(z, 'medico', F.campos = F.campos || {}, () => buscar(true), () => buscar(true), 'h3');
  }
  return x;
})(abrirHerramientas);
pintarChips = (orig => function () {
  orig();
  const cs = clasChips('medico', F.campos);
  if (cs.length) $('chips').insertAdjacentHTML('beforeend', cs.map(x => `<button class="chip" data-xcp="${esc(x.k)}">${esc(x.t)} ✕</button>`).join(''));
})(pintarChips);
$('chips').addEventListener('click', e => {
  const b = e.target.closest('[data-xcp]'); if (!b) return;
  delete F.campos[b.dataset.xcp]; buscar(true);
  const z = $('tools').querySelector('.tfcampos');
  if (z && $('tools').classList.contains('abierto')) clasPintar(z, 'medico', F.campos, () => buscar(true), () => buscar(true), 'h3');
});
// Los filtros de siempre ya están en la sección Clasificadores
camposFiltros = () => '';
['directorio', 'pacientes', 'ventas', 'productos'].forEach(k => { if (AYUDA[k]) AYUDA[k][2].push('En <b>Filtros y columnas → Clasificadores</b> filtras por los campos propios de esta pantalla y eliges cuáles ver como columna. Con pocos valores se eligen de una lista; con muchos, se escribe y se busca.'); });

