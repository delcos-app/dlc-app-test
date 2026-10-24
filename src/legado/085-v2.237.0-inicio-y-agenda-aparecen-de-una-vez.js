/* ============================================================
   v2.237.0 · Inicio y Agenda aparecen de una vez (aviso de Eric): al abrir la app la primera pantalla se enseñaba
   sin esperar (salían los indicadores antiguos y luego el mosaico) y la Agenda se daba por lista antes de tener la
   cinta y «Tu semana». Inicio enseña desde el principio el esqueleto del mosaico; la Agenda sigue con el cargador hasta tener
   la cinta y «Tu semana» (como mucho 10 s).
   ============================================================ */
// Tope de espera por pantalla: en el móvil con mala cobertura la Agenda encadena varias consultas
const LISTA_ESPERA = { agenda: 10000 };
const LISTA_PARA = {
  // Inicio: el mosaico ya pintado (si la persona no tiene mosaico, basta con que no queden esqueletos)
  inicio: s => !!s.querySelector('#inimos > *') || (!s.classList.contains('conmos') && !s.querySelector('.ksk, .skel') && performance.now() - (s.__t0 || 0) > 1500),
  // Agenda en vista de día: la cinta y «Tu semana» con sus días (o, si no llega, un respiro de 0,8 s tras la cinta)
  // v2.248.0: la vista del día avisa cuando está pintada entera (dataset.listo)
  agenda: s => (typeof AG_MODO !== 'undefined' && AG_MODO !== 'dia') || s.dataset.listo === '1'
};
revelar = (orig => function (el, max, desde) {
  const tab = el && el.id && el.id.slice(2), listo = LISTA_PARA[tab];
  if (!listo || !el.matches || !el.matches('main > section')) return orig(el, max, desde);
  // Inicio con su esqueleto: sin cargador encima
  if (tab === 'inicio' && !ES_MEDICO()) { inicioEsqueleto(); el.classList.remove('preparando'); llegar(el); return; }
  const turno = ++REVELADO, t0 = performance.now(), tope = LISTA_ESPERA[tab] || 6000;
  el.classList.add('preparando'); el.__t0 = t0; el.__cinta = 0;
  const mirar = () => estable(el, Math.max(300, tope - (performance.now() - t0)), desde).then(() => {
    if (turno !== REVELADO) return;
    if (listo(el) || performance.now() - t0 > tope) { el.classList.remove('preparando'); llegar(el); }
    else setTimeout(mirar, 60);
  });
  mirar();
})(revelar);
// Al abrir la app, la primera pantalla también espera a estar completa (antes se enseñaba sin pasar por el revelado)
(() => {
  const app = $('app'); if (!app) return;
  let visto = !app.classList.contains('hide');
  const revelarActual = () => { const sc = $('v-' + TAB); if (sc && !sc.classList.contains('hide') && LISTA_PARA[TAB]) revelar(sc, 6000, Date.now() - 5); };
  // El arranque puede enseñar la app antes de que se ejecute esto: entonces se aplica ya a la pantalla que se ve
  if (visto) revelarActual();
  new MutationObserver(() => {
    const ahora = !app.classList.contains('hide'); if (ahora === visto) return; visto = ahora;
    if (ahora) revelarActual();
  }).observe(app, { attributes: true, attributeFilter: ['class'] });
})();

// Inicio: el mosaico está desde el primer momento (en esqueleto) y lo de antes no se pinta nunca; así no hace falta tapar la pantalla
function inicioEsqueleto() {
  if (ES_MEDICO()) return;
  const sec = $('v-inicio'), sal = sec && sec.querySelector(':scope > .saludo'); if (!sal) return;
  sec.classList.add('conmos');
  if (!$('inimos')) {
    sal.insertAdjacentHTML('afterend', '<div id="inimos" class="inimos"></div><div class="inikpisb"><button type="button" class="btn sec" id="inikpisver">Ver tus indicadores</button></div>');
    $('inikpisver').onclick = () => { const on = !sec.classList.contains('conkpis'); sec.classList.toggle('conkpis', on); $('inikpisver').textContent = on ? 'Ocultar tus indicadores' : 'Ver tus indicadores'; };
  }
  const box = $('inimos'); if (box.children.length) return;
  const t = (c, n) => `<div class="mt ${c} mtsk"><i class="plsk" style="width:38%"></i>${[...Array(n)].map((_, i) => `<i class="plsk" style="width:${[64, 82, 56, 74, 60][i % 5]}%"></i>`).join('')}</div>`;
  box.innerHTML = t('mtat', 6) + t('mthoy', 4) + t('', 2) + t('', 2) + t('mtprox', 3);
}
cargarInicio = (orig => function (...a) { if (TAB === 'inicio') inicioEsqueleto(); return orig.apply(this, a); })(cargarInicio);
LISTA_PARA.inicio = s => true;   // con el esqueleto del mosaico se enseña al momento



