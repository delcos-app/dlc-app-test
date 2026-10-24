/* ============================================================
   DLC OS 2.0 · v2.36.1 · Móvil: tamaño estable al abrir y solo vertical
   ============================================================ */

// Donde el sistema lo permite (Android instalada), se bloquea la orientación vertical
try { if (screen.orientation && screen.orientation.lock && matchMedia('(display-mode: standalone)').matches) screen.orientation.lock('portrait').catch(() => {}); } catch (e) {}
// Si algún campo dejó la pantalla ampliada, al salir de él se vuelve al tamaño normal
document.addEventListener('focusout', () => {
  if (window.visualViewport && visualViewport.scale > 1.01) window.scrollTo(window.scrollX, window.scrollY);
}, true);


