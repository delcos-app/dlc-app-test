/* v2.200.0 · Concursos y contratos (tercera tanda del estudio por sectores, SQL 126). Decisiones de Eric: al ganar un lote, sus precios se
   aplican solos en los pedidos de esa ficha mientras el contrato está en vigor; los días de aviso antes de que venza los elige cada empresa.
   - Menú «Concursos» (en «Ventas»): «En marcha» (en estudio y con la oferta enviada, por fecha límite), «Contratos» (adjudicados, con lo que les queda)
     y «Cerrados»; «+ Nuevo concurso» y, para la administración, «Avisos de vencimiento».
   - Ventana del concurso: datos, estado, fechas del contrato y sus lotes (estado, importes, adjudicatario si se pierde) con los productos
     y precios de cada lote.
   - Pedidos: si la ficha tiene un contrato en vigor, el precio de sus productos es el adjudicado («Precio de concurso»).
   - Ficha: sus concursos. Los avisos de vencimiento abren el concurso. */
const CON_ESTADOS = ['En estudio', 'Oferta enviada', 'Adjudicado', 'Perdido', 'Desierto'];
const CON_LOTE_EST = ['Pendiente', 'Ganado', 'Perdido'];
const conPill = e => `<span class="pill ${e === 'Adjudicado' ? 'p-est' : e === 'Perdido' || e === 'Desierto' ? 'p-anu' : e === 'Oferta enviada' ? 'p-per' : 'p-warn'}">${esc(e)}</span>`;
const conVence = c => c.prorroga_hasta || c.fin || null;
const conQuedan = c => { const v = conVence(c); return v ? Math.round((new Date(v + 'T12:00:00') - new Date(hoyISO() + 'T12:00:00')) / 864e5) : null; };
let CON_AVISOS = [90, 30];
Object.assign(ICON_NOM, { gavel: '<path d="m14.5 12.5-8 8a2.12 2.12 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>' });
ICO_NAV.concursos = 'gavel'; ICO_MOD.concursos = svgIco(ICON_NOM.gavel);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (g && !g.items.includes('concursos')) g.items.splice(g.items.indexOf('ventas') + 1, 0, 'concursos'); })();
aplicarPermisosMenu = (orig => function (...a) { try { menuConcursos(); } catch (e) {} const r = orig.apply(this, a); try { menuConcursos(); } catch (e) {} return r; })(aplicarPermisosMenu);
PAGINAS.concursos = { t: 'Concursos', permiso: () => !ES_MEDICO() && puedeModulo('ventas'),
  tabs: [['marcha', 'En marcha', () => pintarConcursos('marcha')], ['contratos', 'Contratos', () => pintarConcursos('contratos')], ['cerrados', 'Cerrados', () => pintarConcursos('cerrados')]] };
Object.defineProperty(PAGINAS.concursos, 'd', { get: () => 'Pliegos, lotes adjudicados y contratos con sus precios y vencimientos' });


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


$('dlg').addEventListener('close', () => { if (TAB === 'concursos' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open && TAB === 'concursos') pintarConcursos(PAG_TAB.concursos || 'marcha'); }, 300); });

irEnlace = (orig => function (e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'concurso' && id) { verConcurso(id); return; }
  return orig.call(this, e);
})(irEnlace);

