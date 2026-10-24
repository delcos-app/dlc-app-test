/* ============================================================
   v2.239.0 · Modelo «Lista» en Eventos, Intervenciones, Concursos y Parque instalado: los bloques de tarjetas pasan a una tabla con
   las mismas filas (cada fila conserva su botón y lo que abre). Los bloques (Próximos, Pasados, Reposiciones…) pasan a ser
   indicadores que filtran y un filtro rápido; si una fila estaba en dos bloques, sale una vez y cuenta en los dos.
   La acción principal sube a la cabecera; las demás, al «⋯».
   ============================================================ */
const PLG = {};   // bloque elegido por pantalla
const plTxt = el => el ? el.textContent.trim().replace(/\s+/g, ' ') : '';
const plSm = el => { const s = el && el.querySelector('.tx .sm, .sm'); return plTxt(s); };
const BLQ = {
  eventos: { attr: 'ev', que: 'eventos', grupo: 'Cuándo', def: 'Eventos',
    cols: [['Evento', ''], ['Fecha', ''], ['Tipo', ''], ['Lugar', ''], ['Asistentes', 'num'], ['Gasto', 'num']],
    celdas: b => {
      const p = plSm(b).split(' · '), hora = p.find(x => /^\d{1,2}:\d{2}$/.test(x)), tipo = p.find(x => EV_TIPOS.includes(x));
      const asis = p.find(x => /asistente/.test(x)) || '', lugar = p.filter((x, i) => i > 0 && x !== hora && x !== tipo && x !== asis).join(' · ');
      return [`<b>${esc(plTxt(b.querySelector('.tx b')))}</b>`, esc(p[0] + (hora ? ' · ' + hora : '')), esc(tipo || '—'), esc(lugar || '—'), esc((asis.match(/\d+/) || ['0'])[0]), esc(plTxt(b.querySelector('.evtot')) || '—')];
    } },
  cirugias: { attr: 'cir', que: 'intervenciones', grupo: 'Bloque', def: 'Intervenciones',
    cols: [['Fecha', ''], ['Intervención', ''], ['Equipo y lugar', ''], ['Estado', '']],
    celdas: b => [esc(plTxt(b.querySelector('.cirf b')) + (plTxt(b.querySelector('.cirf .sm')) ? ' · ' + plTxt(b.querySelector('.cirf .sm')) : '')),
      `<b>${esc(plTxt(b.querySelector('.tx b')))}</b>`, esc(plSm(b.querySelector('.tx'))), (b.querySelector('.cirest') || {}).innerHTML || ''] },
  concursos: { attr: 'con', que: 'concursos', grupo: 'Bloque', def: 'Concursos',
    cols: [['Concurso', ''], ['Cliente, organismo y lotes', ''], ['Estado y plazos', '']],
    celdas: b => [`<b>${esc(plTxt(b.querySelector('.tx b')))}</b>`, esc(plSm(b.querySelector('.tx'))), (b.querySelector('.cirest') || {}).innerHTML || ''] },
  parque: { attr: 'eq', que: 'equipos', grupo: 'Bloque', def: 'Todos los equipos',
    cols: [['Equipo', ''], ['Serie, centro y contrato', ''], ['Revisión y vencimientos', '']],
    celdas: b => [`<b>${esc(plTxt(b.querySelector('.tx b')))}</b>`, esc(plSm(b.querySelector('.tx'))), (b.querySelector('.cirest') || {}).innerHTML || ''] }
};
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
// El recuento de estas tablas cuenta solo las filas que se ven (bloque y búsqueda)
plRecuento = (orig => function (sec, c) {
  if (!c.bloques) return orig(sec, c);
  const g = sec.querySelector('.dgrid'); if (!g) return sec.querySelector('#cfgcuerpo .vacio') ? `<b>0</b> ${esc(c.que())}` : '';
  return `<b>${num(g.querySelectorAll(':scope > .dr:not(.htfuera):not(.plgfuera)').length)}</b> ${esc(c.que())}`;
})(plRecuento);
document.addEventListener('click', e => {
  const k = e.target.closest('main > section.plantilla [data-plg]'); if (!k) return;
  const tab = k.closest('section').id.slice(2); PLG[tab] = PLG[tab] === k.dataset.plg ? '' : k.dataset.plg; blqFiltrar(tab); plSync(tab);
});
Object.keys(BLQ).forEach(plObservar);
// Las páginas (Eventos, Intervenciones…) crean su sección al entrar: el observador se engancha entonces (y otra vez si se vuelve a crear)
const PL_OBSEL = {};
ir = (orig => function (t, ...a) { const r = orig.call(this, t, ...a); if (PL[t]) { plVigilar(t); setTimeout(() => plVigilar(t), 0); } return r; })(ir);
Object.keys(PL).forEach(plVigilar);
// Las pestañas de las páginas (.pagtabs) van justo debajo de la cabecera: la banda y la barra, después de ellas
plSync = (orig => function (tab) {
  const r = orig(tab), sec = $('v-' + tab); if (!sec || !sec.classList.contains('plantilla')) return r;
  const tabs = sec.querySelector(':scope > .pagtabs, :scope > .subnav'), kp = sec.querySelector(':scope > .plkpis'), tl = sec.querySelector(':scope > .pltool');
  if (tabs && tl && (tabs.compareDocumentPosition(tl) & 2)) { const ref = kp || tl; ref.before(tabs); }
  return r;
})(plSync);


