/* ============================================================
   DLC OS 2.0 · v2.28.0 · Móvil con todos los módulos, entrar como
   otro usuario, manual, alertas de cruce, cartera exclusiva, aviso
   de visita reciente, servicios, inicio de Rutas y un Inicio con más valor
   ============================================================ */

Object.assign(RPC_TTL, { alertas_mias: 60, alertas_cruce: 120, actividades_recientes: 30 });

async function cargarProductos() {
  const { data } = await db.rpc('productos_lista');
  const l = data || [];
  PRODUCTOS = l.filter(p => (p.tipo || 'producto') === 'producto');
  SERVICIOS = l.filter(p => p.tipo === 'servicio');
}

/* ---------------- móvil: los cuatro principales y «Más» ---------------- */

function pintarBnav() {
  const b = $('bnav'); if (!b) return;
  const principales = ['inicio', 'agenda', 'rutas', 'directorio'];
  const iconos = { inicio: '◉', agenda: '▤', rutas: '➤', directorio: '☰' };
  b.innerHTML = principales.map(t => `<button data-t="${t}" aria-selected="${TAB === t}"><span>${iconos[t]}</span>${esc((document.querySelector(`nav.main [data-t="${t}"]`) || {}).textContent || t)}</button>`).join('')
    + `<button id="bmasbtn" aria-selected="${!principales.includes(TAB)}"><span>⋯</span>Más</button>`;
  b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => ir(x.dataset.t));
  $('bmasbtn').onclick = abrirMasMovil;
}


/* ---------------- entrar como otro usuario ---------------- */

const SKEY = 'dlc-suplantador';



async function volverAMiSesion() {
  const s = suplantando(); if (!s) return;
  const { error } = await db.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
  localStorage.removeItem(SKEY);
  limpiarDatosLocales();
  if (error) { await db.auth.signOut(); toast('Tu sesión había caducado: vuelve a entrar', true); }
  location.reload();
}


document.addEventListener('click', e => {
  const b = e.target.closest('[data-ucomo]');
  if (b) entrarComo(b.dataset.ucomo);
});

AREAS.push(['U', 'Impersonalizar usuarios']);

/* ---------------- manual de uso ---------------- */


