/* v2.195.0 · Eventos, formación e informe de gastos (última pieza de la primera tanda del estudio por sectores, SQL 121). Decisiones de Eric:
   sección propia «Eventos» (en el bloque Cartera del menú), importe por concepto por asistente con informe anual de gastos, y en los
   planes Comercial, Empresa y A medida (candado en Campo, como Compras).
   - Eventos → «Eventos»: próximos y pasados; «+ Nuevo evento» (título, tipo, fecha, hora, lugar o en línea, nota); al abrir uno, sus
     asistentes con su estado y lo que se le da a cada uno (inscripción, viaje y alojamiento, comidas, honorarios), con aviso si una comida
     pasa de 60 € por persona.
   - Eventos → «Informe de gastos» (administración o quien ve todo el equipo): por año, lo dado a cada profesional por concepto, para descargar.
   - Ficha: bloque «Eventos» con los últimos a los que ha ido o está invitado. */
const EV_TIPOS = ['Taller', 'Curso', 'Congreso', 'Webinar', 'Reunión científica', 'Comida de trabajo', 'Otro'];
const EV_ESTADOS = ['Invitado', 'Confirmado', 'Asistió', 'No asistió'];
const EV_CONCEPTOS = [['inscripcion', 'Inscripción'], ['viaje', 'Viaje y alojamiento'], ['comida', 'Comidas'], ['honorarios', 'Honorarios']];
const EV_COMIDA_MAX = 60;
const evTotal = a => EV_CONCEPTOS.reduce((s, [k]) => s + (+a[k] || 0), 0);
Object.assign(ICON_NOM, { 'graduation-cap': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>' });
ICO_NAV.eventos = 'graduation-cap'; ICO_MOD.eventos = svgIco(ICON_NOM['graduation-cap']);
PLAN_SECCIONES.eventos = ['comercial', 'empresa', 'medida'];
(() => { const g = MENU_GRUPOS.find(x => x.id === 'cartera'); if (g && !g.items.includes('eventos')) g.items.splice(g.items.indexOf('directorio') + 1, 0, 'eventos'); })();
function menuEventos() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="eventos"]');
  if (!b) { const tras = nav.querySelector('[data-t="directorio"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', '<button data-t="eventos" aria-selected="false">Eventos</button>'); b = nav.querySelector('[data-t="eventos"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('directorio')));
}
aplicarPermisosMenu = (orig => function (...a) { try { menuEventos(); } catch (e) {} const r = orig.apply(this, a); try { menuEventos(); } catch (e) {} return r; })(aplicarPermisosMenu);
const verTransparencia = () => puede('administrar') || VE_TODO();
PAGINAS.eventos = { t: 'Eventos', permiso: () => !ES_MEDICO() && puedeModulo('directorio') && planIncluyeSeccion('eventos') };
Object.defineProperty(PAGINAS.eventos, 'd', { get: () => 'Talleres, cursos y congresos con sus asistentes, inscripciones y gastos' });
Object.defineProperty(PAGINAS.eventos, 'tabs', { get: () => [['lista', 'Eventos', () => pintarEventos()]].concat(verTransparencia() ? [['transparencia', 'Informe de gastos', () => pintarTransparencia()]] : []) });

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
$('dlg').addEventListener('close', () => { if (TAB === 'eventos' && (PAG_TAB.eventos || 'lista') === 'lista' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open) pintarEventos(); }, 300); });

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

// Ficha: eventos de ese profesional
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (!$('fzcampos') || $('feventos') || !planIncluyeSeccion('eventos')) return r;
    const { data: l } = await db.from('eventos_asistentes').select('estado,eventos(id,titulo,fecha)').eq('cuenta_id', id).limit(30);
    const ev = (l || []).filter(x => x.eventos).sort((x, y) => String(y.eventos.fecha).localeCompare(String(x.eventos.fecha))).slice(0, 5);
    if (!ev.length || !$('fzcampos') || $('feventos') || FICHA_ID !== id) return r;
    $('fzcampos').insertAdjacentHTML('beforebegin', `<div class="blk" id="feventos"><h3>Eventos</h3>
      ${ev.map(x => `<div class="fmrow"><span><button type="button" class="lnk" data-fev="${x.eventos.id}">${esc(x.eventos.titulo)}</button><span class="sm"> · ${fechaCorta(x.eventos.fecha)}</span></span><span class="pill ${x.estado === 'Asistió' ? 'p-est' : x.estado === 'No asistió' ? 'p-anu' : 'p-per'}">${esc(x.estado)}</span></div>`).join('')}</div>`);
    $('feventos').querySelectorAll('[data-fev]').forEach(b => b.onclick = () => { $('ficha').close(); verEvento(b.dataset.fev); });
  } catch (e) {}
  return r;
})(abrirFicha);
try { menuEventos(); } catch (e) {}

/* v2.196.0 · Material en depósito en el cliente (segunda tanda del estudio por sectores, SQL 122). Decisiones de Eric: solo en fichas de tipo
   Centro; lo usado se sabe por recuento o apuntando cada uso; lo usado crea un pedido en borrador y se propone reponerlo.
   - Ficha de un centro: bloque «Material en depósito» (unidades y productos) con «Abrir el depósito» o «Dejar material en depósito».
   - Ventana del depósito: lo que hay por lote y caducidad (aviso si caduca en menos de 60 días), lo usado en 90 días y los últimos
     movimientos; «Reponer» (de tu maletín o del almacén central), «Apuntar uso» (con referencia, sin datos del paciente) y «Recuento».
     Lo usado deja un pedido en borrador del centro («Ver el pedido») y ofrece «Reponer lo usado». */
