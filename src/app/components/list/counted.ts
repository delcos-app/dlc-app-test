/**
 * Figures that count up when they appear do it only the first time each value is shown on a screen: painting the same figures
 * again shows them at once. Migrated from the legacy plYaContado (v2.416.0).
 */
import { currentScreen } from '../../legacy/bridge';

const lastShown = new Map<string, string>();

/** True if these `values` were already shown counting under `key` on this screen (and remembers them otherwise). */
export function alreadyCounted(key: string, values: readonly string[]): boolean {
  const id = `${currentScreen()}:${key}`, shown = values.join('|');
  if (lastShown.get(id) === shown) return true;
  lastShown.set(id, shown);
  return false;
}
