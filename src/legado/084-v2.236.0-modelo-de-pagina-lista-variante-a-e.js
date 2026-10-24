
// Directorio: cada fila lleva su tarjeta (oculta en el ordenador) con el nombre, centro · municipio y el estado
filaTabla = (orig => function (m) {
  const h = orig(m), i = h.lastIndexOf('</button>'); if (i < 0) return h;
  const l2 = [m.centro_nombre, m.municipio].filter(Boolean).join(' · ');
  return h.slice(0, i) + `<span class="plcard"><b>${m.urgente ? '<i class="plurg" aria-label="Urgente"></i>' : ''}${esc(m.nombre || '')}</b><span class="plc2">${esc(l2)}</span><span class="plc3">${celda(m, 'estado_comercial')}</span></span>` + h.slice(i);
})(filaTabla);


function plKpisHtml(tab) {
  const c = PL[tab], k = PL_KPI[tab];
  if (!k || !k.datos) return Array(c.nKpis || 4).fill('').map(() => `<div class="plk plcarga"><span class="plkt"><i class="plsk" style="width:46%"></i></span><b><i class="plsk plskv"></i></b><small><i class="plsk" style="width:70%"></i></small></div>`).join('');
  return k.datos.map(d => `<button type="button" class="plk ${c.kpiOn(d.k) ? 'on' : ''}" data-plk="${d.k}"><span class="plkt">${esc(d.t)}</span><b data-pln="${d.n}">${num(d.n)}</b><small>${esc(d.s)}</small></button>`).join('');
}
function plCargarKpis(tab) {
  const c = PL[tab], k = PL_KPI[tab], ep = typeof RC_EPOCA !== 'undefined' ? RC_EPOCA : 0;
  if (k && (k.pend || (k.datos && k.epoca === ep && Date.now() - k.t < 60000))) return;
  PL_KPI[tab] = Object.assign(k || {}, { pend: true });
  c.kpis().then(datos => {
    const nuevo = !PL_KPI[tab].datos;
    Object.assign(PL_KPI[tab], { datos, t: Date.now(), epoca: ep, pend: false });
    const box = document.querySelector(`#v-${tab} .plkpis`); if (!box) return;
    box.innerHTML = plKpisHtml(tab);
    if (nuevo && !matchMedia('(prefers-reduced-motion: reduce)').matches) box.querySelectorAll('b[data-pln]').forEach(b => {
      const n = +b.dataset.pln, t0 = performance.now(); if (!n) return;
      const paso = () => { const p = Math.min(1, (performance.now() - t0) / 700); b.textContent = num(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(paso); };
      paso();
    });
  }, () => { PL_KPI[tab].pend = false; });
}

// v2.242.0: aquí iba la primera versión de plToolHtml (se redefine entera más abajo)

// Monta (o vuelve a ajustar) la plantilla sobre lo que haya pintado la pantalla. Se puede llamar las veces que haga falta.
// v2.242.0: aquí iba la primera versión de plSync (se redefine entera más abajo)

Object.keys(PL).forEach(plObservar);

// Al llegar, sin cargador que tape la pantalla: se ve la plantilla con su esqueleto
revelar = (orig => function (el, max, desde) {
  const tab = el && el.id && el.id.slice(2);
  if (el && PL[tab] && el.matches('main > section')) { el.classList.remove('preparando'); plSync(tab); llegar(el); return; }
  return orig(el, max, desde);
})(revelar);

const normalizar = typeof quitarAcentos === 'function' ? (s => quitarAcentos(String(s || '').toLowerCase())) : (s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
document.addEventListener('click', e => {
  if (!e.target.closest('.plpop') && !e.target.closest('.plchip, .plmas')) plCerrarPop();
  const sec = e.target.closest('main > section.plantilla'); if (!sec) return;
  const tab = sec.id.slice(2), c = PL[tab]; if (!c) return;
  const k = e.target.closest('[data-plk]'); if (k) { c.kpiPulsar(k.dataset.plk); plSync(tab); return; }
  const r = e.target.closest('[data-plr]');
  if (r) {
    if (document.querySelector('.plpop') && r.classList.contains('abierto')) { plCerrarPop(); r.classList.remove('abierto'); return; }
    sec.querySelectorAll('.plchip.abierto').forEach(x => x.classList.remove('abierto'));
    const s = $(r.dataset.plr); if (!s) return;
    r.classList.add('abierto');
    plPop(r, [...s.options].map((o, i) => ({ t: i === 0 ? (o.text || 'Todos') : o.text, on: s.selectedIndex === i, fn: () => { r.classList.remove('abierto'); s.selectedIndex = i; s.dispatchEvent(new Event('change', { bubbles: true })); } })));
    return;
  }
  if (e.target.closest('.plmas')) {
    const items = c.mas().filter(([id]) => $(id) && !$(id).classList.contains('hide')).map(([id, t]) => ({ t, fn: () => $(id).click() }));
    if (items.length) plPop(e.target.closest('.plmas'), items); return;
  }
  if (e.target.closest('.plfil')) { c.filtros(); return; }
  if (e.target.closest('.plquitar') && c.quitar) { c.quitar(); plSync(tab); return; }
  if (e.target.closest('.plcol')) { c.columnas(); return; }
  if (e.target.closest('.plmapa')) { const m = c.mapa(); if (m) m.click(); setTimeout(() => plSync(tab), 50); return; }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.plpop')) plCerrarPop(); });
addEventListener('scroll', () => { if (document.querySelector('.plpop')) plCerrarPop(); }, { passive: true });
document.addEventListener('input', e => {
  const i = e.target.closest('main > section.plantilla .plqi'); if (!i) return;
  const tab = i.closest('section').id.slice(2);
  clearTimeout(PL_TQ); PL_TQ = setTimeout(() => PL[tab].buscarQ(i.value.trim()), 300);
});
// Si el modo mapa cambia el botón, la barra lo refleja
barraCuentas = (orig => function () { orig(); const b = document.querySelector('#v-directorio .plmapa'), m = $('mapaBtn'); if (b && m && b.dataset.modo !== (m.dataset.modo || '')) { b.dataset.modo = m.dataset.modo || ''; b.innerHTML = m.innerHTML; b.title = m.title; b.setAttribute('aria-label', m.title); } })(barraCuentas);


