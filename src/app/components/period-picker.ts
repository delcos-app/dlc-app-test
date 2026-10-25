/**
 * The period selector (legado 021, v2.424.0): a list of periods (this month, last month, …) or «Personalizado» with two dates,
 * remembered per person. `element.__rango()` gives { desde, hasta } (null = no limit). montarPeriodoBase stays as an adapter
 * (legado 113 wraps it as montarPeriodo).
 */
import { periodLegacy } from '../legacy/legado-a-bridge';
import { t } from '../i18n';

const CUSTOM = 'pers', ALL = 'todo', DEFAULT = 'mes';

export interface Range { desde: string | null; hasta: string | null }
export interface PeriodOptions { id?: string; valor?: string; alCambiar?: (range: Range) => void }

function storedChoice(key: string, fallback: string): string {
  try { const value = localStorage.getItem(key); return value ? value : fallback; } catch { return fallback; }
}

/** Paints the selector in `element` and returns the function that gives the chosen range. */
export function mountPeriod(element: HTMLElement, options: PeriodOptions): () => Range {
  const key = `dlc-per-${options.id ? options.id : element.id}-${periodLegacy.userId()}`;
  let chosen = storedChoice(key, options.valor ? options.valor : DEFAULT);
  element.innerHTML = `<label>${t('legacyA.period.label')}</label>
    <select data-per>${periodLegacy.periods().map(([value, label]) => `<option value="${value}" ${value === chosen ? 'selected' : ''}>${label}</option>`).join('')}</select>
    <div class="perpers ${chosen === CUSTOM ? '' : 'hide'}"><input type="date" data-pd aria-label="${t('legacyA.period.from')}"><span class="sm">${t('legacyA.period.to')}</span><input type="date" data-ph aria-label="${t('legacyA.period.until')}"></div>
    <div class="sm perrango"></div>`;
  const select = element.querySelector<HTMLSelectElement>('[data-per]'), from = element.querySelector<HTMLInputElement>('[data-pd]'), until = element.querySelector<HTMLInputElement>('[data-ph]');
  const range = (): Range => {
    if (chosen === CUSTOM) return { desde: from?.value ? from.value : null, hasta: until?.value ? until.value : null };
    const [start = null, end = null] = periodLegacy.rangeOf(chosen);
    return { desde: start, hasta: end };
  };
  Reflect.set(element, '__rango', range);   // legacy code reads el.__rango()
  const text = (): void => {
    const current = range(), label = element.querySelector('.perrango'); if (!label) return;
    label.textContent = chosen === CUSTOM || chosen === ALL ? '' : current.desde === current.hasta ? periodLegacy.shortDate(current.desde) : `${periodLegacy.shortDate(current.desde)} – ${periodLegacy.shortDate(current.hasta)}`;
  };
  if (select) select.onchange = (): void => {
    chosen = select.value; localStorage.setItem(key, chosen);
    element.querySelector('.perpers')?.classList.toggle('hide', chosen !== CUSTOM);
    if (chosen === CUSTOM && from && until && !from.value) { const [start, end] = periodLegacy.rangeOf(DEFAULT); from.value = start ?? ''; until.value = end ?? ''; }
    text(); options.alCambiar?.(range());
  };
  const changed = (): void => { text(); options.alCambiar?.(range()); };
  if (from) from.onchange = changed;
  if (until) until.onchange = changed;
  text();
  return range;
}
