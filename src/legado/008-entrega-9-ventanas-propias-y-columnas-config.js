/* ============================================================
   DLC OS 2.0 · Entrega 9: ventanas propias y columnas configurables
   ============================================================ */

/* ---------------- ventanas propias ---------------- */

function appVentana({ titulo, msg, ok, cancel, campo, opciones, peligro }) {
  return new Promise(res => {
    const d = $('mini');
    d.innerHTML = `<div class="fbox">
      <div class="fh"><h2>${esc(titulo || 'Confirmar')}</h2></div>
      ${msg ? `<p style="margin:0 0 10px;white-space:pre-line">${esc(msg)}</p>` : ''}
      ${campo ? `<input id="mcampo" type="${campo.tipo || 'text'}" value="${esc(campo.valor || '')}"
                   placeholder="${esc(campo.placeholder || '')}" ${campo.min ? `min="${campo.min}"` : ''}>` : ''}
      ${opciones && opciones.length ? `<div class="chips" style="padding:10px 0 0">${
        opciones.map(o => `<button type="button" class="chip" data-mop="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}
      <div class="acts" style="justify-content:flex-end">
        ${cancel === false ? '' : `<button class="btn sec" id="mno">${esc(cancel || 'Cancelar')}</button>`}
        <button class="btn ${peligro ? 'dang' : ''}" id="mok">${esc(ok || 'Aceptar')}</button></div></div>`;

    const fin = v => { d.close(); res(v); };
    $('mok').onclick = () => fin(campo ? ($('mcampo').value || '') : true);
    if ($('mno')) $('mno').onclick = () => fin(campo ? null : false);
    d.querySelectorAll('[data-mop]').forEach(b => b.onclick = () => { $('mcampo').value = b.dataset.mop; });
    d.onclick = e => { if (e.target === d) fin(campo ? null : false); };
    d.oncancel = e => { e.preventDefault(); fin(campo ? null : false); };
    d.showModal();
    setTimeout(() => { const i = $('mcampo'); if (i) { i.focus(); i.onkeydown = ev => { if (ev.key === 'Enter') fin(i.value); }; } else $('mok').focus(); }, 30);
  });
}

const preguntar = (msg, o = {}) => appVentana({ msg, titulo: o.titulo, ok: o.ok, peligro: o.peligro });
const pedirTexto = (msg, valor, o = {}) => appVentana({ msg, titulo: o.titulo, ok: o.ok || 'Guardar', campo: { valor, placeholder: o.placeholder, tipo: o.tipo }, opciones: o.opciones });
const pedirFecha = (msg, valor, o = {}) => appVentana({ msg, titulo: o.titulo || 'Elige la fecha', ok: o.ok || 'Aceptar', campo: { valor, tipo: 'date' } });

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
const COLS_DEF = ['nombre', 'especialidad', 'centro_nombre', 'municipio', 'dias', 'estado_comercial'];
const colKey = () => 'dlc-cols-' + (PERFIL ? PERFIL.id : '');

const colsGuardar = c => localStorage.setItem(colKey(), JSON.stringify(c));


function filaTabla(m) {
  const cfg = colsConfig().filter(c => c.on);
  return `<button class="trow" data-id="${m.id}">${cfg.map(c =>
    `<span class="tcell" style="width:${c.w}px;min-width:${c.w}px">${celda(m, c.k)}</span>`).join('')}</button>`;
}

function cabeceraTabla() {
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



