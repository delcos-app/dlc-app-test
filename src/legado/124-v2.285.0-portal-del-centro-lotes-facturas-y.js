


document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-pcfac], [data-pcmat]'); if (!t) return;
  if (t.dataset.pcfac) pcFactura(t.dataset.pcfac, t); else pcMaterialBajar(t.dataset.pcmat, t);
});

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


