/**
 * Custom fields as table columns: which ones each person sees (their choice or «Columna en la tabla») and the extra grid columns.
 * Cuentas keeps them with the rest of its columns («Elegir columnas»). Migrated from componentes/clasificadores.js (v2.416.0);
 * clasVisibles and clasRejilla stay as adapters.
 */
import { componentsLegacy } from '../../legacy/components-bridge';
import { columnSettings, saveColumns } from '../../screens/accounts/list/columns';
import type { FieldDefinition } from './model';

const ACCOUNTS = 'medico', CUSTOM_PREFIX = 'cp:', NEW_COLUMN_WIDTH = 150, GRID_COLUMN = 130, GRID_EXTRA_WIDTH = 140, GRID_MIN_WIDTH = 900;

const storageKey = (scope: string): string => `clas-cols-${scope}`;

function savedChoice(scope: string): Record<string, boolean> {
  try { return (JSON.parse(localStorage.getItem(storageKey(scope)) ?? 'null') as Record<string, boolean> | null) ?? {}; } catch { return {}; }
}

/** The custom fields of `scope` shown as columns. */
export function visibleFields(scope: string): FieldDefinition[] {
  const chosen = savedChoice(scope);
  return (componentsLegacy.customFields(scope) as FieldDefinition[]).filter(field => (field.clave in chosen ? chosen[field.clave] : field.en_tabla));
}

export function showsColumn(scope: string, key: string): boolean {
  if (scope === ACCOUNTS) return Boolean(columnSettings().find(column => column.k === CUSTOM_PREFIX + key)?.on);
  return visibleFields(scope).some(field => field.clave === key);
}

export function setColumn(scope: string, key: string, on: boolean): void {
  if (scope === ACCOUNTS) {
    const settings = columnSettings(), found = settings.find(column => column.k === CUSTOM_PREFIX + key);
    if (found) found.on = on; else settings.push({ k: CUSTOM_PREFIX + key, on, w: NEW_COLUMN_WIDTH });
    saveColumns(settings); return;
  }
  const chosen = savedChoice(scope); chosen[key] = on;
  try { localStorage.setItem(storageKey(scope), JSON.stringify(chosen)); } catch { /* without storage it lasts until reloading */ }
}

/** Adds `count` columns of custom fields to the grid of a table. */
export function widenGrid(grid: Element | null, count: number): void {
  if (!(grid instanceof HTMLElement) || !count) return;
  const style = getComputedStyle(grid);
  grid.style.setProperty('--cols', style.getPropertyValue('--cols').trim() + ` ${GRID_COLUMN}px`.repeat(count));
  grid.style.minWidth = `${(parseInt(style.minWidth) || GRID_MIN_WIDTH) + GRID_EXTRA_WIDTH * count}px`;
}
