/* ============================================================
   DLC OS 2.0 · v2.19.0 · Selectores con tarjeta, rutas en curso,
   Pacientes y Productos como módulos, comerciales en el directorio,
   cambios sin guardar y protección de datos
   ============================================================ */


/* ---------------- fechas y horas: todo el campo abre el selector ---------------- */

document.addEventListener('click', e => {
  const i = e.target.closest('input[type=date], input[type=time], input[type=month], input[type=week], input[type=datetime-local]');
  if (i && !i.disabled && !i.readOnly && typeof i.showPicker === 'function') { try { i.showPicker(); } catch (err) {} }
});

/* ---------------- protección de datos: sin descargas ---------------- */

['__dlDir', '__dlSeg', '__dlAn'].forEach(k => { try { delete window[k]; } catch (e) { window[k] = undefined; } });

/* ---------------- buscador superior: se limpia al elegir ---------------- */

document.addEventListener('click', e => {
  if (!e.target.closest('#gsug [data-gm], #gsug [data-gc], #gsug [data-gme]')) return;
  setTimeout(() => {
    $('q').value = '';
    $('q').closest('.gsearch').classList.remove('buscando');
    $('q').blur();
  }, 0);
});

/* ---------------- ventanas con cambios sin guardar ---------------- */

['dlg', 'dlg2'].forEach(id => {
  const d = $(id);
  d.addEventListener('input', e => { if (!e.target.closest('[data-nosucio]')) d.dataset.sucio = '1'; });
  d.addEventListener('change', e => { if (!e.target.closest('[data-nosucio]')) d.dataset.sucio = '1'; });
  d.addEventListener('close', () => { delete d.dataset.sucio; });
  d.addEventListener('cancel', e => { e.preventDefault(); intentarCerrar(d); });
});


/* ---------------- selector de médico (igual que el buscador principal) ---------------- */


document.addEventListener('pointerdown', e => { if (!e.target.closest('.picker')) cerrarPickers(); });


/* ---------------- selector de paciente ---------------- */



/* ---------------- nueva cita con el selector de médico ---------------- */


/* ---------------- documento de identidad ---------------- */


/* ---------------- alta y edición de paciente ---------------- */


/* ---------------- módulos Pacientes y Productos ---------------- */




// Ventas queda solo con los pedidos

// Visibilidad de los módulos nuevos según permisos

/* ---------------- directorio: comerciales ---------------- */

$('fcom').addEventListener('change', e => { F.com = e.target.value; buscar(true); });



/* ---------------- ficha del médico: comercial en «Editar ficha» ---------------- */

async function abrirEditorBase2(id, tipo) {
  await abrirEditorBase(id, tipo);
  if (!id || !puede('administrar') || !$('eguardar')) return;
  const acts = $('eguardar').closest('.acts');
  acts.insertAdjacentHTML('beforebegin', `<label for="ecom">Comercial asignado</label>
    <select id="ecom"><option>Cargando…</option></select>
    <div class="sm" style="margin-top:4px">Las ventas nuevas se atribuyen al comercial asignado en ese momento.</div>`);
  if (!COMS.length) await cargarComerciales();
  const { data: act } = await RPC_ORIG('responsable_de_cuenta', { p_medico: id });
  const antes = act ? act.id : '';
  $('ecom').innerHTML = '<option value="">Sin comercial</option>' + COMS.filter(u => rolPuede(u.rol, 'cartera') || u.id === antes).map(u =>
    `<option value="${u.id}" ${u.id === antes ? 'selected' : ''}>${esc(u.nombre)} · ${esc(u.rol)}</option>`).join('');
  $('eguardar').addEventListener('click', async () => {
    const ahora = $('ecom') ? $('ecom').value : antes;
    if (ahora === antes) return;
    const { data: r } = await db.rpc('asignar_responsable_cuenta', { p_medico: id, p_usuario: ahora || null });
    if (r && r.ok === false) toast('No se ha podido cambiar el comercial', true);
  });
}

/* ---------------- administración: asignar cartera viendo la lista ---------------- */

