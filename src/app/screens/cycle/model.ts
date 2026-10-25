/**
 * Ciclo de visitas A/B/C: the classes, the cycle names, the pills and buttons of a class, and what the page remembers (whose
 * cycle, the class filter, the classify filter and search). Migrated from the legacy CIC_* helpers (v2.408.0).
 */
import { cycleLegacy, permissions, salesTeam, term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { capitalise, formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';

export const CLASSES = ['A', 'B', 'C'] as const;
export type CycleClass = (typeof CLASSES)[number];

/** What the page remembers while the user moves between its tabs. */
export const cycleState = { owner: '', classFilter: '', classifyFilter: 'sin', query: '' };

const CYCLE_NAMES = new Map<number, MessageKey>([
  [1, 'cycle.cycleNames.month'], [2, 'cycle.cycleNames.twoMonths'], [3, 'cycle.cycleNames.quarter'],
  [4, 'cycle.cycleNames.fourMonths'], [6, 'cycle.cycleNames.half'], [12, 'cycle.cycleNames.year'],
]);

/** «trimestre» for a cycle of 3 months. */
export const cycleName = (months: number): string => t(CYCLE_NAMES.get(months) ?? 'cycle.cycleNames.other');

/** «3 visitas», «1 visita». */
export const visitsText = (count: number): string => `${count} ${term('visita', { number: count === 1 ? 's' : 'p' })}`;

/** The company words the texts of this screen use. */
export const words = (): Record<string, string> => ({
  visit: term('visita'), visits: term('visita', { number: 'p' }), Visits: term('visita', { number: 'p', capital: 'C' }),
  professional: term('medico'), professionals: term('medico', { number: 'p' }), speciality: term('especialidad'),
});

export const classPill = (value: string | null | undefined): string =>
  (value ? `<span class="cicl c${value}">${value}</span>` : '<span class="cicl csin">—</span>');

/** A, B and C buttons of an account (pressing the marked one removes it; see listenToClassButtons). */
export const classButtons = (id: string, value: string | null | undefined): string =>
  `<span class="segs cicsegs" role="group" aria-label="${t('cycle.classLabel')}">${CLASSES.map(letter => `<button type="button" data-ccl="${id}|${letter}" class="${letter === value ? 'on' : ''}" aria-pressed="${String(letter === value)}">${letter}</button>`).join('')}</span>`;

/** Whose cycle is shown: anyone chosen by who sees the whole team (everyone if nobody is chosen), else the user. */
export const ownerParam = (): string | null => (permissions.seesEverything() ? cycleState.owner || null : salesTeam.currentUserId());

/** Goes to a tab of the page (Este ciclo, Clasificar…). */
export const goToTab = (tab: string): void => { cycleLegacy.openTab(tab); };

/** «Trimestre del 1 oct al 31 dic». */
export const rangeText = (range: { meses: number; desde: string; hasta: string }): string =>
  t('cycle.range', { name: capitalise(cycleName(range.meses)), from: formatShortDate(range.desde), to: formatShortDate(range.hasta) });

/** The «De quién» selector, only for who sees the whole team. */
export async function ownerSelector(): Promise<string> {
  if (!permissions.seesEverything()) return '';
  if (!salesTeam.members().length) await salesTeam.load().catch(() => undefined);
  return `<select id="cicde" aria-label="${t('cycle.whose')}"><option value="">${t('cycle.allTeam')}</option>${salesTeam.members().map(member => `<option value="${member.id}" ${cycleState.owner === member.id ? 'selected' : ''}>${escapeHtml(member.nombre)}</option>`).join('')}</select>`;
}

/** Repaints `paint` when another owner is chosen. */
export function bindOwner(paint: () => Promise<void>): void {
  const select = document.getElementById('cicde') as HTMLSelectElement | null;
  if (select) select.onchange = (): void => { cycleState.owner = select.value; void paint(); };
}

export const percentOf = (done: number, goal: number): number => (goal ? Math.round(done / goal * 100) : 0);

export const progressBar = (percent: number, tag = 'span'): string => `<${tag} class="cicbar"><i style="width:${percent}%"></i></${tag}>`;
