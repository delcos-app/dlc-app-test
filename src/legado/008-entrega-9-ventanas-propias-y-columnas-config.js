/* ============================================================
   DLC OS 2.0 · Entrega 9: ventanas propias y columnas configurables
   ============================================================ */

/* ---------------- ventanas propias ---------------- */



/* ---------------- tabla del directorio con columnas ---------------- */

const COLS = [
  { k: 'nombre', t: `${TT('medico', 's', '', 'l', 'C')}`, w: 250, fijo: true },
  { k: 'especialidad', get t() { return TT('especialidad', 's', '', 'l', 'C'); }, w: 170 },
  { k: 'centro_nombre', t: 'Centro', w: 200 },
  { k: 'municipio', t: 'Municipio', w: 140 },
  { k: 'direccion', t: 'Dirección', w: 200 },
  { k: 'telefono', t: 'Teléfono', w: 130 },
  { k: 'dias', t: 'Días', w: 150 },
  { k: 'ultima_visita', t: `${TT('visita', 's', 'ultimo', 'C', 'l')}`, w: 130 },
  { k: 'estado_comercial', t: 'Estado', w: 150 }
];




function cabeceraTablaBase() {
  const cfg = colsConfig().filter(c => c.on);
  const ancho = cfg.reduce((n, c) => n + c.w, 0);
  $('thead').innerHTML = cfg.map(c => {
    const col = COLS.find(x => x.k === c.k) || { t: c.k };
    return `<span class="tcell th" style="width:${c.w}px;min-width:${c.w}px">${esc(col.t)}<i class="res" data-res="${c.k}"></i></span>`;
  }).join('');
  $('thead').style.minWidth = ancho + 'px';
  $('lista').style.minWidth = ancho + 'px';
}

/* arrastrar el borde de una columna */
let ARR = null;
document.addEventListener('pointerdown', e => {
  const h = e.target.closest('i.res[data-res]'); if (!h) return;   // solo el borde de una cabecera
  const cfg = colsConfig(), c = cfg.find(x => x.k === h.dataset.res);
  if (!c) return;
  e.preventDefault();
  ARR = { k: h.dataset.res, x0: e.clientX, w0: c.w, cfg };
  document.body.style.cursor = 'col-resize';
});
document.addEventListener('pointermove', e => {
  if (!ARR) return;
  const w = Math.max(80, Math.min(600, Math.round(ARR.w0 + (e.clientX - ARR.x0))));
  ARR.w = w;
  document.querySelectorAll(`.tcell`).forEach(() => {});
  const cfg = ARR.cfg.map(c => c.k === ARR.k ? { ...c, w } : c);
  colsGuardar(cfg);
  cabeceraTabla();
  document.querySelectorAll('#lista .trow').forEach(tr => {
    const vis = cfg.filter(c => c.on);
    [...tr.children].forEach((cel, i) => { if (vis[i]) { cel.style.width = vis[i].w + 'px'; cel.style.minWidth = vis[i].w + 'px'; } });
  });
});
document.addEventListener('pointerup', () => { if (ARR) { ARR = null; document.body.style.cursor = ''; } });


$('cercaBtn').addEventListener('click', e => cercaDeMi(e.target));
$('dupBtn').addEventListener('click', () => ir('duplicados'));
$('dirtools').addEventListener('click', () => abrirHerramientas('directorio'));



