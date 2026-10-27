/**
 * Panel delcos, loaded on first use (plan 7.3, cut B): Clientes, Cobros, Altas, Solicitudes, Errores, Estado, Plantilla and
 * Configuración → Errores. herramientas/bundle.mjs builds this file into min/chunks/platform.js and index.ts calls it through
 * core/lazy. The «Estás viendo…» band (view-band.ts) stays in the core.
 */
export { paintBilling } from './billing';
export { paintCompanyErrors, paintPlatformErrors } from './errors';
export { paintOrganizations } from './organizations';
export { paintRequests } from './requests';
export { paintSignups } from './signups';
export { paintStatus } from './status';
export { paintTemplate } from './template';
