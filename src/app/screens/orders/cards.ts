/**
 * The live cards of Pedidos (pending payments, parcels to pack, invoices to send; painted by legado 073): the pressed card follows the
 * «Operativa» filter, the last 10 days with weekends and national holidays, and the figures that count up once. Migrated from the
 * legacy pkMarcar, pkFestivo, pkLibre, pkDia, pkContar and pkContarBase (v2.417.0); PK_TARJ stays in legacy (legado 073 reads it).
 */
import { orderCardsLegacy } from '../../legacy/orders2-bridge';
import { t } from '../../i18n';
import { alreadyCounted } from '../../components/list/counted';
import { escapeHtml, formatNumber } from '../../services/format';

/** National holidays (MM-DD); Good Friday is computed from Easter. */
const HOLIDAYS = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-06', '12-08', '12-25'];
const DAY_LETTERS = 'DLMXJVS', SUNDAY = 0, SATURDAY = 6, COUNT_MS = 900, EASING_POWER = 3, GOOD_FRIDAY = -2;

/** Marks the card of the «Operativa» filter chosen in the table. */
export function markChosenCard(): void {
  const filter = (document.getElementById('popf') as HTMLSelectElement | null)?.value ?? '';
  document.querySelectorAll<HTMLElement>('#operativa [data-pk]').forEach(card => {
    card.classList.toggle('on', card.dataset.pk === filter); card.setAttribute('aria-pressed', String(card.dataset.pk === filter));
  });
}

export function isHoliday(isoDate: string): boolean {
  return HOLIDAYS.includes(isoDate.slice(5)) || isoDate === orderCardsLegacy.isoPlus(orderCardsLegacy.easter(Number(isoDate.slice(0, 4))), GOOD_FRIDAY);
}

/** Weekend or holiday. */
export function isDayOff(isoDate: string): boolean {
  const weekday = new Date(`${isoDate}T12:00:00`).getDay();
  return weekday === SUNDAY || weekday === SATURDAY || isHoliday(isoDate);
}

/** One day of the strip under a card: its number and weekday letter, with the count in the title. */
export function dayHtml(isoDate: string, count: number, isToday: boolean): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const title = `${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}${isHoliday(isoDate) ? t('ordersMore.cards.holiday') : ''} · ${formatNumber(count)}`;
  return `<span class="${isDayOff(isoDate) ? 'fin' : ''} ${isToday ? 'u' : ''}" title="${escapeHtml(title)}"><b>${date.getDate()}</b>${DAY_LETTERS[date.getDay()] ?? ''}</span>`;
}

type Format = (value: number, element: HTMLElement) => string;

const prefersMotion = (): boolean => !matchMedia('(prefers-reduced-motion: reduce)').matches;

function animate(elements: readonly HTMLElement[], format: Format): void {
  const start = performance.now();
  const step = (now: number): void => {
    const progress = Math.min(1, (now - start) / COUNT_MS), eased = 1 - (1 - progress) ** EASING_POWER;
    elements.forEach(element => { if (element.isConnected) element.textContent = format(Number(element.dataset.v) * eased, element); });
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Counts each figure up to its data-v (straight to it if already counted with these values or without motion). */
export function countUp(elements: readonly HTMLElement[], format: Format): void {
  const show = (): void => { elements.forEach(element => { element.textContent = format(Number(element.dataset.v), element); }); };
  if (alreadyCounted(`pk${elements.length}`, elements.map(element => element.dataset.v ?? '')) || !prefersMotion()) { show(); return; }
  animate(elements, format);
}
