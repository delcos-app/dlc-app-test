/**
 * Rutas: the days a saved route repeats on, how it is written («Cada lunes», «El primer martes de cada mes»), the name proposed
 * with the day and the towns, and the icons of the wizard. Migrated from the legacy rnCumple, rnFechas, rnCuando, rnFechaRef,
 * rnNombreAuto, RN_SEM and RN_IC (v2.414.0).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { t } from '../../i18n';
import { addDays, fromIsoDate, todayIso } from '../../services/dates';
import { capitalise, formatLongDate, formatShortDate } from '../../services/date-format';
import { orFallback } from '../../services/values';

/** Working days as the database stores them (L = Monday … V = Friday). */
export const WEEKDAYS: readonly string[] = ['L', 'M', 'X', 'J', 'V'];
const LAST_WEEK = 5, MONTHLY_HORIZON = 92, WEEKLY_HORIZON = 56, NEXT_DATE_DAYS = 120, NAMED_TOWNS = 2;

/** «lunes» for «L». */
export const weekdayName = (letter: string): string => t('dates.weekdaysLong').split(',')[WEEKDAYS.indexOf(letter)] ?? '';

/** «Lun» for «L» (the day buttons of the wizard). */
export const weekdayShort = (letter: string): string => capitalise(weekdayName(letter).slice(0, 3));

/** «Granada» for «GRANADA» or «granada» (town names come written in any case). */
export const titleCase = (text: string | null | undefined): string =>
  String(text ?? '').toLowerCase().replace(/(^|[\s\-'·])(\p{L})/gu, (...parts: string[]) => (parts[1] ?? '') + (parts[2] ?? '').toUpperCase());

function monthlyRule(repeat: RouteRepeat, date: Date): boolean {
  if (Number(repeat.semana) === LAST_WEEK) { const next = new Date(date); next.setDate(date.getDate() + 7); return next.getMonth() !== date.getMonth(); }
  return Math.ceil(date.getDate() / 7) === Number(repeat.semana);
}

function weekRule(repeat: RouteRepeat, isoDate: string, date: Date): boolean {
  if (repeat.tipo === 'semanal') return !repeat.desde || isoDate >= repeat.desde;
  if (repeat.tipo === 'quincenal') {
    const start = orFallback(repeat.desde, isoDate), weeks = Math.round((date.getTime() - fromIsoDate(start).getTime()) / 864e5 / 7);
    return isoDate >= start && weeks % 2 === 0;
  }
  return repeat.tipo === 'mensual' && monthlyRule(repeat, date);
}

/** Whether a route that repeats like `repeat` is done on `isoDate`. */
export function repeatsOn(repeat: RouteRepeat | null, isoDate: string): boolean {
  if (!repeat) return false;
  if (repeat.tipo === 'fecha') return repeat.fecha === isoDate;
  const date = fromIsoDate(isoDate);
  if (date.getDay() !== WEEKDAYS.indexOf(repeat.dia ?? '') + 1) return false;
  return weekRule(repeat, isoDate, date);
}

/** The days between `from` and `to` (both included) on which the route is done. */
export function datesOf(repeat: RouteRepeat | null, from: string, to: string): string[] {
  if (!repeat) return [];
  if (repeat.tipo === 'fecha') return repeat.fecha && repeat.fecha >= from && repeat.fecha <= to ? [repeat.fecha] : [];
  const out: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) if (repeatsOn(repeat, day)) out.push(day);
  return out;
}

/** How far ahead a repeating route is copied to the agenda. */
export const horizonOf = (repeat: RouteRepeat | null): string => addDays(todayIso(), repeat?.tipo === 'mensual' ? MONTHLY_HORIZON : WEEKLY_HORIZON);

export const nextDateOf = (repeat: RouteRepeat | null): string | null => datesOf(repeat, todayIso(), addDays(todayIso(), NEXT_DATE_DAYS))[0] ?? null;

/** «Cada lunes», «El primer martes de cada mes»… */
export function whenText(repeat: RouteRepeat | null): string {
  if (!repeat) return t('routes.when.none');
  const day = weekdayName(repeat.dia ?? '');
  switch (repeat.tipo) {
    case 'fecha': return repeat.fecha ? capitalise(formatLongDate(repeat.fecha)) : t('routes.when.oneDay');
    case 'semanal': return t('routes.when.weekly', { day });
    case 'quincenal': return t('routes.when.fortnightly', { day });
    case 'mensual': return t('routes.when.monthly', { ordinal: t('routes.when.ordinals').split(',')[Number(repeat.semana) - 1] ?? t('routes.when.ordinals').split(',')[0] ?? '', day });
    default: return '';
  }
}

/** The day the hours of attention are read for: the next one the route is done, the weekday in its name, or the next working day. */
export function referenceDate(repeat: RouteRepeat | null, name: string | null | undefined): string {
  const next = nextDateOf(repeat); if (next) return next;
  const names = WEEKDAYS.map(weekdayName), found = new RegExp(`^(${names.join('|')})(?=[\\s·]|$)`).exec(String(name ?? '').toLowerCase());
  if (found) {
    const letter = WEEKDAYS[names.indexOf(found[1] ?? '')] ?? 'L';
    return datesOf({ tipo: 'semanal', dia: letter }, addDays(todayIso(), 1), addDays(todayIso(), 8))[0] ?? routesLegacy.nextWorkingDay();
  }
  return routesLegacy.nextWorkingDay();
}

/** «Lunes · Granada y Motril»: the name proposed with the day and the towns. */
export function autoName(members: readonly RouteMember[], repeat: RouteRepeat | null): string {
  const towns = [...new Set(members.map(member => titleCase(member.municipio)).filter(Boolean))];
  const day = repeat?.dia ? capitalise(weekdayName(repeat.dia)) : repeat?.tipo === 'fecha' && repeat.fecha ? formatShortDate(repeat.fecha) : '';
  const zone = towns.length ? towns.slice(0, NAMED_TOWNS).join(t('routes.name.joiner')) + (towns.length > NAMED_TOWNS ? t('routes.name.andMore') : '') : t('routes.name.newRoute');
  return day ? t('routes.name.withDay', { day, zone }) : zone;
}

/** «47.1,-3.5»-like coordinates of an account, or null without location. */
export const pointOf = (member: RouteMember): [number, number] | null =>
  (member.lat !== null && member.lat !== undefined && member.lon !== null && member.lon !== undefined ? [Number(member.lat), Number(member.lon)] : null);

export const hasLocation = (member: RouteMember): boolean => member.lat !== null && member.lat !== undefined;

const ICON_PATHS: Readonly<Record<string, string>> = {
  up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', close: '<path d="M18 6 6 18M6 6l12 12"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', bin: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', wand: '<path d="m15 4 5 5"/><path d="M3 21 15 9"/><path d="M19 3v4M17 5h4M7 3v2M6 4h2"/>', check: '<path d="M20 6 9 17l-5-5"/>',
};

/** A line icon of the wizard. */
export const routeIcon = (name: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] ?? ''}</svg>`;

/** The bottom bar of a step: a text on the left and its buttons on the right. */
export const stepFooter = (left: string, right: string): string => `<div class="rnpie"><span>${left}</span><span class="rnpieb">${right}</span></div>`;
