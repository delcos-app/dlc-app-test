/**
 * Rows per page of the lists, remembered per person. Migrated from tamPagina, fijarTam, TAMANOS and TAMKEY (v2.421.0). Lists read
 * the size through the global tamPagina (an adapter of storedPageSize), because the tests replace it to page by 5.
 */
import { listBarLegacy } from '../../legacy/listbar-bridge';

export const PAGE_SIZES: readonly number[] = [20, 50, 100];
const DEFAULT_SIZE = 20;

const storageKey = (): string => `dlc-tam-${listBarLegacy.userId()}`;

export function storedPageSize(): number {
  let size = 0;
  try { size = Number(localStorage.getItem(storageKey())); } catch { /* without storage, the default size */ }
  return PAGE_SIZES.includes(size) ? size : DEFAULT_SIZE;
}

export function savePageSize(size: number): void {
  try { localStorage.setItem(storageKey(), String(size)); } catch { /* not remembered */ }
}
