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
agBandejas = (orig => function (...x) {
  const r = orig.apply(this, x);
  const b = $('agband'), acts = document.querySelector('#agcuerpo .tdhead .acts');
  // v2.338.0 (Eric): en el móvil también en una fila (antes, cada uno en la suya); «Volver a hoy» va delante
  const hoy = $('agahoy'); if (hoy && acts && !matchMedia('(min-width: 761px)').matches && acts.firstElementChild !== hoy) acts.prepend(hoy);
  if (b && acts) {
    b.classList.add('agbandin'); acts.appendChild(b);
    b.querySelectorAll('button').forEach(x => x.childNodes.forEach(n => { if (n.nodeType === 3 && /días anteriores/.test(n.textContent)) n.textContent = n.textContent.replace('de días anteriores', 'anteriores'); }));
  }
  return r;
})(agBandejas);
alternarUrgente = (orig => async function (id, ...x) {
  const r = await orig.call(this, id, ...x);
  invalidarCache(); try { DB_PRE.clear(); } catch (e) {}
  if (TAB === 'directorio') buscar(true);
  if (TAB === 'agenda' && typeof agRefrescoQuieto === 'function') agRefrescoQuieto();
  return r;
})(alternarUrgente);
// Tareas del día plegables: un clic en su título las oculta todas y se ven solo las citas (se recuerda en este dispositivo)
const tdTareasPlegadas = () => { try { return localStorage.getItem('delcos-tareas-plegadas') === '1'; } catch (e) { return false; } };
function tdPlegarTareas() {
  const t = $('tdtareas'), cab = t && t.querySelector('.tdtcab'); if (!t || !cab) return;
  t.classList.toggle('plegadas', tdTareasPlegadas());
  cab.setAttribute('role', 'button'); cab.tabIndex = 0;
  cab.setAttribute('aria-expanded', String(!tdTareasPlegadas())); cab.title = tdTareasPlegadas() ? 'Ver las tareas' : 'Ocultar las tareas';
  if (!cab.__plegar) {
    cab.__plegar = true;
    const alternar = () => { try { localStorage.setItem('delcos-tareas-plegadas', tdTareasPlegadas() ? '0' : '1'); } catch (e) {} tdPlegarTareas(); };
    cab.onclick = alternar; cab.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } };
  }
}
pintarTuDia = (orig => async function (...x) { const r = await orig.apply(this, x); tdPlegarTareas(); return r; })(pintarTuDia);


/* v2.274.0 · Agenda: márgenes y «⋯» que no se montan (solo estilo, en index.html). */




