// pantallas/eventos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function detalleEvento(d) {
  if (!d || typeof d !== 'object') return d ? String(d) : '—';
  const partes = Object.keys(d).filter(k => d[k] != null && d[k] !== '' && k !== 'valor' && !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(d[k]))).map(k => {
    const v = d[k]; const n = NOMBRES_DETALLE[k] || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));
    return `${n}: ${typeof v === 'number' && /importe|total/.test(k) ? eur(v) : textoValor(v)}`;
  });
  return partes.join(' · ').slice(0, 160) || '—';
}

function menuEventos() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="eventos"]');
  if (!b) { const tras = nav.querySelector('[data-t="directorio"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', '<button data-t="eventos" aria-selected="false">Eventos</button>'); b = nav.querySelector('[data-t="eventos"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('directorio')));
}

async function pintarEventos() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const { data, error } = await db.from('eventos').select('id,titulo,tipo,fecha,hora,lugar,en_linea,creado_por,eventos_asistentes(id,estado,inscripcion,viaje,comida,honorarios)').order('fecha', { ascending: false }).limit(200);
  if (!$('cfgcuerpo') || TAB !== 'eventos') return;
  if (error) { caja.innerHTML = `<div class="vacio">No se han podido cargar los eventos.</div>`; return; }
  const hoy = hoyISO(), l = data || [], prox = l.filter(e => e.fecha >= hoy).reverse(), pas = l.filter(e => e.fecha < hoy);
  const fila = e => { const as = e.eventos_asistentes || [], tot = as.reduce((s, a) => s + evTotal(a), 0);
    return `<button type="button" class="item evrow" data-ev="${e.id}"><span class="tx"><b>${esc(e.titulo)}</b>
      <span class="sm">${esc(fechaLarga(new Date(e.fecha + 'T12:00:00')))}${e.hora ? ' · ' + esc(String(e.hora).slice(0, 5)) : ''}${e.tipo ? ' · ' + esc(e.tipo) : ''} · ${e.en_linea ? 'En línea' : esc(e.lugar || 'Sin lugar')} · ${as.length === 1 ? '1 asistente' : as.length + ' asistentes'}</span></span>
      ${tot ? `<span class="evtot">${eur(tot)}</span>` : ''}</button>`; };
  caja.innerHTML = `<div class="evpag"><div class="evcab"><button type="button" class="btn" id="evnuevo">+ Nuevo evento</button></div>
    <section class="card evbloque"><h2>Próximos</h2>${prox.length ? `<div class="lista">${prox.map(fila).join('')}</div>` : '<div class="vacio vlinea">No hay eventos próximos.</div>'}</section>
    <section class="card evbloque"><h2>Pasados</h2>${pas.length ? `<div class="lista">${pas.slice(0, 50).map(fila).join('')}</div>` : '<div class="vacio vlinea">Todavía no hay eventos pasados.</div>'}</section></div>`;
  $('evnuevo').onclick = () => editarEvento(null);
  caja.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => verEvento(b.dataset.ev));
}

