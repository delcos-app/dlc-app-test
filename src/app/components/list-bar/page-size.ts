/**
 * Rows per page of the lists, remembered per person. Migrated from tamPagina, fijarTam, TAMANOS and TAMKEY (v2.421.0). Every list
 * reads the size from storedPageSize each time it pages; the tests force a size with overridePageSize (to page by 5).
 */
import { listBarLegacy } from '../../legacy/listbar-bridge';

export const PAGE_SIZES: readonly number[] = [20, 50, 100];
const DEFAULT_SIZE = 20;

let forcedSize: number | null = null;

const storageKey = (): string => `dlc-tam-${listBarLegacy.userId()}`;

/** For the tests: every list pages by `size` (any number) until this is called with null; the remembered size is not touched. */
export function overridePageSize(size: number | null): void { forcedSize = size; }

export function storedPageSize(): number {
  if (forcedSize !== null) return forcedSize;
  let size = 0;
  try { size = Number(localStorage.getItem(storageKey())); } catch { /* without storage, the default size */ }
  return PAGE_SIZES.includes(size) ? size : DEFAULT_SIZE;
}

export function savePageSize(size: number): void {
  try { localStorage.setItem(storageKey(), String(size)); } catch { /* not remembered */ }
}
