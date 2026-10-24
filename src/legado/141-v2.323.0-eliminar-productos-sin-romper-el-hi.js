const PROD_USOS = { ventas: 'pedidos', borradores: 'borradores', servicio: 'pedidos con este servicio', compras: 'compras', lotes: 'lotes',
  movimientos: 'movimientos de stock', muestras: 'entregas de muestras', cirugias: 'intervenciones', concursos: 'precios de concurso', equipos: 'equipos',
  visitas: TT('visita', 'p', '', 'l', 'l'), comisiones: 'esquemas de comisión' };
document.body.insertAdjacentHTML('beforeend', '<button type="button" id="prodelim" class="plmasoc" tabindex="-1" aria-hidden="true"></button>');
$('prodelim').onclick = async () => {
  $('dbody').innerHTML = `<div class="fh"><div><h2>Productos eliminados</h2><div class="sm">No salen en las listas ni en los pedidos. Se conservan para el histórico.</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div><div id="prodeliml"><div class="skel"></div><div class="skel"></div></div>`;
  $('dlg').showModal();
  const { data } = await db.from('productos').select('id, nombre, referencia, eliminado_en').not('eliminado_en', 'is', null).order('eliminado_en', { ascending: false }).limit(300);
  const l = data || [];
  $('prodeliml').innerHTML = l.length ? `<div class="lista">${l.map(x => `<div class="item bajaf"><span class="tx"><b>${esc(x.nombre)}</b><span class="sm">${x.referencia ? esc(x.referencia) + ' · ' : ''}Eliminado el ${fechaCorta(String(x.eliminado_en).slice(0, 10))}</span></span>
      ${puedeEliminarProducto() ? `<button type="button" class="btn sec chico" data-prrec="${x.id}">Recuperar</button>` : ''}</div>`).join('')}</div>` : '<div class="vacio">No hay productos eliminados.</div>';
};
document.addEventListener('click', async e => {
  const b = e.target.closest('#prodeliml [data-prrec]'); if (!b) return;
  b.disabled = true;
  const { data: r, error } = await db.rpc('recuperar_producto', { p_id: b.dataset.prrec });
  if (error || !r || !r.ok) { b.disabled = false; toast('No se ha podido recuperar', true); return; }
  toast('Producto recuperado · vuelve a estar activo');
  const it = b.closest('.bajaf'); if (it) it.remove();
  refrescarProductos();
});
if (PL.productos && PL.productos.prods) PL.productos.prods.mas = (orig => () => orig().concat(puedeEliminarProducto() ? [['prodelim', 'Productos eliminados']] : []))(PL.productos.prods.mas);


