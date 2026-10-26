/**
 * Productos: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (PSEC, PRODF, PRODUCTOS…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface ProductsStore {
  section: string;
  filters: Record<string, unknown>;
  products: CatalogProduct[];
  services: readonly { id: string; nombre: string }[];
  productStates: Record<string, string>;
  promoted: { id: string; nombre: string }[] | null;
  presentationMaterials: PresentationMaterial[] | null;
  presentationTime: number;
}

export const productsStore: ProductsStore = {
  section: 'productos',
  filters: {},
  products: [],
  services: [],
  productStates: {},
  promoted: null,
  presentationMaterials: null,
  presentationTime: 0,
};

exposeLegacyNames(productsStore, [
  ['PSEC', 'section'],
  ['PRODF', 'filters'],
  ['PRODUCTOS', 'products'],
  ['SERVICIOS', 'services'],
  ['ESTADO_PROD', 'productStates'],
  ['PROMO_PRODS', 'promoted'],
  ['PRES_MAT', 'presentationMaterials'],
  ['PRES_T', 'presentationTime'],
]);
