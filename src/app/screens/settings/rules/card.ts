/**
 * The pieces of the Configuración rule cards (plan 12.2, batch 3, v2.466.0): a card with its title and an «i» that explains what the
 * rule does, setting rows (component «Fila de ajuste», `.ajfila`: label and a one-line help on the left, the control on the right)
 * and one «Guardar» for the card. Each rule is saved whole in its company setting with guardar_ajuste.
 */
import { cycleLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

export interface RowText { id: string; label: string; help: string }
export interface NumberRow extends RowText { value: number | null; min: number; max: number; placeholder?: string }
export interface Option { value: string; text: string }

/** The «i» next to a title: what the rule is for, in plain words. */
export const infoButton = (title: string, text: string): string =>
  `<button type="button" class="ai" data-ayuda-tit="${escapeHtml(title)}" data-ayuda-txt="${escapeHtml(text)}" aria-label="${t('settingsRules.whatIs')}">i</button>`;

const texts = (row: RowText): string => `<div><b><label for="${row.id}">${escapeHtml(row.label)}</label></b><span class="sm">${escapeHtml(row.help)}</span></div>`;

export const numberRowHtml = (row: NumberRow): string => `<div class="ajfila">${texts(row)}
    <input id="${row.id}" type="number" min="${row.min}" max="${row.max}" step="1" value="${row.value ?? ''}" placeholder="${escapeHtml(row.placeholder ?? '')}"></div>`;

export const textRowHtml = (row: RowText & { value: string; maxLength?: number }): string => `<div class="ajfila">${texts(row)}
    <input id="${row.id}" value="${escapeHtml(row.value)}" maxlength="${row.maxLength ?? 80}"></div>`;

export const selectRowHtml = (row: RowText & { value: string; options: readonly Option[] }): string => `<div class="ajfila">${texts(row)}
    <select id="${row.id}">${row.options.map(option => `<option value="${escapeHtml(option.value)}" ${option.value === row.value ? 'selected' : ''}>${escapeHtml(option.text)}</option>`).join('')}</select></div>`;

/** A yes/no setting: the switch on the right (saved with the card's «Guardar»). */
export const switchRowHtml = (row: RowText & { checked: boolean }): string => `<div class="ajfila">${texts(row)}
    <label class="vfswitch"><input type="checkbox" id="${row.id}" ${row.checked ? 'checked' : ''}><span class="sw"></span></label></div>`;

/** A long text under its label and help (a list, a legal note…). */
export const areaRowHtml = (row: RowText & { value: string; rows?: number; placeholder?: string }): string => `<div class="ajfila"><div>
    <b><label for="${row.id}">${escapeHtml(row.label)}</label></b><span class="sm">${escapeHtml(row.help)}</span>
    <textarea id="${row.id}" rows="${row.rows ?? 3}" placeholder="${escapeHtml(row.placeholder ?? '')}">${escapeHtml(row.value)}</textarea></div></div>`;

/** The whole card: title, a one-line introduction with its «i» (the title may be hidden when it repeats the page's), the rows and one «Guardar». */
export function ruleCardHtml(card: { id: string; title: string; info: string; intro: string; rows: readonly string[] }): string {
  return `<div class="card cfgpanel" id="${card.id}"><h2>${escapeHtml(card.title)}</h2>
    <p class="sm">${escapeHtml(card.intro)} ${infoButton(card.title, card.info)}</p>
    <div class="ajlista">${card.rows.join('')}</div>
    <div class="acts u-end"><button type="button" class="btn" id="${card.id}ok">${t('common.save')}</button></div></div>`;
}

export const inputValue = (id: string): string => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value.trim() ?? '';
export const isChecked = (id: string): boolean => (document.getElementById(id) as HTMLInputElement | null)?.checked ?? false;

/** A whole number between min and max, null when empty, undefined when it is not valid. */
export function wholeNumber(id: string, min: number, max: number): number | null | undefined {
  const text = inputValue(id); if (!text) return null;
  const value = Number(text);
  return Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

/** Saves the setting whole and keeps it in memory; says «Guardado» or why not. */
export async function saveRule(key: string, value: unknown): Promise<boolean> {
  const { data, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('guardar_ajuste', { p_clave: key, p_valor: value });
  if (error || data?.ok === false) { notices.toast(t(data?.error === 'permiso' ? 'settingsRules.noPermission' : 'settingsRules.couldNotSave'), true); return false; }
  cycleLegacy.setSetting(key, value); notices.toast(t('settingsRules.saved'));
  return true;
}

/** Paints cards in Configuración's body (#cfgcuerpo) from the settings already in memory (loaded at start-up and kept up to date by saveRule), and binds each «Guardar». */
export function paintRuleCards(cards: readonly { html: () => string; id: string; save: () => Promise<unknown> }[]): Promise<void> {
  const box = document.getElementById('cfgcuerpo'); if (!box) return Promise.resolve();
  box.innerHTML = cards.map(card => card.html()).join('');
  cards.forEach(card => { const ok = document.getElementById(`${card.id}ok`); if (ok) ok.onclick = (): void => { void card.save(); }; });
  return Promise.resolve();
}

export function bindSave(id: string, save: () => Promise<unknown>): void {
  const ok = document.getElementById(`${id}ok`); if (ok) ok.onclick = (): void => { void save(); };
}
