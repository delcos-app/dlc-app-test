/**
 * The search of Cuentas (buscar_cuentas with the active filters, a page at a time). Only the last search counts: an earlier one
 * that answers later is discarded. If it fails (a phone back from the background, no coverage) it retries once before saying so.
 * Migrated from the legacy buscar / buscarBase (v2.405.0). buscar stays as an adapter (27 legacy files call it).
 */
import { accountListLegacy, legacyDb, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { paintChips, paintHeader, rowHtml } from './table';
import { paintMap } from '../map';

interface SearchResult { total: number; filas?: AccountListRow[] }

let lastSearch = 0;

/** An empty filter value means «no filter» (null for the database). */
const orNull = (value: string | null | undefined): string | null => (value ? value : null);

const loadingHtml = (text: string): string => `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(text)}</span></div>`;

function searchParams(): Record<string, unknown> {
  const filters = accountListLegacy.filters(), size = accountListLegacy.pageSize();
  return {
    q: filters.q || null, f_provincia: filters.prov || null, f_municipio: filters.muni || null,
    f_estado: filters.est || null, f_especialidad: filters.esp || null, f_area: null,
    f_urgentes: filters.urg, f_mios: Boolean(filters.mios), f_sin_visitar: Boolean(filters.sin), f_comercial: orNull(filters.com), f_reporting: orNull(filters.rep),
    ...(filters.tipo ? { f_tipo: filters.tipo } : {}),
    orden: filters.orden, lim: size, desplaz: filters.pagina * size,
    ...(Object.keys(filters.campos).length ? { f_campos: filters.campos } : {}),
  };
}

/** The «Tipo» quick filter follows the filters (also when changed from the panel or an indicator) and names professionals as the company does. */
function syncTypeFilter(): void {
  const select = document.getElementById('ftipo') as HTMLSelectElement | null; if (!select) return;
  const professionals = select.options[1]; if (professionals) professionals.text = term('medico', { number: 'p', capital: 'C' });
  const type = accountListLegacy.filters().tipo ?? '';
  if (select.value !== type) select.value = type;
}

function showFailure(list: HTMLElement, count: HTMLElement, error: unknown): void {
  count.textContent = '';
  const aborted = /abort/i.test((error as { message?: string } | null)?.message ?? '');
  list.innerHTML = `<div class="vacio">${t('accounts.list.couldNotLoad')}${aborted ? t('accounts.list.notResponding') : ''}.<br><button class="btn sec u-mt-10" type="button" id="dirreint">${t('accounts.list.retry')}</button></div>`;
  const retry = document.getElementById('dirreint'); if (retry) retry.onclick = (): void => { void searchAccounts(true); };
}

function showResult(data: SearchResult, list: HTMLElement, count: HTMLElement, elapsedMs: number): void {
  const filters = accountListLegacy.filters();
  filters.total = data.total;
  count.innerHTML = t('accounts.list.count', { count: formatNumber(data.total), contacts: escapeHtml(accountListLegacy.contactsLabel().toLowerCase()), ms: elapsedMs });
  paintChips();
  const rows = data.filas ?? [];
  if (!rows.length) { list.innerHTML = `<div class="vacio">${t('accounts.list.noMatches')}</div>`; const head = document.getElementById('thead'); if (head) head.innerHTML = ''; }
  else { paintHeader(); list.innerHTML = rows.map(row => rowHtml(row, () => { void searchAccounts(true); })).join(''); }
  accountListLegacy.paginate({
    element: document.getElementById('dirpag'), total: data.total, page: filters.pagina,
    onPage: page => { filters.pagina = page; void searchAccounts(false); document.getElementById('tabla')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
    onSize: () => { void searchAccounts(true); },
  });
}

/** buscar_cuentas, retried once at once if it fails; null when a newer search started meanwhile. */
async function searchWithRetry(mine: number): Promise<{ data: SearchResult | null; error: unknown } | null> {
  const params = searchParams();
  let answer = await legacyDb().rpc<SearchResult>('buscar_cuentas', params);
  if (mine !== lastSearch) return null;
  if (answer.error || !answer.data) {
    answer = await legacyDb().rpc<SearchResult>('buscar_cuentas', params);
    if (mine !== lastSearch) return null;
  }
  return answer;
}

/** Searches with the active filters (`reset`: back to the first page) and paints the result. */
export async function searchAccounts(reset = false): Promise<void> {
  syncTypeFilter();
  if (accountListLegacy.mapMode() && reset) setTimeout(() => { void paintMap(); }, 10);
  if (reset) accountListLegacy.filters().pagina = 0;
  const mine = ++lastSearch, list = document.getElementById('lista'), count = document.getElementById('cuenta');
  if (!list || !count) return;
  list.innerHTML = loadingHtml(t('accounts.list.searching', { contacts: accountListLegacy.contactsLabel().toLowerCase() }));
  count.textContent = t('accounts.list.searchingShort');
  const started = performance.now(), answer = await searchWithRetry(mine);
  if (!answer) return;   // there is a newer search
  if (answer.error || !answer.data) { showFailure(list, count, answer.error); return; }
  showResult(answer.data, list, count, Math.round(performance.now() - started));
}
