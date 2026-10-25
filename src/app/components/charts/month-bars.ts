/**
 * Monthly chart of Analítica: one series in bars, or two small charts one over the other with the same months (bars above, line
 * below), each with its own scale and title. Migrated from svgBarras in componentes/graficos.js (v2.416.0).
 */
import { componentsLegacy } from '../../legacy/components-bridge';
import { isMobile } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { nonZeroOr } from '../../services/values';
import { monthLabel } from './labels';

const PAD = 34, MIN_WIDTH = 420, MAX_WIDTH = 1400, DEFAULT_WIDTH = 700, BOX_MARGIN = 40, MANY_MONTHS = 6;
const SINGLE_HEIGHT = 230, BARS_HEIGHT = 150, LINE_HEIGHT = 170;

interface Frame { width: number; count: number; months: readonly string[]; skip: boolean }

const isEuros = (label: string): boolean => /importe|euros|€/i.test(label || '');
const valueText = (value: number, label: string): string => (isEuros(label) ? componentsLegacy.euros(value) : formatNumber(value));
const xOf = (frame: Frame, index: number): number => PAD + (frame.width - PAD * 2) * (index + 0.5) / frame.count;
/** On the phone, with more than six months, one label every other month (they overlapped). */
const showsLabel = (frame: Frame, index: number): boolean => !frame.skip || (frame.count - 1 - index) % 2 === 0;
const ariaLabel = (label: string): string => t('components.charts.perMonth', { label: escapeHtml(label) });

function bars(frame: Frame, series: readonly number[], label: string, options: { height: number; withMonths: boolean }): string {
  const { height, withMonths } = options, max = Math.max(1, ...series), base = height - (withMonths ? 26 : 10);
  const yOf = (value: number): number => base - (base - 22) * value / max, barWidth = Math.max(6, (frame.width - PAD * 2) / frame.count * 0.62);
  const unit = isEuros(label) ? '' : escapeHtml(label.toLowerCase());
  return `<svg viewBox="0 0 ${frame.width} ${height}" class="grafico" role="img" aria-label="${ariaLabel(label)}">
      <line x1="${PAD}" y1="${base}" x2="${frame.width - PAD}" y2="${base}" class="eje"/>
      ${series.map((value, index) => `<g><rect x="${xOf(frame, index) - barWidth / 2}" y="${yOf(value)}" width="${barWidth}" height="${base - yOf(value)}" rx="4" class="barra1"><title>${monthLabel(frame.months[index] ?? '')}: ${valueText(value, label)} ${unit}</title></rect>
        ${value ? `<text x="${xOf(frame, index)}" y="${yOf(value) - 5}" class="val">${valueText(value, label)}</text>` : ''}
        ${withMonths && showsLabel(frame, index) ? `<text x="${xOf(frame, index)}" y="${height - 8}" class="lab">${monthLabel(frame.months[index] ?? '')}</text>` : ''}</g>`).join('')}
    </svg>`;
}

/** The line chart labels only the maximum and the last month with data. */
function line(frame: Frame, series: readonly number[], label: string, height: number): string {
  const max = Math.max(1, ...series), base = height - 26, yOf = (value: number): number => base - (base - 22) * value / max;
  const last = series.reduce((found, value, index) => (value ? index : found), -1), highest = series.indexOf(Math.max(...series));
  return `<svg viewBox="0 0 ${frame.width} ${height}" class="grafico" role="img" aria-label="${ariaLabel(label)}">
      <line x1="${PAD}" y1="${base}" x2="${frame.width - PAD}" y2="${base}" class="eje"/>
      <polyline points="${series.map((value, index) => `${xOf(frame, index)},${yOf(value)}`).join(' ')}" class="linea2"/>
      ${series.map((value, index) => `<circle cx="${xOf(frame, index)}" cy="${yOf(value)}" r="4" class="punto2"><title>${monthLabel(frame.months[index] ?? '')}: ${valueText(value, label)}</title></circle>
        ${value && (index === highest || index === last) ? `<text x="${xOf(frame, index)}" y="${yOf(value) - 9}" class="val">${valueText(value, label)}</text>` : ''}
        ${showsLabel(frame, index) ? `<text x="${xOf(frame, index)}" y="${height - 8}" class="lab">${monthLabel(frame.months[index] ?? '')}</text>` : ''}`).join('')}
    </svg>`;
}

/** `months` («2026-10»…) with series `first` and, optionally, `second`; `labels` are their titles. */
export function monthBars(months: readonly string[], first: readonly number[], second: readonly number[] | null | undefined, labels: readonly string[]): string {
  const box = document.getElementById('angraf'), count = months.length || 1;
  const frame: Frame = { width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, nonZeroOr(box?.clientWidth, DEFAULT_WIDTH) - BOX_MARGIN)), count, months, skip: isMobile() && count > MANY_MONTHS };
  const [firstLabel = '', secondLabel = ''] = labels;
  if (!second) return bars(frame, first, firstLabel, { height: SINGLE_HEIGHT, withMonths: true });
  return `<div class="grafdos">
    <div class="grafuno"><div class="graftit"><i class="c1"></i>${escapeHtml(firstLabel)}</div>${bars(frame, first, firstLabel, { height: BARS_HEIGHT, withMonths: false })}</div>
    <div class="grafuno"><div class="graftit"><i class="c2"></i>${escapeHtml(secondLabel)}</div>${line(frame, second, secondLabel, LINE_HEIGHT)}</div>
  </div>`;
}