// Ficha: sus concursos (en marcha y contratos)
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (ES_MEDICO() || !$('fzcampos') || $('fconcursos') || !planIncluyeSeccion('concursos')) return r;
    const { data: l } = await db.from('concursos').select('id,titulo,estado,fin,prorroga_hasta').eq('cuenta_id', id).in('estado', ['En estudio', 'Oferta enviada', 'Adjudicado']).order('creado_en', { ascending: false }).limit(6);
    if (!(l || []).length || !$('fzcampos') || $('fconcursos') || FICHA_ID !== id) return r;
    $('fzcampos').insertAdjacentHTML('beforebegin', `<div class="blk" id="fconcursos"><h3>Concursos</h3>
      ${l.map(x => { const q = conQuedan(x); return `<div class="fmrow"><span><button type="button" class="lnk" data-fcon="${x.id}">${esc(x.titulo)}</button>${x.estado === 'Adjudicado' && q != null ? `<span class="sm"> · ${q < 0 ? 'vencido' : 'vence el ' + fechaCorta(conVence(x))}</span>` : ''}</span>${conPill(x.estado)}</div>`; }).join('')}</div>`);
    $('fconcursos').querySelectorAll('[data-fcon]').forEach(b => b.onclick = () => { $('ficha').close(); verConcurso(b.dataset.fcon); });
  } catch (e) {}
  return r;
})(abrirFicha);
try { menuConcursos(); } catch (e) {}

// Pedidos: el precio del contrato en vigor de la ficha (editorPedido lo consulta en su sitio)
let PED_PRECIOS = { cuenta: null, precios: {} };
const conPrecioContrato = p => { const x = p && p.id && PED_PRECIOS.precios[p.id]; return x ? Object.assign({}, p, { precio: +x.precio, contrato: x.concurso }) : p; };
/* v2.201.0 · Parque instalado (última pieza de la tercera tanda del estudio por sectores, SQL 127). Decisiones de Eric: los equipos se dan de
   alta a mano en la ficha o al servir un pedido de un producto «equipo», con su número de serie; los avisos de vencimiento usan los días de la empresa.
   - Producto: «Es un equipo» y «Revisión cada N meses».
   - Menú «Parque instalado» (en «Ventas»): revisiones que tocan en 30 días, contratos y garantías que vencen, y todos los equipos (buscador).
   - Ventana del equipo: datos, contrato o garantía, revisiones (con «Apuntar revisión» y «Programar en la agenda») y retirarlo.
   - Ficha: «Equipos instalados» con «+ Equipo». Pedido validado con productos «equipo»: «Dar de alta los equipos» con su número de serie.
   Además (decisión de Eric en Web delcos): Intervenciones, Material en depósito, Concursos y Parque instalado, en los planes Empresa y A medida. */
Object.assign(PLAN_SECCIONES, { cirugias: ['empresa', 'medida'], deposito: ['empresa', 'medida'], concursos: ['empresa', 'medida'], parque: ['empresa', 'medida'] });
['cirugias', 'concursos'].forEach(k => { const o = PAGINAS[k].permiso; PAGINAS[k].permiso = () => o() && planIncluyeSeccion(k); });
const EQ_CONTRATOS = ['Venta', 'Alquiler', 'Cesión'];
const EQ_REV = ['Preventiva', 'Correctiva', 'Instalación'];
const eqVence = e => e.contrato !== 'Venta' ? e.contrato_fin : e.garantia_hasta;
const eqDias = f => f ? Math.round((new Date(f + 'T12:00:00') - new Date(hoyISO() + 'T12:00:00')) / 864e5) : null;
const eqRevPill = e => { const d = eqDias(e.proxima_revision); if (e.estado === 'Retirado') return '<span class="pill p-anu">Retirado</span>';
  return d == null ? '' : d < 0 ? `<span class="pill p-urg">Revisión pasada (${fechaCorta(e.proxima_revision)})</span>` : d <= 30 ? `<span class="pill p-warn">Revisar el ${fechaCorta(e.proxima_revision)}</span>` : `<span class="pill p-per">Próxima revisión ${fechaCorta(e.proxima_revision)}</span>`; };
const eqVencePill = e => { const f = eqVence(e), d = eqDias(f); if (d == null || e.estado === 'Retirado') return '';
  const que = e.contrato !== 'Venta' ? 'Contrato' : 'Garantía';
  return d < 0 ? `<span class="pill p-anu">${que} vencido</span>` : d <= Math.max(...CON_AVISOS, 0) ? `<span class="pill p-urg">${que}: ${d === 0 ? 'vence hoy' : `vence en ${num(d)} ${d === 1 ? 'día' : 'días'}`}</span>` : ''; };
