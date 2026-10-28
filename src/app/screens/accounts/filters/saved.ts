/**
 * Saved filters of Cuentas (indicators of Inicio): the current filter, its text («urgentes · de mi cartera · BARCELONA»), applying
 * one and counting its accounts. Migrated from the legacy filtroActual, textoFiltro, aplicarFiltroGuardado and contarFiltro
 * (v2.419.0).
 */
import { goTo, legacyDb, salesTeam, term } from '../../../legacy/bridge';
import { accountsEditorLegacy } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';
import { orFallback } from '../../../services/values';
import { searchAccounts } from '../lazy';

export interface SavedFilter { q?: string; prov?: string; muni?: string; esp?: string; est?: string; com?: string; urg?: boolean; mios?: boolean; sin?: boolean }

const TEXT_KEYS = ['q', 'prov', 'muni', 'esp', 'est', 'com'] as const;
const SELECT_KEYS = ['prov', 'muni', 'esp', 'est', 'com'] as const;
const NOBODY = 'ninguno';

const orNull = (text: string | undefined): string | null => (text ? text : null);

/** The directory filters as a saved filter (only what is set). */
export function currentFilter(): SavedFilter {
  const filters = accountsEditorLegacy.filters() as unknown as Record<string, unknown>, saved: Record<string, unknown> = {};
  TEXT_KEYS.forEach(key => { if (filters[key]) saved[key] = filters[key]; });
  (['urg', 'mios', 'sin'] as const).forEach(key => { if (filters[key]) saved[key] = true; });
  return saved as SavedFilter;
}

function salespersonText(id: string): string {
  if (id === NOBODY) return t('accountsEditor.filters.noSalesperson');
  const member = salesTeam.members().find(item => item.id === id);
  return t('accountsEditor.filters.of', { name: member?.nombre ?? t('accountsEditor.filters.aSalesperson') });
}

export function filterText(filter: SavedFilter): string {
  const parts: string[] = [];
  if (filter.urg) parts.push(t('accountsEditor.filters.urgent'));
  if (filter.mios) parts.push(t('accountsEditor.filters.mine'));
  if (filter.sin) parts.push(t('accountsEditor.filters.notVisited'));
  [filter.est, filter.esp, orFallback(filter.muni, filter.prov ?? '')].forEach(item => { if (item) parts.push(item); });
  if (filter.com) parts.push(salespersonText(filter.com));
  if (filter.q) parts.push(`“${filter.q}”`);
  return parts.length ? parts.join(' · ') : t('accountsEditor.filters.all', { all: term('medico', { number: 'p', article: 'el' }) });
}

/** Opens Cuentas with a saved filter. */
export function applySavedFilter(filter: SavedFilter): void {
  const filters = accountsEditorLegacy.filters();
  Object.assign(filters, { q: '', prov: '', muni: '', esp: '', est: '', com: '', urg: false, mios: false, sin: false, orden: 'nombre', pagina: 0 });
  if (filter.q) { filters.q = filter.q; const search = document.getElementById('q') as HTMLInputElement | null; if (search) search.value = filter.q; }
  SELECT_KEYS.forEach(key => {
    const chosen = filter[key]; if (!chosen) return;
    Object.assign(filters, { [key]: chosen });
    const select = document.getElementById('f' + key) as HTMLSelectElement | null; if (select) select.value = chosen;
  });
  if (filter.urg) filters.urg = true;
  if (filter.mios) filters.mios = true;
  if (filter.sin) filters.sin = true;
  goTo('directorio'); void searchAccounts(true);
}

/** How many accounts a saved filter has. */
export async function countFilter(filter: SavedFilter): Promise<number> {
  const { data } = await legacyDb().rpc<{ total: number }>('buscar_cuentas', {
    q: orNull(filter.q), f_provincia: orNull(filter.prov), f_municipio: orNull(filter.muni),
    f_estado: orNull(filter.est), f_especialidad: orNull(filter.esp), f_area: null,
    f_urgentes: Boolean(filter.urg), f_mios: Boolean(filter.mios), f_sin_visitar: Boolean(filter.sin), orden: 'nombre', lim: 1, desplaz: 0, f_comercial: orNull(filter.com),
  });
  return data ? data.total : 0;
}
