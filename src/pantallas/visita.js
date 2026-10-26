// @ts-check
// pantallas/visita.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Ficha · Material entregado y datos bajo cada visita del historial

// Registrar visita · Aviso si el médico no tiene horario de atención

// Ficha y resultados de la visita: de la red y, sin ella, de la copia guardada

// La ventana a pantalla completa (desde la visita o desde la ficha del producto)

// Ver un material desde la ficha del producto (sin marcar nada como presentado)

const esMuestras = d => (CAT.resultado_visita || []).some(x => x.valor === d.valor && x.papel === 'muestras');

/* v2.191.0 · Visita a distancia y fotos de la visita (primera tanda del estudio por sectores, SQL 118).
   - Al registrar una visita se elige cómo fue: Presencial (por defecto), Por teléfono o Por videollamada (actividades.modo). En el historial
     de la ficha, las que no son presenciales lo dicen.
   - Fotos de la visita (lineal, exposición, material colocado…): se reducen a 1600 px en JPEG como los justificantes y se guardan en
     actividad_fotos al registrar la visita. Sin conexión la visita se guarda igual y las fotos se añaden después desde su historial
     («📷 Fotos»), donde también se ven y se borran. */

 // v2.440.0: VISITA_ACTUAL → estado de src/app (plan 6.6), accesible en window   // { id, modo, fotos } de la ventana «Registrar visita» abierta

/* v2.192.0 · Muestras con control legal (primera tanda del estudio por sectores, SQL 119; RD 1416/1994, art. 16).
   - Producto: «Muestra con control legal» con fecha de autorización (se pueden dar los 2 años siguientes) y máximo por profesional y año.
   - Registrar visita: si la empresa tiene productos regulados, bloque «Muestras de medicamento» con lo que queda este año para ese
     profesional; si se entrega alguna, pide la firma (con el dedo o el ratón) y el nombre de quien firma. Se comprueba antes de guardar
     la visita; después, registrar_muestras guarda todo o nada (también desde la cola sin conexión, enlazada por el op_id de la visita).
   - Ficha: «Muestras este año» con lo entregado y lo que queda de cada producto regulado. */
const MUESTRA_ERR = { firma: window.delcos.t('legacyTexts.samples.signature'), profesional: window.delcos.t('legacyTexts.samples.professional'),
  plazo: window.delcos.t('legacyTexts.samples.period'), limite: window.delcos.t('legacyTexts.samples.limit'),
  permiso: window.delcos.t('legacyTexts.samples.permission'), producto: window.delcos.t('legacyTexts.samples.product'), no_existe: window.delcos.t('legacyTexts.samples.account') };

const muestraError = r => (MUESTRA_ERR[r && r.error] || window.delcos.t('legacyTexts.samples.failed')) +
  (r && r.error === 'limite' ? window.delcos.t('legacyTexts.samples.left', { product: r.producto, left: r.quedan, max: r.max }) : r && r.error === 'plazo' ? ` (${r.producto})` : '');

/* ============================================================
   v2.259.0 · Visita sin conexión (pendiente de la auditoría del 8/10, cerrado el 11/10/2026). Antes, sin cobertura la ventana
   «Registrar visita» ni se abría; si la red caía al guardar, la visita podía rechazarse al reenviarla otro día (por la fecha) y
   perderse sin aviso, o duplicarse al repetir. Ahora:
   - La visita se abre sin conexión con la última copia de la ficha (la misma de la ficha) y de sus resultados, y los catálogos
     quedan guardados en el móvil.
   - Al guardar sin conexión: a la cola con «sin conexión» (el servidor no la rechaza por la fecha), con el mismo op_id aunque se
     repita, y las fotos se guardan en el móvil (IndexedDB) y se suben solas cuando se envía la visita.
   - «Tu día» marca la cita «Registrada en el móvil · pendiente de enviar» y quita «Registrar».
   - La cola se envía de una en una (sin dos envíos a la vez); lo que el servidor rechaza no se pierde: queda en «sin enviar», con
     aviso y la opción de reintentar o descartar; el tiempo agotado cuenta como fallo de red.
   - Sin conexión, la app arranca con el perfil guardado aunque no pueda comprobar la sesión.
   - Las muestras siguen necesitando conexión (el límite legal se comprueba en el servidor): la ventana lo avisa.
   ============================================================ */

/* ============================================================
   v2.266.0 · Presentaciones de producto en la visita (grupo 4 del plan del 11/10/2026; necesita el SQL 143).
   - Ficha del producto (administración): «Material para presentar», imágenes o PDF (fichas técnicas, estudios, catálogo).
   - «Registrar visita»: bajo «Productos presentados», «Presentar» con los productos que tienen material; se ve a pantalla completa
     (con flechas y teclado) y el producto queda marcado como presentado (cuenta en la cobertura del ciclo).
   - El material se descarga al enseñarlo y se queda en memoria mientras la app está abierta; sin conexión, solo lo ya visto.
   ============================================================ */
const PRES_MAX = 8 * 1024 * 1024;

const PRES_DATOS = new Map();               // id → datos (base64) ya descargados

/* v2.96.0 · «Para la visita»: lo que hace falta al llegar, arriba del todo.
   Dónde (centro, planta, sala, cómo llegar), cuándo (su horario de hoy y el del centro), cómo entrar,
   lo que quedó pendiente en la última visita, las notas y a quién llamar. Las ventas van al final. */
// La consulta de la visita: la que tiene consulta hoy; si ninguna, la principal

/* Registrar visita: la ventana base y el aviso si falta el horario de atención (antes eran 3 capas). */

// Médico «sin reporting»: la ventana de visita no ofrece los resultados de reporting

// La consulta de la visita: la del centro de la cita; si no, la que tiene consulta hoy; si no, la principal

/* Parte base; abrirVisita le añade el resto */

/* v2.179.0 · Resultados de visita según el estado de la ficha (decisión de Eric, SQL 113): al registrar una visita solo salen los resultados
   que tocan en el estado de esa ficha (clasificadores_actividad con p_cuenta marca «oculto» los demás); «Ver todos» los enseña igualmente.
   En Configuración, cada resultado lleva «En todos los estados» / «Solo en: …» para elegir en qué estados aparece (guardar_valor, en_estados). */

// Aviso en la ventana de la visita sin conexión

// Las ventanas de la visita están en src/app/screens/visit (v2.412.0). Estos nombres se quedan: Agenda, la ficha, Productos,
// Configuración, api.js, archivos.js y las pruebas los usan.
function abrirVisita(id) { return window.delcos.screens.visit.openVisit(id); }
function editarVisita(v, cuenta) { return window.delcos.screens.visit.editVisit(v, cuenta); }
function verFotosVisita(actividad, cuenta) { return window.delcos.screens.visit.showVisitPhotos(actividad, cuenta); }
function subirFotosVisita(actividad, fotos) { return window.delcos.screens.visit.uploadVisitPhotos(actividad, fotos); }
function presMateriales(forzar) { return window.delcos.screens.visit.loadMaterials(!!forzar); }
function presentarSolo(p, idm) { return window.delcos.screens.visit.presentOnly(p, idm); }
function editorMuestras() { return window.delcos.screens.visit.editSamples(); }
function guardarAvisoRevisita(v) { return window.delcos.screens.visit.saveRevisitNotice(v); }
