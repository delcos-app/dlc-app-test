/* ============================================================
   v2.323.0 · Eliminar productos sin romper el histórico (decisión de Eric; SQL 165). En el producto, «Eliminar producto»:
   si nunca se ha usado se borra; si tiene ventas, compras, lotes, muestras… deja de salir en todas partes pero se conserva
   para el histórico (pedidos, facturas y lotes siguen con su nombre); con stock disponible no deja. Se recupera desde
   Productos → «⋯» → «Productos eliminados».
   ============================================================ */
const puedeEliminarProducto = () => puede('administrar') || nivelDe2('P') >= 2;
const PROD_USOS = { ventas: 'pedidos', borradores: 'borradores', servicio: 'pedidos con este servicio', compras: 'compras', lotes: 'lotes',
  movimientos: 'movimientos de stock', muestras: 'entregas de muestras', cirugias: 'intervenciones', concursos: 'precios de concurso', equipos: 'equipos',
  visitas: TT('visita', 'p', '', 'l', 'l'), comisiones: 'esquemas de comisión' };
editorProducto = (orig => function (p, ...r) {
  const x = orig.call(this, p, ...r);
  setTimeout(() => {
    if (!p || !p.id || !puedeEliminarProducto() || !$('dbody') || !$('prok') || $('prelim')) return;
    // dentro de la fila de botones del editor: un bloque nuevo al final despistaría a los que buscan .acts:last-of-type
    const fila = $('prok').closest('.acts') || $('dbody').querySelector('.acts:last-of-type'); if (!fila) return;
    fila.insertAdjacentHTML('afterbegin', '<button type="button" class="btn sec dang prelimb" id="prelim">Eliminar producto</button>');
    $('prelim').onclick = async () => {
      if (!await preguntar('Si no se ha vendido nunca, se borra del todo, también su stock, sus lotes y sus compras. Si tiene ventas, muestras firmadas, intervenciones o equipos, deja de salir en todas partes pero se conserva para el histórico (los pedidos y las facturas siguen con su nombre) y se puede recuperar.',
        { titulo: `¿Eliminar «${p.nombre}»?`, ok: 'Eliminar', peligro: true })) return;
      const { data: res, error } = await db.rpc('eliminar_producto', { p_id: p.id });
      if (error || !res || !res.ok) {
        toast(res && res.error === 'stock' ? `Tiene ventas y ${num(res.unidades)} unidades en stock: sácalas o regulariza el stock antes de eliminarlo`
          : res && res.error === 'permiso' ? 'No tienes permiso para eliminar productos' : 'No se ha podido eliminar: ' + ((error && error.message) || (res && res.error) || ''), true);
        return;
      }
      if ($('dlg').open) $('dlg').close();
      if (res.modo === 'borrado') toast('Producto eliminado' + (res.detalle && +res.detalle.unidades ? ` con sus ${num(res.detalle.unidades)} unidades de stock` : ''));   // v2.324.0
      else toast('Producto eliminado de las listas · se conserva en el histórico (' + Object.entries(res.detalle || {}).map(([k, n]) => `${num(n)} ${PROD_USOS[k] || k}`).join(', ') + ')');
      refrescarProductos();
    };
  }, 0);
  return x;
})(editorProducto);
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


