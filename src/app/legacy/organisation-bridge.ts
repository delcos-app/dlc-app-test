/** The organisation's own data that core/organisation.ts reads (its settings and its name), from the legacy state. */
export const organisationLegacy = {
  setting: (key: string): unknown => AJUSTES[key],
  name: (): string => nombreApp(),
};
