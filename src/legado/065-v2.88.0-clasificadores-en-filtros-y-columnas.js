
// «Elegir columnas» no repite las columnas de los campos: se eligen en Clasificadores
function panelColumnas(titulo, cols, alCambiar) {
  const g = $('v-' + TAB) && $('v-' + TAB).querySelector('.dgrid'), cab = g ? [...(g.querySelector(':scope > .dh') || { children: [] }).children] : [];
  return panelColumnasBase2(titulo, cols.filter(c => !(cab[c.i] && cab[c.i].classList.contains('cpcol'))), alCambiar);
}

/* ---------- Cuentas: la sección va en su panel de filtros, con sus columnas ---------- */
// Todos los campos pueden ser columna; de entrada se ven los que tienen «Columna en la tabla»
camposEnDirectorio = function () {
  (CAMPOS.medico || []).forEach(c => { if (!COLS.some(x => x.k === 'cp:' + c.clave)) COLS.push({ k: 'cp:' + c.clave, t: c.nombre, w: 150 }); });
};
function abrirHerramientas(ctx, ...r) {
  const x = abrirHerramientasBase3(ctx, ...r);
  const d = $('tools'), z = d.querySelector('.tfcampos');
  if (ctx === 'directorio' && z && d.classList.contains('abierto')) {
    // Después de los filtros y antes de las columnas
    const hcol = [...d.querySelectorAll('h3')].find(h => h.textContent.trim() === 'Columnas');
    if (hcol) hcol.before(z);
    clasPintar(z, 'medico', F.campos = F.campos || {}, () => buscar(true), () => buscar(true), 'h3');
  }
  return x;
}
function pintarChips() {
  pintarChipsBase();
  const cs = clasChips('medico', F.campos);
  if (cs.length) $('chips').insertAdjacentHTML('beforeend', cs.map(x => `<button class="chip" data-xcp="${esc(x.k)}">${esc(x.t)} ✕</button>`).join(''));
}
$('chips').addEventListener('click', e => {
  const b = e.target.closest('[data-xcp]'); if (!b) return;
  delete F.campos[b.dataset.xcp]; buscar(true);
  const z = $('tools').querySelector('.tfcampos');
  if (z && $('tools').classList.contains('abierto')) clasPintar(z, 'medico', F.campos, () => buscar(true), () => buscar(true), 'h3');
});
// Los filtros de siempre ya están en la sección Clasificadores
camposFiltros = () => '';
['directorio', 'pacientes', 'ventas', 'productos'].forEach(k => { if (AYUDA[k]) AYUDA[k][2].push('En <b>Filtros y columnas → Clasificadores</b> filtras por los campos propios de esta pantalla y eliges cuáles ver como columna. Con pocos valores se eligen de una lista; con muchos, se escribe y se busca.'); });

