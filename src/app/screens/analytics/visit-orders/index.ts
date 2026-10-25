/**
 * «Pedidos tras la visita» at the top of Analítica → Resumen: the same data in four views with ‹ › (the view chosen is remembered
 * in localStorage delcos-tvvista). Migrated from the legacy tv* functions and the listener of legado 140 (v2.412.0); tvTarjeta stays
 * as an adapter (the legacy panel of indicators calls it with the data).
 */
import { t, type MessageKey } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { effect } from './effect';
import { funnel, types } from './funnel';
import { DEFAULT_DAYS, words, type VisitOrders } from './model';
import { months } from './months';

const STORAGE_KEY = 'delcos-tvvista';
const VIEWS: readonly { key: string; label: MessageKey; subtitle: MessageKey; paint: (data: VisitOrders) => string }[] = [
  { key: 'embudo', label: 'analytics.orders.viewFunnel', subtitle: 'analytics.orders.subtitleFunnel', paint: funnel },
  { key: 'efecto', label: 'analytics.orders.viewEffect', subtitle: 'analytics.orders.subtitleEffect', paint: effect },
  { key: 'meses', label: 'analytics.orders.viewMonths', subtitle: 'analytics.orders.subtitleMonths', paint: months },
  { key: 'tipos', label: 'analytics.orders.viewTypes', subtitle: 'analytics.orders.subtitleTypes', paint: types },
];

let shown: VisitOrders | null = null;
let viewIndex = 0;
try { viewIndex = Math.max(0, VIEWS.findIndex(view => view.key === localStorage.getItem(STORAGE_KEY))); } catch { /* the first view */ }

function paint(): void {
  const body = document.getElementById('tvcuerpo'), view = VIEWS[viewIndex];
  if (!body || !shown || !view) return;
  body.innerHTML = view.paint(shown);
  const subtitle = document.getElementById('tvsub');
  if (subtitle) subtitle.textContent = t(view.subtitle, { ...words(), from: formatShortDate(shown.desde), to: formatShortDate(shown.hasta), days: shown.dias ?? DEFAULT_DAYS });
  const position = document.getElementById('tvpos');
  if (position) position.textContent = t('analytics.orders.position', { number: viewIndex + 1, total: VIEWS.length, name: t(view.label) });
}

function cardHtml(days: number): string {
  const title = t('analytics.orders.title', words());
  const help = t('analytics.orders.help', { ...words(), days });
  return `<section class="card tvcard" id="tvvis"><div class="tvcab">
      <div class="tvtit"><h2>${title} <button type="button" class="ai" data-ayuda-tit="${title}" data-ayuda-txt="${escapeHtml(help)}" aria-label="${t('analytics.orders.whatIsIt')}">i</button></h2>
        <div class="sm" id="tvsub"></div></div>
      <div class="tvnav"><button type="button" class="btn sec chico" data-tvn="-1" aria-label="${t('analytics.orders.previousView')}">‹</button><span class="sm" id="tvpos"></span><button type="button" class="btn sec chico" data-tvn="1" aria-label="${t('analytics.orders.nextView')}">›</button></div>
    </div><div id="tvcuerpo"></div></section>`;
}

/** Puts the card at the top of the indicator areas (or removes it without data). */
export function showVisitOrders(data: VisitOrders | null): void {
  const box = document.getElementById('anareas'); if (!box) return;
  document.getElementById('tvvis')?.remove();
  shown = data;
  if (!data?.resumen) return;
  box.insertAdjacentHTML('afterbegin', cardHtml(data.dias ?? DEFAULT_DAYS));
  paint();
}

/** ‹ › of the card: the previous or next view, remembered. */
export function listenToVisitOrdersViews(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('#tvvis [data-tvn]'); if (!button) return;
    viewIndex = (viewIndex + Number(button.dataset.tvn) + VIEWS.length) % VIEWS.length;
    try { localStorage.setItem(STORAGE_KEY, VIEWS[viewIndex]?.key ?? ''); } catch { /* not remembered */ }
    paint();
  });
}