Object.assign(ICON_NOM, { monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>' });
ICO_NAV.parque = 'monitor'; ICO_MOD.parque = svgIco(ICON_NOM.monitor);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (g && !g.items.includes('parque')) g.items.splice(g.items.indexOf('concursos') + 1, 0, 'parque'); })();
aplicarPermisosMenu = (orig => function (...a) { try { menuParque(); } catch (e) {} const r = orig.apply(this, a); try { menuParque(); } catch (e) {} return r; })(aplicarPermisosMenu);
PAGINAS.parque = { t: 'Parque instalado', permiso: () => !ES_MEDICO() && puedeModulo('ventas') && planIncluyeSeccion('parque'), tabs: [['lista', 'Equipos', () => pintarParque()]] };
Object.defineProperty(PAGINAS.parque, 'd', { get: () => 'Equipos instalados con su número de serie, contrato, garantía y revisiones' });
let EQ_Q = '';


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
$('dlg').addEventListener('close', () => { if (TAB === 'parque' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open && TAB === 'parque') pintarParque(); }, 300); });

irEnlace = (orig => function (e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'equipo' && id) { verEquipo(id); return; }
  return orig.call(this, e);
})(irEnlace);

// Producto: es un equipo y cada cuánto se revisa
editorProducto = (orig => function (p, ...r) {
  const x = orig.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !planIncluyeSeccion('parque') || !$('dbody') || !$('prok') || $('prequipo') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const { data: m } = await db.from('productos').select('es_equipo,revision_meses').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prequipo') || !m) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prequipo"><h3>Equipo</h3>
      <label class="opt"><input type="checkbox" id="preqc" ${m.es_equipo ? 'checked' : ''}> Es un equipo: se instala con su número de serie</label>
      <div class="${m.es_equipo ? '' : 'hide'}" id="preqd"><label for="preqr">Revisión cada (meses; 0 = sin revisiones)</label><input id="preqr" type="number" min="0" max="120" step="1" value="${+m.revision_meses || 0}" style="max-width:140px"></div>
      <p class="sm">Al confirmar un pedido con este producto se pide el número de serie de cada unidad y queda en el parque instalado del cliente.</p></div>`);
    const guardar = async () => {
      $('preqd').classList.toggle('hide', !$('preqc').checked);
      const { error } = await db.from('productos').update({ es_equipo: $('preqc').checked, revision_meses: Math.min(120, Math.max(0, Math.floor(+$('preqr').value || 0))) }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : 'Equipo: guardado', !!error);
    };
    $('preqc').onchange = guardar; $('preqr').onchange = guardar;
  }, 160);
  return x;
})(editorProducto);

// Ficha: equipos instalados
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (ES_MEDICO() || !planIncluyeSeccion('parque') || !$('fzcampos') || $('fequipos')) return r;
    const { data: l } = await db.from('equipos').select('id,serie,ubicacion,estado,contrato,contrato_fin,garantia_hasta,proxima_revision,productos(nombre)').eq('cuenta_id', id).eq('estado', 'Instalado').order('instalado', { ascending: false }).limit(20);
    if (!$('fzcampos') || $('fequipos') || FICHA_ID !== id) return r;
    const { data: c } = await db.from('cuentas').select('tipo,nombre').eq('id', id).maybeSingle();
    if (!(l || []).length && (!c || c.tipo !== 'Centro')) return r;
    if (!$('fzcampos') || $('fequipos') || FICHA_ID !== id) return r;
    $('fzcampos').insertAdjacentHTML('beforebegin', `<div class="blk" id="fequipos"><h3>Equipos instalados${(l || []).length ? ` <span class="n">${l.length}</span>` : ''}</h3>
      ${(l || []).map(x => `<div class="fmrow"><span><button type="button" class="lnk" data-feq="${x.id}">${esc((x.productos || {}).nombre || 'Equipo')}</button><span class="sm">${x.serie ? ' · nº ' + esc(x.serie) : ''}${x.ubicacion ? ' · ' + esc(x.ubicacion) : ''}</span></span>${eqRevPill(x)}</div>`).join('') || '<p class="sm">Sin equipos instalados.</p>'}
      <button type="button" class="btn sec" id="feqmas">+ Equipo</button></div>`);
    $('fequipos').querySelectorAll('[data-feq]').forEach(b => b.onclick = () => { $('ficha').close(); verEquipo(b.dataset.feq); });
    $('feqmas').onclick = () => { $('ficha').close(); editarEquipo(null, { id, nombre: (c || {}).nombre || '' }); };
  } catch (e) {}
  return r;
})(abrirFicha);

// Pedido validado con productos «equipo»: dar de alta los equipos con su número de serie
verPedido = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (!$('dlg').open || $('pdequipos') || !planIncluyeSeccion('parque')) return r;
    const { data: p } = await db.from('pedidos').select('estado').eq('id', id).maybeSingle();
    if (!p || p.estado !== 'Confirmado') return r;
    const { data: pend } = await db.rpc('equipos_pendientes_pedido', { p_pedido: id });
    const l = (pend || []).filter(x => x.faltan > 0);
    if (!l.length || !$('dlg').open || $('pdequipos')) return r;
    const sitio = $('pddist') || $('pdpago') || $('dbody').querySelector('.acts:last-of-type'); if (!sitio) return r;
    const n = l.reduce((s, x) => s + x.faltan, 0);
    sitio.insertAdjacentHTML('beforebegin', `<div class="blk" id="pdequipos"><h3>Equipos</h3>
      <div class="banda-aviso">${n === 1 ? 'Falta dar de alta 1 equipo' : `Faltan por dar de alta ${n} equipos`} de este pedido en el parque instalado. <button type="button" class="btn sec" id="pdeqalta">Dar de alta los equipos</button></div>
      <div id="pdeqf"></div></div>`);
    $('pdeqalta').onclick = () => {
      $('pdeqf').innerHTML = `<div class="depbox"><span class="sm">Escribe el número de serie de cada unidad.</span>
        ${l.map((x, i) => `<div><b>${esc(x.nombre)}</b> <span class="sm">· ${esc(x.cuenta || '')}</span><div class="cirser">${Array.from({ length: Math.min(x.faltan, 30) }, (_, j) => `<input data-pqs="${i}" maxlength="120" placeholder="Nº de serie de la unidad ${j + 1}" aria-label="Número de serie de la unidad ${j + 1} de ${esc(x.nombre)}">`).join('')}</div></div>`).join('')}
        <div class="g2"><div><label for="pdeqi">Instalado el</label><input id="pdeqi" type="date" value="${hoyISO()}"></div><div><label for="pdequ">Ubicación</label><input id="pdequ" placeholder="p. ej. Sala 2"></div></div>
        <div class="acts" style="justify-content:flex-end"><button type="button" class="btn" id="pdeqok">Dar de alta</button></div></div>`;
      $('pdeqok').onclick = async ev => {
        const filas = [];
        l.forEach((x, i) => $('pdeqf').querySelectorAll(`[data-pqs="${i}"]`).forEach(inp => {
          if (!inp.value.trim() || !x.cuenta_id) return;
          filas.push({ cuenta_id: x.cuenta_id, producto_id: x.producto_id, serie: inp.value.trim(), instalado: $('pdeqi').value || hoyISO(), ubicacion: $('pdequ').value.trim() || null, revision_meses: +x.revision_meses || 0, pedido_id: id });
        }));
        if (!filas.length) { toast(l.some(x => !x.cuenta_id) ? 'El pedido no tiene ficha: da de alta los equipos desde la ficha del centro' : 'Escribe al menos un número de serie', true); return; }
        ev.target.disabled = true;
        const { error } = await db.from('equipos').insert(filas);
        ev.target.disabled = false;
        if (error) { toast(/row-level|policy/i.test(error.message) ? 'No puedes dar de alta equipos de esta ficha' : 'No se ha podido guardar: ' + error.message, true); return; }
        toast(filas.length === 1 ? 'Equipo dado de alta' : `${filas.length} equipos dados de alta`); verPedido(id);
      };
    };
  } catch (e) {}
  return r;
})(verPedido);
try { menuParque(); candadoSecciones(); } catch (e) {}
/* v2.203.0 · Arreglos de la auditoría del manual (SQL 128). Lo que encontró la revisión de cada pantalla:
   - Notificaciones: los avisos de intervenciones, contratos y equipos se pueden elegir (al momento, en el resumen o nada) como los demás.
   - Los avisos de la suscripción y del plan abren «Plan y suscripción»; los de la plataforma, el Panel delcos.
   - Usuarios y roles: tras guardar o borrar un usuario se repinta esta página (antes, la antigua de Administración).
   - Editar una visita: también cómo fue (presencial, teléfono, videollamada) y los productos presentados.
   - El buscador de arriba usa el vocabulario de la empresa.
   Además, arreglos en su sitio: «Guardar filtro» en el panel de filtros, textos que mandaban a menús que ya no existen, «Portal del centro» en el
   origen de Pedidos, anular un pedido facturado, «Configuración» de Facturación solo para administración, trazabilidad legible, «Ventas del mes»
   solo con ventas, «Planificar» una sola vez, métricas de la Agenda con el vocabulario, muestras solo en fichas de persona y los errores
   de intervenciones con su texto. */
TIPOS_NOTIF.push(
  ['reposicion_cirugia', '🔄', 'Reposiciones de intervención', 'Cuando pasan 48 horas de una intervención sin reponer lo usado'],
  ['vence_contrato', '📜', 'Contratos que vencen', 'Antes de que venza un contrato de concurso, con los días que elige la empresa'],
  ['vence_equipo', '⏳', 'Equipos: contrato o garantía', 'Antes de que venza el contrato o la garantía de un equipo instalado'],
  ['revision_equipo', '📆', 'Revisiones de equipos', 'Cuando toca revisar un equipo en los próximos 7 días o ya ha pasado la fecha']
);
(() => {
  const a = NOTIF_AREAS.find(x => x[0] === 'cobros'); if (a) a[2].push('reposicion_cirugia', 'vence_contrato', 'vence_equipo', 'revision_equipo');
  NOTIF_DIARIOS.push('reposicion_cirugia', 'vence_contrato', 'vence_equipo', 'revision_equipo');
  Object.assign(EXPLICA_NOTIF, {
    reposicion_cirugia: ['Una intervención hecha lleva más de 48 horas sin reponer lo que se usó en su almacén (depósito del centro o el de quien asistió).', 'Abre la intervención y pulsa «Reponer ahora».'],
    vence_contrato: ['Un contrato adjudicado de un concurso vence pronto. Avisa una vez por cada plazo que elige la administración (de partida, 90 y 30 días).', 'Prepara la renovación o pide la prórroga.'],
    vence_equipo: ['Vence el contrato (alquiler o cesión) o la garantía de un equipo instalado.', 'Habla con el centro para renovarlo o retirarlo.'],
    revision_equipo: ['A un equipo instalado le toca la revisión periódica en los próximos 7 días, o ya ha pasado la fecha.', 'Programa la revisión en la agenda y apúntala al hacerla.']
  });
})();

irEnlace = (orig => function (e) {
  const [t] = String(e || '').split(':');
  if (t === 'plan') { ir('plan'); return; }
  if (t === 'delcos' && puede('gestionar_plataforma')) { ir('delcos'); return; }
  return orig.call(this, e);
})(irEnlace);

cargarAdmin = (orig => async function (...a) {
  if (TAB === 'usuarios' && PAGINAS.usuarios) { cargarPagina('usuarios'); return; }
  if (TAB === 'config' && ['usuarios', 'roles'].includes(CFG_KEY)) { cargarConfig(); return; }
  if (!$('v-admin')) return;
  return orig.apply(this, a);
})(cargarAdmin);

// Editar una visita: cómo fue y productos presentados (actualizar_actividad los guarda desde el SQL 128)
let EV_EXTRA = null;
editarVisita = (orig => async function (v, ...r) {
  const res = await orig.call(this, v, ...r);
  try {
    const ok = $('evok'), d = $('dbody'); if (!ok || !d || $('evmodo')) return res;
    const { data: act } = await db.from('actividades').select('modo,productos').eq('id', v.id).maybeSingle();
    const modo = (act && act.modo) || 'presencial', sel = (act && act.productos) || [];
    let prods = [];
    if (planIncluyeSeccion('cobertura')) { prods = await productosPromocionados(); const falta = sel.filter(id => !prods.some(p => p.id === id));
      if (falta.length) { const { data: x } = await db.from('productos').select('id,nombre').in('id', falta); prods = prods.concat(x || []); } }
    if (!$('evok') || $('evmodo')) return res;
    EV_EXTRA = { id: v.id, modo, productos: sel.slice() };
    const ancla = $('evf') ? $('evf').closest('.g2') : null; if (!ancla) return res;
    ancla.insertAdjacentHTML('afterend', `<label>Cómo fue</label>
      <div class="segs" id="evmodo" role="group" aria-label="Cómo fue">${MODOS_VISITA.map(([k, t]) => `<button type="button" data-evmodo="${k}" class="${k === modo ? 'on' : ''}" aria-pressed="${k === modo}">${t}</button>`).join('')}</div>
      ${prods.length ? `<label>Productos presentados</label><div class="opciones" id="evprods">${prods.map(p => `<button type="button" class="opt" data-evprod="${p.id}" aria-pressed="${sel.includes(p.id)}"><span class="mk"></span>${esc(p.nombre)}</button>`).join('')}</div>` : ''}`);
    d.querySelectorAll('[data-evmodo]').forEach(b => b.onclick = () => { EV_EXTRA.modo = b.dataset.evmodo; d.querySelectorAll('[data-evmodo]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); });
    d.querySelectorAll('[data-evprod]').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); EV_EXTRA.productos = [...d.querySelectorAll('[data-evprod][aria-pressed=true]')].map(x => x.dataset.evprod); });
  } catch (e) {}
  return res;
})(editarVisita);
db.rpc = (orig => function (fn, args, ...r) {
  if (fn === 'actualizar_actividad' && EV_EXTRA && args && args.p && args.p.id === EV_EXTRA.id) {
    args = Object.assign({}, args, { p: Object.assign({}, args.p, { modo: EV_EXTRA.modo }, $('evprods') ? { productos: EV_EXTRA.productos } : {}) });
  }
  return orig.call(this, fn, args, ...r);
})(db.rpc);
$('dlg').addEventListener('close', () => { setTimeout(() => { if (!$('dlg').open) EV_EXTRA = null; }, 0); });

// El buscador de arriba, con el vocabulario de la empresa
aplicarPermisosMenu = (orig => function (...a) {
  const r = orig.apply(this, a);
  try { const q = $('q'); if (q && /^Buscar /.test(q.placeholder)) q.placeholder = `Buscar ${TT('medico', 's', '', 'l', 'l')}, centro o municipio`; } catch (e) {}
  return r;
})(aplicarPermisosMenu);
/* v2.204.0 · Manual nuevo: un libro aparte en manual/ (decisiones de Eric: se abre desde la app, fotos y vídeos de la empresa de demostración,
   con el vocabulario de cada empresa, y por capítulos; el primero, «Tu día»).
   - «Manual de uso» abre el libro en otra pestaña; antes deja en el navegador las palabras de la empresa (médico, visita, paciente) y su nombre.
   - Cada pantalla lleva un «?» junto al título que abre el manual en su capítulo (los que aún no están escritos abren la portada).
   - El portal del profesional sigue con su manual de siempre hasta que tenga capítulo. */
const MANUAL_ANCLA = { inicio: 'inicio', agenda: 'agenda', rutas: 'rutas', ciclo: 'ciclo', cirugias: 'cirugias', directorio: 'directorio', seguimiento: 'calidad',
  duplicados: 'duplicados', eventos: 'eventos', pacientes: 'clientes', ventas: 'pedidos', oportunidades: 'oportunidades', compras: 'compras', proveedores: 'proveedores', concursos: 'concursos', parque: 'parque', productos: 'productos',
  facturacion: 'facturacion', analitica: 'analitica', config: 'ajustes', perfil: 'perfil', empresa: 'organizacion', plan: 'plan', organizacion: 'organizacion', usuarios: 'usuarios' };
// v2.242.0: aquí iba la primera versión de abrirManual (se redefine entera más abajo)
document.addEventListener('click', e => {
  const b = e.target.closest('#manbtn'); if (!b || ES_MEDICO()) return;
  e.stopImmediatePropagation(); e.preventDefault();
  document.querySelectorAll('.umenu, #umenu').forEach(m => m.classList.add('hide'));
  abrirManual(MANUAL_ANCLA[TAB] || '');
}, true);
function ponerAyudaManual() {
  if (ES_MEDICO()) return;
  const v = $('v-' + TAB); const h = v && v.querySelector('.saludo h1'); if (!h || h.querySelector('.manq')) return;
  h.insertAdjacentHTML('beforeend', `<button type="button" class="manq" title="Abrir el manual de esta pantalla" aria-label="Abrir el manual de esta pantalla"></button>`);
  h.querySelector('.manq').onclick = ev => { ev.stopPropagation(); abrirManual(MANUAL_ANCLA[TAB] || ''); };
}
ir = (orig => function (...a) {
  const r = orig.apply(this, a);
  [400, 1200, 2500].forEach(ms => setTimeout(() => { try { ponerAyudaManual(); } catch (e) {} }, ms));
  return r;
})(ir);

/* v2.205.0 · Manual: capítulo «La visita y lo común». El «?» de Ciclo de visitas y de Intervenciones lleva a su sección del capítulo
   (MANUAL_ANCLA, editado en su sitio), y el material de cada visita ya no repite los resultados sin dato (detTxt, editado en su sitio). */

/* v2.206.0 · Manual: capítulo «Cartera». El «?» del directorio, Calidad del dato, Duplicados y Eventos lleva a su sección
   (MANUAL_ANCLA, editado en su sitio). */

/* v2.207.0 · Manual: capítulo «Ventas». El «?» de Pedidos (y Oportunidades, Compras y Proveedores), Clientes, Concursos y Parque instalado
   lleva a su sección (MANUAL_ANCLA, editado en su sitio). */

/* v2.208.0 · Manual: capítulo «Oficina y resultados». El «?» de Productos, Facturación y Analítica lleva a su sección
   (MANUAL_ANCLA, editado en su sitio). */

/* v2.209.0 · Manual: capítulo «Configuración y cuenta» (el último). El «?» de Configuración, Mi perfil, Organización y Usuarios y roles
   lleva a su sección (MANUAL_ANCLA, editado en su sitio). */

/* v2.210.0 · Detalles vistos al grabar el manual.
   - El título del directorio usa siempre el nombre del módulo (antes salía «Médicos» si la cabecera se pintaba después de aplicarEtiqueta, editada en su sitio).
   - «Cerca de mí»: la distancia entera y el vocabulario de la empresa (pintarCerca, editada en su sitio); cobertura por producto y «Rectificar» en el estilo. */
ir = (orig => function (...a) {
  const r = orig.apply(this, a);
  if (a[0] === 'directorio') [0, 300, 1200].forEach(ms => setTimeout(() => { try { aplicarEtiqueta(); } catch (e) {} }, ms));
  return r;
})(ir);

