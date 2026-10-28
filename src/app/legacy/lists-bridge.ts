/**
 * Legacy pieces the shared list components still need (v2.416.0): the page size, text normalisation and the table order and filter state that the «Filtros y columnas» panel, api.js and
 * legado 082/107 share.
 */
import * as legacyFreeComponentsListBar from '../components/list-bar';

/** A column of a whole-period list: a field name or how to read it from the row. */
export type RememberedField = string | ((row: Record<string, unknown>) => unknown);

/** What the panel chose for a table: free text, value per column and ranges per column. */
export interface TableFilters {
  texto?: string;
  facetas?: Record<string, string>;
  rangos?: Record<string, { k?: string; d?: string | number | null; h?: string | number | null }>;
}

export const listsLegacy = {
  pageSize: (): number => legacyFreeComponentsListBar.storedPageSize(),
  setPageSize: (size: number): void => { legacyFreeComponentsListBar.savePageSize(size); },
  pageSizes: (): readonly number[] => TAMANOS,
  normalise: (text: string | null): string => normalizar(text),
  touchScreen: (): boolean => PANTALLA_TACTIL,
  shortMonths: (): Readonly<Record<string, number>> => MESES_CORTOS,
  widthsKey: (kind: string): string => claveAnchos(kind),
  sortState: (): Readonly<Record<string, { i: number; dir: number; k?: string | null } | undefined>> => HT_ORDEN,
  serverSort: (): Readonly<Record<string, ((index: number, name: string) => string | null) | undefined>> => ORD_SRV,
  rememberedSort: (): Readonly<Record<string, { fn: string; campos: readonly RememberedField[] } | undefined>> => ORD_MEM,
  filterState: (): Readonly<Record<string, TableFilters | undefined>> => HT_ESTADO,
};
