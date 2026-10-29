/**
 * Organización → Zona horaria y festivos, card «Festivos» (plan 12.2, PED-4, v2.463.0): the days the Pedidos cards skip. One per line,
 * «DD/MM» every year or «DD/MM/AAAA» only that day, and Good Friday. Saved in the setting «festivos»; without it, Spain's list.
 */
import { cycleLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { HOLIDAYS_SETTING, organisationHolidays, validHoliday } from '../../../core/holidays';

const TEXT_ROWS = 6;

/** «12-25» → «25/12»; «2027-03-19» → «19/03/2027». */
const shownDate = (value: string): string => value.split('-').reverse().join('/');

/** «25/12» → «12-25»; «19/3/2027» → «2027-03-19»; anything else → ''. */
export function storedDate(text: string): string {
  const parts = text.trim().split(/[/.-]/).map(part => part.trim());
  if (parts.length < 2 || parts.length > 3 || parts.some(part => !/^\d+$/.test(part))) return '';
  const [day = '', month = '', year] = parts, pad = (part: string): string => part.padStart(2, '0');
  const value = year ? `${year}-${pad(month)}-${pad(day)}` : `${pad(month)}-${pad(day)}`;
  return (!year || year.length === 4) && validHoliday(value) ? value : '';
}

export function holidaysCardHtml(): string {
  const { dates, goodFriday } = organisationHolidays();
  return `<div class="card cfgpanel"><h2>${t('timeZone.holidays.title')}</h2>
    <p class="sm">${t('timeZone.holidays.intro')}</p>
    <label for="zhfest">${t('timeZone.holidays.label')}</label>
    <textarea id="zhfest" rows="${TEXT_ROWS}" placeholder="${t('timeZone.holidays.placeholder')}">${escapeHtml(dates.map(shownDate).join('\n'))}</textarea>
    <label class="opt u-mt-10"><input type="checkbox" id="zhvsanto" ${goodFriday ? 'checked' : ''}> ${t('timeZone.holidays.goodFriday')}</label>
    <div class="acts u-end"><button class="btn" id="zhfestok">${t('common.save')}</button></div></div>`;
}

async function save(): Promise<void> {
  const lines = ((document.getElementById('zhfest') as HTMLTextAreaElement | null)?.value ?? '').split('\n').map(line => line.trim()).filter(Boolean);
  const dates = lines.map(storedDate);
  const wrong = lines.find((line, index) => line && !dates[index]);
  if (wrong) { notices.toast(t('timeZone.holidays.wrongDate', { date: wrong }), true); return; }
  const value = { fechas: [...new Set(dates)].sort(), viernes_santo: (document.getElementById('zhvsanto') as HTMLInputElement | null)?.checked ?? true };
  const { data, error } = await legacyDb().rpc('guardar_ajuste', { p_clave: HOLIDAYS_SETTING, p_valor: value });
  if (error || (data as { ok?: boolean } | null)?.ok === false) { notices.toast(t('timeZone.holidays.couldNotSave'), true); return; }
  cycleLegacy.setSetting(HOLIDAYS_SETTING, value); notices.toast(t('timeZone.holidays.saved'));
}

export function bindHolidaysCard(): void {
  const ok = document.getElementById('zhfestok'); if (ok) ok.onclick = (): void => { void save(); };
}
