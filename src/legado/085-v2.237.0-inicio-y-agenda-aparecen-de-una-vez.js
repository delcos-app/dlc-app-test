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

LISTA_PARA.inicio = s => true;   // con el esqueleto del mosaico se enseña al momento