function editarEvento(ev) {
  const e = ev || { fecha: hoyISO(), tipo: 'Taller', en_linea: false };
  $('dbody').innerHTML = `<div class="fh"><div><h2>${ev ? 'Editar evento' : 'Nuevo evento'}</h2><div class="sm">Taller, curso, congreso, webinar…</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="evt">Título</label><input id="evt" value="${esc(e.titulo || '')}" placeholder="p. ej. Taller de manejo del dolor articular">
    <div class="g2"><div><label for="evtipo">Tipo</label><select id="evtipo">${EV_TIPOS.map(t => `<option ${t === e.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div><label for="evf">Fecha</label><input id="evf" type="date" value="${esc(e.fecha || '')}"></div></div>
    <div class="g2"><div><label for="evh">Hora</label><input id="evh" type="time" value="${esc(e.hora ? String(e.hora).slice(0, 5) : '')}"></div>
      <div><label for="evl">Lugar</label><input id="evl" value="${esc(e.lugar || '')}" placeholder="Hotel, centro, sede…"></div></div>
    <label class="opt"><input type="checkbox" id="evon" ${e.en_linea ? 'checked' : ''}> En línea</label>
    <label for="evn">Nota</label><textarea id="evn" rows="3">${esc(e.nota || '')}</textarea>
    <div class="acts" style="justify-content:flex-end">${ev && (ev.creado_por === PERFIL.id || puede('administrar')) ? '<button type="button" class="btn sec peligro" id="evborrar">Borrar</button>' : ''}
      <button type="button" class="btn sec" data-cerrar>Cancelar</button><button type="button" class="btn" id="evok">${ev ? 'Guardar' : 'Crear evento'}</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  $('evok').onclick = async b => {
    const titulo = $('evt').value.trim(); if (!titulo) { toast('Escribe el título', true); return; }
    if (!$('evf').value) { toast('Elige la fecha', true); return; }
    const fila = { titulo, tipo: $('evtipo').value, fecha: $('evf').value, hora: $('evh').value || null, lugar: $('evl').value.trim() || null, en_linea: $('evon').checked, nota: $('evn').value.trim() || null };
    b.target.disabled = true;
    const r = ev ? await db.from('eventos').update(fila).eq('id', ev.id).select('id').single() : await db.from('eventos').insert(fila).select('id').single();
    b.target.disabled = false;
    if (r.error) { toast('No se ha podido guardar: ' + r.error.message, true); return; }
    toast(ev ? 'Evento guardado' : 'Evento creado'); verEvento(r.data.id); if (TAB === 'eventos') pintarEventos();
  };
  if ($('evborrar')) $('evborrar').onclick = async () => {
    if (!await preguntar('El evento desaparece con su lista de asistentes y lo apuntado a cada uno.', { titulo: '¿Borrar el evento?', ok: 'Borrar', peligro: true })) return;
    const { error } = await db.from('eventos').delete().eq('id', ev.id);
    if (error) { toast('No se ha podido borrar', true); return; }
    $('dlg').close(); toast('Evento borrado'); if (TAB === 'eventos') pintarEventos();
  };
}

async function verEvento(id) {
  const [{ data: e }, { data: as }] = await Promise.all([db.from('eventos').select('*').eq('id', id).maybeSingle(),
    db.from('eventos_asistentes').select('id,cuenta_id,estado,inscripcion,viaje,comida,honorarios,cuentas(nombre,especialidad)').eq('evento_id', id).order('creado_en')]);
  if (!e) { toast('No se ha encontrado el evento', true); return; }
  const l = as || [], edita = e.creado_por === PERFIL.id || puede('administrar');
  const tot = () => l.reduce((s, a) => s + evTotal(a), 0);
  $('dbody').innerHTML = `<div class="fh"><div><h2>${esc(e.titulo)}</h2><div class="sm">${esc(fechaLarga(new Date(e.fecha + 'T12:00:00')))}${e.hora ? ' · ' + esc(String(e.hora).slice(0, 5)) : ''}${e.tipo ? ' · ' + esc(e.tipo) : ''} · ${e.en_linea ? 'En línea' : esc(e.lugar || 'Sin lugar')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    ${e.nota ? `<p class="sm">${esc(e.nota)}</p>` : ''}
    <div class="evascab"><h3>Asistentes · ${l.length}</h3><button type="button" class="btn sec" id="evanadir">+ Añadir</button></div>
    <div id="evsel"></div>
    <div class="evas" id="evas">${l.length ? l.map(a => `<div class="evasf" data-as="${a.id}">
        <div class="evasn"><b>${esc((a.cuentas || {}).nombre || '')}</b><span class="sm">${esc((a.cuentas || {}).especialidad || '')}</span></div>
        <select data-asest aria-label="Estado">${EV_ESTADOS.map(s => `<option ${s === a.estado ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <button type="button" class="x" data-asq aria-label="Quitar">✕</button>
        <div class="evimp">${EV_CONCEPTOS.map(([k, t]) => `<label><span>${t}</span><input type="number" min="0" step="0.01" data-asimp="${k}" value="${+a[k] ? +a[k] : ''}" placeholder="0"></label>`).join('')}</div></div>`).join('') : '<div class="vacio vlinea">Todavía no hay asistentes: añade los invitados.</div>'}</div>
    <div class="evpie"><span>Gastos de este evento</span><b id="evtotal">${eur(tot())}</b></div>
    <p class="sm">Las inscripciones y gastos de cada asistente (inscripción, viaje y alojamiento, comidas y honorarios) salen en el informe anual de gastos. Las comidas no deberían pasar de ${EV_COMIDA_MAX} € por persona.</p>
    <div class="acts" style="justify-content:flex-end">${edita ? '<button type="button" class="btn sec" id="eveditar">Editar evento</button>' : ''}<button type="button" class="btn" data-cerrar>Hecho</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  if ($('eveditar')) $('eveditar').onclick = () => editarEvento(e);
  $('evanadir').onclick = () => {
    $('evanadir').disabled = true;
    selectorMedico($('evsel'), { alElegir: async m => {
      if (!m) return;
      const { error } = await db.from('eventos_asistentes').insert({ evento_id: id, cuenta_id: m.id });
      if (error) { toast(/duplicate|unique/i.test(error.message) ? `${m.nombre} ya está en este evento` : 'No se ha podido añadir: ' + error.message, true); verEvento(id); return; }
      toast(`${m.nombre} añadido`); verEvento(id);
    } });
    const i = $('evsel').querySelector('input'); if (i) i.focus();
  };
  $('evas').querySelectorAll('[data-as]').forEach(f => {
    const a = l.find(x => x.id === f.dataset.as);
    f.querySelector('[data-asest]').onchange = async ev => {
      const { error } = await db.from('eventos_asistentes').update({ estado: ev.target.value }).eq('id', a.id);
      if (error) { toast('No se ha podido guardar', true); ev.target.value = a.estado; return; }
      a.estado = ev.target.value;
    };
    f.querySelectorAll('[data-asimp]').forEach(i => i.onchange = async () => {
      const k = i.dataset.asimp, v = Math.max(0, Math.round((+i.value || 0) * 100) / 100);
      const { error } = await db.from('eventos_asistentes').update({ [k]: v }).eq('id', a.id);
      if (error) { toast('No se ha podido guardar', true); i.value = +a[k] || ''; return; }
      a[k] = v; $('evtotal').textContent = eur(tot());
      i.closest('label').classList.toggle('evaviso', k === 'comida' && v > EV_COMIDA_MAX);
      if (k === 'comida' && v > EV_COMIDA_MAX) toast(`La comida pasa de ${EV_COMIDA_MAX} € por persona: revisa que cumpla el código de buenas prácticas`, true);
    });
    const c = f.querySelector('[data-asimp="comida"]'); if (c && +a.comida > EV_COMIDA_MAX) c.closest('label').classList.add('evaviso');
    f.querySelector('[data-asq]').onclick = async () => {
      if (!await preguntar(`${(a.cuentas || {}).nombre || ''} deja de estar en este evento, con lo apuntado.`, { titulo: '¿Quitar de la lista?', ok: 'Quitar', peligro: true })) return;
      const { error } = await db.from('eventos_asistentes').delete().eq('id', a.id);
      if (error) { toast('No se ha podido quitar', true); return; }
      verEvento(id);
    };
  });
}

async function pintarTransparencia(anio) {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const actual = +hoyISO().slice(0, 4); anio = anio || actual - 1;
  const { data: r } = await db.rpc('transparencia_anual', { p_anio: anio });
  if (!$('cfgcuerpo') || TAB !== 'eventos') return;
  const l = (r && r.filas) || [];
  const suma = k => l.reduce((s, x) => s + (+x[k] || 0), 0);
  caja.innerHTML = `<div class="evpag"><div class="evcab"><label for="trano">Año</label><select id="trano">${[actual, actual - 1, actual - 2, actual - 3].map(y => `<option ${y === anio ? 'selected' : ''}>${y}</option>`).join('')}</select>
      ${l.length ? '<button type="button" class="btn sec" id="trcsv">Descargar (CSV)</button>' : ''}</div>
    <p class="sm">Los gastos de eventos de cada ${TT('medico', 's', '', 'l', 'l')} durante el año, por concepto (las asistencias marcadas «No asistió» no cuentan). Es la base del informe anual de gastos de los códigos de Farmaindustria y Fenin: revísalo con vuestro responsable de cumplimiento antes de publicarlo.</p>
    ${l.length ? `<div class="dgrid-wrap"><table class="trtabla"><thead><tr><th>${TT('medico', 's', '', 'l', 'C')}</th><th>Eventos</th>${EV_CONCEPTOS.map(([, t]) => `<th>${t}</th>`).join('')}<th>Total</th></tr></thead>
      <tbody>${l.map(x => `<tr><td><b>${esc(x.nombre)}</b>${x.especialidad ? `<span class="sm"> · ${esc(x.especialidad)}</span>` : ''}</td><td>${x.eventos}</td>${EV_CONCEPTOS.map(([k]) => `<td>${eur(+x[k] || 0)}</td>`).join('')}<td><b>${eur(+x.total || 0)}</b></td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td></td>${EV_CONCEPTOS.map(([k]) => `<td>${eur(suma(k))}</td>`).join('')}<td><b>${eur(suma('total'))}</b></td></tr></tfoot></table></div>`
      : `<div class="vacio vlinea">En ${anio} no hay gastos de eventos apuntados.</div>`}</div>`;
  $('trano').onchange = e => pintarTransparencia(+e.target.value);
  if ($('trcsv')) $('trcsv').onclick = () => {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"', n = v => String(+v || 0).replace('.', ',');
    const csv = [[TT('medico', 's', '', 'l', 'C'), 'Código', TT('especialidad', 's', '', 'l', 'C'), 'Eventos', ...EV_CONCEPTOS.map(([, t]) => t), 'Total'].map(q).join(';')]
      .concat(l.map(x => [q(x.nombre), q(x.codigo), q(x.especialidad), x.eventos, ...EV_CONCEPTOS.map(([k]) => n(x[k])), n(x.total)].join(';'))).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `informe de gastos-${anio}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
}
