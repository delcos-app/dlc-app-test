/* ============================================================
   DLC OS 2.0 · v2.17.0 · Velocidad, ventanas, paginación,
   duplicados, auditoría y ayudas
   ============================================================ */

/* ---------------- caché de peticiones ----------------
   Lo ya recibido se reutiliza durante unos segundos o minutos según el dato.
   Dos peticiones iguales a la vez se unifican en una sola.
   Cualquier escritura vacía la caché para que lo siguiente que se lea sea actual. */

const RPC_ORIG = db.rpc.bind(db);
const FROM_ORIG = db.from.bind(db);
const RPC_TTL = {                 // segundos
  panel_inicio: 60, propuestas_rutas: 120, comision_periodo: 120, resumen_duplicados: 600,
  agenda_rango: 60, agenda_mes: 60, pendientes_ruta: 60, rutas_visibles: 120,
  buscar_cuentas: 60, buscar_global: 60, opciones_filtros: 600, mapa_cuentas: 120,
  ficha_cuenta: 30, seguimiento_lista: 60, resumen_seguimiento: 120,
  catalogo: 900, catalogos_todos: 900, productos_lista: 600, usuarios_lista: 300,
  esquemas_lista: 300, liquidaciones_lista: 120, pedidos_lista: 60, contactos_lista: 60,
  analitica_tabla: 120, analitica_unidades: 120, cartera_usuario: 60, duplicados_pendientes: 30
};
const RPC_ESCRITURA = /^(actualizar_|anular_|aplazar_|asignar_|recibir_|movimiento_|atribuir_|borrar_|crear_|estado_cita|guardar_|liquidar|ordenar_|perfil_nuevo|quitar_|registrar_actividad|registrar_visita|resolver_accion|tocar|unificar_|descartar_)/;

const RC = new Map(), RC_VUELO = new Map();
let RC_EPOCA = 0;
const rcLS = k => 'dlc-rc-' + (PERFIL ? PERFIL.id : '') + '-' + k;
const rcCopia = r => ({ data: r.data == null ? r.data : JSON.parse(JSON.stringify(r.data)), error: r.error || null });


// Las peticiones de Supabase no traen .catch ni .finally: se añaden para que el código que los usa no falle.
const conCatch = b => {
  if (b && typeof b.then === 'function' && typeof b.catch !== 'function') {
    b.catch = f => Promise.resolve(b).catch(f);
    b.finally = f => Promise.resolve(b).finally(f);
  }
  return b;
};
db.rpc = function (fn, params, opts) {
  if (RPC_ESCRITURA.test(fn)) { invalidarCache(); return conCatch(RPC_ORIG(fn, params, opts)); }
  const ttl = RPC_TTL[fn];
  if (!ttl || !navigator.onLine) return conCatch(RPC_ORIG(fn, params, opts));

  const k = fn + '|' + JSON.stringify(params || {});
  let e = RC.get(k);
  if (!e && ttl >= 300) {           // los datos que cambian poco se guardan también en el dispositivo
    try { e = JSON.parse(localStorage.getItem(rcLS(k)) || 'null'); if (e) RC.set(k, e); } catch (err) { e = null; }
  }
  if (e && Date.now() - e.t < ttl * 1000) return Promise.resolve(rcCopia(e.r));
  if (RC_VUELO.has(k)) return RC_VUELO.get(k).then(rcCopia);

  const epoca = RC_EPOCA;
  const p = Promise.resolve(RPC_ORIG(fn, params, opts)).then(r => {
    RC_VUELO.delete(k);
    if (!r.error && epoca === RC_EPOCA) {
      const x = { t: Date.now(), r: { data: r.data, error: null } };
      RC.set(k, x);
      if (ttl >= 300) { try { localStorage.setItem(rcLS(k), JSON.stringify(x)); } catch (err) {} }
    }
    return r;
  }, err => { RC_VUELO.delete(k); throw err; });
  RC_VUELO.set(k, p);
  return p.then(rcCopia);
};

db.from = function (tabla) {
  const q = FROM_ORIG(tabla);
  ['insert', 'update', 'upsert', 'delete'].forEach(m => {
    const f = q[m];
    if (typeof f === 'function') q[m] = (...a) => { invalidarCache(); return f.apply(q, a); };
  });
  return q;
};

