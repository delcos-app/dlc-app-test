/**
 * The Configuración page itself (v2.422.0): its index and search, the section header and pending notices, the pages of parts and
 * the menu marks. Registered as window.delcos.screens.settingsShell: the legacy names in pantallas/configuracion.js are one-line
 * adapters to these. The tree of sections (arbolConfig*, arbolCfgUnico*) stays in legacy for now.
 */
export { copyPartStyles, fitIndex, markBillingPlan, markOrderSection, markPlatformPanel, markUnsaved, mobileLayout, oldSettingsKey } from './helpers';
export { loadSettingsPage } from './page';
export { pendingSettings } from './pending';
export { sleepSection, stackSections, steady, wakeSection } from './sections';
