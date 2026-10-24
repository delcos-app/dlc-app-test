/* ============================================================
   v2.299.0 · Tu día compacto (petición de Eric): un botón deja cada cita en una línea con el nombre, la hora y el estado.
   Se recuerda en este dispositivo. Pulsar la cita sigue abriendo su detalle (desde ahí se registra la visita).
   ============================================================ */
function tdCompacto() { try { return localStorage.getItem('delcos-tdcompacto') === '1'; } catch (e) { return false; } }
function tdAplicarCompacto() { document.body.classList.toggle('tdcompacto', tdCompacto()); }
tdAplicarCompacto();
document.addEventListener('click', e => {
  const b = e.target.closest('#tdcompactar'); if (!b) return;
  const on = !tdCompacto();
  try { localStorage.setItem('delcos-tdcompacto', on ? '1' : '0'); } catch (x) {}
  tdAplicarCompacto(); b.title = on ? 'Ver el detalle de las citas' : 'Compactar las citas: una línea cada una'; b.setAttribute('aria-label', on ? 'Ver el detalle de las citas' : 'Compactar las citas'); b.innerHTML = plIco(on ? 'file-text' : 'list'); b.setAttribute('aria-pressed', on);
});

