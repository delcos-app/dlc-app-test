// @ts-check
// pantallas/cuentas.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.


// Ficha: historial de cambios (de la ficha y de sus consultas), plegado al final; solo administración

// ——— En la ficha del equipo: lo que ha enviado desde su portal ———

function recientesDe(ids, fecha) { return window.delcos.leftovers.recentContacts(ids, fecha); }

const F = { q: '', prov: '', muni: '', esp: '', est: '', urg: false, orden: 'nombre', pagina: 0, total: 0, campos: {} };

 // v2.440.0: FICHA_ID → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: CERCA → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: OPF → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: FICHA_PAC → estado de src/app (plan 6.6), accesible en window

const ES_MEDICO = () => puede('portal_prescriptor');

/* ============================================================
   v2.102.0 · «Tu día» por centros
   Las citas seguidas en un mismo centro se agrupan bajo el centro (como las
   paradas del plan). Y la ficha abierta desde una cita muestra en «Para la
   visita» la consulta de ESE centro. (El SQL 79 pone la base en hora de España.)
   ============================================================ */
 // v2.440.0: FICHA_CENTRO → estado de src/app (plan 6.6), accesible en window   // centro de la cita desde la que se abre la ficha

const NOMBRE_ESTADO_CENTRO = { 'Pendiente de confirmar': 'p-warn', Confirmado: 'p-est', 'Pendiente de validar': 'p-warn', Validado: 'p-est',   // v2.349.0 (SQL 176); los dos de antes, por si la base aún no lo tiene
  Preparado: 'p-per', Anulado: 'p-anu' };

/* v2.177.0 · Ficha de centro (decisión de Eric, 5/10/2026): los centros dados de alta salen en el buscador (SQL 111, buscar_global con id) y al
   pulsarlos se abre su ficha: dirección, teléfono, cómo llegar, horario y la lista de profesionales que atienden allí (ficha_centro), con
   «+ Añadir» (centro_anadir_profesional: enlaza o crea su consulta en el centro), y en cada uno Ficha, «+ Cita» en ese centro y «Quitar»
   (centro_quitar_profesional: quita esa consulta de su ficha). «Editar centro» corrige sus datos y su horario (guardar_centro). */

/* v2.189.0 · La consulta privada tiene su propia ficha (aviso de Eric: al elegir «Consulta privada (sin centro)» no se podía poner ni la dirección:
   esos datos de la consulta solo los rellenaba un centro). Ahora una consulta sin centro cuyo nombre empieza por «Consulta privada» se ve como tal
   (no como «Sin enlazar») y tiene «Editar la consulta» / «Añadir la dirección»: dirección, código postal, población, provincia y su punto en el mapa
   (buscando la dirección o con «Estoy aquí»). Planta, sala, indicaciones, teléfono y horario siguen debajo, como en cualquier consulta.
   Se guarda con la ficha (en la consulta del profesional; no crea un centro compartido). */
/* ============================================================
   v2.241.0 · Volver, pestañas, pasos y fichas: una sola forma (Eric eligió la A «Ligera» de
   https://claude.ai/artifact/SYZkDbbm8dtSRTUWEN5TE4). «‹ Destino» como enlace encima del título; pestañas en caja segmentada;
   pasos de los asistentes en barra numerada; y la ficha de un registro (pedido, factura, evento, intervención, concurso, equipo, centro,
   stock, depósito) en panel lateral en el ordenador, como la de un contacto: la lista sigue a la vista. Los formularios y las
   ventanas anchas (comparar, importar…) siguen como estaban, y Configuración sigue sin ventanas emergentes.
   ============================================================ */
 // v2.440.0: FX_FICHA → estado de src/app (plan 6.6), accesible en window

function abrirHorarioPlan() { window.delcos.leftovers.openPlanHours(); }

/* Ficha del prescriptor: la ficha base y, en orden, cada bloque que se le añade
   (antes eran 6 capas separadas). */

// La ficha está en src/app/screens/accounts/card (v2.401.0): una lista de secciones con nombre en vez de 18 capas. El nombre
// global se queda: lo llaman muchas pantallas y «‹ Volver» (legado 126) envuelve las ventanas por su nombre.
function abrirFicha(id) { return window.delcos.screens.accounts.openAccountCard(id); }

// La ficha del centro y «Cerca de mí» están en src/app/screens/accounts (v2.417.0). Estos nombres se quedan: «‹ Volver» (legado 089),
// Agenda (legado 077 y 134), el botón de la lista (legado 008) y las pruebas los usan. CERCA se queda: legado 096 lo vacía.
function fichaCentro(id) { return window.delcos.screens.accounts.showCentre(id); }
function cercaDeMi(btn) { return window.delcos.screens.accounts.searchNearby(btn); }

// El editor de cuentas, el selector de profesionales, los filtros guardados, los horarios, la cartera, el estado y la barra están en
// src/app/screens/accounts (v2.419.0). Estos nombres se quedan: la ficha, «Crear nuevo» (legado 002), Analítica, Clientes, Configuración,
// los puentes, legado 001, 004, 007, 014, 018, 044, 057, 077 y 135, servicios/mapas.js («Estoy aquí»), lista.js y las pruebas los usan.
function abrirEditor(id, tipo) { return window.delcos.screens.accounts.openEditor(id || null, tipo || null); }
function fichaNueva() { return window.delcos.screens.accounts.newAccountNames(); }
function selectorMedico(el, o) { return window.delcos.screens.accounts.pickAccount(el, o || {}); }
function filtroActual() { return window.delcos.screens.accounts.currentFilter(); }
function textoFiltro(f) { return window.delcos.screens.accounts.filterText(f || {}); }
function aplicarFiltroGuardado(f) { return window.delcos.screens.accounts.applySavedFilter(f || {}); }
function marcarUbicado(box, i, lat, lon, texto) { return window.delcos.screens.accounts.markLocated(box, i, { lat, lon }, texto || ''); }
function ordenarCabeceraCuentas() { return window.delcos.screens.accounts.arrangeHeader(); }
function cpPoner(box, i, cen) { return window.delcos.screens.accounts.setCentre(box, i, cen || null); }
function pintarCentroSel(box, i, modo) { return window.delcos.screens.accounts.paintCentrePicker(box, i, modo); }
function listaCentros(res, lista, elegir, extra, alExtra) { return window.delcos.screens.accounts.centreList(res, lista, elegir, extra ? { html: extra, onClick: alExtra || (() => {}) } : undefined); }
function centroDesdeUbicacion(box, i, lat, lon) { return window.delcos.screens.accounts.centreFromLocation(box, i, lat, lon); }
function centroConConsulta(c, fecha) { return window.delcos.screens.accounts.otherCentreWithConsultation(c, fecha); }
function bajaCuenta(id, baja) { return window.delcos.screens.accounts.setAccountOut(id, !!baja); }
function verCartera(id) { return window.delcos.screens.accounts.showPortfolio(id); }
function cargarFiltros(soloMunicipios) { return window.delcos.screens.accounts.loadFilters(!!soloMunicipios); }
function optFiltro(lista, v, todo) { return window.delcos.screens.accounts.filterOptionsHtml(lista, v, todo); }
function consultaPrivada(cn) { return window.delcos.screens.accounts.privateConsultation(cn || 'C'); }
function esConsultaPrivada(c) { return window.delcos.screens.accounts.isPrivateConsultation(c); }
function barraCuentas() { return window.delcos.screens.accounts.refreshBar(); }