async function asignarCarteraBase(id) {
  const u = USUARIOS.find(x => x.id === id); if (!u) return;
  const { data: op } = await db.rpc('opciones_filtros', {});
  const sel = lista => '<option value=""></option>' + ((lista || []).map(o => `<option value="${esc(o.v)}">${esc(o.v)} (${o.n})</option>`).join(''));
  const fuera = new Set();
  let total = 0, pagina = 0;
  $('dbody').innerHTML = `<div data-nosucio>
    <div class="fh"><div><h2>Cartera de ${esc(u.nombre)}</h2>
      <div class="sm">Ahora tiene ${num(u.medicos)} ${TT('medico', 'p', '', 'l', 'l', 'asignado')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <p class="sm">Elige los filtros, revisa la lista y desmarca los que no quieras.</p>
    <div class="g2">
      <div><label for="aprov">Provincia</label><select id="aprov">${sel(op.provincias)}</select></div>
      <div><label for="amuni">Municipio</label><select id="amuni">${sel(op.municipios)}</select></div></div>
    <div class="g2">
      <div><label for="aesp">${TT('especialidad', 's', '', 'l', 'C')}</label><select id="aesp">${sel(op.especialidades)}</select></div>
      <div><label for="aest">Estado</label><select id="aest">${sel(op.estados)}</select></div></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="aurg"> Solo urgentes</label>
    <div id="amsg" class="cuenta" style="padding:10px 0 0"></div>
    <div id="alista"></div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" id="aquitar">Quitar seleccionados</button>
      <button class="btn" id="aasignar">Asignar seleccionados</button></div></div>`;

  const filtros = () => ({ f_provincia: $('aprov').value || null, f_municipio: $('amuni').value || null,
    f_especialidad: $('aesp').value || null, f_estado: $('aest').value || null, f_urgentes: $('aurg').checked });
  const cuenta = () => {
    $('amsg').innerHTML = `<b>${num(total - fuera.size)}</b> seleccionados de ${num(total)} con estos filtros
      ${fuera.size ? ` · <button class="kcfg" id="atodos">volver a marcar todos</button>` : ''}`;
    if ($('atodos')) $('atodos').onclick = () => { fuera.clear(); pinta(); };
  };
  const pinta = async () => {
    cargando($('alista'), `Buscando ${TT('medico', 'p', '', 'l', 'l')}…`);
    const { data } = await db.rpc('buscar_cuentas', Object.assign({ q: null, f_area: null, f_mios: false, f_sin_visitar: false,
      orden: 'nombre', lim: 50, desplaz: pagina * 50 }, filtros()));
    total = data ? data.total : 0;
    const f = (data && data.filas) || [];
    $('alista').innerHTML = `<div class="carsel">${f.map(m => `<label class="item" style="cursor:pointer;margin:0">
        <input type="checkbox" data-am="${m.id}" ${fuera.has(m.id) ? '' : 'checked'}>
        <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc([m.especialidad, m.centro_nombre, m.municipio].filter(Boolean).join(' · '))}</span></span>
        <span class="comchips">${(m.comerciales || []).map(x => `<span>${esc(nombrePila(x.nombre))}</span>`).join('') || '<span class="sin">Sin asignar</span>'}</span>
      </label>`).join('') || `<div class="vacio">${TT('medico', 's', 'ningun', 'C', 'l')} con estos filtros.</div>`}</div><div id="apag"></div>`;
    $('alista').querySelectorAll('[data-am]').forEach(c => c.onchange = () => { if (c.checked) fuera.delete(c.dataset.am); else fuera.add(c.dataset.am); cuenta(); });
    $('apag').innerHTML = total > 50 ? pagHTML(total, pagina, 50).replace(/<span class="ptam">[\s\S]*?<\/span><\/div>$/, '</div>') : '';
    $('apag').querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { pagina = +b.dataset.pg; pinta(); });
    cuenta();
  };
  ['aprov', 'amuni', 'aesp', 'aest', 'aurg'].forEach(k => $(k).onchange = () => { pagina = 0; fuera.clear(); pinta(); });

  const aplicar = async (quitar, ev) => {
    const ids = ((await db.rpc('ids_filtrados', filtros())).data || []).filter(x => !fuera.has(x));
    if (!ids.length) { toast(`No hay ${TT('medico', 's', 'ningun', 'l', 'l', 'seleccionado')}`, true); return; }
    if (!await preguntar(`Se van a ${quitar ? 'quitar' : 'asignar'} ${num(ids.length)} ${TT('medico', 'p', '', 'l', 'l')} ${quitar ? 'de' : 'a'} ${u.nombre}.`,
      { titulo: quitar ? 'Quitar cartera' : 'Asignar cartera', ok: quitar ? 'Quitar' : 'Asignar', peligro: quitar })) return;
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('asignar_cartera', { p: { usuario_id: id, medicos: ids, quitar } });
    ev.target.disabled = false;
    if (error || (r && r.ok === false)) { toast('No se ha podido: ' + ((error && error.message) || 'sin permiso'), true); return; }
    toast(`${num(r.filas)} ${TT('medico', 'p', '', 'l', 'l')} ${quitar ? 'retirados' : 'asignados'}${r.movidos ? ` · ${num(r.movidos)} salieron de otra cartera (cartera exclusiva)` : ''}`);
    $('dlg').close(); cargarAdmin();
  };
  $('aasignar').onclick = ev => aplicar(false, ev);
  $('aquitar').onclick = ev => aplicar(true, ev);
  $('dlg').showModal();
  pinta();
}

