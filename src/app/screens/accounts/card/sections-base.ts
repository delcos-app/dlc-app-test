/**
 * Base sections of the account card: the notice when the timetable is missing, and the units attributed by period with their
 * evolution. Migrated from the legacy fichaAvisoHorario / fichaUnidades (v2.402.0).
 */
import { callRpc, cardBaseLegacy, term } from '../../../legacy/bridge';
import { t, type MessageKey } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { formatNumber } from '../../../services/format';
import { stillShown } from './card-tools';
import { openEditor } from '../editor-form';
import { missingTimetable } from '../timetable';

/** Without a timetable, routes and the planner do not know when they attend: a notice under the header. */
export async function timetableNotice(id: string): Promise<void> {
  const header = document.querySelector('#fbody .fh');
  if (!stillShown(id) || !header) return;
  if (!await missingTimetable(id) || !stillShown(id) || document.getElementById('fhorario')) return;
  document.querySelector('#fbody .fh')?.insertAdjacentHTML('afterend', `<div class="avisoh" id="fhorario">
    <span>${t('accounts.base.timetableMissing')}</span>
    ${cardBaseLegacy.canEdit() ? `<button class="btn sec" id="fhcompletar">${t('accounts.base.completeTimetable')}</button>` : ''}</div>`);
  const complete = document.getElementById('fhcompletar'); if (complete) complete.onclick = (): void => { void openEditor(id); };
}

const PERIODS: readonly [MessageKey, keyof AccountUnits][] = [
  ['accounts.base.unitsToday', 'hoy'], ['accounts.base.unitsWeek', 'semana'], ['accounts.base.unitsMonth', 'mes'],
  ['accounts.base.unitsQuarter', 'trimestre'], ['accounts.base.unitsYear', 'anio'], ['accounts.base.unitsTotal', 'total'],
];

function unitsHtml(units: AccountUnits, series: string): string {
  const prescriptions = (count: number): string => term('pauta', { number: count === 1 ? 's' : 'p' });
  const summary = units.total
    ? `${t('accounts.base.unitsSummary', { count: formatNumber(units.pautas), prescriptions: prescriptions(units.pautas), date: formatShortDate(units.ultima) })}<span id="fusley">${cardBaseLegacy.unitsLegend(series)}</span>`
    : t('accounts.base.noPrescriptions', { prescriptions: term('pauta', { number: 'p' }) });
  const choices = units.total
    ? `<div class="segs" id="fuserie" role="group" aria-label="${t('accounts.base.evolution')}">${cardBaseLegacy.unitsSeries().map(([key, label]) => `<button type="button" data-us="${key}" class="${key === series ? 'on' : ''}">${label}</button>`).join('')}</div>` : '';
  return `<div class="blk" id="fundades"><h3>${t('accounts.base.unitsTitle')}</h3>
    <div class="uper">${PERIODS.map(([label, key]) => `<div><b>${formatNumber(units[key])}</b><span>${t(label)}</span></div>`).join('')}</div>
    ${choices}
    <div class="spark" id="fuspark">${cardBaseLegacy.unitsChart(units, series)}</div>
    <div class="sm">${summary}</div></div>`;
}

/** Units attributed by period and their evolution by week, month or year (the last choice is remembered). Inside the sales section. */
export async function units(id: string): Promise<void> {
  const box = document.getElementById('fbody');
  if (!stillShown(id) || !box || document.getElementById('fundades')) return;
  const { data } = await callRpc<AccountUnits>('unidades_cuenta', { p_medico: id });
  if (!data || !stillShown(id) || document.getElementById('fundades')) return;
  const html = unitsHtml(data, cardBaseLegacy.unitsSeriesChosen()), sales = document.getElementById('fventasc');
  if (sales) sales.insertAdjacentHTML('afterbegin', html);
  else (box.querySelector('.blk:nth-of-type(2)') ?? box.lastElementChild)?.insertAdjacentHTML('beforebegin', html);
  box.querySelectorAll<HTMLElement>('#fuserie [data-us]').forEach(button => {
    button.onclick = (): void => {
      const series = button.dataset.us ?? 'mes';
      cardBaseLegacy.chooseUnitsSeries(series);
      box.querySelectorAll('#fuserie [data-us]').forEach(other => other.classList.toggle('on', other === button));
      const chart = document.getElementById('fuspark'), legend = document.getElementById('fusley');
      if (chart) chart.innerHTML = cardBaseLegacy.unitsChart(data, series);
      if (legend) legend.textContent = cardBaseLegacy.unitsLegend(series);
    };
  });
}
