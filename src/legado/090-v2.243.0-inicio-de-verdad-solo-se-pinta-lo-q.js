/* ============================================================
   v2.243.0 · Inicio de verdad: solo se pinta lo que se ve. Desde el mosaico (v2.228) Inicio seguía pintando por debajo las
   tarjetas de antes (agenda de hoy, próximas acciones, urgentes, últimas visitas, comisión, rutas, Mi semana, ventas del mes,
   alertas, equipo, operativa, volver a llamar…) y las escondía, con unas 12 consultas que nadie veía. Ahora Inicio pinta el
   mosaico (aparte, pintarMosaico) y los indicadores (#kpis, que se ven con «Ver tus indicadores»); lo demás ya no se pide.
   El portal del profesional sigue como estaba.
   ============================================================ */
function inicioQuitarAntiguo() {
  const sec = $('v-inicio'); if (!sec) return;
  sec.querySelectorAll(':scope > .cols, :scope > #iniextra, :scope > #inialerta, :scope > #vistazo').forEach(x => x.remove());
}
// Los indicadores de Inicio (antes dentro de pintarInicioBase, junto con las tarjetas)
async function inicioIndicadores() {
  const cfg = kpiConfig().filter(x => x.on);
  const res = await rpcCache('panel_inicio', { lim: 6 }, 'inicio');
  marca('datos de Inicio recibidos');
  if (TAB !== 'inicio' || !$('kpis')) return;
  const data = res.data;
  if (!data) { $('kpis').innerHTML = '<div class="vacio">Sin conexión y sin copia guardada todavía.</div>'; return; }
  const k = data.kpis;
  const kpi = (n, t, cls, accion, ayuda, id) =>
    `<div class="kpi ${cls || ''} ${accion ? 'click' : ''}" ${accion ? `data-k="${accion}"` : ''} ${id ? `data-kid="${id}"` : ''}>
       ${ayuda ? `<button class="ai" data-ayuda-txt="${esc(ayuda)}" data-ayuda-tit="${esc(t)}" aria-label="Qué es">i</button>` : ''}
       <b>${typeof n === 'string' ? n : num(n)}</b><span>${esc(t.charAt(0).toUpperCase() + t.slice(1))}</span></div>`;
  $('kpis').innerHTML = cfg.map((x, i) => {
    if (x.filtro) return `<div class="kpi click" data-kf="${esc(JSON.stringify(x.filtro))}" data-kfi="${i}">
        <button class="ai" data-ayuda-txt="${esc(AYUDA_KPI.filtro + ' Filtro: ' + textoFiltro(x.filtro) + '.')}" data-ayuda-tit="${esc(x.t || 'Filtro guardado')}" aria-label="Qué es">i</button>
        <b class="cont"><span class="spin" style="width:18px;height:18px;border-width:2px;display:inline-block"></span></b><span>${esc(x.t || textoFiltro(x.filtro))}</span></div>`;
    const c = KPI_CAT.find(y => y.id === x.id);
    if (!kpiPermitido(c)) return '';
    return kpi(c.v(k), x.t || c.t, c.cls ? c.cls(k) : '', c.h, AYUDA_KPI[c.id], c.id);
  }).join('');
  if (res.cache) avisoCache($('kpis'), res.fecha);
  cfg.forEach((x, i) => {
    if (!x.filtro) return;
    contarFiltro(x.filtro).then(n => { const b = document.querySelector(`#kpis [data-kfi="${i}"] .cont`); if (b) b.textContent = num(n); }).catch(() => {});
  });
  ponerAyudas();
  // Las explicaciones, después de que kpisVivos convierta las tarjetas (lo hace al momento, en su observador)
  await new Promise(r => setTimeout(r, 0));
  if (TAB === 'inicio') indicadoresCompletos();
  marca('Inicio completo');
}
pintarInicio = (orig => async function () {
  if (ES_MEDICO()) return orig();
  $('v-inicio').classList.remove('ini-cargando');
  inicioQuitarAntiguo();
  await inicioIndicadores();
})(pintarInicio);