let DEP = null;   // { cuenta, nombre, estado }
const depCaducaPronto = f => f && f <= isoMas(hoyISO(), 60);
async function verDeposito(cuenta, nombre, aviso) {
  const { data: e, error } = await db.rpc('deposito_estado', { p_cuenta: cuenta });
  if (error || !e || e.ok === false) { toast(e && e.error === 'permiso' ? 'No puedes ver el depósito de este centro' : 'No se ha podido abrir el depósito', true); return; }
  DEP = { cuenta, nombre, estado: e };
  if (!PRODUCTOS.length) await cargarProductos();
  const l = (e.lineas || []).filter(x => x.unidades > 0), tot = l.reduce((s, x) => s + x.unidades, 0);
  const tipoMov = { traspaso_entrada: 'Repuesto', traspaso_salida: 'Sale', consumo_deposito: 'Usado', ajuste: 'Ajuste' };
  $('dbody').innerHTML = `<div class="fh"><div><h2>Depósito · ${esc(nombre)}</h2><div class="sm">${tot ? `${num(tot)} unidades de ${(z => z === 1 ? '1 producto' : z + ' productos')(new Set(l.map(x => x.producto_id)).size)}` : 'Sin material ahora mismo'} · sigue siendo vuestro hasta que se usa</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    ${aviso || ''}
    <div class="depacts"><button type="button" class="btn" data-dep="reponer">Reponer</button><button type="button" class="btn sec" data-dep="consumo" ${l.length ? '' : 'disabled'}>Apuntar uso</button>
      <button type="button" class="btn sec" data-dep="recuento" ${l.length ? '' : 'disabled'}>Recuento</button></div>
    <div id="depform"></div>
    ${l.length ? `<div class="deptab"><div class="deph"><span>Producto</span><span>Lote</span><span>Caduca</span><span>Uds</span></div>${l.map(x => `<div class="depf"><span>${esc(x.nombre)}</span>
      <span>${esc(x.numero_lote || 'Sin lote')}</span><span class="${depCaducaPronto(x.caducidad) ? 'depcad' : ''}">${x.caducidad ? fechaCorta(x.caducidad) : '—'}</span><b>${num(x.unidades)}</b></div>`).join('')}</div>`
      : '<div class="vacio vlinea">El depósito está vacío: repón para dejar material.</div>'}
    ${(e.usado_90 || []).length ? `<p class="sm">Usado en los últimos 90 días: ${e.usado_90.map(x => `${esc(x.nombre)} ${num(x.unidades)}`).join(' · ')}</p>` : ''}
    ${(e.movimientos || []).length ? `<details class="depmov"><summary>Últimos movimientos</summary>${e.movimientos.map(m => `<div class="depmf"><span>${fechaCorta(String(m.fecha).slice(0, 10))}</span>
      <span>${tipoMov[m.tipo] || esc(m.tipo)}</span><span>${esc(m.nombre)}${m.numero_lote ? ' · ' + esc(m.numero_lote) : ''}</span><b>${m.unidades > 0 ? '+' : ''}${num(m.unidades)}</b>
      <span class="sm">${esc(String(m.nota || '').replace(/\s*\[[^\]]*\]$/, ''))}</span></div>`).join('')}</details>` : ''}
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" data-cerrar>Cerrar</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  $('dbody').querySelectorAll('[data-dep]').forEach(b => b.onclick = () => formDeposito(b.dataset.dep));
}

function formDeposito(acc) {
  const f = $('depform'), l = (DEP.estado.lineas || []).filter(x => x.unidades > 0);
  const prods = PRODUCTOS.filter(p => p.activo !== false && (p.estado || 'Activo') !== 'Descatalogado');
  if (acc === 'reponer') {
    f.innerHTML = `<div class="depbox"><b>Reponer el depósito</b>
      <div class="segs" id="depori" role="group" aria-label="De dónde sale"><button type="button" data-o="maletin" class="on" aria-pressed="true">De mi maletín</button><button type="button" data-o="central" aria-pressed="false">Del almacén central</button></div>
      <div class="depitems">${prods.map(p => `<label><span>${esc(p.nombre)}</span><input type="number" min="0" step="1" data-dprod="${p.id}" placeholder="0" aria-label="Unidades de ${esc(p.nombre)}"></label>`).join('')}</div>
      <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="depcanc">Cancelar</button><button type="button" class="btn" id="depok">Reponer</button></div></div>`;
    f.querySelectorAll('[data-o]').forEach(b => b.onclick = () => f.querySelectorAll('[data-o]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }));
  } else if (acc === 'consumo') {
    f.innerHTML = `<div class="depbox"><b>Apuntar lo usado</b>
      <div class="depitems">${l.map((x, i) => `<label><span>${esc(x.nombre)} <span class="sm">· ${esc(x.numero_lote || 'sin lote')} · quedan ${num(x.unidades)}</span></span>
        <input type="number" min="0" max="${x.unidades}" step="1" data-dlin="${i}" placeholder="0" aria-label="Usadas de ${esc(x.nombre)}"></label>`).join('')}</div>
      <label for="depref">Referencia</label><input id="depref" maxlength="120" placeholder="p. ej. Intervención del martes, sala 2 (sin datos del paciente)">
      <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="depcanc">Cancelar</button><button type="button" class="btn" id="depok">Apuntar</button></div></div>`;
  } else {
    f.innerHTML = `<div class="depbox"><b>Recuento</b><span class="sm">Escribe lo que hay ahora; lo que falte se apunta como usado.</span>
      <div class="depitems">${l.map((x, i) => `<label><span>${esc(x.nombre)} <span class="sm">· ${esc(x.numero_lote || 'sin lote')} · había ${num(x.unidades)}</span></span>
        <input type="number" min="0" step="1" data-dcnt="${i}" value="${x.unidades}" aria-label="Contadas de ${esc(x.nombre)}"></label>`).join('')}</div>
      <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="depcanc">Cancelar</button><button type="button" class="btn" id="depok">Guardar recuento</button></div></div>`;
  }
  $('depcanc').onclick = () => { f.innerHTML = ''; };
  $('depok').onclick = async ev => {
    const op = 'd' + Date.now();
    let p;
    if (acc === 'reponer') {
      const items = [...f.querySelectorAll('[data-dprod]')].map(i => ({ producto_id: i.dataset.dprod, unidades: Math.max(0, Math.floor(+i.value || 0)) })).filter(x => x.unidades > 0);
      if (!items.length) { toast('Escribe cuántas unidades repones', true); return; }
      p = { cuenta_id: DEP.cuenta, accion: 'reponer', origen: f.querySelector('#depori .on').dataset.o, items, op_id: op };
    } else if (acc === 'consumo') {
      const items = [...f.querySelectorAll('[data-dlin]')].map(i => { const x = l[+i.dataset.dlin]; return { producto_id: x.producto_id, lote_id: x.lote_id, unidades: Math.max(0, Math.floor(+i.value || 0)), max: x.unidades }; }).filter(x => x.unidades > 0);
      if (!items.length) { toast('Escribe lo que se ha usado', true); return; }
      if (items.some(x => x.unidades > x.max)) { toast('No se puede usar más de lo que hay en el depósito', true); return; }
      p = { cuenta_id: DEP.cuenta, accion: 'consumo', items, referencia: $('depref').value.trim(), op_id: op };
    } else {
      const items = [...f.querySelectorAll('[data-dcnt]')].map(i => { const x = l[+i.dataset.dcnt]; return { producto_id: x.producto_id, lote_id: x.lote_id, contadas: Math.max(0, Math.floor(+i.value || 0)) }; });
      p = { cuenta_id: DEP.cuenta, accion: 'recuento', items, op_id: op };
    }
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('deposito_mover', { p });
    ev.target.disabled = false;
    if (error || !r || r.ok === false) { toast(r && r.error === 'sin_origen' ? 'No hay almacén del que sacar el material' : r && r.error === 'permiso' ? 'No puedes mover el depósito de este centro' : 'No se ha podido guardar', true); return; }
    const usado = r.usado || [];
    let aviso = '';
    if (acc === 'reponer') toast('Depósito repuesto');
    else if (!usado.length) toast('Recuento guardado: no falta nada');
    else {
      toast('Apuntado lo usado');
      aviso = `<div class="banda-ok depaviso">Usado: ${usado.map(x => `${esc(x.nombre)} ${num(x.unidades)}`).join(' · ')}. Queda un pedido en borrador del centro para confirmarlo.
        <span class="depav"><button type="button" class="btn sec" id="depverped">Ver el pedido</button><button type="button" class="btn" id="depreponer">Reponer lo usado</button></span></div>`;
    }
    await verDeposito(DEP.cuenta, DEP.nombre, aviso);
    if ($('depverped') && r.pedido_id) $('depverped').onclick = () => verPedido(r.pedido_id);
    if ($('depreponer')) $('depreponer').onclick = async b => {
      b.target.disabled = true;
      const { data: r2 } = await db.rpc('deposito_mover', { p: { cuenta_id: DEP.cuenta, accion: 'reponer', items: usado.map(x => ({ producto_id: x.producto_id, unidades: x.unidades })), op_id: 'r' + Date.now() } });
      if (!r2 || r2.ok === false) { b.target.disabled = false; toast(r2 && r2.error === 'sin_origen' ? 'No hay almacén del que sacar el material' : 'No se ha podido reponer', true); return; }
      toast('Repuesto lo usado'); verDeposito(DEP.cuenta, DEP.nombre);
    };
  };
}

// Ficha de un centro: su depósito
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (!$('fzcampos') || $('fdeposito') || !planIncluyeSeccion('deposito')) return r;
    const { data: c } = await db.from('cuentas').select('tipo,nombre').eq('id', id).maybeSingle();
    if (!c || c.tipo !== 'Centro') return r;
    const { data: e } = await db.rpc('deposito_estado', { p_cuenta: id });
    if (!e || e.ok === false || !$('fzcampos') || $('fdeposito') || FICHA_ID !== id) return r;
    const l = (e.lineas || []).filter(x => x.unidades > 0), tot = l.reduce((s, x) => s + x.unidades, 0), cad = l.filter(x => depCaducaPronto(x.caducidad)).length;
    $('fzcampos').insertAdjacentHTML('beforebegin', `<div class="blk" id="fdeposito"><h3>Material en depósito</h3>
      <p class="sm">${e.existe && tot ? `${num(tot)} unidades de ${(z => z === 1 ? '1 producto' : z + ' productos')(new Set(l.map(x => x.producto_id)).size)}${cad ? ` · <b style="color:var(--warn)">${cad === 1 ? '1 lote caduca' : cad + ' lotes caducan'} en menos de 60 días</b>` : ''}` : 'Sin material en depósito.'}</p>
      <button type="button" class="btn sec" id="fdepabrir">${e.existe ? 'Abrir el depósito' : 'Dejar material en depósito'}</button></div>`);
    $('fdepabrir').onclick = () => { $('ficha').close(); verDeposito(id, c.nombre); };
  } catch (e) {}
  return r;
})(abrirFicha);
/* v2.197.0 · Ciclo de visitas con clasificación A/B/C (segunda tanda del estudio por sectores, SQL 123). Decisiones de Eric: cada ficha en A,
   B o C, cada clase con sus visitas por ciclo y el ciclo configurable (de partida, trimestral: A = 3, B = 2, C = 1).
   - Menú «Ciclo de visitas» (en «Tu día»): «Este ciclo» (cómo va cada clase y a quién le faltan visitas, con «+ Cita»), «Clasificar»
     (A, B o C en cada ficha, con sus visitas de los últimos 12 meses como ayuda) y, para quien ve todo el equipo, «Equipo».
   - Ficha: en el bloque «Estado», la clase (A, B, C; pulsar la marcada la quita) y las visitas de este ciclo.
   - Configuración → Cartera y visitas → «Ciclo A/B/C» (administración): duración del ciclo y visitas de cada clase. */
const CIC_CLASES = ['A', 'B', 'C'];
const cicNombre = m => ({ 1: 'mes', 2: 'bimestre', 3: 'trimestre', 4: 'cuatrimestre', 6: 'semestre', 12: 'año' })[m] || 'ciclo';
const cicVis = n => `${n} ${TT('visita', n === 1 ? 's' : 'p', '', 'l', 'l')}`;
const cicPill = k => k ? `<span class="cicl c${k}">${k}</span>` : '<span class="cicl csin">—</span>';
const cicSegs = (id, k, dis) => `<span class="segs cicsegs" role="group" aria-label="Clase">${CIC_CLASES.map(x => `<button type="button" data-ccl="${id}|${x}" class="${x === k ? 'on' : ''}" aria-pressed="${x === k}" ${dis ? 'disabled' : ''}>${x}</button>`).join('')}</span>`;
let CIC_DE = '', CIC_FIL = '', CIC_CLF = 'sin', CIC_Q = '';
Object.assign(ICON_NOM, { target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' });
ICO_NAV.ciclo = 'target'; ICO_MOD.ciclo = svgIco(ICON_NOM.target);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'dia'); if (g && !g.items.includes('ciclo')) g.items.push('ciclo'); })();
function menuCiclo() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="ciclo"]');
  if (!b) { const tras = nav.querySelector('[data-t="rutas"]') || nav.querySelector('[data-t="agenda"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', `<button data-t="ciclo" aria-selected="false">Ciclo de ${TT('visita', 'p', '', 'l', 'l')}</button>`); b = nav.querySelector('[data-t="ciclo"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('agenda')));
}
aplicarPermisosMenu = (orig => function (...a) { try { menuCiclo(); } catch (e) {} const r = orig.apply(this, a); try { menuCiclo(); } catch (e) {} return r; })(aplicarPermisosMenu);
PAGINAS.ciclo = { permiso: () => !ES_MEDICO() && puedeModulo('agenda') };
Object.defineProperty(PAGINAS.ciclo, 't', { get: () => `Ciclo de ${TT('visita', 'p', '', 'l', 'l')}` });
Object.defineProperty(PAGINAS.ciclo, 'd', { get: () => `${TT('medico', 'p', '', 'l', 'C')} en A, B y C, y las ${TT('visita', 'p', '', 'l', 'l')} que le tocan a cada uno en cada ciclo` });
Object.defineProperty(PAGINAS.ciclo, 'tabs', { get: () => [['ciclo', 'Este ciclo', () => pintarCiclo()]].concat(planIncluyeSeccion('cobertura') ? [['cobertura', 'Por producto', () => pintarCobertura()]] : [], [['clasificar', 'Clasificar', () => pintarClasificar()]]).concat(VE_TODO() ? [['equipo', 'Equipo', () => pintarCicloEquipo()]] : []) });
const cicUsuario = () => VE_TODO() ? (CIC_DE || null) : PERFIL.id;
async function cicSelectorDe() {
  if (!VE_TODO()) return '';
  if (!COMS.length) { try { await cargarComerciales(); } catch (e) {} }
  return `<select id="cicde" aria-label="De quién"><option value="">Todo el equipo</option>${COMS.map(u => `<option value="${u.id}" ${CIC_DE === u.id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}</select>`;
}
const cicIrA = tab => { PAG_TAB.ciclo = tab; cargarPagina('ciclo'); };

async function pintarCiclo() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data: d, error }, sel] = await Promise.all([db.rpc('ciclo_cuentas', { p_usuario: cicUsuario() }), cicSelectorDe()]);
  if (!$('cfgcuerpo') || TAB !== 'ciclo') return;
  if (error || !d) { caja.innerHTML = '<div class="vacio">No se ha podido cargar el ciclo.</div>'; return; }
  const res = Object.fromEntries((d.resumen || []).map(x => [x.clase, x])), obj = d.objetivo || {};
  const clasif = (d.resumen || []).reduce((s, x) => s + x.cuentas, 0);
  const pend = (d.pendientes || []).filter(p => !CIC_FIL || p.clase === CIC_FIL);
  const tarjeta = k => { const x = res[k] || { cuentas: 0, al_dia: 0, hechas: 0, objetivo: 0 }, p = x.objetivo ? Math.round(x.hechas / x.objetivo * 100) : 0;
    return `<div class="card cicc">${cicPill(k)}<div class="cicct"><b>${x.cuentas ? `${num(x.al_dia)} de ${num(x.cuentas)} al día` : `Ninguno en ${k}`}</b>
      <span class="sm">${cicVis(obj[k] || 0)} cada ${cicNombre(d.meses)}</span></div>
      ${x.cuentas ? `<div class="cicbar"><i style="width:${p}%"></i></div><span class="sm">${num(x.hechas)} de ${cicVis(x.objetivo)} hechas · ${p}%</span>` : ''}</div>`; };
  caja.innerHTML = `<div class="cicpag"><div class="ciccab"><div><b>${esc(cicNombre(d.meses).replace(/^./, c => c.toUpperCase()))} del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}</b>
      <span class="sm">${d.quedan_dias === 1 ? 'Queda 1 día' : `Quedan ${num(d.quedan_dias)} días`} · cuentan todas las ${TT('visita', 'p', '', 'l', 'l')} registradas, también por teléfono o videollamada</span></div>
      <span class="cicacc">${sel}${puede('administrar') ? '<button type="button" class="btn sec" id="cicajustar">Ajustar el ciclo</button>' : ''}</span></div>
    ${d.sin_clase ? `<div class="banda-aviso cicsin">${d.sin_clase === 1 ? `1 ${TT('medico', 's', '', 'l', 'l')} sin clasificar` : `${num(d.sin_clase)} ${TT('medico', 'p', '', 'l', 'l')} sin clasificar`}: sin clase no cuentan en el ciclo.
      <button type="button" class="btn sec" id="cicirclas">Clasificar</button></div>` : ''}
    ${clasif ? `<div class="cicres">${CIC_CLASES.map(tarjeta).join('')}</div>
    <section class="card cicbloque"><div class="cicbcab"><h2>Les faltan ${TT('visita', 'p', '', 'l', 'l')} este ${cicNombre(d.meses)}</h2>
        <span class="segs" id="cicfil" role="group" aria-label="Clase">${[['', 'Todas']].concat(CIC_CLASES.map(k => [k, k])).map(([k, t]) => `<button type="button" data-cf="${k}" class="${k === CIC_FIL ? 'on' : ''}" aria-pressed="${k === CIC_FIL}">${t}</button>`).join('')}</span></div>
      ${pend.length ? `<div class="lista">${pend.map(p => `<div class="item cicrow">${cicPill(p.clase)}
        <span class="tx"><button type="button" class="lnk" data-cfi="${p.id}"><b>${esc(p.nombre)}</b></button>
          <span class="sm">${esc([p.especialidad, p.municipio].filter(Boolean).join(' · '))}${p.ultima_visita ? ` · última ${TT('visita', 's', '', 'l', 'l')} ${fechaCorta(p.ultima_visita)}` : ` · sin ${TT('visita', 'p', '', 'l', 'l')}`}</span></span>
        <span class="cicfal"><b>${p.hechas} de ${p.objetivo}</b><span class="sm">${p.faltan === 1 ? 'falta 1' : `faltan ${p.faltan}`}</span></span>
        ${p.proxima_cita ? `<span class="pill p-per">Cita el ${fechaCorta(p.proxima_cita)}</span>` : `<button type="button" class="btn sec" data-ccita="${p.id}">+ Cita</button>`}</div>`).join('')}</div>`
        : `<div class="vacio vlinea">${CIC_FIL ? `En ${CIC_FIL} no le falta ${TT('visita', 's', '', 'l', 'l')} a nadie.` : `Todos al día este ${cicNombre(d.meses)}.`}</div>`}</section>`
    : `<div class="vacio">Todavía no hay ${TT('medico', 'p', '', 'l', 'l')} en A, B o C. Empieza por «Clasificar»: A para los más importantes, B para los intermedios y C para el resto.</div>`}</div>`;
  if ($('cicde')) $('cicde').onchange = e => { CIC_DE = e.target.value; pintarCiclo(); };
  if ($('cicajustar')) $('cicajustar').onclick = () => editorCiclo();
  if ($('cicirclas')) $('cicirclas').onclick = () => { CIC_CLF = 'sin'; cicIrA('clasificar'); };
  caja.querySelectorAll('#cicfil [data-cf]').forEach(b => b.onclick = () => { CIC_FIL = b.dataset.cf; pintarCiclo(); });
  caja.querySelectorAll('[data-cfi]').forEach(b => b.onclick = () => abrirFicha(b.dataset.cfi));
  caja.querySelectorAll('[data-ccita]').forEach(b => b.onclick = () => nuevaCita(b.dataset.ccita));
}

