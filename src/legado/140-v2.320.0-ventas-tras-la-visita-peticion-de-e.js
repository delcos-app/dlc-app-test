let TV_DATOS = null, TV_I = 0;
try { TV_I = Math.max(0, TV_VISTAS.findIndex(v => v[0] === localStorage.getItem('delcos-tvvista'))); } catch (e) {}
document.addEventListener('click', e => {
  const b = e.target.closest('#tvvis [data-tvn]'); if (!b) return;
  TV_I = (TV_I + (+b.dataset.tvn) + TV_VISTAS.length) % TV_VISTAS.length;
  try { localStorage.setItem('delcos-tvvista', TV_VISTAS[TV_I][0]); } catch (x) {}
  tvPintar();
});


