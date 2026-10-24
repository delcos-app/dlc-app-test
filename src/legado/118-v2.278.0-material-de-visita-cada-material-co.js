/* ============================================================
   v2.278.0 · Material de visita: cada material con su cantidad y su máximo en el portal (aviso de Eric, 12/10/2026).
   Antes, «Pide cantidad» solo se elegía al añadir y el máximo que puede pedir el profesional desde su portal (20 si nadie lo
   cambiaba) estaba en otro apartado. Ahora cada fila de «Material promocional» lleva:
   - Al registrar: «Anotar cuántas se entregan» o «Solo marcar que se entregó» (guardar_valor dato_tipo).
   - Con el portal: «Se puede pedir desde el portal» y «Máximo por petición» (1 a 1.000; vacío o fuera de rango avisa en la fila
     y no se guarda). Se guarda en el mismo ajuste que «Portal del profesional» (portal.material).
   ============================================================ */
pintarMaterial = (orig => async function (...x) {
  const r = await orig.apply(this, x);
  try { await matMejorar(); } catch (e) { registrarError('error', 'Material promocional: ' + e.message); }
  return r;
})(pintarMaterial);

async function matMejorar() {
  const lista = document.querySelector('#cfgcuerpo .matlista'); if (!lista) return;
  const { data: cid } = await db.from('clasificadores').select('id').eq('papel', 'material_visita').maybeSingle();
  if (!cid) return;
  const conPortal = typeof hayExtra === 'function' && hayExtra('portal');
  const [{ data: vals }, rp, ra] = await Promise.all([
    db.from('valores_clasificador').select('id,valor,activo,dato_tipo').eq('clasificador_id', cid.id).order('orden'),
    conPortal ? RPC_ORIG('portal_material_permitido', {}) : Promise.resolve({ data: [] }),
    conPortal ? db.from('ajustes').select('valor').eq('clave', 'portal').maybeSingle() : Promise.resolve({ data: null })]);
  if (!document.querySelector('#cfgcuerpo .matlista')) return;
  const perm = Array.isArray(rp && rp.data) ? rp.data : [], conAjuste = !!(ra && ra.data && ra.data.valor && ra.data.valor.material);
  const de = v => perm.find(p => p.valor === v);
  const vis = TT('visita', 's', 'la', 'l', 'l');
  lista.classList.add('matlista2');
  lista.innerHTML = (vals || []).map(v => { const p = de(v.valor); return `<div class="matfila2 ${v.activo ? '' : 'off'}" data-mv="${v.id}" data-mvv="${esc(v.valor)}" data-mdt0="${v.dato_tipo === 'numero' ? 'numero' : ''}">
      <b class="mtnom">${esc(v.valor)}</b>
      <label class="mtcampo"><span class="sm">Al registrar ${vis}</span><select class="chico" data-mdt>
        <option value="numero" ${v.dato_tipo === 'numero' ? 'selected' : ''}>Anotar cuántas se entregan</option>
        <option value="" ${v.dato_tipo === 'numero' ? '' : 'selected'}>Solo marcar que se entregó</option></select></label>
      ${conPortal ? `<label class="opt mtpor"><input type="checkbox" data-mpp ${p ? 'checked' : ''}> Se puede pedir desde el portal</label>
      <label class="mtcampo mtmax"><span class="sm">Máximo por petición</span><input type="number" step="1" data-mpx value="${p ? p.max : 20}" ${p ? '' : 'disabled'}></label>` : ''}
      <label class="vfswitch mini"><input type="checkbox" data-mact2="${v.id}" ${v.activo ? 'checked' : ''}><span class="sw"></span><span class="sm">${v.activo ? 'Activo' : 'Oculto'}</span></label>
      <span class="mterr sm" hidden></span></div>`; }).join('') || '<div class="sm">Todavía no hay material.</div>';
  if (vals && vals.length) lista.insertAdjacentHTML('afterend', `<div class="acts mtacts" style="justify-content:space-between;align-items:center">
      <span class="sm">${conPortal && !conAjuste ? 'Ahora el portal permite pedir todo el material, hasta 20 de cada uno. Guarda para decidirlo tú.' : ''}</span>
      <button class="btn" id="matguardar">Guardar cambios</button></div>`);
  lista.querySelectorAll('[data-mpp]').forEach(c => c.onchange = () => { const i = c.closest('.matfila2').querySelector('[data-mpx]'); if (i) i.disabled = !c.checked; });
  lista.querySelectorAll('[data-mact2]').forEach(c => c.onchange = async () => {
    await db.rpc('guardar_valor', { p: { id: c.dataset.mact2, activo: c.checked } });
    c.closest('.matfila2').classList.toggle('off', !c.checked); c.parentElement.querySelector('.sm').textContent = c.checked ? 'Activo' : 'Oculto';
    toast(c.checked ? 'Visible al registrar' : 'Oculto al registrar'); cargarCatalogos();
  });
  if ($('matguardar')) $('matguardar').onclick = async ev => {
    const filas = [...lista.querySelectorAll('.matfila2')];
    let mal = false; const material = [];
    filas.forEach(f => {
      const e = f.querySelector('.mterr'); e.hidden = true; e.textContent = '';
      const c = f.querySelector('[data-mpp]'), i = f.querySelector('[data-mpx]');
      if (!c || !c.checked) return;
      const n = Number(i.value);
      if (!i.value || !Number.isInteger(n) || n < 1 || n > 1000) { e.hidden = false; e.textContent = 'El máximo por petición tiene que ser un número entero de 1 a 1.000'; mal = true; return; }
      material.push({ valor: f.dataset.mvv, max: n });
    });
    if (mal) { toast('Revisa los máximos marcados en rojo', true); return; }
    ev.target.disabled = true;
    try {
      for (const f of filas) {
        const s = f.querySelector('[data-mdt]');
        if (s.value !== f.dataset.mdt0) {
          const { error } = await db.rpc('guardar_valor', { p: { id: f.dataset.mv, dato_tipo: s.value, dato_etiqueta: s.value ? 'Unidades' : '' } });
          if (error) { toast('No se ha podido guardar ' + f.dataset.mvv + ': ' + error.message, true); return; }
          f.dataset.mdt0 = s.value;
        }
      }
      if (conPortal) {
        const { error } = await db.rpc('guardar_ajuste', { p_clave: 'portal', p_valor: Object.assign({}, (ra && ra.data && ra.data.valor) || {}, { material }) });
        if (error) { toast('No se ha podido guardar el portal: ' + error.message, true); return; }
      }
      toast('Guardado'); cargarCatalogos();
    } finally { ev.target.disabled = false; }
  };
}




