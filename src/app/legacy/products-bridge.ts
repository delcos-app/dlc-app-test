import * as components from '../components';
/**
 * Bridge of Productos to the legacy code (kept apart from bridge.ts, which is at its size limit). The catalog loaders (PRODUCTOS,
 * SERVICIOS, cargarProductos), the section (PSEC) and the field filters (PRODF) stay in legacy: Pedidos, Visita, the list bar and
 * the cache of loaded screens use them. The product editor stays in legacy too (custom fields, materials and samples).
 */
export type ProductValues = Record<string, unknown>;

export const productsLegacy = {
  section: (): string => PSEC,
  setSection: (section: string): void => { PSEC = section; },
  /** Through the global names: legado 057 caches the screen and legado 089 wraps fichaStock and verDeposito («‹ Volver»). */
  reload: (): void => { void cargarProductosModulo(); },
  openStock: (line: object): void => { void fichaStock(line); },
  openDeposit: (accountId: string, name: string, notice?: string): Promise<void> => verDeposito(accountId, name, notice),
  editProduct: (product: object | null): void => { editorProducto(product); },
  editSamples: (): void => { void editorMuestras(); },
  clearModules: (except: string): void => { vaciarModulos(except); },
  showLoading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  matchesFieldFilters: (values: ProductValues | null | undefined): boolean => Boolean(components.matchesFilters(values, PRODF)),
  hasFieldFilters: (): boolean => Object.keys(PRODF).length > 0,
  visibleFieldColumns: (): CustomField[] => components.visibleFields('producto'),
  fieldHeaders: (fields: readonly CustomField[]): string => components.columnHeaders(fields),
  fieldCells: (fields: readonly CustomField[], values: ProductValues | null | undefined): string => components.columnCells(fields, values),
  widenGrid: (grid: Element | null, count: number): void => { components.widenGrid(grid, count); },
};
