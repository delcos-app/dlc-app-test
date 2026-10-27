/**
 * Panel delcos (v2.413.0): Clientes (the companies, their plan, extras, domains, entering, downloading, deactivating, deleting and
 * creating one), Cobros, Altas, Solicitudes, Errores, Estado de la plataforma, Plantilla, the «Estás viendo…» band, and
 * Configuración → Errores of a company. The legacy names (pintarOrganizaciones, pintarCobrosDelcos, pintarAltasDelcos,
 * pintarSolicitudesPlan, pintarErroresDelcos, pintarEstadoDelcos, pintarPlantillaDelcos, pintarErrores, franjaVista) stay as
 * adapters: the page tabs of legado 073, 075 and 076, Configuración, the start-up and the tests use them.
 * Plan 7.3 (cut B): the pages are loaded on first use (chunk.ts → min/chunks/platform.js); the band is painted at start-up, so it
 * stays in the core.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

export { paintViewBand } from './view-band';

const fromChunk = lazyChunk<typeof Chunk>('platform');

export const paintBilling = fromChunk('paintBilling');
export const paintCompanyErrors = fromChunk('paintCompanyErrors');
export const paintPlatformErrors = fromChunk('paintPlatformErrors');
export const paintOrganizations = fromChunk('paintOrganizations');
export const paintRequests = fromChunk('paintRequests');
export const paintSignups = fromChunk('paintSignups');
export const paintStatus = fromChunk('paintStatus');
export const paintTemplate = fromChunk('paintTemplate');
