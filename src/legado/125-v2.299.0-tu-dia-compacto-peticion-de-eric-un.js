tdAplicarCompacto();
document.addEventListener('click', e => {
  const b = e.target.closest('#tdcompactar'); if (!b) return;
  const on = !tdCompacto();
  try { localStorage.setItem('delcos-tdcompacto', on ? '1' : '0'); } catch (x) {}
  tdAplicarCompacto(); b.title = on ? 'Ver el detalle de las citas' : 'Compactar las citas: una línea cada una'; b.setAttribute('aria-label', on ? 'Ver el detalle de las citas' : 'Compactar las citas'); b.innerHTML = plIco(on ? 'file-text' : 'list'); b.setAttribute('aria-pressed', on);
});

