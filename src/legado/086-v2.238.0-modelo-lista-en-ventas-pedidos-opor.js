Object.assign(PL, {
  ventas: {
    pedidos: plRejilla({ tab: 'ventas', que: () => 'pedidos', lista: 'pedlista', pag: 'pedpag', buscador: 'pq', banda: 'operativa', extra: [['opcfg', 'Elegir qué avisos ver']],
      rapidos: [['#pper select', 'Periodo'], ['#pestado', ''], ['#pcanal', ''], ['#porigf', ''], ['#prepf', '']] }),
    oport: plRejilla({ tab: 'ventas', que: () => 'oportunidades', lista: 'lllista', pag: 'llpag', buscador: 'llq', despues: 'llres2',
      rapidos: [['#llper select', 'Periodo'], ['#llfres', '']] }),
    compras: plRejilla({ tab: 'ventas', que: () => 'pedidos de compra' }),
    prov: plRejilla({ tab: 'ventas', que: () => 'proveedores' })
  },
  facturacion: { facturas: plRejilla({ tab: 'facturacion', que: () => 'facturas', lista: 'flista', pag: 'fpag', buscador: 'fq', rapidos: [['#fper select', 'Periodo'], ['#fcob', '']] }) },
  productos: {
    prods: plRejilla({ tab: 'productos', que: () => 'productos' }),
    servs: plRejilla({ tab: 'productos', que: () => 'servicios' }),
    stock: plRejilla({ tab: 'productos', que: () => 'productos' })
  }
});

// Recuento: el de la pantalla; si no tiene, el paginador («1–20 de N») o las filas que se ven
function plRecuento(sec, c) {
  const cu = c.cuenta && c.cuenta(); if (cu && /\d/.test(cu.textContent)) return cu.innerHTML.replace(/<span class="sm">[\s\S]*?<\/span>/, '').trim();
  const pag = sec.querySelector('.pltab .pag > span, .pag > span'); const m = pag && pag.textContent.match(/de\s+([\d.]+)/);
  const g = sec.querySelector('.dgrid'); if (!m && !g) return sec.querySelector('.pltab .vacio, .panel .vacio') ? `<b>0</b> ${esc(c.que())}` : '';
  const n = m ? m[1] : num(g.querySelectorAll(':scope > .dr:not(.hide):not(.htfuera)').length);
  return `<b>${n}</b> ${esc(c.que())}`;
}

