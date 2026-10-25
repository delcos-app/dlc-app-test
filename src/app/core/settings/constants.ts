/**
 * Shared settings lists that the legacy code reads as globals (NOMBRES_DETALLE, MOTIVO_REFRESCO, NOTIF_AREAS, NOTIF_DIARIOS,
 * PRESU_*, CFG_CLAVES): pantallas/configuracion.js assigns each global from here at its place in the load order, so they are the
 * same objects (legado 080 still pushes Concursos and Parque into the notification lists). Keys are database values; the texts
 * come from i18n. Migrated from the legacy configuracion.js (v2.428.0).
 */
import { t } from '../../i18n';

/** Registro de facturación: the name of each detail field, by its key in the stored event. */
export const DETAIL_NAMES: Record<string, string> = {
  importe: t('settingsCore.detailNames.importe'), forma: t('settingsCore.detailNames.forma'), motivo: t('settingsCore.detailNames.motivo'),
  para: t('settingsCore.detailNames.para'), asunto: t('settingsCore.detailNames.asunto'), clave: t('settingsCore.detailNames.clave'),
  total: t('settingsCore.detailNames.total'), serie: t('settingsCore.detailNames.serie'), numero: t('settingsCore.detailNames.numero'),
};

/** Why «Traer los datos de producción» was refused, by the error the server returns. */
export const REFRESH_REASONS: Record<string, string> = {
  permiso: t('settingsCore.refreshReasons.permiso'), responsable: t('settingsCore.refreshReasons.responsable'),
  en_marcha: t('settingsCore.refreshReasons.enMarcha'), github: t('settingsCore.refreshReasons.github'),
  no_es_pruebas: t('settingsCore.refreshReasons.noEsPruebas'),
};

/** Notification areas: key, name and the notification types in it. */
export const NOTIFICATION_AREAS: [string, string, string[]][] = [
  ['ventas', t('settingsCore.notificationAreas.sales'), ['reponer', 'caida_ventas', 'pedido_portal', 'venta_cartera', 'pauta', 'pedido_validado', 'pago_recibido', 'borrador_nuevo', 'cliente_nuevo']],
  ['cartera', t('settingsCore.notificationAreas.portfolio'), ['citas_hoy', 'visita_sin_registrar', 'seguimientos_hoy', 'sin_visitar', 'cartera', 'cruce', 'duplicado', 'portal']],
  ['cobros', t('settingsCore.notificationAreas.payments'), ['pagos_pendientes', 'facturas_vencidas', 'stock_minimo', 'lotes_caducan', 'compra_recibida', 'rectificativa']],
  ['equipo', t('settingsCore.notificationAreas.team'), ['usuario_nuevo', 'esquema']],
];

/** The notifications prepared at the start of the day: they only have «en el resumen». */
export const DAILY_NOTIFICATIONS: string[] = ['citas_hoy', 'seguimientos_hoy', 'pagos_pendientes', 'facturas_vencidas', 'lotes_caducan', 'sin_visitar', 'reponer', 'caida_ventas', 'visita_sin_registrar'];

/** «Pedir presupuesto»: what the company needs (stored key and its text). */
export const QUOTE_NEEDS: [string, string][] = (['usuarios', 'migracion', 'conexion', 'portal', 'desarrollo', 'formacion', 'soporte', 'otro'] as const)
  .map(key => [key, t(`settingsCore.quoteNeeds.${key}`)]);

/** «Pedir presupuesto»: when (the text is what is stored). */
export const QUOTE_WHEN: string[] = [t('settingsCore.quoteWhen.soon'), t('settingsCore.quoteWhen.quarter'), t('settingsCore.quoteWhen.later'), t('settingsCore.quoteWhen.browsing')];

/** «Pedir presupuesto»: how each stored state reads for the company. */
export const QUOTE_STATES: Record<string, string> = {
  'Nueva': t('settingsCore.quoteStates.received'), 'En curso': t('settingsCore.quoteStates.inProgress'), 'Cerrada': t('settingsCore.quoteStates.attended'),
};

/** Extra search words of each Configuración entry (the search of the index also finds them by these). */
export const SEARCH_WORDS: Record<string, string> = {
  datos: t('settingsCore.searchWords.datos'), notif: t('settingsCore.searchWords.notif'),
  'rutas.salida': t('settingsCore.searchWords.rutasSalida'), 'rutas.horario': t('settingsCore.searchWords.rutasHorario'),
  'inicio.kpis': t('settingsCore.searchWords.inicioKpis'), usuarios: t('settingsCore.searchWords.usuarios'), roles: t('settingsCore.searchWords.roles'),
  comis: t('settingsCore.searchWords.comis'), 'o.marca': t('settingsCore.searchWords.marca'), 'o.correo': t('settingsCore.searchWords.correo'),
  'o.plan': t('settingsCore.searchWords.plan'), 'o.copias': t('settingsCore.searchWords.copias'), 'o.fiscal': t('settingsCore.searchWords.fiscal'),
  'o.series': t('settingsCore.searchWords.series'), 'o.vf': t('settingsCore.searchWords.vf'), 'o.pdf': t('settingsCore.searchWords.pdf'),
  cat: t('settingsCore.searchWords.cat'), portal: t('settingsCore.searchWords.portal'),
};
