/* ============================================================
   DLC OS 2.0 · v2.19.0 · Selectores con tarjeta, rutas en curso,
   Pacientes y Productos como módulos, comerciales en el directorio,
   cambios sin guardar y protección de datos
   v2.424.0: los selectores de fecha, la limpieza del buscador, los cambios sin guardar y los selectores que se cierran
   (core/legacy-a/shell-extras.ts), asignar cartera (screens/settings/portfolio-assign.ts) y el refresco de la ruta al cerrar
   una ventana (screens/routes/route-listeners.ts) están en src/app. asignarCarteraBase se queda: legado 052 la envuelve.
   ============================================================ */

window.delcos.legacyA.startSelectorsAndWindows();
window.delcos.legacyA.listenToSalespersonFilter();

function asignarCarteraBase(id) { return window.delcos.legacyA.assignPortfolio(id); }

window.delcos.legacyA.refreshRouteAfterDialog();
window.delcos.legacyA.addHelpAnchors();
