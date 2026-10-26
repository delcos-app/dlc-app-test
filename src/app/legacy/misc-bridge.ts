/**
 * Bridge of Duplicados, the centre sheet, «Cerca de mí» and the professional portal home to the legacy code (kept apart from
 * bridge.ts, which is at its size limit). What stays in legacy: the week days, the previous screen, the nearby result that
 * legado 096 clears, the duplicates summary of Inicio, the hidden alerts that legado 040 clears, and the cards of Rutas and
 * Comisiones.
 */
import * as legacyFreeScreensRoutes from '../screens/routes';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeCoreServices from '../core/services';
import { sessionStore } from '../core/session-store';
import { navigationStore } from '../core/navigation/store';
import { accountsStore } from '../screens/accounts/store';
import { homeStore } from '../screens/home/store';
import { productsStore } from '../screens/products/store';
export type NearbyAccount = LegacyNearbyAccount;
export type NearbyResult = LegacyNearbyResult;
export type HiddenAlert = LegacyHiddenAlert;

export const miscLegacy = {
  canUnify: (): boolean => puede('administrar') || ((sessionStore.profile as { areas?: Record<string, number> } | null)?.areas?.M ?? 0) >= 3,
  previousScreen: (): string | null => navigationStore.previousScreen,
  weekDays: (): readonly (readonly [string, string])[] => DIAS_SEM,
  setCardCentre: (name: string): void => { accountsStore.cardCentre = name; },
  nearby: (): NearbyResult | null => accountsStore.nearby,
  setNearby: (value: NearbyResult | null): void => { accountsStore.nearby = value; },
  duplicatesSummary: (): { pendientes?: number; parecidos?: number } | null => accountsStore.duplicates,
  setDuplicatesSummary: (value: { pendientes?: number; parecidos?: number } | null): void => { accountsStore.duplicates = value; },
  hiddenAlerts: (): HiddenAlert[] | null => homeStore.hiddenAlerts,
  setHiddenAlerts: (value: HiddenAlert[] | null): void => { homeStore.hiddenAlerts = value; },
  alertKey: (title: string, item: Element): string => claveAlerta(title, item),
  commissionCard: (): Promise<unknown> => tarjetaComision(),
  routeCards: (): Promise<unknown> => legacyFreeScreensRoutes.paintRouteCards(),
  item: (id: string, look: { icon: string; kind: string }, name: string, detail: string): string => itemHTML(id, look.icon, look.kind, name, detail),
  paintUpdated: (): void => { legacyFreeCoreLegacyC.paintUpdated(); },
  canBuy: (): boolean => Boolean(legacyFreeCoreServices.permissions.canBuy()),
  openStock: (): void => { productsStore.section = 'stock'; ir('productos'); },
  openPurchase: (id: string): void => { void editorCompra(id); },
  reloadHome: (): void => { void cargarInicio(); },
};
