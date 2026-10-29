/**
 * The organisation's holidays (plan 12.2, PED-4, v2.463.0): the days the Pedidos cards skip besides weekends. They come from the setting
 * «festivos» ({ fechas: ['MM-DD' every year | 'YYYY-MM-DD' one day], viernes_santo: true|false }); without it, Spain's national
 * holidays and Good Friday, exactly as before.
 */
import { organisationLegacy } from '../legacy/organisation-bridge';
import { easterSunday } from '../services/calendar';
import { addDays } from '../services/dates';

/** The setting key (saved with guardar_ajuste by an administrator). */
export const HOLIDAYS_SETTING = 'festivos';
/** Spain's national holidays (MM-DD): the default list. */
export const SPAIN_HOLIDAYS: readonly string[] = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-06', '12-08', '12-25'];
const GOOD_FRIDAY = -2;
const YEARLY = /^(\d{2})-(\d{2})$/, ONE_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Longest month lengths (February with 29: a yearly 29/02 counts in leap years). */
const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface Holidays { dates: readonly string[]; goodFriday: boolean }

/** True for a real «MM-DD» (every year) or «YYYY-MM-DD» (that day only). */
export function validHoliday(value: string): boolean {
  const oneDay = ONE_DAY.exec(value), yearly = YEARLY.exec(value);
  if (oneDay) {
    const [year, month, day] = oneDay.slice(1).map(Number) as [number, number, number], date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  if (!yearly) return false;
  const month = Number(yearly[1]), day = Number(yearly[2]);
  return day >= 1 && day <= (MONTH_DAYS[month - 1] ?? 0);
}

/** The organisation's list, or Spain's when it has not set one. */
export function organisationHolidays(): Holidays {
  const own = organisationLegacy.setting(HOLIDAYS_SETTING) as { fechas?: unknown; viernes_santo?: unknown } | undefined;
  if (!own || !Array.isArray(own.fechas)) return { dates: SPAIN_HOLIDAYS, goodFriday: true };
  return { dates: own.fechas.map(String).filter(validHoliday), goodFriday: own.viernes_santo !== false };
}

/** True when the day (YYYY-MM-DD) is one of the organisation's holidays. */
export function isOrganisationHoliday(isoDate: string): boolean {
  const { dates, goodFriday } = organisationHolidays();
  if (dates.includes(isoDate) || dates.includes(isoDate.slice(5))) return true;
  return goodFriday && isoDate === addDays(easterSunday(Number(isoDate.slice(0, 4))), GOOD_FRIDAY);
}