const MANUAL = [
  { id: 'inicio', t: 'Inicio', a: 'H', para: 'El resumen de tu día y de tu semana: indicadores, alertas, tu agenda de hoy y lo que conviene hacer.',
    hacer: [[1, 'Ver tus indicadores, tu semana, tus ventas del mes y las alertas'], [1, 'Personalizar qué indicadores ves (icono ⚙)']],
    config: ['Indicadores visibles y su orden (⚙ junto al saludo)'] },
  { id: 'agenda', t: 'Agenda y «Tu día»', a: 'G', para: `Tus citas por día, semana o mes. La vista de día es tu ruta: orden, horas estimadas y registro de ${TT('visita', 'p', '', 'l', 'l')}.`,
    hacer: [[1, 'Ver tu agenda'], [2, 'Crear, mover, aplazar, confirmar o descartar citas'], [2, 'Ordenar tu día por cercanía y empezar la jornada'], [2, 'Planificar la semana y bloquear días'],
      [3, 'Ver la agenda de otra persona y el cumplimiento del equipo (administración y televenta)']],
    config: [`Salida y vuelta: en cada ruta y en «Planificar la semana»; minutos por ${TT('visita', 's', '', 'l', 'l')} en Rutas → ⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')}`, `Aviso de ${TT('visita', 's', '', 'l', 'l')} reciente (Configuración → Preferencias)`, 'Frecuencia objetivo por estado (Agenda → Equipo, administración)'] },
  { id: 'rutas', t: 'Rutas', a: 'R', para: `Plantillas de ${TT('medico', 'p', '', 'l', 'l')} para llenar tu agenda: listas fijas o por criterios, y propuestas automáticas.`,
    hacer: [[1, 'Ver tus rutas y las propuestas'], [2, 'Crear y editar rutas, planificarlas y pasarlas a tu agenda']],
    config: ['Punto de salida y llegada (Configuración → Preferencias)', `Salida y vuelta de cada ruta (al crearla o editarla) y tiempos de ${TT('visita', 's', '', 'l', 'l')} (⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')})`] },
  { id: 'directorio', t: `${TT('medico', 'p', '', 'l', 'C')}`, a: 'M', para: `Todos ${TT('medico', 'p', 'el', 'l', 'l')} que puedes ver: tu cartera o toda la base si eres de administración o televenta.`,
    hacer: [[1, 'Buscar, filtrar y ver fichas'], [2, 'Editar fichas y horarios de atención'], [3, `Dar de alta ${TT('medico', 'p', '', 'l', 'l', 'nuevo')}`], [3, 'Unificar duplicados (administración)']],
    config: ['Columnas visibles (⋯ → Elegir columnas)', 'Filtros guardados como indicadores de Inicio'] },
  { id: 'centros', t: 'Centros', a: 'C', para: 'Las fichas de centros y clínicas.',
    hacer: [[1, 'Ver fichas de centros'], [2, 'Editarlas'], [3, 'Darlas de alta']], config: [] },
  { id: 'visitas', t: `${TT('visita', 'p', '', 'l', 'C')}`, a: 'S', para: `El registro de cada ${TT('visita', 's', '', 'l', 'l')}: resultado, muestras, material entregado y próxima acción.`,
    hacer: [[1, `Ver el historial de ${TT('visita', 'p', '', 'l', 'l')}`], [2, `Registrar y editar ${TT('visita', 'p', '', 'l', 'l')}`]],
    config: ['Resultados y material comercial con su dato (Configuración → Clasificadores, «+ Dato»)'] },
  { id: 'ventas', t: 'Ventas, Clientes y Productos', a: 'V', para: `Pedidos con IVA y servicios, clientes (${TT('paciente', 'p', '', 'l', 'l')} y empresas) y el catálogo de productos y servicios.`,
    hacer: [[1, `Ver los pedidos y clientes de tus ${TT('medico', 'p', '', 'l', 'l')}`], [2, 'Crear, confirmar y anular pedidos; dar de alta clientes (televenta)'], [3, 'Todo lo anterior sobre toda la base']],
    config: ['Productos y servicios (solo administración)', 'Servicio propuesto por defecto en pedidos nuevos'] },
  { id: 'config', t: 'Configuración', a: 'K', para: 'Tus preferencias y las listas que usa toda la plataforma.',
    hacer: [[0, 'Cambiar tus preferencias de salida, llegada, navegador y avisos'], [1, 'Ver clasificadores'], [2, 'Añadir y editar valores de clasificadores'], [3, 'Crear clasificadores nuevos']], config: [] },
  { id: 'admin', t: 'Administración', a: null, para: 'Usuarios, permisos, carteras, comisiones, accesos y auditoría. Solo administración.',
    hacer: [[3, 'Crear y editar usuarios y sus permisos'], [3, 'Asignar carteras (exclusivas o no)'], [3, 'Configurar comisiones y liquidar'], [3, 'Impersonalizar a otro usuario para revisar lo que ve']],
    config: [`Cartera exclusiva: ${TT('medico', 's', 'un', 'l', 'l')} en una sola cartera (Agenda → Equipo → ⚙ Reglas de cartera)`] }
];

const FAQ = [
  ['No veo un módulo', 'Depende de tus permisos. En la ficha de cada módulo de este manual ves tu nivel de acceso; si necesitas más, pídelo a administración.'],
  [`He registrado ${TT('visita', 's', 'un', 'l', 'l')} por error`, `Abre la ficha ${TT('medico', 's', 'del', 'l', 'l')}, busca ${TT('visita', 's', 'el', 'l', 'l')} en el historial y pulsa «Editar»: puedes corregirla o borrarla.`],
  ['La hora estimada de una cita no cuadra', `Revisa tu horario de rutas y el horario de atención ${TT('medico', 's', 'del', 'l', 'l')} en su ficha. La estimación cuenta desplazamientos, esperas y minutos por ${TT('visita', 's', '', 'l', 'l')}.`],
  [`${TT('medico', 's', 'un', 'C', 'l')} no aparece en mis rutas`, `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación y, si tiene horario de atención, en sus días y horas. Revisa su ficha.`],
  ['¿Puedo usar la app sin conexión?', `Sí: consulta lo último que viste y registra ${TT('visita', 'p', '', 'l', 'l')}; se envían solas al recuperar la conexión.`],
  ['¿Por qué no puedo descargar datos?', `Por seguridad: los datos de ${TT('medico', 'p', '', 'l', 'l')} y ventas solo se consultan dentro de la plataforma.`]
];


/* ---------------- navegación: manual y barra de suplantación ---------------- */


