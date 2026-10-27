/**
 * Dates as «YYYY-MM-DD» in local time (Spain), the format the database and the screens use. «Today» follows the organisation's time
 * zone when it has one (plan 11.3, v2.447.0; set by core/organisation), and the device's clock otherwise, as before.
 */

export function toIsoDate(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Where «today» comes from: the organisation's time zone (IANA name), or empty for the device's clock. */
let dayZone: () => string = () => '';
export function useDayZone(zone: () => string): void { dayZone = zone; }

/** «YYYY-MM-DD» of an instant in a time zone (en-CA writes the date in that order). */
export function isoDateIn(date: Date, zone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function todayIso(): string {
  const zone = dayZone();
  return zone ? isoDateIn(new Date(), zone) : toIsoDate(new Date());
}

/** «2026-10-24» plus `days` (negative goes back). Noon avoids daylight-saving surprises. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function fromIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

/** Monday of the week of `isoDate`. */
export function mondayOf(isoDate: string): string {
  const date = fromIsoDate(isoDate);
  return addDays(isoDate, -((date.getDay() + 6) % 7));
}

/** 570 minutes → «09:30». */
export function formatMinutes(minutes: number): string {
  // The total is rounded first: 59.6 → «01:00» (rounding only the minutes gave «00:00»)
  const total = Math.round(minutes);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** 4_500_000 ms → «1 h 15 min». */
export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  return `${minutes >= 60 ? `${Math.floor(minutes / 60)} h ` : ''}${minutes % 60} min`;
}
