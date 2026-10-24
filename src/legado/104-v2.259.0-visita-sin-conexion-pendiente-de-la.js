/* ============================================================
   v2.259.0 · Visita sin conexión (pendiente de la auditoría del 8/10, cerrado el 11/10/2026). Antes, sin cobertura la ventana
   «Registrar visita» ni se abría; si la red caía al guardar, la visita podía rechazarse al reenviarla otro día (por la fecha) y
   perderse sin aviso, o duplicarse al repetir. Ahora:
   - La visita se abre sin conexión con la última copia de la ficha (la misma de la ficha) y de sus resultados, y los catálogos
     quedan guardados en el móvil.
   - Al guardar sin conexión: a la cola con «sin conexión» (el servidor no la rechaza por la fecha), con el mismo op_id aunque se
     repita, y las fotos se guardan en el móvil (IndexedDB) y se suben solas cuando se envía la visita.
   - «Tu día» marca la cita «Registrada en el móvil · pendiente de enviar» y quita «Registrar».
   - La cola se envía de una en una (sin dos envíos a la vez); lo que el servidor rechaza no se pierde: queda en «sin enviar», con
     aviso y la opción de reintentar o descartar; el tiempo agotado cuenta como fallo de red.
   - Sin conexión, la app arranca con el perfil guardado aunque no pueda comprobar la sesión.
   - Las muestras siguen necesitando conexión (el límite legal se comprueba en el servidor): la ventana lo avisa.
   ============================================================ */
let VISITA_OP = null;   // op_id de la ventana abierta (el mismo si se pulsa Guardar dos veces)
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

// ---- Fotos de una visita guardada sin conexión: en el móvil hasta que la visita se envía
const FOTOS_IDB = 'delcos-fotos';

// ---- La cola: de una en una, sin perder lo que el servidor rechaza
const COLA_KO = 'dlc-cola-ko';
const colaKo = () => { try { return JSON.parse(localStorage.getItem(COLA_KO) || '[]'); } catch (e) { return []; } };
let COLA_ENVIANDO = false;
vaciarCola = async function () {
  if (!navigator.onLine || COLA_ENVIANDO) return;
  let c = colaLeer(); if (!c.length) return;
  COLA_ENVIANDO = true;
  const habia = c.length; let fallidos = 0;
  try {
    pintarConexion();
    while (c.length) {
      const op = c[0];
      let data = null, error = null;
      try { ({ data, error } = await db.rpc(op.fn, op.payload)); } catch (e) { error = e; }
      if (error && esErrorRed(error)) break;                                              // sigue sin red: luego
      if (error && /jwt|token/i.test(String(error.message || ''))) { try { await db.auth.refreshSession(); } catch (e) {} break; }
      if (error || (data && data.ok === false)) { colaKoPoner(op, error ? error.message : (data.error || 'rechazado')); fallidos++; }
      else if (op.fn === 'registrar_actividad' && data && data.id && op.payload && op.payload.p && op.payload.p.op_id) await fotosEnviarPendientes(op.payload.p.op_id, data.id);
      c = colaLeer().slice(1); colaGuardar(c);
    }
  } finally { COLA_ENVIANDO = false; }
  pintarConexion();
  if (fallidos) toast(`${fallidos === 1 ? 'Un cambio guardado sin conexión no se ha podido enviar' : fallidos + ' cambios guardados sin conexión no se han podido enviar'}: pulsa el aviso de arriba para verlos`, true);
  if (colaLeer().length < habia) { invalidarCache(); cargarInicio(); if (TAB === 'agenda') cargarAgenda(); }
};
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




