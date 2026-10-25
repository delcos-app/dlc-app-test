/**
 * «El efecto» view of «Pedidos tras la visita»: units per visit and day, the days before and after it (7-day average), with the
 * day of the visit and the peak.
 */
import { isMobile } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatNumber } from '../../../services/format';
import { sum } from '../../../services/values';
import { DEFAULT_DAYS, words, type VisitOrders } from './model';

interface Point { k: number; v: number }
interface Frame { width: number; height: number; days: number; max: number }

const PAD = 22, SMOOTH = 3, HEADROOM = 1.2, MIN_MAX = 0.001;

/** The average of the 7 days around each one, without mixing before and after the visit. */
const smooth = (raw: readonly Point[]): Point[] => raw.map((point, index) => {
  const around = raw.slice(Math.max(0, index - SMOOTH), index + SMOOTH + 1).filter(other => (other.k < 0) === (point.k < 0));
  return { k: point.k, v: sum(around.map(other => other.v)) / around.length };
});

const average = (points: readonly Point[]): number => sum(points.map(point => point.v)) / (points.length || 1);
const decimals = (value: number): string => value.toLocaleString('es-ES', { maximumFractionDigits: value < 10 ? 2 : 1 });

function scale(frame: Frame): { x: (day: number) => number; y: (value: number) => number } {
  return {
    x: day => PAD + (day + frame.days) / (2 * frame.days) * (frame.width - 2 * PAD),
    y: value => frame.height - 24 - value / frame.max * (frame.height - 52),
  };
}

function chart(points: readonly Point[], frame: Frame): string {
  const { x, y } = scale(frame), { width, height, days } = frame, base = height - 24;
  const path = (list: readonly Point[]): string => list.map((point, index) => `${index ? 'L' : 'M'}${x(point.k).toFixed(1)} ${y(point.v).toFixed(1)}`).join(' ');
  const area = (list: readonly Point[], from: number, to: number): string => `${path(list)} L${x(to)} ${base} L${x(from)} ${base} Z`;
  const peak = points.filter(point => point.k >= 0).reduce((best, point) => (point.v > best.v ? point : best), { k: 0, v: -1 });
  const peakText = peak.k > 0 && peak.v > 0 ? `<text x="${Math.min(x(peak.k), width - 60)}" y="${Math.max(y(peak.v) - 8, 34)}" class="tvtxt tvtxtpico" text-anchor="middle">${t('analytics.orders.peak', { day: peak.k })}</text>` : '';
  const axis = [-days, -days / 2, 0, days / 2, days].map(day => `<text x="${x(day)}" y="${height - 6}" class="tvtxt tvtxteje" text-anchor="middle">${day > 0 ? '+' : ''}${Math.round(day)} d</text>`).join('');
  return `<svg class="tvsvg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${t('analytics.orders.effectLabel')}">
      <defs><linearGradient id="tvgrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="tvs1"/><stop offset="1" class="tvs2"/></linearGradient></defs>
      <path d="${area(points.filter(point => point.k <= 0), -days, 0)}" class="tvantes"/><path d="${area(points.filter(point => point.k >= 0), 0, days)}" fill="url(#tvgrad)"/>
      <path d="${path(points)}" class="tvlin"/>
      <line x1="${x(0)}" x2="${x(0)}" y1="14" y2="${base}" class="tvhoy"/>
      <text x="${x(0) + 6}" y="20" class="tvtxt tvtxthoy">${t('analytics.orders.visitDay', words())}</text>
      ${peakText}
      ${axis}
    </svg>`;
}

function headline(before: number, after: number, days: number): { big: string; label: string } {
  if (before > 0) {
    return { big: `${after >= before ? '+' : ''}${formatNumber(Math.round((after / before - 1) * 100))}<small> %</small>`,
      label: t(after >= before ? 'analytics.orders.moreUnits' : 'analytics.orders.fewerUnits', { ...words(), days }) };
  }
  return after > 0 ? { big: '—', label: t('analytics.orders.noOrdersBefore', words()) } : { big: '0', label: t('analytics.orders.noOrders') };
}

export function effect(data: VisitOrders): string {
  const result = data.efecto ?? {}, visits = result.visitas ?? 0, days = data.dias ?? DEFAULT_DAYS;
  if (!visits) return `<div class="vacio">${t('analytics.orders.noVisits', words())}</div>`;
  const raw = (result.dias ?? []).map(day => ({ k: day.k, v: (Number(day.u) || 0) / visits })), points = smooth(raw);
  const before = average(raw.filter(point => point.k < 0)), after = average(raw.filter(point => point.k >= 0));
  const mobile = isMobile(), frame: Frame = { width: mobile ? 360 : 640, height: mobile ? 170 : 200, days, max: Math.max(...points.map(point => point.v), MIN_MAX) * HEADROOM };
  const { big, label } = headline(before, after, days);
  return `<div class="tvgrid tvgb"><div class="tvizq"><div class="tvbig">${big}</div>
      <div class="tvlbl">${label}</div>
      <div class="tvrow"><div class="tvmini"><b>${decimals(before)}</b><span class="tvlbl">${t('analytics.orders.perDayBefore')}</span></div><div class="tvmini"><b>${decimals(after)}</b><span class="tvlbl">${t('analytics.orders.perDayAfter')}</span></div></div></div>
    <div>${chart(points, frame)}<div class="tvley"><span><i class="tvl1"></i>${t('analytics.orders.before')}</span><span><i class="tvl2"></i>${t('analytics.orders.after')}</span></div></div></div>`;
}
