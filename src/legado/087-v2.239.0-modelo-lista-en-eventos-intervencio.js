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

// Pasa los bloques de tarjetas de la pantalla a una tabla (cada vez que la pantalla los vuelve a pintar)
function blqConvertir(tab) {
  const o = BLQ[tab], sec = $('v-' + tab), caja = sec && sec.querySelector('#cfgcuerpo'); if (!o || !caja) return;
  const items = [...caja.querySelectorAll('.lista > .item[data-' + o.attr + ']')];
  const yaTabla = caja.querySelector('.dgrid.blq-' + tab);
  if (!items.length && (yaTabla || !caja.querySelector('.cirpag, .evpag'))) return;
  // Acciones: la principal a la cabecera; las demás, al «⋯» (también en la cabecera, ocultas)
  const sal = sec.querySelector(':scope > .saludo');
  let acts = sal && sal.querySelector(':scope > .acts');
  if (sal && !acts) { sal.insertAdjacentHTML('beforeend', '<div class="acts"></div>'); acts = sal.querySelector(':scope > .acts'); }
  const cab = caja.querySelector('.evcab');
  // las de la vez anterior (también el «+» del móvil, que va al final de la sección) se quitan: si no, se repetirían sus id
  if (cab && acts) { sec.querySelectorAll('[data-plmov]').forEach(b => b.remove()); [...cab.querySelectorAll('button')].forEach(b => { b.dataset.plmov = '1'; acts.appendChild(b); }); cab.remove(); }
  // Filas: una por registro, con los bloques en que sale
  const filas = new Map(), grupos = [];
  caja.querySelectorAll('section.card, .card').forEach(card => {
    const h = card.querySelector('h2'), g = h ? plTxt(h).replace(/\s*·\s*[\d.]+$/, '') : o.def;
    const its = [...card.querySelectorAll('.lista > .item[data-' + o.attr + ']')]; if (!its.length) return;
    if (!grupos.includes(g)) grupos.push(g);
    its.forEach(b => { const k = b.dataset[o.attr]; if (filas.has(k)) { filas.get(k).g.add(g); b.remove(); } else filas.set(k, { b, g: new Set([g]) }); });
  });
  const vacio = caja.querySelector('.vacio');
  const nota = [...caja.querySelectorAll('.cirpag > p.sm, .evpag > p.sm')];
  const wrap = document.createElement('div'); wrap.className = 'dgrid-wrap';
  wrap.innerHTML = `<div class="dgrid blq-${tab}"><div class="dh">${o.cols.map(([t, k]) => `<span class="${k}">${esc(t)}</span>`).join('')}</div></div>`;
  const g = wrap.firstElementChild;
  filas.forEach(({ b, g: gs }) => {
    const cel = o.celdas(b), click = b.onclick;
    b.className = 'dr'; b.innerHTML = cel.map((x, i) => `<span class="${o.cols[i][1]}">${x || '<span class="vac">—</span>'}</span>`).join('');
    b.dataset.grupos = [...gs].join('|'); b.onclick = click; g.appendChild(b);
  });
  if (!filas.size) wrap.innerHTML = `<div class="vacio">${esc(vacio ? plTxt(vacio) : 'Todavía no hay nada aquí.')}</div>`;
  caja.innerHTML = ''; nota.forEach(p => caja.appendChild(p)); caja.appendChild(wrap);
  // Bloque elegido (filtro rápido y banda de indicadores)
  if (PLG[tab] && !grupos.includes(PLG[tab])) PLG[tab] = '';
  let sel = $('plg-' + tab);
  if (!sel) { sec.insertAdjacentHTML('beforeend', `<div class="plgsel hide"><label for="plg-${tab}">${esc(o.grupo)}</label><select id="plg-${tab}"></select></div>`); sel = $('plg-' + tab); sel.onchange = () => { PLG[tab] = sel.value; blqFiltrar(tab); }; }
  sel.innerHTML = '<option value="">Todos</option>' + (grupos.length > 1 ? grupos.map(x => `<option ${PLG[tab] === x ? 'selected' : ''}>${esc(x)}</option>`).join('') : '');
  let band = $('plgb-' + tab);
  if (!band) { band = document.createElement('div'); band.id = 'plgb-' + tab; band.className = 'plgband'; sec.appendChild(band); }
  const cuenta = x => [...filas.values()].filter(f => f.g.has(x)).length;
  band.innerHTML = grupos.length > 1 ? grupos.map(x => `<button type="button" class="plk ${PLG[tab] === x ? 'on' : ''}" data-plg="${esc(x)}"><span class="plkt">${esc(x)}</span><b>${num(cuenta(x))}</b><small>${cuenta(x) === 1 ? '1 ' + esc(o.que.replace(/s$/, '')) : esc(o.que)}</small></button>`).join('') : '';
  band.classList.toggle('hide', grupos.length < 2);
  blqFiltrar(tab);
}
function blqFiltrar(tab) {
  const v = PLG[tab] || '', sec = $('v-' + tab); if (!sec) return;
  sec.querySelectorAll('.dgrid.blq-' + tab + ' > .dr').forEach(r => r.classList.toggle('plgfuera', !!v && !(r.dataset.grupos || '').split('|').includes(v)));
  sec.querySelectorAll('[data-plg]').forEach(b => b.classList.toggle('on', b.dataset.plg === v));
  const s = $('plg-' + tab); if (s && s.value !== v) s.value = v;
  const cnt = sec.querySelector('.plcnt'); if (cnt) { cnt.dataset.h = ''; }
}
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


