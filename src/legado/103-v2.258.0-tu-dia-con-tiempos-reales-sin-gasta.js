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
const tdClaveXY = (a, b) => a && b && a[0] != null && b[0] != null ? `${(+a[0]).toFixed(5)},${(+a[1]).toFixed(5)}>${(+b[0]).toFixed(5)},${(+b[1]).toFixed(5)}` : '';
const tdRealVigente = () => TD_REAL && Date.now() - TD_REAL.t < 600000;
// Con tiempos reales del día, cada tramo conocido usa su tiempo con tráfico; el resto, la estimación de siempre (minutosEntre es
// una constante: estimarDiaBase llama a tdMinutos, cambiado en su sitio)
function tdMinutos(a, b) {
  if (tdRealVigente()) { const m = TD_REAL.mapa.get(tdClaveXY(a, b)); if (m != null) return m; }
  return minutosEntre(a, b);
}
// El plan del mapa se calcula siempre con la estimación (así su clave es la misma en Rutas y en «Tu día»)
rmPlan = (orig => function (...a) {
  if (a[2]) return orig.apply(this, a);
  const r0 = TD_REAL; TD_REAL = null;
  try { return orig.apply(this, a); } finally { TD_REAL = r0; }
})(rmPlan);
// La ruta de hoy con los mismos puntos y salida que «Tu día en el mapa»
function tdRutaDia(citas, fecha) {
  if (fecha !== hoyISO() || !Array.isArray(citas)) return null;
  if (citas.filter(c => CITA_ABIERTA.includes(c.estado) && xyCita(c)).length < 2) return null;
  let P0; TD_CALC = true; try { P0 = rmPlan(citas, fecha); } finally { TD_CALC = false; }
  if (P0.puntos.length < 2 || P0.puntos.length > 30) return null;
  const salida = P0.segs.length ? `${fecha}T${hm(Math.max(0, P0.segs[0].a))}:00` : null;
  return { puntos: P0.puntos, salida, k: JSON.stringify([P0.puntos, salida]) };
}
function tdPonerReal(ruta, res) {
  if (!ruta || !res || !res.ok || !res.tramos || res.tramos.length !== ruta.puntos.length - 1) return false;
  const mapa = new Map(); res.tramos.forEach((tr, i) => mapa.set(tdClaveXY(ruta.puntos[i], ruta.puntos[i + 1]), Math.round(+tr.min || 0)));
  TD_REAL = { k: ruta.k, mapa, t: Date.now() };
  return true;
}
// Antes de estimar el día de hoy: si el mapa ya tiene la ruta de este orden, se usa (sin consulta)
estimarDia = (orig => function (citas, fecha, ...x) {
  // Solo la estimación de «Tu día» (TD_CITAS); las demás (mapa, planificador) siguen como estaban
  if (TD_CALC || citas !== TD_CITAS) return orig.call(this, citas, fecha, ...x);
  const ruta = tdRutaDia(citas, fecha);
  if (!ruta) { if (TD_REAL && fecha === hoyISO()) TD_REAL = null; return orig.call(this, citas, fecha, ...x); }
  if (!(tdRealVigente() && TD_REAL.k === ruta.k)) {
    TD_REAL = null;
    const m = RM_MEM.get(ruta.k);
    if (m && Date.now() - m.t < 600000) tdPonerReal(ruta, m.r);
  }
  return orig.call(this, citas, fecha, ...x);
})(estimarDia);
// Pedir los tiempos con tráfico (una consulta) y volver a pintar «Tu día»
async function tdTrafico(mudo) {
  const ruta = tdRutaDia(TD_CITAS, AG_FECHA); if (!ruta) return;
  const b = $('tdtrafico'); if (b) { b.disabled = true; b.textContent = 'Calculando…'; }
  const res = await rmRuta(ruta.puntos, ruta.salida);
  if (tdPonerReal(ruta, res)) { if (agN()) repintarDiaSuave(); }
  else {
    if (!mudo) toast((RM_MOTIVO[res && res.motivo] || RM_MOTIVO.servicio) + ': las horas siguen siendo aproximadas', true);
    const b2 = $('tdtrafico'); if (b2) { b2.disabled = false; b2.textContent = 'Calcular con tráfico'; }
  }
}
empezarJornada = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  try { if (AG_FECHA === hoyISO()) tdTrafico(true); } catch (e) {}
  return r;
})(empezarJornada);
// En la cabecera de «Tu día» (hoy): si las horas van con tráfico real o el botón para calcularlas
function tdMarcaTrafico() {
  const st = document.querySelector('#agcuerpo .tdhead .tdstats'); if (!st) return;
  st.querySelectorAll('.tdtraf').forEach(x => x.remove());
  const ruta = tdRutaDia(TD_CITAS, AG_FECHA); if (!ruta || AG_VISTA) return;
  const real = tdRealVigente() && TD_REAL.k === ruta.k;
  st.insertAdjacentHTML('beforeend', real
    ? '<span class="tdtraf tdtrafok" title="Horas calculadas por las calles y con el tráfico de ahora (TomTom)">Con tráfico real</span>'
    : '<span class="tdtraf"><button type="button" class="kcfg" id="tdtrafico" title="Una petición al servicio de rutas: horas por las calles y con el tráfico de ahora">Calcular con tráfico</button></span>');
  const b = $('tdtrafico'); if (b) b.onclick = () => tdTrafico(false);
}
pintarTuDia = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  if (agConCinta()) tdMarcaTrafico();
  return r;
})(pintarTuDia);

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