plSync = function (tab) {
  const sec = $('v-' + tab), c = plCfg(tab); if (!sec) return;
  if (!c) {   // sección sin plantilla: fuera lo que se hubiera puesto
    if (sec.classList.contains('plantilla')) { sec.classList.remove('plantilla'); sec.querySelectorAll(':scope > .plkpis, :scope > .pltool, .plmas').forEach(x => x.remove()); }
    return;
  }
  const clave = PL_SECC[tab] ? PL_SECC[tab]() : tab;
  sec.classList.add('plantilla'); sec.dataset.plsec = clave;
  const sal = sec.querySelector(':scope > .saludo');
  const acts = sal && sal.querySelector('.acts');
  if (acts && !acts.querySelector('.plmas')) acts.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec chico plmas" aria-label="Más acciones" title="Más acciones">${plIco('ellipsis', '⋯')}</button>`);
  const mas = acts && acts.querySelector('.plmas'); if (mas) { const no = !c.mas().length; if (mas.classList.contains('plno') !== no) mas.classList.toggle('plno', no); }
  const nb = c.nuevo && c.nuevo();
  if (nb && c.textoNuevo && !ES_MOVIL() && !nb.classList.contains('fab') && nb.textContent.trim() !== c.textoNuevo()) nb.innerHTML = plIco('plus') + ' ' + esc(c.textoNuevo());
  if (nb && c.textoNuevo && ES_MOVIL() && !nb.dataset.plfab) { nb.dataset.plfab = '1'; nb.classList.add('fab'); nb.dataset.txt = c.textoNuevo(); nb.setAttribute('aria-label', c.textoNuevo()); nb.innerHTML = plIco('plus'); sec.appendChild(nb); }
  // Móvil: un solo «+», el de la sección abierta (al cambiar de sección quedaba el de la anterior)
  if (c.rejilla && ES_MOVIL()) {
    const prim = [...sec.querySelectorAll(':scope > .saludo .acts > .btn:not(.sec):not(.htbtn), :scope > .fab')].find(b => /^\s*\+/.test(b.dataset.txt ? '+' : b.textContent) && (b.classList.contains('fab') ? b.dataset.plsec === clave || !b.dataset.plsec : true));
    if (prim && !prim.classList.contains('fab')) { prim.dataset.txt = prim.textContent.replace('+', '').trim(); prim.classList.add('fab'); prim.setAttribute('aria-label', prim.dataset.txt); prim.innerHTML = plIco('plus'); sec.appendChild(prim); }
    if (prim) { prim.dataset.plsec = clave; sec.querySelectorAll(':scope > .fab').forEach(f => { const fuera = f !== prim; if (f.classList.contains('plfuera') !== fuera) f.classList.toggle('plfuera', fuera); }); }
  }
  // Debajo de la cabecera (y de las pestañas, si las hay): la banda de indicadores y la barra
  const ancla = sec.querySelector(':scope > .subnav') || sal;
  let kp = sec.querySelector(':scope > .plkpis');
  if (c.kpis || c.banda) {
    if (!kp) { kp = document.createElement('div'); kp.className = 'plkpis' + (c.banda ? ' plbanda' : ''); if (c.kpis) kp.innerHTML = plKpisHtml(tab); }
    if (!kp.isConnected) { if (ancla) ancla.after(kp); else sec.prepend(kp); }
    if (c.kpis) { plCargarKpis(tab); kp.querySelectorAll('[data-plk]').forEach(b => { const on = c.kpiOn(b.dataset.plk); if (b.classList.contains('on') !== on) b.classList.toggle('on', on); }); }
    if (c.banda) { const b = $(c.banda); if (b && b.parentElement !== kp) kp.appendChild(b); }
  } else if (kp) kp.remove();
  let tl = sec.querySelector(':scope > .pltool');
  if (tl && tl.dataset.plsec !== clave) { tl.remove(); tl = null; }
  if (!tl) { tl = document.createElement('div'); tl.className = 'pltool'; tl.dataset.plsec = clave; tl.innerHTML = plToolHtml(tab); }
  if (!tl.isConnected) { const ref = sec.querySelector(':scope > .plkpis') || ancla; if (ref) ref.after(tl); else sec.prepend(tl); }
  const qi = tl.querySelector('.plqi'); if (qi && document.activeElement !== qi && qi.value !== c.q()) qi.value = c.q();
  tl.querySelectorAll('[data-plr]').forEach(b => {
    const s = plSel(b.dataset.plr), w = s && s.closest('#fcomwrap');
    const ver = !!s && !(w && w.classList.contains('hide')) && s.options.length > 1;
    if (b.classList.contains('hide') === ver) b.classList.toggle('hide', !ver); if (!ver) return;
    if (!b.dataset.plt) b.dataset.plt = plEtiq(b.dataset.plr);
    const on = s.selectedIndex > 0 && !(b.dataset.plt === 'Periodo');
    const txt = s.selectedIndex > 0 || b.dataset.plt === 'Periodo' ? `${b.dataset.plt}: ${s.options[s.selectedIndex].text.replace(/\s*\(\d[\d.]*\)\s*$/, '')}` : b.dataset.plt;
    if (b.textContent !== txt) b.textContent = txt; if (b.classList.contains('on') !== on) b.classList.toggle('on', on);
  });
  const n = c.activos(), pn = tl.querySelector('.pln');
  if (pn) { const v = String(n || ''); if (pn.textContent !== v) pn.textContent = v; if (pn.classList.contains('hide') !== !n) pn.classList.toggle('hide', !n); }
  const pq = tl.querySelector('.plquitar'); if (pq && pq.classList.contains('hide') !== !n) pq.classList.toggle('hide', !n);
  const cnt = tl.querySelector('.plcnt'), h = plRecuento(sec, c);
  if (cnt && h && cnt.dataset.h !== h) { cnt.dataset.h = h; cnt.innerHTML = h; }
  // Tabla y pie en una tarjeta; los totales, en la franja de resumen encima
  const tb = c.tabla(), pie = c.pie();
  if (tb && tb.parentElement && !tb.parentElement.classList.contains('pltab')) { const w = document.createElement('div'); w.className = 'pltab'; tb.before(w); w.appendChild(tb); if (pie) w.appendChild(pie); }
  else if (tb && pie && pie.parentElement !== tb.parentElement) tb.parentElement.appendChild(pie);
  const tab2 = tb && tb.closest('.pltab');
  if (c.rejilla && tab2) {
    sec.querySelectorAll('.kpis.vtot:not(.plres)').forEach(k => { if (k.closest('#v-' + tab) && !k.closest('.plkpis')) k.classList.add('plres'); });
    if (c.despues) { const d = $(c.despues); if (d && tab2.nextElementSibling !== d) tab2.after(d); }
  }
  const cuerpo = c.cuerpo();
  if (cuerpo) {
    if (cuerpo.querySelector(':scope > .cargador')) {
      if (cuerpo.__plUlt) { cuerpo.innerHTML = cuerpo.__plUlt; cuerpo.classList.add('platenua'); }
      else if (tab === 'directorio') { cuerpo.innerHTML = plEsqueleto(tab, false); if (!$('thead').children.length) $('thead').innerHTML = plEsqueleto(tab, true).match(/<div class="plskh">[\s\S]*?<\/div>/)[0]; }
      else cuerpo.innerHTML = plEsqueleto(tab, true);
    } else if (c.conDatos(cuerpo)) { cuerpo.classList.remove('platenua'); cuerpo.__plUlt = cuerpo.innerHTML; }
  }
  const vc = tab === 'pacientes' && $('vcuerpo');
  if (vc && !vc.children.length) vc.innerHTML = `<div class="panel plskpanel"><div class="pltab">${plEsqueleto(tab, true)}</div></div>`;
  // Primera llegada de una pantalla en rejilla: mientras no hay tabla, su esqueleto debajo de la barra
  if (c.rejilla && !sec.querySelector('.dgrid, .pltab, .vacio') && !sec.querySelector(':scope > .plskpanel')) tl.insertAdjacentHTML('afterend', `<div class="panel plskpanel"><div class="pltab">${plEsqueleto(tab, true)}</div></div>`);
  if (sec.querySelector('.dgrid, .vacio')) sec.querySelectorAll(':scope > .plskpanel').forEach(x => x.remove());
  if (c.card) sec.querySelectorAll('.dgrid > .dr:not([data-plc])').forEach(dr => {
    dr.dataset.plc = '1'; const x = c.card(dr);
    dr.insertAdjacentHTML('beforeend', `<span class="plcard"><b>${esc(x.a)}</b><span class="plc2">${esc(x.b)}</span><span class="plc3">${x.c}</span>${x.d ? `<span class="plc4">${esc(x.d)}</span>` : ''}</span>`);   // v2.316.0: tercera línea
  });
};
// La barra y los clics usan la configuración de la sección abierta
plToolHtml = function (tab) {
  const c = plCfg(tab);
  return `<label class="plq">${plIco('search', '🔍')}<input type="search" class="plqi" placeholder="${esc(c.buscaTxt ? c.buscaTxt() : 'Buscar en ' + c.que())}" aria-label="${esc(c.buscaTxt ? c.buscaTxt() : 'Buscar en ' + c.que())}"></label>
    <div class="plrap">${c.rapidos.map(([id, t]) => { t = t || plEtiq(id); return `<button type="button" class="plchip" data-plr="${esc(id)}" data-plt="${esc(t)}">${esc(t)}</button>`; }).join('')}</div>
    <button type="button" class="plbtn chico plfil">${plIco('sliders-horizontal')}<span>Filtros</span><span class="pln hide"></span></button>
    ${c.quitar ? `<button type="button" class="btn sec chico dang plquitar hide">${svgIco(ICON_NOM.x)} Eliminar filtros</button>` : ''}
    <button type="button" class="plbtn chico plcol">${plIco('columns-3', 'table', 'list')}<span>Columnas</span></button>
    ${c.mapa() ? `<button type="button" class="plbtn chico plic plmapa" title="Ver en el mapa" aria-label="Ver en el mapa">${plIco('map')}</button>` : ''}
    <span class="plcnt"><i class="plsk" style="width:90px"></i></span>`;
};
plKpisHtml = (orig => function (tab) { return plCfg(tab) && plCfg(tab).kpis ? orig(tab) : ''; })(plKpisHtml);
plCargarKpis = (orig => function (tab) { const c = plCfg(tab); if (c && c.kpis) return orig(tab); })(plCargarKpis);
['ventas', 'facturacion', 'productos'].forEach(plObservar);
// Revelado de las pantallas con secciones: la primera llegada, de una vez (como siempre), con la plantilla ya puesta
revelar = (orig => function (el, max, desde) {
  const tab = el && el.id && el.id.slice(2);
  if (PL_SECC[tab] && el.matches && el.matches('main > section')) {
    // Primera llegada de una pantalla en rejilla: de una vez, con el cargador (el esqueleto queda para cuando se vuelve a buscar)
    const t0 = Date.now(); el.classList.add('preparando');
    // La sección puede decidirse un momento después (al pintarse): se vuelve a mirar
    setTimeout(() => { if (plCfg(tab)) plSync(tab);
      // La v2.236 trataba como plantilla toda pantalla de PL: mientras se llama al revelado de siempre, esta no está en PL
      const keep = PL[tab]; delete PL[tab]; try { orig(el, max, desde || t0); } finally { PL[tab] = keep; } }, 0);
    return;
  }
  return orig(el, max, desde);
})(revelar);
// Clics de la barra: con la configuración de la sección abierta (la v2.236 leía PL[tab] directamente)
document.addEventListener('click', e => {
  const sec = e.target.closest('main > section.plantilla'); if (!sec || !PL_SECC[sec.id.slice(2)]) return;
  const tab = sec.id.slice(2), c = plCfg(tab); if (!c) return;
  const r = e.target.closest('[data-plr]');
  if (r) {
    e.stopImmediatePropagation();
    if (document.querySelector('.plpop') && r.classList.contains('abierto')) { plCerrarPop(); r.classList.remove('abierto'); return; }
    sec.querySelectorAll('.plchip.abierto').forEach(x => x.classList.remove('abierto'));
    const s = plSel(r.dataset.plr); if (!s) return;
    r.classList.add('abierto');
    plPop(r, [...s.options].map((o, i) => ({ t: o.text, on: s.selectedIndex === i, fn: () => {
      r.classList.remove('abierto'); s.selectedIndex = i; s.dispatchEvent(new Event('change', { bubbles: true }));
      // Periodo personalizado: las fechas están en el panel de filtros
      if (/pers/i.test(o.value) || /personaliz/i.test(o.text)) setTimeout(() => c.filtros(), 60);
    } })));
    return;
  }
  if (e.target.closest('.plmas')) {
    e.stopImmediatePropagation();
    const items = c.mas().filter(([id]) => $(id) && !$(id).classList.contains('hide')).map(([id, t]) => ({ t, fn: () => $(id).click() }));
    if (items.length) plPop(e.target.closest('.plmas'), items); return;
  }
  if (e.target.closest('.plfil')) { e.stopImmediatePropagation(); c.filtros(); return; }
  if (e.target.closest('.plcol')) { e.stopImmediatePropagation(); c.columnas(); return; }
}, true);
document.addEventListener('input', e => {
  const i = e.target.closest('main > section.plantilla .plqi'); if (!i) return;
  const tab = i.closest('section').id.slice(2); if (!PL_SECC[tab]) return;
  e.stopImmediatePropagation();
  clearTimeout(PL_TQ); PL_TQ = setTimeout(() => { const c = plCfg(tab); if (c) c.buscarQ(i.value.trim()); }, 300);
}, true);


