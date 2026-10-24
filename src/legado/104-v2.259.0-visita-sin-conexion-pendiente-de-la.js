

// (R-12: vaciarCola se definía aquí otra vez; ahora está en su sitio, más arriba)
// El aviso de conexión también dice lo que no se ha podido enviar (y al pulsarlo, se ve y se decide)
function pintarConexion(...a) {
  const r = pintarConexionBase.apply(this, a);
  const el = $('conex'), ko = colaKo().length;
  if (el && navigator.onLine && !colaLeer().length && ko) { el.className = 'conex err'; el.textContent = `${ko} ${ko === 1 ? 'cambio sin enviar' : 'cambios sin enviar'} · ver`; }
  return r;
}
document.addEventListener('click', async e => {
  if (!e.target.closest('#conex.err')) return;
  const l = colaKo(); if (!l.length) return;
  const txt = l.map(o => `· ${o.etiqueta || o.fn} del ${new Date(o.t || o.falla).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}: ${o.motivo || 'rechazado'}`).join('\n');
  const k = await elegirOpcion('Cambios sin enviar', `Se guardaron sin conexión y el servidor no los ha aceptado:\n\n${txt}`,
    [{ k: 'reint', t: 'Volver a intentarlo' }, { k: 'desc', t: 'Descartarlos', cls: 'sec' }, { k: 'nada', t: 'Cerrar', cls: 'sec' }]);
  if (k === 'reint') { colaGuardar(colaLeer().concat(l.map(o => { const x = Object.assign({}, o); delete x.motivo; delete x.falla; return x; }))); localStorage.removeItem(COLA_KO); pintarConexion(); vaciarCola(); }
  else if (k === 'desc' && await preguntar('Se borran del móvil y no se enviarán.', { titulo: '¿Descartar los cambios sin enviar?', ok: 'Descartar', peligro: true })) { localStorage.removeItem(COLA_KO); pintarConexion(); }
});





