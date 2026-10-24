/* ============================================================
   DLC OS 2.0 · Entrega 14 · Bloque C
   ============================================================ */

/* ---------------- spinner y descargas ---------------- */



document.addEventListener('click', e => {
  const o = e.target.closest('[data-dlo]');
  if (o) {
    const [id, fmt] = o.dataset.dlo.split('|');
    document.querySelectorAll('.dl-menu').forEach(m => m.classList.add('hide'));
    if (id === 'seg' && window.__dlSeg) window.__dlSeg(fmt);
    if (id === 'an' && window.__dlAn) window.__dlAn(fmt);
    if (id === 'dir' && window.__dlDir) window.__dlDir(fmt);
    return;
  }
  const b = e.target.closest('[data-dl]');
  document.querySelectorAll('.dl-menu').forEach(m => { if (!b || m.id !== 'dlm-' + b.dataset.dl) m.classList.add('hide'); });
  if (b) $('dlm-' + b.dataset.dl).classList.toggle('hide');
});



/* ---------------- buscador global agrupado ---------------- */

let TGLOB, GPIDE = 0;
$('q').addEventListener('input', e => {
  clearTimeout(TGLOB);
  const q = e.target.value.trim();
  const caja = e.target.closest('.gsearch');
  if (q.length < 2) { $('gsug').classList.add('hide'); caja.classList.remove('buscando'); return; }
  caja.classList.add('buscando');
  $('gsug').innerHTML = '<div class="gload"><span class="spin"></span>Buscando…</div>';
  $('gsug').classList.remove('hide');
  const pide = ++GPIDE;
  TGLOB = setTimeout(async () => {
    const { data } = await db.rpc('buscar_global', { q, lim: 6 });
    if (pide !== GPIDE) return;            // ya hay una búsqueda más nueva
    caja.classList.remove('buscando');
    if (!data) { $('gsug').innerHTML = '<div class="gload">No se ha podido buscar. Revisa la conexión.</div>'; return; }
    const m = data.municipios || [], c = data.centros || [], me = data.medicos || [];
    if (!m.length && !c.length && !me.length) { $('gsug').innerHTML = `<div class="gload">Sin resultados para «${esc(q)}».</div>`; return; }
    $('gsug').innerHTML =
      (m.length ? `<div class="gsh">Municipios</div>` + m.map(x => `<button data-gm="${esc(x.valor)}">
        <span class="gic">📍</span><span><b>${resaltarBusqueda(x.valor, q)}</b><span class="sm">${num(x.n)} ${TT('medico', 'p', '', 'l', 'l')}</span></span></button>`).join('') : '') +
      (c.length ? `<div class="gsh">Centros</div>` + c.map(x => `<button data-gc="${esc(x.valor)}"${x.id ? ` data-gcid="${x.id}"` : ''}>
        <span class="gic">🏥</span><span><b>${resaltarBusqueda(x.valor, q)}</b><span class="sm">${esc(x.municipio || '')} · ${num(x.n)} ${TT('medico', 'p', '', 'l', 'l')}</span></span></button>`).join('') : '') +
      (me.length ? `<div class="gsh">${TT('medico', 'p', '', 'l', 'C')}${m.length || c.length ? ' que atienden allí o coinciden' : ''}</div>` + me.map(x => `<button data-gme="${x.id}">
        <span class="gic">${x.urgente ? '❗' : '👤'}</span><span><b>${resaltarBusqueda(x.nombre, q)}</b>
        <span class="sm">${esc(x.especialidad || '')} · ${esc(x.centro_nombre || '')} ${esc(x.municipio || '')}</span></span></button>`).join('') : '');
    $('gsug').classList.remove('hide');
  }, 250);
});

document.addEventListener('click', e => {
  if (!e.target.closest('.gsearch')) $('gsug').classList.add('hide');
  const gm = e.target.closest('[data-gm]'), gc = e.target.closest('[data-gc]'), gme = e.target.closest('[data-gme]');
  if (gm || gc) {
    Object.assign(F, { q: '', prov: '', muni: '', esp: '', est: '', urg: false, pagina: 0 });
    if (gm) { F.muni = gm.dataset.gm; if ($('fmuni')) $('fmuni').value = F.muni; }
    if (gc) { F.q = gc.dataset.gc; }
    $('q').value = ''; $('gsug').classList.add('hide');
    ir('directorio'); buscar(true);
  }
  if (gme) { $('gsug').classList.add('hide'); $('q').value = ''; abrirFicha(gme.dataset.gme); }
});

/* ---------------- ventas: detalle, edición y anulación ---------------- */



/* ---------------- analítica en tabla ---------------- */




