Object.assign(ICON_NOM, { gavel: '<path d="m14.5 12.5-8 8a2.12 2.12 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>' });
ICO_NAV.concursos = 'gavel'; ICO_MOD.concursos = svgIco(ICON_NOM.gavel);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (g && !g.items.includes('concursos')) g.items.splice(g.items.indexOf('ventas') + 1, 0, 'concursos'); })();
aplicarPermisosMenu = (orig => function (...a) { try { menuConcursos(); } catch (e) {} const r = orig.apply(this, a); try { menuConcursos(); } catch (e) {} return r; })(aplicarPermisosMenu);
PAGINAS.concursos = { t: 'Concursos', permiso: () => !ES_MEDICO() && puedeModulo('ventas'),
  tabs: [['marcha', 'En marcha', () => pintarConcursos('marcha')], ['contratos', 'Contratos', () => pintarConcursos('contratos')], ['cerrados', 'Cerrados', () => pintarConcursos('cerrados')]] };
Object.defineProperty(PAGINAS.concursos, 'd', { get: () => 'Pliegos, lotes adjudicados y contratos con sus precios y vencimientos' });




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

/* v2.201.0 · Parque instalado (última pieza de la tercera tanda del estudio por sectores, SQL 127). Decisiones de Eric: los equipos se dan de
   alta a mano en la ficha o al servir un pedido de un producto «equipo», con su número de serie; los avisos de vencimiento usan los días de la empresa.
   - Producto: «Es un equipo» y «Revisión cada N meses».
   - Menú «Parque instalado» (en «Ventas»): revisiones que tocan en 30 días, contratos y garantías que vencen, y todos los equipos (buscador).
   - Ventana del equipo: datos, contrato o garantía, revisiones (con «Apuntar revisión» y «Programar en la agenda») y retirarlo.
   - Ficha: «Equipos instalados» con «+ Equipo». Pedido validado con productos «equipo»: «Dar de alta los equipos» con su número de serie.
   Además (decisión de Eric en Web delcos): Intervenciones, Material en depósito, Concursos y Parque instalado, en los planes Empresa y A medida. */
Object.assign(PLAN_SECCIONES, { cirugias: ['empresa', 'medida'], deposito: ['empresa', 'medida'], concursos: ['empresa', 'medida'], parque: ['empresa', 'medida'] });
['cirugias', 'concursos'].forEach(k => { const o = PAGINAS[k].permiso; PAGINAS[k].permiso = () => o() && planIncluyeSeccion(k); });
Object.assign(ICON_NOM, { monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>' });
ICO_NAV.parque = 'monitor'; ICO_MOD.parque = svgIco(ICON_NOM.monitor);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (g && !g.items.includes('parque')) g.items.splice(g.items.indexOf('concursos') + 1, 0, 'parque'); })();
aplicarPermisosMenu = (orig => function (...a) { try { menuParque(); } catch (e) {} const r = orig.apply(this, a); try { menuParque(); } catch (e) {} return r; })(aplicarPermisosMenu);
PAGINAS.parque = { t: 'Parque instalado', permiso: () => !ES_MEDICO() && puedeModulo('ventas') && planIncluyeSeccion('parque'), tabs: [['lista', 'Equipos', () => pintarParque()]] };
Object.defineProperty(PAGINAS.parque, 'd', { get: () => 'Equipos instalados con su número de serie, contrato, garantía y revisiones' });



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

