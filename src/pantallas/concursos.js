// pantallas/concursos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function menuConcursos() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="concursos"]');
  if (!b) { const tras = nav.querySelector('[data-t="ventas"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', '<button data-t="concursos" aria-selected="false">Concursos</button>'); b = nav.querySelector('[data-t="concursos"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('ventas')));
}

async function pintarConcursos(vista) {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data, error }, { data: aj }] = await Promise.all([
    db.from('concursos').select('id,titulo,expediente,organismo,estado,limite,inicio,fin,prorroga_hasta,importe_licitacion,cuenta_id,cuentas(nombre),concurso_lotes(estado)').order('creado_en', { ascending: false }).limit(300),
    db.from('ajustes').select('valor').eq('clave', 'avisos_vencimiento').maybeSingle()]);
  if (!$('cfgcuerpo') || TAB !== 'concursos') return;
  if (error) { caja.innerHTML = '<div class="vacio">No se han podido cargar los concursos.</div>'; return; }
  if (aj && aj.valor && Array.isArray(aj.valor.dias)) CON_AVISOS = aj.valor.dias.map(Number).filter(n => n > 0);
  const hoy = hoyISO(), l = data || [];
  const sel = vista === 'contratos' ? l.filter(c => c.estado === 'Adjudicado').sort((a, b) => String(conVence(a) || '9999').localeCompare(String(conVence(b) || '9999')))
    : vista === 'cerrados' ? l.filter(c => c.estado === 'Perdido' || c.estado === 'Desierto')
    : l.filter(c => c.estado === 'En estudio' || c.estado === 'Oferta enviada').sort((a, b) => String(a.limite || '9999').localeCompare(String(b.limite || '9999')));
  const aviso = Math.max(...CON_AVISOS, 0);
  const fila = c => { const q = conQuedan(c), lotes = c.concurso_lotes || [], gan = lotes.filter(x => x.estado === 'Ganado').length;
    const extra = vista === 'contratos'
      ? (q == null ? '<span class="pill p-warn">Sin fecha de fin</span>' : q < 0 ? '<span class="pill p-anu">Vencido</span>'
        : `<span class="pill ${q <= aviso ? 'p-urg' : 'p-est'}">${q === 0 ? 'Vence hoy' : `Vence en ${num(q)} ${q === 1 ? 'día' : 'días'}`}</span>`)
      : vista === 'marcha' && c.limite ? `<span class="pill ${c.estado === 'En estudio' && c.limite < hoy ? 'p-anu' : c.estado === 'En estudio' && c.limite <= isoMas(hoy, 7) ? 'p-urg' : 'p-per'}">Presentar hasta el ${fechaCorta(c.limite)}</span>` : '';
    return `<button type="button" class="item conrow" data-con="${c.id}"><span class="tx"><b>${esc(c.titulo)}</b>
      <span class="sm">${esc([(c.cuentas || {}).nombre, c.organismo, c.expediente ? 'Exp. ' + c.expediente : ''].filter(Boolean).join(' · '))}${lotes.length ? ` · ${lotes.length === 1 ? '1 lote' : lotes.length + ' lotes'}${gan ? `, ${gan === 1 ? '1 ganado' : gan + ' ganados'}` : ''}` : ''}${c.importe_licitacion ? ' · ' + eurI(c.importe_licitacion) : ''}</span></span>
      <span class="cirest">${conPill(c.estado)}${extra}</span></button>`; };
  caja.innerHTML = `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="connuevo">+ Nuevo concurso</button>
      ${puede('administrar') ? `<button type="button" class="btn sec" id="conavisos">Avisos de vencimiento</button>` : ''}</div>
    ${vista === 'contratos' ? `<p class="sm">Los precios de los lotes ganados se ponen solos en los pedidos de esa ficha mientras el contrato está en vigor. Avisa ${CON_AVISOS.length ? CON_AVISOS.slice().sort((a, b) => b - a).join(' y ') + ' días' : 'nunca'} antes de que venza.</p>` : ''}
    <section class="card cirbloque">${sel.length ? `<div class="lista">${sel.map(fila).join('')}</div>`
      : `<div class="vacio vlinea">${vista === 'contratos' ? 'No hay contratos adjudicados.' : vista === 'cerrados' ? 'No hay concursos cerrados.' : 'No hay concursos en marcha.'}</div>`}</section></div>`;
  $('connuevo').onclick = () => editarConcurso(null);
  if ($('conavisos')) $('conavisos').onclick = () => editorAvisosVencimiento();
  caja.querySelectorAll('[data-con]').forEach(b => b.onclick = () => verConcurso(b.dataset.con));
}

