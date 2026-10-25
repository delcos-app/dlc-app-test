/**
 * Inicio's alerts: each alert opens in a window that says what it means and what to do, with its cases as cards that can be opened
 * or hidden for 7 days, 30 days or for good. Folded from legado 037 and 040 (v2.424.0; the older window of legado 035 was always
 * replaced by this one and is gone).
 */
import { notices, term } from '../../legacy/bridge';
import { legacyBActions, legacyBState, rawDb, type RpcAnswer } from '../../legacy/legado-b-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';

const PAGE_SIZE = 10, SEARCH_FROM = 8;
type Explanation = readonly [RegExp, MessageKey, MessageKey];
const EXPLANATIONS: readonly Explanation[] = [
  [/sin comercial/i, 'legacyB.alerts.noSalespersonMeaning', 'legacyB.alerts.noSalespersonAction'],
  [/más de una cartera/i, 'legacyB.alerts.twoPortfoliosMeaning', 'legacyB.alerts.twoPortfoliosAction'],
  [/otra cartera|otro comercial/i, 'legacyB.alerts.otherPortfolioMeaning', 'legacyB.alerts.otherPortfolioAction'],
  [/dos personas|14 días/i, 'legacyB.alerts.twoPeopleMeaning', 'legacyB.alerts.twoPeopleAction'],
  [/sin médico|sin atribuir|atribuido/i, 'legacyB.alerts.unattributedMeaning', 'legacyB.alerts.unattributedAction'],
  [/stock|caduc/i, 'legacyB.alerts.stockMeaning', 'legacyB.alerts.stockAction'],
  [/compra|recepci/i, 'legacyB.alerts.purchaseMeaning', 'legacyB.alerts.purchaseAction'],
];
/** What each case's button opens: [label, data attribute of the case]. */
const ACTIONS: readonly (readonly [MessageKey, 'inificha' | 'iniped' | 'inistock' | 'inicomp'])[] = [
  ['legacyB.alerts.openCard', 'inificha'], ['legacyB.alerts.openOrder', 'iniped'], ['legacyB.alerts.seeStock', 'inistock'], ['legacyB.alerts.openPurchase', 'inicomp'],
];

const words = (): Record<string, string> => ({
  professional: term('medico'), professionals: term('medico', { number: 'p' }), ofTheProfessional: term('medico', { article: 'del' }),
  visits: term('visita', { number: 'p' }), theVisits: term('visita', { number: 'p', article: 'el' }),
});

function explain(title: string): [string, string] {
  const found = EXPLANATIONS.find(([pattern]) => pattern.test(title));
  return found ? [t(found[1], words()), t(found[2], words())] : [t('legacyB.alerts.defaultMeaning'), t('legacyB.alerts.defaultAction')];
}

/** The name, the first detail line and the amount shown in a case's card. */
function caseParts(item: HTMLElement): { name: string; detail: string; amount: string } {
  const name = ((item.querySelector('.tx b') ?? item.querySelector('b') ?? item).textContent ?? '').trim();
  const detail = [...item.querySelectorAll('.tx .sm, .sm')].map(element => (element.textContent ?? '').trim()).find(Boolean) ?? '';
  return { name, detail, amount: item.querySelector(':scope > b, .n, .cnt')?.textContent ?? '' };
}

function caseHtml(item: HTMLElement, title: string): string {
  const { name, detail, amount } = caseParts(item), action = ACTIONS.find(([, key]) => item.dataset[key]);
  return `<div class="alcard" data-clave="${escapeHtml(legacyBActions.alertKey(title, item))}" data-titulo="${escapeHtml(title)}"><div class="alc1"><b>${escapeHtml(name)}</b>${amount && amount !== name ? `<span class="pill p-per">${escapeHtml(amount)}</span>` : ''}</div>
        ${detail && detail !== name ? `<div class="sm">${escapeHtml(detail)}</div>` : ''}
        <div class="alacts">${action ? `<button class="btn sec chico" data-alacc="${action[1]}" data-id="${item.dataset[action[1]] ?? ''}">${t(action[0])}</button>` : ''}<button class="btn sec chico" data-aloc="menu">${t('legacyB.alerts.hide')}</button></div>
        <div class="alocmenu hide"><span class="sm">${t('legacyB.alerts.hideThis')}</span><button class="kcfg" data-aloc="7">${t('legacyB.alerts.days7')}</button><button class="kcfg" data-aloc="30">${t('legacyB.alerts.days30')}</button><button class="kcfg" data-aloc="siempre">${t('legacyB.alerts.forever')}</button></div></div>`;
}

