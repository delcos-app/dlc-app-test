
plSync = (orig => function (tab) {
  if (tab === 'ventas') { const sec = $('v-ventas'), k = PL_SECC.ventas(); if (sec && k) plAjenos(sec, k); }
  return orig(tab);
})(plSync);


