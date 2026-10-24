/* ============================================================
   v2.56.0 · Componentes comunes: control de carga (sin destellos,
   mínimo visible y sin recargas innecesarias), tablas con anchos
   ajustables, campos de formulario (IVA, archivos, cantidades,
   notas) y ajustes de KPIs, Facturación, Analítica y Cuentas
   ============================================================ */

Object.assign(ICON_NOM, {"upload": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"17 8 12 3 7 8\" /> <line x1=\"12\" x2=\"12\" y1=\"3\" y2=\"15\" />", "list": "<path d=\"M3 12h.01\" /> <path d=\"M3 18h.01\" /> <path d=\"M3 6h.01\" /> <path d=\"M8 12h13\" /> <path d=\"M8 18h13\" /> <path d=\"M8 6h13\" />", "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" /> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /> <path d=\"M8 16H3v5\" />", "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" /> <circle cx=\"9\" cy=\"9\" r=\"2\" /> <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />", "file": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" />"});

/* ---------------- 1. Escrituras: saber si algo ha cambiado ---------------- */

let ESCRITURAS = 0;
const ES_ESCRITURA = /^(guardar|registrar_(?!error)|emitir|rectificar|marcar|borrar|eliminar|asignar|unificar|validar|anular|crear|descartar|restaurar|estado_|recibir|traspasar|vincular|mover|aplicar|reprogramar|cancelar|confirmar|terminar)/;
db.rpc = (orig => function (fn, params, opts) {
  const r = orig.call(db, fn, params, opts);
  if (ES_ESCRITURA.test(fn) && r && typeof r.then === 'function') Promise.resolve(r).then(x => { if (!x || !x.error) ESCRITURAS++; }, () => {});
  return r;
})(db.rpc);
// Cerrar una ventana sin haber cambiado nada no recarga la agenda ni la ruta
let ESC_AL_ABRIR = 0, SIN_CAMBIOS_HASTA = 0;
new MutationObserver(() => {
  const d = $('dlg');
  if (d.open) ESC_AL_ABRIR = ESCRITURAS;
  else if (ESCRITURAS === ESC_AL_ABRIR) SIN_CAMBIOS_HASTA = Date.now() + 800;
}).observe($('dlg'), { attributes: true, attributeFilter: ['open'] });

/* ---------------- 2. Pantallas ya cargadas: no se recargan sin motivo ---------------- */

const CACHE_MOD = {};   // módulo → { clave, t, esc }
const ESTADO_MOD = {
  inicio: () => '', ventas: () => PEDSEC, productos: () => PSEC, facturacion: () => FSEC,
  analitica: () => (typeof ASEC !== 'undefined' ? ASEC : ''), pacientes: () => '',
  agenda: () => [AG_MODO, AG_FECHA, AG_VISTA ? AG_VISTA.id : ''].join('|')
};
let VIA_IR = null;
[['inicio', 'cargarInicio'], ['ventas', 'cargarVentas'], ['productos', 'cargarProductosModulo'], ['facturacion', 'cargarFacturacion'],
 ['analitica', 'cargarAnalitica'], ['pacientes', 'cargarPacientes'], ['agenda', 'cargarAgenda']].forEach(([t, fn]) => {
  const orig = window[fn] || eval(fn);
  const nueva = async function (...a) {
    if (usarCache(t)) { if (t === 'inicio') pintarActualizado(); return; }
    if (t === 'agenda' && Date.now() < SIN_CAMBIOS_HASTA && !VIA_IR) return;   // cierre de ventana sin cambios
    const r = await orig.apply(this, a); marcarCache(t); if (t === 'inicio') pintarActualizado(); return r;
  };
  eval(`${fn} = nueva`);
});
const IR_V256 = ir;
ir = function (t) { VIA_IR = t; try { IR_V256(t); } finally { setTimeout(() => { VIA_IR = null; }, 0); } };
// Inicio: cuándo se actualizó y botón para actualizar
function pintarActualizado() {
  const acts = document.querySelector('#v-inicio .saludo .acts, #v-inicio .hero .acts, #v-inicio .inihead .acts') || document.querySelector('#v-inicio .saludo');
  if (!acts) return;
  let b = $('iniact');
  if (!b) {
    acts.insertAdjacentHTML('beforeend', `<button class="btn sec iniact" id="iniact" type="button" title="Actualizar los datos">${svgIco(ICON_NOM['refresh-cw'])}<span></span></button>`);
    b = $('iniact'); b.onclick = () => { delete CACHE_MOD.inicio; conCarga(b, 'Actualizando…', () => cargarInicio()); };
  }
  requestAnimationFrame(() => document.body.classList.add('inilisto'));
  const c = CACHE_MOD.inicio; if (!c) return;
  const m = Math.floor((Date.now() - c.t) / 60000);
  b.querySelector('span').textContent = m < 1 ? ' Actualizado ahora' : ` Actualizado hace ${m} min`;
}
setInterval(() => { if (TAB === 'inicio') pintarActualizado(); }, 60000);
setTimeout(() => document.body.classList.add('inilisto'), 6000);   // red de seguridad: los botones de Inicio nunca quedan ocultos

