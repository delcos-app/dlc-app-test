/**
 * Visit results of a classifier: the state the card moves to and in which commercial states each one is offered («Solo en: …»).
 * Fields of the value editor (value-editor.ts) since v2.464.0; before, a select and a button in each row. Migrated from the legacy
 * decorarResultados and enEstadosTxt (v2.415.0).
 */
import { cardBaseLegacy, term } from '../../../legacy/bridge';
import { type ClassifierValue } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

const statesText = (list: readonly string[] | null | undefined): string =>
  (list?.length ? t('settingsMore.results.onlyIn', { states: list.join(', ') }) : t('settingsMore.results.inAll'));

/** The parts of the row line of a result: «Visita realizada», «Pasa a: …» and «Solo en: …» (nothing when it is offered in all). */
export function resultParts(value: ClassifierValue): string[] {
  const parts: string[] = [];
  if (value.extra) parts.push(value.extra === 'neg' ? t('settingsMore.classifier.withoutVisitCap', { visit: term('visita') }) : term('visita', { capital: 'C', adjective: 'realizado' }));
  if (value.destino) parts.push(t('settingsMore.valueList.movesTo', { state: value.destino }));
  return parts;
}

/** «Solo en: …» for the row, or '' when it is offered in every state. */
export const onlyInText = (value: ClassifierValue): string => (value.en_estados?.length ? statesText(value.en_estados) : '');

const help = (text: string): string => `<span class="sm vhelp">${text}</span>`;

export const stateOptions = (selected: string | null | undefined): string =>
  cardBaseLegacy.states().map(state => `<option value="${escapeHtml(state)}" ${selected === state ? 'selected' : ''}>${t('settingsMore.classifier.movesTo', { state: escapeHtml(state) })}</option>`).join('');

/** The destination field (`id`: «vedest» editing, «cvdest» new). */
export function destinationFieldHtml(id: string, selected: string | null | undefined): string {
  return `<div class="vfield"><label for="${id}">${t('settingsMore.valueEditor.destination')}</label>
    <select id="${id}"><option value="">${t('settingsMore.classifier.keepsState')}</option>${stateOptions(selected)}</select>
    ${help(t('settingsMore.valueEditor.destinationHelp', { aVisit: term('visita', { article: 'un' }) }))}</div>`;
}

/** The states field: a chip per commercial state, with the line that says the result («Solo en: …» or «En todos los estados»). */
export function statesFieldHtml(value: ClassifierValue): string {
  const marked = new Set(value.en_estados ?? []);
  return `<div class="vfield"><span class="vlabel">${t('settingsMore.valueEditor.states')}</span>
    <div class="vchips">${cardBaseLegacy.states().map(state => `<button type="button" class="chipsel ${marked.has(state) ? 'on' : ''}" data-vene="${escapeHtml(state)}" aria-pressed="${String(marked.has(state))}">${escapeHtml(state)}</button>`).join('')}</div>
    <span class="sm" data-ven>${escapeHtml(statesText(value.en_estados))}</span>
    ${help(t('settingsMore.valueEditor.statesHelp', { theVisit: term('visita', { article: 'el' }) }))}</div>`;
}

const chosenStates = (): string[] =>
  [...document.querySelectorAll<HTMLElement>('#dbody [data-vene][aria-pressed="true"]')].map(chip => chip.dataset.vene ?? '');

/** The chips switch on and off; the line under them says the result. */
export function bindStatesField(): void {
  const line = document.querySelector('#dbody [data-ven]');
  document.querySelectorAll<HTMLElement>('#dbody [data-vene]').forEach(chip => {
    chip.onclick = (): void => {
      const on = chip.getAttribute('aria-pressed') !== 'true'; chip.setAttribute('aria-pressed', String(on)); chip.classList.toggle('on', on);
      const chosen = chosenStates();
      if (line) line.textContent = statesText(chosen.length < cardBaseLegacy.states().length ? chosen : []);
    };
  });
}

/** The states chosen, as guardar_valor takes them ([] = all), or null when they did not change (or there is no field). */
export function chosenStatesChange(value: ClassifierValue): string[] | null {
  if (!document.querySelector('#dbody [data-vene]')) return null;
  const chosen = chosenStates(), list = chosen.length === cardBaseLegacy.states().length ? [] : chosen;
  const before = value.en_estados ?? [];
  return list.length === before.length && list.every(state => before.includes(state)) ? null : list;
}
