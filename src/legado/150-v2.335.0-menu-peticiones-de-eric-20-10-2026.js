pintarBnav = (orig => function (...a) {
  if (ES_MEDICO()) return orig.apply(this, a);
  const b = $('bnav'); if (!b) return orig.apply(this, a);
  const barra = movBarra();
  b.dataset.n = String(barra.length + 1);
  b.innerHTML = barra.map(t => `<button data-t="${t}" aria-selected="${TAB === t}"><span>${ICO_MOD[t] || '•'}</span>${esc(movNombre(t))}</button>`).join('')
    + `<button id="bmasbtn" aria-selected="${!barra.includes(TAB)}"><span>⋯</span>Más</button>`;
  b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => ir(x.dataset.t));
  $('bmasbtn').onclick = abrirMasMovil;
})(pintarBnav);
abrirMasMovil = (orig => function (...a) {
  const r = orig.apply(this, a);
  const s = $('bmas'), g = s && s.querySelector('.bmasgrid'); if (!g) return r;
  const barra = movBarra(), ocultos = menuPrefs().ocultos || [];
  const quiero = movMasOrden(movDisponibles().filter(t => !barra.includes(t) && !ocultos.includes(t)));
  const cerrar = () => { s.classList.remove('abierto'); setTimeout(() => s.classList.add('hide'), 180); };
  g.querySelectorAll('[data-bm]').forEach(x => { if (!quiero.includes(x.dataset.bm)) x.remove(); });
  quiero.forEach(t => {
    if (g.querySelector(`[data-bm="${t}"]`)) return;
    g.insertAdjacentHTML('beforeend', `<button data-bm="${t}" class="${tabDelMenu() === t ? 'on' : ''}"><span>${ICO_MOD[t] || '•'}</span>${esc(movNombre(t))}</button>`);
    g.querySelector(`[data-bm="${t}"]`).onclick = () => { cerrar(); ir(t); };
  });
  quiero.forEach(t => { const x = g.querySelector(`[data-bm="${t}"]`); if (x) g.appendChild(x); });   // en el orden elegido
  if (!s.querySelector('#bmaspers')) {
    g.insertAdjacentHTML('afterend', '<div class="acts bmaspers"><button type="button" class="btn sec chico" id="bmaspers">Personalizar menú</button></div>');
    $('bmaspers').onclick = () => { cerrar(); movPersonalizar(); };
  }
  return r;
})(abrirMasMovil);



