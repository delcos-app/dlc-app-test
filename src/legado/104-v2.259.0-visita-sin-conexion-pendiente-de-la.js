esErrorRed = (orig => function (e) {
  return orig(e) || /ha tardado demasiado|tiempo agotado|timeout|timed out/i.test(String((e && (e.message || e)) || ''));
})(esErrorRed);
// Catálogos guardados en el móvil (resultado por defecto de la visita, «No estaba»…)
cargarCatalogos = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  try {
    const vacio = Object.values(CAT).every(v => !v || !v.length);
    if (!vacio) localStorage.setItem('dlc-cat', JSON.stringify(CAT));
    else { const g = JSON.parse(localStorage.getItem('dlc-cat') || 'null'); if (g) Object.keys(CAT).forEach(k => { if (g[k] && g[k].length) CAT[k] = g[k]; }); }
  } catch (e) {}
  return r;
})(cargarCatalogos);
// Aviso en la ventana de la visita sin conexión
abrirVisitaBase = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  if (!navigator.onLine && $('dlg').open && $('vguardar') && !$('dbody').querySelector('.vsinred')) {
    const fh = $('dbody').querySelector('.fh');
    const html = `<div class="banda-aviso vsinred"><b>Sin conexión.</b> ${esc(TT('visita', 's', 'la', 'l', 'C'))} se guarda en este móvil y se envía sola al recuperar la conexión. Las muestras necesitan conexión.</div>`;
    if (fh) fh.insertAdjacentHTML('afterend', html); else $('dbody').insertAdjacentHTML('afterbegin', html);
  }
  return r;
})(abrirVisitaBase);


// (R-12: vaciarCola se definía aquí otra vez; ahora está en su sitio, más arriba)
// El aviso de conexión también dice lo que no se ha podido enviar (y al pulsarlo, se ve y se decide)
pintarConexion = (orig => function (...a) {
  const r = orig.apply(this, a);
  const el = $('conex'), ko = colaKo().length;
  if (el && navigator.onLine && !colaLeer().length && ko) { el.className = 'conex err'; el.textContent = `${ko} ${ko === 1 ? 'cambio sin enviar' : 'cambios sin enviar'} · ver`; }
  return r;
})(pintarConexion);
document.addEventListener('click', async e => {
  if (!e.target.closest('#conex.err')) return;
  const l = colaKo(); if (!l.length) return;
  const txt = l.map(o => `· ${o.etiqueta || o.fn} del ${new Date(o.t || o.falla).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}: ${o.motivo || 'rechazado'}`).join('\n');
  const k = await elegirOpcion('Cambios sin enviar', `Se guardaron sin conexión y el servidor no los ha aceptado:\n\n${txt}`,
    [{ k: 'reint', t: 'Volver a intentarlo' }, { k: 'desc', t: 'Descartarlos', cls: 'sec' }, { k: 'nada', t: 'Cerrar', cls: 'sec' }]);
  if (k === 'reint') { colaGuardar(colaLeer().concat(l.map(o => { const x = Object.assign({}, o); delete x.motivo; delete x.falla; return x; }))); localStorage.removeItem(COLA_KO); pintarConexion(); vaciarCola(); }
  else if (k === 'desc' && await preguntar('Se borran del móvil y no se enviarán.', { titulo: '¿Descartar los cambios sin enviar?', ok: 'Descartar', peligro: true })) { localStorage.removeItem(COLA_KO); pintarConexion(); }
});

pintarTuDia = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  if (agConCinta()) tdMarcarPendientes();
  return r;
})(pintarTuDia);
escribirRpc = (orig => async function (fn, payload, ...a) {
  const r = await orig.call(this, fn, payload, ...a);
  if (fn === 'registrar_actividad' && r && r.data && r.data.encolada) setTimeout(() => { if (TAB === 'agenda') tdMarcarPendientes(); }, 0);
  return r;
})(escribirRpc);




