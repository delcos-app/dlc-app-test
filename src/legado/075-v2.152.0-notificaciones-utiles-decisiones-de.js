/* v2.152.0 · Notificaciones útiles (decisiones de Eric, 3/10/2026: bandeja con acciones, avisos nuevos y tabla compacta).
   Bandeja: agrupada por Hoy / Ayer / Esta semana / Antes, filtro por área y en cada aviso su acción directa (Llamar, Nueva venta,
   Ver ficha, Citar, Registrar, Ver pedido…) más «Posponer a mañana». Ajustes: una fila por aviso con «Al momento» y «En el resumen
   del día» (excluyentes; ninguna = no recibirlo) y «Silenciar» con horario y fines de semana. Todo lo guarda notificar_datos (SQL 97). */
TIPOS_NOTIF.push(
  ['reponer', '🔄', 'Toca reponer', 'Un cliente que compra con regularidad ha pasado su intervalo habitual'],
  ['caida_ventas', '↘️', 'Caída de ventas', `${TT('medico', 's', 'un', 'l', 'C')} de tu cartera baja más de un 40 % sus ventas este mes`],
  ['visita_sin_registrar', '📝', 'Citas sin registrar', `Citas de los últimos 3 días sin ${TT('visita', 's', '', 'l', 'l')} registrada`],
  ['pedido_portal', '🏥', 'Pedidos del portal', 'Cuando un centro pide desde el portal']
);
const NOTIF_AREAS = [
  ['ventas', 'Ventas', ['reponer', 'caida_ventas', 'pedido_portal', 'venta_cartera', 'pauta', 'pedido_validado', 'pago_recibido', 'borrador_nuevo', 'cliente_nuevo']],
  ['cartera', 'Cartera y agenda', ['citas_hoy', 'visita_sin_registrar', 'seguimientos_hoy', 'sin_visitar', 'cartera', 'cruce', 'duplicado', 'portal']],
  ['cobros', 'Cobros y stock', ['pagos_pendientes', 'facturas_vencidas', 'stock_minimo', 'lotes_caducan', 'compra_recibida', 'rectificativa']],
  ['equipo', 'Equipo', ['usuario_nuevo', 'esquema']]
];
// Los que se preparan al empezar el día: solo tienen «en el resumen»
const NOTIF_DIARIOS = ['citas_hoy', 'seguimientos_hoy', 'pagos_pendientes', 'facturas_vencidas', 'lotes_caducan', 'sin_visitar', 'reponer', 'caida_ventas', 'visita_sin_registrar'];
const notifArea = t => (NOTIF_AREAS.find(a => a[2].includes(t)) || ['otros'])[0];
let NOTIF_LISTA = [], NOTIF_FILTRO = '';

// Acciones de cada aviso: [texto, función, principal]
function notifAcciones(x) {
  const d = x.datos || {}, [t, id] = String(x.enlace || '').split(':'), out = [];
  if (x.tipo === 'reponer') {
    if (d.telefono) out.push(['Llamar', () => { location.href = 'tel:' + String(d.telefono).replace(/\s+/g, ''); }, true]);
    out.push(['Nueva venta', () => nuevaVenta({ contacto_id: d.contacto_id || id, cliente: d.nombre, telefono: d.telefono }), !d.telefono]);
  } else if (x.tipo === 'caida_ventas') {
    out.push(['Ver ficha', () => abrirFicha(d.cuenta_id || id), true], ['Citar', () => nuevaCita(d.cuenta_id || id)]);
  } else if (x.tipo === 'visita_sin_registrar') {
    out.push([`Registrar ${TT('visita', 's', '', 'l', 'l')}`, () => abrirVisita(d.cuenta_id), true], ['Ver ficha', () => abrirFicha(d.cuenta_id)]);
  } else if (t === 'pedido' && id) out.push(['Ver pedido', () => verPedido(id), true]);
  else if (t === 'ficha' && id) out.push(['Ver ficha', () => abrirFicha(id), true]);
  else if (x.enlace) out.push(['Abrir', () => irEnlace(x.enlace), true]);
  return out;
}

