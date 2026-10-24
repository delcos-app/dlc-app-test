/* ============================================================
   v2.285.0 · Portal del centro: lotes, facturas y material para descargar (SQL 153).
   - «Tus pedidos»: cada pedido con sus lotes (y caducidad) y sus facturas o rectificativas, que se descargan en PDF con el
     diseño de la empresa.
   - «Material y dudas»: «Material para descargar» con el material de sus productos que la empresa marca «Para los centros»
     (en el producto, Material para presentar → «Para los centros»).
   ============================================================ */
function pcExtraPed(p) {
  const lotes = p.lotes || [], facs = p.facturas || [];
  return (lotes.length ? `<span class="sm pclotes">Lote${lotes.length > 1 ? 's' : ''}: ${lotes.map(l => `${esc(l.producto)} ${esc(l.lote)}${l.caducidad ? ' (cad. ' + fechaCorta(String(l.caducidad).slice(0, 10)) + ')' : ''}`).join(' · ')}</span>` : '')
    + (facs.length ? `<span class="pcfacs">${facs.map(f => `<button type="button" class="lnk" data-pcfac="${f.id}">${f.rectificativa ? 'Rectificativa' : 'Factura'} ${esc(f.numero || '')}</button>`).join('')}</span>` : '');
}

async function pcFactura(id, btn) {
  if (btn) btn.disabled = true;
  try {
    const { data: f } = await RPC_ORIG('portal_factura', { p_id: id });
    if (!f || !f.ok) { toast(motivoPortal(f), true); return; }
    const d = f.diseno || {};
    const C = Object.assign({}, PDF_DEF, d, { cols: Object.assign({}, PDF_DEF.cols, d.cols || {}) });
    const doc = await facturaPDF(f, f.rectifica_num || '', C);
    doc.save(nombrePDF(f));
  } catch (e) { toast('No se ha podido preparar la factura', true); registrarError('app', 'Factura del portal', { e: String(e) }); }
  finally { if (btn) btn.disabled = false; }
}

async function pcMaterialBajar(id, btn) {
  if (btn) btn.disabled = true;
  try {
    const { data: m } = await RPC_ORIG('portal_material_archivo', { p_id: id });
    if (!m || !m.ok) { toast(motivoPortal(m), true); return; }
    const bin = atob(m.datos || ''), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: m.tipo || 'application/octet-stream' }));
    const a = document.createElement('a'); a.href = url; a.download = m.nombre || 'material'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (e) { toast('No se ha podido descargar', true); }
  finally { if (btn) btn.disabled = false; }
}

document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-pcfac], [data-pcmat]'); if (!t) return;
  if (t.dataset.pcfac) pcFactura(t.dataset.pcfac, t); else pcMaterialBajar(t.dataset.pcmat, t);
});

async function pcDescargas() {
  const caja = $('pmmat'); if (!caja || $('pcdesc')) return;
  caja.insertAdjacentHTML('afterbegin', `<div class="card ancard" id="pcdesc"><h2>Material para descargar ${pmAyu('Material para descargar', 'Dípticos, fichas de producto, guías de mostrador y otro material que la empresa prepara para los centros, de los productos que tenéis dados de alta. Pulsa para descargarlo.')}</h2><div id="pcdescl">${skelCard('Cargando…')}</div></div>`);
  const { data: l } = await RPC_ORIG('portal_materiales', {});
  const box = $('pcdescl'); if (!box) return;
  const lista = Array.isArray(l) ? l : [];
  const kb = n => n ? (n > 1048576 ? (n / 1048576).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB') : '';
  box.innerHTML = lista.length ? `<div class="lista">${lista.map(m => `<div class="item"><span class="tx"><b>${esc(m.nombre)}</b>
      <span class="sm">${esc(m.producto)} · ${m.tipo === 'application/pdf' ? 'PDF' : 'Imagen'}${m.tamano ? ' · ' + kb(m.tamano) : ''}</span></span>
      <button type="button" class="btn sec chico" data-pcmat="${m.id}">Descargar</button></div>`).join('')}</div>`
    : '<p class="sm">Todavía no hay material para descargar.</p>';
}
centroPintar = (orig => async function (...a) { const r = await orig.apply(this, a); try { await pcDescargas(); } catch (e) {} return r; })(centroPintar);

// Producto: el material, también para los centros
document.addEventListener('change', async e => {
  const c = e.target.closest && e.target.closest('[data-prmatpp]'); if (!c) return;
  c.disabled = true;
  const { error } = await db.from('producto_materiales').update({ para_portal: c.checked }).eq('id', c.dataset.prmatpp);
  c.disabled = false;
  if (error) { c.checked = !c.checked; toast('No se ha podido guardar: ' + error.message, true); return; }
  const m = (PRES_MAT || []).find(x => x.id === c.dataset.prmatpp); if (m) m.para_portal = c.checked;
  toast(c.checked ? 'Los centros que tienen este producto ya lo pueden descargar' : 'Ya no se ofrece a los centros');
});


