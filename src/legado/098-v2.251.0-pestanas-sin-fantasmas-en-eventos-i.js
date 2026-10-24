// El filtro de bloques no desaparece: con un solo bloque se queda desactivado
plSync = (orig => function (tab, ...x) {
  const r = orig.call(this, tab, ...x);
  if (!BLQ[tab]) return r;
  const b = document.querySelector(`#v-${tab} > .pltool [data-plr="#plg-${tab}"]`), s = $('plg-' + tab);
  if (b && s) {
    const nada = s.options.length < 2;
    if (nada && b.classList.contains('hide')) b.classList.remove('hide');
    if (b.classList.contains('plnada') !== nada) b.classList.toggle('plnada', nada);
    if (nada && b.textContent !== BLQ[tab].grupo) b.textContent = BLQ[tab].grupo;
  }
  return r;
})(plSync);