/* ---------------- rutas: plan desde ahora, ruta en curso, pausar y reanudar ---------------- */

// v2.242.0: aquí iba rutaPausada (nadie la usaba)









// Tras registrar una visita, se actualizan la barra y la lista de la ruta
$('dlg').addEventListener('close', () => {
  if (!rutaActiva()) return;
  setTimeout(() => { pintarRutaBarra(); pintarRutaEnCurso(); }, 400);
});

/* ---------------- ayudas actualizadas ---------------- */

Object.assign(AYUDA, {
  directorio: ['Directorio', `Todos ${TT('medico', 'p', 'el', 'l', 'l')} que puedes ver.`, [
    'El buscador de arriba filtra por nombre, centro o municipio.',
    `El municipio y la provincia cuentan ${todosLos('consulta').toLowerCase()} ${TT('medico', 's', 'del', 'l', 'l')}, no solo la principal.`,
    `Administración y televenta ven los comerciales de cada ${TT('medico', 's', '', 'l', 'l')} y pueden filtrar por comercial.`,
    '«⋮» abre los filtros y las columnas.',
    '«★ Guardar filtro» convierte los filtros actuales en un indicador de Inicio.',
    '«Cerca de mí» usa la ubicación del dispositivo.']],
  seguimiento: ['Seguimiento', `Cómo avanza cada ${TT('medico', 's', '', 'l', 'l')}.`, [
    'Los indicadores de arriba muestran el embudo por estado comercial y la calidad de los datos.',
    '«Mostrar» filtra por visitados, sin visitar, con próxima acción o atrasados.',
    '«Hecha» cierra la próxima acción; «Aplazar» le pone otra fecha.']],
  analitica: ['Analítica', 'Unidades o importe agrupados como elijas.', [
    `Elige la dimensión: ${TT('medico', 's', '', 'l', 'l')}, comercial, producto, municipio, mes o canal.`,
    'La tabla por meses sirve para ver tendencias.',
    'Los datos no se pueden descargar: se consultan solo dentro de la plataforma.']],
  rutas: ['Rutas', 'Crea rutas y conviértelas en el plan del día.', [
    `<b>Lista fija</b>: tú eliges ${TT('medico', 'p', 'el', 'l', 'l')}. <b>Por criterios</b>: se rellena sola con los filtros.`,
    'El plan ordena las paradas por cercanía y calcula las horas con tu horario. Si ya ha pasado tu hora de salida, empieza a contar desde ahora.',
    `Al pulsar <b>Empezar ruta</b> verás la lista de paradas con el botón <b>Registrar ${TT('visita', 's', '', 'l', 'l')}</b> en cada ${TT('medico', 's', '', 'l', 'l')}. «Cómo llegar» abre el navegador solo cuando tú lo pides.`,
    '<b>Pausar</b> guarda los pendientes para seguir otro día; al reanudar se recalculan orden y horas.',
    `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación. Completar la dirección y los días de atención mejora mucho las rutas.`]],
  pacientes: [`${TT('paciente', 'p', '', 'l', 'C')}`, `Las personas que compran con ${TT('medico', 's', 'un', 'l', 'l')} de referencia.`, [
    `Cada ${TT('paciente', 's', '', 'l', 'l')} tiene un <b>${TT('medico', 's', '', 'l', 'l')} que lo trata</b>: se elige al darlo de alta o se asigna solo con su primer pedido.`,
    'Para una persona se pide el DNI o NIE; para una empresa, el CIF. La app comprueba que la letra o el control sean correctos.',
    `Desde la ficha ves sus pedidos y creas uno nuevo con ${TT('medico', 's', 'el', 'l', 'l')} ya puesto.`]],
  productos: ['Productos', 'El catálogo que se usa en pedidos, muestras y analítica.', [
    'Escribe el precio sin IVA o con IVA: el otro se calcula con el IVA del producto.',
    'Un producto inactivo no aparece al crear pedidos, pero se conserva en el histórico.']],
  ventas: ['Ventas', 'Pedidos y unidades atribuidas.', [
    'Los pedidos se guardan como <b>borrador</b> (editable y se puede eliminar; no cuenta en métricas) o se <b>confirman</b> (cuenta en métricas y comisiones; solo se puede anular).',
    'Importes sin IVA; el IVA de cada producto se suma aparte.',
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y al comercial que lo tenía asignado en ese momento.`,
    'La venta a centro se atribuye a la ficha del centro, si la tiene; si no, a nadie.']]
});
ANCLAS_AYUDA.push(['#v-pacientes .saludo h1', 'pacientes'], ['#v-productos .saludo h1', 'productos'], ['#renc .card > h2', 'rutas']);


