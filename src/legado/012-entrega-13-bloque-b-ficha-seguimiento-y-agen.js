/* ============================================================
   DLC OS 2.0 · Entrega 13 · Bloque B: ficha, seguimiento y agenda
   ============================================================ */


/* ---------------- editar y borrar visitas ---------------- */

async function editarVisita(v, medicoId) {
  const pos = CAT.resultado_visita.filter(r => r.extra !== 'neg'), neg = CAT.resultado_visita.filter(r => r.extra === 'neg');
  const marcados = v.resultados || [];
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Editar ${TT('visita', 's', '', 'l', 'l')}</h2><div class="sm">Registrada el ${fechaCorta(v.fecha)}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="evf">Fecha</label><input id="evf" type="date" value="${esc(v.fecha)}"></div>
      <div><label for="evm">Muestras</label><input id="evm" type="number" min="0" value="${v.muestras || 0}"></div>
    </div>
    <label>Resultado</label>
    <div class="opciones">${pos.map(r => `<button type="button" class="opt" data-res="${esc(r.valor)}"
      aria-pressed="${marcados.includes(r.valor)}"><span class="mk"></span>${esc(r.valor)}</button>`).join('')}</div>
    <div class="opciones" style="margin-top:8px">${neg.map(r => `<button type="button" class="opt neg" data-res="${esc(r.valor)}" data-neg="1"
      aria-pressed="${marcados.includes(r.valor)}"><span class="mk"></span>${esc(r.valor)}</button>`).join('')}</div>
    <div class="g2" style="margin-top:6px">
      <div><label for="evpa">Próxima acción</label><input id="evpa" value="${esc(v.proxima_accion || '')}"></div>
      <div><label for="evpf">Fecha</label><input id="evpf" type="date" value="${esc(v.proxima_fecha || '')}"></div>
    </div>
    <label for="evn">Nota</label><textarea id="evn" rows="3">${esc(v.nota || '')}</textarea>
    <div class="acts" style="justify-content:space-between">
      <button class="btn sec dang" id="evborrar">Borrar ${TT('visita', 's', '', 'l', 'l')}</button>
      <span class="acts" style="margin:0"><button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn" id="evok">Guardar</button></span></div>`;

  $('dbody').querySelectorAll('[data-res]').forEach(b => b.onclick = () => {
    const esNeg = b.dataset.neg === '1', on = b.getAttribute('aria-pressed') === 'true';
    $('dbody').querySelectorAll('[data-res]').forEach(x => { if (esNeg || x.dataset.neg === '1') x.setAttribute('aria-pressed', 'false'); });
    b.setAttribute('aria-pressed', String(!on));
  });

  $('evok').onclick = async ev => {
    const res = [...$('dbody').querySelectorAll('[data-res][aria-pressed=true]')].map(b => b.dataset.res);
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const { data: r, error } = await db.rpc('actualizar_actividad', { p: {
      id: v.id, fecha: $('evf').value, resultados: res, muestras: +$('evm').value || 0,
      nota: $('evn').value.trim(), proxima_accion: $('evpa').value.trim(), proxima_fecha: $('evpf').value || ''
    }});
    ev.target.disabled = false; ev.target.textContent = 'Guardar';
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    $('dlg').close(); toast(`${TT('visita', 's', '', 'l', 'C', 'actualizado')}`); abrirFicha(medicoId); cargarInicio();
  };

  $('evborrar').onclick = async () => {
    if (!await preguntar(`${TT('visita', 's', 'el', 'C', 'l')} desaparece del historial ${TT('medico', 's', 'del', 'l', 'l')}.\nQueda constancia en la auditoría.`,
      { titulo: `¿Borrar ${TT('visita', 's', 'el', 'l', 'l')}?`, ok: 'Borrar', peligro: true })) return;
    const { data: r, error } = await db.rpc('borrar_actividad', { p_id: v.id });
    if (error || (r && r.ok === false)) { toast('No se ha podido borrar', true); return; }
    $('dlg').close(); toast(`${TT('visita', 's', '', 'l', 'C', 'borrado')}`); abrirFicha(medicoId); cargarInicio();
  };
  $('dlg').showModal();
}

/* ---------------- cerca de mí ---------------- */



/* ---------------- agenda: crear cita, hora y mes ---------------- */


// v2.242.0: aquí iba la primera versión de cambiarHoraCita (se redefine entera más abajo)




