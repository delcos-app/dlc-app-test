/* ============================================================
   v2.308.0 · Guardar con respuesta inmediata (Eric eligió la B: «botón y aviso a la vez»). Al pulsar un botón que guarda
   (dentro de una ventana o de una página de Configuración), el botón enseña al momento «Guardando…» con una ruedecita y
   no admite un segundo clic; vuelve a su estado cuando la app deja de hablar con la base (si la ventana sigue abierta,
   p. ej. por un error). El aviso de «guardado» aparece abajo, en el mismo instante en que se cierra la ventana, sin
   animación de bajada. Vale para todos los botones de guardar, sin tocarlos uno a uno.
   ============================================================ */
let RED_VUELO = 0, RED_ULT = 0;
window.fetch = (orig => function (...a) {
  const u = String((a[0] && a[0].url) || a[0] || '');
  const nuestra = /\/rest\/v1\/|\/functions\/v1\//.test(u);
  if (!nuestra) return orig.apply(this, a);
  RED_VUELO++; RED_ULT = performance.now();
  return orig.apply(this, a).finally(() => { RED_VUELO = Math.max(0, RED_VUELO - 1); RED_ULT = performance.now(); });
})(window.fetch);
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('button.btn');
  if (!esBotonGuardar(b)) { if (b && b.classList.contains('guardando')) { e.stopImmediatePropagation(); e.preventDefault(); } return; }
  const antes = b.innerHTML, t0 = performance.now(), ancho = b.offsetWidth;
  b.classList.add('guardando'); b.setAttribute('aria-busy', 'true'); b.style.minWidth = ancho + 'px';
  const marca = '<span class="bsp" aria-hidden="true"></span>Guardando…';
  b.innerHTML = marca;
  const fin = () => {
    b.classList.remove('guardando'); b.removeAttribute('aria-busy'); b.style.minWidth = '';
    if (b.innerHTML === marca) b.innerHTML = antes;   // si el propio botón ha cambiado su texto, se respeta
  };
  const mirar = () => {
    if (!b.isConnected || !b.closest('dialog[open], #v-config')) { fin(); return; }
    const t = performance.now();
    if ((RED_VUELO === 0 && t - t0 > 350 && t - RED_ULT > 120) || t - t0 > 30000) { fin(); return; }
    setTimeout(mirar, 80);
  };
  setTimeout(mirar, 80);
}, true);

new MutationObserver(ms => { if (ms.some(m => m.target.tagName === 'DIALOG' && m.target.open)) requestAnimationFrame(subirAviso); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });

