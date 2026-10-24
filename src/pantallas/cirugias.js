// pantallas/cirugias.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function menuCirugias() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="cirugias"]');
  if (!b) { const tras = nav.querySelector('[data-t="ciclo"]') || nav.querySelector('[data-t="agenda"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', '<button data-t="cirugias" aria-selected="false">Intervenciones</button>'); b = nav.querySelector('[data-t="cirugias"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('agenda')));
}

async function pintarCirugias() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const hoy = hoyISO();
  const { data, error } = await db.rpc('cirugias_lista', { p_desde: isoMas(hoy, -30), p_hasta: isoMas(hoy, 120) });
  if (!$('cfgcuerpo') || TAB !== 'cirugias') return;
  if (error) { caja.innerHTML = '<div class="vacio">No se han podido cargar las intervenciones.</div>'; return; }
  const l = data || [];
  const repo = l.filter(c => c.reposicion === 'vencida' || c.reposicion === 'pendiente');
  const prox = l.filter(c => c.estado === 'Programada' && c.fecha >= hoy);
  const atras = l.filter(c => c.estado === 'Programada' && c.fecha < hoy);
  const hechas = l.filter(c => c.estado !== 'Programada' && c.fecha <= hoy).reverse();
  const fila = c => `<button type="button" class="item cirrow" data-cir="${c.id}"><span class="cirf"><b>${esc(fechaCorta(c.fecha))}</b><span class="sm">${esc(cirHora(c))}</span></span>
    <span class="tx"><b>${esc(c.procedimiento || 'Intervención')}</b><span class="sm">${esc([c.cirujano, c.hospital, c.quirofano].filter(Boolean).join(' · '))}${c.asistente ? ' · asiste ' + esc(c.asistente) : ''}</span></span>
    <span class="cirest">${cirEstado(c)}${c.estado === 'Hecha' && !c.pedido_id ? '<span class="pill p-warn">Sin pedido</span>' : ''}${cirRepo(c)}</span></button>`;
  const bloque = (t, l2, vacio) => `<section class="card cirbloque"><h2>${t}</h2>${l2.length ? `<div class="lista">${l2.map(fila).join('')}</div>` : `<div class="vacio vlinea">${vacio}</div>`}</section>`;
  caja.innerHTML = `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="cirnueva">+ Nueva intervención</button></div>
    ${repo.length ? bloque('Reposiciones pendientes', repo, '') : ''}
    ${atras.length ? bloque('Sin registrar lo usado', atras, '') : ''}
    ${bloque('Próximas', prox, 'No hay intervenciones programadas.')}
    ${bloque('Hechas en los últimos 30 días', hechas, 'Todavía no hay intervenciones hechas.')}</div>`;
  $('cirnueva').onclick = () => editarCirugia(null);
  caja.querySelectorAll('[data-cir]').forEach(b => b.onclick = () => verCirugia(b.dataset.cir));
}

async function editarCirugia(c) {
  const e = c || { fecha: isoMas(hoyISO(), 1), origen: 'deposito', asistente_id: PERFIL.id };
  if (!COMS.length) { try { await cargarComerciales(); } catch (x) {} }
  const gente = COMS.some(u => u.id === PERFIL.id) ? COMS : [{ id: PERFIL.id, nombre: PERFIL.nombre }].concat(COMS);
  $('dbody').innerHTML = `<div class="fh"><div><h2>${c ? 'Cambiar la intervención' : 'Nueva intervención'}</h2><div class="sm">Sale también en la Agenda de quien asiste</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2"><div><label for="cirf">Fecha</label><input id="cirf" type="date" value="${esc(e.fecha || '')}"></div>
      <div><label for="cirh">Hora</label><input id="cirh" type="time" value="${esc(cirHora(e))}"></div></div>
    <label>Centro</label><div id="cirhos"></div>
    <label>Responsable</label><div id="circir"></div>
    <div class="g2"><div><label for="cirp">Procedimiento</label><input id="cirp" value="${esc(e.procedimiento || '')}" placeholder="p. ej. Prótesis de rodilla"></div>
      <div><label for="cirq">Sala</label><input id="cirq" value="${esc(e.quirofano || '')}" placeholder="p. ej. Q3"></div></div>
    <div class="g2"><div><label for="cira">Asiste</label><select id="cira">${gente.map(u => `<option value="${u.id}" ${u.id === e.asistente_id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}</select></div>
      <div><label for="cirref">Referencia ${TT('paciente', 's', 'del', 'l', 'l')}</label><input id="cirref" maxlength="60" value="${esc(e.referencia_caso || '')}" placeholder="Código del centro, sin datos de salud"></div></div>
    <label>De dónde sale el material</label>
    <div class="segs" id="cirori" role="group" aria-label="De dónde sale el material">${CIR_ORIGEN.map(([k, t]) => `<button type="button" data-o="${k}" class="${k === e.origen ? 'on' : ''}" aria-pressed="${k === e.origen}">${t}</button>`).join('')}</div>
    <label for="cirn">Nota</label><textarea id="cirn" rows="2">${esc(e.nota || '')}</textarea>
    <div class="acts" style="justify-content:flex-end">${c ? '<button type="button" class="btn sec peligro" id="ciranular">Anular</button>' : ''}
      <button type="button" class="btn sec" data-cerrar>Cancelar</button><button type="button" class="btn" id="cirok">${c ? 'Guardar' : 'Programar'}</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  const sel = { hos: c ? { id: c.hospital_id, nombre: c.hospital } : null, cir: c ? { id: c.cirujano_id, nombre: c.cirujano, especialidad: c.especialidad } : null };
  selectorMedico($('cirhos'), { valor: sel.hos, placeholder: 'Busca el centro o la clínica', alElegir: m => { sel.hos = m; } });
  selectorMedico($('circir'), { valor: sel.cir, placeholder: 'Busca al responsable', alElegir: m => { sel.cir = m; } });
  $('cirori').querySelectorAll('[data-o]').forEach(b => b.onclick = () => $('cirori').querySelectorAll('[data-o]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }));
  const guardar = async (estado, boton) => {
    if (!$('cirf').value || !sel.hos || !sel.cir) { toast('Elige la fecha, el centro y el responsable', true); return; }
    boton.disabled = true;
    const { data: r, error } = await db.rpc('cirugia_guardar', { p: { id: c ? c.id : null, fecha: $('cirf').value, hora: $('cirh').value || null,
      hospital_id: sel.hos.id, cirujano_id: sel.cir.id, procedimiento: $('cirp').value, quirofano: $('cirq').value, asistente_id: $('cira').value,
      origen: $('cirori').querySelector('.on').dataset.o, referencia_caso: $('cirref').value, nota: $('cirn').value, estado } });
    boton.disabled = false;
    if (error || !r || r.ok === false) { toast(error ? 'No se ha podido guardar: ' + error.message : cirError(r), true); return; }
    toast(estado === 'Anulada' ? 'Intervención anulada' : c ? 'Intervención guardada' : 'Intervención programada'); invalidarCache();
    if (estado === 'Anulada') $('dlg').close(); else verCirugia(r.id);
  };
  $('cirok').onclick = ev => guardar('Programada', ev.target);
  if ($('ciranular')) $('ciranular').onclick = async ev => {
    if (!await preguntar('La cita de la Agenda queda descartada.', { titulo: '¿Anular la intervención?', ok: 'Anular', peligro: true })) return;
    guardar('Anulada', ev.target);
  };
}

async function verCirugia(id, aviso) {
  const { data: d, error } = await db.rpc('cirugia_detalle', { p_id: id });
  if (error || !d) { toast('No se ha encontrado la intervención', true); return; }
  const c = d.cirugia, prog = c.estado === 'Programada', st = d.stock || [], us = d.consumos || [];
  const repo = c.estado !== 'Hecha' ? null : c.repuesta_en ? 'repuesta' : new Date(c.reposicion_limite) < new Date() ? 'vencida' : 'pendiente';
  $('dbody').innerHTML = `<div class="fh"><div><h2>${esc(c.procedimiento || 'Intervención')}</h2>
      <div class="sm">${esc(fechaLarga(new Date(c.fecha + 'T12:00:00')))}${c.hora ? ' · ' + esc(cirHora(c)) : ''} · ${esc(d.hospital)}${c.quirofano ? ' · ' + esc(c.quirofano) : ''}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    ${aviso || ''}
    <div class="cirdat"><span>Responsable</span><b><button type="button" class="lnk" data-cfi="${c.cirujano_id}">${esc(d.cirujano)}</button>${d.especialidad ? ` <span class="sm">· ${esc(d.especialidad)}</span>` : ''}</b>
      <span>Centro</span><b><button type="button" class="lnk" data-cfi="${c.hospital_id}">${esc(d.hospital)}</button></b>
      <span>Asiste</span><b>${esc(d.asistente || '—')}</b>
      <span>Material</span><b>${esc(d.almacen || (CIR_ORIGEN.find(x => x[0] === c.origen) || [, ''])[1])}</b>
      ${c.referencia_caso ? `<span>${TT('paciente', 's', '', 'l', 'C')}</span><b>Ref. ${esc(c.referencia_caso)}</b>` : ''}
      <span>Estado</span><b>${cirEstado(c)} ${cirRepo(Object.assign({}, c, { reposicion: repo }))}</b></div>
    ${c.nota ? `<p class="sm">${esc(c.nota)}</p>` : ''}
    ${c.estado === 'Hecha' && !c.pedido_id ? `<div class="banda-aviso cirsinped">Falta el pedido al centro con lo usado. <button type="button" class="btn sec" id="cirhacerped">Crear el pedido</button></div>` : ''}
    ${prog && d.puede ? `<div id="cirusar"></div>` : ''}
    ${us.length ? `<h3>Lo usado</h3><div class="deptab"><div class="deph cirh"><span>Producto</span><span>Lote</span><span>Nº de serie</span><span>Uds</span></div>
      ${us.map(x => `<div class="depf cirh"><span>${esc(x.producto)}</span><span>${esc(x.numero_lote || 'Sin lote')}</span><span>${esc(x.serie || '—')}</span><b>${num(x.unidades)}</b></div>`).join('')}</div>` : ''}
    <div class="acts" style="justify-content:flex-end">${c.pedido_id ? '<button type="button" class="btn sec" id="cirped">Ver el pedido</button>' : ''}
      ${repo && repo !== 'repuesta' && d.puede ? '<button type="button" class="btn" id="cirrepo">Reponer ahora</button>' : ''}
      ${prog && d.puede ? '<button type="button" class="btn sec" id="cireditar">Cambiar</button>' : ''}<button type="button" class="btn sec" data-cerrar>Cerrar</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  $('dbody').querySelectorAll('[data-cfi]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.cfi); });
  if ($('cirped')) $('cirped').onclick = () => verPedido(c.pedido_id);
  if ($('cirhacerped')) $('cirhacerped').onclick = async ev => {
    ev.target.disabled = true;
    const { data: r } = await db.rpc('cirugia_pedido', { p_id: id });
    if (!r || r.ok === false) { ev.target.disabled = false; toast(r && r.error === 'pedido' ? 'No tienes permiso para crear pedidos: pídeselo a quien lleve los pedidos' : cirError(r), true); return; }
    toast('Pedido en borrador creado'); verCirugia(id);
  };
  if ($('cireditar')) $('cireditar').onclick = () => editarCirugia(Object.assign({}, c, { hospital: d.hospital, cirujano: d.cirujano, especialidad: d.especialidad }));
  if ($('cirrepo')) $('cirrepo').onclick = async ev => {
    ev.target.disabled = true;
    const { data: r } = await db.rpc('cirugia_reponer', { p_id: id });
    if (!r || r.ok === false) { ev.target.disabled = false; toast(r && r.error === 'sin_stock' ? 'No hay bastante en el almacén central para reponerlo todo' : cirError(r), true); return; }
    toast(r.a_tiempo === false ? 'Repuesto (fuera del plazo de 48 horas)' : 'Repuesto lo usado'); verCirugia(id);
  };
  if ($('cirusar')) pintarUsoCirugia(c, st);
}

function pintarUsoCirugia(c, st) {
  const box = $('cirusar');
  if (!st.length) { box.innerHTML = `<div class="banda-aviso">No hay material en ${c.origen === 'deposito' ? 'el depósito del centro' : 'el almacén de quien asiste'}: repón antes de registrar lo usado.</div>`; return; }
  box.innerHTML = `<details class="cirdet"><summary class="btn">Registrar lo usado</summary><div class="depbox">
    <span class="sm">Escribe las unidades usadas de cada lote. Si llevan número de serie, apúntalo en cada unidad.</span>
    <div class="cirlin">${st.map((x, i) => `<div class="cirl" data-ci="${i}"><label><span>${esc(x.nombre)} <span class="sm">· ${esc(x.numero_lote || 'sin lote')}${x.caducidad ? ' · cad. ' + fechaCorta(x.caducidad) : ''} · hay ${num(x.unidades)}</span></span>
      <input type="number" min="0" max="${x.unidades}" step="1" data-cu="${i}" placeholder="0" aria-label="Usadas de ${esc(x.nombre)}"></label><div class="cirser" data-cs="${i}"></div></div>`).join('')}</div>
    <label for="cirref2">Referencia ${TT('paciente', 's', 'del', 'l', 'l')}</label><input id="cirref2" maxlength="60" value="${esc(c.referencia_caso || '')}" placeholder="Código del centro, sin datos de salud">
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn" id="cirusok">Guardar lo usado</button></div></div></details>`;
  box.querySelectorAll('[data-cu]').forEach(i => i.oninput = () => {
    const k = i.dataset.cu, n = Math.min(+i.max, Math.max(0, Math.floor(+i.value || 0))), s = box.querySelector(`[data-cs="${k}"]`);
    const ya = [...s.querySelectorAll('input')].map(x => x.value);
    s.innerHTML = Array.from({ length: Math.min(n, 30) }, (_, j) => `<input data-cser="${k}" maxlength="120" value="${esc(ya[j] || '')}" placeholder="Nº de serie de la unidad ${j + 1}" aria-label="Número de serie de la unidad ${j + 1}">`).join('');
  });
  $('cirusok').onclick = async ev => {
    const items = st.map((x, i) => ({ producto_id: x.producto_id, lote_id: x.lote_id, unidades: Math.max(0, Math.floor(+box.querySelector(`[data-cu="${i}"]`).value || 0)),
      series: [...box.querySelectorAll(`[data-cser="${i}"]`)].map(y => y.value.trim()).filter(Boolean), max: x.unidades })).filter(x => x.unidades > 0);
    if (!items.length) { toast('Escribe lo que se ha usado', true); return; }
    if (items.some(x => x.unidades > x.max)) { toast('No se puede usar más de lo que hay', true); return; }
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('cirugia_consumo', { p: { id: c.id, referencia_caso: $('cirref2').value, items: items.map(({ max, ...x }) => x) } });
    ev.target.disabled = false;
    if (error || !r || r.ok === false) { toast(error ? 'No se ha podido guardar: ' + error.message : cirError(r), true); return; }
    toast('Guardado lo usado'); invalidarCache();
    verCirugia(c.id, `<div class="banda-ok depaviso">${r.pedido_id ? 'Queda un pedido en borrador al centro para confirmarlo y la' : 'Guardado lo usado. Queda la'} reposición pendiente: hay 48 horas para reponer lo usado.</div>`);
  };
}
