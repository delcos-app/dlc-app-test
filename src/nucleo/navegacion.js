// nucleo/navegacion.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function volverTrasF5(v) {
  if (v.c) CFG_SEC = v.c;
  if (v.s) CFG_SUB = v.s;
  if (v.p) Object.assign(PAG_TAB, v.p);
  if (['config', 'perfil', 'empresa', 'plan'].includes(v.t) || puedeModulo(v.t)) ir(v.t);
}

/* v2.137.0 · Entorno de pruebas sin franja (petición de Eric: tapaba la cabecera y no hace falta algo tan grande). Junto al logo, un
   indicador pequeño «Pruebas»; los botones «Traer los datos de producción» y «Volver a los datos de partida», con sus fechas y el
   estado de la copia, pasan a Organización → Entorno de pruebas. */
async function volverDatosPartida() {
  if (!await preguntar('Se borrará todo lo creado o cambiado en el entorno de pruebas y los datos volverán a como se copiaron de producción. No se puede deshacer.',
    { titulo: '¿Volver a los datos de partida?', ok: 'Sí, volver', peligro: true })) return;
  pantallaCarga('Volviendo a los datos de partida…');
  let { data: r, error } = await RPC_ORIG('pruebas_resetear_responsable', { p_confirmacion: 'RESTABLECER' });
  if (error && /pruebas_resetear_responsable|PGRST202|not find/i.test(error.message || '')) ({ data: r, error } = await RPC_ORIG('pruebas_resetear', { p_confirmacion: 'RESTABLECER' }));
  if (error || !r || !r.ok) {
    quitarCarga();
    toast(r && r.error === 'permiso' ? 'Solo la persona responsable del entorno puede hacerlo' : r && r.error === 'sin_maestro' ? 'Faltan los datos de partida' : 'No se ha podido: ' + ((error && error.message) || (r && r.error) || ''), true);
    return;
  }
  limpiarDatosLocales(); location.reload();
}

/* ============================================================
   v2.267.0 · Carga visible y arreglos del móvil (avisos de Eric, 11/10/2026).
   - Al cambiar de pantalla, una línea de luz cruza la parte alta de punta a punta (como un cometa, con los colores de la marca).
   - Los esqueletos llevan su cargador pequeño en cada bloque (y el brillo es más visible): se ve que está cargando.
   - Inicio en el móvil: el engranaje y «Actualizar» están en su sitio desde el primer momento (antes aparecían tarde, primero en
     otra línea y después junto al título) y el saludo no se corta.
   - Menú del móvil: Oportunidades, Compras y Proveedores se marcan ellas (antes se marcaba Pedidos); «Usuarios y roles» pasa a
     «Usuarios» (los roles están en Configuración).
   - El «+» de las listas vuelve a ser el botón redondo después de girar el móvil (antes se quedaba como un botón de texto grande).
   ============================================================ */
// ---- La línea de luz al cambiar de pantalla
function cometa() {
  let c = $('cometa');
  if (!c) { document.body.insertAdjacentHTML('beforeend', '<div id="cometa" class="cometa" aria-hidden="true"><i></i></div>'); c = $('cometa'); }
  c.classList.remove('va'); void c.offsetWidth; c.classList.add('va');
}

function tabDelMenu() { return TAB === 'ventas' && typeof PEDSEC !== 'undefined' && SUBSEC_MENU[pedsecVista()] ? SUBSEC_MENU[pedsecVista()] : TAB; }