function notifDia(f) {
  const d = new Date(f), hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dif = Math.round((hoy - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  return dif <= 0 ? 'Hoy' : dif === 1 ? 'Ayer' : dif < 7 ? 'Esta semana' : 'Antes';
}

// v2.242.0: aquí iba la primera versión de notifPintar (se redefine entera más abajo)
panelNotificaciones = function (l) {
  NOTIF_LISTA = l || [];
  notifPintar();
  if (!$('dlg').open) $('dlg').showModal();
};

// Ajustes: tabla compacta (al momento / en el resumen del día) y silencio
async function notifGuardarPrefs(cambio, ok) {
  const prefs = Object.assign({}, PERFIL.preferencias || {}, cambio);
  const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
  if (error) { toast('No se ha podido guardar', true); return false; }
  PERFIL.preferencias = data || prefs; if (ok) toast(ok); return true;
}
function notifModo(k) {
  const v = ((PERFIL.preferencias || {}).notif || {})[k], diario = NOTIF_DIARIOS.includes(k);
  if (v === false) return 'no';
  if (v && typeof v === 'object') { if (v.m === false && v.r) return 'r'; if (v.m === false) return 'no'; }
  return diario ? 'r' : 'm';
}
pintarNotif = function () {
  const tipos = tiposDeMiRol(), s = (PERFIL.preferencias || {}).notif_silencio || {};
  const filas = NOTIF_AREAS.map(([a, t, ks]) => [t, tipos.filter(x => ks.includes(x[0]))]).filter(([, l]) => l.length);
  const sueltos = tipos.filter(x => !NOTIF_AREAS.some(a => a[2].includes(x[0])));
  if (sueltos.length) filas.push(['Otros', sueltos]);
  $('cfgcuerpo').innerHTML = `<div class="card cfgpanel notcfg2"><h2 style="padding:0 0 4px">Notificaciones</h2>
    <p class="sm">Te llegan a la campana de arriba. Elige para cada aviso si lo quieres al momento o en el resumen de cada mañana; sin marcar ninguna, no lo recibes.</p>
    ${tipos.length ? `<div class="notsil"><label class="chk"><input type="checkbox" id="nsil" ${s.activo ? 'checked' : ''}> Silenciar de</label>
        <input type="time" id="nsild" value="${esc(s.desde || '20:00')}" aria-label="Desde"> a <input type="time" id="nsilh" value="${esc(s.hasta || '08:00')}" aria-label="Hasta">
        <label class="chk"><input type="checkbox" id="nsilf" ${s.finde !== false ? 'checked' : ''}> y los fines de semana</label>
        <span class="sm">Lo que llegue en ese tiempo lo verás al terminar el silencio.</span></div>
      <div class="dgrid-wrap"><table class="nottab"><thead><tr><th>Aviso</th><th>Al momento</th><th>En el resumen del día</th></tr></thead>
      <tbody>${filas.map(([t, l]) => `<tr class="notarea"><th colspan="3">${esc(t)}</th></tr>${l.map(([k, ic, tt, d]) => {
        const m = notifModo(k), diario = NOTIF_DIARIOS.includes(k);
        return `<tr><td><b>${ic} ${esc(tt)}</b><span class="sm">${esc(d)}</span></td>
          <td>${diario ? '<span class="sm" title="Se prepara al empezar el día">—</span>' : `<input type="checkbox" data-ntm="${k}" ${m === 'm' ? 'checked' : ''} aria-label="${esc(tt)}: al momento">`}</td>
          <td><input type="checkbox" data-ntr="${k}" ${m === 'r' ? 'checked' : ''} aria-label="${esc(tt)}: en el resumen del día"></td></tr>`; }).join('')}`).join('')}</tbody></table></div>`
      : '<div class="vacio">Tu perfil no tiene notificaciones disponibles todavía.</div>'}</div>`;
  const guardarTipo = async k => {
    const m = $('cfgcuerpo').querySelector(`[data-ntm="${k}"]`), r = $('cfgcuerpo').querySelector(`[data-ntr="${k}"]`);
    const notif = Object.assign({}, (PERFIL.preferencias || {}).notif || {});
    const diario = NOTIF_DIARIOS.includes(k), om = m ? m.checked : false, or = r.checked;
    if (diario ? or : (om && !or)) delete notif[k];          // lo de siempre: no hace falta guardarlo
    else notif[k] = { m: om, r: or };
    await notifGuardarPrefs({ notif }, om || or ? 'Guardado' : 'No lo recibirás');
  };
  $('cfgcuerpo').querySelectorAll('[data-ntm]').forEach(c => c.onchange = () => {
    if (c.checked) { const r = $('cfgcuerpo').querySelector(`[data-ntr="${c.dataset.ntm}"]`); if (r) r.checked = false; }
    guardarTipo(c.dataset.ntm);
  });
  $('cfgcuerpo').querySelectorAll('[data-ntr]').forEach(c => c.onchange = () => {
    if (c.checked) { const m = $('cfgcuerpo').querySelector(`[data-ntm="${c.dataset.ntr}"]`); if (m) m.checked = false; }
    guardarTipo(c.dataset.ntr);
  });
  const guardarSil = () => notifGuardarPrefs({ notif_silencio: { activo: $('nsil').checked, desde: $('nsild').value || '20:00', hasta: $('nsilh').value || '08:00', finde: $('nsilf').checked } },
    $('nsil').checked ? 'Silencio guardado' : 'Sin silencio');
  ['nsil', 'nsild', 'nsilh', 'nsilf'].forEach(id => { if ($(id)) $(id).onchange = guardarSil; });
};

// Enlaces nuevos de los avisos
irEnlace = (orig => function (e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'cliente' && id) return nuevaVenta({ contacto_id: id });
  if (t === 'cita') { AG_MODO = 'dia'; AG_FECHA = hoyISO(); return ir('agenda'); }
  return orig(e);
})(irEnlace);

// v2.154.0 · Iconos del menú «Más» del móvil (y de «Tus módulos» en Mi perfil): las secciones añadidas después (Oportunidades, Compras,
// Proveedores, Usuarios y roles, Panel delcos) no llegaban a ICO_MOD y salían con un punto
Object.keys(ICO_NAV).forEach(k => { if (ICON_NOM[ICO_NAV[k]]) ICO_MOD[k] = svgIco(ICON_NOM[ICO_NAV[k]]); });

/* v2.157.0 · Plan y suscripción al día con la oferta publicada en delcos.app: frase de cada plan, comparativa con todos los módulos
   actuales (los nuevos: Nueva venta, Pedidos web y pagos, Notificaciones, Historial, Indicadores por áreas…). Solo cambia lo que se enseña: qué abre cada plan sigue en PLANES.modulos. */
(() => {
  const para = { campo: 'Para equipos que visitan y quieren ordenar su cartera', comercial: 'Para equipos que venden y quieren medir resultados',
    empresa: 'Para empresas que facturan y llevan su almacén', medida: 'Para redes de más de 50 personas o con necesidades propias' };
  PLANES.forEach(p => { if (para[p.id]) p.para = para[p.id]; });
})();
// Filas de la comparativa: [nombre, detalle, planes que lo incluyen]
const PLAN_FILAS = () => {
  const T = ['campo', 'comercial', 'empresa', 'medida'], C = ['comercial', 'empresa', 'medida'], E = ['empresa', 'medida'], M = ['medida'];
  const med = TT('medico', 'p', '', 'l', 'l'), vis = TT('visita', 'p', '', 'l', 'l'), pac = TT('paciente', 'p', '', 'l', 'l');
  return [
    ['Campo', null],
    [`Cartera de ${med} y centros`, 'Fichas con su historial, horarios, estado comercial y tus campos', T],
    [`Agenda, «Tu día» y registro de ${vis}`, 'Tu día, tu semana y tu mes en una pantalla, con sugerencias', T],
    ['Rutas y planificación semanal', 'Rutas propuestas cada mañana, a tu agenda con un clic', T],
    [`Ciclo de ${vis} A/B/C`, `Cada ficha en A, B o C con sus ${vis} por ciclo, y a quién le faltan`, T],   // v2.199.0
    ['Muestras y material', `Lo que entregas en cada ${TT('visita', 's', '', 'l', 'l')}, por almacén`, T],
    ['Calidad del dato y duplicados', 'Qué le falta a cada ficha y fichas repetidas, para unirlas', T],
    ['Notificaciones', 'Por día y con su acción; cada persona elige qué y cuándo', T],
    ['Usuarios, roles y permisos', 'Cada persona ve lo suyo y ordena su propio menú', T],
    ['Importar datos', 'Desde Excel o CSV, con vista previa', T],
    ['Venta', null],
    ['Pedidos, televenta y clientes', `Nueva venta: llamada y pedido en un paso; ${pac} y empresas con su historial`, C],
    ['Pedidos web y pagos', 'Lo que entra por tu web, con referencia y justificante del pago', C],
    ['Oportunidades', 'Cada venta, se cierre o no, con sus métricas', C],   // v2.158.0: incluida desde Comercial
    ['Cobertura de cada producto por ciclo', `Qué productos han oído tus ${med} de A, B y C en sus ${vis}`, C],   // v2.199.0
    ['Eventos e informe de gastos', 'Talleres, cursos y congresos con sus asistentes y el informe anual', C],   // v2.199.0
    ['Productos y stock por lotes', 'Catálogo, lotes, caducidades y almacenes', C],
    ['Analítica', 'Indicadores por áreas comparados con el periodo anterior, y explorar tus datos', C],
    ['Comisiones por tramos', 'Esquemas y liquidaciones de cada mes', C],
    ['Oficina', null],
    ['Facturación con VeriFactu y cobros', 'Series, rectificativas y el registro de cada factura', E],
    ['Compras, proveedores y trazabilidad', 'Lo enviado, lo que está en camino y lo recibido', E],
    ['Material en depósito', 'Lo que tienes en cada centro, lo usado y su reposición', E],   // v2.201.0
    ['Intervenciones con lote y número de serie', 'Programación, lo usado por unidad, pedido y reposición en 48 horas', E],   // v2.201.0
    ['Concursos y contratos', 'Pliegos, lotes adjudicados y precios de contrato en los pedidos', E],   // v2.201.0
    ['Parque instalado', 'Equipos con su número de serie, contrato, garantía y revisiones', E],   // v2.201.0
    ['Zonas, supervisión del equipo y auditoría', 'Historial de cambios de cada ficha, con deshacer', E],
    ['Servicio', null],
    ['Migración de tus datos', 'Y conexión con tu programa de gestión', M],
    ['Soporte prioritario', null, M]
  ];
};
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const t = document.querySelector('#cfgcuerpo .planmat'); if (!t) return r;
  const act = planDe((PLAN_ACTUAL || {}).plan);
  const celda = (p, v) => `<td class="${p.id === act.id ? 'act' : ''}">${v === true ? `<span class="si" role="img" aria-label="Incluido">${svgIco(ICON_NOM.check)}</span>`
    : v === false ? '<span class="no" role="img" aria-label="No incluido">—</span>' : v}</td>`;
  const filas = PLAN_FILAS().map(([n, d, pl]) => pl === null || pl === undefined && d === null
    ? `<tr class="plangrupo"><td colspan="${PLANES.length + 1}">${esc(n)}</td></tr>`
    : `<tr><td><b>${esc(n)}</b>${d ? `<span class="sm">${esc(d)}</span>` : ''}</td>${PLANES.map(p => celda(p, pl.includes(p.id))).join('')}</tr>`).join('');
  const extra = [...t.querySelectorAll('tbody tr')].filter(tr => /Espacio|Ver la plataforma|Precio por usuario/.test(tr.textContent)).map(tr => tr.outerHTML).join('');
  t.querySelector('tbody').innerHTML = filas + extra;
  return r;
})(pintarPaginaPlan);


