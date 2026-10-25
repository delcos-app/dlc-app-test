/** Home screen view: the skeleton while loading, the mosaic, its buttons and the figures that count up. */
import { goTo, permissions } from '../../legacy/bridge';
import { alreadyCounted } from '../../components/list/counted';
import { t } from '../../i18n';
import { formatEuros, formatNumber } from '../../services/format';
import { attentionItems } from './attention';
import { attentionTile, collectionsTile, cycleTile, portfolioTile, salesTile, stockTile, todayTile, upcomingTile } from './tiles';
import type { HomeData } from './types';

const SKELETON_WIDTHS = [64, 82, 56, 74, 60];
const COUNT_DURATION_MS = 900;

function screen(): HTMLElement | null {
  return document.getElementById('v-inicio');
}

/** The mosaic container and the «Ver tus indicadores» button, created once under the greeting. */
function mosaicBox(section: HTMLElement): HTMLElement | null {
  const existing = document.getElementById('inimos');
  if (existing) return existing;
  const greeting = section.querySelector(':scope > .saludo');
  if (!greeting) return null;
  greeting.insertAdjacentHTML('afterend', `<div id="inimos" class="inimos"></div><div class="inikpisb"><button type="button" class="btn sec" id="inikpisver">${t('home.showIndicators')}</button></div>`);
  const toggle = document.getElementById('inikpisver');
  if (toggle) {
    toggle.onclick = () => {
      const shown = !section.classList.contains('conkpis');
      section.classList.toggle('conkpis', shown);
      toggle.textContent = t(shown ? 'home.hideIndicators' : 'home.showIndicators');
    };
  }
  return document.getElementById('inimos');
}

function skeletonTile(className: string, lines: number): string {
  const rows = [...Array(lines).keys()].map(i => `<i class="plsk" style="width:${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length] ?? 60}%"></i>`).join('');
  return `<div class="mt ${className} mtsk"><i class="plsk" style="width:38%"></i>${rows}</div>`;
}

/** Placeholder tiles with the final layout, so nothing jumps when the data arrives. */
export function renderSkeleton(): void {
  if (permissions.isProfessionalPortal()) return;
  const section = screen();
  if (!section?.querySelector(':scope > .saludo')) return;
  section.classList.add('conmos');
  const box = mosaicBox(section);
  if (!box || box.children.length) return;
  box.innerHTML = skeletonTile('mtat', 6) + skeletonTile('mthoy', 4) + skeletonTile('', 2) + skeletonTile('', 2) + skeletonTile('mtprox', 3);
}

function countUp(box: HTMLElement): void {
  const figures = [...box.querySelectorAll<HTMLElement>('[data-mcnt], [data-meur]')];
  if (alreadyCounted('mos', figures.map(el => el.dataset.mcnt ?? el.dataset.meur ?? ''))) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = performance.now();
  const step = (now: number): void => {
    const progress = Math.min(1, (now - start) / COUNT_DURATION_MS), eased = 1 - Math.pow(1 - progress, 3);
    figures.forEach(el => {
      const euros = el.dataset.meur;
      el.textContent = euros === undefined ? formatNumber(Math.round(Number(el.dataset.mcnt) * eased)) : formatEuros(Number(euros) * eased);
    });
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Paints the whole mosaic at once and wires its buttons. */
export function renderMosaic(data: HomeData): void {
  const section = screen();
  if (!section) return;
  const items = attentionItems(data);
  const html = [attentionTile(items), salesTile(data), todayTile(data), collectionsTile(data), cycleTile(data), stockTile(data),
    portfolioTile(data), upcomingTile(data)].join('');
  const box = mosaicBox(section);
  if (!box) return;
  box.innerHTML = html;
  box.querySelectorAll<HTMLElement>('[data-mat]').forEach(button => {
    button.onclick = () => { items[Number(button.dataset.mat)]?.open(); };
  });
  const plan = box.querySelector<HTMLElement>('[data-mplan]');
  if (plan) plan.onclick = () => { goTo('agenda'); };
  section.classList.add('conmos');
  countUp(box);
}
