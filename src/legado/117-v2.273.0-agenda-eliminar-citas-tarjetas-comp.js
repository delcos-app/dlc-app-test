/* ============================================================
   v2.273.0 · Agenda: eliminar citas, tarjetas compactas, cinta desde esta semana y cabecera en una línea (peticiones de Eric, 12/10/2026).
   - «⋯» de la cita: «Eliminar la cita» (de hoy en adelante; desaparece sin dejar rastro).
   - Citas movidas o descartadas: tarjeta compacta (nombre, centro y estado en una línea).
   - La cinta empieza en la semana del día que se ve (esta semana a la izquierda, la siguiente a la derecha); «La semana pasada»
     ya no sale de entrada. Si la app sigue abierta al cambiar de día, la Agenda vuelve a hoy.
   - «Les toca visita» y «Pendientes de días anteriores» van en la misma línea que los botones de Tu día; el «⋯» del día, en la esquina.
   - Cada tarjeta con un color suave según cómo está: por hacer (azul), hecha (verde), no estaba (ámbar), movida o descartada (gris).
   - Marcar o quitar «urgente» se ve al momento en la lista de fichas y en la Agenda.
   - Fuera «Repartir la semana» (Eric: no aporta).
   ============================================================ */
var AG_HOY_VISTO = null;
async function alternarUrgente(id, ...x) {
  const r = await alternarUrgenteBase.call(this, id, ...x);
  invalidarCache(); try { DB_PRE.clear(); } catch (e) {}
  if (TAB === 'directorio') buscar(true);
  if (TAB === 'agenda' && typeof agRefrescoQuieto === 'function') agRefrescoQuieto();
  return r;
}


/* v2.274.0 · Agenda: márgenes y «⋯» que no se montan (solo estilo, en index.html). */