/* v2.158.0 · Oportunidades y el portal entran en los planes (decisión de Eric, 3/10/2026; los precios no cambian). Oportunidades en
   Comercial, Empresa y A medida; el portal del profesional y del centro en Empresa (hasta 50) y A medida (sin límite). El plan los
   activa y el botón «Extras» del panel delcos queda para excepciones (tiene_extra, SQL 99, hace lo mismo en la base). */
const PLAN_EXTRAS = { oportunidades: ['comercial', 'empresa', 'medida'], portal: ['empresa', 'medida'] };
hayExtra = function (k) {
  const p = (typeof PLAN_ACTUAL !== 'undefined' && PLAN_ACTUAL) || {};
  return (p.extras || []).includes(k) || (PLAN_EXTRAS[k] || []).includes(p.plan);
};
hayOportunidades = function () { return hayExtra('oportunidades'); };
(() => {
  const portal = `Portal ${TT('medico', 's', 'del', 'l', 'l')} y del centro`;
  const pl = id => PLANES.find(p => p.id === id) || { ventajas: [] };
  pl('comercial').ventajas.push('Oportunidades: cada venta, se cierre o no');
  const emp = pl('empresa').ventajas, med = pl('medida').ventajas;
  const iE = emp.findIndex(v => /^Espacio /.test(v)); if (iE >= 0) emp[iE] = portal + ' (hasta 50)'; else emp.push(portal + ' (hasta 50)');
  const iM = med.findIndex(v => /^Espacio /.test(v)); if (iM >= 0) med[iM] = portal + ', sin límite'; else med.push(portal + ', sin límite');
})();
// Comparativa de «Plan y suscripción»: la fila del espacio del profesional pasa a ser la del portal (Oportunidades va en PLAN_FILAS)
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const fp = [...document.querySelectorAll('.planmat tbody tr')].find(tr => /Su informe y sus avisos/.test(tr.textContent));
  if (fp) fp.querySelector('td').innerHTML = `<b>Portal ${TT('medico', 's', 'del', 'l', 'l')} y del centro</b><span class="sm">Informe, constancia, material, mensajes y pedidos del centro</span>`;
  return r;
})(pintarPaginaPlan);
// Organizaciones → Extras: ahora son excepciones a lo que incluye el plan
document.addEventListener('click', e => {
  if (!e.target.closest('[data-orgext]')) return;
  setTimeout(() => {
    const s = $('dbody') && $('dbody').querySelector('.fh .sm');
    if (s && /aparte de su plan/.test(s.textContent)) s.textContent = 'Además de lo que incluye su plan (Oportunidades desde Comercial; el portal desde Empresa)';
  }, 0);
}, true);


/* v2.159.0 · Correcciones del registro de errores (pruebas, 3/10/2026) y un sitio para revisarlo.
   - «showModal: The dialog is already open as a non-modal dialog» (Pedidos): una ventana encajada en una página propia seguía
     abierta al ir a otra pantalla y abrir otra ventana; ahora se cierra antes de abrirla como ventana normal.
   - «Cannot read properties of null (reading 'classList')» (Analítica): un filtro que cambiaba cuando la tabla de Explorar ya no
     estaba en pantalla (los filtros viven en el panel lateral); ahora no hace nada fuera de Analítica.
   - Duplicados (Inicio y pantalla Duplicados) sin esperas: lo resuelve el SQL 100 (parejas guardadas).
   - Panel delcos → «Errores»: los errores agrupados (cuántas veces, a cuántas personas, en qué versiones), con su estado por grupo;
     al darlos por resueltos, si vuelven en una versión igual o posterior se reabren solos (SQL 100). */
['dlg', 'dlg2'].forEach(id => {
  const d = $(id); if (!d) return;
  const prev = d.showModal;
  d.showModal = function (...a) {
    try { if (this.open && !this.matches(':modal') && !(typeof areaEncaje === 'function' && areaEncaje())) this.close(); } catch (e) {}
    return prev.apply(this, a);
  };
});
refrescarAnalitica = (orig => function (...a) {
  if (TAB !== 'analitica' || !$('atabla') || !$('atabla2')) return;
  return orig.apply(this, a);
})(refrescarAnalitica);

