mosContar = (orig => function (box) {
  const els = [...box.querySelectorAll('[data-mcnt], [data-meur]')];
  if (plYaContado('mos', els.map(e => e.dataset.mcnt != null ? e.dataset.mcnt : e.dataset.meur))) return;
  return orig(box);
})(mosContar);
kvContar = (orig => function (raiz) {
  const ns = [...raiz.querySelectorAll('[data-kvn]')];
  if (plYaContado('kv', ns.map(n => n.dataset.kvn))) { ns.forEach(n => n.textContent = num(+n.dataset.kvn)); return; }
  return orig(raiz);
})(kvContar);
pkContar = (orig => function (els, fmt) {
  if (plYaContado('pk' + els.length, els.map(e => e.dataset.v))) { els.forEach(el => el.textContent = fmt(+el.dataset.v, el)); return; }
  return orig(els, fmt);
})(pkContar);

plSync = (orig => function (tab) {
  if (tab === 'ventas') { const sec = $('v-ventas'), k = PL_SECC.ventas(); if (sec && k) plAjenos(sec, k); }
  return orig(tab);
})(plSync);