// 2. «Estable»: sin consultas pendientes y sin cambios en el elemento durante 120 ms (como mucho, el tiempo indicado)
function estable(el, max = 4000, desde) {
  return new Promise(res => {
    // Las esperas se miden con el cronómetro interno del navegador (siempre avanza; el reloj puede saltar)
    const t0 = desde || Date.now() - 5, p0 = performance.now(); let ultimo = p0 - 5, fin = false;
    // Cuentan los cambios dentro del elemento (no los de su propia clase, que son los del mecanismo de carga)
    const mo = new MutationObserver(ms => { if (ms.some(m => m.target !== el && !cambioDeCifra(m))) ultimo = performance.now(); });   // v2.269.0
    mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    const listo = () => { if (fin) return; fin = true; mo.disconnect(); res(); };
    // Pantalla ya cargada: si al terminar la tarea actual no hay consultas ni cambios, se muestra al momento
    // Una pantalla con esqueletos de carga (recuadros «Cargando…») todavía no está lista
    const conEsqueletos = () => !!el.querySelector('.skel, .ksk, .cargandolocal');
    setTimeout(() => { if (pendientesDesde(t0) === 0 && ultimo <= p0 && !conEsqueletos()) listo(); }, 0);
    const w = setInterval(() => {
      if (fin) { clearInterval(w); return; }
      // Solo las consultas lanzadas desde que empezó (las que ya estaban en curso, como la campana, no cuentan)
      // …y con un respiro de 120 ms desde el último cambio y desde la última consulta terminada (las encadenadas no se toman por el final)
      const ya = performance.now();
      if ((pendientesDesde(t0) === 0 && ya - Math.max(ultimo, RED_ULTIMO_FIN) >= 50 && !conEsqueletos()) || ya - p0 > max) { clearInterval(w); listo(); }   // v2.269.0: 50 ms (antes 120)
    }, 15);
  });
}

function pantallaTrasF5() {
  let v = null;
  try { v = JSON.parse(sessionStorage.getItem('dlc-f5') || 'null'); sessionStorage.removeItem('dlc-f5'); } catch (x) { v = null; }
  // Solo si se acaba de pulsar (una recarga horas después, o desde el botón del navegador, entra por el inicio)
  return v && v.t && Date.now() - (v.h || 0) < 60000 ? v : null;
}

function nombrePantalla(t) {
  const b = document.querySelector(`nav.main [data-t="${t}"]`);
  const n = (b && b.textContent.trim()) || (typeof PAGINAS !== 'undefined' && PAGINAS[t] && PAGINAS[t].t) || (t === 'config' ? 'Configuración' : '');
  return n || 'donde estabas';
}

/* ============================================================
   v2.269.0 · Cargas rápidas, filtros que se mantienen y notas en Pedidos (petición de Eric, 11/10/2026; necesita el SQL 144).
   - Las pantallas se enseñan antes: «estable» espera 50 ms sin cambios (antes 120), mira cada 15 ms (antes 30) y no espera a las
     cifras que cuentan (Analítica esperaba ~1 s oculta a que terminaran sus indicadores). Con el SQL 144
     las consultas lentas bajan a 20-60 ms.
   - Los indicadores de una lista solo se piden en su pantalla (los de Clientes se pedían también en Pedidos, Compras, Productos…).
   - Los filtros de las listas (los de la fila de filtros y los propios del panel «Filtros») se recuerdan: si la pantalla se vuelve a pintar (al guardar un pedido,
     al volver a ella…) salen con lo que tenías puesto, hasta que los quites tú.
   - Pedidos: columna «Notas».
   ============================================================ */
// Una cifra que se anima al contar (solo cambia su texto, y son números) no es «la pantalla sigue cargando»: antes, en Analítica,
// la pantalla esperaba oculta ~1 s a que terminaran de contar los indicadores
function cambioDeCifra(m) {
  if (m.type !== 'childList') return false;
  const ns = [...m.addedNodes, ...m.removedNodes];
  return ns.length > 0 && ns.every(n => n.nodeType === 3) && /^[\d.,\s%€+\-−]*$/.test(m.target.textContent || '');
}

function refrescarDebajo() {
  if (document.querySelector('dialog[open]')) { DATOS_CAMBIADOS = true; return; }
  DATOS_CAMBIADOS = false;
  if (TAB === 'agenda' && $('agcuerpo')) agRefrescoQuieto(null, { cifras: false });
  else if (TAB === 'directorio' && typeof buscar === 'function') buscar(true);
}

// v2.92.0: la pantalla recién revelada llega con un fundido corto (las repintadas posteriores no se animan)
function llegar(el) {
  if (!el || !el.matches('main > section')) return;
  el.classList.remove('llega'); void el.offsetWidth; el.classList.add('llega');
  clearTimeout(el._llega); el._llega = setTimeout(() => el.classList.remove('llega'), 700);
}

