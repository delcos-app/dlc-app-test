function pintarBnavBase4(...a) {
  if (ES_MEDICO()) return pintarBnavBase3.apply(this, a);
  const b = $('bnav'); if (!b) return pintarBnavBase3.apply(this, a);
  const barra = movBarra();
  b.dataset.n = String(barra.length + 1);
  b.innerHTML = barra.map(t => `<button data-t="${t}" aria-selected="${TAB === t}"><span>${ICO_MOD[t] || '•'}</span>${esc(movNombre(t))}</button>`).join('')
    + `<button id="bmasbtn" aria-selected="${!barra.includes(TAB)}"><span>⋯</span>Más</button>`;
  b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => ir(x.dataset.t));
  $('bmasbtn').onclick = abrirMasMovil;
}



