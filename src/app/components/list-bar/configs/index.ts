/**
 * Every screen with the list bar and its configuration (the legacy PL and BLQ objects are these same objects: tests and legacy code
 * read and replace their members, e.g. PL.pacientes.columnas()). v2.421.0.
 */
import { sections } from '../state';
import type { BlockConfig, ListConfig, ScreenConfig, SectionConfigs } from '../types';
import { blockConfig, blocks as blockDefinitions } from './blocks';
import { customersConfig } from './customers';
import { directoryConfig } from './directory';
import { billingConfigs, productsConfigs, salesConfigs } from './sales';

/** The block pages (BLQ). */
export const blocks: Record<string, BlockConfig> = blockDefinitions();

/** Every list screen (PL): one configuration, or one per section for the screens of `sections`. */
export const configs: Record<string, ScreenConfig> = {
  directorio: directoryConfig(),
  pacientes: customersConfig(),
  ventas: salesConfigs(),
  facturacion: billingConfigs(),
  productos: productsConfigs(),
  ...Object.fromEntries(Object.entries(blocks).map(([tab, block]) => [tab, blockConfig(tab, block)])),
};

/** The configuration of a screen right now (for screens with sections, the open one's; null = no list bar). */
export function configOf(tab: string): ListConfig | null {
  const config = configs[tab]; if (!config) return null;
  const section = sections[tab];
  if (!section) return config as ListConfig;
  const key = section();
  return key ? (config as SectionConfigs)[key] ?? null : null;
}

/** The screens that were first given the list bar, in their order (directory and customers, then sales, then the block pages). */
export const FIRST_SCREENS = ['directorio', 'pacientes'];
export const SECTION_SCREENS = ['ventas', 'facturacion', 'productos'];
