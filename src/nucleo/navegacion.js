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
