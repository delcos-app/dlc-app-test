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
new MutationObserver(() => { if (ESC_PEND) return; ESC_PEND = true; queueMicrotask(() => { ESC_PEND = false; escPoner(); }); })
  .observe(document.body, { childList: true, subtree: true });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-esc]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const inp = b.parentNode.querySelector('input'); if (inp) abrirEscaner(inp);
}, true);

// La ventana de la cámara
let ESC = null;   // { inp, modo, stream, det, zx, vivo, leidos:Set, n }
const ESC_ULT_N = n => n === 1 ? 'Una unidad' : `${n} unidades`;
const ESC_ULT_TXT = (v, g) => 'Leído: ' + v + (g && g.cad ? ' · caduca el ' + fechaCorta(g.cad) : '');




