/** Dates as «YYYY-MM-DD» in local time (Spain), the format the database and the screens use. */

export function toIsoDate(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function todayIso(): string {
  return toIsoDate(new Date());
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
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(Math.round(minutes) % 60).padStart(2, '0')}`;
}

/** 4_500_000 ms → «1 h 15 min». */
export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  return `${minutes >= 60 ? `${Math.floor(minutes / 60)} h ` : ''}${minutes % 60} min`;
}
