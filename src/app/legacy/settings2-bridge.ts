import * as components from '../components';
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeScreensSettings from '../screens/settings';
import { sessionStore } from '../core/session-store';
import { settingsStore } from '../screens/settings/store';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeCoreLayers from '../core/layers';
/**
 * Bridge of Configuración (second part: portfolio rules, backups, undo, commercial states, visit material, accesses, classifiers,
 * roles and brand) to the legacy code (kept apart from bridge.ts, which is at its size limit). The settings, the catalogs, the
 * roles and the brand stay in legacy state: the rest of Configuración and the start-up read them.
 */
export interface ClassifierData {
  id: string; nombre: string; grupo?: string | null; ambito?: string | null; papel?: string | null; tipo_campo?: string | null; sistema?: boolean;
  valores?: ClassifierValue[] | null;
}
export interface ClassifierValue {
  id: string; valor: string; activo?: boolean; padre?: string | null; extra?: string | null; destino?: string | null;
  dato_tipo?: string | null; dato_etiqueta?: string | null; dato_opciones?: string[] | null; en_estados?: string[] | null;
}
export interface BrandSettings { nombre: string; logo: string | null; logo_factura?: boolean; etiqueta?: string }
export interface TermSettings { s?: string; p?: string; g?: string }

const profile = (): { id: string; nombre?: string; areas?: Record<string, number>; capacidades?: string[] } =>
  sessionStore.profile as { id: string; nombre?: string; areas?: Record<string, number>; capacidades?: string[] };

export const settingsMoreLegacy = {
  loading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  appName: (): string => legacyFreeCoreServices.appName(),
  hasPortal: (): boolean => legacyFreeCoreLegacyC.hasExtra('portal'),
  reloadCatalogs: (): Promise<void> => legacyFreeCoreSettings.loadCatalogs(),
  /** Level (0–3) of the user in an area of the legacy profile (K = classifiers). */
  areaLevel: (letter: string): number => profile().areas?.[letter] ?? 0,
  askText: (message: string, value: string, options: { titulo?: string; ok?: string }): Promise<string | null> => components.askText(message, value, options),
  settingsKey: (): string => CFG_KEY,
  stateRoles: (): readonly (readonly [string, string, string])[] => PAPELES_ESTADO,
  // Classifiers: the catalog list, the custom field box and the list repaint stay in legacy
  classifiers: (): ClassifierData[] => settingsStore.catalogs as unknown as ClassifierData[],
  setClassifiers: (list: ClassifierData[]): void => { settingsStore.catalogs = list as unknown as typeof settingsStore.catalogs; },
  fieldBox: (classifier: ClassifierData, complete: boolean): string => legacyFreeCoreLeftovers.customFieldBox(classifier as unknown as Parameters<typeof legacyFreeCoreLeftovers.customFieldBox>[0], complete),
  fieldTable: (area: string | null | undefined): string | undefined => CAMPO_TABLA[area ?? ''],
  loadCustomFields: (): Promise<void> => legacyFreeScreensSettings.loadCustomFields(),
  repaintClassifiers: (): void => { void legacyFreeScreensSettings.paintClassifiers(); },
  // Roles
  roleNames: (): string[] => legacyFreeCoreSettings.roleNames(),
  roleTemplate: (role: string): Record<string, number> => legacyFreeCoreSettings.roleTemplate(role) as Record<string, number>,
  areas: (): readonly (readonly [string, string])[] => AREAS,
  areaHint: (area: string): string => QUE_ABRE[area] ?? '',
  levelNames: (): readonly string[] => NIVEL_TXT,
  reloadRoles: (): Promise<void> => legacyFreeCoreSettings.loadRoles() as unknown as Promise<void>,
  profileId: (): string => profile().id,
  profileName: (): string => profile().nombre ?? '',
  setCapabilities: (list: string[]): void => { profile().capacidades = list; },
  // Brand and vocabulary
  setBrand: (brand: { nombre: string; logo: string | null }): void => {
    MARCA = brand; localStorage.setItem('app-marca', JSON.stringify(brand)); settingsStore.invoiceLogo = null; legacyFreeCoreSettings.applyBrand();
  },
  contactsLabel: (): string => legacyFreeCoreServices.vocabulary.contactsLabel(),
  contactLabels: (): readonly string[] => ETIQUETAS,
  applyLabel: (): void => { legacyFreeCoreLayers.applyLabel([]); },
  termDefaults: (): Readonly<Record<string, { s: string; p: string; g?: string }>> => TERM_DEF as Readonly<Record<string, { s: string; p: string; g?: string }>>,
  terms: (): Readonly<Record<string, TermSettings>> => (sessionStore.terms ?? {}) as Readonly<Record<string, TermSettings>>,
  saveTermsCopy: (terms: Record<string, TermSettings>): void => { try { localStorage.setItem(TERMKEY, JSON.stringify(terms)); } catch { /* not remembered */ } },
  helpButton: (title: string, text: string): string => pmAyu(title, text),
};
