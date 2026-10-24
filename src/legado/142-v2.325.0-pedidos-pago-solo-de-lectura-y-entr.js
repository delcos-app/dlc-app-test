/* ============================================================
   v2.325.0 · Pedidos: pago solo de lectura y entregas sin cargo (aviso de Eric, 16/10/2026).
   - El bloque «Pago» del pedido ya no se edita a medias: enseña la referencia y los justificantes que haya; se cambian con
     «Editar» (o «Editar datos» si ya tiene factura). Fuera «Guardar referencia» y «Añadir justificante» (basta el check de
     «Pago recibido»); en el editor tampoco se adjuntan justificantes.
   - Un pedido sin cargo (marcado así o a 0 € con unidades) se describe como «Entrega sin cargo» y no como «Venta al …»: no es una
     venta (también los que se hicieron antes al 100 % de descuento).
   ============================================================ */
function sinCargoP(p, total) { return !!(p && (p.sin_cargo || (total != null && Math.abs(+total) < 0.005 && (p.unidades == null || +p.unidades > 0)))); }
function etiquetaCanal(p, total) { return sinCargoP(p, total) ? 'Entrega sin cargo' : p.canal === 'centro' ? 'Venta a centro' : `Venta ${TT('paciente', 's', 'al', 'l', 'l')}`; }
pedidoPago = async function (id) {
  if (!$('dlg').open || $('pdpago')) return;
  const [{ data }, { data: js }] = await Promise.all([RPC_ORIG('pedido_detalle', { p_id: id }),
    db.from('pedidos_justificantes').select('id,nombre,tamano,creado_en').eq('pedido_id', id).order('creado_en')]);
  const p = data && data.pedido; if (!p || !$('dlg').open || $('pdpago')) return;
  if (p.sin_cargo) return;
  const acts = $('dbody').querySelector('.acts:last-of-type'); if (!acts) return;
  const ref = $('pdops') || acts;
  ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="pdpago"><h3>Pago</h3>
    ${p.origen === 'web' ? '<p class="sm"><span class="pill p-est">Pedido por la web</span></p>' : ''}
    <div class="pdpagof"><span class="sm">Referencia del pago</span><b>${p.pago_referencia ? esc(p.pago_referencia) : '—'}</b></div>
    ${(js || []).length ? `<div class="lista" id="pdjus">${js.map(j => `<div class="item"><span class="tx"><b>${esc(j.nombre)}</b><span class="sm">${fechaCorta(String(j.creado_en).slice(0, 10))} · ${num(Math.round(j.tamano / 1024))} KB</span></span>
      <button type="button" class="btn sec chico" data-jver="${j.id}">Ver</button></div>`).join('')}</div>` : ''}</div>`);
  $('pdpago').querySelectorAll('[data-jver]').forEach(b => b.onclick = () => verJustificante(b.dataset.jver));
};