async function pintarClasificar() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data: l, error }, sel] = await Promise.all([db.rpc('cuentas_para_clasificar', { p_usuario: cicUsuario(), p_filtro: CIC_CLF, p_q: CIC_Q || null }), cicSelectorDe()]);
  if (!$('cfgcuerpo') || TAB !== 'ciclo') return;
  if (error) { caja.innerHTML = '<div class="vacio">No se han podido cargar las fichas.</div>'; return; }
  const filas = l || [], fil = [['sin', 'Sin clasificar']].concat(CIC_CLASES.map(k => [k, k]), [['todas', 'Todas']]);
  const yaQ = $('cicq') && document.activeElement === $('cicq');
  caja.innerHTML = `<div class="cicpag"><div class="ciccab"><span class="segs" id="cicclf" role="group" aria-label="Mostrar">${fil.map(([k, t]) => `<button type="button" data-cl="${k}" class="${k === CIC_CLF ? 'on' : ''}" aria-pressed="${k === CIC_CLF}">${t}</button>`).join('')}</span>
      <span class="cicacc"><input id="cicq" type="search" placeholder="Buscar por nombre, ${TT('especialidad', 's', '', 'l', 'l')} o municipio" value="${esc(CIC_Q)}" aria-label="Buscar">${sel}</span></div>
    <p class="sm">Pulsa A, B o C en cada ${TT('medico', 's', '', 'l', 'l')}: <b>A</b> para los más importantes, <b>B</b> para los intermedios y <b>C</b> para el resto. Pulsar la letra marcada la quita. Las ${TT('visita', 'p', '', 'l', 'l')} de los últimos 12 meses ayudan a decidir.</p>
    ${filas.length ? `<section class="card cicbloque"><div class="lista">${filas.map(m => `<div class="item cicrow" data-cfila="${m.id}">
        <span class="tx"><button type="button" class="lnk" data-cfi="${m.id}"><b>${esc(m.nombre)}</b></button>
          <span class="sm">${esc([m.especialidad, m.municipio, m.estado_comercial].filter(Boolean).join(' · '))}</span></span>
        <span class="cicfal"><b>${num(m.actividades_12m)}</b><span class="sm">en 12 meses</span></span>
        ${cicSegs(m.id, m.clase)}</div>`).join('')}</div></section>${filas.length >= 300 ? '<p class="sm">Se ven las 300 primeras: busca para encontrar el resto.</p>' : ''}`
      : `<div class="vacio vlinea">${CIC_CLF === 'sin' && !CIC_Q ? `Todos están clasificados.` : 'No hay ninguno con este filtro.'}</div>`}</div>`;
  caja.querySelectorAll('#cicclf [data-cl]').forEach(b => b.onclick = () => { CIC_CLF = b.dataset.cl; pintarClasificar(); });
  let t = null;
  $('cicq').oninput = e => { clearTimeout(t); t = setTimeout(() => { CIC_Q = e.target.value.trim(); pintarClasificar(); }, 350); };
  if (yaQ) { const i = $('cicq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  if ($('cicde')) $('cicde').onchange = e => { CIC_DE = e.target.value; pintarClasificar(); };
  caja.querySelectorAll('[data-cfi]').forEach(b => b.onclick = () => abrirFicha(b.dataset.cfi));
}

// A, B o C en cualquier sitio (página «Clasificar» y ficha): pulsar la marcada la quita
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-ccl]'); if (!b || b.disabled) return;
  const [id, k] = b.dataset.ccl.split('|'), grupo = b.closest('.cicsegs'), nueva = b.classList.contains('on') ? null : k;
  grupo.querySelectorAll('button').forEach(x => x.disabled = true);
  const { data: r, error } = await db.rpc('clasificar_cuentas', { p_ids: [id], p_clase: nueva });
  grupo.querySelectorAll('button').forEach(x => { x.disabled = false; });
  if (error || !r || r.ok === false) { toast(r && r.error === 'permiso' ? 'No puedes cambiar la clase de esta ficha' : 'No se ha podido guardar', true); return; }
  grupo.querySelectorAll('button').forEach(x => { const on = x.dataset.ccl === id + '|' + nueva; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
  invalidarCache();
  if (grupo.closest('#fciclo')) cicFicha(id);
}, true);