async function pintarErroresDelcos() {
  const c = $('cfgcuerpo'); if (!c) return;
  const f = window.__ERRG || { estado: 'abiertos', dias: 15 };
  c.innerHTML = `<div class="card cfgpanel"><div class="skel" style="width:40%"></div><div class="skel"></div></div>`;
  const { data, error } = await RPC_ORIG('errores_resumen', { p_dias: f.dias });
  if (!$('cfgcuerpo')) return;
  const todos = error ? [] : (data || []);
  const l = todos.filter(x => f.estado === 'todos' || (f.estado === 'abiertos' ? x.estado !== 'Resuelto' : x.estado === 'Resuelto'));
  const nom = { error: 'Error de programa', api: 'Error de base de datos' };
  const fecha = v => new Date(v).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  c.innerHTML = `<div class="card cfgpanel errgrupos"><h2 style="padding:0 0 4px">Errores de la plataforma</h2>
    <p class="sm">Los errores iguales van juntos. Al marcar un grupo como resuelto queda apuntada la versión; si vuelve a salir en esa versión o en una
      posterior, se reabre solo. «Descargar» guarda el archivo para quien da soporte técnico.</p>
    ${error ? `<div class="banda-peligro">No se ha podido leer el registro: ${esc(error.message)}</div>` : ''}
    <div class="usrbar"><select id="egest"><option value="abiertos" ${f.estado === 'abiertos' ? 'selected' : ''}>Sin resolver</option>
        <option value="resueltos" ${f.estado === 'resueltos' ? 'selected' : ''}>Resueltos</option><option value="todos" ${f.estado === 'todos' ? 'selected' : ''}>Todos</option></select>
      <select id="egdias">${[7, 15, 30, 90].map(n => `<option value="${n}" ${f.dias === n ? 'selected' : ''}>Últimos ${n} días</option>`).join('')}</select>
      <button class="btn sec" id="egdesc">${svgIco(ICON_NOM.download)} Descargar</button></div>
    <div class="errlista">${l.map((x, i) => `<div class="errfila e-${x.tipo}">
        <div><b>${esc(nom[x.tipo] || x.tipo)}</b> <span class="sm">· ${esc(x.pantalla || '—')} · ${num(x.veces)} ${x.veces === 1 ? 'vez' : 'veces'} · ${num(x.personas)} ${x.personas === 1 ? 'persona' : 'personas'}
          · última ${fecha(x.ultima)}${x.resuelto_en_version ? (x.resuelto_auto ? ' · resuelto solo en ' : ' · resuelto en ') + esc(x.resuelto_en_version) : ''}</span>
          <div class="errmsg">${esc(x.mensaje)}</div>
          <details class="errdet"><summary class="sm">Versiones y detalle técnico</summary><div class="sm">Versiones: ${esc(x.versiones || '—')} · primera ${fecha(x.primera)}</div>
            <pre>${esc(JSON.stringify(x.detalle || {}, null, 1))}</pre></details></div>
        <select class="chico" data-egh="${i}" aria-label="Estado del grupo">${['Nuevo', 'Revisado', 'Resuelto'].map(e => `<option ${x.estado === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div>`).join('')
      || `<div class="vacio">${f.estado === 'abiertos' ? 'No hay errores sin resolver en este periodo.' : 'Sin errores con estos filtros.'}</div>`}</div></div>`;
  $('egest').onchange = $('egdias').onchange = () => { window.__ERRG = { estado: $('egest').value, dias: +$('egdias').value }; pintarErroresDelcos(); };
  c.querySelectorAll('[data-egh]').forEach(s => s.onchange = async () => {
    const x = l[+s.dataset.egh];
    const { data: r } = await RPC_ORIG('marcar_errores_huella', { p_huella: x.huella, p_estado: s.value });
    toast(r && r.ok ? (s.value === 'Resuelto' ? 'Grupo resuelto: si vuelve a salir, se reabre solo' : 'Estado actualizado') : 'No se ha podido cambiar', !(r && r.ok));
    if (r && r.ok) pintarErroresDelcos();
  });
  $('egdesc').onclick = () => {
    const b = new Blob([JSON.stringify({ generado: new Date().toISOString(), version: VERSION_APP, errores: todos }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `errores_${hoyISO()}.json`; a.click();
  };
}
if (PAGINAS.delcos && !PAGINAS.delcos.tabs.some(t => t[0] === 'errores')) PAGINAS.delcos.tabs.push(['errores', 'Errores', () => pintarErroresDelcos()]);
// Producción (3/10/2026): en el iPhone, sin cobertura, Safari da «Load failed» o «Fetch is aborted». Eso no es un fallo de la plataforma:
// no se apunta en el registro de errores, y la visita (registrar_actividad, que no se duplica gracias a su op_id) se guarda en la cola
// del dispositivo y se envía al recuperar la conexión, en lugar de pedir que se repita.
function esErrorRed(e) { return /failed to fetch|load failed|networkerror|network request failed|aborterror|fetch is aborted|internet connection|err_internet|err_network/i.test(String((e && (e.message || e)) || '')); }
registrarError = (orig => function (tipo, mensaje, detalle) {
  if (tipo === 'api' && esErrorRed(mensaje)) return;
  return orig.call(this, tipo, mensaje, detalle);
})(registrarError);
async function escribirRpc(fn, payload) {
  const r = navigator.onLine ? await db.rpc(fn, payload) : { error: { message: 'Failed to fetch' } };
  if (r && r.error && esErrorRed(r.error)) {
    colaPoner({ fn, payload: marcarSinConexion(fn, payload), etiqueta: TT('visita', 's', '', 'l', 'C'), t: Date.now() });
    pintarConexion();
    setTimeout(() => toast('Sin conexión: queda guardado en este dispositivo y se enviará al recuperarla'), 1500);
    return { data: { encolada: true }, error: null };
  }
  return r;
}

/* v2.161.0 · Los errores corregidos se dan por resueltos solos (petición de Eric, 3/10/2026). Al abrirse, la app avisa una vez de su
   versión (version_en_uso, SQL 101): así se sabe desde cuándo se usa cada versión en cada empresa, y los errores que no han vuelto a
   salir con una versión más nueva en 2 días quedan resueltos solos (si vuelven en esa versión o en otra posterior, se reabren). */
(function avisarVersionEnUso() {
  let intentos = 0;
  const t = setInterval(() => {
    if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function') {
      clearInterval(t);
      Promise.resolve(RPC_ORIG('version_en_uso', { p_version: VERSION_APP })).then(() => {}, () => {});
    } else if (++intentos > 90) clearInterval(t);
  }, 2000);
})();


/* v2.162.0 · Suscripciones y pagos con Stripe (decisiones de Eric, 4/10/2026). «Plan y suscripción» ya no manda correos: «Contratar»
   abre el pago seguro de Stripe (tarjeta), «Cambiar a…» y «Añadir o quitar usuarios» cambian la suscripción con
   prorrateo y «Gestionar el pago» abre el portal de Stripe (tarjeta, recibos, cancelar). Todo pasa por la función de Supabase
   «pagos»; Stripe avisa a «stripe-webhook» y la base (aplicar_suscripcion, SQL 102) activa o cambia el plan. Si un cobro falla, aviso
   arriba durante 14 días y después la empresa queda en solo lectura (la base no deja crear, cambiar ni borrar) hasta que pague. */
const PAGO_PLANES = ['campo', 'comercial', 'empresa'];
let PAGO_ESTADO = null;   // la respuesta de plan_uso (plan, usuarios, solo_lectura)

async function pagoLlamar(cuerpo, boton) {
  if (boton) { boton.disabled = true; boton.dataset.txt = boton.textContent; boton.textContent = 'Abriendo…'; }
  try {
    const { data, error } = await db.functions.invoke('pagos', { body: cuerpo });
    let d = data;
    if (error) { try { d = await error.context.json(); } catch (e) { d = { ok: false, error: error.message }; } }
    if (!d || !d.ok) { toast('No se ha podido: ' + ((d && d.error) || 'error del pago'), true); return null; }
    return d;
  } finally { if (boton) { boton.disabled = false; boton.textContent = boton.dataset.txt; } }
}

// (v2.183.0: aquí iba la primera versión de elegirPago; se redefine entera más abajo)
async function pagoPortal(boton) { const d = await pagoLlamar({ accion: 'portal' }, boton); if (d && d.url) location.href = d.url; }

// «Plan y suscripción»: los botones reales en lugar de correos
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'); if (!c) return r;
  const pl = PLAN_ACTUAL || {}, conSus = !!pl.stripe_suscripcion, puedePagar = puedeOrganizacion();
  c.querySelectorAll('.plan[data-plan]').forEach(card => {
    const k = card.dataset.plan, a2 = card.querySelector('a.btn[href^="mailto"]');
    if (!a2 || !PAGO_PLANES.includes(k)) return;
    if (!puedePagar) { a2.remove(); return; }
    const b = document.createElement('button'); b.type = 'button'; b.className = a2.className; b.dataset.pgplan = k;
    b.textContent = conSus ? 'Cambiar a ' + planDe(k).nombre : 'Contratar ' + planDe(k).nombre;
    a2.replaceWith(b); b.onclick = () => elegirPago(k);
  });
  const acts = c.querySelector('#planact .acts');
  if (acts) {
    const usu = acts.querySelector('a.btn[href^="mailto"]'); if (usu) usu.remove();
    if (puedePagar && pl.plan !== 'medida') acts.insertAdjacentHTML('beforeend', conSus
      ? '<button type="button" class="btn sec" id="pgusu2">Añadir o quitar usuarios</button><button type="button" class="btn sec" id="pgportal">Gestionar el pago</button>'
      : '<button type="button" class="btn" id="pgelegir">Elegir plan y pagar</button>');
    if ($('pgusu2')) $('pgusu2').onclick = () => elegirPago(pl.plan);
    if ($('pgportal')) $('pgportal').onclick = ev => pagoPortal(ev.target);
    if ($('pgelegir')) $('pgelegir').onclick = () => elegirPago();
  }
  const act = c.querySelector('#planact h2');
  if (act && pl.estado === 'impago') act.insertAdjacentHTML('afterend', `<div class="banda-peligro">No hemos podido cobrar el último recibo${pl.impago_desde ? ' (desde el ' + fechaCorta(pl.impago_desde) + ')' : ''}.
    Actualiza el método de pago con «Gestionar el pago»; si en 14 días no se puede cobrar, la cuenta queda en solo lectura.</div>`);
  if (act && pl.estado === 'cancelada') act.insertAdjacentHTML('afterend', `<div class="banda-aviso">Suscripción cancelada: puedes usar la plataforma hasta el
    <b>${fechaCorta(pl.periodo_fin)}</b> y descargar tus datos. Para seguir, vuelve a contratar.</div>`);
  if (act && conSus && pl.periodo_fin && pl.estado === 'activo') act.insertAdjacentHTML('afterend', `<p class="sm">Próximo recibo el ${fechaCorta(pl.periodo_fin)}.</p>`);
  return r;
})(pintarPaginaPlan);

// Aviso arriba si hay un cobro pendiente o la cuenta está en solo lectura
function pagoAviso() {
  const e = PAGO_ESTADO || {}, pl = e.plan || {}; let el = $('pagoaviso');
  const msg = e.solo_lectura ? 'Tu empresa está en <b>solo lectura</b> porque hay un pago pendiente. Puedes consultar y exportar; para volver a trabajar, actualiza el pago.'
    : pl.estado === 'impago' ? 'No hemos podido cobrar tu suscripción. Actualiza el método de pago antes de 14 días para no quedarte en solo lectura.' : '';
  if (!msg) { if (el) el.remove(); return; }
  const main = document.querySelector('main'); if (!main) return;
  if (!el) { main.insertAdjacentHTML('afterbegin', '<div id="pagoaviso" class="banda-peligro" role="alert"></div>'); el = $('pagoaviso'); }
  el.innerHTML = msg + (puedeOrganizacion() ? ' <button type="button" class="btn sec" id="pgavbtn">Gestionar el pago</button>' : ' Avisa a quien gestiona la cuenta de tu empresa.');
  if ($('pgavbtn')) $('pgavbtn').onclick = ev => pagoPortal(ev.target);
}
async function pagoCargarEstado() {
  const { data } = await RPC_ORIG('plan_uso', {});
  if (!data) return;
  PAGO_ESTADO = data; if (data.plan && data.plan.plan) PLAN_ACTUAL = data.plan;
  pagoAviso();
}
// Al volver de Stripe: se espera a que llegue el aviso y el plan quede activo
async function pagoEsperarActivo() {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    await pagoCargarEstado();
    const pl = PLAN_ACTUAL || {};
    if (pl.stripe_suscripcion && pl.estado === 'activo') { toast('Suscripción activa: plan ' + planDe(pl.plan).nombre); if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return; }
  }
  toast('El pago está hecho; la suscripción aparecerá en unos minutos');
}
(function pagoArranque() {
  let n = 0;
  const t = setInterval(() => {
    if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function') {
      clearInterval(t);
      const q = new URLSearchParams(location.search), res = q.get('pago');
      if (res) { history.replaceState(null, '', location.pathname + location.hash); }
      if (res === 'ok') { toast('Pago recibido: activando tu suscripción…'); pagoEsperarActivo(); }
      else if (res === 'cancelado') toast('Has salido del pago sin completarlo');
      pagoCargarEstado();
    } else if (++n > 90) clearInterval(t);
  }, 1500);
})();
// En solo lectura, los fallos al guardar se explican (y no cuentan como errores de la plataforma)
toast = (orig => function (msg, err) {
  if (err && PAGO_ESTADO && PAGO_ESTADO.solo_lectura) msg = 'Tu empresa está en solo lectura hasta que se actualice el pago (Plan y suscripción)';
  return orig.call(this, msg, err);
})(toast);
registrarError = (orig => function (tipo, mensaje, detalle) {
  if (PAGO_ESTADO && PAGO_ESTADO.solo_lectura && /row-level security|violates row-level/i.test(String(mensaje))) return;
  return orig.call(this, tipo, mensaje, detalle);
})(registrarError);
// Organizaciones (panel delcos): impago y cancelada a la vista
orgEstado = (orig => function (o) {
  const pd = o.plan_datos || {};
  if (o.bloqueada === 'cancelada') return '<span class="pill p-anu">Cancelada</span> ';
  if (pd.estado === 'impago') return `<span class="pill p-urg">Impago desde el ${fechaCorta(pd.impago_desde)}</span> `;
  return orig(o) + (pd.stripe_suscripcion ? '<span class="pill p-est">Stripe</span> ' : '');
})(orgEstado);

/* v2.163.0 · Compras y Proveedores son del plan Empresa (y A medida): en Campo y Comercial salen con candado y explican cómo
   conseguirlos, igual que Facturación. Con el plan A medida no se contrata ni se cambia en línea (presupuesto: lo lleva delcos). */
const PLAN_SECCIONES = { compras: ['empresa', 'medida'], proveedores: ['empresa', 'medida'] };
const planIncluyeSeccion = t => !(t in PLAN_SECCIONES) || PLAN_SECCIONES[t].includes(PLAN_ACTUAL.plan);
function candadoSecciones() {
  Object.keys(PLAN_SECCIONES).forEach(t => document.querySelectorAll(`nav.main [data-t="${t}"], .bmasgrid [data-bm="${t}"]`).forEach(b => {
    const bloq = !planIncluyeSeccion(t);
    b.classList.toggle('bloq', bloq);
    const c = b.querySelector('.cand');
    if (bloq && !c && b.matches('nav.main [data-t]')) b.insertAdjacentHTML('beforeend', '<span class="cand">🔒</span>');
    if (!bloq && c) c.remove();
  }));
}
aplicarPermisosMenu = (orig => function (...a) { const r = orig.apply(this, a); try { candadoSecciones(); } catch (e) {} return r; })(aplicarPermisosMenu);
avisoPlan = (orig => function (mod) {
  if (!(mod in PLAN_SECCIONES)) return orig.call(this, mod);
  const p = planDe(PLAN_SECCIONES[mod][0]), n = TITULO_PEDSEC[mod] ? TITULO_PEDSEC[mod][0] : mod;
  $('dbody').innerHTML = `<div class="fh"><div><h2>${esc(n)}</h2><div class="sm">No está incluido en tu plan ${esc(planDe(PLAN_ACTUAL.plan).nombre)}</div></div>
    <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <p>Está disponible desde el plan <b>${esc(p.nombre)}</b> (${precioPlan(p)}).</p>
    <ul class="manlist">${p.ventajas.map(v => `<li><span>✓</span><span>${esc(v)}</span></li>`).join('')}</ul>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Ahora no</button>${puedeOrganizacion() ? '<button class="btn" id="vplan">Ver planes</button>' : ''}</div>`;
  $('dlg').showModal();
  if ($('vplan')) $('vplan').onclick = () => { $('dlg').close(); CFG_SEC = 'plan'; ir('config'); };
})(avisoPlan);
ir = (orig => function (t, ...a) {
  if (t in PLAN_SECCIONES && PERFIL && !ES_MEDICO() && !planIncluyeSeccion(t)) { avisoPlan(t); return; }
  return orig.call(this, t, ...a);
})(ir);
abrirMasMovil = (orig => function (...a) {
  const r = orig.apply(this, a);
  document.querySelectorAll('.bmasgrid [data-bm]').forEach(b => { const t = b.dataset.bm; if (!planIncluyeSeccion(t)) {
    b.classList.add('bloq'); b.onclick = () => { const s = $('bmas'); if (s) s.classList.add('hide'); document.body.classList.remove('masabierto'); avisoPlan(t); }; } });
  return r;
})(abrirMasMovil);
// A medida (como la empresa principal): sin botones de contratar ni de cambiar en línea, salvo que ya pague con Stripe
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {};
  if (c && pl.plan === 'medida' && !pl.stripe_suscripcion) c.querySelectorAll('[data-pgplan], #pgelegir, #pgusu2').forEach(b => b.remove());
  return r;
})(pintarPaginaPlan);
setTimeout(() => { try { candadoSecciones(); } catch (e) {} }, 0);

/* v2.164.0 · Lo que no entra en el plan no sale en el menú (petición de Eric): al bajar de plan, los módulos con candado se quitan
   solos del menú lateral y del «Más» del móvil, y en «Personalizar menú» salen con candado y el interruptor apagado y sin poder
   encenderlo. No se toca lo que cada uno eligió: al volver a un plan que los incluye, reaparecen como estaban. */
const fueraDePlan = b => !!b && b.classList.contains('bloq');
const PLAN_NOMBRE = () => { try { return planDe(PLAN_ACTUAL.plan).nombre; } catch (e) { return ''; } };
montarMenuLateral = (orig => function (...a) {
  const r = orig.apply(this, a);
  if (!document.body.classList.contains('menulat')) return r;
  const inn = $('nav'); if (!inn) return r;
  // (solo se toca la clase si cambia: el observador del menú vuelve a llamar aquí con cada cambio de clase)
  const ocultos = menuPrefs().ocultos || [];
  inn.querySelectorAll('button[data-t]').forEach(b => {
    if (fueraDePlan(b)) { if (!b.classList.contains('mlplan')) b.classList.add('mlplan'); if (!b.classList.contains('mloculto')) b.classList.add('mloculto'); }
    else if (b.classList.contains('mlplan')) { b.classList.remove('mlplan'); if (!ocultos.includes(b.dataset.t)) b.classList.remove('mloculto'); }
  });
  inn.querySelectorAll('.mlgrupo').forEach(g => g.classList.toggle('vacio', ![...g.querySelectorAll('button[data-t]')]
    .some(b => !b.classList.contains('hide') && !b.classList.contains('mloculto') && b.dataset.t !== 'seguimiento' && getComputedStyle(b).display !== 'none')));
  return r;
})(montarMenuLateral);
abrirMasMovil = (orig => function (...a) {
  const r = orig.apply(this, a);
  document.querySelectorAll('.bmasgrid [data-bm].bloq').forEach(b => b.remove());
  return r;
})(abrirMasMovil);
// «Personalizar menú»: candado, interruptor apagado y bloqueado, y la cuenta «N de M» sin lo que no entra
function personalizarCandados() {
  const caja = $('mlpanel'); if (!caja) return;
  caja.querySelectorAll('.mlpi[data-k]').forEach(f => {
    const b = document.querySelector(`#nav button[data-t="${f.dataset.k}"]`); if (!fueraDePlan(b)) return;
    f.classList.add('off', 'fueraplan'); f.title = `No está incluido en tu plan ${PLAN_NOMBRE()}`;
    const v = f.querySelector('[data-vk]'); if (v) { v.checked = false; v.disabled = true; }
    if (!f.querySelector('.mlpcand')) f.querySelector('.mlpn').insertAdjacentHTML('afterend', `<span class="mlpcand" aria-label="No incluido en tu plan"></span>`);
  });
  caja.querySelectorAll('.mlpg').forEach(g => {
    const fs = [...g.querySelectorAll('.mlpi[data-k]')], c = g.querySelector('.mlpcnt');
    if (c) c.textContent = `${fs.filter(f => !f.classList.contains('off')).length} de ${fs.filter(f => !f.classList.contains('fueraplan')).length}`;
  });
}
menuPersonalizar = (orig => function (...a) {
  const r = orig.apply(this, a);
  const caja = $('mlpanel');
  if (caja && !caja.__candados) {
    caja.__candados = true; personalizarCandados();
    new MutationObserver(() => personalizarCandados()).observe(caja, { childList: true });
    caja.addEventListener('change', () => personalizarCandados());
  }
  return r;
})(menuPersonalizar);