/* ---------------- navegación: recordar de dónde venimos ---------------- */

let TAB_ANTERIOR = 'inicio';

/* ---------------- inicio: un único cargador hasta tenerlo todo ---------------- */

let INI_LISTO = false, INI_EN_CURSO = null, INI_OTRA = false, DUP_RES = null;

function cargarInicio() {
  if (TAB !== 'inicio') return Promise.resolve();       // se cargará al entrar en Inicio
  if (INI_EN_CURSO) { INI_OTRA = true; return INI_EN_CURSO; }
  INI_OTRA = false;
  INI_EN_CURSO = pintarInicio().catch(err => console.error(err)).finally(() => {
    INI_EN_CURSO = null;
    if (INI_OTRA && TAB === 'inicio') cargarInicio();
  });
  return INI_EN_CURSO;
}


/* ---------------- ventanas y paneles: se cierran al pulsar fuera ---------------- */

let PTR_ABAJO = null, TRAGAR_CLIC = false;
document.addEventListener('click', e => {
  if (!TRAGAR_CLIC) return;
  TRAGAR_CLIC = false; e.preventDefault(); e.stopPropagation();
}, true);
document.addEventListener('pointerdown', e => {
  PTR_ABAJO = e.target;
  const t = $('tools');
  if (t.classList.contains('abierto') && !t.contains(e.target) && !e.target.closest('#tools2')
      && !e.target.closest('#dirtools, #segtools, #antools, .htbtn') && !document.querySelector('dialog[open]')) {
    t.classList.remove('abierto');
    TRAGAR_CLIC = true;              // el clic que cierra el panel no activa lo que hay debajo
  }
  const pop = document.querySelector('.aipop');
  if (pop && !pop.contains(e.target) && !e.target.closest('.ai')) pop.remove();
}, true);

// Solo cierra si el clic empieza y acaba fuera (así no se cierra al seleccionar texto y soltar fuera).
['ficha', 'dlg', 'dlg2'].forEach(id => {
  const d = $(id);
  d.addEventListener('click', e => { if (e.target === d && PTR_ABAJO === d) { if (id === 'ficha') d.close(); else intentarCerrar(d); } });
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  $('tools').classList.remove('abierto');
  const pop = document.querySelector('.aipop'); if (pop) pop.remove();
});

/* ---------------- paginación ---------------- */

const TAMKEY = () => 'dlc-tam-' + (PERFIL ? PERFIL.id : '');
const TAMANOS = [20, 50, 100];


/** Paginador para listas que se piden al servidor por páginas. */
function paginador(el, total, pagina, alCambiar, alCambiarTam) {
  if (!el) return;
  const tam = tamPagina();
  if (total <= TAMANOS[0]) { el.innerHTML = ''; return; }
  el.innerHTML = pagHTML(total, pagina, tam);
  el.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => alCambiar(+b.dataset.pg));
  el.querySelector('[data-pgtam]').onchange = e => { fijarTam(+e.target.value); alCambiarTam(); };
}

/* Paginación automática de cualquier otra lista o tabla con más de 20 filas. */
const PAG_MEM = {};
const PAG_EXCLUIR = '.carsel, .picker, #lista, #slista, #kpis, .gsug, .umenu, .dl-menu, #tools, .opciones, .chips, .pag, #c-agenda, #c-acciones, #c-urgentes, #c-ultimas, #c-recom, #c-pend';


let T_OBS = null;
new MutationObserver(muts => {
  if (muts.every(m => m.target.nodeType === 1 && m.target.closest('.pag, .aipop'))) return;
  clearTimeout(T_OBS);
  T_OBS = setTimeout(() => { paginarListas(); ponerAyudas(); }, 40);
}).observe(document.body, { childList: true, subtree: true });

/* ---------------- duplicados: pantalla propia ---------------- */

let DUP_PEND = [], DUP_PARES = [], DUP_ACTUAL = null;

