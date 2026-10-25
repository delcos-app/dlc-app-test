/**
 * The account picker of the forms (a search like the top one): towns and centres open their list of accounts, and choosing one
 * changes the field for a card with ✕. What is typed without choosing is kept in element.__texto; element.__valor() returns the
 * chosen account. Migrated from the legacy selectorMedico and tarjetaMedico (v2.419.0); selectorMedico stays as an adapter.
 */
import { legacyDb, term } from '../../legacy/bridge';
import { closePickers, highlightSearch } from '../../components';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';

export interface PickerOptions { valor?: PickedAccount | null; alElegir?: (account: PickedAccount | null) => unknown; placeholder?: string }
interface FoundAccount extends PickedAccount { urgente?: boolean; especialidad?: string | null; municipio?: string | null; codigo?: string | null }
interface GlobalResults { municipios?: { valor: string; n: number }[]; centros?: { valor: string; municipio?: string | null; n: number }[]; medicos?: FoundAccount[] }

const LIST_LIMIT = 30, QUICK_LIMIT = 6, SEARCH_WAIT_MS = 250, MIN_SEARCH = 2;
const TYPED = '__texto';

const typed = (element: HTMLElement): string => (Reflect.get(element, TYPED) as string | undefined) ?? '';
const detailsOf = (account: FoundAccount): string => escapeHtml([account.especialidad, orFallback(account.centro_nombre, account.centro ?? ''), account.municipio].filter(Boolean).join(' · '));

const cardHtml = (account: FoundAccount): string => `<div class="selcard"><span class="ic">👤</span>
  <span class="tx"><b>${escapeHtml(account.nombre ?? '')}</b>
    <span class="sm">${detailsOf(account)}</span>
    ${account.codigo ? `<span class="sm">${t('accountsEditor.picker.code', { code: escapeHtml(account.codigo) })}</span>` : ''}</span>
  <button type="button" class="sx" aria-label="${t('accountsEditor.picker.remove')}">✕</button></div>`;

const accountButton = (account: FoundAccount, key: string, index: number, query?: string): string => `<button type="button" data-${key}="${index}"><span class="gic">${account.urgente ? '❗' : '👤'}</span>
          <span><b>${query ? highlightSearch(account.nombre ?? '', query) : escapeHtml(account.nombre)}</b><span class="sm">${detailsOf(account)}</span></span></button>`;

interface PickerContext { element: HTMLElement; box: HTMLElement; results: HTMLElement; input: HTMLInputElement; choose: (account: FoundAccount) => void; asked: number; timer?: ReturnType<typeof setTimeout> }

async function listAccounts(context: PickerContext, title: string, params: Record<string, unknown>): Promise<void> {
  const { box, results } = context, professionals = term('medico', { number: 'p' });
  box.classList.add('buscando');
  results.innerHTML = `<div class="gload"><span class="spin"></span>${t('accountsEditor.picker.searchingAccounts', { professionals })}</div>`; results.classList.remove('hide');
  const { data } = await legacyDb().rpc<{ total: number; filas?: FoundAccount[] }>('buscar_cuentas', { q: null, f_provincia: null, f_municipio: null, f_estado: null,
    f_especialidad: null, f_area: null, f_urgentes: false, f_mios: false, f_sin_visitar: false, orden: 'nombre', lim: LIST_LIMIT, desplaz: 0, ...params });
  box.classList.remove('buscando');
  const rows = data?.filas ?? [], total = data?.total ?? 0;
  results.innerHTML = `<button type="button" class="gback" data-back>${t('accountsEditor.picker.back')}</button>
        <div class="gsh">${escapeHtml(title)} · ${formatNumber(total)} ${professionals}${total > LIST_LIMIT ? t('accountsEditor.picker.shown', { count: LIST_LIMIT }) : ''}</div>`
    + (rows.map((account, index) => accountButton(account, 'pm', index)).join('') || `<div class="gload">${t('accountsEditor.picker.noAccounts', { professionals })}</div>`);
  const back = results.querySelector<HTMLElement>('[data-back]'); if (back) back.onclick = (): void => { searchText(context); };
  results.querySelectorAll<HTMLElement>('[data-pm]').forEach(button => { button.onclick = (): void => { const account = rows[Number(button.dataset.pm)]; if (account) context.choose(account); }; });
}

