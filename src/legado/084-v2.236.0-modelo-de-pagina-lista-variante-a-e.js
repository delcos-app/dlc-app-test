



// v2.242.0: aquí iba la primera versión de plToolHtml (se redefine entera más abajo)

// Monta (o vuelve a ajustar) la plantilla sobre lo que haya pintado la pantalla. Se puede llamar las veces que haga falta.
// v2.242.0: aquí iba la primera versión de plSync (se redefine entera más abajo)

Object.keys(PL).forEach(plObservar);


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