async function cargarDuplicados() {
  const v = $('v-duplicados');
  const permitido = puede('administrar') || ((PERFIL.areas || {}).M || 0) >= 3;
  v.innerHTML = `
    <div class="saludo"><div><h1>Duplicados</h1>
      <div class="fecha">Revisa fichas repetidas y unifícalas sin perder la lista</div></div>
      <div class="acts" style="margin:0">
        <button class="btn sec" id="dvolver">← Volver</button>
        <button class="btn sec" id="dbuscar">Volver a buscar parecidos</button></div></div>
    ${permitido ? `<div class="dupgrid">
      <div><div class="card" id="dpendc"></div><div class="card" id="dparc"></div></div>
      <div class="card dupcmp" id="dcmp"><div class="vacio vguia"><b>Elige una pareja para revisarla</b><span>Pulsa «Comparar» en la lista de la izquierda y aquí verás las dos fichas lado a lado. Al terminar, pasas a la siguiente.</span></div></div>
    </div>` : '<div class="card"><div class="vacio">Solo administración puede unificar fichas.</div></div>'}`;
  $('dvolver').onclick = () => ir(TAB_ANTERIOR && TAB_ANTERIOR !== 'duplicados' ? TAB_ANTERIOR : 'directorio');
  if (!permitido) { $('dbuscar').classList.add('hide'); return; }
  $('dbuscar').onclick = () => { invalidarCache(); listasDuplicados(); };
  listasDuplicados();
}


function pintarListasDup() {
  if (!$('dpendc')) return;
  const sel = DUP_ACTUAL ? DUP_ACTUAL.join('|') : '';
  $('dpendc').innerHTML = `<h2>Pendientes de unificar<span class="n">${DUP_PEND.length}</span></h2>
    <p class="sm">Fichas marcadas como posible duplicado al darlas de alta.</p>
    <div class="lista" id="dpendl">${DUP_PEND.map(x => `<div class="item ${x.par_id && sel === x.id + '|' + x.par_id ? 'sel' : ''}" style="cursor:default">
      <span class="ic w">${x.pct ? x.pct + '%' : '?'}</span>
      <span class="tx"><b>${esc(x.nombre)}</b>
        <span class="sm">Código ${esc(x.codigo)} · ${esc(x.centro || '')} ${esc(x.municipio || '')}</span>
        <span class="sm">${x.par_nombre ? 'Se parece a ' + esc(x.par_nombre) : 'Sin pareja identificada'}</span></span>
      <span class="acts" style="margin:0">
        ${x.par_id ? `<button class="btn" data-dcmp="${x.id}|${x.par_id}">Comparar</button>
          <button class="btn sec" data-ddes="${x.id}|${x.par_id}">No es duplicado</button>` : ''}
        <button class="btn sec" data-dver="${x.id}">Ficha</button></span></div>`).join('')
      || '<div class="vacio">No hay fichas pendientes de unificar.</div>'}</div>`;

  $('dparc').innerHTML = `<h2>Nombres parecidos<span class="n">${DUP_PARES.length}</span></h2>
    <p class="sm">Parejas con un parecido del 80% o más. Si no son la misma persona, márcalas como distintas y no volverán a salir.</p>
    <div class="lista" id="dparl">${DUP_PARES.map(p => `<div class="item ${sel === p.a_id + '|' + p.b_id ? 'sel' : ''}" style="cursor:default">
      <span class="ic">${p.pct}%</span>
      <span class="tx"><b>${esc(p.a_nombre)}</b><span class="sm">${esc(p.b_nombre)} · códigos ${esc(p.a_codigo)} y ${esc(p.b_codigo)}</span></span>
      <span class="acts" style="margin:0">
        <button class="btn" data-dcmp="${p.a_id}|${p.b_id}">Comparar</button>
        <button class="btn sec" data-ddes="${p.a_id}|${p.b_id}">No son duplicados</button></span></div>`).join('')
      || '<div class="vacio">Sin parejas parecidas pendientes de revisar.</div>'}</div>`;
}