/* ---------------- 3. Indicador de carga: aparece a partir de 120 ms y dura al menos 350 ms ---------------- */

// El retraso lo hace el estilo (sin JavaScript); aquí se quita el retraso antiguo y se asegura el mínimo visible
ir = (orig => function (t) { orig(t); const s = $('v-' + TAB); if (s && s.classList.contains('cargando-pend')) { s.classList.remove('cargando-pend'); if (PEND > 0) s.classList.add('cargando'); } })(ir);
new MutationObserver(ms => ms.forEach(m => {
  const s = m.target; if (!s.matches || !s.matches('main > section, dialog, .card')) return;
  const tiene = s.classList.contains('cargando') || s.classList.contains('cargandolocal');
  if (tiene && !s.__cargaDesde) s.__cargaDesde = Date.now();
  if (!tiene && s.__cargaDesde) {
    const hecho = Date.now() - s.__cargaDesde; s.__cargaDesde = 0;
    // Si el indicador llegó a verse (más de 120 ms), se mantiene hasta completar 350 ms
    if (false) { s.classList.add('cargamin'); setTimeout(() => s.classList.remove('cargamin'), 470 - hecho); }
  }
})).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
ventanaCargando = async function (fn) { const d = $('dlg'); d.classList.add('cargando'); try { return await fn(); } finally { d.classList.remove('cargando'); } };
document.addEventListener('click', e => { const b = e.target.closest('main .pag button:not(:disabled)'); if (b) cargaLocal(b.closest('.card') || b.closest('.pag').parentElement); }, true);
document.addEventListener('change', e => { if (e.target.closest('main .pag select')) cargaLocal(e.target.closest('.card') || e.target.closest('.pag').parentElement); }, true);
// Cambio de pestaña: la vista anterior se queda fija hasta que llegan los datos y la pantalla deja de cambiar
congelar = function (sec) {
  if (!sec || sec.classList.contains('hide') || document.querySelector('.congelada')) return;
  const r = sec.getBoundingClientRect(); if (r.height < 40) return;
  const c = sec.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  c.classList.add('congelada'); c.classList.remove('cargando', 'cargando-pend', 'cargamin');
  Object.assign(c.style, { position: 'absolute', left: (r.left + scrollX) + 'px', top: (r.top + scrollY) + 'px', width: r.width + 'px', margin: 0, pointerEvents: 'none', zIndex: 40, background: 'var(--bg, #F3F8FC)' });
  document.body.appendChild(c); sec.style.minHeight = r.height + 'px';
  let ultimo = performance.now(); const mo = new MutationObserver(() => { ultimo = performance.now(); }); mo.observe(sec, { childList: true, subtree: true });
  const t0 = performance.now();
  const w = setInterval(() => {
    if ((PEND === 0 && performance.now() - ultimo > 120 && performance.now() - t0 > 100) || performance.now() - t0 > 2500) {
      clearInterval(w); mo.disconnect(); c.remove(); requestAnimationFrame(() => { sec.style.minHeight = ''; });
    }
  }, 40);
};

/* ---------------- 4. Tablas: anchos de columna ajustables y recordados por persona ---------------- */

