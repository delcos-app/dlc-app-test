/**
 * The listeners of the app frame (legado 001, v2.424.0): sign in, the user menu, the main menu, the Inicio cards, the directory
 * search, filters and chips, its list and the account card backdrop. Registered by legado 001 at its place in the load order.
 */
import { legacyDb } from '../../legacy/bridge';
import { shellLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { loadPlanUsage } from '../boot/startup';

const SEARCH_WAIT_MS = 300, NOT_CONFIRMED = /not confirmed/i, WRONG_CREDENTIALS = 'Invalid login credentials';
const byId = (id: string): HTMLElement | null => document.getElementById(id);
const valueOf = (id: string): string => (byId(id) as HTMLInputElement | null)?.value ?? '';

async function signIn(event: Event): Promise<void> {
  event.preventDefault();
  const button = (byId('lbtn') as HTMLButtonElement | null), message = byId('lmsg');
  if (!button || !message) return;
  button.disabled = true; button.textContent = t('legacyA.signIn.entering'); message.textContent = '';
  const { error } = await shellLegacy.signIn(valueOf('lu').trim(), valueOf('lp'));
  button.disabled = false; button.textContent = t('legacyA.signIn.enter');
  if (error) {
    if (NOT_CONFIRMED.test(error.message)) { shellLegacy.notActivated(t('legacyA.signIn.notActivated')); return; }
    message.textContent = error.message === WRONG_CREDENTIALS ? t('legacyA.signIn.wrong') : t('legacyA.signIn.failed', { error: error.message });
    return;
  }
  loadPlanUsage();
  shellLegacy.start();
}

async function userMenu(event: Event): Promise<void> {
  const button = (event.target as Element).closest<HTMLElement>('[data-u]'); if (!button) return;
  const action = button.dataset.u;
  if (action === 'salir') {
    await Promise.resolve(legacyDb().rpc('registrar_acceso', { p_evento: 'Salida', p_agente: navigator.userAgent })).catch(() => undefined);
    await shellLegacy.signOut(); location.reload();
  } else if (action === 'cfg') shellLegacy.goTo('config');
  else if (action === 'adm') shellLegacy.goTo('admin');
  // «pass» is handled by the password flows (legado 005)
}

/** Inicio: a saved filter, an indicator (opens the directory filtered) or an account. */
function homeClick(event: Event): void {
  const target = event.target as Element;
  const savedFilter = target.closest<HTMLElement>('[data-kf]');
  if (savedFilter) { shellLegacy.applySavedFilter(JSON.parse(savedFilter.dataset.kf ?? '{}') as object); return; }
  const indicator = target.closest<HTMLElement>('[data-k]');
  if (indicator) { openIndicator(indicator.dataset.k ?? ''); return; }
  const account = target.closest<HTMLElement>('[data-id]');
  if (account) shellLegacy.openAccount(account.dataset.id ?? '');
}

function openIndicator(key: string): void {
  if (key === 'cfgkpis') { shellLegacy.openIndicatorSettings(); return; }
  if (key === 'dups') { shellLegacy.goTo('duplicados'); return; }
  const filters = shellLegacy.filters();
  Object.assign(filters, { q: '', prov: '', muni: '', esp: '', est: '', urg: false, orden: 'nombre' });
  if (key === 'urgentes') { filters.urg = true; filters.orden = 'urgentes'; }
  if (key === 'interesados') filters.est = shellLegacy.stateFor('interes');
  if (key === 'sin_contactar') filters.est = shellLegacy.stateFor('inicial');
  const search = (byId('q') as HTMLInputElement | null), state = (byId('fest') as HTMLSelectElement | null);
  if (search) search.value = '';
  if (state) state.value = filters.est;
  shellLegacy.goTo('directorio'); shellLegacy.search();
}

/** The search box only filters on the directory: from another screen it waits for a result to be chosen. */
function searchInput(event: Event): void {
  shellLegacy.restartSearchTimer(() => {
    if (shellLegacy.screen() !== 'directorio') return;
    shellLegacy.filters().q = (event.target as HTMLInputElement).value.trim();
    shellLegacy.search();
  }, SEARCH_WAIT_MS);
}

function listenToFilters(): void {
  const on = (id: string, change: (value: string) => void): void => {
    byId(id)?.addEventListener('change', event => { change((event.target as HTMLSelectElement).value); shellLegacy.search(); });
  };
  const filters = shellLegacy.filters();
  on('fprov', value => { filters.prov = value; filters.muni = ''; shellLegacy.loadFilters(true); });
  on('fmuni', value => { filters.muni = value; });
  on('fesp', value => { filters.esp = value; });
  on('frep', value => { filters.rep = value; });
  on('fest', value => { filters.est = value; });
  on('forden', value => { filters.orden = value; });
}

/** A chip of the directory removes its filter. */
function chipClick(event: Event): void {
  const button = (event.target as Element).closest<HTMLElement>('[data-x]'); if (!button) return;
  const key = button.dataset.x ?? '', filters = shellLegacy.filters() as unknown as Record<string, unknown>;
  if (key === 'q') { filters.q = ''; const search = (byId('q') as HTMLInputElement | null); if (search) search.value = ''; }
  else if (key === 'urg') filters.urg = false;
  else if (key === 'mios' || key === 'sin') filters[key] = false;
  else {
    filters[key] = '';
    const select = (byId(`f${key}`) as HTMLSelectElement | null); if (select) select.value = '';
    if (key === 'prov') { filters.muni = ''; shellLegacy.loadFilters(true); }
  }
  shellLegacy.search();
}

/** Registers the listeners of the app frame (legado 001). */
export function startShell(): void {
  byId('lform')?.addEventListener('submit', event => { void signIn(event); });
  byId('ubtn')?.addEventListener('click', event => { event.stopPropagation(); byId('umenu')?.classList.toggle('hide'); });
  document.addEventListener('click', () => { byId('umenu')?.classList.add('hide'); });
  byId('umenu')?.addEventListener('click', event => { void userMenu(event); });
  byId('nav')?.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-t]');
    if (button && !button.disabled) shellLegacy.goTo(button.dataset.t ?? '');
  });
  byId('v-inicio')?.addEventListener('click', homeClick);
  byId('q')?.addEventListener('input', searchInput);
  listenToFilters();
  byId('chips')?.addEventListener('click', chipClick);
  byId('lista')?.addEventListener('click', event => {
    const account = (event.target as Element).closest<HTMLElement>('[data-id]');
    if (account) shellLegacy.openAccount(account.dataset.id ?? '');
  });
  const card = (byId('ficha') as HTMLDialogElement | null);
  card?.addEventListener('click', event => { if ((event.target as Element).id === 'ficha') card.close(); });
}
