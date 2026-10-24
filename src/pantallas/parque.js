// pantallas/parque.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function menuParque() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="parque"]');
  if (!b) { const tras = nav.querySelector('[data-t="concursos"]') || nav.querySelector('[data-t="ventas"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', '<button data-t="parque" aria-selected="false">Parque instalado</button>'); b = nav.querySelector('[data-t="parque"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('ventas')));
}

async function pintarParque() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data, error }, { data: aj }] = await Promise.all([
    db.from('equipos').select('id,serie,ubicacion,instalado,contrato,contrato_fin,garantia_hasta,proxima_revision,estado,cuenta_id,cuentas(nombre),productos(nombre)').order('creado_en', { ascending: false }).limit(500),
    db.from('ajustes').select('valor').eq('clave', 'avisos_vencimiento').maybeSingle()]);
  if (!$('cfgcuerpo') || TAB !== 'parque') return;
  if (error) { caja.innerHTML = '<div class="vacio">No se ha podido cargar el parque instalado.</div>'; return; }
  if (aj && aj.valor && Array.isArray(aj.valor.dias)) CON_AVISOS = aj.valor.dias.map(Number).filter(n => n > 0);
  const l = data || [], act = l.filter(e => e.estado === 'Instalado'), hoy30 = isoMas(hoyISO(), 30), tope = Math.max(...CON_AVISOS, 0);
  const rev = act.filter(e => e.proxima_revision && e.proxima_revision <= hoy30).sort((a, b) => a.proxima_revision.localeCompare(b.proxima_revision));
  const ven = act.filter(e => { const d = eqDias(eqVence(e)); return d != null && d <= tope; }).sort((a, b) => String(eqVence(a)).localeCompare(String(eqVence(b))));
  const qn = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const todos = l.filter(e => !EQ_Q || qn([e.serie, (e.productos || {}).nombre, (e.cuentas || {}).nombre, e.ubicacion].join(' ')).includes(qn(EQ_Q)));
  const fila = e => `<button type="button" class="item conrow" data-eq="${e.id}"><span class="tx"><b>${esc((e.productos || {}).nombre || 'Equipo')}</b>
      <span class="sm">${esc([e.serie ? 'nº ' + e.serie : '', (e.cuentas || {}).nombre, e.ubicacion, e.contrato].filter(Boolean).join(' · '))} · desde el ${fechaCorta(e.instalado)}</span></span>
    <span class="cirest">${eqRevPill(e)}${eqVencePill(e)}</span></button>`;
  const bloque = (t, l2, vacio) => `<section class="card cirbloque"><h2>${t}</h2>${l2.length ? `<div class="lista">${l2.map(fila).join('')}</div>` : `<div class="vacio vlinea">${vacio}</div>`}</section>`;
  const yaQ = $('eqq') && document.activeElement === $('eqq');
  caja.innerHTML = `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="eqnuevo">+ Equipo</button></div>
    ${rev.length ? bloque('Revisiones en los próximos 30 días', rev, '') : ''}
    ${ven.length ? bloque('Contratos y garantías que vencen', ven, '') : ''}
    <section class="card cirbloque"><div class="cicbcab"><h2>Todos los equipos · ${num(l.length)}</h2><input id="eqq" type="search" placeholder="Nº de serie, equipo, centro…" value="${esc(EQ_Q)}" aria-label="Buscar un equipo"></div>
      ${todos.length ? `<div class="lista">${todos.map(fila).join('')}</div>` : `<div class="vacio vlinea">${l.length ? 'Ningún equipo con esa búsqueda.' : 'Todavía no hay equipos instalados: dalos de alta aquí, en la ficha del centro o al confirmar el pedido de un producto «equipo».'}</div>`}</section></div>`;
  $('eqnuevo').onclick = () => editarEquipo(null);
  let t = null;
  $('eqq').oninput = e => { clearTimeout(t); t = setTimeout(() => { EQ_Q = e.target.value.trim(); pintarParque(); }, 300); };
  if (yaQ) { const i = $('eqq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  caja.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => verEquipo(b.dataset.eq));
}

async function editarEquipo(e, cuenta) {
  if (!PRODUCTOS.length) await cargarProductos();
  const { data: pe } = await db.from('productos').select('id,nombre,es_equipo,revision_meses').order('nombre');
  const lista = (pe || []).sort((a, b) => (b.es_equipo - a.es_equipo) || String(a.nombre).localeCompare(String(b.nombre)));
  const x = e || { instalado: hoyISO(), contrato: 'Venta', producto_id: (lista.find(p => p.es_equipo) || {}).id, revision_meses: (lista.find(p => p.es_equipo) || {}).revision_meses || 0 };
  $('dbody').innerHTML = `<div class="fh"><div><h2>${e ? 'Cambiar el equipo' : 'Nuevo equipo'}</h2><div class="sm">Dónde está instalado, su número de serie y sus condiciones</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label>Dónde está</label><div id="eqcta"></div>
    <div class="g2"><div><label for="eqp">Equipo</label><select id="eqp">${lista.map(p => `<option value="${p.id}" data-rm="${p.revision_meses || 0}" ${p.id === x.producto_id ? 'selected' : ''}>${esc(p.nombre)}${p.es_equipo ? '' : ' (no marcado como equipo)'}</option>`).join('')}</select></div>
      <div><label for="eqs">Nº de serie</label><input id="eqs" value="${esc(x.serie || '')}" maxlength="120"></div></div>
    <div class="g2"><div><label for="equ">Ubicación</label><input id="equ" value="${esc(x.ubicacion || '')}" placeholder="p. ej. Sala 2, planta 3"></div>
      <div><label for="eqi">Instalado el</label><input id="eqi" type="date" value="${esc(x.instalado || '')}"></div></div>
    <div class="g2"><div><label for="eqc">Contrato</label><select id="eqc">${EQ_CONTRATOS.map(k => `<option ${k === x.contrato ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
      <div id="eqcfw"><label for="eqcf">Fin del contrato</label><input id="eqcf" type="date" value="${esc(x.contrato_fin || '')}"></div></div>
    <div class="g2"><div><label for="eqg">Garantía hasta</label><input id="eqg" type="date" value="${esc(x.garantia_hasta || '')}"></div>
      <div><label for="eqr">Revisión cada (meses; 0 = sin revisiones)</label><input id="eqr" type="number" min="0" max="120" step="1" value="${+x.revision_meses || 0}"></div></div>
    <label for="eqn">Nota</label><textarea id="eqn" rows="2">${esc(x.nota || '')}</textarea>
    <div class="acts" style="justify-content:flex-end">${e && e.estado === 'Instalado' ? '<button type="button" class="btn sec peligro" id="eqretirar">Retirar</button>' : ''}
      <button type="button" class="btn sec" data-cerrar>Cancelar</button><button type="button" class="btn" id="eqok">${e ? 'Guardar' : 'Dar de alta'}</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  let cta = e ? { id: e.cuenta_id, nombre: (e.cuentas || {}).nombre || '' } : cuenta || null;
  selectorMedico($('eqcta'), { valor: cta, placeholder: 'Busca el centro', alElegir: m => { cta = m; } });
  const verFin = () => $('eqcfw').classList.toggle('hide', $('eqc').value === 'Venta');
  verFin(); $('eqc').onchange = verFin;
  $('eqp').onchange = () => { if (!e) $('eqr').value = $('eqp').selectedOptions[0].dataset.rm || 0; };
  const fallo = er => toast(/row-level|policy/i.test(er.message) ? 'No puedes cambiar los equipos de esta ficha' : 'No se ha podido guardar: ' + er.message, true);
  $('eqok').onclick = async ev => {
    if (!cta || !$('eqp').value) { toast('Elige dónde está y qué equipo es', true); return; }
    const fila = { cuenta_id: cta.id, producto_id: $('eqp').value, serie: $('eqs').value.trim() || null, ubicacion: $('equ').value.trim() || null,
      instalado: $('eqi').value || hoyISO(), contrato: $('eqc').value, contrato_fin: $('eqc').value === 'Venta' ? null : ($('eqcf').value || null),
      garantia_hasta: $('eqg').value || null, revision_meses: Math.min(120, Math.max(0, Math.floor(+$('eqr').value || 0))), nota: $('eqn').value.trim() || null };
    ev.target.disabled = true;
    const r = e ? await db.from('equipos').update(fila).eq('id', e.id).select('id').single() : await db.from('equipos').insert(fila).select('id').single();
    ev.target.disabled = false;
    if (r.error) { fallo(r.error); return; }
    toast(e ? 'Equipo guardado' : 'Equipo dado de alta'); invalidarCache(); verEquipo(r.data.id);
  };
  if ($('eqretirar')) $('eqretirar').onclick = async () => {
    if (!await preguntar('Queda en el historial como retirado: ya no avisa de revisiones ni vencimientos.', { titulo: '¿Retirar el equipo?', ok: 'Retirar', peligro: true })) return;
    const { error } = await db.from('equipos').update({ estado: 'Retirado' }).eq('id', e.id);
    if (error) { fallo(error); return; }
    toast('Equipo retirado'); verEquipo(e.id);
  };
}

async function verEquipo(id) {
  const [{ data: e, error }, { data: rv }] = await Promise.all([
    db.from('equipos').select('*,cuentas(nombre),productos(nombre)').eq('id', id).maybeSingle(),
    db.from('equipo_revisiones').select('id,fecha,tipo,nota,hecha_por').eq('equipo_id', id).order('fecha', { ascending: false }).limit(50)]);
  if (error || !e) { toast('No se ha encontrado el equipo', true); return; }
  const vence = eqVence(e);
  $('dbody').innerHTML = `<div class="fh"><div><h2>${esc((e.productos || {}).nombre || 'Equipo')}</h2><div class="sm">${e.serie ? 'Nº de serie ' + esc(e.serie) + ' · ' : ''}${esc((e.cuentas || {}).nombre || '')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="cirdat"><span>Dónde</span><b><button type="button" class="lnk" data-cfi="${e.cuenta_id}">${esc((e.cuentas || {}).nombre || '')}</button>${e.ubicacion ? ' · ' + esc(e.ubicacion) : ''}</b>
      <span>Instalado</span><b>${esc(fechaLarga(new Date(e.instalado + 'T12:00:00')))}</b>
      <span>Contrato</span><b>${esc(e.contrato)}${e.contrato !== 'Venta' && e.contrato_fin ? ' hasta el ' + fechaCorta(e.contrato_fin) : ''}</b>
      ${e.garantia_hasta ? `<span>Garantía</span><b>hasta el ${fechaCorta(e.garantia_hasta)}</b>` : ''}
      <span>Revisiones</span><b>${e.revision_meses ? `cada ${e.revision_meses} ${e.revision_meses === 1 ? 'mes' : 'meses'}` : 'sin revisiones periódicas'}</b>
      <span>Estado</span><b>${eqRevPill(e)} ${eqVencePill(e)}${e.estado === 'Instalado' && !e.proxima_revision && !vence ? '<span class="pill p-est">Instalado</span>' : ''}</b></div>
    ${e.nota ? `<p class="sm">${esc(e.nota)}</p>` : ''}
    <div class="evascab"><h3>Revisiones · ${(rv || []).length}</h3>${e.estado === 'Instalado' ? '<button type="button" class="btn sec" id="eqrevmas">Apuntar revisión</button>' : ''}</div>
    <div id="eqrevf"></div>
    ${(rv || []).length ? `<div class="lista">${rv.map(x => `<div class="fmrow"><span><b>${fechaCorta(x.fecha)}</b> · ${esc(x.tipo)}${x.nota ? `<span class="sm"> · ${esc(x.nota)}</span>` : ''}</span><button type="button" class="x" data-rvq="${x.id}" aria-label="Borrar la revisión">✕</button></div>`).join('')}</div>`
      : '<div class="vacio vlinea">Todavía no hay revisiones apuntadas.</div>'}
    <div class="acts" style="justify-content:flex-end">${e.estado === 'Instalado' && e.revision_meses ? '<button type="button" class="btn sec" id="eqagenda">Programar en la agenda</button>' : ''}
      <button type="button" class="btn sec" id="eqeditar">Cambiar</button><button type="button" class="btn" data-cerrar>Hecho</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  const fallo = er => toast(/row-level|policy/i.test(er.message) ? 'No puedes cambiar los equipos de esta ficha' : 'No se ha podido guardar: ' + er.message, true);
  $('dbody').querySelectorAll('[data-cfi]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.cfi); });
  $('eqeditar').onclick = () => editarEquipo(e);
  if ($('eqagenda')) $('eqagenda').onclick = () => nuevaCita(e.cuenta_id, e.proxima_revision && e.proxima_revision > hoyISO() ? e.proxima_revision : hoyISO());
  if ($('eqrevmas')) $('eqrevmas').onclick = () => {
    $('eqrevf').innerHTML = `<div class="depbox"><div class="cong3"><div><label for="eqrf">Fecha</label><input id="eqrf" type="date" value="${hoyISO()}"></div>
        <div><label for="eqrt">Tipo</label><select id="eqrt">${EQ_REV.map(k => `<option>${k}</option>`).join('')}</select></div>
        <div><label for="eqrn">Nota</label><input id="eqrn" maxlength="300" placeholder="Qué se hizo"></div></div>
      <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="eqrcanc">Cancelar</button><button type="button" class="btn" id="eqrok">Apuntar</button></div></div>`;
    $('eqrcanc').onclick = () => { $('eqrevf').innerHTML = ''; };
    $('eqrok').onclick = async ev => {
      ev.target.disabled = true;
      const { error: er } = await db.from('equipo_revisiones').insert({ equipo_id: id, fecha: $('eqrf').value || hoyISO(), tipo: $('eqrt').value, nota: $('eqrn').value.trim() || null });
      ev.target.disabled = false;
      if (er) { fallo(er); return; }
      toast('Revisión apuntada'); verEquipo(id);
    };
  };
  $('dbody').querySelectorAll('[data-rvq]').forEach(b => b.onclick = async () => {
    if (!await preguntar('La revisión desaparece del historial del equipo.', { titulo: '¿Borrar la revisión?', ok: 'Borrar', peligro: true })) return;
    const { error: er } = await db.from('equipo_revisiones').delete().eq('id', b.dataset.rvq);
    if (er) { fallo(er); return; }
    verEquipo(id);
  });
}

const EQ_REV = ['Preventiva', 'Correctiva', 'Instalación'];

const eqVence = e => e.contrato !== 'Venta' ? e.contrato_fin : e.garantia_hasta;

const eqDias = f => f ? Math.round((new Date(f + 'T12:00:00') - new Date(hoyISO() + 'T12:00:00')) / 864e5) : null;

const eqRevPill = e => { const d = eqDias(e.proxima_revision); if (e.estado === 'Retirado') return '<span class="pill p-anu">Retirado</span>';
  return d == null ? '' : d < 0 ? `<span class="pill p-urg">Revisión pasada (${fechaCorta(e.proxima_revision)})</span>` : d <= 30 ? `<span class="pill p-warn">Revisar el ${fechaCorta(e.proxima_revision)}</span>` : `<span class="pill p-per">Próxima revisión ${fechaCorta(e.proxima_revision)}</span>`; };

const eqVencePill = e => { const f = eqVence(e), d = eqDias(f); if (d == null || e.estado === 'Retirado') return '';
  const que = e.contrato !== 'Venta' ? 'Contrato' : 'Garantía';
  return d < 0 ? `<span class="pill p-anu">${que} vencido</span>` : d <= Math.max(...CON_AVISOS, 0) ? `<span class="pill p-urg">${que}: ${d === 0 ? 'vence hoy' : `vence en ${num(d)} ${d === 1 ? 'día' : 'días'}`}</span>` : ''; };

let EQ_Q = '';

async function pintarEquipoBase() {
  $('agcuerpo').innerHTML = `<div class="semhead"><h2 style="padding:0">Equipo y cumplimiento</h2>
      ${puede('administrar') ? '<button class="btn sec" id="eqfrec">⚙ Frecuencia objetivo</button>' : ''}</div>
    <div class="filtros" style="border:0;padding:4px 16px 10px"><div id="eqper"></div></div>
    <div id="eqtabla"></div>`;
  if ($('eqfrec')) $('eqfrec').onclick = editorFrecuencia;
  const pinta = async () => {
    cargando($('eqtabla'), 'Calculando…');
    const r = $('eqper').__rango();
    const { data, error } = await RPC_ORIG('supervision_equipo', { p_desde: r.desde || '2000-01-01', p_hasta: r.hasta || isoMas(hoyISO(), 365) });
    if (error) { $('eqtabla').innerHTML = `<div class="vacio">${esc(error.message)}</div>`; return; }
    const l = data || [];
    const pct = x => { const base = x.visitadas + x.no_estaba + x.aplazadas + x.sin_hacer; return base ? Math.round(x.visitadas / base * 100) : null; };
    $('eqtabla').innerHTML = l.length ? `<div class="dgrid-wrap"><div class="dgrid eq">
      <div class="dh"><span>Persona</span><span class="num">Cartera</span><span class="num">Citas</span><span class="num">Visitadas</span>
        <span class="num">No estaba</span><span class="num">Aplazadas</span><span class="num">Sin hacer</span><span>Cumplimiento</span>
        <span class="num">${TT('visita', 'p', '', 'l', 'C')}</span><span class="num">Les toca</span></div>
      ${l.map(x => { const p = pct(x); return `<button class="dr" data-eqver="${x.id}" title="Ver su agenda">
        <span><b>${esc(x.nombre)}</b><span class="sm">${esc(x.rol)}</span></span>
        <span class="num">${num(x.cartera)}</span><span class="num">${num(x.citas)}</span>
        <span class="num"><b style="color:var(--ok)">${num(x.visitadas)}</b></span><span class="num">${num(x.no_estaba)}</span>
        <span class="num">${num(x.aplazadas)}</span><span class="num" style="${x.sin_hacer ? 'color:var(--warn);font-weight:700' : ''}">${num(x.sin_hacer)}</span>
        <span>${p == null ? '<span class="vac">—</span>' : `<span class="barra"><i style="width:${p}%;${p < 60 ? 'background:var(--warn)' : ''}"></i><em>${p}%</em></span>`}</span>
        <span class="num">${num(x.visitas)}</span>
        <span class="num" style="${x.atrasados ? 'color:var(--warn);font-weight:700' : ''}">${num(x.atrasados)}</span></button>`; }).join('')}
    </div></div>
    <p class="sm" style="padding:10px 16px 14px"><b>Cumplimiento</b> = visitadas sobre las citas de días ya pasados (visitadas, no estaba, aplazadas y sin hacer).
      <b>Les toca</b> = ${TT('medico', 'p', '', 'l', 'l')} de su cartera que llevan más tiempo sin ${TT('visita', 's', '', 'l', 'l')} que su frecuencia objetivo. Pulsa una persona para ver su agenda.</p>`
      : '<div class="vacio">Sin actividad en este periodo.</div>';
    $('eqtabla').querySelectorAll('[data-eqver]').forEach(b => b.onclick = () => { AG_MODO = 'semana'; AG_FECHA = hoyISO(); verAgendaDe(b.dataset.eqver); });
  };
  montarPeriodo($('eqper'), { id: 'equipo', valor: 'semana', alCambiar: pinta });
  pinta();
}
