/**
 * Bridge of Configuración (third part: company email and its templates, notifications and menu names) to the legacy code, kept
 * apart from bridge.ts (at its size limit). The settings, the profile, the notification catalog, the unread count and the menu stay
 * in legacy state: the start-up, the bell and the menu read them.
 */
import * as legacyFreeCoreSettings from '../core/settings';
import { sessionStore } from '../core/session-store';
import { settingsStore } from '../screens/settings/store';
import { billingStore } from '../screens/billing/store';
import { navigationStore } from '../core/navigation/store';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreNavigationApi from '../core/navigation/api';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import { navigate } from '../core/navigation';
import * as legacyFreeCoreLayers from '../core/layers';
import * as legacyFreeScreensVisit from '../screens/visit';
import * as legacyFreeScreensOpportunities from '../screens/opportunities';
export interface EmailProvider { n: string; host: string; puerto: number; seg: string; ayuda: string }
export type NotificationType = readonly [string, string, string, string];
export type NotificationArea = readonly [string, string, readonly string[]];

export interface FunctionResult<T> { data: T | null; error: unknown }
interface Functions { invoke<T>(name: string, options: { body: unknown }): Promise<FunctionResult<T>> }

interface Profile { id: string; nombre?: string; email?: string; preferencias?: Record<string, unknown> | null }
const profile = (): Profile => sessionStore.profile as Profile;

export const settingsExtraLegacy = {
  // Settings and profile
  loadSettings: (): Promise<void> => legacyFreeCoreSettings.loadSettings(),
  setting: (key: string): unknown => settingsStore.settings[key],
  setSetting: (key: string, value: unknown): void => { settingsStore.settings[key] = value; },
  profileName: (): string => profile().nombre ?? '',
  profileEmail: (): string => profile().email ?? '',
  preferences: (): Record<string, unknown> => profile().preferencias ?? {},
  setPreferences: (value: Record<string, unknown>): void => { profile().preferencias = value; },
  appName: (): string => legacyFreeCoreServices.appName(),
  firstName: (name: string): string => legacyFreeCoreServices.vocabulary.firstName(name),
  /** Whole euros, as the legacy eurI writes them in the emails. */
  euros: (value: number): string => legacyFreeCoreServices.money.eurosRounded(value),
  brandLogo: (): string | null => MARCA.logo ?? null,
  // Email page
  emailProviders: (): Readonly<Record<string, EmailProvider>> => PROVEEDORES_CORREO,
  withButtonLoading: <T>(button: HTMLElement | null, text: string, work: () => Promise<T>): Promise<T> => legacyFreeCoreLegacyC.withLoading(button, text, work) as Promise<T>,
  validateEmailLive: (input: HTMLElement | null): void => { if (input) legacyFreeCoreLeftovers.liveEmailCheck(input as HTMLInputElement); },
  helpButton: (title: string, text: string): string => pmAyu(title, text),
  sendTestEmail: (): Promise<FunctionResult<{ ok?: boolean; error?: string }>> =>
    (db as unknown as { functions: Functions }).functions.invoke('enviar_email', { body: { prueba: true } }),
  /** Template chosen when sending (shared with Pedidos and Facturación). */
  chosenTemplate: (use: string): string | null => (billingStore.chosenTemplates[use] as string | null | undefined) ?? null,
  chooseTemplate: (use: string, id: string | null): void => { billingStore.chosenTemplates[use] = id; },
  // Notifications
  notificationAreas: (): readonly NotificationArea[] => NOTIF_AREAS,
  dailyNotifications: (): readonly string[] => NOTIF_DIARIOS,
  areaOf: (type: string): string => legacyFreeCoreSettings.notificationArea(type),
  iconOf: (type: string): string => legacyFreeCoreSettings.notificationIcon(type),
  typesForMyRole: (): readonly NotificationType[] => legacyFreeCoreServices.plans.notificationTypesOfRole() as readonly NotificationType[],
  unread: (): number => settingsStore.notificationCount,
  setUnread: (count: number): void => { settingsStore.notificationCount = count; },
  refreshBell: (): void => { void legacyFreeCoreServices.live.refreshBell(); },
  icon: (name: string): string => svgIco(ICON_NOM[name] ?? ''),
  followLink: (link: string): void => { void legacyFreeCoreNavigationApi.followLink(link); },
  newSale: (preset: Record<string, unknown>): void => { void legacyFreeScreensOpportunities.editOpportunity(preset, null); },
  recordVisit: (accountId: string): void => { void legacyFreeScreensVisit.openVisit(accountId); },
  openNotificationSettings: (): void => { settingsStore.section = 'notif'; (window as unknown as { __CFG_DIRECTO?: boolean }).__CFG_DIRECTO = true; navigate('config'); },
  // Menu names
  menuNames: (): Record<string, string> => menuNombres(),
  menuExcluded: (): readonly string[] => MENU_FUERA,
  moduleIcon: (module: string): string | undefined => ICO_MOD[module],
  menuText: (button: Element): { get: () => string } | null => legacyFreeCoreSettings.menuLabelText(button as HTMLElement),
  applyMenuNames: (): void => { legacyFreeCoreNavigationApi.applyMenuNames(); navigationStore.menuSignature = ''; try { legacyFreeCoreLegacyC.mountSideMenu(); legacyFreeCoreLayers.paintBottomBar([]); } catch { /* the menu repaints later */ } },
  applyLabel: (): void => { legacyFreeCoreLayers.applyLabel([]); },
};
