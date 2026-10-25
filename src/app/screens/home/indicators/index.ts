/**
 * Indicators of Inicio (the cards behind «Ver tus indicadores»). Migrated from the legacy inicioIndicadores + kpisVivos +
 * indicadoresCompletos (v2.389.0): the cards are painted complete in one go instead of being transformed twice after painting.
 */
import { addHelpButtons, cachedRpc, currentScreen, homeCache, indicatorCatalog, showCacheNotice, timingMark } from '../../../legacy/bridge';
import { alreadyCounted } from '../../../components/list/counted';
import { formatNumber } from '../../../services/format';
import { t } from '../../../i18n';
import { filterCard, indicatorCard, type CardContext } from './cards';
import { countFilter } from '../../accounts/filters/saved';

const COUNT_DURATION_MS = 900;

function countUp(container: HTMLElement): void {
  const figures = [...container.querySelectorAll<HTMLElement>('[data-kvn]')];
  const finalValue = (el: HTMLElement): number => Number(el.dataset.kvn);
  const showFinal = (): void => { figures.forEach(el => { el.textContent = formatNumber(finalValue(el)); }); };
  if (alreadyCounted('kv', figures.map(el => el.dataset.kvn ?? '')) || matchMedia('(prefers-reduced-motion: reduce)').matches) { showFinal(); return; }
  const start = performance.now();
  const step = (now: number): void => {
    const progress = Math.min(1, (now - start) / COUNT_DURATION_MS), eased = 1 - Math.pow(1 - progress, 3);
    figures.forEach(el => { if (el.isConnected) el.textContent = formatNumber(Math.round(finalValue(el) * eased)); });
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function render(container: HTMLElement, settings: readonly KpiSetting[], kpis: Readonly<Record<string, number>>): boolean {
  const definitions = indicatorCatalog.definitions();
  const allowed = settings.map(setting => ({ setting, definition: definitions.find(item => item.id === setting.id) }));
  const panel = homeCache.panel();
  // The cards become «live» (with their chart) when the panel data is there and there is at least one catalog card
  const live = Boolean(panel) && allowed.some(({ setting, definition }) => !setting.filtro && indicatorCatalog.allowed(definition));
  const context: CardContext = { kpis, panel: live ? panel : null, charts: homeCache.charts() };
  container.innerHTML = allowed.map(({ setting, definition }, index) => {
    if (setting.filtro) return filterCard(setting, index, live);
    if (!definition || !indicatorCatalog.allowed(definition)) return '';
    return indicatorCard(definition, setting, context);
  }).join('');
  if (live) container.classList.add('kvivo');
  return live;
}

function countSavedFilters(settings: readonly KpiSetting[]): void {
  settings.forEach((setting, index) => {
    if (!setting.filtro) return;
    countFilter(setting.filtro).then(count => {
      const figure = document.querySelector(`#kpis [data-kfi="${index}"] .cont`);
      if (figure) figure.textContent = formatNumber(count);
    }).catch(() => undefined);
  });
}

export interface PanelResult { readonly data: HomePanel | null; readonly cache?: boolean; readonly fecha?: string }

/** Paints the indicators from an already received panel_inicio (the professional portal reuses it). */
export function paintIndicators(result: PanelResult): void {
  const container = document.getElementById('kpis');
  if (!container) return;
  if (!result.data) { container.innerHTML = `<div class="vacio">${t('home.indicators.offline')}</div>`; return; }
  const settings = indicatorCatalog.settings().filter(setting => setting.on);
  const live = render(container, settings, result.data.kpis ?? {});
  if (result.cache) showCacheNotice(container, result.fecha);
  countSavedFilters(settings);
  addHelpButtons();
  if (live) countUp(container);
}

/** Loads and paints the indicators (from the offline copy when there is no connection). */
export async function loadIndicators(): Promise<void> {
  const result = await cachedRpc<HomePanel>('panel_inicio', { lim: 6 }, 'inicio');
  timingMark('datos de Inicio recibidos');
  if (currentScreen() !== 'inicio') return;
  paintIndicators(result);
  if (result.data) timingMark('Inicio completo');
}
