// Configuración de cada una (Eventos solo en su pestaña «Eventos», no en Informe de gastos)
Object.assign(PL_SECC, {
  eventos: () => { const on = document.querySelector('#v-eventos .pagtabs button.on'); return !on || on === document.querySelector('#v-eventos .pagtabs button') ? 'lista' : null; },
  cirugias: () => 'lista', concursos: () => 'lista', parque: () => 'lista'
});
Object.keys(BLQ).forEach(tab => {
  const o = BLQ[tab];
  PL[tab] = { lista: plRejilla({ tab, que: () => o.que, bloques: o, rapidos: [['#plg-' + tab, o.grupo]], banda: 'plgb-' + tab,
    activos: () => { const sec = $('v-' + tab); return (PLG[tab] ? 1 : 0) + (sec ? sec.querySelectorAll('.htchips .htchip').length : 0); } }) };
});

// Antes de ajustar la plantilla, los bloques se convierten en tabla
plSync = (orig => function (tab) { if (BLQ[tab] && plCfg(tab)) blqConvertir(tab); return orig(tab); })(plSync);
document.addEventListener('click', e => {
  const k = e.target.closest('main > section.plantilla [data-plg]'); if (!k) return;
  const tab = k.closest('section').id.slice(2); PLG[tab] = PLG[tab] === k.dataset.plg ? '' : k.dataset.plg; blqFiltrar(tab); plSync(tab);
});
Object.keys(BLQ).forEach(plObservar);
ir = (orig => function (t, ...a) { const r = orig.call(this, t, ...a); if (PL[t]) { plVigilar(t); setTimeout(() => plVigilar(t), 0); } return r; })(ir);
Object.keys(PL).forEach(plVigilar);
// Las pestañas de las páginas (.pagtabs) van justo debajo de la cabecera: la banda y la barra, después de ellas
plSync = (orig => function (tab) {
  const r = orig(tab), sec = $('v-' + tab); if (!sec || !sec.classList.contains('plantilla')) return r;
  const tabs = sec.querySelector(':scope > .pagtabs, :scope > .subnav'), kp = sec.querySelector(':scope > .plkpis'), tl = sec.querySelector(':scope > .pltool');
  if (tabs && tl && (tabs.compareDocumentPosition(tl) & 2)) { const ref = kp || tl; ref.before(tabs); }
  return r;
})(plSync);