function subirAccionPagina() {
  if (typeof PAGINAS === 'undefined' || !PAGINAS[TAB]) return;
  const sec = $('v-' + TAB), sal = sec && sec.querySelector(':scope > .saludo'); if (!sal) return;
  ACCION_PAGINA.forEach(id => {
    const b = $(id); if (!b || !sec.contains(b) || b.closest('.saludo')) return;
    let acts = sal.querySelector(':scope > .acts');
    if (!acts) { sal.insertAdjacentHTML('beforeend', '<div class="acts htacts"></div>'); acts = sal.querySelector(':scope > .acts'); }
    acts.appendChild(b);
  });
}

function vistaBoton(v, d0) {
  const d = d0 || (v && v.dlg); if (!d || !d.open || !VUELTA.length || d.querySelector('.vueltabtn')) return;
  const fh = d.querySelector('.fh'); if (!fh) return;
  const ant = VUELTA[VUELTA.length - 1];
  const t = fh.firstElementChild, dentro = t && t.tagName !== 'BUTTON' && !t.matches('h2') ? t : fh;
  dentro.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec chico vueltabtn" title="Volver a ${esc(VISTA_TITULO[ant.fn] || 'la ventana anterior')}">‹ Volver</button>`);
}

let TAB_ANTERIOR = 'inicio';

let APP_VISIBLE = false;

const PAGINAS = {
  perfil: { t: 'Mi perfil', d: 'Tus datos, idioma, qué abrir al entrar y tus notificaciones', tabs: [['datos', 'Mis datos', () => pintarPerfil()], ['notif', 'Notificaciones', () => pintarNotif()]] },
  empresa: { t: 'Empresa', d: 'Marca, correo de la empresa y copias de seguridad', admin: true, tabs: [['marca', 'Marca y logo', () => pintarMarca()], ['correo', 'Correo y firma', () => pintarCorreo()], ['copias', 'Copias de seguridad', () => pintarCopias()]] },
  plan: { t: 'Plan y suscripción', d: '', admin: true, tabs: [['plan', 'Plan', () => pintarPaginaPlan()]] }
};

let VIA_IR = null;

// 3. Pantallas: se preparan ocultas y se muestran de golpe
let REVELADO = 0;

let CLIC_PESTANA = null;

let IR_DESDE_MENU = false;

/* v2.144.0 · Páginas propias: la acción principal («+ Nuevo usuario», «+ Nueva organización») sube a la derecha de la cabecera, como
   «+ Nueva venta» en el resto de pantallas (regla de Eric: misma posición en todas). Antes iba dentro de la tarjeta, junto al buscador. */
const ACCION_PAGINA = ['usrnuevo', 'orgnueva'];

let ACCION_PAG_PEND = false;

// ---- Menú del móvil: la sección que se ve, no la página que la contiene
const SUBSEC_MENU = { llamadas: 'oportunidades', compras: 'compras', proveedores: 'proveedores' };

/* ============================================================
   v2.300.0 · Volver siempre al punto de partida (petición de Eric). Cuando desde una ventana se abre otra (una cita → la
   ficha del centro → la ficha de un profesional…), la de antes se apunta en una pila. Al cerrar la de dentro (con su ✕,
   con «‹ Volver» o al guardar y cerrarse), se vuelve a abrir la anterior con sus datos al día, en vez de dejar a la persona
   en la pantalla de debajo. Cerrar la primera cierra del todo. Cambiar de pantalla vacía la pila.
   ============================================================ */
const VUELTA = [];

const VISTA_TITULO = { verCita: 'la cita', fichaCentro: 'el centro', abrirFicha: 'la ficha', verPedido: 'el pedido', verFactura: 'la factura', verEvento: 'el evento',
  verCirugia: 'la intervención', verConcurso: 'el concurso', verEquipo: 'el equipo', verDeposito: 'el depósito', fichaStock: 'el producto' };

const vistaDlg = () => ['ficha', 'dlg'].map($).find(d => d && d.open) || null;

const vistaIgual = (a, b) => a && b && a.fn === b.fn && JSON.stringify(a.args.map(x => x && x.id || x)) === JSON.stringify(b.args.map(x => x && x.id || x));