/* v2.165.0 · Bajar de plan con orden (decisiones de Eric, 4/10/2026):
   - A medida: no se baja desde la app; lo hace delcos desde su panel y no antes de la fecha de compromiso del contrato.
   - Las bajadas (plan menor, menos usuarios o de anual a mensual) se programan para el final del periodo pagado; las subidas, al momento.
     Antes de confirmar se enseña lo que se deja de tener. «Plan y suscripción» dice el cambio previsto (con «Anular el cambio») y la baja pedida.
   - Sin Facturación en el plan pero con facturas emitidas: Facturación en solo consulta (verlas y descargarlas, no emitir; la base lo impide). */
function facConsulta() {
  try { return !!(PAGO_ESTADO && PAGO_ESTADO.facturas) && !['empresa', 'medida'].includes((PLAN_ACTUAL || {}).plan); } catch (e) { return false; }
}
const facSinPlan = () => { try { return !['empresa', 'medida'].includes((PLAN_ACTUAL || {}).plan); } catch (e) { return false; } };
function marcarFacPlan() {
  document.body.classList.toggle('facsolo', facSinPlan());
  try { aplicarPermisosMenu(); } catch (e) {}
}
pagoCargarEstado = (orig => async function (...a) { const r = await orig.apply(this, a); marcarFacPlan(); return r; })(pagoCargarEstado);
// En solo consulta, la pantalla lo dice arriba y Organización no enseña lo de emitir (datos fiscales, series, VeriFactu, PDF)
cargarFacturacion = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const v = $('v-facturacion');
  if (v && facConsulta() && !v.querySelector('#facconsulta')) {
    const sub = v.querySelector('.subnav');
    if (sub) sub.insertAdjacentHTML('afterend', `<div id="facconsulta" class="banda-info">Tu plan ${esc(planDe(PLAN_ACTUAL.plan).nombre)} no incluye Facturación:
      puedes consultar y descargar las facturas que ya emitiste y registrar sus cobros, pero no emitir nuevas.</div>`);
  }
  return r;
})(cargarFacturacion);
(() => {
  const d = Object.getOwnPropertyDescriptor(PAGINAS.organizacion, 'tabs'); if (!d || !d.get) return;
  Object.defineProperty(PAGINAS.organizacion, 'tabs', { configurable: true, get() {
    const t = d.get.call(this);
    return facConsulta() ? t.filter(x => !['fiscal', 'series', 'vf', 'pdf'].includes(x[0])) : t;
  } });
})();

