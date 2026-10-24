/* ============================================================
   v2.45.4 · Botones con indicador de carga y emails comprobados al escribir
   ============================================================ */

// Botón en espera: se desactiva, muestra un indicador y recupera su texto al terminar
async function conCargaBase(btn, texto, fn) {
  if (!btn || btn.dataset.cargando) return;
  const antes = btn.innerHTML; btn.dataset.cargando = '1'; btn.disabled = true; btn.classList.add('btncarga');
  btn.innerHTML = `<span class="giro"></span>${esc(texto)}`;
  try { return await fn(); } finally { btn.innerHTML = antes; btn.disabled = false; btn.classList.remove('btncarga'); delete btn.dataset.cargando; }
}


