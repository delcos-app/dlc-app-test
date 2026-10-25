/** Indicator charts about activity: today's appointments, urgent accounts, the week, the month and units sold. */
import { appointments, commercialStates, isMobile } from '../../../legacy/bridge';
import { addDays, fromIsoDate, mondayOf, toIsoDate } from '../../../services/dates';
import { escapeHtml, formatNumber } from '../../../services/format';
import { weekdayName } from '../../../services/date-format';
import { nonZeroOr, range, sum } from '../../../services/values';
import { t } from '../../../i18n';
import { countsByDate, EMPTY_CHART, lineIcon, minutesOf, WEEKDAY_LETTERS, type ChartResult } from './chart-tools';

type Kpis = Readonly<Record<string, number>>;
type DayAppointment = NonNullable<HomePanel['agenda_hoy']>[number];

function dotKind(item: DayAppointment, next: DayAppointment | undefined): string {
  if (appointments.isOpen(item.estado)) return item === next ? 'sig' : '';
  return commercialStates.color(item.estado) === 'var(--warn)' ? 'no' : 'ok';
}

/** Today's appointments as dots (at most 5, 3 on mobile, the next one always visible) and «+N» with the rest. */
export function appointmentsChart(panel: HomePanel, kpis: Kpis): ChartResult {
  const list = (panel.agenda_hoy ?? []).filter(item => !appointments.isCancelled(item.estado));
  const open = list.filter(item => appointments.isOpen(item.estado));
  const now = new Date(), minutesNow = now.getHours() * 60 + now.getMinutes();
  const next = open.find(item => (minutesOf(item.hora) ?? 9999) >= minutesNow - 15) ?? open[0];
  const time = (item: DayAppointment, empty: string): string => escapeHtml(String(item.hora ?? '').slice(0, 5) || empty);
  const summary = next ? t('home.indicators.nextAppointment', { time: time(next, '—'), name: escapeHtml(next.nombre) })
    : t(list.length ? 'home.indicators.allClosed' : 'home.indicators.noAppointmentsToday');
  const visible = isMobile() ? 3 : 5;
  const nextIndex = next ? list.indexOf(next) : 0;
  const start = Math.max(0, Math.min(nextIndex - (visible >> 1), list.length - visible)), shown = list.slice(start, start + visible);
  const more = Math.max(0, nonZeroOr(kpis.citas_hoy, list.length) - shown.length);
  const dots = shown.map(item => `<span class="kvdot"><i class="${dotKind(item, next)}" title="${escapeHtml(item.nombre)}"></i><em>${time(item, '·')}</em></span>`).join('');
  return { summary, visual: list.length ? `<div class="kvdots">${dots}${more > 0 ? `<span class="kvdot"><em class="kvmas">+${more}</em></span>` : ''}</div>` : '' };
}

export function urgentChart(kpis: Kpis): ChartResult {
  if (kpis.urgentes) return { summary: t('home.indicators.urgentPending', { count: formatNumber(kpis.urgentes) }), visual: '<div class="kvradar" aria-hidden="true"><i></i><b></b><b></b></div>' };
  return { summary: t('home.indicators.noneUrgent'), visual: `<div class="kvcalma"><span>${lineIcon('<path d="M20 6 9 17l-5-5"/>')}</span>${t('home.indicators.allUpToDate')}</div>` };
}

interface Week { readonly upcoming: boolean; readonly days: readonly string[]; readonly values: readonly number[]; readonly perDay: Map<string, number> }

function weekSummary(week: Week, today: string): string {
  const { upcoming, days, values, perDay } = week;
  if (upcoming) {
    const busiest = values.indexOf(Math.max(...values));
    const day = days[busiest];
    return values[busiest] && day ? t('home.indicators.busiestDay', { weekday: weekdayName(day), count: values[busiest] ?? 0 }) : t('home.indicators.freeWeek');
  }
  const fourWeeks = sum(range(28).map(i => perDay.get(addDays(mondayOf(today), -28 + i)) ?? 0)) / 20;
  return t('home.indicators.fourWeekAverage', { average: String(fourWeeks.toFixed(1)).replace('.', ',') });
}

