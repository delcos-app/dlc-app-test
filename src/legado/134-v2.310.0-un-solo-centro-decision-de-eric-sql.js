/* ============================================================
   v2.310.0 · Un solo centro (decisión de Eric; SQL 158). Cada centro es a la vez cuenta de tipo Centro (sale en Cuentas →
   Centros, con su estado, visitas y pedidos) y centro-lugar (su ficha con sus profesionales). Desde la ficha del centro,
   «Ficha comercial» abre su cuenta; desde la cuenta de un centro, «Ver sus profesionales» abre la ficha del centro.
   ============================================================ */
document.addEventListener('click', e => {
  const b = e.target.closest('#fccuenta'); if (!b) return;
  $('dlg').close(); abrirFicha(b.dataset.fccta);
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-fcver]'); if (!b) return;
  const f = $('ficha'); if (f && f.open) f.close();
  fichaCentro(b.dataset.fcver);
});


