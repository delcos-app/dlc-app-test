/* ============================================================
   v2.338.0 · Ventanas completas en el móvil (D-024; petición de Eric, 20/10/2026): #dlg, #dlg2 y #ficha ocupan toda la pantalla menos el
   menú de abajo, sin esquinas y con su alto final desde que se abren (antes el pedido crecía en blanco mientras cargaba). --bnavh es el
   alto del menú de abajo, medido.
   ============================================================ */
function medirBnav() {
  const b = $('bnav'), h = b && getComputedStyle(b).display !== 'none' ? Math.round(b.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty('--bnavh', h + 'px');
}
addEventListener('resize', medirBnav); setTimeout(medirBnav, 0);
pintarBnav = (orig => function (...a) { const r = orig.apply(this, a); medirBnav(); return r; })(pintarBnav);


