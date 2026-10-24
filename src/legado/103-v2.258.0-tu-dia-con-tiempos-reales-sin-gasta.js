/* ============================================================
   v2.258.0 · «Tu día» con tiempos reales, sin gastar de más (decisión de Eric, 11/10/2026: la opción más eficiente).
   Las horas de «Tu día» se estimaban en línea recta. Ahora, solo HOY y con dos o más paradas abiertas con ubicación:
   - Si «Tu día en el mapa» (Rutas) ya ha pedido la ruta del día con el mismo orden, sus tiempos con tráfico se usan aquí sin
     ninguna consulta más (misma clave en RM_MEM, 10 minutos en memoria: TomTom no deja guardarlos).
   - Si no, se piden solo en momentos con intención: al pulsar «Empezar jornada» o «Calcular con tráfico» en la cabecera de
     «Tu día». Mover una cita a mano no gasta: se vuelve a la estimación hasta que se pida otra vez.
   - La cabecera dice si las horas son «con tráfico real» o estimadas.
   ============================================================ */
let TD_REAL = null, TD_CALC = false;   // { k, mapa: Map('a>b' → minutos), t } · TD_CALC: calculando la clave (sin volver a entrar)
// Antes de estimar el día de hoy: si el mapa ya tiene la ruta de este orden, se usa (sin consulta)
function estimarDia(citas, fecha, ...x) {
  // Solo la estimación de «Tu día» (TD_CITAS); las demás (mapa, planificador) siguen como estaban
  if (TD_CALC || citas !== TD_CITAS) return estimarDiaBase2.call(this, citas, fecha, ...x);
  const ruta = tdRutaDia(citas, fecha);
  if (!ruta) { if (TD_REAL && fecha === hoyISO()) TD_REAL = null; return estimarDiaBase2.call(this, citas, fecha, ...x); }
  if (!(tdRealVigente() && TD_REAL.k === ruta.k)) {
    TD_REAL = null;
    const m = RM_MEM.get(ruta.k);
    if (m && Date.now() - m.t < 600000) tdPonerReal(ruta, m.r);
  }
  return estimarDiaBase2.call(this, citas, fecha, ...x);
}

// ---- Filtros rápidos que no desaparecen (aviso intermitente de la batería: en Contactos, en el móvil, un filtro aparecía tarde
// cuando sus opciones llegaban después de entrar). Un filtro rápido cuyo desplegable aún no tiene opciones se ve desactivado en su
// sitio, en vez de esconderse y aparecer luego empujando el buscador.
plSync = (orig => function (tab, ...x) {
  const r = orig.call(this, tab, ...x);
  const sec = $('v-' + tab); if (!sec || !sec.classList.contains('plantilla')) return r;
  sec.querySelectorAll(':scope > .pltool [data-plr]').forEach(b => {
    const s = plSel(b.dataset.plr); if (!s || !s.options) return;
    const w = s.closest('#fcomwrap'); if (w && w.classList.contains('hide')) return;
    const nada = s.options.length <= 1;
    if (nada) {
      if (b.classList.contains('hide')) b.classList.remove('hide');
      if (!b.classList.contains('plnada')) b.classList.add('plnada');
      const t = b.dataset.plt || plEtiq(b.dataset.plr); if (t && b.textContent !== t) b.textContent = t;
    } else if (b.classList.contains('plnada') && !(BLQ[tab] && b.dataset.plr === '#plg-' + tab)) b.classList.remove('plnada');
  });
  return r;
})(plSync);



