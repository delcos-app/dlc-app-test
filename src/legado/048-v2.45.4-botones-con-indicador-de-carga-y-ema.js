/* ============================================================
   v2.45.4 · Botones con indicador de carga y emails comprobados al escribir
   ============================================================ */

// Botón en espera: se desactiva, muestra un indicador y recupera su texto al terminar
function conCargaBase(btn, texto, fn) { return window.delcos.legacyB.withLoading(btn, texto, fn); }