document.addEventListener('click', async e => {
  if (TAB !== 'duplicados') return;
  const c = e.target.closest('[data-dcmp]'), f = e.target.closest('[data-dver]'), d = e.target.closest('[data-ddes]');
  if (c) {
    DUP_ACTUAL = c.dataset.dcmp.split('|');
    $('v-duplicados').querySelectorAll('.item.sel').forEach(x => x.classList.remove('sel'));
    if (c.closest('.item')) c.closest('.item').classList.add('sel');
    compararEn($('dcmp'), DUP_ACTUAL[0], DUP_ACTUAL[1]);
    if (window.innerWidth <= 900) $('dcmp').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  if (f) abrirFicha(f.dataset.dver);
  if (d) {
    const [a, b] = d.dataset.ddes.split('|');
    d.disabled = true;
    const { data: r, error } = await db.rpc('descartar_duplicado', { p_a: a, p_b: b });
    if (error || (r && r.ok === false)) { d.disabled = false; toast('No se ha podido guardar', true); return; }
    const par = (p, x, y) => (p === x || p === y);
    DUP_PARES = DUP_PARES.filter(p => !(par(p.a_id, a, b) && par(p.b_id, a, b)));
    DUP_PEND = DUP_PEND.filter(p => !(par(p.id, a, b) && par(p.par_id, a, b)));
    if (DUP_ACTUAL && DUP_ACTUAL.includes(a) && DUP_ACTUAL.includes(b)) { DUP_ACTUAL = null; panelDupVacio('Marcadas como personas distintas.'); }
    pintarListasDup(); toast('Marcadas como distintas');
  }
});


async function compararEn(el, idA, idB) {
  cargando(el, 'Cargando las dos fichas…');
  const [{ data: A }, { data: B }] = await Promise.all([
    db.rpc('ficha_cuenta', { p_id: idA }), db.rpc('ficha_cuenta', { p_id: idB })
  ]);
  if (!A || !B || !A.medico || !B.medico) { el.innerHTML = '<div class="vacio">Alguna de las dos fichas ya no existe.</div>'; return; }
  const a = A.medico, b = B.medico;
  const ctx = { A, B };
  let queda = b.id;
  const eleccion = {};
  CAMPOS_UNI.forEach(([k]) => eleccion[k] = b[k] ? 'queda' : (a[k] ? 'va' : 'queda'));
  const resumen = (m, x) => `${num((x.consultas || []).length)} ${TT('consulta', 'p', '', 'l', 'l')} · ${num((x.visitas || []).length)} ${TT('visita', 'p', '', 'l', 'l')}`;

  const pinta = () => {
    const va = queda === a.id ? b : a, qu = queda === a.id ? a : b;
    const dif = CAMPOS_UNI.filter(([k]) => (a[k] || '') !== (b[k] || ''));
    el.innerHTML = `<div class="fbox">
      <div class="fh"><div><h2>Comparar fichas</h2>
        <div class="sm">Elige cuál se conserva y con qué datos. ${TT('consulta', 'p', '', 'l', 'C')}, ${TT('visita', 'p', '', 'l', 'l')}, citas y cartera se juntan en la que quede.</div></div>
        <button class="x" id="dcx" aria-label="Cerrar">✕</button></div>
      <div class="opciones">
        ${[[a, ctx.A], [b, ctx.B]].map(([m, x]) => `<button class="opt" data-queda="${m.id}" aria-pressed="${queda === m.id}">
          <span class="mk"></span><span><b>${esc(m.nombre)}</b><br>
          <span class="sm">Código ${esc(m.codigo)} · ${resumen(m, x)}</span><br>
          <span class="sm">${queda === m.id ? 'Se conserva esta' : 'Desaparece'}</span></span></button>`).join('')}
      </div>
      <div class="acts"><button class="btn sec" data-dver="${a.id}">Ver ficha de ${esc(a.codigo)}</button>
        <button class="btn sec" data-dver="${b.id}">Ver ficha de ${esc(b.codigo)}</button></div>
      ${dif.length ? `<div>${dif.map(([k, t]) => `
        <label>${t}</label>
        <div class="opciones">
          <button class="opt" data-campo="${k}|queda" aria-pressed="${eleccion[k] === 'queda'}"><span class="mk"></span>${esc(qu[k] || '(vacío)')}</button>
          <button class="opt" data-campo="${k}|va" aria-pressed="${eleccion[k] === 'va'}"><span class="mk"></span>${esc(va[k] || '(vacío)')}</button>
        </div>`).join('')}</div>` : '<p class="sm" style="margin-top:12px">Los datos principales coinciden.</p>'}
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-ddes="${a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id}">No son duplicados</button>
        <button class="btn dang" id="duniok">Unificar</button></div></div>`;

    $('dcx').onclick = () => { DUP_ACTUAL = null; $('v-duplicados').querySelectorAll('.item.sel').forEach(x => x.classList.remove('sel')); panelDupVacio(''); };
    el.querySelectorAll('[data-queda]').forEach(x => x.onclick = () => { queda = x.dataset.queda; pinta(); });
    el.querySelectorAll('[data-campo]').forEach(x => x.onclick = () => {
      const [k, v] = x.dataset.campo.split('|'); eleccion[k] = v; pinta();
    });
    $('duniok').onclick = async ev => {
      const desaparece = queda === a.id ? b.id : a.id;
      if (!await preguntar(`Desaparece la ficha de ${queda === a.id ? b.nombre : a.nombre}.\nNo se puede deshacer desde la app.`,
        { titulo: '¿Unificar fichas?', ok: 'Unificar', peligro: true })) return;
      ev.target.disabled = true; ev.target.textContent = 'Unificando…';
      const { data: r, error } = await db.rpc('unificar_cuentas', { p: { queda, va: desaparece, campos: eleccion } });
      if (error || (r && r.ok === false)) { ev.target.disabled = false; ev.target.textContent = 'Unificar'; toast('No se ha podido unificar', true); return; }
      toast('Fichas unificadas');
      DUP_PARES = DUP_PARES.filter(p => p.a_id !== desaparece && p.b_id !== desaparece);
      DUP_PEND = DUP_PEND.filter(p => p.id !== desaparece && p.par_id !== desaparece);
      DUP_ACTUAL = null; pintarListasDup(); panelDupVacio('Fichas unificadas.');
      $('lista').innerHTML = '';                 // el directorio se recarga al volver
    };
  };
  pinta();
}

/* ---------------- auditoría con filtro por usuario ---------------- */


/* ---------------- ayudas (i) en pantallas, tarjetas e indicadores ---------------- */

const AYUDA_KPI = {
  citas: 'Citas de hoy que ya están marcadas como visitadas, sobre el total de citas del día. Las descartadas no cuentan.',
  urgentes: `${TT('medico', 'p', '', 'l', 'C', 'marcado')} como urgentes que todavía no tienen ${TT('visita', 's', 'ningun', 'l', 'l')}. Pulsa para verlos en el Directorio.`,
  visitas_sem: `${TT('visita', 'p', '', 'l', 'C', 'registrado')} desde el lunes de esta semana.`,
  visitas_mes: `${TT('visita', 'p', '', 'l', 'C', 'registrado')} desde el día 1 de este mes.`,
  interesados: `${TT('medico', 'p', '', 'l', 'C')} en estado «${estadoPapel('interes') || 'interés'}». El siguiente paso es conseguir ${TT('pauta', 's', 'primer', 'l', 'l')}. Pulsa para verlos.`,
  sin_contactar: `${TT('medico', 'p', '', 'l', 'C')} a los que todavía no se ha presentado el producto. Pulsa para verlos.`,
  cartera: `${TT('medico', 'p', '', 'l', 'C')} que puedes ver: tu cartera asignada o, si eres de administración o televenta, toda la base.`,
  dups: 'Fichas marcadas como posible duplicado al darlas de alta. Pulsa para revisarlas y unificarlas.',
  filtro: `Indicador creado con «Guardar filtro» en el Directorio. Cuenta ahora mismo ${TT('medico', 'p', 'el', 'l', 'l')} que cumplen ese filtro. Pulsa para ver la lista.`
};

const AYUDA = {
  inicio: ['Tu inicio', 'El resumen de tu día.', [`Pulsa un indicador para ver la lista de ${TT('medico', 'p', '', 'l', 'l')} que cuenta.`,
    'Con «⚙ Personalizar indicadores» eliges cuáles ver y en qué orden, y añades filtros guardados.']],
  ini_agenda: ['Tu agenda de hoy', 'Citas de hoy ordenadas por hora. En verde, las ya visitadas.',
    ['Para añadir citas, ve a Agenda o planifica una ruta.', `Pulsa ${TT('medico', 's', 'un', 'l', 'l')} para abrir su ficha y registrar ${TT('visita', 's', 'el', 'l', 'l')}.`]],
  ini_acciones: ['Próximas acciones', `La próxima acción que quedó apuntada en la ${TT('visita', 's', 'ultimo', 'l', 'l')} de cada ${TT('medico', 's', '', 'l', 'l')}, para los próximos 7 días.`,
    ['En naranja, las que ya han pasado de fecha.', 'Márcalas como hechas o aplázalas desde Seguimiento.']],
  ini_urgentes: ['Urgentes sin visitar', `${TT('medico', 'p', '', 'l', 'C', 'marcado')} como urgentes que aún no tienen ${TT('visita', 's', 'ningun', 'l', 'l')}.`,
    ['El motivo de urgencia se ve en su ficha.', 'Desde Rutas puedes planificar una ruta solo con urgentes.']],
  ini_ultimas: [`${TT('visita', 'p', 'ultimo', 'C', 'l')}`, `${TT('visita', 'p', 'el', 'C', 'l', 'registrado')} más recientes, con su resultado.`, []],
  ini_recom: ['Rutas sugeridas', 'Listas calculadas cada día con tus datos. Al pulsar una, se planifica la ruta del día.',
    ['«Atienden hoy»: atienden este día de la semana y no se visitan desde hace más de 14 días.',
     `«${TT('medico', 'p', '', 'l', 'C', 'interesado')}»: en estado «${estadoPapel('interes') || 'interés'}» y sin ${TT('visita', 's', '', 'l', 'l')} en 20 días.`,
     `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación: completar direcciones mejora las propuestas.`]],
  ini_pend: ['Pendientes de rutas anteriores', 'Citas que planificaste y quedaron sin visitar.',
    ['Desde Agenda puedes moverlas a hoy, cambiarlas de fecha o descartarlas.']],
  ini_comision: ['Tu actividad del mes', `Unidades atribuidas a tus ${TT('medico', 'p', '', 'l', 'l')} en el periodo.`,
    ['El tramo alcanzado se aplica a todas las unidades del periodo, no solo a las que superan el tramo.',
     'Lo que se ve (unidades o importe) lo decide administración.']],
  agenda: ['Agenda', 'Tus citas por día, semana o mes.', [`«+ Nueva cita» crea una cita con ${TT('medico', 's', 'un', 'l', 'l')}.`,
    'En cada cita puedes cambiar la hora, moverla o descartarla.',
    `Al registrar ${TT('visita', 's', 'el', 'l', 'l')} desde la ficha, la cita pasa a «Visitada».`,
    'Abajo verás los pendientes de rutas anteriores para recolocarlos.']],
  rutas: ['Rutas', 'Crea rutas y conviértelas en el plan del día.', [
    `<b>Lista fija</b>: tú eliges ${TT('medico', 'p', 'el', 'l', 'l')}. <b>Por criterios</b>: se rellena sola con los filtros (municipio, estado, días de atención…).`,
    '<b>Propuestas automáticas</b>: las mismas listas que ves en Inicio.',
    `El plan ordena las paradas por cercanía y calcula horas con la salida y la vuelta de la ruta, y los minutos por ${TT('visita', 's', '', 'l', 'l')} y entre paradas.`,
    'El navegador (Google Maps, Apple Maps o Waze) se elige en el plan o en Configuración.',
    'Al empezar la ruta aparece la barra verde con el tiempo en curso.',
    `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación. Completar la dirección y los días de atención mejora mucho las rutas.`]],
  directorio: ['Directorio', `Todos ${TT('medico', 'p', 'el', 'l', 'l')} que puedes ver.`, [
    'El buscador de arriba filtra por nombre, centro o municipio.',
    `El municipio y la provincia cuentan ${todosLos('consulta').toLowerCase()} ${TT('medico', 's', 'del', 'l', 'l')}, no solo la principal.`,
    '«⋮» abre los filtros, las columnas y las descargas.',
    '«★ Guardar filtro» convierte los filtros actuales en un indicador de Inicio.',
    '«Cerca de mí» usa la ubicación del dispositivo.',
    `Al crear ${TT('medico', 's', 'un', 'l', 'l')} o centro, la app avisa si ya existe uno parecido.`]],
  seguimiento: ['Seguimiento', `Cómo avanza cada ${TT('medico', 's', '', 'l', 'l')}.`, [
    'Los indicadores de arriba muestran el embudo por estado comercial y la calidad de los datos.',
    '«Mostrar» filtra por visitados, sin visitar, con próxima acción o atrasados.',
    '«Hecha» cierra la próxima acción; «Aplazar» le pone otra fecha.',
    'Las descargas están en «⋮».']],
  ventas: ['Ventas', 'Pedidos y unidades atribuidas.', [
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y al comercial que lo tenía asignado en ese momento.`,
    'La venta a centro se atribuye a la ficha del centro, si la tiene; si no, a nadie.',
    `Si un pedido no tiene ${TT('medico', 's', '', 'l', 'l', 'reconocido')}, se puede encontrar filtrando la lista de pedidos para asignarlo a mano.`,
    'Solo televenta y administración crean o cambian pedidos.']],
  analitica: ['Analítica', 'Unidades o importe agrupados como elijas.', [
    `Elige la dimensión: ${TT('medico', 's', '', 'l', 'l')}, comercial, producto, municipio, mes o canal.`,
    'La tabla por meses sirve para ver tendencias.',
    'Las descargas están en «⋮».']],
  config: ['Configuración', 'Ajustes de tu cuenta y de la plataforma.', [
    'Preferencias de salida y llegada: se usan para calcular las rutas.',
    'Al pulsar «Cómo llegar» o abrir una ruta, eliges en ese momento con qué app navegar (Google Maps, Waze o Apple Maps).',
    `Clasificadores: las opciones que aparecen al registrar ${TT('visita', 'p', '', 'l', 'l')} y en las fichas.`]],
  admin: ['Administración', 'Usuarios, permisos y control.', [
    'Permisos por área: <b>Ver</b>, <b>Editar</b> o <b>Completo</b>. Se aplican en la base de datos, no solo en la pantalla.',
    `La cartera decide qué ${TT('medico', 'p', '', 'l', 'l')} ve cada comercial.`,
    'Las comisiones se configuran por esquema y se asignan por persona.',
    'Accesos y auditoría registran entradas y cambios.']],
  duplicados: ['Duplicados', 'Fichas que pueden ser la misma persona.', [
    '<b>Pendientes</b>: marcadas al darlas de alta. <b>Nombres parecidos</b>: coincidencia del 80% o más.',
    'Al comparar eliges qué ficha queda y qué dato conservar de cada campo.',
    `${TT('consulta', 'p', '', 'l', 'C')}, ${TT('visita', 'p', '', 'l', 'l')}, citas y cartera se juntan en la ficha que queda. No se puede deshacer desde la app.`,
    '«No son duplicados» guarda la pareja como distinta y no vuelve a salir.']]
};

const ANCLAS_AYUDA = [
  ['#v-inicio .saludo h1', 'inicio'], ['#c-agenda > h2', 'ini_agenda'], ['#c-acciones > h2', 'ini_acciones'],
  ['#c-urgentes > h2', 'ini_urgentes'], ['#c-ultimas > h2', 'ini_ultimas'], ['#c-recom > h2', 'ini_recom'],
  ['#c-pend > h2', 'ini_pend'], ['#c-comision > h2', 'ini_comision'],
  ['#v-agenda .saludo h1', 'agenda'], ['#v-rutas .saludo h1', 'rutas'], ['#v-seguimiento .saludo h1', 'seguimiento'],
  ['#v-ventas .saludo h1', 'ventas'], ['#v-analitica .saludo h1', 'analitica'], ['#v-config .saludo h1', 'config'],
  ['#v-admin .saludo h1', 'admin'], ['#v-duplicados .saludo h1', 'duplicados']
];


document.addEventListener('click', e => {
  const b = e.target.closest('.ai');
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const prev = document.querySelector('.aipop');
  if (prev) { const mismo = prev.__de === b; prev.remove(); if (mismo) return; }
  let tit, cuerpo;
  if (b.dataset.ayuda) {
    const [t, x, l] = AYUDA[b.dataset.ayuda] || ['Ayuda', '', []];
    tit = esc(t); cuerpo = esc(x) + (l.length ? `<ul>${l.map(i => `<li>${i}</li>`).join('')}</ul>` : '');
  } else { tit = esc(b.dataset.ayudaTit || 'Qué es'); cuerpo = esc(b.dataset.ayudaTxt || ''); }
  const pop = document.createElement('div');
  pop.className = 'aipop'; pop.__de = b;
  pop.innerHTML = `<b>${tit}</b>${cuerpo}`;
  document.body.appendChild(pop);
  const r = b.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let x = Math.min(window.innerWidth - w - 10, Math.max(10, r.left + r.width / 2 - w / 2));
  let y = r.bottom + 8; if (y + h > window.innerHeight - 10) y = Math.max(10, r.top - h - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}, true);