async function editorCiclo() {
  await cargarAjustes();
  const c = Object.assign({ meses: 3, A: 3, B: 2, C: 1 }, AJUSTES.ciclo_visitas || {});
  $('dbody').innerHTML = `<div class="fh"><div><h2>Ciclo de ${TT('visita', 'p', '', 'l', 'l')} A/B/C</h2>
      <div class="sm">Cuántas ${TT('visita', 'p', '', 'l', 'l')} necesita cada clase en cada ciclo. El ciclo va por el calendario: con un trimestre, de enero a marzo, de abril a junio…</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="cicmeses">Duración del ciclo</label><select id="cicmeses">${[[1, 'Un mes'], [2, 'Dos meses'], [3, 'Un trimestre'], [4, 'Cuatro meses'], [6, 'Un semestre'], [12, 'Un año']].map(([m, t]) => `<option value="${m}" ${+c.meses === m ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <div class="cicobj">${CIC_CLASES.map(k => `<label>${cicPill(k)}<span>${TT('visita', 'p', '', 'l', 'C')} por ciclo</span><input type="number" min="0" max="31" step="1" data-cobj="${k}" value="${Math.max(0, +c[k] || 0)}" aria-label="${TT('visita', 'p', '', 'l', 'C')} de la clase ${k}"></label>`).join('')}</div>
    <p class="sm">Con 0, esa clase no pide ${TT('visita', 'p', '', 'l', 'l')}. Cambiarlo no borra nada: solo cambia lo que se cuenta.</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="cicok">Guardar</button></div>`;
  if (!$('dlg').open) $('dlg').showModal();
  $('cicok').onclick = async () => {
    const v = { meses: +$('cicmeses').value || 3 };
    $('dbody').querySelectorAll('[data-cobj]').forEach(i => v[i.dataset.cobj] = Math.min(31, Math.max(0, Math.floor(+i.value || 0))));
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'ciclo_visitas', p_valor: v });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    AJUSTES.ciclo_visitas = v; $('dlg').close(); toast('Ciclo guardado'); invalidarCache();
  };
}

async function pintarCicloEquipo() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data: l }, { data: d }] = await Promise.all([db.rpc('ciclo_equipo'), db.rpc('ciclo_rango')]);
  if (!$('cfgcuerpo') || TAB !== 'ciclo') return;
  const f = l || [], rg = (d || [])[0];
  caja.innerHTML = `<div class="cicpag">${rg ? `<p class="sm">${esc(cicNombre(rg.meses).replace(/^./, c => c.toUpperCase()))} del ${fechaCorta(rg.desde)} al ${fechaCorta(rg.hasta)} · A ${cicVis(rg.obj_a)}, B ${rg.obj_b} y C ${rg.obj_c} por ${TT('medico', 's', '', 'l', 'l')}.</p>` : ''}
    ${f.length ? `<div class="card cicbloque"><div class="dgrid-wrap"><table class="trtabla cictab"><thead><tr><th>Persona</th><th>Cartera</th><th>A</th><th>B</th><th>C</th><th>Sin clase</th><th>Al día</th><th>${TT('visita', 'p', '', 'l', 'C')} del ciclo</th></tr></thead>
      <tbody>${f.map(x => { const cl = x.a + x.b + x.c, p = x.objetivo ? Math.round(x.hechas / x.objetivo * 100) : null;
        return `<tr><td><button type="button" class="lnk" data-cde="${x.id}"><b>${esc(x.nombre)}</b></button><span class="sm"> · ${esc(x.rol)}</span></td><td>${num(x.cartera)}</td><td>${num(x.a)}</td><td>${num(x.b)}</td><td>${num(x.c)}</td>
          <td class="${x.sin_clase ? 'cicaviso' : ''}">${num(x.sin_clase)}</td><td>${cl ? `${num(x.al_dia)} de ${num(cl)}` : '—'}</td>
          <td>${p == null ? '—' : `<span class="cicbarc"><span class="cicbar"><i style="width:${p}%"></i></span>${num(x.hechas)} de ${num(x.objetivo)} · ${p}%</span>`}</td></tr>`; }).join('')}</tbody></table></div></div>
      <p class="sm">Cada ${TT('medico', 's', '', 'l', 'l')} cuenta hasta las ${TT('visita', 'p', '', 'l', 'l')} de su clase (si tiene más, no compensan las que faltan en otro). Pulsa una persona para ver su ciclo.</p>`
      : '<div class="vacio">Nadie del equipo tiene cartera asignada.</div>'}</div>`;
  caja.querySelectorAll('[data-cde]').forEach(b => b.onclick = () => { CIC_DE = b.dataset.cde; cicIrA('ciclo'); });
}

// Ficha: la clase y las visitas del ciclo, en el bloque «Estado»
async function cicFicha(id) {
  const { data: c } = await db.rpc('ciclo_de_cuenta', { p_id: id });
  const box = $('fciclo'); if (!c || !box || FICHA_ID !== id) return;
  box.innerHTML = `<span class="sm cicfl">Clase</span>${puedeEditar() ? cicSegs(id, c.clase) : cicPill(c.clase)}
    <span class="sm">${c.clase ? (c.objetivo ? `${c.hechas} de ${cicVis(c.objetivo)} este ${cicNombre(c.meses)}` : `${cicVis(c.hechas)} este ${cicNombre(c.meses)} · su clase no pide ${TT('visita', 'p', '', 'l', 'l')}`) : `Sin clasificar · ${cicVis(c.hechas)} este ${cicNombre(c.meses)}`}</span>`;
}
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (ES_MEDICO() || $('fciclo') || FICHA_ID !== id) return r;
    const est = [...$('fbody').querySelectorAll('.blk > h3')].find(h => h.textContent.trim() === 'Estado');
    if (!est) return r;
    est.parentElement.insertAdjacentHTML('beforeend', '<div class="fciclo" id="fciclo"></div>');
    await cicFicha(id);
  } catch (e) {}
  return r;
})(abrirFicha);
$('dlg').addEventListener('close', () => { if (TAB === 'ciclo' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open && TAB === 'ciclo') (PAGINAS.ciclo.tabs.find(x => x[0] === (PAG_TAB.ciclo || 'ciclo')) || PAGINAS.ciclo.tabs[0])[2](); }, 300); });
$('ficha').addEventListener('close', () => { if (TAB === 'ciclo' && $('cfgcuerpo')) setTimeout(() => { if (!$('ficha').open && TAB === 'ciclo') (PAGINAS.ciclo.tabs.find(x => x[0] === (PAG_TAB.ciclo || 'ciclo')) || PAGINAS.ciclo.tabs[0])[2](); }, 300); });
try { menuCiclo(); } catch (e) {}
/* v2.198.0 · Cobertura por producto en el ciclo (segunda tanda, «Panel y ciclos», SQL 124). Decisiones de Eric: la cobertura mide los
   productos presentados en las visitas, y solo salen los que la administración marca como «Se promociona en las visitas».
   - Producto: casilla «Se promociona en las visitas».
   - Registrar visita: «Productos presentados» (los que se promocionan); el historial de la ficha dice qué se presentó.
   - Ciclo de visitas → «Por producto»: por cada producto, cuántos de A, B y C lo han oído este ciclo y a quiénes les falta (con «+ Cita»). */
let PROMO_PRODS = null;   // [{ id, nombre }] de los productos que se promocionan (última lista leída)
// v2.199.0: la cobertura por producto va en los planes Comercial, Empresa y A medida (decisión de Eric, como en la web)
PLAN_SECCIONES.cobertura = ['comercial', 'empresa', 'medida'];
async function productosPromocionados() {
  if (!navigator.onLine) return PROMO_PRODS || [];   // v2.259.0: sin red, la última lista leída
  try {
    const { data, error } = await db.from('productos').select('id,nombre,estado').eq('promocionado', true).order('nombre');
    if (!error) PROMO_PRODS = (data || []).filter(p => (p.estado || 'Activo') !== 'Descatalogado').map(p => ({ id: p.id, nombre: p.nombre }));
  } catch (e) {}
  return PROMO_PRODS || [];
}
editorProducto = (orig => function (p, ...r) {
  const x = orig.call(this, p, ...r);
  setTimeout(async () => {
    if (!puede('administrar') || !planIncluyeSeccion('cobertura') || !$('dbody') || !$('prok') || $('prpromo') || !p || !p.id) return;
    const ref = $('dbody').querySelector('.acts:last-of-type'); if (!ref) return;
    const { data: m } = await db.from('productos').select('promocionado').eq('id', p.id).maybeSingle();
    if (!$('dbody') || $('prpromo') || !m) return;
    ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="prpromo"><h3>Promoción</h3>
      <label class="opt"><input type="checkbox" id="prpromoc" ${m.promocionado ? 'checked' : ''}> Se promociona en las ${TT('visita', 'p', '', 'l', 'l')}</label>
      <p class="sm">Sale en «Registrar ${TT('visita', 's', '', 'l', 'l')}» para marcarlo como presentado, y en la cobertura por producto del ciclo.</p></div>`);
    $('prpromoc').onchange = async e => {
      const { error } = await db.from('productos').update({ promocionado: e.target.checked }).eq('id', p.id);
      toast(error ? 'No se ha podido guardar: ' + error.message : (e.target.checked ? 'Se promociona en las ' + TT('visita', 'p', '', 'l', 'l') : 'Ya no se promociona'), !!error);
      if (!error) PROMO_PRODS = null;
    };
  }, 140);
  return x;
})(editorProducto);