async function editarConcurso(c) {
  const e = c || { estado: 'En estudio', responsable_id: PERFIL.id };
  if (!COMS.length) { try { await cargarComerciales(); } catch (x) {} }
  const gente = COMS.some(u => u.id === PERFIL.id) ? COMS : [{ id: PERFIL.id, nombre: PERFIL.nombre }].concat(COMS);
  $('dbody').innerHTML = `<div class="fh"><div><h2>${c ? 'Cambiar el concurso' : 'Nuevo concurso'}</h2><div class="sm">Pliego, plazos e importe</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="cont">Título</label><input id="cont" value="${esc(e.titulo || '')}" placeholder="p. ej. Suministro de material de osteosíntesis">
    <label>A quién se vende</label><div id="concta"></div>
    <div class="g2"><div><label for="conexp">Expediente</label><input id="conexp" value="${esc(e.expediente || '')}"></div>
      <div><label for="conorg">Organismo</label><input id="conorg" value="${esc(e.organismo || '')}" placeholder="p. ej. Diputación de Barcelona"></div></div>
    <div class="g2"><div><label for="conpub">Publicado</label><input id="conpub" type="date" value="${esc(e.publicado || '')}"></div>
      <div><label for="conlim">Presentar hasta</label><input id="conlim" type="date" value="${esc(e.limite || '')}"></div></div>
    <div class="g2"><div><label for="conimp">Importe de licitación sin IVA (€)</label><input id="conimp" type="number" min="0" step="0.01" value="${e.importe_licitacion != null ? +e.importe_licitacion : ''}"></div>
      <div><label for="conres">Responsable</label><select id="conres">${gente.map(u => `<option value="${u.id}" ${u.id === e.responsable_id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}</select></div></div>
    <label for="conn">Nota</label><textarea id="conn" rows="2">${esc(e.nota || '')}</textarea>
    <div class="acts" style="justify-content:flex-end">${c ? '<button type="button" class="btn sec peligro" id="conborrar">Borrar</button>' : ''}
      <button type="button" class="btn sec" data-cerrar>Cancelar</button><button type="button" class="btn" id="conok">${c ? 'Guardar' : 'Crear concurso'}</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  let cta = c ? { id: c.cuenta_id, nombre: (c.cuentas || {}).nombre || '' } : null;
  selectorMedico($('concta'), { valor: cta, placeholder: 'Busca el centro, la clínica o el organismo', alElegir: m => { cta = m; } });
  $('conok').onclick = async ev => {
    const titulo = $('cont').value.trim();
    if (!titulo || !cta) { toast('Escribe el título y elige a quién se vende', true); return; }
    const fila = { titulo, cuenta_id: cta.id, expediente: $('conexp').value.trim() || null, organismo: $('conorg').value.trim() || null,
      publicado: $('conpub').value || null, limite: $('conlim').value || null, importe_licitacion: $('conimp').value === '' ? null : Math.max(0, +$('conimp').value),
      responsable_id: $('conres').value || null, nota: $('conn').value.trim() || null };
    ev.target.disabled = true;
    const r = c ? await db.from('concursos').update(fila).eq('id', c.id).select('id').single() : await db.from('concursos').insert(fila).select('id').single();
    ev.target.disabled = false;
    if (r.error) { toast(/row-level|policy/i.test(r.error.message) ? 'No puedes crear ni cambiar concursos de esta ficha' : 'No se ha podido guardar: ' + r.error.message, true); return; }
    toast(c ? 'Concurso guardado' : 'Concurso creado'); verConcurso(r.data.id);
  };
  if ($('conborrar')) $('conborrar').onclick = async () => {
    if (!await preguntar('El concurso desaparece con sus lotes y precios.', { titulo: '¿Borrar el concurso?', ok: 'Borrar', peligro: true })) return;
    const { error } = await db.from('concursos').delete().eq('id', c.id);
    if (error) { toast('No se ha podido borrar', true); return; }
    $('dlg').close(); toast('Concurso borrado');
  };
}