const claveAnchos = tipo => `ht-anchos-${(PERFIL || {}).id || ''}-${tipo}`;
htAplicarColumnas = (orig => function (g) {
  orig(g);
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
})(htAplicarColumnas);
document.addEventListener('pointerdown', e => {
  const h = e.target.closest('.dgrid .colres'); if (!h) return;
  e.preventDefault(); e.stopPropagation();
  const g = h.closest('.dgrid'), tipo = htTipo(g), dh = g.querySelector(':scope > .dh'), i = +h.dataset.colres;
  const actuales = {}; [...dh.children].forEach((c, k) => { if (!c.classList.contains('htno')) actuales[k] = Math.round(c.getBoundingClientRect().width); });
  const x0 = e.clientX, w0 = actuales[i];
  const mover = ev => {
    actuales[i] = Math.max(60, Math.round(w0 + ev.clientX - x0));
    const pistas = g.dataset.colsBase.split(/\s+(?![^(]*\))/).filter(Boolean);
    g.style.setProperty('--cols', pistas.map((p, k) => actuales[k] !== undefined ? actuales[k] + 'px' : null).filter(Boolean).join(' '));
    g.style.minWidth = 'max-content';
  };
  const soltar = () => { document.removeEventListener('pointermove', mover); document.removeEventListener('pointerup', soltar); localStorage.setItem(claveAnchos(tipo), JSON.stringify(actuales)); };
  document.addEventListener('pointermove', mover); document.addEventListener('pointerup', soltar);
}, true);
// En el panel de columnas: volver a los anchos originales
panelColumnas = (orig => function (titulo, cols, alCambiar) {
  orig(titulo, cols, alCambiar);
  const sec = $('v-' + TAB), g = sec && sec.querySelector('.dgrid'); if (!g) return;
  $('tools2').querySelector('.tbox').insertAdjacentHTML('beforeend', '<div class="acts"><button class="btn sec" type="button" id="t2anchos">Restablecer los anchos</button></div>');
  $('t2anchos').onclick = () => { localStorage.removeItem(claveAnchos(htTipo(g))); g.style.minWidth = ''; delete g.dataset.ht; htAplicarColumnas(g); toast('Anchos restablecidos'); };
})(panelColumnas);

/* ---------------- 5. Campos de formulario ---------------- */

// IVA: siempre una lista con los tipos legales, en cualquier ventana (se detecta por su nombre o su etiqueta)
const ES_IVA = i => /iva/i.test(i.id + ' ' + (i.dataset.f || '') + ' ' + (i.name || '')) || /\bIVA\s*\(%\)|tipo de iva/i.test(((i.id && document.querySelector(`label[for="${i.id}"]`)) || {}).textContent || '');
ivaSelector = (orig => function (inp) {
  if (!inp || inp.dataset.ivasel) return;
  inp.dataset.sel = '1';                                   // sin botones de sumar y restar
  const w = inp.closest('.numw');
  if (w) { w.parentNode.insertBefore(inp, w); w.remove(); }   // si ya los tenía, se quitan
  orig(inp);
})(ivaSelector);
// Cantidades con botones; importes y porcentajes sin ellos (sumar de uno en uno a un importe no tiene sentido)
mejorarCampos = (orig => function (raiz) {
  (raiz || document).querySelectorAll('input[type=number]:not([data-sel])').forEach(i => {
    if (ES_IVA(i)) { ivaSelector(i); return; }
    const txt = (i.id + ' ' + (i.dataset.f || '') + ' ' + (i.placeholder || '') + ' ' + (((i.id && document.querySelector(`label[for="${i.id}"]`)) || i.closest('label') || {}).textContent || '')).toLowerCase();
    const decimal = /^(0?\.\d+|any)$/.test(i.getAttribute('step') || '');
    if (decimal || /€|precio|importe|coste|portes|env[ií]o|descuento|pvp|cobro|total|base/.test(txt)) { i.dataset.sel = '1'; i.classList.add('numdec'); }
  });
  return orig(raiz);
})(mejorarCampos);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1)
  (n.matches && n.matches('input[type=number],input[type=text]') ? [n] : [...n.querySelectorAll('input[type=number],input[type=text]')]).forEach(i => { if (!i.dataset.ivasel && ES_IVA(i) && !/iban|precio|importe/i.test(i.id)) ivaSelector(i); });
}).observe(document.body, { childList: true, subtree: true });
// Archivos: botón con el diseño de la plataforma, nombre del archivo y miniatura si es una imagen
function selectorArchivo(inp) {
  if (!inp || inp.dataset.fp || inp.id === 'mkfile') return;
  inp.dataset.fp = '1';
  const img = /image/.test(inp.accept || '');
  const w = document.createElement('div'); w.className = 'filepick';
  w.innerHTML = `<span class="fpmini">${svgIco(ICON_NOM[img ? 'image' : 'file'])}</span>
    <div class="fptx"><b>${img ? 'Ninguna imagen elegida' : 'Ningún archivo elegido'}</b><span class="sm">${img ? 'JPG o PNG. Mejor cuadrada y con buena luz.' : 'Elige un archivo de tu equipo.'}</span></div>
    <button type="button" class="btn sec">${svgIco(ICON_NOM.upload)} ${img ? 'Elegir imagen' : 'Elegir archivo'}</button>`;
  inp.parentNode.insertBefore(w, inp); inp.classList.add('hide'); w.appendChild(inp);
  w.querySelector('button').onclick = () => inp.click();
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    w.querySelector('.fptx b').textContent = f.name; w.querySelector('.fptx .sm').textContent = Math.round(f.size / 1024) + ' KB';
    if (img) { const u = URL.createObjectURL(f); w.querySelector('.fpmini').innerHTML = `<img src="${u}" alt="">`; }
  });
}
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1)
  (n.matches && n.matches('input[type=file]') ? [n] : [...n.querySelectorAll('input[type=file]')]).forEach(selectorArchivo);
}).observe(document.body, { childList: true, subtree: true });
// Notas y textos largos: crecen al escribir
document.addEventListener('input', e => { const t = e.target; if (t.tagName === 'TEXTAREA') { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 420) + 'px'; } });
// Ventana de texto: «area» para notas (varias líneas y más espacio)
appVentana = (orig => function (o) {
  const p = orig(o);
  if (o && o.campo && o.campo.tipo === 'area') setTimeout(() => {
    const i = $('mcampo'); if (!i) return;
    const t = document.createElement('textarea'); t.id = 'mcampo'; t.rows = 6; t.value = i.value; t.placeholder = i.placeholder; i.replaceWith(t);
    $('mini').classList.add('ancha'); t.focus();
  }, 0);
  return p;
})(appVentana);

