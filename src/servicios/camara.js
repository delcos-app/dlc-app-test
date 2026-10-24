// servicios/camara.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function gs1Fecha(s) {
  if (!/^\d{6}$/.test(s || '')) return '';
  const a = 2000 + +s.slice(0, 2), m = +s.slice(2, 4); let d = +s.slice(4, 6);
  if (m < 1 || m > 12) return '';
  if (!d) d = new Date(a, m, 0).getDate();   // día 00 = último del mes
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function leerGS1(txt) {
  let s = String(txt || '').trim().replace(/^\](d2|C1|Q3|e0)/, '');
  const r = {};
  if (/^\(\d{2,4}\)/.test(s)) {
    const re = /\((\d{2,4})\)([^(]*)/g; let m;
    while ((m = re.exec(s))) r[m[1]] = m[2].trim();
  } else {
    s = s.replace(/^è|^\u001d/, '');
    if (!/^(01|02|00)\d/.test(s)) return null;
    let i = 0;
    while (i < s.length) {
      const ai = s.slice(i, i + 2); i += 2;
      if (GS1_FIJOS[ai]) { r[ai] = s.slice(i, i + GS1_FIJOS[ai]); i += GS1_FIJOS[ai]; if (s[i] === '\u001d') i++; continue; }
      if (GS1_VAR.includes(ai)) { const f = s.indexOf('\u001d', i); r[ai] = s.slice(i, f < 0 ? s.length : f); i = f < 0 ? s.length : f + 1; continue; }
      break;   // identificador que no se conoce: lo que queda no se puede separar con seguridad
    }
  }
  if (!r['01'] && !r['10'] && !r['21']) return null;
  return { gtin: r['01'] || '', lote: r['10'] || '', serie: r['21'] || '', cad: gs1Fecha(r['17']), fab: gs1Fecha(r['11']) };
}

// Qué se escribe en el campo: el lote o el número de serie si el código los trae; si no, el código tal cual
function valorEscaneado(txt, modo) {
  const g = leerGS1(txt);
  if (g && modo === 'lote' && g.lote) return { v: g.lote, g };
  if (g && modo === 'serie' && g.serie) return { v: g.serie, g };
  return { v: String(txt || '').replace(/[\u0000-\u001f]/g, '').trim(), g };
}

function escModo(inp) { const c = ESC_CAMPOS.find(([sel]) => inp.matches(sel)); return c ? c[1] : ''; }

// El botón de la cámara se pone en el mismo momento que el campo (sin aparecer después)
function escPoner(raiz) {
  if (!ESC_PUEDE()) return;
  (raiz || document).querySelectorAll(ESC_CAMPOS.map(c => c[0] + ':not([data-escok])').join(',')).forEach(inp => {
    if (inp.tagName !== 'INPUT') return;
    inp.dataset.escok = '1';
    const w = document.createElement('span'); w.className = 'escw';
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    w.insertAdjacentHTML('beforeend', `<button type="button" class="escbtn" data-esc aria-label="Leer el código con la cámara" title="Leer el código con la cámara">${icono('camera')}</button>`);
  });
}

function escGrupo(inp) {
  const k = inp.dataset.cser != null ? `[data-cser="${inp.dataset.cser}"]` : inp.dataset.pqs != null ? `[data-pqs="${inp.dataset.pqs}"]` : '';
  if (!k) return [inp];
  const caja = inp.closest('.cirser, .cirusa, .dlgficha, dialog') || document;
  return [...caja.querySelectorAll(k)];
}