function openCase(kind: string, id: string): void {
  const close = (): void => { (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); };
  if (kind === 'inificha') { close(); legacyBActions.openAccount(id); }
  if (kind === 'iniped') legacyBActions.openOrder(id);
  if (kind === 'inistock') { close(); legacyBState.setProductsSection('stock'); legacyBActions.goTo('productos'); }
  if (kind === 'inicomp') legacyBActions.openPurchase(id);
}

function paintCases(items: readonly HTMLElement[], title: string, page: number): void {
  const list = document.getElementById('allista'); if (!list) return;
  const query = ((document.getElementById('alq') as HTMLInputElement | null)?.value ?? '').trim().toLowerCase();
  const found = items.filter(item => !query || (item.textContent ?? '').toLowerCase().includes(query));
  list.innerHTML = found.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map(item => caseHtml(item, title)).join('') || `<div class="vacio">${t('legacyB.alerts.noMatches')}</div>`;
  list.querySelectorAll<HTMLElement>('[data-alacc]').forEach(button => { button.onclick = (): void => { openCase(button.dataset.alacc ?? '', button.dataset.id ?? ''); }; });
  legacyBActions.paginate(document.getElementById('alpag'), found.length, page, next => { paintCases(items, title, next); });
}

function openAlert(summary: HTMLElement): void {
  const details = summary.parentElement; if (!details) return;
  const items = [...details.querySelectorAll<HTMLElement>(':scope > div > .item, :scope .lista > .item')];
  const title = (summary.textContent ?? '').replace(/\s+/g, ' ').replace(/^\s*\d+\s*/, '').replace(/\bequipo\b\s*$/, '').trim();
  const [meaning, action] = explain(title), body = document.getElementById('dbody'); if (!body) return;
  items.forEach(item => { item.dataset.alclave = legacyBActions.alertKey(title, item); });
  body.innerHTML = `<div class="fh"><div><h2>${escapeHtml(title)}</h2><div class="sm">${items.length === 1 ? t('legacyB.alerts.oneCase') : t('legacyB.alerts.cases', { count: formatNumber(items.length) })}</div></div>
    <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="alinfo"><div><b>${t('legacyB.alerts.meaning')}</b><span>${escapeHtml(meaning)}</span></div><div><b>${t('legacyB.alerts.whatToDo')}</b><span>${escapeHtml(action)}</span></div></div>
    ${items.length > SEARCH_FROM ? `<input id="alq" type="search" placeholder="${t('legacyB.alerts.search')}" style="margin:10px 0 4px">` : ''}
    <div class="alcards" id="allista"></div><div id="alpag"></div>`;
  const search = document.getElementById('alq') as HTMLInputElement | null;
  if (search) search.oninput = (): void => { paintCases(items, title, 0); };
  paintCases(items, title, 0); (document.getElementById('dlg') as HTMLDialogElement | null)?.showModal();
}

async function hideCase(button: HTMLElement): Promise<void> {
  const card = button.closest<HTMLElement>('.alcard'); if (!card) return;
  if (button.dataset.aloc === 'menu') { card.querySelector('.alocmenu')?.classList.toggle('hide'); return; }
  const days = button.dataset.aloc === 'siempre' ? null : Number(button.dataset.aloc);
  const answer = await rawDb().rpc('descartar_alerta', { p_clave: card.dataset.clave, p_dias: days, p_titulo: card.dataset.titulo, p_detalle: card.querySelector('.alc1 b')?.textContent }) as RpcAnswer<unknown>;
  if (answer.error) { notices.toast(t('legacyB.alerts.couldNotHide'), true); return; }
  legacyBState.forgetHiddenAlerts();
  card.remove(); notices.toast(days ? t('legacyB.alerts.hiddenDays', { days }) : t('legacyB.alerts.hiddenForever'));
  legacyBActions.filterHomeAlerts();
}

/** v2.37.0: an alert of Inicio opens in its window. */
export function listenToAlertWindows(): void {
  document.addEventListener('click', event => {
    const summary = (event.target as Element).closest<HTMLElement>('#iniextra details.alerta2 > summary'); if (!summary) return;
    event.preventDefault(); event.stopImmediatePropagation();
    openAlert(summary);
  }, true);
}

/** v2.40.0: «Ocultar…» in the alert's window. */
export function listenToHideAlerts(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-aloc]');
    if (button) void hideCase(button);
  });
}
