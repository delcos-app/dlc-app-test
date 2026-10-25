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
const KPI_TXT = { citas: 'Visitadas de las citas de hoy', urgentes: `${TT('medico', 'p', '', 'l', 'C', 'marcado')} urgentes sin ${TT('visita', 's', '', 'l', 'l')}`, visitas_sem: 'Registradas de lunes a hoy',
  visitas_mes: 'Registradas en el mes', get interesados() { return `En estado «${estadoPapel('interes') || 'interés'}»`; }, sin_contactar: `Todavía sin ${TT('visita', 's', 'primer', 'l', 'l')}`, get cartera() { return `Asignad${terminoDe('medico').g === 'f' ? 'a' : 'o'}s a ti`; },
  dups: 'Fichas por revisar', uds_mes: 'Unidades confirmadas en el mes', prescriptores: 'Con algún pedido este mes', nuevos_presc: 'Primer pedido este mes',
  activos_90: 'Con ventas en 90 días', get conversion() { return `Visitad${terminoDe('medico').g === 'f' ? 'a' : 'o'}s ya en «${estadoPapel('positivo') || 'positivo'}»`; }, importe_mes: 'Base sin IVA del mes', borradores: 'Pedidos sin confirmar',
  sin_visita_60: 'Hace más de 60 días', sin_horario: 'Sin días de atención', muestras_mes: 'Entregadas este mes', material_mes: 'Entregado este mes',
  citas_7d: 'Programadas los próximos 7 días', visitas_7d: 'En los últimos 7 días' };

/* ---------------- alertas: ventana clara, con qué significa y qué hacer ---------------- */

window.delcos.legacyB.listenToAlertWindows();

/* ---------------- asignar comercial: solo perfiles de tipo Comercial ---------------- */

window.delcos.legacyB.keepOnlySalespeople();

/* ---------------- Administración en el móvil: cada persona como tarjeta ---------------- */

window.delcos.legacyB.cardsForPeopleOnMobile();
