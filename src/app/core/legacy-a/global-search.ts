/**
 * The global search at the top, grouped in municipalities, centres and professionals, and the download menus (legado 013,
 * v2.424.0). Registered by legado 013 at its place in the load order.
 */
import { legacyDb, term } from '../../legacy/bridge';
import { globalSearchLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';

const MIN_LETTERS = 2, WAIT_MS = 250, LIMIT = 6;
const DOWNLOADERS: Readonly<Record<string, string>> = { seg: '__dlSeg', an: '__dlAn', dir: '__dlDir' };

interface Place { valor: string; n: number; id?: string | null; municipio?: string | null }
interface Person { id: string; nombre: string; urgente?: boolean; especialidad?: string | null; centro_nombre?: string | null; municipio?: string | null }
interface Found { municipios?: Place[]; centros?: Place[]; medicos?: Person[] }

let timer: ReturnType<typeof setTimeout> | undefined, asked = 0;
const box = (): HTMLElement | null => document.getElementById('gsug');
const hideMenus = (keep?: string): void => { document.querySelectorAll('.dl-menu').forEach(menu => { if (menu.id !== keep) menu.classList.add('hide'); }); };

/** A download option runs its screen's download; a download button opens its menu. */
function downloadClick(event: Event): void {
  const target = event.target as Element, option = target.closest<HTMLElement>('[data-dlo]');
  if (option) {
    const [id = '', format = ''] = (option.dataset.dlo ?? '').split('|');
    hideMenus();
    const download = (window as unknown as Record<string, ((format: string) => void) | undefined>)[DOWNLOADERS[id] ?? ''];
    if (download) download(format);
    return;
  }
  const button = target.closest<HTMLElement>('[data-dl]');
  hideMenus(button ? `dlm-${button.dataset.dl ?? ''}` : undefined);
  if (button) document.getElementById(`dlm-${button.dataset.dl ?? ''}`)?.classList.toggle('hide');
}

function resultsHtml(found: Found, query: string): string {
  const places = found.municipios ?? [], centres = found.centros ?? [], people = found.medicos ?? [];
  const professionals = term('medico', { number: 'p' }), mark = (text: string): string => globalSearchLegacy.highlight(text, query);
  const placesHtml = places.length ? `<div class="gsh">${t('legacyA.search.municipalities')}</div>${places.map(place => `<button data-gm="${escapeHtml(place.valor)}">
        <span class="gic">📍</span><span><b>${mark(place.valor)}</b><span class="sm">${formatNumber(place.n)} ${professionals}</span></span></button>`).join('')}` : '';
  const centresHtml = centres.length ? `<div class="gsh">${t('legacyA.search.centres')}</div>${centres.map(centre => `<button data-gc="${escapeHtml(centre.valor)}"${centre.id ? ` data-gcid="${centre.id}"` : ''}>
        <span class="gic">🏥</span><span><b>${mark(centre.valor)}</b><span class="sm">${escapeHtml(centre.municipio ?? '')} · ${formatNumber(centre.n)} ${professionals}</span></span></button>`).join('')}` : '';
  const peopleTitle = term('medico', { number: 'p', capital: 'C' }) + (places.length || centres.length ? t('legacyA.search.attendThere') : '');
  const peopleHtml = people.length ? `<div class="gsh">${peopleTitle}</div>${people.map(person => `<button data-gme="${person.id}">
        <span class="gic">${person.urgente ? '❗' : '👤'}</span><span><b>${mark(person.nombre)}</b>
        <span class="sm">${escapeHtml(person.especialidad ?? '')} · ${escapeHtml(person.centro_nombre ?? '')} ${escapeHtml(person.municipio ?? '')}</span></span></button>`).join('')}` : '';
  return placesHtml + centresHtml + peopleHtml;
}

async function search(query: string, wrapper: Element | null, request: number): Promise<void> {
  const { data } = await legacyDb().rpc<Found>('buscar_global', { q: query, lim: LIMIT });
  const results = box();
  if (request !== asked || !results) return;   // there is a newer search already
  wrapper?.classList.remove('buscando');
  if (!data) { results.innerHTML = `<div class="gload">${t('legacyA.search.couldNot')}</div>`; return; }
  if (!(data.municipios ?? []).length && !(data.centros ?? []).length && !(data.medicos ?? []).length) {
    results.innerHTML = `<div class="gload">${t('legacyA.search.noResults', { query: escapeHtml(query) })}</div>`; return;
  }
  results.innerHTML = resultsHtml(data, query);
  results.classList.remove('hide');
}

function searchInput(event: Event): void {
  clearTimeout(timer);
  const input = event.target as HTMLInputElement, query = input.value.trim(), wrapper = input.closest('.gsearch'), results = box();
  if (!results) return;
  if (query.length < MIN_LETTERS) { results.classList.add('hide'); wrapper?.classList.remove('buscando'); return; }
  wrapper?.classList.add('buscando');
  results.innerHTML = `<div class="gload"><span class="spin"></span>${t('legacyA.search.searching')}</div>`;
  results.classList.remove('hide');
  const request = ++asked;
  timer = setTimeout(() => { void search(query, wrapper, request); }, WAIT_MS);
}

const clearSearch = (): void => { box()?.classList.add('hide'); const input = document.getElementById('q') as HTMLInputElement | null; if (input) input.value = ''; };

/** A municipality or a centre filters the directory. */
function filterBy(place: HTMLElement | null, centre: HTMLElement | null): void {
  const filters = globalSearchLegacy.filters();
  Object.assign(filters, { q: '', prov: '', muni: '', esp: '', est: '', urg: false, pagina: 0 });
  if (place) { filters.muni = place.dataset.gm ?? ''; const select = document.getElementById('fmuni') as HTMLSelectElement | null; if (select) select.value = filters.muni; }
  if (centre) filters.q = centre.dataset.gc ?? '';
  clearSearch();
  globalSearchLegacy.goTo('directorio'); globalSearchLegacy.search();
}

/** Choosing a municipality or a centre filters the directory; choosing a professional opens their card. */
function resultClick(event: Event): void {
  const target = event.target as Element;
  if (!target.closest('.gsearch')) box()?.classList.add('hide');
  const place = target.closest<HTMLElement>('[data-gm]'), centre = target.closest<HTMLElement>('[data-gc]'), person = target.closest<HTMLElement>('[data-gme]');
  if (place || centre) filterBy(place, centre);
  if (person) { clearSearch(); globalSearchLegacy.openAccount(person.dataset.gme ?? ''); }
}

/** Registers the download menus and the global search (legado 013). */
export function startGlobalSearch(): void {
  document.addEventListener('click', downloadClick);
  document.getElementById('q')?.addEventListener('input', searchInput);
  document.addEventListener('click', resultClick);
}