document.addEventListener('click', e => {
  if (e.target.closest('#manbtn')) { e.stopPropagation(); document.querySelectorAll('.umenu').forEach(m => m.classList.add('hide')); ir('manual'); }
}, true);

/* ---------------- reglas de cartera ---------------- */


pintarEquipo = (orig => async function () {
  await orig();
  const h = $('agcuerpo').querySelector('.semhead');
  if (h && puede('administrar') && !$('eqcart')) {
    h.insertAdjacentHTML('beforeend', '<button class="btn sec" id="eqcart">⚙ Reglas de cartera</button>');
    $('eqcart').onclick = editorReglasCartera;
  }
})(pintarEquipo);

/* ---------------- aviso de visita reciente ---------------- */




citaRepetida = (orig => async function (medicoId, fecha) {
  const r = await orig(medicoId, fecha);
  if (!r) return r;
  const por = await recientesDe([medicoId], fecha);
  const l = por[medicoId];
  if (!l || !l.length) return r;
  const op = await elegirOpcion('Ya se ha visto hace poco', `${txtReciente(l.slice(0, 3))}.\n\n¿Añades la cita igualmente?`,
    [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'nomas', t: 'Sí, y no volver a avisarme', cls: 'sec' }, { k: 'si', t: 'Añadir igualmente' }]);
  if (!op) return null;
  if (op === 'nomas') { await guardarAvisoRevisita(Object.assign(avisoRevisita(), { on: false })); toast('Aviso desactivado. Puedes activarlo en Configuración → Rutas'); }
  return r;
})(citaRepetida);

// Plan de ruta: marca a quien ya se ha visto hace poco y permite quitarlo

// Preferencias: el aviso se puede activar, desactivar y ajustar

/* ---------------- servicios en Productos ---------------- */

async function cargarProductosModulo() {
  const esAdmin = puede('administrar');
  vaciarModulos('v-productos');
  $('v-productos').innerHTML = `
    <div class="saludo"><div><h1>Productos</h1><div class="fecha">Catálogo de productos y servicios, con precios sin IVA y con IVA</div></div>
      <div class="acts" style="margin:0">${esAdmin ? `<button class="btn" id="prodnuevo">+ Nuevo ${PSEC === 'servicios' ? 'servicio' : 'producto'}</button>` : ''}</div></div>
    <div class="subnav"><button data-ps="productos" aria-pressed="${PSEC === 'productos'}">Productos</button>
      <button data-ps="servicios" aria-pressed="${PSEC === 'servicios'}">Servicios</button></div>
    <div id="vcuerpo"></div>`;
  $('v-productos').querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { PSEC = b.dataset.ps; cargarProductosModulo(); });
  if ($('prodnuevo')) $('prodnuevo').onclick = () => PSEC === 'servicios' ? editorServicio(null) : editorProducto(null);
  if (PSEC === 'servicios') pintarServicios(); else pintarProductos();
}




/* ---------------- Rutas: resumen como pantalla de entrada ---------------- */

RSEC = 'inicio';

// v2.242.0: aquí iba resumenRutas (nadie la usaba)

/* ---------------- Inicio: mi semana, ventas, alertas y equipo ---------------- */


/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  productos: ['Productos y servicios', 'El catálogo que se usa en pedidos, muestras y analítica.', [
    '<b>Productos</b>: lo que se vende. Escribe el precio sin IVA o con IVA: el otro se calcula solo.',
    '<b>Servicios</b>: envío, portes urgentes… Un pedido puede llevar un servicio, que se suma con su propio IVA y no cuenta como unidades.',
    'Marca un servicio como «por defecto» para que se proponga en los pedidos nuevos.',
    'Un producto o servicio inactivo no aparece al crear pedidos, pero se conserva en el histórico.']]
});
AYUDA.inicio[2].push(`<b>Mi semana</b>, <b>Ventas del mes</b> y <b>Alertas</b> resumen lo importante. Administración y televenta ven además los cruces del equipo (${TT('medico', 'p', '', 'l', 'l')} en dos carteras, ${TT('visita', 'p', '', 'l', 'l')} a ${TT('medico', 'p', '', 'l', 'l')} de otra cartera…) y el cumplimiento del equipo.`);
AYUDA.rutas[2].unshift('La pestaña <b>Resumen</b> muestra tu día, las propuestas para hoy y tus rutas, con accesos directos a planificar.');


