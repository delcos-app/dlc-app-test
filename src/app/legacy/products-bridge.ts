import * as components from '../components';
import { productsStore } from '../screens/products/store';
import * as legacyFreeScreensVisit from '../screens/visit';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeScreensProducts from '../screens/products';
/**
 * Bridge of Productos to the legacy code (kept apart from bridge.ts, which is at its size limit). The catalog loaders (PRODUCTOS,
 * SERVICIOS, cargarProductos), the section (PSEC) and the field filters (PRODF) stay in legacy: Pedidos, Visita, the list bar and
 * the cache of loaded screens use them. The product editor stays in legacy too (custom fields, materials and samples).
 */
export type ProductValues = Record<string, unknown>;

export const productsLegacy = {
  section: (): string => productsStore.section,
  setSection: (section: string): void => { productsStore.section = section; },
  /** Through the global names (the adapters of pantallas/productos.js), which call the screen with its cache and «‹ Volver». */
  reload: (): void => { void legacyFreeScreensProducts.loadProductsModule(); },
  openStock: (line: object): void => { void legacyFreeScreensProducts.showStock(line as Parameters<typeof legacyFreeScreensProducts.showStock>[0]); },
  openDeposit: (accountId: string, name: string, notice?: string): Promise<void> => legacyFreeScreensProducts.showDeposit(accountId, name, notice ?? ''),
  editProduct: (product: object | null): void => { void legacyFreeScreensProducts.editProduct(product ?? null); },
  editSamples: (): void => { void legacyFreeScreensVisit.editSamples(); },
  clearModules: (except: string): void => { legacyFreeCoreServices.session.emptyModules(except); },
  showLoading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  matchesFieldFilters: (values: ProductValues | null | undefined): boolean => Boolean(components.matchesFilters(values, productsStore.filters)),
  hasFieldFilters: (): boolean => Object.keys(productsStore.filters).length > 0,
  visibleFieldColumns: (): CustomField[] => components.visibleFields('producto'),
  fieldHeaders: (fields: readonly CustomField[]): string => components.columnHeaders(fields),
  fieldCells: (fields: readonly CustomField[], values: ProductValues | null | undefined): string => components.columnCells(fields, values),
  widenGrid: (grid: Element | null, count: number): void => { components.widenGrid(grid, count); },
};
