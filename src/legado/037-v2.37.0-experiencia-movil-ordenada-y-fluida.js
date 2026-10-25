/* ============================================================
   DLC OS 2.0 · v2.37.0 · Experiencia móvil ordenada y fluida,
   navegación sin rebotes (solo vale la última petición), configuración
   unificada, buscador del manual, alertas legibles, compartir por
   WhatsApp con el menú del sistema y unidades por periodo en la ficha
   ============================================================ */

/* ---------------- navegación: cada cambio de módulo descarta lo pendiente ---------------- */

let NAV_CTRL = new AbortController(), NAV_GEN = 0;
window.delcos.legacyB.keepLatestAnswers();
window.delcos.legacyB.hideForeignViews();

/* ---------------- selectores de fecha y hora en su propia capa (nunca se cortan) ---------------- */

window.delcos.legacyB.preparePickerLayer();
;

/* ---------------- rendimiento: los campos se mejoran por lotes ---------------- */

let MEJ_PEND = new Set(), MEJ_RAF = 0;

/* ---------------- barra de herramientas ordenada en el móvil ---------------- */

window.delcos.legacyB.orderMobileToolbars();

/* ---------------- menú «Más» del móvil con el mismo estilo ---------------- */

function abrirMasMovilBase() { return window.delcos.legacyB.openMoreMenu(); }
function pintarBnavBase3() { return window.delcos.legacyB.paintBottomNav(); }

/* ---------------- Inicio: tarjeta de bienvenida con lo importante de hoy ---------------- */

// v2.105.0: los subtítulos que dependen del vocabulario o del nombre de un estado se calculan al pintarlos (get)
const KPI_TXT = window.delcos.content.indicatorTexts();

/* ---------------- alertas: ventana clara, con qué significa y qué hacer ---------------- */

window.delcos.legacyB.listenToAlertWindows();

/* ---------------- asignar comercial: solo perfiles de tipo Comercial ---------------- */

window.delcos.legacyB.keepOnlySalespeople();

/* ---------------- Administración en el móvil: cada persona como tarjeta ---------------- */

window.delcos.legacyB.cardsForPeopleOnMobile();