abrirVisitaBase = (orig => async function (id, ...r) {
  const res = await orig.call(this, id, ...r);
  try {
    const d = $('dbody'), ancla = $('vmodo');
    if (!d || !ancla || $('vprods') || !VISITA_ACTUAL || VISITA_ACTUAL.id !== id || !planIncluyeSeccion('cobertura')) return res;
    const l = await productosPromocionados();
    if (!l.length || !$('vmodo') || $('vprods') || !VISITA_ACTUAL || VISITA_ACTUAL.id !== id) return res;
    VISITA_ACTUAL.productos = [];
    ancla.insertAdjacentHTML('afterend', `<label>Productos presentados</label>
      <div class="opciones" id="vprods">${l.map(p => `<button type="button" class="opt" data-vprod="${p.id}" aria-pressed="false"><span class="mk"></span>${esc(p.nombre)}</button>`).join('')}</div>`);
    d.querySelectorAll('[data-vprod]').forEach(b => b.onclick = () => {
      if (!VISITA_ACTUAL) return;
      const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on));
      VISITA_ACTUAL.productos = [...d.querySelectorAll('[data-vprod][aria-pressed=true]')].map(x => x.dataset.vprod);
    });
  } catch (e) {}
  return res;
})(abrirVisitaBase);
escribirRpc = (orig => async function (fn, payload, ...a) {
  const va = VISITA_ACTUAL;
  if (fn === 'registrar_actividad' && va && va.productos && payload && payload.p && payload.p.cuenta_id === va.id) payload.p.productos = va.productos.slice();
  return orig.call(this, fn, payload, ...a);
})(escribirRpc);

