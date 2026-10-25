/**
 * The class and the visits of this cycle in the «Estado» block of the account card (A/B/C buttons for who can edit). Migrated
 * from the legacy cicFicha (v2.408.0); cicFicha stays as an adapter.
 */
import { accountCardLegacy, cardBaseLegacy, legacyDb, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { classButtons, classPill, cycleName, visitsText } from './model';

interface AccountCycle { clase?: string | null; objetivo?: number; hechas: number; meses: number }

function summary(cycle: AccountCycle): string {
  const name = cycleName(cycle.meses);
  if (!cycle.clase) return t('cycle.card.unclassified', { visits: visitsText(cycle.hechas), cycle: name });
  if (!cycle.objetivo) return t('cycle.card.noGoal', { visits: visitsText(cycle.hechas), cycle: name, visitsWord: term('visita', { number: 'p' }) });
  return t('cycle.card.thisCycle', { done: cycle.hechas, goal: visitsText(cycle.objetivo), cycle: name });
}

export async function paintCardCycle(id: string): Promise<void> {
  const { data: cycle } = await legacyDb().rpc<AccountCycle>('ciclo_de_cuenta', { p_id: id });
  const box = document.getElementById('fciclo');
  if (!cycle || !box || accountCardLegacy.shownId() !== id) return;
  box.innerHTML = `<span class="sm cicfl">${t('cycle.classLabel')}</span>${cardBaseLegacy.canEdit() ? classButtons(id, cycle.clase) : classPill(cycle.clase)}
    <span class="sm">${summary(cycle)}</span>`;
}
