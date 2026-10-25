/**
 * «★ Guardar filtro» of the directory (legado 007, v2.424.0): the current filters become an indicator of Inicio.
 */
import { notices } from '../../../legacy/bridge';
import { saveFilterLegacy } from '../../../legacy/legado-a-bridge';
import { t } from '../../../i18n';
import { orFallback } from '../../../services/values';

const MAX_NAME = 40;

async function saveFilter(event: Event): Promise<void> {
  const filter = saveFilterLegacy.currentFilter();
  if (!Object.keys(filter).length) { notices.toast(t('legacyA.saveFilter.applyFirst'), true); return; }
  const name = await saveFilterLegacy.askText(t('legacyA.saveFilter.name'), saveFilterLegacy.filterText(filter).slice(0, MAX_NAME), { titulo: t('legacyA.saveFilter.title'), ok: t('common.save') });
  if (name === null) return;
  const button = event.target as HTMLButtonElement;
  button.disabled = true;
  const indicator = { id: `f:${Date.now().toString(36)}`, on: true, t: orFallback(name.trim(), saveFilterLegacy.filterText(filter)), filtro: filter };
  const saved = await saveFilterLegacy.saveIndicators([...saveFilterLegacy.indicators(), indicator]);
  button.disabled = false;
  if (saved) { notices.toast(t('legacyA.saveFilter.saved')); saveFilterLegacy.reloadHome(); }
}

/** Registers «★ Guardar filtro» (legado 007). */
export function listenToSaveFilter(): void {
  document.getElementById('guardarFiltro')?.addEventListener('click', event => { void saveFilter(event); });
}