async function cargarZXing() {
  if (window.ZXing) return window.ZXing;
  await new Promise((ok, mal) => { const s = document.createElement('script'); s.src = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js'; s.integrity = 'sha384-BzBxP10ZE72aitqj5UMmUsbKFliP/DZqA8Wq+BNNhlIJDGoEd1tpkMYXOg9+n6sB'; s.crossOrigin = 'anonymous'; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  return window.ZXing;
}

function escTexto(t) { const p = $('escest'); if (p && p.textContent !== t) p.textContent = t; }

async function abrirEscaner(inp) {
  let d = $('escaner');
  if (!d) { document.body.insertAdjacentHTML('beforeend', '<dialog id="escaner" class="escdlg" aria-label="Leer un código"></dialog>'); d = $('escaner'); }
  const modo = escModo(inp), grupo = escGrupo(inp);
  d.innerHTML = `<div class="escvid"><video id="escv" playsinline muted></video><div class="escmarco"></div></div>
    <div class="escpie"><p id="escest" class="sm">Abriendo la cámara…</p>
      <div class="acts" style="justify-content:flex-end;margin:0"><button type="button" class="btn sec" id="escfin">${grupo.length > 1 ? 'Terminar' : 'Escribirlo a mano'}</button></div></div>`;
  ESC = { inp, modo, grupo, vivo: true, leidos: new Set(grupo.map(x => x.value.trim()).filter(Boolean)), n: 0 };
  $('escfin').onclick = () => cerrarEscaner();
  d.oncancel = e => { e.preventDefault(); cerrarEscaner(); };
  d.showModal();
  try {
    ESC.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
  } catch (e) {
    cerrarEscaner();
    toast(/NotAllowed|Permission/i.test(e && e.name) ? 'No se puede usar la cámara: permite el acceso en el navegador' : 'No se ha podido abrir la cámara', true);
    return;
  }
  if (!ESC || !ESC.vivo) { ESC && ESC.stream && ESC.stream.getTracks().forEach(t => t.stop()); return; }
  const v = $('escv'); v.srcObject = ESC.stream; try { await v.play(); } catch (e) {}
  escTexto(modo === 'lote' ? 'Apunta al código de la caja: se lee el número de lote' : grupo.length > 1 ? `Apunta al código de cada unidad · ${ESC.leidos.size} de ${grupo.length}` : 'Apunta al código de la unidad: se lee el lote o el número de serie');
  if ('BarcodeDetector' in window) {
    try {
      const fmts = await BarcodeDetector.getSupportedFormats();
      ESC.det = new BarcodeDetector(fmts && fmts.length ? { formats: fmts } : undefined);
      const vuelta = async () => {
        if (!ESC || !ESC.vivo) return;
        try { const r = await ESC.det.detect(v); if (r && r.length) escLeido(r[0].rawValue); } catch (e) {}
        if (ESC && ESC.vivo) setTimeout(vuelta, 180);
      };
      vuelta(); return;
    } catch (e) { /* sigue con la librería */ }
  }
  try {
    const Z = await cargarZXing(); if (!ESC || !ESC.vivo) return;
    ESC.zx = new Z.BrowserMultiFormatReader();
    ESC.zx.decodeFromStream(ESC.stream, v, res => { if (res && ESC && ESC.vivo) escLeido(res.getText()); });
  } catch (e) { escTexto('Este navegador no puede leer códigos: escríbelo a mano'); }
}

function escPonerValor(inp, v) {
  inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
}

// Un código leído: al campo (y las fechas si es una entrada de stock); en varias unidades, a la siguiente vacía
function escLeido(txt) {
  if (!ESC || !ESC.vivo || !txt) return;
  const { v, g } = valorEscaneado(txt, ESC.modo); if (!v) return;
  if (ESC.grupo.length > 1) {
    if (ESC.leidos.has(v)) { escTexto(`Esa unidad ya está leída · ${ESC.leidos.size} de ${ESC.grupo.length}`); return; }
    const libre = [ESC.inp, ...ESC.grupo].find(x => !x.value.trim());
    if (!libre) { cerrarEscaner(); return; }
    escPonerValor(libre, v); ESC.leidos.add(v); ESC.n++;
    try { navigator.vibrate && navigator.vibrate(60); } catch (e) {}
    if (!ESC.grupo.some(x => !x.value.trim())) { const n = ESC.n; cerrarEscaner(); toast(`${ESC_ULT_N(n)} leídas`); return; }
    escTexto(`Leída: ${v} · ${ESC.leidos.size} de ${ESC.grupo.length}. Apunta a la siguiente`);
    return;
  }
  escPonerValor(ESC.inp, v);
  if (g && ESC.modo === 'lote') {
    const caja = ESC.inp.closest('.rcl');
    const cad = caja ? caja.querySelector('[data-r="cad"]') : ESC.inp.id === 'mvl' ? $('mvc') : null;
    const fab = caja ? caja.querySelector('[data-r="fab"]') : ESC.inp.id === 'mvl' ? $('mvf') : null;
    if (g.cad && cad && !cad.value) escPonerValor(cad, g.cad);
    if (g.fab && fab && !fab.value) escPonerValor(fab, g.fab);
  }
  try { navigator.vibrate && navigator.vibrate(60); } catch (e) {}
  cerrarEscaner();
  toast(ESC_ULT_TXT(v, g));
}

function cerrarEscaner() {
  if (ESC) {
    ESC.vivo = false;
    try { ESC.zx && ESC.zx.reset(); } catch (e) {}
    try { ESC.stream && ESC.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
    ESC = null;   // sin devolver el foco al campo: en el móvil abriría el teclado
  }
  const d = $('escaner'); if (d && d.open) d.close();
}

/* ============================================================
   v2.261.0 · Leer lotes, números de serie con la cámara (grupo 4 del plan del 11/10/2026). En el móvil o la tableta, los campos
   de lote (entrada de stock y recepción de compras) y de número de serie (intervenciones, equipos y equipos de un pedido) llevan un
   botón de cámara. Se lee el código (DataMatrix, QR, Code 128, EAN…) y, si es GS1 (el de las cajas y la UDI), se separa: el lote
   (10), el número de serie (21), la caducidad (17) y la fabricación (11); en una entrada de stock también se rellenan las fechas si
   están vacías. En los números de serie de varias unidades la cámara sigue abierta y va llenando las siguientes (sin repetir).
   Usa el lector del navegador (BarcodeDetector) y, si no lo tiene (iPhone), una librería que se carga solo al abrir la cámara.
   ============================================================ */
const ESC_CAMPOS = [['#mvl', 'lote'], ['[data-r="lote"]', 'lote'], ['[data-cser]', 'serie'], ['[data-pqs]', 'serie'], ['#eqs', 'serie']];

const ESC_PUEDE = () => !!(window.ESC_FORZAR || (PANTALLA_TACTIL && navigator.mediaDevices && navigator.mediaDevices.getUserMedia));

// GS1: (01) GTIN, (10) lote, (11) fabricación, (17) caducidad, (21) serie… con paréntesis o con el separador GS
const GS1_FIJOS = { '00': 18, '01': 14, '02': 14, '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6, '20': 2 };

const GS1_VAR = ['10', '21', '22', '30', '37', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'];

let ESC_PEND = false;

// La ventana de la cámara
let ESC = null;   // { inp, modo, stream, det, zx, vivo, leidos:Set, n }

const ESC_ULT_N = n => n === 1 ? 'Una unidad' : `${n} unidades`;

const ESC_ULT_TXT = (v, g) => 'Leído: ' + v + (g && g.cad ? ' · caduca el ' + fechaCorta(g.cad) : '');