// Historial de la ficha: qué productos se presentaron en cada visita
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    const filas = [...document.querySelectorAll('#fbody [data-vrow]')];
    if (!filas.length || document.querySelector('#fbody .vprodtx')) return r;
    const { data } = await db.from('actividades').select('id,productos').in('id', filas.map(f => f.dataset.vrow));
    const ids = [...new Set((data || []).flatMap(x => x.productos || []))];
    if (!ids.length || FICHA_ID !== id) return r;
    const { data: ps } = await db.from('productos').select('id,nombre').in('id', ids);
    const nom = Object.fromEntries((ps || []).map(p => [p.id, p.nombre]));
    (data || []).forEach(x => {
      const f = document.querySelector(`#fbody [data-vrow="${x.id}"]`), sitio = f && f.querySelector('span');
      const n = (x.productos || []).map(k => nom[k]).filter(Boolean);
      if (sitio && n.length && !f.querySelector('.vprodtx')) sitio.insertAdjacentHTML('beforeend', `<div class="sm vprodtx">Presentado: ${n.map(esc).join(', ')}</div>`);
    });
  } catch (e) {}
  return r;
})(abrirFicha);

// Ciclo de visitas → «Por producto»
async function pintarCobertura() {
  const caja = $('cfgcuerpo'); if (!caja) return;
  const [{ data: d, error }, sel] = await Promise.all([db.rpc('ciclo_cobertura', { p_usuario: cicUsuario() }), cicSelectorDe()]);
  if (!$('cfgcuerpo') || TAB !== 'ciclo') return;
  if (error || !d) { caja.innerHTML = '<div class="vacio">No se ha podido cargar la cobertura.</div>'; return; }
  const l = d.productos || [];
  const fila = (k, x) => { const p = x.cuentas ? Math.round(x.presentado / x.cuentas * 100) : 0;
    return `<div class="cobf">${cicPill(k)}<span class="cicbar"><i style="width:${p}%"></i></span><span class="cobn"><b>${num(x.presentado)} de ${num(x.cuentas)}</b> · ${p}%</span></div>`; };
  caja.innerHTML = `<div class="cicpag"><div class="ciccab"><div><b>${esc(cicNombre(d.meses).replace(/^./, c => c.toUpperCase()))} del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}</b>
      <span class="sm">Cuántos ${TT('medico', 'p', '', 'l', 'l')} de cada clase han oído hablar de cada producto en sus ${TT('visita', 'p', '', 'l', 'l')} de este ${cicNombre(d.meses)}</span></div>
      <span class="cicacc">${sel}</span></div>
    ${!l.length ? `<div class="vacio">Ningún producto se promociona todavía.${puede('administrar') ? ' Márcalo en Productos: abre el producto y activa «Se promociona en las ' + TT('visita', 'p', '', 'l', 'l') + '».' : ''}</div>`
    : !d.cuentas ? `<div class="vacio">Todavía no hay ${TT('medico', 'p', '', 'l', 'l')} en A, B o C: la cobertura se mide sobre los clasificados. <button type="button" class="btn sec" id="cobclas">Clasificar</button></div>`
    : `<div class="cobgrid">${l.map(p => { const tot = (p.clases || []).reduce((s, x) => ({ c: s.c + x.cuentas, p: s.p + x.presentado }), { c: 0, p: 0 });
        return `<section class="card cobcard"><div class="cobcab"><h2>${esc(p.nombre)}</h2><span class="cobtot">${tot.c ? Math.round(tot.p / tot.c * 100) : 0}%</span></div>
          ${(p.clases || []).map(x => fila(x.clase, x)).join('')}
          ${(p.faltan || []).length ? `<details class="cobfal"><summary>A quién le falta${tot.c - tot.p > (p.faltan || []).length ? ` (los ${p.faltan.length} primeros de ${num(tot.c - tot.p)})` : ` (${num(p.faltan.length)})`}</summary>
            <div class="lista">${p.faltan.map(m => `<div class="item cicrow">${cicPill(m.clase)}<span class="tx"><button type="button" class="lnk" data-cfi="${m.id}"><b>${esc(m.nombre)}</b></button>
              <span class="sm">${esc([m.especialidad, m.municipio].filter(Boolean).join(' · '))}</span></span><button type="button" class="btn sec" data-ccita="${m.id}">+ Cita</button></div>`).join('')}</div></details>`
            : '<div class="banda-ok cobok">Todos lo han oído este ' + cicNombre(d.meses) + '.</div>'}</section>`; }).join('')}</div>`}</div>`;
  if ($('cicde')) $('cicde').onchange = e => { CIC_DE = e.target.value; pintarCobertura(); };
  if ($('cobclas')) $('cobclas').onclick = () => { CIC_CLF = 'sin'; cicIrA('clasificar'); };
  caja.querySelectorAll('[data-cfi]').forEach(b => b.onclick = () => abrirFicha(b.dataset.cfi));
  caja.querySelectorAll('[data-ccita]').forEach(b => b.onclick = () => nuevaCita(b.dataset.ccita));
}
/* v2.199.0 · Intervenciones con lote y número de serie (tercera tanda del estudio por sectores, SQL 125). Decisiones de Eric: sección propia y
   cada intervención también en la Agenda de quien asiste; el material se elige en cada intervención (depósito del centro o el de quien asiste); el
   número de serie se apunta al usar; lo usado crea el pedido en borrador al centro y una reposición con plazo de 48 horas que avisa.
   - Menú «Intervenciones» (en «Tu día»): reposiciones pendientes (las vencidas, marcadas), próximas y hechas en los últimos 30 días; «+ Nueva intervención».
   - Ventana de la cirugía: datos, «Registrar lo usado» (por lote, con un número de serie por unidad y la referencia del paciente sin
     datos de salud), lo usado con su lote y serie, el pedido y «Reponer ahora».
   - Ficha del responsable o del centro: sus últimas intervenciones. Los avisos de reposición vencida abren la intervención. */
