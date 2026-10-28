/**
 * The other sections of Configuración, loaded on first use (plan 7.3, cut D3: min/chunks/settings-parts.js; published by
 * ../lazy.ts): Mi perfil and Preferencias, the notifications panel, Textos personalizados, Auditoría and the billing Registro,
 * Clasificadores and the test environment. The shell, the tree, the store, «more» and what other screens read at once (custom
 * fields, notification modes, order alerts) stay in the core.
 */
import './texts';
export { paintPreferences, paintProfile } from '../preferences';
export { paintMyProfile } from '../profile/page';
export { paintPreferencesPart, saveIndicators } from '../profile/parts';
export { showNotifications } from '../notifications/panel';
export { paintMenuNames } from '../texts/menu-names';
export { paintAudit, paintBillingLog } from '../audit';
export { newClassifier, paintClassifiers } from '../classifiers';
export { bringProduction, paintTestEnvironment, refreshStatus } from '../test-environment';
