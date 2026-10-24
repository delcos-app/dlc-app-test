document.addEventListener('click', async e => {
  const b = e.target.closest('[data-cbaja], [data-calta], [data-celim]'); if (!b) return;
  const f = $('ficha');
  if (b.dataset.calta) { if (await bajaCliente(b.dataset.calta, false) && f && f.open && b.closest('#ficha')) f.close(); return; }
  if (b.dataset.cbaja) {
    if (!await preguntar(`Deja de salir en la lista y al buscar ${TT('paciente', 's', 'un', 'l', 'l')}, pero conserva sus pedidos y facturas. Se puede volver a dar de alta desde «⋯» → «${TT('paciente', 'p', '', 'l', 'C')} dados de baja».`, { titulo: '¿Dar de baja?', ok: 'Dar de baja' })) return;
    if (await bajaCliente(b.dataset.cbaja, true) && f && f.open) f.close();
    return;
  }
  const id = b.dataset.celim;
  if (!await preguntar('Se borra para siempre. No se puede deshacer.', { titulo: `¿Eliminar ${TT('paciente', 's', 'el', 'l', 'l')}?`, ok: 'Eliminar', peligro: true })) return;
  const { data: r, error } = await db.rpc('eliminar_cliente', { p_id: id });
  if (!error && r && r.ok) { try { invalidarCache(); DB_PRE.clear(); } catch (x) {} toast('Eliminado'); if (f && f.open) f.close(); if (TAB === 'pacientes') listaPacientes(); return; }
  if (r && r.error === 'historial') {
    const d = r.detalle || {}, tiene = [d.pedidos ? `${num(d.pedidos)} pedidos` : '', d.facturas ? `${num(d.facturas)} facturas` : ''].filter(Boolean).join(' y ');
    if (await preguntar(`No se puede eliminar porque tiene ${tiene}, que hay que conservar. Puedes darlo de baja: deja de salir, pero no se pierde nada.`, { titulo: 'Tiene historial', ok: 'Dar de baja' })) {
      if (await bajaCliente(id, true) && f && f.open) f.close();
    }
    return;
  }
  toast('No se ha podido eliminar: ' + ((error && error.message) || (r && r.error) || ''), true);
});
document.body.insertAdjacentHTML('beforeend', '<button type="button" id="clibajas" class="plmasoc" tabindex="-1" aria-hidden="true"></button>');
$('clibajas').onclick = async () => {
  $('dbody').innerHTML = `<div class="fh"><div><h2>${esc(TT('paciente', 'p', '', 'l', 'C'))} dados de baja</h2><div class="sm">No salen en la lista ni al buscar. Conservan sus pedidos y facturas.</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div><div id="clibajasl"><div class="skel"></div><div class="skel"></div></div>`;
  $('dlg').showModal();
  const { data } = await db.from('contactos').select('id, nombre, archivado_en').not('archivado_en', 'is', null).order('archivado_en', { ascending: false }).limit(300);
  const l = data || [];
  $('clibajasl').innerHTML = l.length ? `<div class="lista">${l.map(c => `<div class="item bajaf"><span class="tx"><b>${esc(c.nombre)}</b><span class="sm">De baja desde el ${fechaCorta(String(c.archivado_en).slice(0, 10))}</span></span>
      <button type="button" class="btn sec chico" data-calta="${c.id}">Dar de alta</button></div>`).join('')}</div>` : `<div class="vacio">No hay ${esc(TT('paciente', 'p', '', 'l', 'l'))} dados de baja.</div>`;
};
document.addEventListener('click', e => { const b = e.target.closest('#clibajasl [data-calta]'); if (b) setTimeout(() => { const it = b.closest('.bajaf'); if (it) it.remove(); }, 400); });
PL.pacientes.mas = (orig => () => orig().concat([['clibajas', `${TT('paciente', 'p', '', 'l', 'C')} dados de baja`]]))(PL.pacientes.mas);