async function verConcurso(id) {
  const { data: c, error } = await db.from('concursos').select('*,cuentas(nombre),concurso_lotes(id,numero,descripcion,importe_licitacion,estado,adjudicatario,importe_adjudicado,creado_en,concurso_precios(id,producto_id,precio,unidades))').eq('id', id).maybeSingle();
  if (error || !c) { toast('No se ha encontrado el concurso', true); return; }
  if (!PRODUCTOS.length) await cargarProductos();
  const lotes = (c.concurso_lotes || []).sort((a, b) => String(a.numero || '').localeCompare(String(b.numero || ''), 'es', { numeric: true }) || String(a.creado_en).localeCompare(String(b.creado_en)));
  const prods = PRODUCTOS.filter(p => (p.estado || 'Activo') !== 'Descatalogado');
  const q = conQuedan(c), gan = lotes.some(l => l.estado === 'Ganado');
  const lote = l => `<div class="conlote" data-lote="${l.id}">
      <div class="conlcab"><input data-lf="numero" value="${esc(l.numero || '')}" placeholder="Nº" aria-label="Número de lote" class="conln">
        <input data-lf="descripcion" value="${esc(l.descripcion || '')}" placeholder="Descripción del lote" aria-label="Descripción del lote">
        <select data-lf="estado" aria-label="Estado del lote">${CON_LOTE_EST.map(s => `<option ${s === l.estado ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <button type="button" class="x" data-lq aria-label="Quitar el lote">✕</button></div>
      <div class="conlimp"><label><span>Licitación (€)</span><input type="number" min="0" step="0.01" data-lf="importe_licitacion" value="${l.importe_licitacion != null ? +l.importe_licitacion : ''}"></label>
        <label><span>Adjudicado (€)</span><input type="number" min="0" step="0.01" data-lf="importe_adjudicado" value="${l.importe_adjudicado != null ? +l.importe_adjudicado : ''}"></label>
        <label class="${l.estado === 'Perdido' ? '' : 'hide'}" data-ladj><span>Se lo llevó</span><input data-lf="adjudicatario" value="${esc(l.adjudicatario || '')}" placeholder="Empresa que lo ganó"></label></div>
      <div class="conprecios">${(l.concurso_precios || []).map(x => `<div class="conpf" data-cp="${x.id}"><span>${esc((PRODUCTOS.find(p => p.id === x.producto_id) || {}).nombre || 'Producto')}</span>
          <label><span class="sm">Precio sin IVA</span><input type="number" min="0" step="0.01" data-cpf="precio" value="${+x.precio}"></label>
          <label><span class="sm">Unidades</span><input type="number" min="0" step="1" data-cpf="unidades" value="${x.unidades != null ? x.unidades : ''}"></label>
          <button type="button" class="x" data-cpq aria-label="Quitar el producto">✕</button></div>`).join('')}
        <div class="conpadd"><select data-cpnuevo aria-label="Añadir un producto"><option value="">+ Añadir un producto…</option>${prods.filter(p => !(l.concurso_precios || []).some(x => x.producto_id === p.id)).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></div></div></div>`;
  $('dbody').innerHTML = `<div class="fh"><div><h2>${esc(c.titulo)}</h2><div class="sm">${esc([(c.cuentas || {}).nombre, c.organismo, c.expediente ? 'Exp. ' + c.expediente : ''].filter(Boolean).join(' · '))}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="cirdat"><span>Estado</span><b><select id="conest" aria-label="Estado del concurso">${CON_ESTADOS.map(s => `<option ${s === c.estado ? 'selected' : ''}>${s}</option>`).join('')}</select></b>
      ${c.limite ? `<span>Presentar hasta</span><b>${esc(fechaLarga(new Date(c.limite + 'T12:00:00')))}</b>` : ''}
      ${c.importe_licitacion ? `<span>Licitación</span><b>${eurI(c.importe_licitacion)} sin IVA</b>` : ''}</div>
    <div class="cong3 ${c.estado === 'Adjudicado' ? '' : 'hide'}" id="confechas"><div><label for="conini">Contrato desde</label><input id="conini" type="date" value="${esc(c.inicio || '')}"></div>
      <div><label for="confin">Hasta</label><input id="confin" type="date" value="${esc(c.fin || '')}"></div>
      <div><label for="conpro">Prorrogado hasta</label><input id="conpro" type="date" value="${esc(c.prorroga_hasta || '')}"></div></div>
    ${c.estado === 'Adjudicado' ? (gan ? `<div class="banda-ok conok">Los precios de los lotes ganados se aplican en los pedidos de ${esc((c.cuentas || {}).nombre || 'esta ficha')}${q != null ? (q < 0 ? ' (el contrato ya ha vencido)' : ` durante ${num(q)} ${q === 1 ? 'día' : 'días'} más`) : ''}.</div>`
      : '<div class="banda-aviso conok">Marca como «Ganado» los lotes adjudicados para que sus precios se apliquen en los pedidos.</div>') : ''}
    <div class="evascab"><h3>Lotes · ${lotes.length}</h3><button type="button" class="btn sec" id="conlmas">+ Lote</button></div>
    <div id="conlotes">${lotes.length ? lotes.map(lote).join('') : '<div class="vacio vlinea">Añade los lotes del pliego a los que te presentas, con sus productos y precios.</div>'}</div>
    ${c.nota ? `<p class="sm">${esc(c.nota)}</p>` : ''}
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="coneditar">Cambiar los datos</button><button type="button" class="btn" data-cerrar>Hecho</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  const fallo = er => toast(/row-level|policy/i.test(er.message) ? 'No puedes cambiar este concurso' : 'No se ha podido guardar: ' + er.message, true);
  $('coneditar').onclick = () => editarConcurso(c);
  $('conest').onchange = async e => {
    const { error: er } = await db.from('concursos').update({ estado: e.target.value }).eq('id', id);
    if (er) { fallo(er); e.target.value = c.estado; return; }
    verConcurso(id);
  };
  [['conini', 'inicio'], ['confin', 'fin'], ['conpro', 'prorroga_hasta']].forEach(([k, f]) => $(k).onchange = async e => {
    const { error: er } = await db.from('concursos').update({ [f]: e.target.value || null }).eq('id', id);
    if (er) { fallo(er); return; }
    toast('Fechas del contrato guardadas');
  });
  $('conlmas').onclick = async () => {
    const { error: er } = await db.from('concurso_lotes').insert({ concurso_id: id, numero: String(lotes.length + 1) });
    if (er) { fallo(er); return; }
    verConcurso(id);
  };
  $('conlotes').querySelectorAll('[data-lote]').forEach(box => {
    const lid = box.dataset.lote;
    box.querySelectorAll('[data-lf]').forEach(i => i.onchange = async () => {
      const f = i.dataset.lf, v = i.type === 'number' ? (i.value === '' ? null : Math.max(0, +i.value)) : (i.value.trim() || null);
      const { error: er } = await db.from('concurso_lotes').update({ [f]: f === 'estado' ? i.value : v }).eq('id', lid);
      if (er) { fallo(er); return; }
      if (f === 'estado') verConcurso(id);
    });
    box.querySelector('[data-lq]').onclick = async () => {
      if (!await preguntar('El lote desaparece con sus productos y precios.', { titulo: '¿Quitar el lote?', ok: 'Quitar', peligro: true })) return;
      const { error: er } = await db.from('concurso_lotes').delete().eq('id', lid);
      if (er) { fallo(er); return; }
      verConcurso(id);
    };
    box.querySelector('[data-cpnuevo]').onchange = async e => {
      const pid = e.target.value; if (!pid) return;
      const p = PRODUCTOS.find(x => x.id === pid) || {};
      const { error: er } = await db.from('concurso_precios').insert({ lote_id: lid, producto_id: pid, precio: p.precio != null ? +p.precio : 0 });
      if (er) { fallo(er); return; }
      verConcurso(id);
    };
    box.querySelectorAll('[data-cp]').forEach(f => {
      f.querySelectorAll('[data-cpf]').forEach(i => i.onchange = async () => {
        const k = i.dataset.cpf, v = i.value === '' ? null : Math.max(0, k === 'unidades' ? Math.floor(+i.value) : +i.value);
        if (k === 'precio' && v == null) { toast('Escribe el precio', true); return; }
        const { error: er } = await db.from('concurso_precios').update({ [k]: v }).eq('id', f.dataset.cp);
        if (er) fallo(er);
      });
      f.querySelector('[data-cpq]').onclick = async () => {
        const { error: er } = await db.from('concurso_precios').delete().eq('id', f.dataset.cp);
        if (er) { fallo(er); return; }
        verConcurso(id);
      };
    });
  });
}

async function cargarPreciosContrato(cuenta) {
  cuenta = cuenta || null;
  if (cuenta === PED_PRECIOS.cuenta) return false;
  const antes = JSON.stringify(PED_PRECIOS.precios);
  let precios = {};
  if (cuenta) { try { const { data } = await db.rpc('precios_contrato', { p_cuenta: cuenta }); precios = data || {}; } catch (e) {} }
  PED_PRECIOS = { cuenta, precios };
  return JSON.stringify(precios) !== antes;
}

function editorAvisosVencimiento() {
  $('dbody').innerHTML = `<div class="fh"><div><h2>Avisos de vencimiento</h2><div class="sm">Cuántos días antes de que venza un contrato se avisa</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="convd">Días antes (separados por comas)</label><input id="convd" value="${esc(CON_AVISOS.slice().sort((a, b) => b - a).join(', '))}" placeholder="90, 30">
    <p class="sm">El aviso llega a quien lleva la ficha, al responsable del concurso y a la administración, una vez por cada plazo. Vacío: sin avisos.</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="convok">Guardar</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  $('convok').onclick = async () => {
    const dias = [...new Set($('convd').value.split(/[^0-9]+/).map(Number).filter(n => n > 0 && n <= 999))].sort((a, b) => b - a);
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'avisos_vencimiento', p_valor: { dias } });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    CON_AVISOS = dias; $('dlg').close(); toast('Avisos guardados');
  };
}
