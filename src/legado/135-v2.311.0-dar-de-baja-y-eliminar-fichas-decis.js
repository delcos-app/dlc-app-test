abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    const { data: c } = await db.from('cuentas').select('tipo, nombre, archivado_en').eq('id', id).maybeSingle();
    const fb = $('fbody');
    if (!c || !fb || FICHA_ID !== id || $('fbajablk') || !puedeEditarTipo(c.tipo)) return r;
    const elim = nivelDe2('M') >= 3;
    fb.insertAdjacentHTML('beforeend', `<div class="blk fbajablk" id="fbajablk"><div class="acts">
      ${c.archivado_en ? `<button type="button" class="btn sec chico" data-falta="${id}">Volver a dar de alta</button>` : `<button type="button" class="btn sec chico" data-fbaja="${id}">Dar de baja</button>`}
      ${elim ? `<button type="button" class="btn sec dang chico" data-felim="${id}">Eliminar la ficha</button>` : ''}</div></div>`);
  } catch (e) {}
  return r;
})(abrirFicha);
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-fbaja], [data-falta], [data-felim]'); if (!b) return;
  const f = $('ficha');
  if (b.dataset.falta) { if (await bajaCuenta(b.dataset.falta, false)) { if (f && f.open) f.close(); } return; }
  if (b.dataset.fbaja) {
    if (!await preguntar('Deja de salir en listas, agenda y buscador, pero conserva su historial. Sus citas pendientes se quitan de la agenda. Se puede volver a dar de alta desde Cuentas → «⋯» → «Fichas dadas de baja».', { titulo: '¿Dar de baja esta ficha?', ok: 'Dar de baja' })) return;
    if (await bajaCuenta(b.dataset.fbaja, true) && f && f.open) f.close();
    return;
  }
  const id = b.dataset.felim;
  if (!await preguntar('Se borra para siempre, con su cartera, sus citas y sus ubicaciones. No se puede deshacer.', { titulo: '¿Eliminar la ficha?', ok: 'Eliminar', peligro: true })) return;
  const { data: r, error } = await db.rpc('eliminar_cuenta', { p_id: id });
  if (!error && r && r.ok) { try { invalidarCache(); } catch (x) {} toast('Ficha eliminada'); if (f && f.open) f.close(); if (TAB === 'directorio') buscar(true); return; }
  if (r && r.error === 'historial') {
    const tiene = Object.entries(r.detalle || {}).map(([k, n]) => `${num(n)} ${BAJA_QUE[k] || k}`).join(', ');
    if (await preguntar(`No se puede eliminar porque tiene historial que hay que conservar: ${tiene}. Puedes darla de baja: deja de salir, pero no se pierde nada.`, { titulo: 'Esta ficha tiene historial', ok: 'Dar de baja' })) {
      if (await bajaCuenta(id, true) && f && f.open) f.close();
    }
    return;
  }
  toast('No se ha podido eliminar: ' + ((error && error.message) || (r && r.error) || ''), true);
});
// Cuentas → «⋯» → «Fichas dadas de baja»
document.body.insertAdjacentHTML('beforeend', '<button type="button" id="dirbajas" class="plmasoc" tabindex="-1" aria-hidden="true"></button>');
$('dirbajas').onclick = async () => {
  $('dbody').innerHTML = `<div class="fh"><div><h2>Fichas dadas de baja</h2><div class="sm">No salen en listas, agenda ni buscador. Al darlas de alta vuelven tal como estaban.</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div><div id="bajasl"><div class="skel"></div><div class="skel"></div></div>`;
  $('dlg').showModal();
  const { data } = await db.from('cuentas').select('id, nombre, tipo, archivado_en').not('archivado_en', 'is', null).order('archivado_en', { ascending: false }).limit(300);
  const l = data || [];
  $('bajasl').innerHTML = l.length ? `<div class="lista">${l.map(c => `<div class="item bajaf"><span class="tx"><b>${esc(c.nombre)}</b><span class="sm">${c.tipo === 'Centro' ? 'Centro' : esc(TT('medico', 's', '', 'l', 'C'))} · de baja desde el ${fechaCorta(String(c.archivado_en).slice(0, 10))}</span></span>
      <button type="button" class="btn sec chico" data-falta="${c.id}">Dar de alta</button></div>`).join('')}</div>` : '<div class="vacio">No hay ninguna ficha dada de baja.</div>';
};
document.addEventListener('click', e => { const b = e.target.closest('#bajasl [data-falta]'); if (b) setTimeout(() => { const it = b.closest('.bajaf'); if (it) it.remove(); }, 400); });
PL.directorio.mas = (orig => () => orig().concat([['dirbajas', 'Fichas dadas de baja']]))(PL.directorio.mas);


