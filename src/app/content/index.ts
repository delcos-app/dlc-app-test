/**
 * Content catalogs (v2.427.0): help popovers, the manual, frequent questions, first steps, Inicio indicators, notification types,
 * permission areas and plans. Before, each one was declared in a legado file and patched by later ones while the app loaded; now
 * each is built once, in its final state, with the company's words, at the place where legacy declares it (AYUDA in legado 017,
 * MANUAL in 027…). The legacy globals are these same objects: code that still adds to them at run time keeps working.
 * Texts in i18n/es/content-help.ts, content-manual.ts and content-lists.ts.
 */
import { definePlanList } from '../core/legacy-c/plans';
import { contentHelp } from '../i18n/es/content-help';
import { contentLists } from '../i18n/es/content-lists';
import { contentManual } from '../i18n/es/content-manual';
import { fillDeep } from './fill';
import { DEFAULT_INDICATORS, indicatorCatalog } from './indicators';
import { contentWords } from './words';

type HelpEntry = [string, string, string[]];

/** AYUDA: [title, text, items] of each screen or card. */
export const screenHelp = (): Record<string, HelpEntry> => fillDeep(contentHelp.screens, contentWords()) as unknown as Record<string, HelpEntry>;
/** AYUDA_KPI: what each Inicio indicator counts. */
export const indicatorHelp = (): Record<string, string> => fillDeep(contentHelp.indicators, contentWords());
/** MANUAL: the sections of the manual. */
export const manualSections = (): typeof contentManual.sections => fillDeep(contentManual.sections, contentWords());
/** FAQ. */
export const questions = (): string[][] => fillDeep(contentManual.questions, contentWords());
/** PRIMEROS_PASOS by kind of user. */
export const firstSteps = (): typeof contentManual.firstSteps => fillDeep(contentManual.firstSteps, contentWords());
/** KPI_CAT. */
export const indicators = (): ReturnType<typeof indicatorCatalog> => indicatorCatalog(contentWords());
/** KPI_DEF: a new list (Configuración changes the user's own copy, not this one). */
export const defaultIndicators = (): string[] => [...DEFAULT_INDICATORS];
/** KPI_TXT. */
export const indicatorTexts = (): Record<string, string> => fillDeep(contentLists.indicatorTexts, contentWords());
/** TIPOS_NOTIF: Concursos and Parque add theirs later (legado 080), as before. */
export const notificationTypes = (): string[][] => fillDeep(contentLists.notificationTypes, contentWords());
/** AREAS. */
export const areas = (): string[][] => fillDeep(contentLists.areas, contentWords());
/** QUE_ABRE. */
export const areaHints = (): Record<string, string> => fillDeep(contentLists.areaHints, contentWords());
/** ICONOS_MANUAL. */
export const manualIcons = (): Record<string, string> => ({
  roles: '👥', inicio: '🏠', agenda: '📅', rutas: '🧭', directorio: '🩺', centros: '🏥', visitas: '📝', ventas: '🛒', config: '⚙️', admin: '🛡️',
  facturacion: '🧾', permisos: '🔐', medico: '🩺',
});
/** PLANES: the plans with their final texts (before, legado 041 declared old ones that 043 and 071 replaced while loading). */
export const plans = definePlanList;
