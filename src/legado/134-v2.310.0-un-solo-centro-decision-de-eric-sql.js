/* ============================================================
   v2.310.0 · Un solo centro (decisión de Eric; SQL 158). Cada centro es a la vez cuenta de tipo Centro (sale en Cuentas →
   Centros, con su estado, visitas y pedidos) y centro-lugar (su ficha con sus profesionales). Desde la ficha del centro,
   «Ficha comercial» abre su cuenta; desde la cuenta de un centro, «Ver sus profesionales» abre la ficha del centro.
   ============================================================ */
document.addEventListener('click', e => {
  const b = e.target.closest('#fccuenta'); if (!b) return;
  $('dlg').close(); abrirFicha(b.dataset.fccta);
});
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    const { data: c } = await db.from('cuentas').select('tipo, centro_id').eq('id', id).maybeSingle();
    const fb = $('fbody');
    if (c && c.tipo === 'Centro' && c.centro_id && fb && FICHA_ID === id && !$('fcentrop')) {
      const fh = fb.querySelector('.fh');
      (fh || fb.firstElementChild).insertAdjacentHTML('afterend', `<div class="blk" id="fcentrop"><div class="fcentropf"><span>Los ${esc(TT('medico', 'p', '', 'l', 'l'))} que atienden aquí y su horario</span>
        <button type="button" class="btn sec chico" data-fcver="${c.centro_id}">Ver sus ${esc(TT('medico', 'p', '', 'l', 'l'))}</button></div></div>`);
    }
  } catch (e) {}
  return r;
})(abrirFicha);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-fcver]'); if (!b) return;
  const f = $('ficha'); if (f && f.open) f.close();
  fichaCentro(b.dataset.fcver);
});


