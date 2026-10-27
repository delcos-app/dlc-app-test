import { settingsStore } from '../screens/settings/store';
import * as legacyFreeCoreServices from '../core/services';
/** The organisation's own data that core/organisation.ts reads (its settings and its name), from the legacy state. */
export const organisationLegacy = {
  setting: (key: string): unknown => settingsStore.settings[key],
  name: (): string => legacyFreeCoreServices.appName(),
};
