/**
 * The options of the Cuentas filters (province, town, speciality, state) with how many accounts each has. Migrated from the
 * legacy cargarFiltros and optFiltro (v2.419.0); the options stay in the legacy OPF, which legado 014 reads.
 */
import { legacyDb } from '../../../legacy/bridge';
import { accountsEditorLegacy, type FilterOption, type FilterOptions } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

/** «Todas las provincias» and each option with its count; the chosen value marked. */
export const filterOptionsHtml = (list: readonly FilterOption[] | null | undefined, chosen: string | null | undefined, all: string): string =>
  `<option value="">${all}</option>` + (list ?? []).map(option => `<option ${chosen === option.v ? 'selected' : ''}>${escapeHtml(option.v)} (${option.n})</option>`).join('');

function fill(selectId: string, list: readonly FilterOption[], all: string, chosen: string): void {
  const select = document.getElementById(selectId); if (!select) return;
  select.innerHTML = `<option value="">${all}</option>` + list.map(option => `<option value="${escapeHtml(option.v)}" ${chosen === option.v ? 'selected' : ''}>${escapeHtml(option.v)} (${option.n})</option>`).join('');
}

/** Loads the options (the towns of the chosen province) and fills the selects; `onlyTowns` after changing the province. */
export async function loadFilters(onlyTowns = false): Promise<void> {
  const filters = accountsEditorLegacy.filters();
  const { data, error } = await legacyDb().rpc<FilterOptions>('opciones_filtros', { f_provincia: filters.prov || null });
  if (error || !data) return;
  accountsEditorLegacy.setFilterOptions(data);
  if (!onlyTowns) {
    fill('fprov', data.provincias, t('accountsEditor.filters.allProvinces'), filters.prov);
    fill('fesp', data.especialidades, accountsEditorLegacy.allOf('especialidad'), filters.esp);
    fill('fest', data.estados, t('accountsEditor.filters.allStates'), filters.est);
  }
  fill('fmuni', data.municipios, t('accountsEditor.filters.allTowns'), filters.muni);
}