function quickHtml(found: GlobalResults, query: string): string {
  const professionals = term('medico', { number: 'p' }), towns = found.municipios ?? [], centres = found.centros ?? [], accounts = found.medicos ?? [];
  return (towns.length ? `<div class="gsh">${t('accountsEditor.picker.towns')}</div>` + towns.map((item, index) => `<button type="button" data-pmu="${index}"><span class="gic">📍</span>
            <span><b>${highlightSearch(item.valor, query)}</b><span class="sm">${t('accountsEditor.picker.seeList', { count: formatNumber(item.n), professionals })}</span></span></button>`).join('') : '')
    + (centres.length ? `<div class="gsh">${t('accountsEditor.picker.centres')}</div>` + centres.map((item, index) => `<button type="button" data-pce="${index}"><span class="gic">🏥</span>
            <span><b>${highlightSearch(item.valor, query)}</b><span class="sm">${escapeHtml(item.municipio ?? '')} · ${t('accountsEditor.picker.seeList', { count: formatNumber(item.n), professionals })}</span></span></button>`).join('') : '')
    + (accounts.length ? `<div class="gsh">${term('medico', { number: 'p', capital: 'C' })}</div>` + accounts.map((item, index) => accountButton(item, 'pme', index, query)).join('') : '');
}

function bindQuick(context: PickerContext, found: GlobalResults): void {
  const { results } = context, towns = found.municipios ?? [], centres = found.centros ?? [], accounts = found.medicos ?? [];
  const each = (key: string, action: (index: number) => void): void => { results.querySelectorAll<HTMLElement>(`[data-${key}]`).forEach(button => { button.onclick = (): void => { action(Number(button.dataset[key])); }; }); };
  each('pmu', index => { const town = towns[index]; if (town) void listAccounts(context, town.valor, { f_municipio: town.valor }); });
  each('pce', index => { const centre = centres[index]; if (centre) void listAccounts(context, centre.valor, { q: centre.valor }); });
  each('pme', index => { const account = accounts[index]; if (account) context.choose(account); });
}

async function runSearch(context: PickerContext, query: string, mine: number): Promise<void> {
  const { data } = await legacyDb().rpc<GlobalResults>('buscar_global', { q: query, lim: QUICK_LIMIT });
  if (mine !== context.asked) return;
  context.box.classList.remove('buscando');
  if (!data) { context.results.innerHTML = `<div class="gload">${t('accountsEditor.picker.couldNotSearch')}</div>`; return; }
  const html = quickHtml(data, query);
  context.results.innerHTML = html || `<div class="gload">${t('accountsEditor.picker.noResults', { query: escapeHtml(query) })}</div>`;
  if (html) bindQuick(context, data);
}

function searchText(context: PickerContext): void {
  const { input, box, results, element } = context, query = input.value.trim();
  Reflect.set(element, TYPED, input.value);
  clearTimeout(context.timer);
  if (query.length < MIN_SEARCH) { results.classList.add('hide'); box.classList.remove('buscando'); return; }
  box.classList.add('buscando');
  results.innerHTML = `<div class="gload"><span class="spin"></span>${t('accountsEditor.picker.searching')}</div>`; results.classList.remove('hide');
  const mine = ++context.asked;
  context.timer = setTimeout(() => { void runSearch(context, query, mine); }, SEARCH_WAIT_MS);
}

/** Paints in `element` the account picker (or the chosen account's card). */
export function pickAccount(element: HTMLElement, options: PickerOptions): void {
  let chosen: PickedAccount | null = options.valor ?? null;
  const paint = (): void => {
    if (chosen) {
      element.innerHTML = cardHtml(chosen);
      const remove = element.querySelector<HTMLElement>('.sx');
      if (remove) remove.onclick = (): void => { chosen = null; Reflect.set(element, TYPED, ''); paint(); void options.alElegir?.(null); setTimeout(() => { element.querySelector('input')?.focus(); }, 0); };
      return;
    }
    element.innerHTML = `<div class="picker"><input type="search" autocomplete="off" placeholder="${escapeHtml(options.placeholder ?? t('accountsEditor.picker.placeholder'))}" value="${escapeHtml(typed(element))}">
      <div class="gsug hide"></div></div>`;
    const box = element.querySelector<HTMLElement>('.picker'), input = box?.querySelector('input'), results = box?.querySelector<HTMLElement>('.gsug');
    if (!box || !input || !results) return;
    const context: PickerContext = { element, box, results, input, asked: 0, choose: account => { chosen = account; Reflect.set(element, TYPED, ''); paint(); void options.alElegir?.(account); } };
    input.oninput = (): void => { searchText(context); };
    input.onfocus = (): void => { if (input.value.trim().length >= MIN_SEARCH && results.innerHTML) { closePickers(box); results.classList.remove('hide'); } };
    input.onkeydown = (event): void => { if (event.key === 'Escape') { results.classList.add('hide'); event.stopPropagation(); } };
  };
  paint();
  Reflect.set(element, '__valor', () => chosen);
}
