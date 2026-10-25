/* ============================================================
   DLC OS 2.0 · Entrega 4: agenda, rutas, plan del día y cola sin conexión
   v2.424.0: el indicador de conexión, los botones de las citas, «Añadir a mi agenda», los botones [data-ruta] y la distancia
   están en src/app (core/legacy-a/connection.ts, screens/agenda/appointment-clicks.ts, screens/routes/route-listeners.ts).
   Quedan el estado global y los nombres que usa el código antiguo (legado 104 envuelve pintarConexionBase; km la usan muchos).
   ============================================================ */

function pintarConexionBase() { window.delcos.legacyA.paintConnection(); }
window.delcos.legacyA.watchConnection();

let AG_MODO = 'dia', AG_FECHA = null;
window.delcos.legacyA.listenToAppointmentClicks();

let RUTAS = [], PLAN = null;
window.delcos.legacyA.listenToRouteButtons();

/* distancia aproximada en km entre dos puntos */
function km(a, b) { return window.delcos.legacyA.km(a, b); }

window.delcos.legacyA.listenToAddToAgenda();