/* ---------------- 6. Cuentas: barra ordenada, mapa como icono y ayuda en el título ---------------- */

function barraCuentas() {
  const m = $('mapaBtn');
  if (m) {
    const lista = /lista/i.test(m.textContent);
    const ico = svgIco(ICON_NOM[lista ? 'list' : 'map']);
    if (!m.querySelector('svg') || m.dataset.modo !== String(lista)) { m.dataset.modo = String(lista); m.innerHTML = ico; m.title = lista ? 'Ver la lista' : 'Ver en el mapa'; m.setAttribute('aria-label', m.title); }
    m.classList.add('icobtn');
  }
  const t = $('dirtools'); if (t) t.classList.add('aderecha');
  const ai = document.querySelector('#v-directorio .panel .ai'), h = document.querySelector('#dircab h1');
  if (ai && h && !h.contains(ai)) h.appendChild(ai);
}
new MutationObserver(() => { if (TAB === 'directorio') barraCuentas(); }).observe($('v-directorio'), { childList: true, subtree: true, characterData: true });

/* ---------------- 7. Facturación: «Facturas» y «Configuración» ---------------- */

const FAC_CONFIG = [['empresa', 'Datos fiscales'], ['series', 'Series y numeración'], ['verifactu', 'VeriFactu'], ['registro', 'Registro']];
let FAC_ULTIMA = 'empresa';
new MutationObserver(() => { if (TAB === 'facturacion') subnavFacturacion(); }).observe($('v-facturacion'), { childList: true, subtree: true });
cargarFacturacion = (orig => async function (...a) { const r = await orig.apply(this, a); requestAnimationFrame(() => { if (TAB === 'facturacion') subnavFacturacion(); }); return r; })(cargarFacturacion);

/* ---------------- 8. KPIs ---------------- */

new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.querySelectorAll) {
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const x = w.currentNode; if (/Indicadores de Inicio|^Indicadores$/.test(x.nodeValue.trim())) x.nodeValue = x.nodeValue.replace('Indicadores de Inicio', 'KPIs de Inicio').replace(/^(\s*)Indicadores(\s*)$/, '$1KPIs$2'); }
} }).observe(document.body, { childList: true, subtree: true });