const CIR_ORIGEN = [['deposito', 'Depósito del centro'], ['personal', 'Material de quien asiste']];
const cirHora = c => c.hora ? String(c.hora).slice(0, 5) : '';
const cirRepo = c => c.reposicion === 'vencida' ? '<span class="pill p-urg">Reposición vencida</span>'
  : c.reposicion === 'pendiente' ? `<span class="pill p-warn">Reponer antes del ${esc(new Date(c.reposicion_limite).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span>`
  : c.reposicion === 'repuesta' ? '<span class="pill p-est">Repuesta</span>' : '';
const cirEstado = c => `<span class="pill ${c.estado === 'Hecha' ? 'p-est' : c.estado === 'Anulada' ? 'p-anu' : 'p-per'}">${esc(c.estado)}</span>`;
const CIR_ERR = { permiso: 'No puedes cambiar esta intervención', faltan: 'Faltan la fecha, el centro o el responsable', hospital: 'El centro tiene que ser una ficha de tipo centro',
  sin_deposito: 'Este centro no tiene depósito: déjale material desde su ficha o elige el material de quien asiste', sin_almacen: 'Quien asiste no tiene almacén propio con material',
  hecha: 'La intervención ya está hecha: no se puede cambiar', sin_stock: 'No hay bastante en el almacén de la intervención', series: 'Hay más números de serie que unidades',
  linea: 'Revisa las unidades de cada línea', vacio: 'Apunta al menos una unidad usada', anulada: 'La intervención está anulada', no_hecha: 'Primero registra lo usado',
  sin_origen: 'No hay almacén central del que reponer', cirujano: 'Elige un responsable de tu empresa', asistente: 'Quien asiste tiene que ser una persona activa del equipo',
  valores: 'Revisa de dónde sale el material' };
