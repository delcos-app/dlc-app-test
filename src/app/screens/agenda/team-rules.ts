/**
 * Agenda → Equipo with «⚙ Reglas de cartera» for administration (exclusive portfolios). Folded from the legacy pintarEquipo of
 * legado 027 (v2.424.0); pintarEquipo stays as an adapter (the team view and the bridge call it by that name).
 */
import { legacyBActions } from '../../legacy/legado-b-bridge';
import { t } from '../../i18n';

/** Paints the team's compliance table, then the rules button in its header. */
export async function paintTeam(): Promise<void> {
  await legacyBActions.teamTable();
  const header = document.getElementById('agcuerpo')?.querySelector('.semhead');
  if (!header || !legacyBActions.can('administrar') || document.getElementById('eqcart')) return;
  header.insertAdjacentHTML('beforeend', `<button class="btn sec" id="eqcart">${t('legacyB.team.portfolioRules')}</button>`);
  const rules = document.getElementById('eqcart'); if (rules) rules.onclick = (): void => { legacyBActions.portfolioRules(); };
}