// Lo que se deja de tener al pasar de un plan a otro (para avisar antes)
function perdidasPlan(de, a, datos) {
  const pd = planDe(de), pa = planDe(a), extras = (datos && datos.extras) || [], l = [];
  if (de === a) return l;
  const nombreMod = m => (MOD_PLAN.find(x => x[0] === m) || [m, m])[1];
  pd.modulos.filter(m => !pa.modulos.includes(m) && m in MODULO_AREA).forEach(m => l.push(m === 'facturacion'
    ? `Facturación: ${datos && datos.facturas ? 'tus facturas quedan en solo lectura (verlas, descargarlas y cobrarlas, no emitir nuevas)' : 'no podrás emitir facturas'}` : nombreMod(m)));
  Object.keys(PLAN_SECCIONES).forEach(s => { if (PLAN_SECCIONES[s].includes(de) && !PLAN_SECCIONES[s].includes(a)) l.push(TITULO_PEDSEC[s] ? TITULO_PEDSEC[s][0] : s); });
  Object.keys(PLAN_EXTRAS).forEach(x => {
    if (!PLAN_EXTRAS[x].includes(de) || PLAN_EXTRAS[x].includes(a) || extras.includes(x)) return;
    if (x === 'oportunidades') l.push('Oportunidades');
    if (x === 'portal') l.push(`Portal ${TT('medico', 's', 'del', 'l', 'l')} y del centro${datos && +datos.medicos ? ` (${num(datos.medicos)} con acceso lo perderán)` : ''}`);
  });
  if (de === 'medida' && a === 'empresa' && datos && +datos.medicos > 50) l.push(`Portal: el plan Empresa admite hasta 50 accesos y ahora hay ${num(datos.medicos)}`);
  if (de === 'medida') l.push('Ver la plataforma como cada persona de tu equipo', 'Soporte prioritario');
  return l;
}
const rangoPlan = k => ['campo', 'comercial', 'empresa', 'medida'].indexOf(k);
// Igual que la función «pagos»: plan menor, menos usuarios o de anual a mensual
const esBajada = (de, a) => rangoPlan(a.plan) < rangoPlan(de.plan)
  || (rangoPlan(a.plan) === rangoPlan(de.plan) && (+a.usuarios < +de.usuarios || (de.pago === 'anual' && a.pago === 'mensual')));

