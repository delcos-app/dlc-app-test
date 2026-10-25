/**
 * What the list bar remembers: the block chosen per page (PLG), the indicators already loaded per screen (PL_KPI) and which section
 * of a screen with several is open (PL_SECC). Migrated from componentes/lista.js and legado 087 (v2.421.0).
 */
import { listBarLegacy } from '../../legacy/listbar-bridge';
import type { Indicator } from './types';

/** The block chosen per page (Próximos, Pasados…); '' = all. */
export const chosenGroups: Record<string, string | undefined> = {};

/** The indicators of each screen: when they were loaded, with which cache epoch and filters, and whether a load is running. */
export interface IndicatorCache { datos?: Indicator[]; t?: number; epoca?: number; firma?: string; pend?: boolean; otra?: boolean }
export const indicatorCache: Record<string, IndicatorCache | undefined> = {};

const SALES_SECTIONS: Readonly<Record<string, string>> = { ventas: 'pedidos', llamadas: 'oport', compras: 'compras', proveedores: 'prov' };
const PRODUCT_SECTIONS: Readonly<Record<string, string>> = { catalogo: 'prods', servicios: 'servs', stock: 'stock' };
const LIST = 'lista';

/** Events: only on its «Eventos» tab (not on «Informe de gastos»). */
function eventsSection(): string | null {
  const on = document.querySelector('#v-eventos .pagtabs button.on');
  return !on || on === document.querySelector('#v-eventos .pagtabs button') ? LIST : null;
}

/** Screens with several sections: the configuration depends on the open one (null = no list bar, e.g. Facturación settings). */
export const sections: Record<string, () => string | null> = {
  ventas: () => { const open = listBarLegacy.salesSection(); return open === null ? null : SALES_SECTIONS[open] ?? null; },
  facturacion: () => (listBarLegacy.billingSection() === 'facturas' ? 'facturas' : null),
  productos: () => { const open = listBarLegacy.productsSection(); return open === null ? null : PRODUCT_SECTIONS[open] ?? 'prods'; },
  eventos: eventsSection,
  cirugias: () => LIST, concursos: () => LIST, parque: () => LIST,
};
