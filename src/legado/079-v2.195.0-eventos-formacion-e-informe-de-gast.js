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
aplicarPermisosMenu = (orig => function (...a) { try { menuEventos(); } catch (e) {} const r = orig.apply(this, a); try { menuEventos(); } catch (e) {} return r; })(aplicarPermisosMenu);
const verTransparencia = () => puede('administrar') || VE_TODO();
PAGINAS.eventos = { t: 'Eventos', permiso: () => !ES_MEDICO() && puedeModulo('directorio') && planIncluyeSeccion('eventos') };
Object.defineProperty(PAGINAS.eventos, 'd', { get: () => 'Talleres, cursos y congresos con sus asistentes, inscripciones y gastos' });
Object.defineProperty(PAGINAS.eventos, 'tabs', { get: () => [['lista', 'Eventos', () => pintarEventos()]].concat(verTransparencia() ? [['transparencia', 'Informe de gastos', () => pintarTransparencia()]] : []) });



$('dlg').addEventListener('close', () => { if (TAB === 'eventos' && (PAG_TAB.eventos || 'lista') === 'lista' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open) pintarEventos(); }, 300); });


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
aplicarPermisosMenu = (orig => function (...a) { try { menuCiclo(); } catch (e) {} const r = orig.apply(this, a); try { menuCiclo(); } catch (e) {} return r; })(aplicarPermisosMenu);
PAGINAS.ciclo = { permiso: () => !ES_MEDICO() && puedeModulo('agenda') };
Object.defineProperty(PAGINAS.ciclo, 't', { get: () => `Ciclo de ${TT('visita', 'p', '', 'l', 'l')}` });
Object.defineProperty(PAGINAS.ciclo, 'd', { get: () => `${TT('medico', 'p', '', 'l', 'C')} en A, B y C, y las ${TT('visita', 'p', '', 'l', 'l')} que le tocan a cada uno en cada ciclo` });
Object.defineProperty(PAGINAS.ciclo, 'tabs', { get: () => [['ciclo', 'Este ciclo', () => pintarCiclo()]].concat(planIncluyeSeccion('cobertura') ? [['cobertura', 'Por producto', () => pintarCobertura()]] : [], [['clasificar', 'Clasificar', () => pintarClasificar()]]).concat(VE_TODO() ? [['equipo', 'Equipo', () => pintarCicloEquipo()]] : []) });
const cicUsuario = () => VE_TODO() ? (CIC_DE || null) : PERFIL.id;
const cicIrA = tab => { PAG_TAB.ciclo = tab; cargarPagina('ciclo'); };



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
aplicarPermisosMenu = (orig => function (...a) { try { menuCirugias(); } catch (e) {} const r = orig.apply(this, a); try { menuCirugias(); } catch (e) {} return r; })(aplicarPermisosMenu);
PAGINAS.cirugias = { t: 'Intervenciones', permiso: () => !ES_MEDICO() && puedeModulo('agenda'), tabs: [['lista', 'Intervenciones', () => pintarCirugias()]] };
Object.defineProperty(PAGINAS.cirugias, 'd', { get: () => 'Programación, material usado con lote y número de serie, y reposición en 48 horas' });





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
