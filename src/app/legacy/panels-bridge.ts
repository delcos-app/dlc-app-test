/**
 * Bridge of the «Filtros y columnas» panel and the Analítica page to the legacy code (v2.419.0; kept apart from bridge.ts, which is
 * at its size limit). The shared state stays legacy: ANSEC (the tests set it), AN_REP (legado 145 adds it to the queries), AN_SERIE
 * (Facturación shares it), HT_FILTROS (legado 074 adds screens) and HT_ESTADO (the table filters of every screen).
 */
import type { TableFilters } from './lists-bridge';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import { homeStore } from '../screens/home/store';
import { sessionStore } from '../core/session-store';
import { productsStore } from '../screens/products/store';
import { billingStore } from '../screens/billing/store';
import * as legacyFreeScreensRoutes from '../screens/routes';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeScreensAccounts from '../screens/accounts';
import * as legacyFreeCoreLayers from '../core/layers';

/** A column of the second panel «Columnas»: its index, name, whether it shows and whether it can be hidden. */
export interface PanelColumn { i: number; n: string; on: boolean; fija: boolean }

export const panelsLegacy = {
  /** Analítica tab: 'resumen' or 'explorar'. */
  section: (): string => homeStore.analyticsSection,
  setSection: (section: string): void => { homeStore.analyticsSection = section; },
  reportFilter: (): string => AN_REP,
  setReportFilter: (value: string): void => { AN_REP = value; },
  seriesCache: (): Map<string, Promise<Record<string, unknown>[]>> => AN_SERIE,
  setProfessional: (account: PickedAccount | null): void => { homeStore.analyticsAccount = account ? { id: account.id, nombre: account.nombre ?? '' } : null; },
  /** The user's Analítica settings (preferencias.analitica). */
  analyticsPreferences: (): unknown => Reflect.get(legacyFreeScreensRoutes.activePreferences(), 'analitica'),
  profilePreferences: (): Record<string, unknown> => ((sessionStore.profile as { preferencias?: Record<string, unknown> } | null)?.preferencias ?? {}),
  setProfilePreferences: (preferences: Record<string, unknown>): void => { (sessionStore.profile as { preferencias?: Record<string, unknown> }).preferencias = preferences; },
  products: (): readonly CatalogProduct[] => productsStore.products,
  loadProducts: (): Promise<void> => cargarProductos(),
  stateWithRole: (role: string): string => legacyFreeCoreServices.states.stateOfRole(role),
  canUseModule: (screen: string): boolean => legacyFreeCoreServices.permissions.canUseModule(screen),
  monthsBetween: (from: string, to: string): string[] => legacyFreeCoreServices.calendar.monthsBetween(from, to),
  mountPeriod: (element: HTMLElement | null, options: { id: string; valor: string; alCambiar: () => void }): void => { legacyFreeCoreLayers.mountPeriod(element, [options]); },
  pickProfessional: (element: HTMLElement | null, options: { value: PickedAccount | null; placeholder: string; onPick: (account: PickedAccount) => void }): void => {
    legacyFreeScreensAccounts.pickAccount(element as unknown as HTMLElement, { valor: options.value, placeholder: options.placeholder, alElegir: options.onPick } as Parameters<typeof legacyFreeScreensAccounts.pickAccount>[1]);
  },
  professional: (): PickedAccount | null => homeStore.analyticsAccount,
  /** The second panel with the columns of a table (legado 056/057/065). */
  columnsPanel: (title: string, columns: PanelColumn[], onChange: (index: number, on: boolean) => void): void => { legacyFreeCoreLegacyC.showColumnsPanel(title, columns, onChange); },
  /** Screens whose own filters move into the panel: id → selector (legado 074 adds some). */
  filterTargets: (): Readonly<Record<string, string | undefined>> => HT_FILTROS,
  tableFilters: (): Record<string, TableFilters | undefined> => HT_ESTADO,
  /** Facturación outside its invoices has no table to filter. */
  billingSection: (): string | null => (typeof billingStore.section === 'undefined' ? null : billingStore.section),
};
