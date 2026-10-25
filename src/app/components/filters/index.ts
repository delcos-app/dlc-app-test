/**
 * Shared table filters (v2.416.0): what a cell holds, sorting and filtering any table, and the memory of the chosen filters. The
 * «Filtros y columnas» panel itself (htPreparar, htPintarPanel, chips and counter) stays in componentes/filtros.js for now.
 */
export { cellValue, columnKind, compareCells, filterHasValue, normalise, notFilterable, notSortable } from './cell-values';
export { compact, rememberFilter, restoreFilters } from './memory';
export { applyColumnFilters, clearSort, hiddenColumns, markHeader, savedWidths, sortRows, tableKind } from './table-sort';