const cirError = r => CIR_ERR[r && r.error] || 'No se ha podido guardar';
Object.assign(ICON_NOM, { scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>' });
ICO_NAV.cirugias = 'scissors'; ICO_MOD.cirugias = svgIco(ICON_NOM.scissors);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'dia'); if (g && !g.items.includes('cirugias')) g.items.push('cirugias'); })();
function menuCirugias() {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let b = nav.querySelector('[data-t="cirugias"]');
  if (!b) { const tras = nav.querySelector('[data-t="ciclo"]') || nav.querySelector('[data-t="agenda"]'); if (!tras) return; tras.insertAdjacentHTML('afterend', '<button data-t="cirugias" aria-selected="false">Intervenciones</button>'); b = nav.querySelector('[data-t="cirugias"]'); }
  b.classList.toggle('hide', !!(ES_MEDICO() || !puedeModulo('agenda')));
}
aplicarPermisosMenu = (orig => function (...a) { try { menuCirugias(); } catch (e) {} const r = orig.apply(this, a); try { menuCirugias(); } catch (e) {} return r; })(aplicarPermisosMenu);
PAGINAS.cirugias = { t: 'Intervenciones', permiso: () => !ES_MEDICO() && puedeModulo('agenda'), tabs: [['lista', 'Intervenciones', () => pintarCirugias()]] };
Object.defineProperty(PAGINAS.cirugias, 'd', { get: () => 'Programación, material usado con lote y número de serie, y reposición en 48 horas' });

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

irEnlace = (orig => function (e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'cirugia' && id) { verCirugia(id); return; }
  return orig.call(this, e);
})(irEnlace);

// Ficha del responsable o del centro: sus últimas intervenciones
abrirFicha = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (ES_MEDICO() || !$('fzcampos') || $('fcirugias') || !planIncluyeSeccion('cirugias')) return r;
    const { data: l } = await db.from('cirugias').select('id,fecha,procedimiento,estado').or(`cirujano_id.eq.${id},hospital_id.eq.${id}`).order('fecha', { ascending: false }).limit(5);
    if (!(l || []).length || !$('fzcampos') || $('fcirugias') || FICHA_ID !== id) return r;
    $('fzcampos').insertAdjacentHTML('beforebegin', `<div class="blk" id="fcirugias"><h3>Intervenciones</h3>
      ${l.map(x => `<div class="fmrow"><span><button type="button" class="lnk" data-fcir="${x.id}">${esc(x.procedimiento || 'Intervención')}</button><span class="sm"> · ${fechaCorta(x.fecha)}</span></span>${cirEstado(x)}</div>`).join('')}</div>`);
    $('fcirugias').querySelectorAll('[data-fcir]').forEach(b => b.onclick = () => { $('ficha').close(); verCirugia(b.dataset.fcir); });
  } catch (e) {}
  return r;
})(abrirFicha);
$('dlg').addEventListener('close', () => { if (TAB === 'cirugias' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open && TAB === 'cirugias') pintarCirugias(); }, 300); });
try { menuCirugias(); } catch (e) {}
