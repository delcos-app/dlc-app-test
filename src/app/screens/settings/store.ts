/**
 * Configuración: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (AJUSTES, CFG_SEC, CFG_SUB…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface SettingsStore {
  settings: Record<string, unknown>;
  section: string | null;
  subsection: string | null;
  detail: boolean;
  adminSection: string;
  catalogs: Classifier[];
  users: unknown[];
  roles: readonly unknown[];
  activePanel: unknown;
  indexFrame: number;
  notificationCount: number;
  textsObserverTimer: number;
  invoiceLogo: string | null;
  stacking: boolean;
  unsavedChanges: boolean;
  lastAction: number;
}

export const settingsStore: SettingsStore = {
  settings: {},
  section: 'prefs',
  subsection: null,
  detail: false,
  adminSection: 'usuarios',
  catalogs: [],
  users: [],
  roles: [],
  activePanel: null,
  indexFrame: 0,
  notificationCount: 0,
  textsObserverTimer: 0,
  invoiceLogo: null,
  stacking: false,
  unsavedChanges: false,
  lastAction: 0,
};

exposeLegacyNames(settingsStore, [
  ['AJUSTES', 'settings'],
  ['CFG_SEC', 'section'],
  ['CFG_SUB', 'subsection'],
  ['CFG_DETALLE', 'detail'],
  ['ADM_SEC', 'adminSection'],
  ['CATS', 'catalogs'],
  ['USUARIOS', 'users'],
  ['ROLES_DEF', 'roles'],
  ['PANEL_ACTIVO', 'activePanel'],
  ['CFU_RAF', 'indexFrame'],
  ['NOTIF_N', 'notificationCount'],
  ['TX_OBS', 'textsObserverTimer'],
  ['LOGO_DATA', 'invoiceLogo'],
  ['APILANDO', 'stacking'],
  ['DATOS_CAMBIADOS', 'unsavedChanges'],
  ['ULT_ACCION', 'lastAction'],
]);
