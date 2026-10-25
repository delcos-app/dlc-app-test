// servicios/archivos.js · está en src/app/services/files.ts (v2.425.0). Estos nombres se quedan: Pedidos, Facturación, Visita, la ficha y
// los puentes los usan. Normas: docs/normas_codigo.md.

function descargar() { return window.delcos.core.files.download(); }
function cargarQR() { return window.delcos.core.files.loadQr(); }
function leerJustificante(f) { return window.delcos.core.files.readReceipt(f); }
function subirJustificantes(pedido, lista) { return window.delcos.core.files.uploadReceipts(pedido, lista); }
function aBase64(blob) { return window.delcos.core.files.toBase64(blob); }
// Archivos: botón con el diseño de la plataforma, nombre del archivo y miniatura si es una imagen
function selectorArchivo(inp) { return window.delcos.core.files.filePicker(inp); }

const FOTOS_VISITA_MAX = window.delcos.core.files.VISIT_PHOTOS_MAX;
