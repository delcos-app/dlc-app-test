
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

