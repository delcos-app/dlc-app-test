// Distribuidores: los transfers de cada uno
pintarDistribuidores = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || CFG_KEY !== 'distribuidores') return r;
  c.querySelectorAll('.disfila[data-disid] .ajctl').forEach(x => {
    if (x.querySelector('[data-distrf]')) return;
    x.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec" data-distrf="${x.closest('.disfila').dataset.disid}">Transfers</button>`);
  });
  c.querySelectorAll('[data-distrf]').forEach(b => b.onclick = () => verTransfers(b.dataset.distrf));
  return r;
})(pintarDistribuidores);