// Ventana de contratar o cambiar (la de la v2.162.0, con la bajada al final del periodo y lo que se pierde)
elegirPago = function (planIni) {
  const pl = PLAN_ACTUAL || {}, conSus = !!pl.stripe_suscripcion, usados = +((PAGO_ESTADO || {}).usuarios || 0);
  if (pl.plan === 'medida') { toast('Con el plan A medida, los cambios se hacen con delcos'); return; }
  const est = { plan: PAGO_PLANES.includes(planIni) ? planIni : (PAGO_PLANES.includes(pl.plan) ? pl.plan : 'comercial'),
    pago: pl.pago === 'anual' ? 'anual' : 'mensual', usuarios: Math.max(3, usados, +pl.usuarios || 0) };
  const actual = { plan: pl.plan, pago: pl.pago === 'anual' ? 'anual' : 'mensual', usuarios: +pl.usuarios || 0 };
  const pinta = () => {
    const p = planDe(est.plan), anual = est.pago === 'anual';
    const base = anual ? p.precio * 10 * est.usuarios : p.precio * est.usuarios;
    const puesta = !anual && !conSus ? PUESTA_EN_MARCHA : 0;
    const iva = Math.round((base + puesta) * 21) / 100;
    const baja = conSus && esBajada(actual, est), fin = pl.periodo_fin ? fechaCorta(pl.periodo_fin) : 'el final del periodo pagado';
    const pierde = conSus ? perdidasPlan(pl.plan, est.plan, Object.assign({}, PAGO_ESTADO || {}, { extras: pl.extras })) : [];
    $('dbody').innerHTML = `<div class="fh"><div><h2>${conSus ? 'Cambiar la suscripción' : 'Contratar delcos'}</h2>
        <div class="sm">Precios por usuario, IVA no incluido. ${!conSus ? 'El pago se hace en la página segura de Stripe.' : baja ? '' : 'El cambio se aplica ya y se prorratea en el próximo recibo.'}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <label>Plan</label><div class="segs pgplan" role="group">${PAGO_PLANES.map(k => `<button type="button" data-pgp="${k}" class="${est.plan === k ? 'on' : ''}" aria-pressed="${est.plan === k}">${esc(planDe(k).nombre)} · ${eurI(planDe(k).precio)}</button>`).join('')}</div>
      <label style="margin-top:12px">Pago</label><div class="segs" role="group">
        <button type="button" data-pga="mensual" class="${anual ? '' : 'on'}" aria-pressed="${!anual}">Mensual</button>
        <button type="button" data-pga="anual" class="${anual ? 'on' : ''}" aria-pressed="${anual}">Anual · pagas 10 meses de 12</button></div>
      <label for="pgusu" style="margin-top:12px">Usuarios</label><input id="pgusu" type="number" min="${Math.max(3, usados)}" value="${est.usuarios}" class="numw">
      <span class="sm">${usados ? `Ahora usáis ${num(usados)}. ` : ''}Mínimo ${Math.max(3, usados)}.</span>
      ${baja ? `<div class="banda-aviso" id="pgbaja">El cambio se aplicará el <b>${esc(fin)}</b>, al acabar lo que ya has pagado. Hasta entonces sigues con
        ${esc(planDe(pl.plan).nombre)}${pierde.length ? ` y después dejarás de tener:<ul id="pgpierde">${pierde.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '.'}</div>` : ''}
      <div class="pgres">
        <div><span>${num(est.usuarios)} × ${eurI(anual ? p.precio * 10 : p.precio)} ${anual ? 'al año' : 'al mes'}</span><b>${eurI(base)}</b></div>
        ${puesta ? `<div><span>Puesta en marcha (una vez; incluida con pago anual)</span><b>${eurI(puesta)}</b></div>` : ''}
        <div><span>IVA 21 %</span><b>${eurI(iva)}</b></div>
        <div class="pgtot"><span>${!conSus ? 'Primer cobro' : baja ? 'Importe desde el ' + esc(fin) : 'Nuevo importe'}</span><b>${eurI(base + puesta + iva)}</b></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn" id="pgok">${!conSus ? 'Ir al pago seguro' : baja ? 'Programar el cambio' : 'Confirmar el cambio'}</button></div>`;
    $('dbody').querySelectorAll('[data-pgp]').forEach(b => b.onclick = () => { est.plan = b.dataset.pgp; pinta(); });
    $('dbody').querySelectorAll('[data-pga]').forEach(b => b.onclick = () => { est.pago = b.dataset.pga; pinta(); });
    $('pgusu').onchange = () => { est.usuarios = Math.max(3, usados, Math.floor(+$('pgusu').value || 0)); pinta(); };
    $('pgok').onclick = async ev => {
      const d = await pagoLlamar({ accion: conSus ? 'cambiar' : 'checkout', plan: est.plan, pago: est.pago, usuarios: est.usuarios }, ev.target);
      if (!d) return;
      if (d.url) { location.href = d.url; return; }
      $('dlg').close();
      if (d.previsto) { toast(`Cambio programado para el ${fechaCorta(d.previsto)}`); await pagoCargarEstado(); if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return; }
      toast('Cambio hecho: en unos segundos verás el plan nuevo'); pagoEsperarActivo();
    };
  };
  pinta(); $('dlg').showModal();
};

