import * as components from '../components';
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeCoreNavigationApi from '../core/navigation/api';
/**
 * Bridge of Configuración part 1 to the legacy code (kept apart from bridge.ts, which is at its size limit): the user profile and
 * its preferences, the classifier catalog, the undo helpers of the audit, the custom field definitions and the test environment.
 */
export interface Place { nombre: string; dir: string; lat?: number | null; lon?: number | null }
export interface CurrentUser { id: string; nombre: string; email?: string | null; rol: string; areas?: Record<string, number> | null; preferencias?: Record<string, unknown> | null }
export interface PeriodRange { desde: string | null; hasta: string | null }
interface EdgeFunctions { invoke: (name: string, options: { body: object }) => Promise<{ data: unknown; error: { context?: { json?: () => Promise<unknown> } } | null }> }

export const settingsLegacy = {
  user: (): CurrentUser => PERFIL as CurrentUser,
  setPreferences: (preferences: Record<string, unknown>): void => { (PERFIL as CurrentUser).preferencias = preferences; },
  place: (key: string): Place | null => ((PERFIL as CurrentUser).preferencias?.[key] as Place | null | undefined) ?? null,
  changeNavigator: (name: string): void => { void cambiarNavegador(name); },
  revisitNotice: (): { on: boolean; dias: number } => avisoRevisita(),
  /** The legacy name answers whether it was saved (its declaration says void). */
  saveRevisitNotice: (value: { on: boolean; dias: number }): Promise<unknown> => guardarAvisoRevisita(value) as Promise<unknown>,
  moduleIcon: (module: string): string | undefined => ICO_MOD[module],
  classifiers: (): Classifier[] => CATS,
  setClassifiers: (list: Classifier[]): void => { CATS = list; },
  openClassifier: (id: string): void => { abrirClasificador(id); },
  reloadCatalogs: (): void => { void legacyFreeCoreSettings.loadCatalogs(); },
  undoable: (entry: object): boolean => deshacible(entry),
  undoPersonBox: (box: HTMLElement | null, options: { userId: string; from: string | null; name: string; then: () => void }): void => {
    cajaDeshacerPersona(box, options.userId, options.from, options.name, options.then);
  },
  billingEventDetail: (detail: unknown): string => legacyFreeCoreLeftovers.eventDetail(detail),
  fields: (): Record<string, CustomField[] | undefined> => CAMPOS,
  fieldTable: (area: string): string | undefined => CAMPO_TABLA[area],
  areaOfTable: (table: string): string | undefined => Object.keys(CAMPO_TABLA).find(area => CAMPO_TABLA[area] === table),
  fieldInput: (field: CustomField, value: unknown): string => campoInput(field, value),
  fieldText: (field: CustomField, value: unknown): string => components.fieldText(field, value),
  testEnvironment: <T>(): LegacyQuery<T> => RPC_ORIG_FROM<T>('entorno_pruebas'),
  refreshReason: (reason: string): string | undefined => MOTIVO_REFRESCO[reason],
  edgeFunctions: (): EdgeFunctions => (db as unknown as { functions: EdgeFunctions }).functions,
  resetTestData: (): void => { void legacyFreeCoreNavigationApi.backToTestData(); },
  clearLocalData: (): void => { limpiarDatosLocales(); },
  showLoading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  skeletonCard: (text: string): string => components.cardSkeleton(text),
  /** The range chosen in a period box mounted with mountPeriod (the legacy box keeps it in a property of the element). */
  periodRange: (element: HTMLElement | null): PeriodRange => {
    const read = element ? Reflect.get(element, '__rango') as (() => PeriodRange) | undefined : undefined;
    return read ? read() : { desde: null, hasta: null };
  },
  mountPeriod: (element: HTMLElement | null, options: { id: string; valor: string; alCambiar: () => void }): void => { montarPeriodo(element, options); },
  modules: (): string[] => Object.keys(MODULO_AREA).filter(module => puedeModulo(module)),
};
