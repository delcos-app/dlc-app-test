/**
 * Days and hours of visit of a consultation: morning and afternoon each weekday, with an optional time range, and the quick
 * buttons «L-V mañanas», «L-V tardes» and «Limpiar». Migrated from the legacy dpHTML, dpLeer, dpEstado, repintarDp and the
 * [data-dt]/[data-qk] listener of legado 002 (v2.419.0).
 */
import { accountsEditorLegacy } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';

type Part = 'M' | 'T';
interface DayState { M: boolean; T: boolean; h: Record<Part, string> }
type PickerState = Record<string, DayState>;

const PARTS: readonly Part[] = ['M', 'T'];
const AFTERNOON_FROM = 14;
const RANGE = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;

const partName = (part: Part): string => t(part === 'M' ? 'accountsEditor.days.morning' : 'accountsEditor.days.afternoon');
/** The words stored in the database (and matched when reading): they never change with the language. */
const STORED_PART: Readonly<Record<Part, string>> = { M: 'Mañana', T: 'Tarde' };

function stateOf(days: Record<string, string> | null | undefined): PickerState {
  const state: PickerState = {};
  accountsEditorLegacy.dayLetters().forEach(day => {
    const text = String(days?.[day] ?? ''), range = RANGE.exec(text), startHour = range ? Number(range[1]?.slice(0, 2)) : null;
    // The stored text is «Mañana 09:00-13:00; Tarde»: the words are matched as they are saved
    const morning = /mañana/i.test(text) || (startHour !== null && startHour < AFTERNOON_FROM);
    const afternoon = /tarde/i.test(text) || (startHour !== null && startHour >= AFTERNOON_FROM);
    const hours = range ? `${range[1] ?? ''}-${range[2] ?? ''}` : '';
    state[day] = { M: morning, T: afternoon, h: { M: hours, T: hours } };
  });
  return state;
}

function hourSelect(index: string, day: string, part: Part, chosen: string): string {
  const list = part === 'M' ? accountsEditorLegacy.morningHours() : accountsEditorLegacy.afternoonHours();
  return `<select data-dh="${index}|${day}|${part}"><option value="">${t('accountsEditor.days.noTime')}</option>${
    list.map(range => `<option ${chosen === range ? 'selected' : ''}>${range.replace('-', ' - ')}</option>`).join('')}</select>`;
}

function htmlOf(state: PickerState, index: string): string {
  const cell = (day: string, part: Part, item: DayState): string => `<div class="dpc"><button type="button" class="dpt" data-dt="${index}|${day}|${part}" aria-pressed="${String(item[part])}">${item[part] ? '✓ ' : ''}${partName(part)}</button>${item[part] ? hourSelect(index, day, part, item.h[part]) : ''}</div>`;
  return `<div class="dp" data-dp="${index}">
    <div class="qk"><button type="button" data-qk="${index}|lvm">${t('accountsEditor.days.weekMornings')}</button>
      <button type="button" data-qk="${index}|lvt">${t('accountsEditor.days.weekAfternoons')}</button>
      <button type="button" data-qk="${index}|clr">${t('accountsEditor.days.clear')}</button></div>
    ${accountsEditorLegacy.dayLetters().map(day => {
      const item = state[day] ?? { M: false, T: false, h: { M: '', T: '' } };
      return `<div class="dprow"><b>${accountsEditorLegacy.dayName(day).slice(0, 3)}</b>
      ${cell(day, 'M', item)}
      ${cell(day, 'T', item)}
    </div>`;
    }).join('')}</div>`;
}

/** The picker of consultation `index` with its saved days. */
export const dayPickerHtml = (days: Record<string, string> | null | undefined, index: string): string => htmlOf(stateOf(days), index);

/** The days as they are saved: { L: 'Mañana 09:00-13:00; Tarde' }. */
export function readDays(container: Element, index: string): Record<string, string> {
  const days: Record<string, string> = {};
  accountsEditorLegacy.dayLetters().forEach(day => {
    const parts = PARTS.filter(part => container.querySelector(`[data-dt="${index}|${day}|${part}"]`)?.getAttribute('aria-pressed') === 'true').map(part => {
      const select = container.querySelector<HTMLSelectElement>(`[data-dh="${index}|${day}|${part}"]`);
      return STORED_PART[part] + (select?.value ? ` ${select.value.replace(/\s/g, '')}` : '');
    });
    if (parts.length) days[day] = parts.join('; ');
  });
  return days;
}

function currentState(picker: Element, index: string): PickerState {
  const state: PickerState = {};
  accountsEditorLegacy.dayLetters().forEach(day => {
    const item: DayState = { M: false, T: false, h: { M: '', T: '' } };
    PARTS.forEach(part => {
      const button = picker.querySelector(`[data-dt="${index}|${day}|${part}"]`);
      if (button) item[part] = button.getAttribute('aria-pressed') === 'true';
      const select = picker.querySelector<HTMLSelectElement>(`[data-dh="${index}|${day}|${part}"]`);
      if (select) item.h[part] = select.value;
    });
    state[day] = item;
  });
  return state;
}

/** Paints the picker again from a state (hours written as «09:00 - 13:00» are kept). */
function repaint(picker: Element, index: string, state: PickerState): void {
  const days: Record<string, string> = {};
  Object.entries(state).forEach(([day, item]) => {
    const parts = PARTS.filter(part => item[part]).map(part => STORED_PART[part] + (item.h[part] ? ` ${item.h[part].replace(/\s/g, '')}` : ''));
    if (parts.length) days[day] = parts.join('; ');
  });
  picker.outerHTML = dayPickerHtml(days, index);
}

function quick(state: PickerState, mode: string): void {
  Object.values(state).forEach(item => {
    if (mode === 'clr') { item.M = false; item.T = false; item.h = { M: '', T: '' }; }
    if (mode === 'lvm') item.M = true;
    if (mode === 'lvt') item.T = true;
  });
}

function toggle(button: HTMLElement, picker: Element): void {
  const [index = '', day = '', part = 'M'] = (button.dataset.dt ?? '').split('|'), state = currentState(picker, index), item = state[day];
  if (item) item[part as Part] = !item[part as Part];
  repaint(picker, index, state);
}

function shortcut(button: HTMLElement, picker: Element): void {
  const [index = '', mode = ''] = (button.dataset.qk ?? '').split('|'), state = currentState(picker, index);
  quick(state, mode);
  repaint(picker, index, state);
}

/** Morning/afternoon buttons and the quick buttons of any day picker. */
export function listenToDayPickers(): void {
  document.addEventListener('click', event => {
    const target = event.target as Element | null, day = target?.closest<HTMLElement>('[data-dt]'), quickButton = target?.closest<HTMLElement>('[data-qk]');
    const picker = (day ?? quickButton)?.closest('.dp');
    if (picker && day) toggle(day, picker);
    else if (picker && quickButton) shortcut(quickButton, picker);
  });
}
