import * as components from '../components';
import * as legacyFreeScreensRoutes from '../screens/routes';
import { settingsStore } from '../screens/settings/store';
import { sessionStore } from '../core/session-store';
import { navigationStore } from '../core/navigation/store';
import * as legacyFreeCoreServices from '../core/services';
/**
 * Bridge of Acceso, the last Agenda pieces and the accounts map to the legacy code (kept apart from bridge.ts, which is at its
 * size limit). The working day key, the traffic and the routes stay in the route domain (Rutas, not migrated yet).
 */
export const restLegacy = {
  appName: (): string => legacyFreeCoreServices.appName(),
  setSettingsSection: (section: string): void => { settingsStore.section = section; },
  loadPlan: (): Promise<unknown> => pagoCargarEstado(),
  plan: (): { en_prueba?: boolean; periodo_fin?: string | null } => sessionStore.plan as { en_prueba?: boolean; periodo_fin?: string | null },
  setAppVisible: (visible: boolean): void => { navigationStore.appVisible = visible; },
  reloadHome: (): void => { void cargarInicio(); },
  workingDayKey: (): string => JKEY(),
  reloadRoutes: (): void => { void legacyFreeScreensRoutes.loadRoutesPage(); },
  askText: (message: string, value: string, options: { titulo?: string; ok?: string }): Promise<string | null> => components.askText(message, value, options),
  stateColour: (state: string): string => legacyFreeCoreServices.states.stateColour(state),
  leaflet: (): Leaflet | null => (window as unknown as { L?: Leaflet }).L ?? null,
};
