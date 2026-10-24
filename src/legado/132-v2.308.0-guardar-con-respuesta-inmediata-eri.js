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
const GUARDA_TXT = /^(\+\s*)?(guardar|crear|añadir|enviar|validar|aplicar|confirmar|emitir|cobrar|registrar|marcar|asignar|unificar|cambiar|borrar|eliminar|quitar|anular|rectificar|liquidar|pedir|actualizar)\b/i;
const esBotonGuardar = b => {
  if (!b || b.matches('.sec, .x, .kmv, .plic, [data-cerrar], [data-cerrar2], .vueltabtn, .guardando')) return false;
  if (!b.closest('dialog[open], #v-config')) return false;
  const t = (b.textContent || '').trim();
  return /ok$|guardar|enviar/i.test(b.id || '') || GUARDA_TXT.test(t);
};
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

// v2.308.0 · El aviso, siempre por encima de todo (aviso de Eric: con una ventana o un panel abierto salía detrás, difuminado).
// Las ventanas modales van en la capa superior del navegador, que ningún z-index supera: el aviso se abre también ahí
// (popover manual) y, como se abre después, queda encima de la ventana y de su velo.
toast = (orig => function (...a) {
  const r = orig.apply(this, a), t = $('toast');
  if (t && typeof t.showPopover === 'function') {
    try { if (!t.hasAttribute('popover')) t.setAttribute('popover', 'manual'); if (t.matches(':popover-open')) t.hidePopover(); t.showPopover(); } catch (e) {}
  }
  return r;
})(toast);
// Si después se abre (o se vuelve a abrir) una ventana con el aviso a la vista, el aviso vuelve a ponerse encima
function subirAviso() { const t = $('toast'); if (!t || t.classList.contains('hide') || typeof t.showPopover !== 'function' || !t.hasAttribute('popover')) return; try { if (t.matches(':popover-open')) t.hidePopover(); t.showPopover(); } catch (e) {} }
new MutationObserver(ms => { if (ms.some(m => m.target.tagName === 'DIALOG' && m.target.open)) requestAnimationFrame(subirAviso); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });

