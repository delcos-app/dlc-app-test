/**
 * Panel delcos (v2.413.0): Clientes (the companies, their plan, extras, domains, entering, downloading, deactivating, deleting and
 * creating one), Cobros, Altas, Solicitudes, Errores, Estado de la plataforma, Plantilla, the «Estás viendo…» band, and
 * Configuración → Errores of a company. The legacy names (pintarOrganizaciones, pintarCobrosDelcos, pintarAltasDelcos,
 * pintarSolicitudesPlan, pintarErroresDelcos, pintarEstadoDelcos, pintarPlantillaDelcos, pintarErrores, franjaVista) stay as
 * adapters: the page tabs of legado 073, 075 and 076, Configuración, the start-up and the tests use them.
 */
export { paintBilling } from './billing';
export { paintCompanyErrors, paintPlatformErrors } from './errors';
export { paintViewBand } from './org-actions';
export { paintOrganizations } from './organizations';
export { paintRequests } from './requests';
export { paintSignups } from './signups';
export { paintStatus } from './status';
export { paintTemplate } from './template';
