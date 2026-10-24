/* ============================================================
   v2.45.4 · Botones con indicador de carga y emails comprobados al escribir
   ============================================================ */

// Botón en espera: se desactiva, muestra un indicador y recupera su texto al terminar
async function conCarga(btn, texto, fn) {
  if (!btn || btn.dataset.cargando) return;
  const antes = btn.innerHTML; btn.dataset.cargando = '1'; btn.disabled = true; btn.classList.add('btncarga');
  btn.innerHTML = `<span class="giro"></span>${esc(texto)}`;
  try { return await fn(); } finally { btn.innerHTML = antes; btn.disabled = false; btn.classList.remove('btncarga'); delete btn.dataset.cargando; }
}
// Email comprobado mientras se escribe: ✓ verde si es válido, ✗ rojo si no
function validarEmailEnVivo(inp) {
  if (!inp || inp.dataset.vemail) return; inp.dataset.vemail = '1';
  const w = document.createElement('span'); w.className = 'emailw'; inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
  w.insertAdjacentHTML('beforeend', '<span class="emailico" aria-hidden="true"></span>');
  const act = () => {
    const v = inp.value.trim(), ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
    w.classList.toggle('ok', !!v && ok); w.classList.toggle('mal', !!v && !ok);
    w.querySelector('.emailico').textContent = !v ? '' : ok ? '✓' : '✗';
    const err = w.nextElementSibling && w.nextElementSibling.classList.contains('campoerr') ? w.nextElementSibling : null;
    if (err && ok) { err.remove(); inp.classList.remove('conerr'); }
  };
  inp.addEventListener('input', act); act();
}