/** This week's visits (or the next 7 days' appointments) as day bars. */
export function weekChart(id: string, charts: HomeCharts, today: string): ChartResult {
  const upcoming = id === 'citas_7d';
  const days = range(7).map(i => (upcoming ? addDays(today, i) : addDays(mondayOf(today), i)));
  const perDay = countsByDate(charts.por_dia), nextDays = countsByDate(charts.proximos);
  const values = days.map(day => (upcoming ? nextDays.get(day) : perDay.get(day)) ?? 0);
  const max = Math.max(1, ...values), width = 196, barWidth = 18, gap = (width - 7 * barWidth) / 6;
  const bars = values.map((value, i) => {
    const day = days[i] ?? today, height = Math.max(3, value / max * 40), x = i * (barWidth + gap), future = !upcoming && day > today, isToday = day === today;
    const fill = future ? '#E3EBF3' : isToday ? 'var(--sky)' : 'var(--navy)';
    return `<rect x="${x}" y="${44 - height}" width="${barWidth}" height="${height}" rx="4" fill="${fill}" opacity="${value ? 1 : 0.35}"/><text x="${x + barWidth / 2}" y="58" text-anchor="middle" class="${isToday ? 'hoy' : ''}">${WEEKDAY_LETTERS[fromIsoDate(day).getDay()] ?? ''}</text>`;
  }).join('');
  return { summary: weekSummary({ upcoming, days, values, perDay }, today), visual: `<svg class="kvbar" viewBox="0 0 ${width} 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${bars}</svg>` };
}

/** Visits accumulated this month against the same days of last month (dashed). */
export function monthChart(charts: HomeCharts, today: string): ChartResult {
  const perDay = countsByDate(charts.por_dia), dayOfMonth = Number(today.slice(8, 10)), monthStart = `${today.slice(0, 8)}01`;
  const previous = fromIsoDate(monthStart); previous.setMonth(previous.getMonth() - 1);
  const accumulate = (from: string): number[] => { let total = 0; return range(dayOfMonth).map(i => { total += perDay.get(addDays(from, i)) ?? 0; return total; }); };
  const current = accumulate(monthStart), last = accumulate(toIsoDate(previous));
  if (dayOfMonth < 2) return EMPTY_CHART;
  const max = Math.max(1, ...last, ...current), width = 196, height = 46;
  const x = (i: number): number => i / (dayOfMonth - 1) * width, y = (value: number): number => height - value / max * height;
  const line = (values: readonly number[]): string => values.map((value, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(value).toFixed(1)}`).join('');
  const end = current[current.length - 1] ?? 0, difference = end - (last[last.length - 1] ?? 0);
  return {
    summary: t(difference >= 0 ? 'home.indicators.aboveLastMonth' : 'home.indicators.belowLastMonth', { difference }),
    visual: `<svg class="kvlin" viewBox="0 0 ${width} ${height + 12}" preserveAspectRatio="none" aria-hidden="true"><path d="${line(last)}" fill="none" stroke="#C9D7E6" stroke-width="2" stroke-dasharray="4 4"/>
        <path class="l" d="${line(current)}" pathLength="100" fill="none" stroke="var(--navy)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="0" y="${height + 11}">1</text><text x="${width}" y="${height + 11}" text-anchor="end" class="hoy">${t('home.indicators.today')}</text>
        <circle class="fin" cx="${x(dayOfMonth - 1)}" cy="${y(end)}" r="4" fill="var(--sky)" stroke="var(--navy)" stroke-width="1.5"/></svg>`,
  };
}

/** Units sold this month against the same day of last month. */
export function unitsChart(kpis: Kpis): ChartResult {
  const now = kpis.uds_mes ?? 0, before = kpis.uds_mes_ant ?? 0, max = Math.max(1, now, before), width = 196;
  return {
    summary: before ? t('home.indicators.unitsVersusLastMonth', { sign: now >= before ? '+' : '', percent: Math.round((now - before) / before * 100) }) : '',
    visual: `<svg class="kvbar" viewBox="0 0 ${width} 44" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="4" width="${before / max * width}" height="12" rx="4" fill="#DCE6F1"/><rect x="0" y="24" width="${Math.max(3, now / max * width)}" height="12" rx="4" fill="var(--navy)"/></svg>`,
  };
}
