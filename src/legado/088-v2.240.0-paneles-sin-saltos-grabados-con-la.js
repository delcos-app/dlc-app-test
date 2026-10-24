/* ============================================================
   v2.240.0 · Paneles sin saltos. Grabados con la red lenta, Inicio, Analítica, Agenda, Rutas y Calidad del dato ya llegan
   de una vez; quedaban tres detalles:
   - Las cifras que cuentan (mosaico de Inicio, indicadores de Inicio, Pedidos y Analítica) volvían a contar desde cero cada vez
     que se volvía a la pantalla, y parecía que saltaban: ahora solo cuentan si la cifra ha cambiado desde la última vez.
   - En el móvil, las cifras grandes de Analítica se partían en dos líneas.
   - Oportunidades enseñaba los filtros de Pedidos («Mes actual» dos veces): los de la otra sección se apartan del panel.
   ============================================================ */
const CONTADO = {};   // última cifra que se ha enseñado contando, por pantalla y grupo
const plYaContado = (clave, valores) => { const k = TAB + ':' + clave, f = valores.join('|'); if (CONTADO[k] === f) return true; CONTADO[k] = f; return false; };
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

// Pedidos y Oportunidades comparten el panel de filtros: los de la otra sección se apartan (no salen en el panel ni como filtro activo)
const PL_AJENOS = { pedidos: ['llper', 'llfres'], oport: ['pper', 'pcanal', 'pestado', 'popf', 'porigf', 'prepf'], compras: ['llper', 'llfres', 'pper', 'pcanal', 'pestado', 'popf', 'porigf', 'prepf'], prov: ['llper', 'llfres', 'pper', 'pcanal', 'pestado', 'popf', 'porigf', 'prepf'] };
function plAjenos(sec, clave) {
  const pan = sec.querySelector(':scope > .htpanel'), prop = pan && pan.querySelector('.htpropios'); if (!prop) return;
  let fuera = pan.querySelector(':scope > .plajenos');
  if (!fuera) { fuera = document.createElement('div'); fuera.className = 'plajenos hide'; pan.appendChild(fuera); }
  const ajenos = new Set(PL_AJENOS[clave] || []);
  [...prop.children, ...fuera.children].forEach(d => {
    const s = d.querySelector('select'), id = d.id || (s && s.id) || '', ajeno = ajenos.has(id);
    if (ajeno && d.parentElement !== fuera) fuera.appendChild(d);
    else if (!ajeno && d.parentElement === fuera) prop.appendChild(d);
  });
}
plSync = (orig => function (tab) {
  if (tab === 'ventas') { const sec = $('v-ventas'), k = PL_SECC.ventas(); if (sec && k) plAjenos(sec, k); }
  return orig(tab);
})(plSync);