// «Plan y suscripción»: cambio previsto (con «Anular el cambio»), baja pedida y compromiso de A medida
pintarPaginaPlan = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'), pl = PLAN_ACTUAL || {}, h = c && c.querySelector('#planact h2'); if (!h) return r;
  const cp = pl.cambio_previsto;
  if (cp && cp.plan) h.insertAdjacentHTML('afterend', `<div class="banda-info" id="pgprevisto">El <b>${fechaCorta(cp.desde)}</b> pasarás al plan
    <b>${esc(planDe(cp.plan).nombre)}</b> con ${num(cp.usuarios)} usuarios y pago ${cp.pago === 'anual' ? 'anual' : 'mensual'}.
    ${puedeOrganizacion() ? '<button type="button" class="btn sec" id="pganular">Anular el cambio</button>' : ''}</div>`);
  if (pl.baja_al_final && pl.estado === 'activo') h.insertAdjacentHTML('afterend', `<div class="banda-aviso" id="pgbajafin">Has pedido la baja: puedes usar la plataforma
    hasta el <b>${fechaCorta(pl.periodo_fin)}</b>. Si quieres seguir, entra en «Gestionar el pago» y renueva la suscripción.</div>`);
  if (pl.plan === 'medida' && pl.compromiso_hasta) h.insertAdjacentHTML('afterend', `<p class="sm" id="pgcomp">Contrato A medida hasta el ${fechaCorta(pl.compromiso_hasta)}. Para cambiarlo, habla con delcos.</p>`);
  if ($('pganular')) $('pganular').onclick = async ev => {
    const d = await pagoLlamar({ accion: 'anular_cambio' }, ev.target); if (!d) return;
    toast('Cambio anulado: sigues con tu plan'); await pagoCargarEstado(); ir(TAB);
  };
  return r;
})(pintarPaginaPlan);

// Panel delcos → Organizaciones → Plan: fecha de compromiso (A medida), lo que pierde al bajar y aviso si paga con Stripe
orgAcciones = (orig => function (c, l) {
  const r = orig.apply(this, arguments);
  c.querySelectorAll('[data-orgplan]').forEach(b => {
    const f = b.onclick; if (!f || b.__p2165) return; b.__p2165 = true;
    b.onclick = (...x) => {
      f.apply(b, x);
      const o = l.find(y => y.id === b.dataset.orgplan); if (!o || !$('opplan')) return;
      const pd = o.plan_datos || {}, de = pd.plan || o.plan;
      $('opest').closest('.g2').insertAdjacentHTML('beforeend', `<div id="opcompw"><label for="opcomp">Compromiso hasta (A medida)</label>
        <input id="opcomp" type="date" value="${esc(pd.compromiso_hasta || '')}"><span class="sm">Antes de esa fecha no se puede bajar de A medida.</span></div>`);
      $('opest').closest('.g2').insertAdjacentHTML('afterend', `${pd.stripe_suscripcion ? '<div class="banda-aviso" id="opstripe">Esta empresa paga con Stripe: este cambio no se pasa a Stripe. Para que cuadre el cobro, cámbialo también allí.</div>' : ''}<div id="opperd"></div>`);
      const pinta = () => {
        $('opcompw').classList.toggle('hide', $('opplan').value !== 'medida');
        const p = perdidasPlan(de, $('opplan').value, { extras: pd.extras || [], facturas: +o.facturas > 0 });
        const bloq = de === 'medida' && $('opplan').value !== 'medida' && pd.compromiso_hasta && pd.compromiso_hasta > hoyISO();
        $('opperd').innerHTML = bloq ? `<div class="banda-peligro">Tiene compromiso A medida hasta el ${fechaCorta(pd.compromiso_hasta)}: no se puede bajar antes.</div>`
          : rangoPlan($('opplan').value) < rangoPlan(de) && p.length ? `<div class="banda-aviso">Al pasar a ${esc(planDe($('opplan').value).nombre)} dejará de tener:<ul>${p.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
      };
      $('opplan').addEventListener('change', pinta); pinta();
      $('opok').onclick = async ev => {
        ev.target.disabled = true;
        const p = { plan: $('opplan').value, usuarios: $('opusu').value === '' ? null : +$('opusu').value, pago: $('oppago').value, estado: $('opest').value,
          prueba_hasta: $('opest').value === 'prueba' ? $('opfin').value : null };
        if (p.plan === 'medida') p.compromiso_hasta = $('opcomp').value || null;
        const { data: res, error } = await db.rpc('guardar_plan_organizacion', { p_org: o.id, p });
        ev.target.disabled = false;
        if (error || !res || !res.ok) {
          toast(({ permiso: 'No tienes permiso', minimo: 'Mínimo 3 usuarios (salvo A medida)', prueba_hasta: 'Falta la fecha de fin de la prueba', plan: 'Plan no válido',
            compromiso: `Tiene compromiso A medida hasta el ${fechaCorta(res && res.hasta)}` })[(res && res.error) || ''] || 'No se ha podido guardar', true);
          return;
        }
        $('dlg').close(); toast('Plan guardado'); pintarOrganizaciones();
      };
    };
  });
  return r;
})(orgAcciones);

