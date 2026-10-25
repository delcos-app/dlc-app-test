/**
 * Ventas (Pedidos, Oportunidades, Compras, Proveedores), Facturas and Productos (catálogo, servicios, stock) in the list bar: one
 * configuration per section. Migrated from legado 086 (v2.238.0; v2.421.0).
 */
import { t } from '../../../i18n';
import type { SectionConfigs } from '../types';
import { gridConfig } from './grid';

const PERIOD = (): string => t('listBar.bar.period');

export const salesConfigs = (): SectionConfigs => ({
  pedidos: gridConfig({ tab: 'ventas', que: () => t('listBar.sales.orders'), lista: 'pedlista', pag: 'pedpag', buscador: 'pq', banda: 'operativa',
    extra: [['opcfg', t('listBar.sales.chooseAlerts')]],
    rapidos: [['#pper select', PERIOD()], ['#pestado', ''], ['#pcanal', ''], ['#porigf', ''], ['#prepf', '']] }),
  oport: gridConfig({ tab: 'ventas', que: () => t('listBar.sales.opportunities'), lista: 'lllista', pag: 'llpag', buscador: 'llq', despues: 'llres2',
    rapidos: [['#llper select', PERIOD()], ['#llfres', '']] }),
  compras: gridConfig({ tab: 'ventas', que: () => t('listBar.sales.purchaseOrders') }),
  prov: gridConfig({ tab: 'ventas', que: () => t('listBar.sales.suppliers') }),
});

export const billingConfigs = (): SectionConfigs => ({
  facturas: gridConfig({ tab: 'facturacion', que: () => t('listBar.sales.invoices'), lista: 'flista', pag: 'fpag', buscador: 'fq', rapidos: [['#fper select', PERIOD()], ['#fcob', '']] }),
});

export const productsConfigs = (): SectionConfigs => ({
  prods: gridConfig({ tab: 'productos', que: () => t('listBar.sales.products') }),
  servs: gridConfig({ tab: 'productos', que: () => t('listBar.sales.services') }),
  stock: gridConfig({ tab: 'productos', que: () => t('listBar.sales.products') }),
});
