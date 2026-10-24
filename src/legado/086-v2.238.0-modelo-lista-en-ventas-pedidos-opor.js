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


['ventas', 'facturacion', 'productos'].forEach(plObservar);
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


