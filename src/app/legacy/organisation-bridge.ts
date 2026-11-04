import { settingsStore } from '../screens/settings/store';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
/** The organisation's own data that core/organisation.ts and core/rules.ts read (its settings, its name, its portal), from the legacy state. */
export const organisationLegacy = {
  setting: (key: string): unknown => settingsStore.settings[key],
  name: (): string => legacyFreeCoreServices.appName(),
  hasPortal: (): boolean => legacyFreeCoreLegacyC.hasExtra('portal'),
};
